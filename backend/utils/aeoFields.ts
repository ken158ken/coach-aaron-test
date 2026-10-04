/**
 * @fileoverview AEO/GEO「答案區塊」欄位定義與驗證（migration 041）
 *
 * articles / courses 共用同一組欄位（articles 另有 related_course_id）：
 *   answer_summary / _en      一句話結論（純文字 ≤ 300）
 *   key_points / _en          重點清單 string[]（≤ 12 條，各 ≤ 200）
 *   faq / _en                 [{question,answer}]（≤ 10 題，Q ≤ 200 / A ≤ 1000，純文字）
 *   related_article_ids       number[]（≤ 6）
 *   related_course_id         int|null（只有 articles 有）
 *
 * 全部欄位都是「純文字」：前端會拿去組 JSON-LD（FAQPage / Article）與 meta，
 * 所以寫入前一律 strip HTML 標籤，避免標記夾帶進結構化資料。
 *
 * @module utils/aeoFields
 */

/** articles / courses 共用的新欄位 */
export const AEO_SHARED_FIELDS = [
  "answer_summary",
  "answer_summary_en",
  "key_points",
  "key_points_en",
  "faq",
  "faq_en",
  "related_article_ids",
] as const;

/** 文章的新欄位（多一個 related_course_id） */
export const ARTICLE_AEO_FIELDS = [
  ...AEO_SHARED_FIELDS,
  "related_course_id",
] as const;

/** 課程的新欄位 */
export const COURSE_AEO_FIELDS = [...AEO_SHARED_FIELDS] as const;

/** 文章列表（公開 GET /api/articles）舊有欄位白名單 —— 041 貼之前一定存在 */
export const ARTICLE_LIST_LEGACY_COLUMNS = `
        article_id,
        author_id,
        article_title,
        article_title_en,
        article_slug,
        article_description,
        article_description_en,
        article_thumbnail_url,
        article_category,
        article_category_en,
        view_count,
        rating_average,
        rating_count,
        comment_count,
        is_featured,
        published_at,
        created_at
      `;

/** 文章列表欄位白名單 + AEO 新欄位 */
export const ARTICLE_LIST_COLUMNS = `${ARTICLE_LIST_LEGACY_COLUMNS},
        ${ARTICLE_AEO_FIELDS.join(",\n        ")}
      `;

/** 請業主貼 SQL 的統一提示（寫入端 503 用） */
export const AEO_MIGRATION_HINT =
  "AEO 答案區塊欄位尚未建立，請先在 Supabase Dashboard SQL Editor 執行 database/migrations/041_aeo_answer_blocks.sql";

/** 長度上限（契約值，前後端一致） */
export const AEO_LIMITS = {
  answerSummary: 300,
  keyPointsCount: 12,
  keyPointLength: 200,
  faqCount: 10,
  faqQuestion: 200,
  faqAnswer: 1000,
  relatedArticleIds: 6,
} as const;

/**
 * 去除 HTML 標籤與危險前綴，壓掉多餘空白（保留單一空格，不保留換行）。
 * 與 routes/landing.ts 的 cleanLine 同精神，但這裡的欄位都是單段純文字。
 */
