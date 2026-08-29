/**
 * useChatNotifications — 全域聊天通知（toast + tab 標題閃爍 + navbar badge 計數）
 * @module hooks/useChatNotifications
 *
 * 在 <App> 最頂層執行：
 *   1. 拉一次自己的對話清單，拿到所有 conversation IDs
 *   2. 訂閱所有 channel 的 new_message 事件
 *   3. 收到事件時：
 *      - 若該訊息屬於目前打開的對話 → 不通知（讓該頁自己處理）
 *      - 否則：增加 unreadTotal、tab title 閃爍、發 toast event
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/services/social/chat.service";
import type { ChatMessage, ChatConversation } from "@/services/social/chat.service";
import { subscribeMany } from "@/services/social/realtime.service";

export interface ChatNotification {
  message: ChatMessage;
  conversation?: ChatConversation;
}

/** 取目前頁面是否在某 conversation 內 */
function getActiveConversationId(pathname: string): string | null {
  const m = pathname.match(/^\/chat\/([^/]+)/);
  return m ? m[1] : null;
}

/** 全域 hook — 回傳 unread total + 提供 toast 訂閱機制 */
export function useChatNotifications(): {
  unreadTotal: number;
  conversations: ChatConversation[];
  /** 對話清單是否已完成第一次載入（空清單≠載入中，用這個旗標區分） */
  conversationsLoaded: boolean;
  refreshConversations: () => void;
  /** 訂閱單一通知（ChatPage 用）*/
  subscribe: (cb: (n: ChatNotification) => void) => () => void;
} {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const subscribersRef = useRef<Array<(n: ChatNotification) => void>>([]);
  const titleOriginalRef = useRef<string>("");
  const titleFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshConversations = useCallback(() => {
    if (!user) return;
    chatService
      .listConversations()
      .then((data) => {
        setConversations(data);
        const total = data.reduce((s, c) => s + (c.unread_count || 0), 0);
        setUnreadTotal(total);
      })
      .catch(() => {})
      .finally(() => setConversationsLoaded(true));
  }, [user]);

  // 初始 + 每分鐘 refresh（穩態 fallback）
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setUnreadTotal(0);
      // 未登入沒有東西可載，視為已載入完成（避免空狀態卡在「載入中」）
      setConversationsLoaded(true);
      return;
    }
    refreshConversations();
    const t = setInterval(refreshConversations, 60_000);
    return () => clearInterval(t);
  }, [user, refreshConversations]);

  // 訂閱所有對話 channel
  useEffect(() => {
    if (!user || conversations.length === 0) return;
    const ids = conversations.map((c) => c.id);
    const myId = Number(user.user_id);

    const unsub = subscribeMany(ids, (msg) => {
      // 自己送的不通知
      if (msg.sender_id === myId) return;
      const conv = conversations.find((c) => c.id === msg.conversation_id);
      const activeConv = getActiveConversationId(location.pathname);

      // 廣播給訂閱者（讓 chat 頁面當前的對話自己處理）
      const notification: ChatNotification = { message: msg, conversation: conv };
      subscribersRef.current.forEach((cb) => {
        try {
          cb(notification);
        } catch {
          /* ignore */
        }
      });

      // 不在當下對話 → tab title 閃 + 增加 unread
      if (activeConv !== msg.conversation_id) {
        setUnreadTotal((prev) => prev + 1);
        flashTabTitle();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, conversations.map((c) => c.id).join(","), location.pathname]);

  // 切換到 chat 頁面時 reset
  useEffect(() => {
    const activeConv = getActiveConversationId(location.pathname);
    if (activeConv) {
      // 標已讀（背景）+ 重新計算未讀
      chatService.markRead(activeConv).then(refreshConversations).catch(() => {});
    }
  }, [location.pathname, refreshConversations]);

  const flashTabTitle = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!titleOriginalRef.current) titleOriginalRef.current = document.title;
    if (titleFlashRef.current) clearTimeout(titleFlashRef.current);
    document.title = "💬 新訊息 · " + titleOriginalRef.current;
    const reset = () => {
      if (titleOriginalRef.current) document.title = titleOriginalRef.current;
    };
    const onFocus = () => {
      reset();
      window.removeEventListener("focus", onFocus);
    };
    window.addEventListener("focus", onFocus);
    titleFlashRef.current = setTimeout(reset, 5_000);
  }, []);

  const subscribe = useCallback((cb: (n: ChatNotification) => void) => {
    subscribersRef.current.push(cb);
    return () => {
      subscribersRef.current = subscribersRef.current.filter((x) => x !== cb);
    };
  }, []);

  return {
    unreadTotal,
    conversations,
    conversationsLoaded,
    refreshConversations,
    subscribe,
  };
}
