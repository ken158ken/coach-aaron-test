/**
 * NotificationContext — 全站通知狀態（unread count + 清單 + actions）
 * @module context/NotificationContext
 */

import React, { createContext, useContext } from "react";
import { useNotificationsHook } from "@/hooks/useNotifications";
import type { Notification } from "@/services/notification.service";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useNotificationsHook();
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotificationContext(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      refresh: () => Promise.resolve(),
      markRead: () => Promise.resolve(),
      markAllRead: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    };
  }
  return ctx;
}
