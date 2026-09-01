/**
 * 一本筆記本的頁面樹狀態與操作（工作區與後台統一樹共用的唯一資料源）
 * @module components/notes/useNotebookTree
 *
 * 原本這整包狀態長在 `NotesWorkspace` 裡。後台改成「會員 → 筆記本 → 頁面」
 * 三層統一樹之後，**左邊的頁面樹跟右邊的編輯器不再是同一個元件**，
 * 若兩邊各抓一次 `getTree` 就會出現兩份會走鐘的狀態（在編輯器裡改標題，
 * 左樹不會動；在左樹新增子頁，右邊看板不會出現）。
 *
 * 因此把狀態提到這支 hook：
 *   - 會員端 `/notes`：`NotesWorkspace` 自己呼叫（行為與抽出前完全相同）
 *   - 後台 `/admin/notes`：`AdminNotesHome` 呼叫一次，同時餵給左樹與工作區
 *
 * `notebookId` 傳 `null` = 待命（不抓、不報錯）——`NotesWorkspace` 收到外部
 * controller 時就是這樣把自己那份關掉的（hook 不能條件式呼叫）。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
  notesService,
  isNotesUnavailable,
  serverMessageOf,
  type NotePageNode,
  type NoteTreeResponse,
} from "@/services/notes/notes.service";
import type { CreatePageOptions } from "./PageEditor";

export interface NotebookTreeController {
  notebookId: number | null;
  tree: NoteTreeResponse | null;
  pages: NotePageNode[];
  /** 目前選取頁的直屬子頁（database 看板的卡片） */
  childPages: NotePageNode[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
  /** 正在處理中的頁 id（新增子頁 / 改名 / 刪除），該列動作暫時鎖住 */
  busyId: number | null;
  /** 「移動到…」彈窗的對象（null = 未開啟） */
  movingPage: NotePageNode | null;
  setMovingPage: (page: NotePageNode | null) => void;
  /** 選一頁（會回報給呼叫端做手機抽屜收合等副作用） */
  select: (pageId: number) => void;
  reload: (opts?: { select?: number }) => Promise<void>;
  createPage: (
    parentId: number,
    opts?: CreatePageOptions,
  ) => Promise<NotePageNode | null>;
  renamePage: (page: NotePageNode) => Promise<void>;
  deletePage: (page: NotePageNode) => Promise<void>;
  /** 「移動到…」彈窗選定新上層頁 */
  movePageTo: (parentId: number) => Promise<void>;
  /** 看板卡片換分類／換位置 */
  moveCard: (
    cardId: number,
    categoryId: string | null,
    sortOrder?: number,
  ) => Promise<void>;
  /** 編輯器裡改完標題 → 同步樹（不重抓） */
  applyTitle: (pageId: number, title: string) => void;
}

