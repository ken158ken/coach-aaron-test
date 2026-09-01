/**
 * 筆記本工作區：左頁面樹 + 右編輯器
 * @module components/notes/NotesWorkspace
 *
 * 教練與客戶用的是同一支元件 —— 角色由 API 回傳的 `role` 決定，不由路由決定。
 * 雙人共筆的前提就是兩邊編輯權對等，因此樹的操作（新增／改名／搬移／刪除）
 * 兩種角色都給；只有「建立／刪除整本筆記本」是 owner 專屬。
 *
 * ## 兩種版面
 * - **獨立版**（會員端 `/notes`，預設）：自己抓樹、左側常駐頁面樹、
 *   `<lg` 收成遮罩抽屜、標頭有「返回列表」。行為與重構前完全相同。
 * - **內嵌版**（後台 `/admin/notes`，`embedded`）：頁面樹已經是外層
 *   `AdminNotesTree` 統一樹的第三層，這裡**不再畫第二棵樹**，只留標頭與編輯器；
 *   樹的狀態由外部 `controller` 傳進來，兩邊共用同一份資料源。
 */

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import PageTree from "./PageTree";
import PageEditor from "./PageEditor";
import MovePageModal from "./MovePageModal";
import { useNotebookTree, type NotebookTreeController } from "./useNotebookTree";

export interface NotesWorkspaceProps {
  notebookId: number;
  /** 回到筆記本列表（獨立版）；內嵌版不給，標頭就不顯示返回鈕 */
  onBack?: () => void;
  /**
   * 內嵌版：頁面樹交給外層統一樹顯示，這裡只留標頭 + 編輯器。
   * 一定要同時給 `controller`，否則會多抓一次樹。
   */
  embedded?: boolean;
  /** 內嵌版的樹狀態（由 `AdminNotesHome` 的 `useNotebookTree` 提供） */
  controller?: NotebookTreeController;
  /** 內嵌版 `<lg` 的「目錄」鈕 → 開外層抽屜 */
  onOpenTree?: () => void;
}

const NotesWorkspace: React.FC<NotesWorkspaceProps> = ({
  notebookId,
  onBack,
  embedded = false,
  controller,
  onOpenTree,
}) => {
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  /*
   * hook 不能條件式呼叫：有外部 controller 時傳 null 讓自己這份待命
   * （不抓、不報錯），再一律用外部那份。
   */
  const own = useNotebookTree(controller ? null : notebookId, {
    onSelect: () => setDrawerOpen(false),
  });
  const c = controller ?? own;

  /* 手機抽屜：開著時鎖背景捲動 + 吃 Escape（與 admin 側欄同一套行為） */
  useModalBehavior(drawerOpen, () => setDrawerOpen(false));

  const { tree, pages, childPages, loading, error, selectedId, busyId } = c;

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
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded border border-gold/40 px-3 py-1.5 text-gold transition-colors hover:bg-gold/10"
          >
            {t.notes.backToList}
          </button>
        )}
      </div>
    );
  }

  /*
   * 標頭與 root 看板頁的標題重複：root 頁的標題就是筆記本名（後端建立時同名
   * 寫入），所以選在 root 時上下兩行是一模一樣的字 —— 手機最明顯，桌機也有。
   * 兩顆留哪一顆：編輯器那顆是**可編輯的輸入框**（改名就在那裡改），標頭這顆
   * 只是靜態文字，所以收掉標頭這顆。選到子頁時標頭會回來，提供「現在在哪一本」
   * 的脈絡。
   */
  const titleDuplicated = selectedId !== null && selectedId === tree.notebook.rootPageId;

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
            void c.createPage(tree.notebook.rootPageId ?? pages[0]?.id ?? 0, {
              select: true,
            })
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
        onSelect={c.select}
        onAddChild={(parentId) => void c.createPage(parentId, { select: true })}
        onRename={(p) => void c.renamePage(p)}
        onMove={(p) => c.setMovingPage(p)}
        onDelete={(p) => void c.deletePage(p)}
        busyId={busyId}
      />
    </>
  );

  const editor = selectedId ? (
    <PageEditor
      key={selectedId}
      pageId={selectedId}
      childPages={childPages}
      allPages={pages}
      onTitleSaved={c.applyTitle}
      onOpenPage={c.select}
      onCreatePage={c.createPage}
      onMoveCard={c.moveCard}
    />
  ) : (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
      {t.notes.noSelection}
    </div>
  );

  return (
    <div data-tour="notes-workspace" className="flex min-h-0 flex-col">
      {/* 工作區標頭：返回 + 筆記本名 + 手機版目錄鈕 */}
      <div className="mb-3 flex items-center gap-2">
        {onBack && (
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
        )}
        {titleDuplicated ? (
          /* 收掉標頭那顆時補一格彈性空白，右邊的目錄鈕才不會被拉到左邊 */
          <span className="flex-1" aria-hidden="true" />
        ) : (
          <h2 className="min-w-0 flex-1 truncate font-display text-lg font-light tracking-wide">
            {tree.notebook.title}
          </h2>
        )}
        <button
          type="button"
          data-tour="notes-tree-toggle"
          onClick={() => (embedded ? onOpenTree?.() : setDrawerOpen(true))}
          className="shrink-0 rounded border border-gold/25 px-2.5 py-1 text-xs text-muted transition-colors hover:text-gold lg:hidden"
        >
          {t.notes.openTree}
        </button>
      </div>

      {embedded ? (
        /* 內嵌版：樹在外層統一樹裡，這裡只有編輯器 */
        <div className="min-w-0">{editor}</div>
      ) : (
        <div className="flex min-h-0 gap-4">
          {/* 桌機常駐樹 */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
              {treePanel}
            </div>
          </aside>

          {/* 編輯器 */}
          <div className="min-w-0 flex-1">{editor}</div>
        </div>
      )}

      {/* 手機抽屜（獨立版才有；內嵌版的抽屜屬於外層統一樹） */}
      {!embedded && drawerOpen && (
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

      {/*
        「移動到…」彈窗一律由這裡渲染（內嵌版也是）—— 統一樹只負責把要搬的
        頁丟進 controller，彈窗只有一個擁有者，不會疊出兩層。
      */}
      <MovePageModal
        page={c.movingPage}
        pages={pages}
        onClose={() => c.setMovingPage(null)}
        onPick={(parentId) => void c.movePageTo(parentId)}
        busy={busyId !== null}
      />
    </div>
  );
};

export default NotesWorkspace;
