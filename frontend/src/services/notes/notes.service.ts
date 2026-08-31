/**
 * 客戶筆記本服務（阿倫 × 客戶「雙人共筆」）
 * @module services/notes/notes.service
 *
 * 對應後端 `backend/routes/notes.ts`（contract 固定，前端不得自行擴充端點）。
 *
 * 兩個角色共用同一組端點，回應中的 `role` 決定 UI：
 *   - owner  = 教練本人／admin：看得到所有筆記本，可建立／刪除筆記本
 *   - client = 買了該課程的客戶：只看得到自己那本，內容編輯權與教練同等
 *
 * ⚠️ 樂觀鎖：**只有 content 更新**要帶 `version`（撞寫回 409）；
 *    metadata（標題／icon／分類／排序）是 last-write-wins，不動 version ——
 *    否則對方改個標題就會讓這邊的自動儲存誤撞 409。
 *
 * ⚠️ 039_client_notes.sql 尚未貼進 Supabase 時，所有端點回 503（後端刻意給的
 *    明確訊息），呼叫端用 `isNotesUnavailable()` 判斷並顯示「尚未啟用」畫面，
 *    而不是把 503 當成一般錯誤閃紅字。
 */

import { get, post, patch, del } from "../api";

/** 呼叫者對筆記本的角色 */
export type NoteRole = "owner" | "client";

/** 頁面型別：一般頁 / 看板頁（root 一律是 database） */
export type NotePageType = "page" | "database";

/**
 * BlockNote 的 block JSON。
 *
 * 刻意**不** import `@blocknote/core` 的 `PartialBlock` —— 這支服務會被
 * 筆記本列表（無編輯器）引用，型別 import 雖然會被編譯器抹除，但一旦有人
 * 手滑改成值 import，整包編輯器就會被拖進共用 chunk。編輯器那側再做斷言即可。
 */
export type NoteBlock = Record<string, unknown>;

/**
 * database 頁的分類定義（看板的「欄」，有序）。
 *
 * 只存在 database 頁自己的 `categories` 欄位；子頁用 `category_id` 對應。
 * **刪除分類不做資料遷移** —— 子頁的 category_id 會變成懸空 id，
 * 看板一律把「null 或對不到任何分類」的卡片歸到最後一欄「未分類」。
 */
export interface NoteCategory {
  id: string;
  name: string;
  color: string;
}

/** 筆記本列表的單筆 */
export interface NotebookSummary {
  id: number;
  title: string;
  rootPageId: number | null;
  courseId: number;
  courseTitle: string;
  clientUserId: number;
  clientName: string;
  updatedAt: string;
}

export interface NotebookListResponse {
  role: NoteRole;
  notebooks: NotebookSummary[];
}

/** 頁面樹節點（輕量，不含 content） */
export interface NotePageNode {
  id: number;
  parent_id: number | null;
  type: NotePageType;
  title: string;
  icon: string | null;
  category_id: string | null;
  sort_order: number;
  version: number;
  updated_at: string;
}

export interface NoteTreeResponse {
  role: NoteRole;
  notebook: {
    id: number;
    title: string;
    rootPageId: number | null;
    courseId: number;
    clientUserId: number;
  };
  pages: NotePageNode[];
}

/** 單頁完整內容 */
export interface NotePageDetail extends NotePageNode {
  notebook_id: number;
  ancestors: number[];
  content: NoteBlock[] | null;
  categories: NoteCategory[] | null;
  updated_by: number | null;
}

export interface NotePageResponse {
  role: NoteRole;
  page: NotePageDetail;
}

/** PATCH content 成功後的回應（新版本號） */
export interface NoteSaveResult {
  id: number;
  version: number;
  updated_at: string;
}

/** 建立筆記本的 payload */
export interface CreateNotebookInput {
  clientUserId: number;
  courseId: number;
  title: string;
}

/** 建立子頁的 payload */
export interface CreatePageInput {
  notebookId: number;
  parentId: number;
  type?: NotePageType;
  title?: string;
  sortOrder?: number;
  /** 看板「＋ 新增」時直接落在該欄（database 子頁專用） */
  categoryId?: string | null;
}