export function useNotebookTree(
  notebookId: number | null,
  opts: { onSelect?: () => void } = {},
): NotebookTreeController {
  const { t } = useLanguage();
  const dialog = useDialog();
  const { onSelect } = opts;

  const [tree, setTree] = useState<NoteTreeResponse | null>(null);
  const [loading, setLoading] = useState(notebookId !== null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [movingPage, setMovingPage] = useState<NotePageNode | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // ── 載入頁面樹 ────────────────────────────────────────
  const reload = useCallback(
    async (o: { select?: number } = {}) => {
      if (notebookId === null) return;
      setError(null);
      try {
        const res = await notesService.getTree(notebookId);
        setTree(res);
        setSelectedId((prev) => {
          if (o.select) return o.select;
          // 原本選的頁還在 → 保持；不在（被刪了）→ 回 root
          if (prev && res.pages.some((p) => p.id === prev)) return prev;
          return res.notebook.rootPageId ?? res.pages[0]?.id ?? null;
        });
      } catch (err) {
        setError(
          isNotesUnavailable(err)
            ? t.notes.unavailableBody
            : serverMessageOf(err) || t.notes.loadFailed,
        );
      } finally {
        setLoading(false);
      }
    },
    [notebookId, t],
  );

  useEffect(() => {
    if (notebookId === null) {
      setTree(null);
      setSelectedId(null);
      setLoading(false);
      setError(null);
      return;
    }
    /* 換筆記本 → 先把上一本的樹清掉，否則會閃一下別人的目錄 */
    setTree(null);
    setSelectedId(null);
    setLoading(true);
    void reload();
  }, [notebookId, reload]);

  const pages = useMemo(() => tree?.pages ?? [], [tree]);

  const childPages = useMemo(
    () => pages.filter((p) => p.parent_id === selectedId),
    [pages, selectedId],
  );

  // ── 樹操作 ────────────────────────────────────────────
  const select = useCallback(
    (id: number) => {
      setSelectedId(id);
      onSelect?.();
    },
    [onSelect],
  );

  /**
   * 建立子頁 —— 頁面樹的「＋」、看板每欄的「＋ 新增」、編輯器 slash 選單的
   * 「子頁面／資料庫」全走這一支，**樹的資料源只有這裡一個**。
   *
   * 建完一律 `reload()` 再回傳：slash 插入的 `pageLink` block 需要樹裡已經
   * 有這一頁，才不會在掛上的瞬間顯示成「已刪除的頁面」。
   *
   * @returns 建立好的節點；失敗回 null（已彈訊息，呼叫端不必再報一次）
   */
  const createPage = useCallback(
    async (
      parentId: number,
      o: CreatePageOptions = {},
    ): Promise<NotePageNode | null> => {
      if (notebookId === null) return null;
      setBusyId(parentId);
      try {
        const created = await notesService.createPage({
          notebookId,
          parentId,
          title: o.title ?? "",
          ...(o.type ? { type: o.type } : {}),
          ...(o.categoryId !== undefined ? { categoryId: o.categoryId } : {}),
        });
        await reload(o.select ? { select: created.id } : {});
        if (o.select) onSelect?.();
        return created;
      } catch (err) {
        await dialog.alert({
          title: t.notes.addChildFailed,
          message: serverMessageOf(err) || "",
        });
        return null;
      } finally {
        setBusyId(null);
      }
    },
    [notebookId, reload, dialog, t, onSelect],
  );

  /**
   * 看板卡片換分類／換位置。
   *
   * `category_id` 與 `sort_order` 都在頁面樹節點上，所以成功後就地改本地狀態
   * 即可（不必重抓整棵樹）—— 拖曳要即時回饋，多一次往返會看到卡片彈回去。
   */
  const moveCard = useCallback(
    async (
      cardId: number,
      categoryId: string | null,
      sortOrder?: number,
    ): Promise<void> => {
      try {
        await notesService.updatePageMeta(cardId, {
          categoryId,
          ...(sortOrder === undefined ? {} : { sortOrder }),
        });
        setTree((prev) =>
          prev
            ? {
                ...prev,
                pages: prev.pages
                  .map((p) =>
                    p.id === cardId
                      ? {
                          ...p,
                          category_id: categoryId,
                          sort_order: sortOrder ?? p.sort_order,
                        }
                      : p,
                  )
                  // 樹與看板都吃 API 的 sort_order 升冪順序，改完要補排
                  .sort((a, b) => a.sort_order - b.sort_order),
              }
            : prev,
        );
      } catch (err) {
        await dialog.alert({
          title: t.notes.board.moveFailed,
          message: serverMessageOf(err) || "",
        });
      }
    },
    [dialog, t],
  );

  const renamePage = useCallback(
    async (page: NotePageNode) => {
      const next = await dialog.prompt({
        title: t.notes.renameTitle,
        message: t.notes.renameMessage,
        defaultValue: page.title || "",
        placeholder: t.notes.titlePlaceholder,
      });
      if (next === null) return;
      setBusyId(page.id);
      try {
        await notesService.updatePageMeta(page.id, { title: next });
        setTree((prev) =>
          prev
            ? {
                ...prev,
                pages: prev.pages.map((p) =>
                  p.id === page.id ? { ...p, title: next } : p,
                ),
              }
            : prev,
        );
      } catch (err) {
        await dialog.alert({
          title: t.notes.renameFailed,
          message: serverMessageOf(err) || "",
        });
      } finally {
        setBusyId(null);
      }
    },
    [dialog, t],
  );

  const movePageTo = useCallback(
    async (parentId: number) => {
      if (!movingPage) return;
      setBusyId(movingPage.id);
      try {
        await notesService.movePage(movingPage.id, parentId);
        setMovingPage(null);
        await reload();
      } catch (err) {
        await dialog.alert({
          title: t.notes.moveFailed,
          message: serverMessageOf(err) || "",
        });
      } finally {
        setBusyId(null);
      }
    },
    [movingPage, reload, dialog, t],
  );

  const deletePage = useCallback(
    async (page: NotePageNode) => {
      const ok = await dialog.confirm({
        title: t.notes.deleteTitle,
        message: t.notes.deleteMessage.replace(
          "{name}",
          page.title?.trim() || t.notes.untitled,
        ),
        confirmText: t.notes.deleteConfirm,
        variant: "danger",
      });
      if (!ok) return;
      setBusyId(page.id);
      try {
        await notesService.deletePage(page.id);
        setSelectedId((prev) => (prev === page.id ? null : prev));
        await reload();
      } catch (err) {
        await dialog.alert({
          title: t.notes.deleteFailed,
          message: serverMessageOf(err) || "",
        });
      } finally {
        setBusyId(null);
      }
    },
    [dialog, t, reload],
  );

  /** 標題在編輯器裡改完 → 同步樹，不必重抓整棵樹 */
  const applyTitle = useCallback((pageId: number, title: string) => {
    setTree((prev) =>
      prev
        ? {
            ...prev,
            pages: prev.pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
          }
        : prev,
    );
  }, []);

  return {
    notebookId,
    tree,
    pages,
    childPages,
    loading,
    error,
    selectedId,
    busyId,
    movingPage,
    setMovingPage,
    select,
    reload,
    createPage,
    renamePage,
    deletePage,
    movePageTo,
    moveCard,
    applyTitle,
  };
}

export default useNotebookTree;
