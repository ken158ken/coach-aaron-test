/**
 * HomePopup 元件 - 首頁自定義彈窗
 * 從後端取得管理員設定的彈窗內容，在首頁顯示
 *
 * @module components/sections/HomePopup
 */

import React, { useState, useEffect, useCallback } from "react";
import { contentService, type ActivePopup } from "@/services/site/content.service";
import { useScrollLock } from "@/hooks/useScrollLock";
import { LogoMark } from "@/components/brand";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[HomePopup] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[HomePopup] ${msg}`, err || ""),
};

const POPUP_STORAGE_PREFIX = "coach_popup_seen_";

/**
 * HomePopup - 首頁自定義彈窗
 * 管理員可在後台設定內容，用戶開啟首頁時自動顯示
 */
const HomePopup: React.FC = () => {
  const [popup, setPopup] = useState<ActivePopup | null>(null);
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

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
      // 延遲顯示，讓頁面先完成載入動畫
      setTimeout(() => {
        setVisible(true);
        // 觸發入場動畫
        requestAnimationFrame(() => {
          setTimeout(() => setAnimateIn(true), 30);
        });
      }, 600);
    } catch (err) {
      logger.error("Failed to fetch popup", err);
    }
  }, []);

  useEffect(() => {
    fetchPopup();
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
          aria-label="關閉"
        >
          ✕
        </button>

        {/* 標題（品牌 mark + 文字） */}
        {popup.popup_title && (
          <div className="px-6 pt-6 pb-3 flex items-center gap-3">
            <LogoMark size={36} title="阿倫教官" />
            <h2 className="text-lg sm:text-xl font-medium tracking-wide">
              {popup.popup_title}
            </h2>
          </div>
        )}

        {/* 內容 (HTML 渲染) */}
        <div className="px-6 pb-4 overflow-y-auto max-h-[50vh] overscroll-contain">
          <div
            className="max-w-none text-sm sm:text-base leading-relaxed
              [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-2
              [&_img]:rounded-lg [&_img]:max-w-full
              [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-2
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2
              [&_h3]:text-sm [&_h3]:font-medium
              [&_p]:text-muted [&_p]:leading-relaxed [&_p]:mb-3
              [&_li]:text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
              [&_strong]:text-gold [&_strong]:font-semibold
              [&_blockquote]:border-l-2 [&_blockquote]:border-gold/50 [&_blockquote]:pl-3 [&_blockquote]:text-muted"
            dangerouslySetInnerHTML={{ __html: popup.popup_content }}
          />
        </div>

        {/* 底部按鈕 */}
        <div className="px-6 pb-5 flex justify-end border-t border-gold/10 pt-4">
          <button
            onClick={handleClose}
            className="px-7 py-2.5 bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 rounded-lg text-sm tracking-widest transition-all duration-200 hover:shadow-lg hover:shadow-gold/10"
          >
            開始探索
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePopup;
