/**
 * 筆記本卡片牆（會員端 /notes 的列表視圖）
 * @module components/notes/NotebookList
 *
 * 角色由 `GET /api/notes/notebooks` 回傳的 `role` 決定，不看路由：
 *   - owner（教練／admin）→ 看得到全部，可建立／刪除筆記本
 *   - client（買課客戶）→ 只有自己那本（後端已依 user_courses 授權過濾）
 *
 * 後台 `/admin/notes` 已改用 `AdminNotesHome` 的三層統一樹，這支只剩會員端
 * 在用（owner 從 `/notes` 進來仍會看到全部，行為維持原樣）。
 * 建立彈窗抽到 `CreateNotebookModal`，與後台樹的「建立筆記本」共用同一份。
 */

import React, { useCallback, useMemo, useState } from "react";
import { useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
  notesService,
  isNotesUnavailable,
  serverMessageOf,
  type NotebookSummary,
  type NoteRole,
} from "@/services/notes/notes.service";
import CreateNotebookModal from "./CreateNotebookModal";

export interface NotebookListProps {
  notebooks: NotebookSummary[];
  role: NoteRole;
  onOpen: (notebookId: number) => void;
  /** 建立／刪除後請呼叫端重抓列表 */
  onChanged: () => void | Promise<void>;
}

const NotebookList: React.FC<NotebookListProps> = ({
  notebooks,
  role,
  onOpen,
  onChanged,
}) => {
  const { t, language } = useLanguage();
  const dialog = useDialog();
  const [showCreate, setShowCreate] = useState(false);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    [language],
  );

  const remove = useCallback(
    async (nb: NotebookSummary) => {
      const ok = await dialog.confirm({
        title: t.notes.del.confirmTitle,
        message: t.notes.del.confirmMessage.replace("{name}", nb.title),
        confirmText: t.notes.del.confirmText,
        variant: "danger",
      });
      if (!ok) return;
      try {
        await notesService.deleteNotebook(nb.id);
        await onChanged();
      } catch (err) {
        await dialog.alert({
          title: isNotesUnavailable(err)
            ? t.notes.unavailableTitle
            : t.notes.del.failed,
          message: serverMessageOf(err) || "",
        });
      }
    },
    [dialog, t, onChanged],
  );

  return (
    <div data-tour="notes-notebook-list">
      {role === "owner" && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            data-tour="notes-create-button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            {t.notes.create.button}
          </button>
        </div>
      )}

      {notebooks.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          {role === "owner" ? t.notes.listEmptyOwner : t.notes.listEmptyClient}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {notebooks.map((nb) => (
            <li
              key={nb.id}
              data-tour="notes-notebook-card"
              className="flex flex-col rounded-lg border border-gold/15 bg-surface p-4 transition-colors hover:border-gold/40"
            >
              <button
                type="button"
                onClick={() => onOpen(nb.id)}
                className="flex-1 text-left"
              >
                <h3 className="mb-1 truncate font-display text-base font-light tracking-wide">
                  {nb.title}
                </h3>
                <p className="truncate text-xs text-muted">
                  {t.notes.cardCourse}：{nb.courseTitle || "—"}
                </p>
                {role === "owner" && (
                  <p className="truncate text-xs text-muted">
                    {t.notes.cardClient}：{nb.clientName || "—"}
                  </p>
                )}
              </button>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-gold/10 pt-2">
                <span className="text-[11px] text-muted">
                  {t.notes.cardUpdated}
                  {nb.updatedAt ? dateFmt.format(new Date(nb.updatedAt)) : "—"}
                </span>
                {role === "owner" && (
                  <button
                    type="button"
                    onClick={() => void remove(nb)}
                    className="text-xs text-muted transition-colors hover:text-red-400"
                  >
                    {t.notes.del.button}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {role === "owner" && (
        <CreateNotebookModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={onChanged}
        />
      )}
    </div>
  );
};

export default NotebookList;
