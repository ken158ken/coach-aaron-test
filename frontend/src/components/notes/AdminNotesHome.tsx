/**
 * 後台筆記本主視圖：左統一樹 + 右工作區
 * @module components/notes/AdminNotesHome
 *
 * 只給 `/admin/notes` 用。會員端 `/notes` 仍是 `NotesHome`（卡片牆 + 工作區），
 * 行為完全沒動 —— 客戶只看得到自己那一本，沒有「會員」這一層可言。
 *
 * ## 資料源只有一份
 * 筆記本清單在這裡抓；選中那一本的**頁面樹**由 `useNotebookTree` 持有一份，
 * 同時餵給左樹的第三層與右側的 `NotesWorkspace`（`embedded`）。這樣在編輯器
 * 改標題、在左樹新增子頁，兩邊都會即時一致，也不會出現兩棵樹。
 *
 * ## RWD
 * `≥lg` 左樹常駐（sticky）；`<lg` 收成遮罩抽屜，由工作區標頭的「目錄」鈕開啟，
 * 選到頁面後自動收起（與會員端工作區同一套行為）。
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Toast } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import {
  notesService,
  isNotesUnavailable,
  serverMessageOf,
  type NotebookSummary,
} from "@/services/notes/notes.service";
import AdminNotesTree from "./AdminNotesTree";
import NotesWorkspace from "./NotesWorkspace";
import { useNotebookTree } from "./useNotebookTree";

interface ToastState {
  id: number;
  message: string;
  type: "success" | "error" | "warning";
}

const AdminNotesHome: React.FC = () => {
  const { t } = useLanguage();
  const tp = t.adminNotesPage.tree;

  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  /** 只在「第一次成功載入」自動開第一本，之後重抓不搶使用者的選擇 */
  const [autoPicked, setAutoPicked] = useState(false);

  useModalBehavior(drawerOpen, () => setDrawerOpen(false));

  const controller = useNotebookTree(selectedId, {
    onSelect: () => setDrawerOpen(false),
  });

  const loadList = useCallback(async () => {
    setError(null);
    try {
      const res = await notesService.listNotebooks();
      setNotebooks(res.notebooks || []);
      setUnavailable(false);
    } catch (err) {
      if (isNotesUnavailable(err)) setUnavailable(true);
      else setError(serverMessageOf(err) || t.notes.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  /* 清單變動後：自動開第一本（僅首次）／選中的那本被刪掉就放掉選擇 */
  useEffect(() => {
    if (notebooks.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!autoPicked && selectedId === null) {
      setAutoPicked(true);
      setSelectedId(notebooks[0].id);
      return;
    }
    if (selectedId !== null && !notebooks.some((n) => n.id === selectedId)) {
      setSelectedId(null);
    }
  }, [notebooks, selectedId, autoPicked]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning") =>
      setToast({ id: Date.now(), message, type }),
    [],
  );

  const handleSelectNotebook = useCallback((id: number) => {
    setSelectedId(id);
    setDrawerOpen(false);
  }, []);

  const treePanel = useMemo(
    () => (
      <AdminNotesTree
        notebooks={notebooks}
        selectedNotebookId={selectedId}
        onSelectNotebook={handleSelectNotebook}
        controller={controller}
        onChanged={loadList}
        onReorderLocal={setNotebooks}
        onToast={showToast}
      />
    ),
    [notebooks, selectedId, handleSelectNotebook, controller, loadList, showToast],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        {t.common.loading}
      </div>
    );
  }

  /* 039/040 尚未貼進 Supabase —— 這不是錯誤，是「還沒開通」 */
  if (unavailable) {
    return (
      <div
        data-tour="notes-unavailable"
        className="mx-auto max-w-lg rounded-lg border border-gold/20 bg-surface p-6 text-center"
      >
        <h2 className="mb-2 font-display text-lg font-light tracking-wide">
          {t.notes.unavailableTitle}
        </h2>
        <p className="text-sm text-muted">{t.notes.unavailableBody}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-muted">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void loadList()}
          className="rounded border border-gold/40 px-3 py-1.5 text-gold transition-colors hover:bg-gold/10"
        >
          {t.notes.retry}
        </button>
      </div>
    );
  }

  return (
    <div data-tour="admin-notes-home" className="flex min-h-0 gap-4">
      {/* 桌機常駐統一樹 */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto modal-scroll pr-1">
          {treePanel}
        </div>
      </aside>

      {/* 右側：工作區（內嵌版，不再畫第二棵樹） */}
      <div className="min-w-0 flex-1">
        {selectedId !== null ? (
          <NotesWorkspace
            key={selectedId}
            notebookId={selectedId}
            embedded
            controller={controller}
            onOpenTree={() => setDrawerOpen(true)}
          />
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-muted">
            <p>{notebooks.length === 0 ? tp.empty : tp.noSelection}</p>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded border border-gold/40 px-3 py-1.5 text-gold transition-colors hover:bg-gold/10 lg:hidden"
            >
              {t.notes.openTree}
            </button>
          </div>
        )}
      </div>

      {/* 手機抽屜：統一樹 */}
      {drawerOpen && (
        <div className="fixed inset-0 modal-layer lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[90vw] overflow-y-auto modal-scroll bg-surface-2 p-3 shadow-2xl">
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

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          /* 040 那句訊息很長，不設上限會橫跨整個 admin 標頭 */
          className="max-w-sm"
          duration={toast.type === "success" ? 3000 : 6000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminNotesHome;
