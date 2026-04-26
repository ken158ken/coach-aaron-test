/**
 * NotificationBell — 鈴鐺 + 未讀數 badge + 下拉預覽清單
 * @module components/notifications/NotificationBell
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useNotificationContext } from "@/context/NotificationContext";
import type { Notification } from "@/services/notification.service";

interface NotificationBellProps {
  className?: string;
  iconClassName?: string;
}

const TYPE_ICON: Record<string, string> = {
  chat_message: "💬",
  chat_added_to_group: "👥",
  chat_removed_from_group: "🚪",
  booking_pending: "🔔",
  booking_approved: "✅",
  booking_rejected: "❌",
  booking_cancelled: "⚠️",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm", { locale: zhTW });
  if (isYesterday(d)) return "昨天";
  return format(d, "MM/dd", { locale: zhTW });
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "",
  iconClassName = "w-4 h-4",
}) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotificationContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleClick = (n: Notification) => {
    void markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full border border-white/20 hover:border-white/50 transition-all"
        style={{ background: "rgba(255,255,255,0.05)" }}
        aria-label="通知"
        title="通知"
      >
        <svg
          className={iconClassName}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] flex flex-col rounded-lg border border-gold/20 shadow-2xl bg-surface-2 overflow-hidden z-[60]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gold/15">
            <span className="text-sm font-medium">通知</span>
            <div className="flex items-center gap-3 text-xs">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-muted hover:text-gold transition-colors"
                >
                  全部已讀
                </button>
              )}
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-gold hover:underline"
              >
                查看全部
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">
                目前沒有通知
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 border-b border-gold/5 text-left hover:bg-gold/10 transition-colors ${
                    n.is_read ? "" : "bg-gold/5"
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4
                        className={`text-sm truncate ${n.is_read ? "" : "font-medium"}`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-muted shrink-0">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted line-clamp-2">
                        {n.body}
                      </p>
                    )}
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
