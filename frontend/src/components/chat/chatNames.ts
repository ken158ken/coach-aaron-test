/**
 * 聊天顯示名稱 / 預覽文字的 i18n 版本
 * @module components/chat/chatNames
 *
 * services/social/chat.service.ts 的 getConversationName / previewText 內建中文
 * fallback（「群組」「對話」「用戶」「📷 圖片」），service 層拿不到 LanguageContext，
 * 所以在這裡提供接受翻譯字典的同名替代，供 components/chat/ 的元件使用。
 */

import type {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ChatUser,
} from "@/services/social/chat.service";
import type { AllTranslations } from "@/context/LanguageContext";

/**
 * 取得對話顯示名稱（群組用標題、DM 用對方名稱），fallback 皆走翻譯字典
 */
export function localizedConversationName(
  conv: ChatConversation,
  myUserId: number,
  t: AllTranslations,
): string {
  if (conv.type === "group") return conv.title || t.chatUi.groupFallback;
  const others = (conv.participants || [])
    .map((p) =>
      "user" in (p as object) ? (p as ChatParticipant).user : (p as ChatUser),
    )
    .filter((u) => u && u.user_id !== myUserId);
  const other = others[0];
  if (!other) return t.chatUi.conversationFallback;
  return (
    other.admin_display_name ||
    other.display_name ||
    other.name ||
    other.email ||
    t.chatUi.userFallback
  );
}

/**
 * 取得某位使用者的顯示名稱，未知時回傳翻譯過的「用戶」
 */
export function localizedUserName(
  u: ChatUser | null | undefined,
  t: AllTranslations,
): string {
  if (!u) return t.chatUi.userFallback;
  return (
    u.admin_display_name ||
    u.display_name ||
    u.name ||
    u.email ||
    t.chatUi.userFallback
  );
}

/**
 * 把 last_seen_at 轉成「X 分鐘前在線」等顯示（presence.service 的 i18n 版）
 */
export function localizedLastSeen(
  lastSeenIso: string | null,
  t: AllTranslations,
  isZh: boolean,
): string {
  if (!lastSeenIso) return t.chatUi.lastSeenNever;
  const diff = Date.now() - new Date(lastSeenIso).getTime();
  if (diff < 60_000) return t.chatUi.lastSeenOnline;
  const min = Math.floor(diff / 60_000);
  if (min < 60)
    return t.chatUi.lastSeenMinutes.replace("{count}", String(min));
  const hr = Math.floor(min / 60);
  if (hr < 24) return t.chatUi.lastSeenHours.replace("{count}", String(hr));
  const day = Math.floor(hr / 24);
  if (day === 1) return t.chatUi.lastSeenYesterday;
  if (day < 7) return t.chatUi.lastSeenDays.replace("{count}", String(day));
  return new Date(lastSeenIso).toLocaleDateString(isZh ? "zh-TW" : "en-US");
}

/**
 * 對話清單的最後一則訊息預覽（純圖片訊息顯示「📷 圖片」）
 */
export function localizedPreviewText(
  msg:
    | ChatMessage
    | { content: string; has_image?: boolean; image_url?: string | null },
  t: AllTranslations,
): string {
  const hasImage =
    "has_image" in msg ? msg.has_image : !!(msg as ChatMessage).image_url;
  const text = msg.content?.trim();
  if (text) return text.length > 30 ? text.slice(0, 30) + "..." : text;
  if (hasImage) return t.chatUi.imagePreview;
  return "";
}
