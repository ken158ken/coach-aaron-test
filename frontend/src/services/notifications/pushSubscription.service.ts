/**
 * Web Push 訂閱服務
 * @module services/pushSubscription.service
 *
 * 流程：
 *   1. 後端取 VAPID public key
 *   2. SW.pushManager.subscribe(publicKey)
 *   3. 把訂閱資訊（endpoint + keys）POST 到後端存 DB
 *
 * 取消訂閱：
 *   1. SW.pushManager.unsubscribe()
 *   2. POST 後端刪 DB row
 */

import { get, post } from "../api";

interface PushKey {
  publicKey: string;
  enabled: boolean;
}
interface PushStatus {
  subscribed: boolean;
  enabled: boolean;
}

const pushApi = {
  getPublicKey: (): Promise<PushKey> =>
    get<PushKey>("/api/notifications/push/public-key"),
  status: (): Promise<PushStatus> =>
    get<PushStatus>("/api/notifications/push/status"),
  subscribe: (data: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }): Promise<{ success: boolean }> =>
    post<{ success: boolean }>(
      "/api/notifications/push/subscribe",
      data,
    ),
  unsubscribe: (endpoint: string): Promise<{ success: boolean }> =>
    post<{ success: boolean }>(
      "/api/notifications/push/unsubscribe",
      { endpoint },
    ),
};

/** Base64 URL → Uint8Array — 給 PushManager.subscribe 用 */
function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

/** 主要 API — 給 UI toggle 用 */
export const pushSubscriptionService = {
  /** 是否被瀏覽器支援 */
  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "serviceWorker" in navigator && "PushManager" in window;
  },

  /** 目前權限狀態 */
  permissionState(): NotificationPermission {
    if (typeof window === "undefined") return "default";
    return Notification.permission;
  },

  /** 後端是否啟用 push（VAPID 有沒有設） */
  serverEnabled: (): Promise<boolean> =>
    pushApi.status().then((s) => s.enabled),

  /** 自己有沒有訂閱 */
  isSubscribed: (): Promise<boolean> =>
    pushApi.status().then((s) => s.subscribed),

  /** 啟用：請求權限 → SW.subscribe → 送 endpoint 給後端 */
  async enable(): Promise<void> {
    if (!this.isSupported()) throw new Error("此瀏覽器不支援推播通知");

    const { publicKey, enabled } = await pushApi.getPublicKey();
    if (!enabled || !publicKey) {
      throw new Error("伺服器尚未設定 VAPID（VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY 未設）");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("使用者未授權通知");

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // 拿 ArrayBuffer 而非 Uint8Array，避開 TS lib.dom 對 SharedArrayBuffer 的型別告警
        applicationServerKey: urlBase64ToUint8Array(publicKey)
          .buffer as ArrayBuffer,
      }));

    const json = sub.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    await pushApi.subscribe({
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
  },

  /** 停用 */
  async disable(): Promise<void> {
    if (!this.isSupported()) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await pushApi.unsubscribe(sub.endpoint).catch(() => {});
      await sub.unsubscribe();
    }
  },
};

export default pushSubscriptionService;
