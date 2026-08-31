/**
 * 筆記本工作區：左頁面樹 + 右編輯器
 * @module components/notes/NotesWorkspace
 *
 * 教練（/admin/notes）與客戶（/notes）用的是同一支元件 —— 角色由 API 回傳的
 * `role` 決定，不由路由決定。雙人共筆的前提就是兩邊編輯權對等，因此樹的操作
 * （新增／改名／搬移／刪除）兩種角色都給；只有「建立／刪除整本筆記本」是
 * owner 專屬，那些留在 NotebookList。
 *
 * RWD：≥lg 左樹常駐；<lg 收成遮罩抽屜（點頁面後自動收起）。
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import {
  notesService,
  isNotesUnavailable,
  serverMessageOf,
  type NotePageNode,
  type NoteTreeResponse,
} from "@/services/notes/notes.service";
import PageTree from "./PageTree";
import PageEditor from "./PageEditor";
import MovePageModal from "./MovePageModal";

export interface NotesWorkspaceProps {
  notebookId: number;
  /** 回到筆記本列表 */
  onBack: () => void;
}

const NotesWorkspace: React.FC<NotesWorkspaceProps> = ({ notebookId, onBack }) => {
  const { t } = useLanguage();
  const dialog = useDialog();

  const [tree, setTree] = useState<NoteTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [movingPage, setMovingPage] = useState<NotePageNode | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  /* 手機抽屜：開著時鎖背景捲動 + 吃 Escape（與 admin 側欄同一套行為） */
  useModalBehavior(drawerOpen, () => setDrawerOpen(false));

  // ── 載入頁面樹 ────────────────────────────────────────
  const loadTree = useCallback(
    async (opts: { select?: number } = {}) => {
      setError(null);
      try {
        const res = await notesService.getTree(notebookId);
        setTree(res);
        setSelectedId((prev) => {
          if (opts.select) return opts.select;
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
    setLoading(true);
    void loadTree();
  }, [loadTree]);

  const pages = tree?.pages ?? [];

  /** 目前選取頁的直屬子頁（database 佔位卡片牆用） */
  const childPages = useMemo(
    () => pages.filter((p) => p.parent_id === selectedId),
    [pages, selectedId],
  );

  // ── 樹操作 ────────────────────────────────────────────
  const handleSelect = useCallback((id: number) => {
    setSelectedId(id);
    setDrawerOpen(false);
  }, []);

  const handleAddChild = useCallback(
    async (parentId: number) => {
      setBusyId(parentId);
      try {
        const created = await notesService.createPage({
          notebookId,
          parentId,
          title: "",
        });
        await loadTree({ select: created.id });
        setDrawerOpen(false);
      } catch (err) {
        await dialog.alert({
          title: t.notes.addChildFailed,
          message: serverMessageOf(err) || "",
        });
      } finally {
        setBusyId(null);
      }
    },
    [notebookId, loadTree, dialog, t],
  );

  const handleRename = useCallback(
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

  const handleMovePick = useCallback(
    async (parentId: number) => {
      if (!movingPage) return;
      setBusyId(movingPage.id);
      try {
        await notesService.movePage(movingPage.id, parentId);
        setMovingPage(null);
        await loadTree();
      } catch (err) {
        await dialog.alert({
          title: t.notes.moveFailed,
          message: serverMessageOf(err) || "",
        });
      } finally {
        setBusyId(null);
      }
    },
    [movingPage, loadTree, dialog, t],
  );

  const handleDelete = useCallback(
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
        if (selectedId === page.id) setSelectedId(null);
        await loadTree();
      } catch (err) {
        await dialog.alert({
          title: t.notes.deleteFailed,
          message: serverMessageOf(err) || "",
        });
      } finally {
        setBusyId(null);
      }
    },
    [dialog, t, selectedId, loadTree],
  );

  /** 標題在編輯器裡改完 → 同步左側樹，不必重抓整棵樹 */
  const handleTitleSaved = useCallback((pageId: number, title: string) => {
    setTree((prev) =>
      prev
        ? {
            ...prev,
            pages: prev.pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
          }
        : prev,
    );
  }, []);

  // ── 畫面 ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        {t.common.loading}
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-muted">
        <p>{error || t.notes.loadFailed}</p>
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-gold/40 px-3 py-1.5 text-gold transition-colors hover:bg-gold/10"
        >
          {t.notes.backToList}
        </button>
      </div>
    );
  }

  const treePanel = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="text-xs uppercase tracking-widest text-muted">
          {t.notes.pagesHeading}
        </span>
        <button
          type="button"
          data-tour="notes-add-root-child"
          onClick={() =>
            void handleAddChild(tree.notebook.rootPageId ?? pages[0]?.id ?? 0)
          }
          className="rounded p-1 text-muted transition-colors hover:text-gold"
          title={t.notes.addChild}
          aria-label={t.notes.addChild}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
      <PageTree
        pages={pages}
        rootId={tree.notebook.rootPageId}
        selectedId={selectedId}
        onSelect={handleSelect}
        onAddChild={(id) => void handleAddChild(id)}
        onRename={(p) => void handleRename(p)}
        onMove={(p) => setMovingPage(p)}
        onDelete={(p) => void handleDelete(p)}
        busyId={busyId}
      />
    </>
  );

  return (
    <div data-tour="notes-workspace" className="flex min-h-0 flex-col">
      {/* 工作區標頭：返回 + 筆記本名 + 手機版目錄鈕 */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded p-1.5 text-muted transition-colors hover:text-gold"
          aria-label={t.notes.backToList}
          title={t.notes.backToList}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
        </button>
        <h2 className="min-w-0 flex-1 truncate font-display text-lg font-light tracking-wide">
          {tree.notebook.title}
        </h2>
        <button
          type="button"
          data-tour="notes-tree-toggle"
          onClick={() => setDrawerOpen(true)}
          className="shrink-0 rounded border border-gold/25 px-2.5 py-1 text-xs text-muted transition-colors hover:text-gold lg:hidden"
        >
          {t.notes.openTree}
        </button>
      </div>

      <div className="flex min-h-0 gap-4">
        {/* 桌機常駐樹 */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            {treePanel}
          </div>
        </aside>

        {/* 編輯器 */}
        <div className="min-w-0 flex-1">
          {selectedId ? (
            <PageEditor
              key={selectedId}
              pageId={selectedId}
              childPages={childPages}
              onTitleSaved={handleTitleSaved}
              onOpenPage={handleSelect}
              onAddChild={(id) => void handleAddChild(id)}
            />
          ) : (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
              {t.notes.noSelection}
            </div>
          )}
        </div>
      </div>

      {/* 手機抽屜 */}
      {drawerOpen && (
        <div className="fixed inset-0 modal-layer lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto modal-scroll bg-surface-2 p-3 shadow-2xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded p-1 text-muted transition-colors hover:text-gold"
                aria-label={t.notes.closeTree}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {treePanel}
          </div>
        </div>
      )}

      <MovePageModal
        page={movingPage}
        pages={pages}
        onClose={() => setMovingPage(null)}
        onPick={(parentId) => void handleMovePick(parentId)}
        busy={busyId !== null}
      />
    </div>
  );
};

export default NotesWorkspace;
