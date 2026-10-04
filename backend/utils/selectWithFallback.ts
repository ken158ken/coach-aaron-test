/**
 * @fileoverview migration 還沒貼之前的「缺欄位」容錯
 *
 * 背景：DDL 只能人工貼 Supabase SQL Editor（PostgREST 跑不了 DDL），
 * 所以「程式先上線、SQL 後貼」這段空窗期一定存在。此時 select 新欄位
 * PostgREST 會回 **42703**（undefined column），寫入則回 **PGRST204**
 * （schema cache 找不到欄位）—— 絕不能讓整支 API 噴 500。
 *
 * 讀取：`selectWithFallback()` 先用完整欄位查，遇缺欄位改用舊白名單重查，
 *       再把缺的新欄位補成 null（回應形狀永遠一致，前端不用寫兩套）。
 * 寫入：`isUndefinedColumn()` + 路由回 503 + 明確提示要貼哪支 migration。
 *
 * 參考 routes/notes.ts 的 isMissingTable（039/040 同樣的空窗期問題）。
 *
 * @module utils/selectWithFallback
 */

/** PostgREST / Postgres 的「欄位不存在」錯誤 */
export function isUndefinedColumn(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null | undefined;
  if (!e) return false;
  // 42703 = Postgres undefined_column（讀取）
  // PGRST204 = PostgREST schema cache 找不到欄位（寫入）
  if (e.code === "42703" || e.code === "PGRST204") return true;
  return /column .* does not exist|could not find the '.*' column/i.test(
    e.message || "",
  );
}

/** 「資料表不存在」錯誤（traffic_events 等新表的空窗期） */
export function isUndefinedTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null | undefined;
  if (!e) return false;
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  return /relation .* does not exist|could not find the table/i.test(
    e.message || "",
  );
}

/** 欄位不存在或表不存在（兩者都代表「migration 還沒貼」） */
export function isMissingSchema(err: unknown): boolean {
  return isUndefinedColumn(err) || isUndefinedTable(err);
}

/** supabase-js 查詢結果的最小形狀 */
export interface SupabaseSelectResult<T> {
  data: T | null;
  error: { code?: string; message?: string } | null;
  count?: number | null;
}

/**
 * 把物件缺少的鍵補成 null（已存在的鍵不動，包含值為 null 的鍵）。
 * 陣列會逐列處理；null / 非物件原樣回傳。
 */
export function fillMissingFields<T>(
  data: T,
  fields: readonly string[],
): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((row) => fillMissingFields(row, fields)) as unknown as T;
  }

  if (typeof data !== "object") return data;

  const row = data as Record<string, unknown>;
  for (const field of fields) {
    if (!(field in row)) row[field] = null;
  }
  return data;
}

/**
 * 先用新欄位查，缺欄位時退回舊欄位重查，最後一律補 null。
 *
 * @param fullColumns   含新欄位的 select 字串
 * @param legacyColumns migration 貼之前一定存在的 select 字串
 * @param run           實際執行查詢（傳入 columns，回 supabase 查詢結果）
 * @param nullFields    fallback 時要補成 null 的欄位名
 * @returns 查詢結果 + `degraded`（true = 走了 fallback，代表 SQL 還沒貼）
 */
export async function selectWithFallback<T>(params: {
  fullColumns: string;
  legacyColumns: string;
  run: (columns: string) => PromiseLike<SupabaseSelectResult<T>>;
  nullFields: readonly string[];
}): Promise<SupabaseSelectResult<T> & { degraded: boolean }> {
  const { fullColumns, legacyColumns, run, nullFields } = params;

  let result = await run(fullColumns);
  let degraded = false;

  if (result.error && isUndefinedColumn(result.error)) {
    degraded = true;
    result = await run(legacyColumns);
  }

  if (!result.error && result.data) {
    fillMissingFields(result.data, nullFields);
  }

  return { ...result, degraded };
}
