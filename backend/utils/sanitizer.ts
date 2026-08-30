/**
 * @fileoverview 輸入消毒與安全驗證工具
 * 提供多層防護對抗 XSS、SQL 注入、HTML 注入等攻擊
 *
 * @module utils/sanitizer
 * @description
 * 安全措施包括：
 * - HTML 標籤移除與轉義
 * - JavaScript 注入防護
 * - SQL 關鍵字偵測
 * - 特殊字元過濾
 * - 長度限制驗證
 * - 禁止字串模式檢測
 */

import { logger } from "./logger.js";

/**
 * 消毒選項配置
 */
interface SanitizeOptions {
  /** 最大長度限制 */
  maxLength?: number;
  /** 最小長度限制 */
  minLength?: number;
  /** 是否允許換行 */
  allowNewlines?: boolean;
  /** 是否移除多餘空白 */
  trimWhitespace?: boolean;
  /** 是否允許基本標點符號 */
  allowPunctuation?: boolean;
  /** 是否進行嚴格模式（拒絕可疑內容） */
  strictMode?: boolean;
  /** 欄位名稱（用於日誌） */
  fieldName?: string;
}

/**
 * 驗證結果
 */
interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 消毒後的值 */
  sanitizedValue: string;
  /** 錯誤訊息（如果無效） */
  errorMessage?: string;
  /** 是否偵測到潛在攻擊 */
  threatDetected?: boolean;
  /** 威脅類型 */
  threatType?: string;
}

/**
 * 危險的 HTML/JavaScript 模式
 */
