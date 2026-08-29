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
 * useLocalize hook
 * 回傳 `loc(obj, field)` 函數，自動取用當前語言
 */
export function useLocalize() {
  const { language } = useLanguage();

  /**
   * @param obj  - 資料物件（Article、Course、Video 等）
   * @param field - 中文欄位名稱（如 'article_title'、'course_title'）
   * @returns 依語言選擇的欄位值，英文若無則 fallback 中文
   */
  const loc = (obj: Record<string, unknown>, field: string): string =>
    localizeField(obj, field, language);

  return { loc, language };
}

export default useLocalize;
