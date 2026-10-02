/**
 * HomePopup 元件 - 首頁自定義彈窗
 * 從後端取得管理員設定的彈窗內容，在首頁顯示
 *
 * @module components/sections/HomePopup
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { contentService, type ActivePopup } from "@/services/site/content.service";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks/useLocalize";
import { LogoMark } from "@/components/brand";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[HomePopup] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[HomePopup] ${msg}`, err || ""),
};

const POPUP_STORAGE_PREFIX = "coach_popup_seen_";

/**
 * 彈窗「等使用者有互動意圖」的保底秒數。
 *
 * 2026-10-02 由「hydrate 後 600ms 自動跳出」改成「使用者捲動／觸控／按鍵
 * 後才跳出，最多等 10 秒」：
 *   - Google 對手機從搜尋結果進站就被全版插頁蓋住的頁面有明確扣分
 *     （intrusive interstitial），而 PageSpeed 的 Speed Index 也因為
 *     「最後一格是彈窗」把它前面所有畫格都算成未完成（行動版 13.7s）。
 *   - 等互動再出現，對真人體驗也較不突兀；10 秒保底讓完全不動的訪客仍會看到。
 */
const POPUP_INTENT_FALLBACK_MS = 10_000;
const POPUP_INTENT_EVENTS = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"] as const;

/**
 * HomePopup - 首頁自定義彈窗
 * 管理員可在後台設定內容，用戶開啟首頁時自動顯示
 */
const HomePopup: React.FC = () => {
  const { t } = useLanguage();
  const { loc } = useLocalize();
  const copy = t.homePopup;
  const [popup, setPopup] = useState<ActivePopup | null>(null);
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  /** 解除「互動意圖」監聽與保底計時器（unmount 或已顯示時呼叫） */
  const disarmIntentRef = useRef<(() => void) | null>(null);

  /** 等使用者有互動意圖（或保底逾時）後才真正顯示彈窗 */
  const revealOnIntent = useCallback(() => {
    const reveal = () => {
      disarmIntentRef.current?.();
      disarmIntentRef.current = null;
      setVisible(true);
      // 觸發入場動畫
      requestAnimationFrame(() => {
        setTimeout(() => setAnimateIn(true), 30);
      });
    };
    const timer = window.setTimeout(reveal, POPUP_INTENT_FALLBACK_MS);
    POPUP_INTENT_EVENTS.forEach((evt) =>
      window.addEventListener(evt, reveal, { passive: true, once: true }),
    );
    disarmIntentRef.current = () => {
      window.clearTimeout(timer);
      POPUP_INTENT_EVENTS.forEach((evt) => window.removeEventListener(evt, reveal));
    };
  }, []);

  const fetchPopup = useCallback(async () => {
    try {
      const data = await contentService.getActivePopup();
      if (!data) return;

      // 若設定「僅顯示一次」且已看過，則不顯示
      if (data.show_once) {
        const storageKey = `${POPUP_STORAGE_PREFIX}${data.popup_id}`;
        const seen = localStorage.getItem(storageKey);
        if (seen) {
          logger.info("Popup already seen, skipping", { id: data.popup_id });
          return;
        }
      }

      setPopup(data);
      // 不再固定延遲 600ms 自動跳出；改等互動意圖（見 POPUP_INTENT_FALLBACK_MS 註解）
      revealOnIntent();
    } catch (err) {
      logger.error("Failed to fetch popup", err);
    }
  }, [revealOnIntent]);

  useEffect(() => {
    fetchPopup();
    return () => {
      disarmIntentRef.current?.();
      disarmIntentRef.current = null;
    };
  }, [fetchPopup]);

  const handleClose = () => {
    setAnimateIn(false);

    // 記錄已看過
    if (popup?.show_once) {
      const storageKey = `${POPUP_STORAGE_PREFIX}${popup.popup_id}`;
      localStorage.setItem(storageKey, new Date().toISOString());
    }

    // 動畫結束後移除 DOM
    setTimeout(() => {
      setVisible(false);
      setPopup(null);
    }, 400);
  };

  useScrollLock(visible);

  if (!popup || !visible) return null;

  // DB 內容：site_popups 有 popup_title_en / popup_content_en 兩個英文欄位，
  // 交給 loc() 依語言挑選（英文欄位為空時自動 fallback 中文）。
  // ⚠️ ActivePopup 型別定義在 services/site/content.service.ts（不在本次可改檔案內），
  //    故沿用本專案既有的 `as unknown as Record<string, unknown>` 寫法。
  const popupRecord = popup as unknown as Record<string, unknown>;
  const popupTitle = loc(popupRecord, "popup_title");
  const popupContent = loc(popupRecord, "popup_content");

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] sm:pt-[15vh] p-4">
      {/* 過渡遮罩 */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          animateIn
            ? "bg-black/40 backdrop-blur-sm"
            : "bg-black/0 backdrop-blur-none"
        }`}
        onClick={handleClose}
      />

      {/* 彈窗本體 - 品牌銀刃風（bg-surface / gold token 隨深淺主題自動切換） */}
      <div
        className={`relative bg-surface border border-gold/20 rounded-2xl shadow-2xl shadow-black/30 max-w-lg w-full max-h-[70vh] overflow-hidden transition-all duration-500 ease-out ${
          animateIn
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 -translate-y-8"
        }`}
      >
        {/* 頂部金色細光裝飾 */}
        <div className="h-px bg-linear-to-r from-transparent via-gold/80 to-transparent" />

        {/* 關閉按鈕 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gold/10 hover:bg-gold/20 text-muted hover:text-gold transition-all z-10"
          aria-label={copy.close}
        >
          ✕
        </button>

        {/* 標題（品牌 mark + 文字） */}
        {popupTitle && (
          <div className="px-6 pt-6 pb-3 flex items-center gap-3">
            <LogoMark size={36} title={copy.logoTitle} />
            <h2 className="text-lg sm:text-xl font-medium tracking-wide">
              {popupTitle}
            </h2>
          </div>
        )}

        {/* 內容 (HTML 渲染) */}
        <div className="px-6 pb-4 overflow-y-auto max-h-[50vh] overscroll-contain">
          <div
            className="popup-prose max-w-none text-sm sm:text-base leading-relaxed
              [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-2
              [&_img]:rounded-lg [&_img]:max-w-full
              [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-2
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2
              [&_h3]:text-sm [&_h3]:font-medium
              [&_p]:text-muted [&_p]:leading-relaxed [&_p]:mb-3
              [&_li]:text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
              [&_strong]:text-gold [&_strong]:font-semibold
              [&_blockquote]:border-l-2 [&_blockquote]:border-gold/50 [&_blockquote]:pl-3 [&_blockquote]:text-muted"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(popupContent) }}
          />
        </div>

        {/* 底部按鈕 */}
        <div className="px-6 pb-5 flex justify-end border-t border-gold/10 pt-4">
          <button
            onClick={handleClose}
            className="popup-cta px-7 py-2.5 bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 rounded-lg text-sm tracking-widest transition-all duration-200 hover:shadow-lg hover:shadow-gold/10"
          >
            {copy.cta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePopup;
