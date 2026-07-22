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
import { coachService, type GoogleStatus } from "@/services/booking/coach.service";

// ===== 已啟用功能清單（純文字條列） =====
const ENABLED_FEATURES: readonly string[] = [
  "核准預約時，自動在此 Google 日曆建立諮詢事件",
  "自動寄「日曆邀請」給會員 → 事件出現在會員自己的 Google 日曆",
  "自動提醒（提前 1 天 email、提前 30 分鐘彈窗）",
  "自動附上 Google Meet 視訊連結",
  "計算可預約時段時，自動避開此日曆上的忙碌時段（freebusy）",
];

const AdminGoogleCalendar: React.FC = () => {
  const { confirm, alert } = useDialog();

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
      setError((err as Error).message || "無法讀取連結狀態");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const connected = status?.connected ?? false;
  const valid = status?.valid ?? false;
  const isLinked = connected && valid;

  const handleConnect = () => {
    window.location.href = coachService.getGoogleConnectUrl();
  };

  const handleDisconnect = async () => {
    const ok = await confirm({
      title: "解除 Google 連結",
      message:
        "確定要登出目前連結的 Google 帳號嗎？解除後，核准預約將無法自動建立日曆事件，直到重新連結。",
      confirmText: "登出 / 解除連結",
      cancelText: "取消",
      variant: "danger",
    });
    if (!ok) return;

    setDisconnecting(true);
    try {
      const res = await coachService.disconnectGoogle();
      if (!res.success) throw new Error("解除連結失敗");
      await loadStatus();
      await alert({
        title: "已解除連結",
        message: "已登出 Google 帳號，現在可請對方重新連結自己的 Google。",
        type: "success",
      });
    } catch (err) {
      await alert({
        title: "操作失敗",
        message: (err as Error).message || "解除連結時發生錯誤，請稍後再試。",
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
          讀取連結狀態中…
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-start gap-3">
          <span className="text-xl">❌</span>
          <div>
            <p className="text-sm font-medium text-red-400">無法讀取連結狀態</p>
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
            <p className="text-sm font-medium text-green-400">已連結</p>
            <p className="text-xs text-luxe-muted mt-1 break-all">
              日曆 ID：
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
              連結已失效，請重新連結
            </p>
            <p className="text-xs text-luxe-muted mt-1">
              授權可能已過期或被撤銷，請按下方「連結 / 切換 Google 帳號」重新登入。
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
            尚未連結任何 Google 帳號
          </p>
          <p className="text-xs text-luxe-muted mt-1">
            連結後，核准的預約會自動同步到 Google 日曆。
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
        <h1 className="text-2xl font-light text-luxe-text mt-1">Google 日曆管理</h1>
        <p className="text-sm text-luxe-muted mt-1">
          連結 Google 帳號，讓預約系統自動同步諮詢事件與可預約時段。
        </p>
      </div>

      {/* 連結狀態卡 */}
      <div className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-5 sm:p-6">
        <h2 className="text-sm font-medium text-luxe-text mb-4">連結狀態</h2>
        {renderStatusCard()}

        {/* 按鈕 */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
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
            {isLinked ? "切換 Google 帳號" : "連結 Google 帳號"}
          </button>

          <button
            onClick={handleDisconnect}
            disabled={!connected || loading || disconnecting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {disconnecting ? (
              <>
                <span className="w-4 h-4 border border-t-transparent border-red-400 rounded-full animate-spin" />
                處理中…
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
                登出 / 解除連結
              </>
            )}
          </button>
        </div>
      </div>

      {/* 共用帳號說明區 */}
      <div className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-5 sm:p-6">
        <h2 className="text-base font-medium text-luxe-text flex items-center gap-2 mb-3">
          <span>👥</span>
          共用帳號說明
        </h2>
        <p className="text-sm text-luxe-muted leading-relaxed">
          目前站長與教練共用同一個 Google
          帳號。要換人使用時，先按「登出 / 解除連結」把目前的帳號登出，再請對方按「連結
          Google 帳號」登入自己的 Google 即可，系統會自動接手新的帳號。
        </p>
      </div>

      {/* 已啟用功能清單 */}
      <div className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-5 sm:p-6">
        <h2 className="text-base font-medium text-luxe-text flex items-center gap-2 mb-1">
          <span>✨</span>
          連結後會自動啟用的功能
        </h2>
        <p className="text-xs text-luxe-muted mb-4">
          完成連結後，以下預約日曆功能會自動運作，無需額外設定。
        </p>
        <ul className="space-y-2.5">
          {ENABLED_FEATURES.map((feature) => (
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
