/**
 * database 頁的「子頁清單」佔位畫面
 * @module components/notes/DatabasePagePlaceholder
 *
 * 每本筆記本的 root 都是 `type: "database"`（Notion 用法的季方案看板）。
 * **本批（N2）先渲染成子頁卡片牆**：能點開、能新增子頁，結構與資料完全
 * 是最終版的樣子，下一批只要把這支元件換成真正的看板（分類欄位、拖拉分組）
 * 即可，PageEditor 那側的分岔點與 props 不需要改。
 *
 * 因此這裡刻意**不**把 `categories` 畫出來 —— 分類的互動是下一批的事，
 * 現在畫一半反而會讓使用者以為壞掉。
 */

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import type { NotePageNode } from "@/services/notes/notes.service";

export interface DatabasePagePlaceholderProps {
  pageId: number;
  childPages: NotePageNode[];
  onOpenPage: (pageId: number) => void;
  onAddChild: (parentId: number) => void;
}

const DatabasePagePlaceholder: React.FC<DatabasePagePlaceholderProps> = ({
  pageId,
  childPages,
  onOpenPage,
  onAddChild,
}) => {
  const { t } = useLanguage();

  return (
    <div data-tour="notes-database-board">
      {/* 「看板即將推出」說明條 —— 明講現在看到的是暫時樣貌 */}
      <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-sm text-muted">
        {t.notes.dbComingSoon}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {childPages.map((child) => (
          <button
            key={child.id}
            type="button"
            data-tour="notes-database-card"
            onClick={() => onOpenPage(child.id)}
            className="group flex min-h-24 flex-col rounded-lg border border-gold/15 bg-surface p-4 text-left transition-colors hover:border-gold/40 hover:bg-gold/5"
          >
            <span className="mb-1 flex items-center gap-2 text-sm text-inherit">
              {child.icon && (
                <span aria-hidden="true" className="leading-none">
                  {child.icon}
                </span>
              )}
              <span className="truncate font-medium">
                {child.title?.trim() || t.notes.untitled}
              </span>
            </span>
            <span className="mt-auto text-xs text-muted">
              {child.type === "database" ? t.notes.typeDatabase : t.notes.typePage}
            </span>
          </button>
        ))}

        {/* 新增子頁卡 */}
        <button
          type="button"
          data-tour="notes-database-add"
          onClick={() => onAddChild(pageId)}
          className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-gold/25 p-4 text-sm text-muted transition-colors hover:border-gold/50 hover:text-gold"
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
          {t.notes.dbAddCard}
        </button>
      </div>

      {childPages.length === 0 && (
        <p className="mt-4 text-sm text-muted">{t.notes.dbEmpty}</p>
      )}
    </div>
  );
};

export default DatabasePagePlaceholder;
