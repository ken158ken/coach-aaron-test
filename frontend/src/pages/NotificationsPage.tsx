/**
 * NotificationsPage — /notifications 通知中心
 * @module pages/NotificationsPage
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { zhTW } from "date-fns/locale";
import { PillButton } from "@/components/ui";
import { useNotificationContext } from "@/context/NotificationContext";
import { pushSubscriptionService } from "@/services/pushSubscription.service";
import type { Notification } from "@/services/notification.service";

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
  if (isToday(d)) return "今天 " + format(d, "HH:mm", { locale: zhTW });
  if (isYesterday(d)) return "昨天 " + format(d, "HH:mm", { locale: zhTW });
  return format(d, "yyyy/MM/dd HH:mm", { locale: zhTW });
}

type Filter = "all" | "unread";

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, remove } =
    useNotificationContext();
  const [filter, setFilter] = useState<Filter>("all");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushOn, setPushOn] = useState<boolean | null>(null);
  const [pushError, setPushError] = useState<string>("");

  React.useEffect(() => {
    if (!pushSubscriptionService.isSupported()) {
      setPushOn(false);
      return;
    }
    pushSubscriptionService
      .isSubscribed()
      .then(setPushOn)
      .catch(() => setPushOn(false));
  }, []);

  const filtered = notifications.filter((n) =>
    filter === "unread" ? !n.is_read : true,
  );

  const handleClick = (n: Notification) => {
    void markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const togglePush = async () => {
    setPushError("");
    setPushBusy(true);
    try {
      if (pushOn) {
        await pushSubscriptionService.disable();
        setPushOn(false);
      } else {
        await pushSubscriptionService.enable();
        setPushOn(true);
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "切換失敗");
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light">通知中心</h1>
          <p className="text-sm text-muted mt-1">
            7 天內的所有通知；過期會自動清除
          </p>
        </div>
        {unreadCount > 0 && (
          <PillButton
            theme="luxe"
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
          >
            全部已讀
          </PillButton>
        )}
      </div>

      {/* 推播通知設定 */}
      <div className="mb-6 p-4 rounded-lg border border-gold/15 bg-surface-2/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">📱 瀏覽器推播通知</h3>
            <p className="text-xs text-muted mt-0.5">
              {!pushSubscriptionService.isSupported()
                ? "你的瀏覽器不支援推播通知"
                : pushOn
                  ? "✅ 已開啟，瀏覽器關掉也會收到推播"
                  : "關閉中。開啟後即使瀏覽器關掉，也能收到新訊息 / 預約通知"}
            </p>
            {pushError && (
              <p className="text-xs text-red-400 mt-1">{pushError}</p>
            )}
          </div>
          {pushSubscriptionService.isSupported() && pushOn !== null && (
            <PillButton
              theme="luxe"
              variant={pushOn ? "outline" : "filled"}
              size="sm"
              onClick={togglePush}
              disabled={pushBusy}
            >
              {pushBusy ? "處理中..." : pushOn ? "停用" : "啟用推播"}
            </PillButton>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "unread"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
              filter === f
                ? "bg-gold/20 text-gold border border-gold/30"
                : "text-muted hover:text-inherit"
            }`}
          >
            {f === "all" ? "全部" : `未讀 (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          {filter === "unread" ? "沒有未讀通知" : "目前沒有通知"}
          <br />
          <Link
            to="/"
            className="mt-2 inline-block text-gold hover:underline text-sm"
          >
            回首頁
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors ${
                n.is_read
                  ? "border-gold/10 bg-surface-2/30"
                  : "border-gold/30 bg-gold/5"
              }`}
            >
              <span className="text-2xl shrink-0">
                {TYPE_ICON[n.type] || "🔔"}
              </span>
              <button
                onClick={() => handleClick(n)}
                className="flex-1 min-w-0 text-left"
              >
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
                  <p className="text-xs text-muted line-clamp-3">{n.body}</p>
                )}
              </button>
              <button
                onClick={() => remove(n.id)}
                className="text-muted hover:text-red-400 text-xs px-1 shrink-0"
                title="刪除"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
