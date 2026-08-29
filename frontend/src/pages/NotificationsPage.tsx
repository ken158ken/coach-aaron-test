/**
 * NotificationsPage — /notifications 通知中心
 * @module pages/NotificationsPage
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { enUS, zhTW } from "date-fns/locale";
import { PillButton } from "@/components/ui";
import { useNotificationContext } from "@/context/NotificationContext";
import { pushSubscriptionService } from "@/services/notifications/pushSubscription.service";
import type { Notification } from "@/services/notifications/notification.service";
import { useLanguage } from "@/context/LanguageContext";
import type { AllTranslations } from "@/context/LanguageContext";

const TYPE_ICON: Record<string, string> = {
  chat_message: "💬",
  chat_added_to_group: "👥",
  chat_removed_from_group: "🚪",
  booking_pending: "🔔",
  booking_approved: "✅",
  booking_rejected: "❌",
  booking_cancelled: "⚠️",
};

function formatTime(iso: string, t: AllTranslations, isZh: boolean): string {
  const d = new Date(iso);
  const dfLocale = isZh ? zhTW : enUS;
  if (isToday(d))
    return t.dateTime.today + " " + format(d, "HH:mm", { locale: dfLocale });
  if (isYesterday(d))
    return t.dateTime.yesterday + " " + format(d, "HH:mm", { locale: dfLocale });
  return format(d, "yyyy/MM/dd HH:mm", { locale: dfLocale });
}

type Filter = "all" | "unread";

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, isZhTW } = useLanguage();
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
      setPushError(
        err instanceof Error ? err.message : t.notificationsPage.toggleFailed,
      );
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light">
            {t.notificationsPage.heading}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t.notificationsPage.subtitle}
          </p>
        </div>
        {unreadCount > 0 && (
          <PillButton
            theme="luxe"
            variant="outline"
            size="sm"
            data-tour="notif-mark-all"
            onClick={() => markAllRead()}
          >
            {t.notificationsPage.markAllRead}
          </PillButton>
        )}
      </div>

      {/* 推播通知設定 */}
      <div
        className="mb-6 p-4 rounded-lg border border-gold/15 bg-surface-2/40"
        data-tour="notif-push"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">
              {t.notificationsPage.pushHeading}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {!pushSubscriptionService.isSupported()
                ? t.notificationsPage.pushUnsupported
                : pushOn
                  ? t.notificationsPage.pushOn
                  : t.notificationsPage.pushOff}
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
              {pushBusy
                ? t.notificationsPage.pushBusy
                : pushOn
                  ? t.notificationsPage.pushDisable
                  : t.notificationsPage.pushEnable}
            </PillButton>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4" data-tour="notif-filter">
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
            {f === "all"
              ? t.common.all
              : `${t.notificationsPage.unread} (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          {filter === "unread"
            ? t.notificationsPage.emptyUnread
            : t.notificationsPage.emptyAll}
          <br />
          <Link
            to="/"
            className="mt-2 inline-block text-gold hover:underline text-sm"
          >
            {t.notificationsPage.backHome}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              data-tour="notif-item"
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
                    {formatTime(n.created_at, t, isZhTW)}
                  </span>
                </div>
                {n.body && (
                  <p className="text-xs text-muted line-clamp-3">{n.body}</p>
                )}
              </button>
              <button
                data-tour="notif-delete"
                onClick={() => remove(n.id)}
                className="text-muted hover:text-red-400 text-xs px-1 shrink-0"
                title={t.common.delete}
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
