/**
 * AdminGoogleCalendar — 後台 Google 日曆管理
 * /admin/google-calendar
 *
 * 功能：
 *   - 顯示 Google 日曆連結狀態
 *   - 連結 / 切換 Google 帳號（導轉至授權流程）
 *   - 登出 / 解除連結（含確認對話框）
 *   - 說明共用帳號流程與已啟用的預約日曆功能
 */

import React, { useCallback, useEffect, useState } from "react";
import { useDialog } from "@/components/ui/Dialog";
import { useLanguage } from "@/context/LanguageContext";
import { coachService, type GoogleStatus } from "@/services/booking/coach.service";

const AdminGoogleCalendar: React.FC = () => {
  const { confirm, alert } = useDialog();
  const { t } = useLanguage();
  const g = t.adminGoogleCalendarPage;

  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await coachService.getGoogleStatus();
      setStatus(data);
    } catch (err) {
      setError((err as Error).message || t.adminGoogleCalendarPage.statusLoadFailed);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const connected = status?.connected ?? false;
  const valid = status?.valid ?? false;
  const isLinked = connected && valid;

  const handleConnect = () => {
    const url = coachService.getGoogleConnectUrl();
    // 用「彈窗」授權，讓本頁不整頁重載 → 網站登入狀態不會遺失。
    const popup = window.open(url, "gcal_oauth", "width=520,height=680");
    if (!popup) {
      // 彈窗被瀏覽器封鎖 → 退回整頁導轉（callback 會導回本頁）
      window.location.href = url;
      return;
    }
    // 彈窗完成後會 postMessage 通知；同源才採信，收到就刷新狀態
    let poll = 0;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string } | null;
      if (d && d.type === "gcal") {
        window.removeEventListener("message", onMsg);
        window.clearInterval(poll);
        void loadStatus();
      }
    };
    window.addEventListener("message", onMsg);
    // 保底：偵測彈窗關閉後刷新狀態（萬一沒收到訊息，例如跨網域）
    poll = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(poll);
        window.removeEventListener("message", onMsg);
        void loadStatus();
      }
    }, 800);
  };

  const handleDisconnect = async () => {
    const ok = await confirm({
      title: g.disconnectTitle,
      message: g.disconnectMessage,
      confirmText: g.disconnectBtn,
      cancelText: t.common.cancel,
      variant: "danger",
    });
    if (!ok) return;

    setDisconnecting(true);
    try {
      const res = await coachService.disconnectGoogle();
      if (!res.success) throw new Error(g.disconnectFailed);
      await loadStatus();
      await alert({
        title: g.disconnectedTitle,
        message: g.disconnectedMessage,
        type: "success",
      });
    } catch (err) {
      await alert({
        title: g.actionFailedTitle,
        message: (err as Error).message || g.disconnectErrorMessage,
        type: "error",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // ===== 狀態卡片內容 =====
  const renderStatusCard = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3 text-luxe-muted text-sm">
          <span className="w-4 h-4 border border-t-transparent border-luxe-gold rounded-full animate-spin" />
          {g.statusLoading}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-start gap-3">
          <span className="text-xl">❌</span>
          <div>
            <p className="text-sm font-medium text-red-400">{g.statusLoadFailed}</p>
            <p className="text-xs text-luxe-muted mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (isLinked) {
      return (
        <div className="flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-400">{g.statusConnected}</p>
            <p className="text-xs text-luxe-muted mt-1 break-all">
              {g.calendarIdLabel}
              <span className="text-luxe-text ml-1">
                {status?.calendarId || "primary"}
              </span>
            </p>
          </div>
        </div>
      );
    }

    if (connected && !valid) {
      return (
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-400">
              {g.statusExpired}
            </p>
            <p className="text-xs text-luxe-muted mt-1">
              {g.statusExpiredHint}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-3">
        <span className="text-xl">⚪</span>
        <div>
          <p className="text-sm font-medium text-luxe-text">
            {g.statusNone}
          </p>
          <p className="text-xs text-luxe-muted mt-1">
            {g.statusNoneHint}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs text-luxe-muted uppercase tracking-widest">
          Admin
        </span>
        <h1 className="text-2xl font-light text-luxe-text mt-1">{g.pageTitle}</h1>
        <p className="text-sm text-luxe-muted mt-1">
          {g.pageSubtitle}
        </p>
      </div>

      {/* 連結狀態卡 */}
      <div
        data-tour="gcal-status"
        className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-5 sm:p-6"
      >
        <h2 className="text-sm font-medium text-luxe-text mb-4">{g.statusHeading}</h2>
        {renderStatusCard()}

        {/* 按鈕 */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            data-tour="gcal-connect"
            onClick={handleConnect}
            disabled={loading || disconnecting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold border border-luxe-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {isLinked ? g.switchBtn : g.connectBtn}
          </button>

          <button
            data-tour="gcal-disconnect"
            onClick={handleDisconnect}
            disabled={!connected || loading || disconnecting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {disconnecting ? (
              <>
                <span className="w-4 h-4 border border-t-transparent border-red-400 rounded-full animate-spin" />
                {t.adminCommon.processing}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {g.disconnectBtn}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 共用帳號說明區 */}
      <div
        data-tour="gcal-shared-note"
        className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-5 sm:p-6"
      >
        <h2 className="text-base font-medium text-luxe-text flex items-center gap-2 mb-3">
          <span>👥</span>
          {g.sharedHeading}
        </h2>
        <p className="text-sm text-luxe-muted leading-relaxed">
          {g.sharedBody}
        </p>
      </div>

      {/* 已啟用功能清單 */}
      <div
        data-tour="gcal-features"
        className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-5 sm:p-6"
      >
        <h2 className="text-base font-medium text-luxe-text flex items-center gap-2 mb-1">
          <span>✨</span>
          {g.featuresHeading}
        </h2>
        <p className="text-xs text-luxe-muted mb-4">
          {g.featuresHint}
        </p>
        <ul className="space-y-2.5">
          {g.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-luxe-muted"
            >
              <span className="text-luxe-gold mt-0.5 shrink-0">✓</span>
              <span className="leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminGoogleCalendar;
