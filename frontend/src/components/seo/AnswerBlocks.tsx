/**
 * AEO/GEO 答案塊元件（快速回答 / 重點整理 / 常見問題）
 * @module components/seo/AnswerBlocks
 *
 * @description
 * 給生成式搜尋引擎（AI Overview / ChatGPT / Perplexity）可直接引用的三種結構：
 *   1. QuickAnswer —— 本文最前面的一句「結論先講」（DB answer_summary）
 *   2. KeyPoints   —— 重點整理清單（DB key_points，純文字陣列）
 *   3. FaqSection  —— 常見問答（DB faq，同時由 SEOHead 輸出 FAQPage JSON-LD）
 *
 * ⚠️ 兩條紅線（改動前必讀）
 *   ① **資料全空時必須完全不渲染**：migration 041 貼上前所有欄位都是 null，
 *      頁面不能出現空標題、空卡片。每個元件都在最前面 early-return null。
 *   ② **SSR HTML 必須含完整文字**：FAQ 用原生 `<details>`／`<summary>`，
 *      答案在 HTML 裡就存在（只是折疊），不依賴 JS 展開才出現 ——
 *      改成 useState 控制的 accordion 會讓爬蟲抓不到答案，等於白做。
 *
 * 樣式：沿用 studio 主題既有 class（`bg-white/2`、`border-white/10`、
 * `detail-card`、`text-gold`）。這些 class 在 `index.css` 檔尾的
 * `[data-theme="studio-light"]` 區有對應覆寫（`.detail-body` 內的
 * `bg-white*`／`border-white*` 會被 catcher 翻成淺色），所以深淺兩個主題
 * 都自動成立，**不要在這裡寫 inline style**（inline 蓋得過任何 CSS 覆寫）。
 */

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import type { FaqItem } from "@/types";

/** 共用：區塊標題（與 ArticleDetail / CourseDetail 既有 section 標題同樣式） */
const BlockHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl sm:text-2xl font-light text-white mb-5 pb-3 border-b border-white/10">
    {children}
  </h2>
);

export interface QuickAnswerProps {
  /** 已本地化的答案摘要（呼叫端用 loc() 讀 answer_summary / answer_summary_en） */
  summary?: string | null;
  className?: string;
}

/**
 * QuickAnswer —— 本文前的「快速回答」卡
 *
 * 用 `.detail-card`（深色漸層／淺色暖白紙卡＋金色頂線）讓它在內文之上跳出來，
 * 視覺語彙與側欄資訊卡一致。
 */
export const QuickAnswer: React.FC<QuickAnswerProps> = ({
  summary,
  className = "",
}) => {
  const { t } = useLanguage();
  const text = (summary || "").trim();
  if (!text) return null;

  return (
    <aside
      className={`detail-card rounded-lg p-5 sm:p-7 ${className}`}
      aria-label={t.answerBlocks.quickAnswerLabel}
    >
      <p className="text-white/30 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
        <span aria-hidden="true" className="text-gold not-italic">
          ◆
        </span>
        {t.answerBlocks.quickAnswerLabel}
      </p>
      <p className="text-white/80 text-base sm:text-lg leading-relaxed whitespace-pre-line">
        {text}
      </p>
    </aside>
  );
};

export interface KeyPointsProps {
  /** 已本地化的重點清單（呼叫端用 pickList() 選 key_points / key_points_en） */
  points?: string[] | null;
  className?: string;
  /** 自訂標題（預設走字典的「重點整理」） */
  heading?: string;
}

/**
 * KeyPoints —— 重點整理（有序清單，編號走金色）
 */
export const KeyPoints: React.FC<KeyPointsProps> = ({
  points,
  className = "",
  heading,
}) => {
  const { t } = useLanguage();
  const list = (points || [])
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .map((p) => p.trim());
  if (list.length === 0) return null;

  return (
    <section
      className={`bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10 ${className}`}
    >
      <BlockHeading>{heading || t.answerBlocks.keyPointsTitle}</BlockHeading>
      <ol className="space-y-3 list-none pl-0">
        {list.map((point, idx) => (
          <li
            key={idx}
            className="flex gap-3 text-white/70 text-sm sm:text-base leading-relaxed"
          >
            <span
              aria-hidden="true"
              className="text-gold font-mono text-xs shrink-0 pt-1"
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

export interface FaqSectionProps {
  /** 已本地化的問答清單（呼叫端用 pickList() 選 faq / faq_en） */
  items?: FaqItem[] | null;
  className?: string;
  /** 自訂標題（預設走字典的「常見問題」） */
  heading?: string;
}

/**
 * FaqSection —— 常見問題
 *
 * 原生 `<details>`：第一題預設展開，其餘折疊但**文字仍在 SSR HTML 裡**。
 */
export const FaqSection: React.FC<FaqSectionProps> = ({
  items,
  className = "",
  heading,
}) => {
  const { t } = useLanguage();
  const list = (items || []).filter(
    (item): item is FaqItem =>
      Boolean(item) &&
      typeof item.question === "string" &&
      item.question.trim().length > 0 &&
      typeof item.answer === "string" &&
      item.answer.trim().length > 0,
  );
  if (list.length === 0) return null;

  return (
    <section
      className={`bg-white/2 border border-white/5 rounded-lg p-6 sm:p-10 ${className}`}
    >
      <BlockHeading>{heading || t.answerBlocks.faqTitle}</BlockHeading>
      <div>
        {list.map((item, idx) => (
          <details
            key={idx}
            open={idx === 0}
            className={`group py-4${idx > 0 ? " border-t border-white/10" : ""}`}
          >
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-white/80 text-sm sm:text-base font-medium marker:hidden">
              <span>{item.question.trim()}</span>
              <span
                aria-hidden="true"
                className="text-gold shrink-0 text-lg leading-none transition-transform duration-200 group-open:rotate-45"
              >
                ＋
              </span>
            </summary>
            <p className="mt-3 text-white/60 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {item.answer.trim()}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default QuickAnswer;
