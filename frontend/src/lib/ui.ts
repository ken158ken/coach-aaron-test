/**
 * UI 工具函數
 * @module lib/ui
 */

/**
 * 格式化日期
 *
 * @param {string | undefined} dateString - ISO 日期字串
 * @returns {string} 格式化後的日期
 */
export const formatDate = (
  dateString: string | undefined,
  /** BCP-47 語言碼；預設 zh-TW 維持既有呼叫端相容 */
  locale: "zh-TW" | "en" = "zh-TW",
): string => {
  const unknown = locale === "en" ? "Unknown" : "未知";
  if (!dateString) return unknown;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return unknown;
  }
};

/**
 * 格式化貨幣
 *
 * @param {number} amount - 金額
 * @returns {string} 格式化後的貨幣字串
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * 類名合併工具
 *
 * @param {...(string | undefined | null | false)[]} classes - 類名列表
 * @returns {string} 合併後的類名
 */
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * 截斷文字
 *
 * @param {string} text - 原始文字
 * @param {number} maxLength - 最大長度
 * @returns {string} 截斷後的文字
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};