/** 可自由更新的 metadata（不動 version） */
export interface UpdatePageMetaInput {
  title?: string;
  icon?: string | null;
  categoryId?: string | null;
  sortOrder?: number;
  /**
   * 看板欄位定義。**只有 `type === "database"` 的頁能設**
   * （後端對一般頁回 400「只有 database 頁可設定 categories」）。
   */
  categories?: NoteCategory[];
}

/** axios 錯誤的最小形狀（避免在服務層 import axios 型別） */
interface HttpErrorLike {
  response?: {
    status?: number;
    data?: { error?: string; currentVersion?: number | null };
  };
}

const asHttpError = (err: unknown): HttpErrorLike =>
  (err && typeof err === "object" ? err : {}) as HttpErrorLike;

/** HTTP 狀態碼（拿不到時回 0） */
export const httpStatusOf = (err: unknown): number =>
  asHttpError(err).response?.status ?? 0;

/**
 * 是不是「筆記本資料表還沒建立」（039 migration 未貼）。
 * 後端對這種情況統一回 503，UI 應顯示「尚未啟用」而非錯誤。
 */
export const isNotesUnavailable = (err: unknown): boolean =>
  httpStatusOf(err) === 503;

/**
 * 是不是樂觀鎖撞寫（對方先存了）。
 * @returns 撞寫時回 `{ currentVersion }`；否則 null
 */
export function asVersionConflict(
  err: unknown,
): { currentVersion: number | null } | null {
  const e = asHttpError(err);
  if (e.response?.status !== 409) return null;
  const v = e.response?.data?.currentVersion;
  return { currentVersion: typeof v === "number" ? v : null };
}

/** 後端回的中文錯誤訊息（沒有就 null，由呼叫端用字典 fallback） */
export const serverMessageOf = (err: unknown): string | null =>
  asHttpError(err).response?.data?.error ?? null;

export const notesService = {
  // ── 筆記本 ────────────────────────────────────────────
  listNotebooks: (): Promise<NotebookListResponse> =>
    get<NotebookListResponse>("/api/notes/notebooks"),

  createNotebook: (input: CreateNotebookInput): Promise<{ id: number }> =>
    post<{ id: number }>("/api/notes/notebooks", input),

  deleteNotebook: (id: number): Promise<{ ok: boolean }> =>
    del<{ ok: boolean }>(`/api/notes/notebooks/${id}`),

  getTree: (notebookId: number): Promise<NoteTreeResponse> =>
    get<NoteTreeResponse>(`/api/notes/notebooks/${notebookId}/tree`),

  // ── 頁面 ──────────────────────────────────────────────
  getPage: (pageId: number): Promise<NotePageResponse> =>
    get<NotePageResponse>(`/api/notes/pages/${pageId}`),

  createPage: (input: CreatePageInput): Promise<NotePageNode> =>
    post<NotePageNode>("/api/notes/pages", input),

  /** metadata 更新（不帶 version，last-write-wins） */
  updatePageMeta: (
    pageId: number,
    input: UpdatePageMetaInput,
  ): Promise<NoteSaveResult> =>
    patch<NoteSaveResult>(`/api/notes/pages/${pageId}`, input),

  /** content 更新（必帶當前 version，撞寫回 409） */
  updatePageContent: (
    pageId: number,
    content: NoteBlock[],
    version: number,
  ): Promise<NoteSaveResult> =>
    patch<NoteSaveResult>(`/api/notes/pages/${pageId}`, { content, version }),

  movePage: (
    pageId: number,
    parentId: number,
    sortOrder?: number,
  ): Promise<{ ok: boolean; movedSubtreePages: number }> =>
    post<{ ok: boolean; movedSubtreePages: number }>(
      `/api/notes/pages/${pageId}/move`,
      sortOrder === undefined ? { parentId } : { parentId, sortOrder },
    ),

  deletePage: (pageId: number): Promise<{ ok: boolean }> =>
    del<{ ok: boolean }>(`/api/notes/pages/${pageId}`),

  // ── 管理：手動開通課程授權（金流未接前的 fake 購買）────
  grantCourse: (
    userId: number,
    courseId: number,
  ): Promise<{ ok: boolean; granted?: boolean; reactivated?: boolean }> =>
    post<{ ok: boolean; granted?: boolean; reactivated?: boolean }>(
      "/api/notes/admin/grant-course",
      { userId, courseId },
    ),
};

export default notesService;
