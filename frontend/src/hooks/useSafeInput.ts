/**
 * @fileoverview 安全輸入 Hook - 前端輸入消毒與驗證
 * 提供第一層防護，配合後端驗證形成多層安全機制
 *
 * @module hooks/useSafeInput
 * @description
 * 前端安全措施包括：
 * - 即時輸入驗證與消毒
 * - XSS 危險模式偵測
 * - 字元長度限制
 * - 特殊字元過濾
 * - 安全顯示內容處理
 */

import { useState, useCallback, useMemo } from "react";

/**
 * 輸入消毒選項
 */
interface SanitizeOptions {
  /** 最大長度限制 */
  maxLength?: number;
  /** 最小長度限制 */
  minLength?: number;
  /** 是否允許換行 */
  allowNewlines?: boolean;
  /** 是否進行嚴格模式（即時拒絕可疑內容） */
  strictMode?: boolean;
}

/**
 * 驗證結果
 */
interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 錯誤訊息 */
  errorMessage?: string;
  /** 字元數 */
  charCount: number;
  /** 剩餘字元數 */
  remainingChars: number;
  /** 是否偵測到威脅 */
  threatDetected?: boolean;
}

/**
 * Hook 回傳值
 */
interface UseSafeInputReturn {
  /** 當前值 */
  value: string;
  /** 設定值（經過消毒） */
  setValue: (input: string) => void;
  /** 重置值 */
  reset: () => void;
  /** 驗證結果 */
  validation: ValidationResult;
  /** 取得消毒後的值（用於提交） */
  getSanitizedValue: () => string;
  /** onChange 處理器（直接用於 textarea） */
  handleChange: (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
}

/**
 * 危險的 HTML/JavaScript 模式（前端偵測用）
 */
const DANGER_PATTERNS: RegExp[] = [
  // Script 相關
  /<script/i,
  /javascript:/i,
  /vbscript:/i,
  /on\w+\s*=/i,

  // 危險標籤
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<form/i,

  // 資料注入
  /data:\s*\w+\/\w+;base64/i,
  /expression\s*\(/i,

  // 模板注入
  /\{\{[\s\S]*?\}\}/,
  /\$\{[\s\S]*?\}/,
];

/**
 * HTML 實體編碼映射
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#x60;",
};

/**
 * 將危險字元轉換為 HTML 實體
 */
const escapeHtml = (str: string): string => {
  return str.replace(/[&<>"'`]/g, (char) => HTML_ENTITIES[char] || char);
};

/**
 * 移除 HTML 標籤
 */
const stripHtmlTags = (str: string): string => {
  return str.replace(/<[^>]+>/g, "");
};

/**
 * 檢測危險模式
 */
const detectThreats = (str: string): boolean => {
  return DANGER_PATTERNS.some((pattern) => pattern.test(str));
};

/**
 * 安全輸入 Hook
 *
 * @param initialValue - 初始值
 * @param options - 消毒選項
 * @returns Hook 回傳值
 *
 * @example
 * ```tsx
 * const {
 *   value,
 *   handleChange,
 *   validation,
 *   getSanitizedValue
 * } = useSafeInput("", { maxLength: 2000 });
 *
 * <textarea
 *   value={value}
 *   onChange={handleChange}
 *   className={validation.isValid ? "" : "border-red-500"}
 * />
 * {!validation.isValid && (
 *   <span className="text-red-500">{validation.errorMessage}</span>
 * )}
 * ```
 */
export function useSafeInput(
  initialValue: string = "",
  options: SanitizeOptions = {},
): UseSafeInputReturn {
  const {
    maxLength = 2000,
    minLength = 0,
    allowNewlines = true,
    strictMode = true,
  } = options;

  const [value, setValueState] = useState(initialValue);

  /**
   * 消毒輸入值
   */
  const sanitizeInput = useCallback(
    (input: string): string => {
      let sanitized = input;

      // 移除 null 字元和危險控制字元
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

      // 處理換行
      if (!allowNewlines) {
        sanitized = sanitized.replace(/[\r\n]+/g, " ");
      } else {
        // 標準化換行
        sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        // 限制連續換行（最多 2 個）
        sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
      }

      // 限制長度（允許用戶輸入，但標記為無效）
      if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }

      return sanitized;
    },
    [allowNewlines, maxLength],
  );

  /**
   * 驗證輸入值
   */
  const validation = useMemo((): ValidationResult => {
    const charCount = value.length;
    const remainingChars = maxLength - charCount;

    // 威脅偵測
    if (strictMode && detectThreats(value)) {
      return {
        isValid: false,
        errorMessage: "輸入內容包含不允許的字元或格式",
        charCount,
        remainingChars,
        threatDetected: true,
      };
    }

    // 長度驗證
    if (charCount > maxLength) {
      return {
        isValid: false,
        errorMessage: `已超過字數限制（${charCount}/${maxLength}）`,
        charCount,
        remainingChars,
      };
    }

    if (charCount < minLength && minLength > 0) {
      return {
        isValid: false,
        errorMessage: `至少需要 ${minLength} 個字元`,
        charCount,
        remainingChars,
      };
    }

    return {
      isValid: true,
      charCount,
      remainingChars,
    };
  }, [value, maxLength, minLength, strictMode]);

  /**
   * 設定值（經過消毒）
   */
  const setValue = useCallback(
    (input: string) => {
      const sanitized = sanitizeInput(input);
      setValueState(sanitized);
    },
    [sanitizeInput],
  );

  /**
   * 重置值
   */
  const reset = useCallback(() => {
    setValueState(initialValue);
  }, [initialValue]);

  /**
   * 取得消毒後的值（用於提交到後端）
   * 額外進行 HTML 標籤移除和實體編碼
   */
  const getSanitizedValue = useCallback((): string => {
    let sanitized = value.trim();

    // 移除 HTML 標籤
    sanitized = stripHtmlTags(sanitized);

    // HTML 實體編碼不在這裡做，讓後端處理
    // 這樣可以保留原始文字（如 < > 等符號的合法使用）

    return sanitized;
  }, [value]);

  /**
   * onChange 處理器
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  return {
    value,
    setValue,
    reset,
    validation,
    getSanitizedValue,
    handleChange,
  };
}

/**
 * 安全顯示內容 - 將資料庫內容安全地顯示在頁面上
 * 用於顯示來自 API 的用戶生成內容
 *
 * @param content - 原始內容
 * @returns 安全顯示的內容
 */
export function safeDisplayContent(content: string | null | undefined): string {
  if (!content) return "";

  // HTML 實體編碼
  let safe = escapeHtml(content);

  return safe;
}

/**
 * 將安全內容轉換為可渲染的字串陣列（處理換行）
 * 前端元件可以用這個來處理顯示
 *
 * @param content - 消毒後的內容
 * @returns 字串陣列（每個元素是一行）
 */
export function splitSafeContentLines(content: string): string[] {
  return safeDisplayContent(content).split(/\\n|\n/);
}

/**
 * 將安全內容轉換為可渲染的 React 元素（處理換行）
 * 需要在 .tsx 檔案中使用
 *
 * @param content - 消毒後的內容
 * @returns 安全顯示的內容字串
 */
export function renderSafeContent(content: string): string {
  // 簡化版本：返回消毒後的字串
  // 前端元件可以使用 CSS white-space: pre-wrap 來保留換行
  return safeDisplayContent(content);
}

/**
 * 評分輸入 Hook - 專門處理 1-5 星評分
 */
interface UseRatingInputReturn {
  rating: number;
  setRating: (value: number) => void;
  hoverRating: number;
  setHoverRating: (value: number) => void;
  isValid: boolean;
  reset: () => void;
}

/**
 * 評分輸入 Hook
 *
 * @param initialRating - 初始評分（預設 0，代表未評分）
 * @returns Hook 回傳值
 */
export function useRatingInput(
  initialRating: number = 0,
): UseRatingInputReturn {
  const [rating, setRatingState] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const setRating = useCallback((value: number) => {
    // 確保評分在有效範圍內
    const validValue = Math.max(0, Math.min(5, Math.round(value)));
    setRatingState(validValue);
  }, []);

  const isValid = useMemo(() => {
    return rating >= 1 && rating <= 5;
  }, [rating]);

  const reset = useCallback(() => {
    setRatingState(initialRating);
    setHoverRating(0);
  }, [initialRating]);

  return {
    rating,
    setRating,
    hoverRating,
    setHoverRating,
    isValid,
    reset,
  };
}

export default {
  useSafeInput,
  useRatingInput,
  safeDisplayContent,
  renderSafeContent,
};
