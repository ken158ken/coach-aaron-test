/**
 * 「移動到…」選單 —— 本批用來取代拖拉搬移
 * @module components/notes/MovePageModal
 *
 * 後端 `POST /api/notes/pages/:id/move` 會擋掉三種非法搬移（root、移到自己、
 * 移進自己的子樹），這裡先在清單就把它們濾掉：讓使用者根本點不到，
 * 而不是點了才吃 400。
 */

import React, { useMemo } from "react";
import { Modal } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import type { NotePageNode } from "@/services/notes/notes.service";

export interface MovePageModalProps {
  /** 要搬移的頁；null = 關閉 */
  page: NotePageNode | null;
  pages: NotePageNode[];
  onClose: () => void;
  onPick: (parentId: number) => void;
  busy?: boolean;
}

/** 目標清單的一列（含縮排層級） */
interface Candidate {
  page: NotePageNode;
  depth: number;
}

/**
 * 以 parent_id 走訪整棵樹，排除「自己與自己的所有子孫」，
 * 順便算出縮排深度，讓選單長得跟左側樹一樣好認。
 */
function buildCandidates(pages: NotePageNode[], movingId: number): Candidate[] {
  const byParent = new Map<number | null, NotePageNode[]>();
  for (const p of pages) {
    const list = byParent.get(p.parent_id);
    if (list) list.push(p);
    else byParent.set(p.parent_id, [p]);
  }

  const out: Candidate[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const child of byParent.get(parentId) || []) {
      // 自己（連同整個子樹）不可能是自己的新父頁
      if (child.id === movingId) continue;
      out.push({ page: child, depth });
      walk(child.id, depth + 1);
    }
  };
  walk(null, 0);
  // 目前的父頁不移除、只在 UI 上標記並停用，讓使用者看得出「現在在這裡」
  return out;
}

const MovePageModal: React.FC<MovePageModalProps> = ({
  page,
  pages,
  onClose,
  onPick,
  busy = false,
}) => {
  const { t } = useLanguage();

  const candidates = useMemo(
    () => (page ? buildCandidates(pages, page.id) : []),
    [page, pages],
  );

  if (!page) return null;

  return (
    <Modal
      isOpen={!!page}
      onClose={onClose}
      title={t.notes.moveTitle}
      size="md"
      tourId="notes-move"
    >
      <p className="mb-3 text-sm text-muted">
        {t.notes.moveHint.replace("{name}", page.title?.trim() || t.notes.untitled)}
      </p>
      <ul className="max-h-[50vh] overflow-y-auto modal-scroll">
        {candidates.map(({ page: cand, depth }) => {
          const isCurrentParent = cand.id === page.parent_id;
          return (
            <li key={cand.id}>
              <button
                type="button"
                disabled={busy || isCurrentParent}
                onClick={() => onPick(cand.id)}
                style={{ paddingLeft: `${0.5 + depth * 0.9}rem` }}
                className={`flex w-full items-center gap-2 rounded py-2 pr-2 text-left text-sm transition-colors ${
                  isCurrentParent
                    ? "cursor-default text-muted opacity-60"
                    : "hover:bg-gold/10 hover:text-gold"
                }`}
              >
                <span className="truncate">
                  {cand.title?.trim() || t.notes.untitled}
                </span>
                {isCurrentParent && (
                  <span className="ml-auto shrink-0 text-[11px] uppercase tracking-wider">
                    {t.notes.moveCurrentParent}
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {candidates.length === 0 && (
          <li className="py-4 text-sm text-muted">{t.notes.moveNoTarget}</li>
        )}
      </ul>
    </Modal>
  );
};

export default MovePageModal;
