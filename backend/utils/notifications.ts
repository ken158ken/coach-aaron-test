/**
 * 通用通知工具
 * @module utils/notifications
 *
 * 一個入口 createNotification(...) 同時做三件事：
 *   1. 寫入 DB notifications 表（持久化、可查歷史）
 *   2. Supabase Realtime broadcast 到 channel `user-{userId}` 事件 'new_notification'
 *      → 用戶當下的瀏覽器 / app 即時收到（in-app 鈴鐺 / toast）
 *   3. 若用戶有 push_subscriptions，依 provider 分流推播：
 *        - 'web' → web-push（VAPID）給瀏覽器
 *        - 'fcm' → Firebase Admin SDK 給 Android app
 *      → 兩條路同時跑，瀏覽器關掉 / app 在背景都能跳系統通知
 *
 * 任一階段失敗都不會阻擋其他階段，logger.warn 後繼續。
 */

import admin from "firebase-admin";
import webpush from "web-push";
import { supabaseAdmin } from "../config/supabase.js";
import { logger } from "./logger.js";

export type NotificationType =
  | "chat_message"
  | "chat_added_to_group"
  | "chat_removed_from_group"
  | "booking_pending"
  | "booking_approved"
  | "booking_rejected"
  | "booking_cancelled";

interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  iconUrl?: string;
  metadata?: Record<string, unknown>;
}

// ======================================================
// Web Push（VAPID）初始化
// ======================================================
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:noreply@coach-aaron.local";

let webPushReady = false;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    webPushReady = true;
  } catch (err) {
    logger.warn("VAPID 初始化失敗（web push 將停用）", {
      error: (err as Error)?.message,
    });
  }
}

// ======================================================
// FCM（Firebase Admin SDK）初始化
// ======================================================
const FCM_SA_RAW = process.env.FCM_SERVICE_ACCOUNT_JSON || "";
let fcmReady = false;
if (FCM_SA_RAW) {
  try {
    const sa = JSON.parse(FCM_SA_RAW) as admin.ServiceAccount;
    if (admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    }
    fcmReady = true;
  } catch (err) {
    logger.warn("FCM 初始化失敗（FCM 推播將停用）", {
      error: (err as Error)?.message,
    });
  }
}

/** 至少有一條推播管道可用就回 true（給前端 status 用） */
export function isPushReady(): boolean {
  return webPushReady || fcmReady;
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC;
}

export function isWebPushReady(): boolean {
  return webPushReady;
}

export function isFcmReady(): boolean {
  return fcmReady;
}

// ======================================================
// 主要 API
// ======================================================

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  const {
    userId,
    type,
    title,
    body = "",
    link,
    iconUrl,
    metadata,
  } = input;

  // 1. 寫 DB
  let notifRow: { id: number } | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        body,
        link: link || null,
        icon_url: iconUrl || null,
        metadata: metadata || null,
      })
      .select("id, user_id, type, title, body, link, icon_url, metadata, is_read, created_at")
      .single();
    if (error) throw error;
    notifRow = data;

    // 2. Realtime broadcast 給該用戶
    try {
      await supabaseAdmin
        .channel(`user-${userId}`)
        .send({
          type: "broadcast",
          event: "new_notification",
          payload: data,
        });
    } catch (err) {
      logger.warn("通知 broadcast 失敗（不阻擋）", {
        error: (err as Error)?.message,
        userId,
      });
    }
  } catch (err) {
    logger.error("寫入 notifications 失敗", err as Error, { userId, type });
    return; // DB 沒寫成功就放棄整個流程
  }

  // 3. Push（web-push + FCM 並行）
  if (!notifRow) return;
  if (!webPushReady && !fcmReady) return;

  await dispatchPush(userId, {
    title,
    body,
    link,
    icon: iconUrl,
    notificationId: notifRow.id,
  });
}

interface PushPayload {
  title: string;
  body?: string;
  link?: string;
  icon?: string;
  notificationId?: number;
}

interface PushSubRow {
  id: number;
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
  provider: "web" | "fcm";
}

/**
 * 撈 user 所有 subscriptions，依 provider 分流送
 * - web 用 webpush.sendNotification
 * - fcm 用 admin.messaging().send
 * 失敗的 token (410/404 / invalid-registration / not-registered) 自動清掉。
 */
async function dispatchPush(
  userId: number,
  payload: PushPayload,
): Promise<void> {
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, provider")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  await Promise.all(
    (subs as PushSubRow[]).map((s) => sendOne(s, payload)),
  );
}

async function sendOne(s: PushSubRow, payload: PushPayload): Promise<void> {
  if (s.provider === "fcm") {
    if (!fcmReady) return;
    await sendFcm(s, payload);
  } else {
    if (!webPushReady) return;
    await sendWebPush(s, payload);
  }
}

async function sendWebPush(
  s: PushSubRow,
  payload: PushPayload,
): Promise<void> {
  if (!s.p256dh || !s.auth) {
    logger.warn("web push subscription 缺 keys，跳過", { subId: s.id });
    return;
  }
  try {
    await webpush.sendNotification(
      {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    await touchLastUsed(s.id);
  } catch (err) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode === 410 || e.statusCode === 404) {
      await deleteSubscription(s.id, "web push 410/404");
    } else {
      logger.warn("Web Push 送出失敗（不阻擋）", {
        error: e?.message,
        statusCode: e?.statusCode,
        subId: s.id,
      });
    }
  }
}

async function sendFcm(
  s: PushSubRow,
  payload: PushPayload,
): Promise<void> {
  // FCM 的 endpoint 欄位放的是 registration token
  try {
    await admin.messaging().send({
      token: s.endpoint,
      notification: {
        title: payload.title,
        body: payload.body || "",
      },
      data: {
        link: payload.link || "",
        notificationId: payload.notificationId
          ? String(payload.notificationId)
          : "",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          color: "#C5A059",
        },
      },
    });
    await touchLastUsed(s.id);
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const isInvalid =
      e.code === "messaging/invalid-registration-token" ||
      e.code === "messaging/registration-token-not-registered";
    if (isInvalid) {
      await deleteSubscription(s.id, "fcm token invalid");
    } else {
      logger.warn("FCM 送出失敗（不阻擋）", {
        error: e?.message,
        code: e?.code,
        subId: s.id,
      });
    }
  }
}

async function touchLastUsed(id: number): Promise<void> {
  try {
    await supabaseAdmin
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", id);
  } catch {
    // 失敗無關緊要
  }
}

async function deleteSubscription(id: number, reason: string): Promise<void> {
  try {
    await supabaseAdmin.from("push_subscriptions").delete().eq("id", id);
    logger.info("Push 訂閱失效已清理", { subId: id, reason });
  } catch (err) {
    logger.warn("清理失效訂閱失敗", {
      subId: id,
      error: (err as Error)?.message,
    });
  }
}