const DANGEROUS_PATTERNS: { pattern: RegExp; name: string }[] = [
  // Script 標籤與事件處理器
  { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi, name: "script_tag" },
  { pattern: /<script/gi, name: "script_open" },
  { pattern: /javascript:/gi, name: "javascript_protocol" },
  { pattern: /vbscript:/gi, name: "vbscript_protocol" },
  { pattern: /on\w+\s*=/gi, name: "event_handler" },

  // 危險的 HTML 標籤
  { pattern: /<iframe[\s\S]*?>/gi, name: "iframe_tag" },
  { pattern: /<object[\s\S]*?>/gi, name: "object_tag" },
  { pattern: /<embed[\s\S]*?>/gi, name: "embed_tag" },
  { pattern: /<link[\s\S]*?>/gi, name: "link_tag" },
  { pattern: /<meta[\s\S]*?>/gi, name: "meta_tag" },
  { pattern: /<style[\s\S]*?>[\s\S]*?<\/style>/gi, name: "style_tag" },
  { pattern: /<form[\s\S]*?>/gi, name: "form_tag" },
  { pattern: /<input[\s\S]*?>/gi, name: "input_tag" },
  { pattern: /<button[\s\S]*?>/gi, name: "button_tag" },

  // URL 與數據注入
  { pattern: /data:\s*\w+\/\w+;base64/gi, name: "data_uri" },
  { pattern: /expression\s*\(/gi, name: "css_expression" },
  { pattern: /url\s*\(\s*["']?\s*javascript:/gi, name: "css_javascript_url" },

  // 模板注入
  { pattern: /\{\{[\s\S]*?\}\}/g, name: "template_injection" },
  { pattern: /\$\{[\s\S]*?\}/g, name: "template_literal" },

  // SQL 注入關鍵字（嚴格模式）
  {
    pattern:
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|OR|AND)\b\s+(FROM|INTO|TABLE|DATABASE|WHERE|SET|VALUES|ALL|SELECT))/gi,
    name: "sql_injection",
  },
  { pattern: /('|")\s*(OR|AND)\s*('|")/gi, name: "sql_or_injection" },
  { pattern: /;\s*-{2}/g, name: "sql_comment" },
  { pattern: /\/\*[\s\S]*?\*\//g, name: "sql_block_comment" },
  { pattern: /\bunion\b\s+\bselect\b/gi, name: "sql_union_select" },

  // 命令注入
  { pattern: /\|\s*\w+/g, name: "pipe_command" },
  { pattern: /;\s*\w+/g, name: "semicolon_command" },
  { pattern: /`[^`]+`/g, name: "backtick_command" },
  { pattern: /\$\([^)]+\)/g, name: "shell_command_substitution" },

  // 特殊編碼攻擊
  { pattern: /&#x?[0-9a-f]+;?/gi, name: "html_entity_encoding" },
  { pattern: /%[0-9a-f]{2}/gi, name: "url_encoding" },
  { pattern: /\\u[0-9a-f]{4}/gi, name: "unicode_escape" },
  { pattern: /\\x[0-9a-f]{2}/gi, name: "hex_escape" },
];

/**
 * 基本 HTML 標籤模式（較寬鬆）
 */
const HTML_TAG_PATTERN = /<[^>]+>/g;

/**
 * HTML 實體編碼映射
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * 將危險字元轉換為 HTML 實體
 *
 * @param str - 原始字串
 * @returns 轉義後的字串
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * 移除所有 HTML 標籤
 *
 * @param str - 原始字串
 * @returns 移除標籤後的字串
 */
export function stripHtmlTags(str: string): string {
  return str.replace(HTML_TAG_PATTERN, "");
}

/**
 * 檢測危險模式
 *
 * @param str - 要檢測的字串
 * @returns 偵測結果
 */
export function detectDangerousPatterns(str: string): {
  detected: boolean;
  threats: string[];
} {
  const threats: string[] = [];

  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    // 重置正則表達式的 lastIndex
    pattern.lastIndex = 0;
    if (pattern.test(str)) {
      threats.push(name);
    }
  }

  return {
    detected: threats.length > 0,
    threats,
  };
}

/**
 * 消毒用戶輸入（評論/留言專用）
 *
 * @param input - 用戶輸入
 * @param options - 消毒選項
 * @returns 驗證結果
 */
export function sanitizeComment(
  input: unknown,
  options: SanitizeOptions = {},
): ValidationResult {
  const {
    maxLength = 2000,
    minLength = 0,
    allowNewlines = true,
    trimWhitespace = true,
    strictMode = true,
    fieldName = "comment",
  } = options;

  // 類型檢查
  if (input === null || input === undefined) {
    return {
      isValid: minLength === 0,
      sanitizedValue: "",
      errorMessage: minLength > 0 ? `${fieldName} 不可為空` : undefined,
    };
  }

  if (typeof input !== "string") {
    logger.warn(`Invalid input type for ${fieldName}:`, { type: typeof input });
    return {
      isValid: false,
      sanitizedValue: "",
      errorMessage: `${fieldName} 必須是文字`,
      threatDetected: true,
      threatType: "invalid_type",
    };
  }

  let value = input;

  // 移除 null 字元和控制字元（保留換行和 Tab）
  value = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 處理換行
  if (!allowNewlines) {
    value = value.replace(/[\r\n]+/g, " ");
  } else {
    // 標準化換行符號
    value = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // 限制連續換行（最多 2 個）
    value = value.replace(/\n{3,}/g, "\n\n");
  }

  // 移除多餘空白
  if (trimWhitespace) {
    value = value.trim();
    // 合併連續空白
    value = value.replace(/[ \t]+/g, " ");
  }

  // 檢測危險模式
  const { detected, threats } = detectDangerousPatterns(value);

  if (strictMode && detected) {
    logger.warn(`Potential security threat detected in ${fieldName}:`, {
      threats,
      inputPreview: value.substring(0, 100),
    });

    return {
      isValid: false,
      sanitizedValue: "",
      errorMessage: "輸入內容包含不允許的字元或格式",
      threatDetected: true,
      threatType: threats.join(", "),
    };
  }

  // 移除 HTML 標籤
  value = stripHtmlTags(value);

  // HTML 實體編碼
  value = escapeHtml(value);

  // 長度驗證
  if (value.length > maxLength) {
    return {
      isValid: false,
      sanitizedValue: value.substring(0, maxLength),
      errorMessage: `${fieldName} 不可超過 ${maxLength} 字元`,
    };
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      sanitizedValue: value,
      errorMessage: `${fieldName} 至少需要 ${minLength} 字元`,
    };
  }

  return {
    isValid: true,
    sanitizedValue: value,
  };
}

/**
 * 消毒評分輸入
 *
 * @param rating - 評分值
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export function sanitizeRating(
  rating: unknown,
  fieldName = "rating",
): ValidationResult {
  // 類型檢查
  if (rating === null || rating === undefined) {
    return {
      isValid: false,
      sanitizedValue: "0",
      errorMessage: `${fieldName} 不可為空`,
    };
  }

  const numRating = Number(rating);

  // 數字驗證
  if (isNaN(numRating)) {
    logger.warn(`Invalid rating type:`, { rating, type: typeof rating });
    return {
      isValid: false,
      sanitizedValue: "0",
      errorMessage: `${fieldName} 必須是數字`,
      threatDetected: true,
      threatType: "invalid_type",
    };
  }

  // 範圍驗證
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return {
      isValid: false,
      sanitizedValue: String(Math.max(1, Math.min(5, Math.round(numRating)))),
      errorMessage: `${fieldName} 必須是 1-5 之間的整數`,
    };
  }

  return {
    isValid: true,
    sanitizedValue: String(numRating),
  };
}

/**
 * 消毒整數 ID
 *
 * @param id - ID 值
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export function sanitizeId(
  id: unknown,
  fieldName = "id",
): ValidationResult & { numericValue: number } {
  // 類型檢查
  if (id === null || id === undefined) {
    return {
      isValid: false,
      sanitizedValue: "0",
      numericValue: 0,
      errorMessage: `${fieldName} 不可為空`,
    };
  }

  const numId = Number(id);

  // 數字驗證
  if (isNaN(numId) || !Number.isInteger(numId) || numId < 1) {
    logger.warn(`Invalid ID:`, { id, type: typeof id });
    return {
      isValid: false,
      sanitizedValue: "0",
      numericValue: 0,
      errorMessage: `${fieldName} 必須是正整數`,
      threatDetected: true,
      threatType: "invalid_id",
    };
  }

  // 防止整數溢位
  if (numId > Number.MAX_SAFE_INTEGER) {
    return {
      isValid: false,
      sanitizedValue: "0",
      numericValue: 0,
      errorMessage: `${fieldName} 超出有效範圍`,
      threatDetected: true,
      threatType: "integer_overflow",
    };
  }

  return {
    isValid: true,
    sanitizedValue: String(numId),
    numericValue: numId,
  };
}

/**
 * 安全地顯示用戶生成內容（用於 API 回應）
 * 確保資料庫中的內容安全顯示
 *
 * @param content - 資料庫中的內容
 * @returns 安全顯示的內容
 */
export function safeDisplayContent(content: string | null | undefined): string {
  if (!content) return "";

  // 再次進行 HTML 實體編碼（雙重防護）
  let safe = escapeHtml(content);

  // 將換行轉換為安全的表示
  // 前端可以決定如何呈現（例如轉換為 <br> 或保留）
  safe = safe.replace(/\n/g, "\\n");

  return safe;
}

/**
 * 建立安全的 API 回應
 *
 * @param data - 原始資料
 * @param contentFields - 需要消毒的欄位名稱
 * @returns 安全的資料
 */
export function sanitizeApiResponse<T extends Record<string, unknown>>(
  data: T,
  contentFields: string[] = ["content", "comment", "description"],
): T {
  const sanitized: Record<string, unknown> = { ...data };

  for (const field of contentFields) {
    if (field in sanitized && typeof sanitized[field] === "string") {
      sanitized[field] = safeDisplayContent(sanitized[field] as string);
    }
  }

  return sanitized as T;
}

/**
 * 批量消毒 API 回應陣列
 *
 * @param dataArray - 資料陣列
 * @param contentFields - 需要消毒的欄位名稱
 * @returns 安全的資料陣列
 */
export function sanitizeApiResponseArray<T extends Record<string, unknown>>(
  dataArray: T[],
  contentFields: string[] = ["content", "comment", "description"],
): T[] {
  return dataArray.map((item) => sanitizeApiResponse(item, contentFields));
}

/**
 * 記錄安全事件
 *
 * @param eventType - 事件類型
 * @param details - 事件詳情
 */
export function logSecurityEvent(
  eventType: string,
  details: Record<string, unknown>,
): void {
  logger.warn(`[SECURITY] ${eventType}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * 搜尋查詢消毒
 * 移除危險字元，僅保留合法搜尋內容
 *
 * @param query - 原始搜尋字串
 * @param maxLength - 最大長度
 * @returns 消毒後的搜尋字串
 */
export function sanitizeSearchQuery(
  query: unknown,
  maxLength: number = 100,
): string {
  if (typeof query !== "string") {
    return "";
  }

  let sanitized = query
    .trim()
    // 移除 SQL 通配符
    .replace(/[%_]/g, "")
    // 移除 HTML 標籤
    .replace(/<[^>]*>/g, "")
    // 移除危險字元
    .replace(/['"`;\\]/g, "")
    // 移除 PostgREST .or()/.ilike() 的中繼字元：逗號=條件分隔、括號=分組、
    //   點=欄位/運算子分隔。不移除會被注入額外過濾條件（列舉草稿/他表資料）
    .replace(/[,()]/g, "")
    // 移除多餘空白
    .replace(/\s+/g, " ");

  // 長度限制
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

export default {
  escapeHtml,
  stripHtmlTags,
  detectDangerousPatterns,
  sanitizeComment,
  sanitizeRating,
  sanitizeId,
  safeDisplayContent,
  sanitizeApiResponse,
  sanitizeApiResponseArray,
  logSecurityEvent,
  sanitizeSearchQuery,
};
