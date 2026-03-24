/**
 * HomePopup 元件 - 首頁自定義彈窗
 * 從後端取得管理員設定的彈窗內容，在首頁顯示
 *
 * @module components/sections/HomePopup
 */

import React, { useState, useEffect, useCallback } from "react";
import { contentService, type ActivePopup } from "@/services/content.service";
import { useScrollLock } from "@/hooks/useScrollLock";

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

      {/* 彈窗本體 - 白色主題 */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl shadow-black/20 max-w-lg w-full max-h-[70vh] overflow-hidden transition-all duration-500 ease-out ${
          animateIn
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 -translate-y-8"
        }`}
      >
        {/* 頂部裝飾條 */}
        <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400" />

        {/* 關閉按鈕 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all z-10"
          aria-label="關閉"
        >
          ✕
        </button>

        {/* 標題 */}
        {popup.popup_title && (
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-xl font-bold text-gray-800">
              {popup.popup_title}
            </h2>
          </div>
        )}

        {/* 內容 (HTML 渲染) */}
        <div className="px-6 pb-4 overflow-y-auto max-h-[50vh]">
          <div
            className="prose prose-sm max-w-none
              [&_a]:text-cyan-600 [&_a]:underline
              [&_img]:rounded-lg [&_img]:max-w-full
              [&_h1]:text-lg [&_h1]:text-gray-800 [&_h1]:font-bold
              [&_h2]:text-base [&_h2]:text-gray-700 [&_h2]:font-semibold
              [&_h3]:text-sm [&_h3]:text-gray-600
              [&_p]:text-gray-600 [&_p]:leading-relaxed
              [&_li]:text-gray-600
              [&_strong]:text-gray-800
              [&_blockquote]:border-l-cyan-400 [&_blockquote]:text-gray-500"
            dangerouslySetInnerHTML={{ __html: popup.popup_content }}
          />
        </div>

        {/* 底部按鈕 */}
        <div className="px-6 pb-5 flex justify-end border-t border-gray-100 pt-4">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            了解
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePopup;
