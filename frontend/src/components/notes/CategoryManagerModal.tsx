/**
 * 看板分類管理（新增／改名／改色／排序／刪除）
 * @module components/notes/CategoryManagerModal
 *
 * 分類是 database 頁自己的 `categories` 欄位（有序陣列），所以任何一種
 * 編輯最後都是同一個動作：`PATCH /pages/:id { categories }`。
 *
 * 這裡刻意採「草稿 + 一次存檔」而不是「每動一下打一次 API」：
 *   - 排序是相對關係，逐次寫回會在慢網路下看到欄位跳來跳去；
 *   - metadata 是 last-write-wins，打越多次就越容易蓋掉對方（雙人共筆）。
 * 因此按下「儲存」才送出唯一一次 PATCH。
 *
 * ⚠️ 刪除分類**不搬資料**（後端也沒有這種端點）：子頁的 `category_id`
 *    會變成懸空 id，看板把它們一起歸到「未分類」欄。確認框要講清楚這件事，
 *    否則使用者會以為卡片跟著不見了。
 */

import React, { useCallback, useEffect, useState } from "react";
import { Modal, useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import type { NoteCategory } from "@/services/notes/notes.service";
import {
  CATEGORY_COLORS,
  newCategoryId,
  safeCategoryColor,
} from "./categoryColors";

/** 後端 LIMITS：categoriesMax / categoryName（超過會回 400） */
const MAX_CATEGORIES = 50;
const MAX_NAME_LEN = 50;

export interface CategoryManagerModalProps {
  isOpen: boolean;
  /** 目前的分類（開啟當下複製成草稿） */
  categories: NoteCategory[];
  onClose: () => void;
  /** 儲存 → 呼叫端負責 PATCH；throw 代表失敗，彈窗不關 */
  onSave: (categories: NoteCategory[]) => Promise<void>;
}

const Icon: React.FC<{ path: string; className?: string }> = ({
  path,
  className = "h-4 w-4",
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

const ICON_LEFT = "M15 19l-7-7 7-7";
const ICON_RIGHT = "M9 5l7 7-7 7";
const ICON_TRASH =
  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";
const ICON_PLUS = "M12 4v16m8-8H4";

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const dialog = useDialog();

  const [draft, setDraft] = useState<NoteCategory[]>(categories);
  const [paletteFor, setPaletteFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* 每次開啟都從最新的 props 重新複製草稿（關掉＝丟棄未存的修改） */
  useEffect(() => {
    if (!isOpen) return;
    setDraft(categories.map((c) => ({ ...c })));
    setPaletteFor(null);
    setError(null);
  }, [isOpen, categories]);

  const patchRow = useCallback((id: string, patch: Partial<NoteCategory>) => {
    setDraft((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const move = useCallback((index: number, delta: number) => {
    setDraft((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return next;
    });
  }, []);

  const add = useCallback(() => {
    setDraft((prev) => {
      if (prev.length >= MAX_CATEGORIES) return prev;
      return [
        ...prev,
        {
          id: newCategoryId(),
          name: "",
          // 依序輪替色票，讓連續新增的分類天生就不同色
          color: CATEGORY_COLORS[prev.length % CATEGORY_COLORS.length],
        },
      ];
    });
    setError(null);
  }, []);

  const remove = useCallback(
    async (row: NoteCategory) => {
      const ok = await dialog.confirm({
        title: t.notes.cat.removeConfirmTitle,
        message: t.notes.cat.removeConfirmMessage.replace(
          "{name}",
          row.name.trim() || t.notes.cat.unnamed,
        ),
        confirmText: t.notes.cat.removeConfirmText,
        variant: "danger",
      });
      if (!ok) return;
      setDraft((prev) => prev.filter((c) => c.id !== row.id));
    },
    [dialog, t],
  );

  const save = useCallback(async () => {
    const cleaned = draft.map((c) => ({
      id: c.id,
      name: c.name.trim().slice(0, MAX_NAME_LEN),
      color: safeCategoryColor(c.color),
    }));
    if (cleaned.some((c) => !c.name)) {
      setError(t.notes.cat.nameRequired);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(cleaned);
      onClose();
    } catch {
      setError(t.notes.cat.saveFailed);
    } finally {
      setSaving(false);
    }
  }, [draft, onSave, onClose, t]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      title={t.notes.cat.title}
      size="lg"
      tourId="notes-categories"
    >
      <p className="mb-3 text-sm text-muted">{t.notes.cat.hint}</p>

      <ul className="max-h-[46vh] space-y-2 overflow-y-auto modal-scroll pr-1">
        {draft.map((row, i) => {
          const color = safeCategoryColor(row.color);
          const open = paletteFor === row.id;
          return (
            <li
              key={row.id}
              className="rounded-lg border border-gold/15 bg-surface-2 p-2"
            >
              <div className="flex items-center gap-2">
                {/* 色點 = 展開色票 */}
                <button
                  type="button"
                  onClick={() => setPaletteFor(open ? null : row.id)}
                  aria-expanded={open}
                  aria-label={t.notes.cat.color}
                  title={t.notes.cat.color}
                  className="h-6 w-6 shrink-0 rounded-full border border-black/20 transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                />
                <input
                  value={row.name}
                  maxLength={MAX_NAME_LEN}
                  onChange={(e) => patchRow(row.id, { name: e.target.value })}
                  placeholder={t.notes.cat.namePlaceholder}
                  aria-label={t.notes.cat.namePlaceholder}
                  className="min-w-0 flex-1 rounded border border-gold/20 bg-surface px-2 py-1.5 text-sm text-inherit outline-none placeholder:text-muted focus:border-gold/50"
                />
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    title={t.notes.cat.moveLeft}
                    aria-label={t.notes.cat.moveLeft}
                    className="rounded p-1.5 text-muted transition-colors hover:text-gold disabled:opacity-30"
                  >
                    <Icon path={ICON_LEFT} />
                  </button>
                  <button
                    type="button"
                    disabled={i === draft.length - 1}
                    onClick={() => move(i, 1)}
                    title={t.notes.cat.moveRight}
                    aria-label={t.notes.cat.moveRight}
                    className="rounded p-1.5 text-muted transition-colors hover:text-gold disabled:opacity-30"
                  >
                    <Icon path={ICON_RIGHT} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    title={t.notes.cat.remove}
                    aria-label={t.notes.cat.remove}
                    className="rounded p-1.5 text-muted transition-colors hover:text-red-400"
                  >
                    <Icon path={ICON_TRASH} />
                  </button>
                </div>
              </div>

              {open && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gold/10 pt-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        patchRow(row.id, { color: c });
                        setPaletteFor(null);
                      }}
                      aria-label={c}
                      title={c}
                      className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
                        c === color ? "border-gold ring-2 ring-gold/40" : "border-black/20"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}

        {draft.length === 0 && (
          <li className="py-4 text-center text-sm text-muted">
            {t.notes.cat.empty}
          </li>
        )}
      </ul>

      <button
        type="button"
        onClick={add}
        disabled={draft.length >= MAX_CATEGORIES}
        data-tour="notes-category-add"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gold/30 py-2 text-sm text-muted transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
      >
        <Icon path={ICON_PLUS} />
        {draft.length >= MAX_CATEGORIES ? t.notes.cat.limitReached : t.notes.cat.add}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2 border-t border-gold/10 pt-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded border border-gold/25 px-4 py-1.5 text-sm text-muted transition-colors hover:text-gold disabled:opacity-50"
        >
          {t.notes.cat.cancel}
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded border border-gold/50 bg-gold/10 px-4 py-1.5 text-sm text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
        >
          {saving ? t.notes.cat.saving : t.notes.cat.save}
        </button>
      </div>
    </Modal>
  );
};

export default CategoryManagerModal;
