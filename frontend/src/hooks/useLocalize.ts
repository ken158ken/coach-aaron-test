/**
 * useLocalize - DB 內容多語言本地化工具
 * @module hooks/useLocalize
 *
 * 用法：
 *   const { loc } = useLocalize();
 *   <h1>{loc(article, 'article_title')}</h1>
 *   // → 英文模式下讀 article_title_en，若為 null 則 fallback 中文
 *
 * 獨立函數（不需 hook，在 service 層使用）：
 *   localizeField(obj, 'article_title', 'en')
 */

import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/context/LanguageContext";

/**
 * 從物件中依語言讀取正確欄位
 * - lang='en'：優先讀 `${field}_en`，若為空則 fallback 到原欄位
 * - lang='zh-TW'：直接讀原欄位
 */
export function localizeField(
  obj: Record<string, unknown>,
  field: string,
  lang: Language,
): string {
  if (lang === "en") {
    const enVal = obj[`${field}_en`];
    if (enVal && typeof enVal === "string" && enVal.trim()) return enVal;
  }
  const val = obj[field];
  return typeof val === "string" ? val : "";
}

/**
 * 陣列欄位的語言挑選（`loc()` 只處理字串，陣列走這支）
 *
 * AEO 欄位 `key_points` / `faq` 在 DB 是 JSON 陣列，沒有「空字串 fallback」
 * 的概念，所以規則是：**英文模式且英文陣列非空才用英文**，否則一律中文；
 * 兩邊都空就回空陣列（呼叫端據此完全不渲染該區塊）。
 *
 * @param zh   中文欄位（key_points / faq）
 * @param en   英文欄位（key_points_en / faq_en）
 * @param lang 當前語言
 */
export function pickLocalized<T>(
  zh: T[] | null | undefined,
  en: T[] | null | undefined,
  lang: Language,
): T[] {
  if (lang === "en" && Array.isArray(en) && en.length > 0) return en;
  return Array.isArray(zh) ? zh : [];
}

/**
 * useLocalize hook
 * 回傳 `loc(obj, field)` 函數，自動取用當前語言
 */
export function useLocalize() {
  const { t, language } = useLanguage();

  /**
   * @param obj  - 資料物件（Article、Course、Video 等）
   * @param field - 中文欄位名稱（如 'article_title'、'course_title'）
   * @returns 依語言選擇的欄位值，英文若無則 fallback 中文
   */
  const loc = (obj: Record<string, unknown>, field: string): string =>
    localizeField(obj, field, language);

  /**
   * 陣列欄位版本（key_points / faq）
   * @param zh 中文陣列欄位
   * @param en 英文陣列欄位
   */
  const pickList = <T,>(
    zh: T[] | null | undefined,
    en: T[] | null | undefined,
  ): T[] => pickLocalized(zh, en, language);

  /**
   * 文章分類 slug → 顯示名稱
   *
   * DB 的 `article_category` 是英文 slug（sales / mindset / retention）且
   * `article_category_en` 全為 null，所以**不能**用 `loc()` 取顯示名稱 ——
   * 一律查字典的 `categoryLabels`；查不到（例如舊測試文的中文分類）直接回原值。
   * 注意：URL 與 API 參數一律用原始 slug，顯示名稱只在 UI 上出現。
   *
   * @param slug DB 原始分類值
   */
  const catLabel = (slug?: string | null): string => {
    const raw = (slug || "").trim();
    if (!raw) return "";
    const map = t.categoryLabels as unknown as Record<string, string>;
    return (map && map[raw]) || raw;
  };

  return { loc, pickList, catLabel, language };
}

export default useLocalize;
