/**
 * ChatNotificationContext — 全域訂閱聊天通知並把 unreadTotal / subscribe 散播給 Navbar / 各頁面
 * @module context/ChatNotificationContext
 */

import React, { createContext, useContext } from "react";
import {
  useChatNotifications,
  type ChatNotification,
} from "@/hooks/useChatNotifications";
import type { ChatConversation } from "@/services/social/chat.service";

interface ChatNotificationContextValue {
  unreadTotal: number;
  conversations: ChatConversation[];
  /** 對話清單是否已完成第一次載入（空清單≠載入中） */
  conversationsLoaded: boolean;
  refreshConversations: () => void;
  subscribe: (cb: (n: ChatNotification) => void) => () => void;
}

const ChatNotificationContext =
  createContext<ChatNotificationContextValue | null>(null);

export const ChatNotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useChatNotifications();
  return (
    <ChatNotificationContext.Provider value={value}>
      {children}
    </ChatNotificationContext.Provider>
  );
};

export function useChatNotificationContext(): ChatNotificationContextValue {
  const ctx = useContext(ChatNotificationContext);
  if (!ctx) {
    // SSR-safe default
    return {
      unreadTotal: 0,
      conversations: [],
      conversationsLoaded: true,
      refreshConversations: () => {},
      subscribe: () => () => {},
    };
  }
  return ctx;
}
