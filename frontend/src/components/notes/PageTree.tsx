/**
 * 筆記本頁面樹（巢狀縮排 / 展開收合 / 每列動作）
 * @module components/notes/PageTree
 *
 * 教練與客戶看到的是同一棵樹、同一組動作（雙人共筆，兩邊權限對等），
 * 差別只有 root 頁：root 不可搬移、不可刪除（後端也會擋，這裡先把鈕收起來）。
 *
 * 本批**不做 dnd**：搬移走「移動到…」選單（MovePageModal），
 * 觸控裝置上反而比拖拉可靠。sort_order 由後端預設 `Date.now()`，
 * 同層即「建立順序」由舊到新。
 */

import React, { useCallback, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import type { NotePageNode } from "@/services/notes/notes.service";

export interface PageTreeProps {
  pages: NotePageNode[];
  rootId: number | null;
  selectedId: number | null;
  onSelect: (pageId: number) => void;
  onAddChild: (parentId: number) => void;
  onRename: (page: NotePageNode) => void;
  onMove: (page: NotePageNode) => void;
  onDelete: (page: NotePageNode) => void;
  /** 正在處理中的頁 id（新增子頁 / 刪除），該列動作暫時鎖住 */
  busyId?: number | null;
}

/** parent_id → 子節點（已依 sort_order 升冪，沿用 API 回傳順序） */
function groupByParent(pages: NotePageNode[]): Map<number | null, NotePageNode[]> {
  const map = new Map<number | null, NotePageNode[]>();
  for (const p of pages) {
    const key = p.parent_id;
    const list = map.get(key);
    if (list) list.push(p);
    else map.set(key, [p]);
  }
  return map;
}

/** 小圖示（統一 14px stroke icon，避免拉進 react-icons） */
const Icon: React.FC<{ path: string; className?: string }> = ({
  path,
  className = "w-3.5 h-3.5",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const ICON_PLUS = "M12 4v16m8-8H4";
const ICON_PENCIL =
  "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z";
const ICON_MOVE = "M4 6h16M4 12h16M4 18h7m4 3l4-4-4-4";
const ICON_TRASH =
  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";
const ICON_DB =
  "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z";
const ICON_DOC =
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

const PageTree: React.FC<PageTreeProps> = ({
  pages,
  rootId,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onMove,
  onDelete,
  busyId = null,
}) => {
  const { t } = useLanguage();
  /* 預設全展開；只記「被收起來的」，新增的子頁才會自動可見 */
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());

  const byParent = useMemo(() => groupByParent(pages), [pages]);

  const toggle = useCallback((id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderRow = (page: NotePageNode, depth: number): React.ReactNode => {
    const children = byParent.get(page.id) || [];
    const isRoot = page.parent_id === null;
    const isOpen = !collapsed.has(page.id);
    const isSelected = selectedId === page.id;
    const busy = busyId === page.id;
    const label = page.title?.trim() || t.notes.untitled;

    return (
      <li key={page.id}>
        <div
          data-tour={isRoot ? "notes-tree-root" : undefined}
          className={`group flex items-center gap-1 rounded pr-1 transition-colors ${
            isSelected ? "bg-gold/15 text-gold" : "hover:bg-gold/5 text-muted"
          }`}
          style={{ paddingLeft: `${depth * 0.75}rem` }}
        >
          {/* 展開／收合（無子頁時留一格空位，讓標題對齊） */}
          {children.length > 0 ? (
            <button
              type="button"
              onClick={() => toggle(page.id)}
              aria-label={isOpen ? t.notes.collapse : t.notes.expand}
              aria-expanded={isOpen}
              className="shrink-0 p-1 hover:text-gold transition-colors"
            >
              <Icon
                path="M9 5l7 7-7 7"
                className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
            </button>
          ) : (
            <span className="shrink-0 w-5" aria-hidden="true" />
          )}

          {/* 標題（點擊 = 開啟該頁） */}
          <button
            type="button"
            onClick={() => onSelect(page.id)}
            aria-current={isSelected ? "page" : undefined}
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm"
          >
            <span className="shrink-0 opacity-70" aria-hidden="true">
              {page.icon ? (
                <span className="text-sm leading-none">{page.icon}</span>
              ) : (
                <Icon path={page.type === "database" ? ICON_DB : ICON_DOC} />
              )}
            </span>
            <span className="truncate">{label}</span>
          </button>

          {/*
            每列動作。桌機 hover / 鍵盤 focus 才浮現（focus-within 讓 Tab
            也叫得出來）；觸控裝置沒有 hover，所以 <lg 一律顯示。
          */}
          <span className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
            <button
              type="button"
              disabled={busy}
              onClick={() => onAddChild(page.id)}
              title={t.notes.addChild}
              aria-label={t.notes.addChild}
              className="p-1 hover:text-gold transition-colors disabled:opacity-40"
            >
              <Icon path={ICON_PLUS} />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onRename(page)}
              title={t.notes.rename}
              aria-label={t.notes.rename}
              className="p-1 hover:text-gold transition-colors disabled:opacity-40"
            >
              <Icon path={ICON_PENCIL} />
            </button>
            {!isRoot && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onMove(page)}
                  title={t.notes.moveTo}
                  aria-label={t.notes.moveTo}
                  className="p-1 hover:text-gold transition-colors disabled:opacity-40"
                >
                  <Icon path={ICON_MOVE} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(page)}
                  title={t.notes.deletePage}
                  aria-label={t.notes.deletePage}
                  className="p-1 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <Icon path={ICON_TRASH} />
                </button>
              </>
            )}
          </span>
        </div>

        {children.length > 0 && isOpen && (
          <ul>{children.map((c) => renderRow(c, depth + 1))}</ul>
        )}
      </li>
    );
  };

  const roots = useMemo(() => {
    if (rootId !== null) {
      const root = pages.find((p) => p.id === rootId);
      if (root) return [root];
    }
    // root 缺失（理論上不會）→ 退回所有 parent_id 為 null 的頁
    return byParent.get(null) || [];
  }, [pages, rootId, byParent]);

  if (pages.length === 0) {
    return <p className="px-2 py-4 text-sm text-muted">{t.notes.treeEmpty}</p>;
  }

  return (
    <ul data-tour="notes-page-tree" className="select-none">
      {roots.map((r) => renderRow(r, 0))}
    </ul>
  );
};

export default PageTree;