function stripTags(input: unknown): string {
  return String(input ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 允許換行的純文字（answer_summary / faq answer 可能有段落） */
function stripTagsKeepLines(input: unknown): string {
  return String(input ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export interface AeoParseResult {
  /** 可直接展開進 insert/update 的欄位（只含請求有送的欄位） */
  updates: Record<string, unknown>;
  /** 驗證失敗訊息（有值時路由應回 400） */
  error?: string;
  /** 請求是否碰到任何 AEO 欄位（用來決定 42703 時要不要回 503） */
  touched: boolean;
}

/** 讀取 body 的欄位值，同時接受 snake_case（契約）與 camelCase（前端慣用） */
function pick(
  body: Record<string, unknown>,
  snake: string,
): { present: boolean; value: unknown } {
  const camel = snake.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
  if (Object.prototype.hasOwnProperty.call(body, snake)) {
    return { present: true, value: body[snake] };
  }
  if (Object.prototype.hasOwnProperty.call(body, camel)) {
    return { present: true, value: body[camel] };
  }
  return { present: false, value: undefined };
}

/** 空字串 / 空陣列視為「清空」→ 寫 null，避免 DB 留下 [] 與 '' 兩種空值 */
function emptyToNull<T>(value: T): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  if (Array.isArray(value) && value.length === 0) return null;
  return value;
}

/**
 * 驗證並正規化請求中的 AEO 欄位。
 *
 * @param body    req.body
 * @param variant "article"（含 related_course_id）或 "course"
 */
export function parseAeoFields(
  body: unknown,
  variant: "article" | "course",
): AeoParseResult {
  const updates: Record<string, unknown> = {};
  let touched = false;

  if (!body || typeof body !== "object") return { updates, touched };
  const src = body as Record<string, unknown>;

  const fail = (error: string): AeoParseResult => ({
    updates,
    error,
    touched: true,
  });

  // ── answer_summary / answer_summary_en ──
  for (const field of ["answer_summary", "answer_summary_en"] as const) {
    const { present, value } = pick(src, field);
    if (!present) continue;
    touched = true;
    if (value === null) {
      updates[field] = null;
      continue;
    }
    if (typeof value !== "string") {
      return fail(`${field} 必須是文字`);
    }
    const cleaned = stripTagsKeepLines(value);
    if (cleaned.length > AEO_LIMITS.answerSummary) {
      return fail(
        `${field} 最多 ${AEO_LIMITS.answerSummary} 字（目前 ${cleaned.length} 字）`,
      );
    }
    updates[field] = emptyToNull(cleaned);
  }

  // ── key_points / key_points_en ──
  for (const field of ["key_points", "key_points_en"] as const) {
    const { present, value } = pick(src, field);
    if (!present) continue;
    touched = true;
    if (value === null) {
      updates[field] = null;
      continue;
    }
    if (!Array.isArray(value)) {
      return fail(`${field} 必須是字串陣列`);
    }
    if (value.length > AEO_LIMITS.keyPointsCount) {
      return fail(`${field} 最多 ${AEO_LIMITS.keyPointsCount} 條`);
    }
    const points: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") return fail(`${field} 的每一條必須是文字`);
      const cleaned = stripTags(item);
      if (!cleaned) continue; // 空白條目直接丟掉（前端常留空輸入框）
      if (cleaned.length > AEO_LIMITS.keyPointLength) {
        return fail(`${field} 的每一條最多 ${AEO_LIMITS.keyPointLength} 字`);
      }
      points.push(cleaned);
    }
    updates[field] = emptyToNull(points);
  }

  // ── faq / faq_en ──
  for (const field of ["faq", "faq_en"] as const) {
    const { present, value } = pick(src, field);
    if (!present) continue;
    touched = true;
    if (value === null) {
      updates[field] = null;
      continue;
    }
    if (!Array.isArray(value)) {
      return fail(`${field} 必須是 [{question, answer}] 陣列`);
    }
    if (value.length > AEO_LIMITS.faqCount) {
      return fail(`${field} 最多 ${AEO_LIMITS.faqCount} 題`);
    }
    const faqs: Array<{ question: string; answer: string }> = [];
    for (const item of value) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return fail(`${field} 的每一題必須是 {question, answer} 物件`);
      }
      const row = item as Record<string, unknown>;
      if (
        (row.question !== undefined && typeof row.question !== "string") ||
        (row.answer !== undefined && typeof row.answer !== "string")
      ) {
        return fail(`${field} 的 question / answer 必須是文字`);
      }
      const question = stripTags(row.question);
      const answer = stripTagsKeepLines(row.answer);
      if (!question && !answer) continue; // 整題空白 → 丟掉
      if (!question || !answer) {
        return fail(`${field} 的每一題都要同時有 question 與 answer`);
      }
      if (question.length > AEO_LIMITS.faqQuestion) {
        return fail(`${field} 的 question 最多 ${AEO_LIMITS.faqQuestion} 字`);
      }
      if (answer.length > AEO_LIMITS.faqAnswer) {
        return fail(`${field} 的 answer 最多 ${AEO_LIMITS.faqAnswer} 字`);
      }
      faqs.push({ question, answer });
    }
    updates[field] = emptyToNull(faqs);
  }

  // ── related_article_ids ──
  {
    const { present, value } = pick(src, "related_article_ids");
    if (present) {
      touched = true;
      if (value === null) {
        updates.related_article_ids = null;
      } else if (!Array.isArray(value)) {
        return fail("related_article_ids 必須是整數陣列");
      } else {
        if (value.length > AEO_LIMITS.relatedArticleIds) {
          return fail(
            `related_article_ids 最多 ${AEO_LIMITS.relatedArticleIds} 個`,
          );
        }
        const ids: number[] = [];
        for (const item of value) {
          const n = Number(item);
          if (!Number.isInteger(n) || n <= 0) {
            return fail("related_article_ids 必須是正整數");
          }
          if (!ids.includes(n)) ids.push(n);
        }
        updates.related_article_ids = emptyToNull(ids);
      }
    }
  }

  // ── related_course_id（僅文章） ──
  if (variant === "article") {
    const { present, value } = pick(src, "related_course_id");
    if (present) {
      touched = true;
      if (value === null || value === "") {
        updates.related_course_id = null;
      } else {
        const n = Number(value);
        if (!Number.isInteger(n) || n <= 0) {
          return fail("related_course_id 必須是正整數或 null");
        }
        updates.related_course_id = n;
      }
    }
  }

  return { updates, touched };
}
