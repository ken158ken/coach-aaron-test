/**
 * 後台統一樹：會員 → 筆記本 → 頁面（三層）
 * @module components/notes/AdminNotesTree
 *
 * 業主 2026-09-01 的需求：左側要先看到「所有建立過筆記本的會員」，會員底下
 * 才是他的筆記本，筆記本底下才是頁面樹。取代原本的卡片牆（`NotebookList`
 * 只剩會員端 `/notes` 在用）。
 *
 * ## 三層
 * 1. **會員** —— 依 `clientName` 排序，右側 badge 是筆記本數，可收合。
 * 2. **筆記本** —— 📓 + 標題 + 課程名小字。點擊＝在右側開這一本的工作區，
 *    同時把它的頁面樹展開在原地。
 * 3. **頁面** —— 直接重用 `PageTree`（新增／改名／移動／刪除全照舊）。
 *
 * ### 為什麼「展開＝開啟」（同時只展開一本）
 * 頁面樹的資料源是 `useNotebookTree`（由 `AdminNotesHome` 持有一份，左樹與
 * 右側編輯器共用）。若允許同時展開多本，就得為每一本各抓一次 `getTree`、
 * 各自維護一份會走鐘的狀態 —— 在編輯器改標題時，另外那幾棵樹就會顯示舊名。
 * 一次只展開「正在編輯的那一本」可以讓樹與編輯器**永遠是同一份資料**，
 * 也少掉 serverless 冷啟動下的連續往返。
 *
 * ## 拖曳（原生 HTML5，不加新依賴，同 `DatabaseBoard` 手法）
 * - 拖到**別的會員**分組 → 整組高亮 → 放下彈確認 modal → `PATCH {clientUserId}`
 *   （可勾「順便開通課程授權」）；撞唯一索引回 409，直接顯示後端訊息。
 * - 拖到**同會員內**另一位置 → 插入線 → `PATCH {sortOrder}`（前後鄰居中點，
 *   算法與看板共用 `./sortOrder`）；040 未貼時後端回 503，還原順序並提示。
 * - 觸控裝置沒有 HTML5 dnd → 每本另給「⋯」選單：轉移給…／上移／下移。
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal, useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
  notesService,
  isNotesUnavailable,
  isNotebookSortUnavailable,
  serverMessageOf,
  type NotebookSummary,
} from "@/services/notes/notes.service";
import PageTree from "./PageTree";
import CreateNotebookModal from "./CreateNotebookModal";
import { sortOrderForIndex } from "./sortOrder";
import type { NotebookTreeController } from "./useNotebookTree";

/** 一位會員 + 他名下的筆記本（維持 API 回傳的組內順序） */
export interface MemberGroup {
  userId: number;
  name: string;
  notebooks: NotebookSummary[];
}

/**
 * 拖曳落點。
 * `index === null` = 落在「別的會員」整組上（轉移）；
 * 數字 = 同會員內要插進第幾個位置（排序）。
 */
interface DropTarget {
  userId: number;
  index: number | null;
}

/** 待確認的轉移（放下後彈 modal） */
interface PendingTransfer {
  notebook: NotebookSummary;
  target: MemberGroup;
}

export interface AdminNotesTreeProps {
  notebooks: NotebookSummary[];
  /** 目前開在右側的筆記本 */
  selectedNotebookId: number | null;
  /** 選一本 → 右側開工作區 + 原地展開頁面樹 */
  onSelectNotebook: (notebookId: number) => void;
  /** 選中那一本的頁面樹狀態（第三層直接用它渲染，與右側編輯器同源） */
  controller: NotebookTreeController;
  /** 建立／刪除／轉移／排序之後重抓筆記本清單 */
  onChanged: () => void | Promise<void>;
  /** 樂觀排序：先就地換位，失敗再還原（父層持有清單） */
  onReorderLocal: (notebooks: NotebookSummary[]) => void;
  /** 成功／失敗提示（父層畫 Toast） */
  onToast: (message: string, type: "success" | "error" | "warning") => void;
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

const ICON_CHEVRON = "M9 5l7 7-7 7";
const ICON_DOTS = "M12 5v.01M12 12v.01M12 19v.01";
const ICON_PENCIL =
  "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z";
const ICON_TRASH =
  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";
const ICON_USER =
  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z";

/** 依會員分組；組間依名稱排序，組內維持 API 順序（sort_order / updated_at） */
export function groupByMember(
  notebooks: NotebookSummary[],
  language: string,
): MemberGroup[] {
  const map = new Map<number, MemberGroup>();
  for (const nb of notebooks) {
    const g = map.get(nb.clientUserId);
    if (g) g.notebooks.push(nb);
    else
      map.set(nb.clientUserId, {
        userId: nb.clientUserId,
        name: nb.clientName || "",
        notebooks: [nb],
      });
  }
  const collator = new Intl.Collator(language === "en" ? "en" : "zh-Hant");
  return [...map.values()].sort((a, b) => collator.compare(a.name, b.name));
}

const AdminNotesTree: React.FC<AdminNotesTreeProps> = ({
  notebooks,
  selectedNotebookId,
  onSelectNotebook,
  controller,
  onChanged,
  onReorderLocal,
  onToast,
}) => {
  const { t, language } = useLanguage();
  const tp = t.adminNotesPage.tree;
  const dialog = useDialog();

  const [showCreate, setShowCreate] = useState(false);
  /* 只記「被收起來的會員」，新建立的筆記本所屬會員預設是展開的 */
  const [collapsedMembers, setCollapsedMembers] = useState<Set<number>>(
    () => new Set(),
  );
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(
    null,
  );
  const [menuNotebook, setMenuNotebook] = useState<NotebookSummary | null>(null);
  const [transferPick, setTransferPick] = useState<NotebookSummary | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [grantOnTransfer, setGrantOnTransfer] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  /** dragover 期間 dataTransfer 讀不到資料，只能自己記（同 DatabaseBoard） */
  const dragIdRef = useRef<number | null>(null);

  const groups = useMemo(
    () => groupByMember(notebooks, language),
    [notebooks, language],
  );

  const draggedNotebook = useMemo(
    () => (dragId === null ? null : notebooks.find((n) => n.id === dragId) ?? null),
    [dragId, notebooks],
  );

  const toggleMember = useCallback((userId: number) => {
    setCollapsedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const clearDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    setDropTarget(null);
  }, []);

  // ── 排序（同會員內）────────────────────────────────────
  /**
   * 把 `nb` 移到同會員清單的第 `index` 個位置。
   * 先樂觀就地換位（拖曳要即時回饋），失敗再把整份清單還原。
   */
  const reorder = useCallback(
    async (nb: NotebookSummary, group: MemberGroup, index: number) => {
      const others = group.notebooks.filter((n) => n.id !== nb.id);
      const currentIndex = group.notebooks.findIndex((n) => n.id === nb.id);
      const slot = Math.max(0, Math.min(index, others.length));
      if (currentIndex === slot) return;

      /* sortOrder 為 null（040 未貼）時用目前位置當替身，算得出值就好 ——
         真正的把關在後端，那邊會回 503。 */
      const orders = others.map((n, i) => n.sortOrder ?? i);
      const nextOrder = sortOrderForIndex(orders, slot);

      const snapshot = notebooks;
      const reordered = [...others];
      reordered.splice(slot, 0, { ...nb, sortOrder: nextOrder });
      onReorderLocal([
        ...notebooks.filter((n) => n.clientUserId !== group.userId),
        ...reordered,
      ]);

      setBusyId(nb.id);
      try {
        await notesService.updateNotebook(nb.id, { sortOrder: nextOrder });
        await onChanged();
      } catch (err) {
        onReorderLocal(snapshot);
        onToast(
          isNotebookSortUnavailable(err)
            ? tp.reorderMigration
            : serverMessageOf(err) || tp.reorderFailed,
          "error",
        );
      } finally {
        setBusyId(null);
      }
    },
    [notebooks, onReorderLocal, onChanged, onToast, tp],
  );

  /** 手機「⋯」選單的上移／下移（走同一支 reorder） */
  const nudge = useCallback(
    (nb: NotebookSummary, delta: -1 | 1) => {
      const group = groups.find((g) => g.userId === nb.clientUserId);
      if (!group) return;
      const at = group.notebooks.findIndex((n) => n.id === nb.id);
      const to = at + delta;
      if (at < 0 || to < 0 || to >= group.notebooks.length) return;
      /* 往下移時落點是「排掉自己之後」的索引，所以 +1 要多算一格 */
      void reorder(nb, group, delta === 1 ? to + 1 : to);
    },
    [groups, reorder],
  );

  // ── 轉移（跨會員）──────────────────────────────────────
  const submitTransfer = useCallback(async () => {
    if (!pendingTransfer) return;
    const { notebook, target } = pendingTransfer;
    setTransferring(true);
    setTransferError(null);
    try {
      await notesService.updateNotebook(notebook.id, {
        clientUserId: target.userId,
        ...(grantOnTransfer ? { grantCourse: true } : {}),
      });
      setPendingTransfer(null);
      await onChanged();
      onToast(
        tp.transferred
          .replace("{name}", notebook.title)
          .replace("{client}", target.name || String(target.userId)),
        "success",
      );
    } catch (err) {
      /* 409「目標會員已有此課程的筆記本」等 → 就地顯示後端訊息，不關 modal */
      setTransferError(
        isNotesUnavailable(err)
          ? t.notes.unavailableBody
          : serverMessageOf(err) || tp.transferFailed,
      );
    } finally {
      setTransferring(false);
    }
  }, [pendingTransfer, grantOnTransfer, onChanged, onToast, tp, t]);

  const openTransfer = useCallback(
    (notebook: NotebookSummary, target: MemberGroup) => {
      setGrantOnTransfer(true);
      setTransferError(null);
      setPendingTransfer({ notebook, target });
    },
    [],
  );

  // ── 拖曳事件 ──────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, nb: NotebookSummary) => {
    e.dataTransfer.effectAllowed = "move";
    // Firefox 不設 data 就不會開始拖曳；Safari 偶爾 throw，包起來即可
    try {
      e.dataTransfer.setData("text/plain", String(nb.id));
    } catch {
      /* 忽略：dragIdRef 才是真正的來源 */
    }
    dragIdRef.current = nb.id;
    setDragId(nb.id);
  }, []);

  const markDropTarget = useCallback(
    (e: React.DragEvent, userId: number, index: number | null) => {
      if (dragIdRef.current === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTarget((prev) =>
        prev && prev.userId === userId && prev.index === index
          ? prev
          : { userId, index },
      );
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, group: MemberGroup) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("text/plain");
      const id = dragIdRef.current ?? (raw ? Number(raw) : Number.NaN);
      const target = dropTarget;
      clearDrag();
      if (!Number.isFinite(id)) return;
      const nb = notebooks.find((n) => n.id === id);
      if (!nb) return;

      if (nb.clientUserId !== group.userId) {
        openTransfer(nb, group);
        return;
      }
      /* 落點索引是對「畫面上的清單」算的，排掉自己之後要往前挪一格 */
      const at = group.notebooks.findIndex((n) => n.id === nb.id);
      let index =
        target && target.userId === group.userId && target.index !== null
          ? target.index
          : group.notebooks.length;
      if (at !== -1 && at < index) index -= 1;
      void reorder(nb, group, index);
    },
    [dropTarget, clearDrag, notebooks, openTransfer, reorder],
  );

  // ── 筆記本改名／刪除 ──────────────────────────────────
  const renameNotebook = useCallback(
    async (nb: NotebookSummary) => {
      const next = await dialog.prompt({
        title: tp.renameTitle,
        message: tp.renameMessage,
        defaultValue: nb.title,
        placeholder: t.notes.create.titlePlaceholder,
      });
      if (next === null || !next.trim() || next.trim() === nb.title) return;
      setBusyId(nb.id);
      try {
        await notesService.updateNotebook(nb.id, { title: next.trim() });
        await onChanged();
        /* 標題也是 root 頁的名字來源之一，開著的話順手重抓一次樹 */
        if (selectedNotebookId === nb.id) await controller.reload();
      } catch (err) {
        onToast(serverMessageOf(err) || tp.renameFailed, "error");
      } finally {
        setBusyId(null);
      }
    },
    [dialog, tp, t, onChanged, onToast, selectedNotebookId, controller],
  );

  const removeNotebook = useCallback(
    async (nb: NotebookSummary) => {
      const ok = await dialog.confirm({
        title: t.notes.del.confirmTitle,
        message: t.notes.del.confirmMessage.replace("{name}", nb.title),
        confirmText: t.notes.del.confirmText,
        variant: "danger",
      });
      if (!ok) return;
      setBusyId(nb.id);
      try {
        await notesService.deleteNotebook(nb.id);
        await onChanged();
      } catch (err) {
        onToast(
          isNotesUnavailable(err)
            ? t.notes.unavailableBody
            : serverMessageOf(err) || t.notes.del.failed,
          "error",
        );
      } finally {
        setBusyId(null);
      }
    },
    [dialog, t, onChanged, onToast],
  );

  /** 「轉移給…」清單：其他建立過筆記本的會員 */
  const transferTargets = useMemo(
    () =>
      transferPick
        ? groups.filter((g) => g.userId !== transferPick.clientUserId)
        : [],
    [groups, transferPick],
  );

  // ── 畫面 ──────────────────────────────────────────────
  return (
    <div data-tour="admin-notes-tree" className="flex min-h-0 flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        {/* 英文標題較長，讓它換行而不是截斷（側欄只有 w-72） */}
        <span className="min-w-0 flex-1 text-xs leading-snug uppercase tracking-widest text-muted">
          {tp.heading}
        </span>
        <button
          type="button"
          data-tour="notes-create-button"
          onClick={() => setShowCreate(true)}
          className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90"
        >
          {t.notes.create.button}
        </button>
      </div>

      {/* 拖曳提示：手機沒有 HTML5 拖曳事件，改指路到「⋯」選單 */}
      <p className="mb-2 px-1 text-[11px] leading-snug text-muted">
        <span className="hidden lg:inline">{tp.dragHint}</span>
        <span className="lg:hidden">{tp.dragHintMobile}</span>
      </p>

      {groups.length === 0 ? (
        <p className="px-1 py-8 text-sm text-muted">{tp.empty}</p>
      ) : (
        <ul className="select-none space-y-1">
          {groups.map((group) => {
            const open = !collapsedMembers.has(group.userId);
            const isDropGroup =
              dragId !== null &&
              dropTarget?.userId === group.userId &&
              dropTarget.index === null;
            return (
              <li
                key={group.userId}
                data-tour="admin-notes-member"
                data-member-id={group.userId}
                onDragOver={(e) =>
                  markDropTarget(
                    e,
                    group.userId,
                    draggedNotebook && draggedNotebook.clientUserId === group.userId
                      ? group.notebooks.length
                      : null,
                  )
                }
                onDrop={(e) => handleDrop(e, group)}
                className={`rounded-lg border transition-colors ${
                  isDropGroup
                    ? "border-gold/50 bg-gold/10"
                    : "border-transparent"
                }`}
              >
                {/* ── 第一層：會員 ───────────────────────── */}
                <div className="flex items-center gap-1 rounded px-1">
                  <button
                    type="button"
                    onClick={() => toggleMember(group.userId)}
                    aria-expanded={open}
                    aria-label={open ? t.notes.collapse : t.notes.expand}
                    className="shrink-0 p-1 text-muted transition-colors hover:text-gold"
                  >
                    <Icon
                      path={ICON_CHEVRON}
                      className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
                    />
                  </button>
                  <Icon
                    path={ICON_USER}
                    className="h-3.5 w-3.5 shrink-0 text-muted opacity-70"
                  />
                  <span className="min-w-0 flex-1 truncate py-1.5 text-sm font-medium">
                    {group.name || `#${group.userId}`}
                  </span>
                  <span className="shrink-0 rounded bg-gold/10 px-1.5 py-0.5 text-[11px] text-muted">
                    {tp.notebookCount.replace(
                      "{n}",
                      String(group.notebooks.length),
                    )}
                  </span>
                </div>

                {/* ── 第二層：筆記本 ─────────────────────── */}
                {open && (
                  <ul className="pb-1 pl-3">
                    {group.notebooks.map((nb, i) => {
                      const isSelected = selectedNotebookId === nb.id;
                      const dragging = dragId === nb.id;
                      const showLine =
                        dragId !== null &&
                        dropTarget?.userId === group.userId &&
                        dropTarget.index === i &&
                        !dragging;
                      return (
                        <React.Fragment key={nb.id}>
                          {showLine && (
                            <li
                              aria-hidden="true"
                              className="mx-1 h-0.5 rounded bg-gold/70"
                            />
                          )}
                          <li
                            draggable
                            onDragStart={(e) => handleDragStart(e, nb)}
                            onDragEnd={clearDrag}
                            onDragOver={(e) => {
                              e.stopPropagation();
                              if (
                                !draggedNotebook ||
                                draggedNotebook.clientUserId !== group.userId
                              ) {
                                markDropTarget(e, group.userId, null);
                                return;
                              }
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const after = e.clientY > rect.top + rect.height / 2;
                              markDropTarget(e, group.userId, after ? i + 1 : i);
                            }}
                            data-tour={i === 0 ? "admin-notes-notebook" : undefined}
                            data-notebook-id={nb.id}
                            className={`group rounded transition-colors ${
                              dragging ? "opacity-40" : ""
                            } ${busyId === nb.id ? "opacity-50" : ""}`}
                          >
                            <div
                              className={`flex items-center gap-1 rounded pr-1 transition-colors ${
                                isSelected
                                  ? "bg-gold/15 text-gold"
                                  : "text-muted hover:bg-gold/5"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => onSelectNotebook(nb.id)}
                                aria-current={isSelected ? "true" : undefined}
                                className="flex min-w-0 flex-1 cursor-grab items-center gap-1.5 py-1.5 pl-1 text-left active:cursor-grabbing"
                              >
                                <span
                                  className="shrink-0 leading-none"
                                  aria-hidden="true"
                                >
                                  📓
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm">
                                    {nb.title}
                                  </span>
                                  <span className="block truncate text-[11px] opacity-70">
                                    {nb.courseTitle || "—"}
                                  </span>
                                </span>
                              </button>
                              <span className="flex shrink-0 items-center gap-0.5 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                                <button
                                  type="button"
                                  disabled={busyId === nb.id}
                                  onClick={() => void renameNotebook(nb)}
                                  title={tp.rename}
                                  aria-label={tp.rename}
                                  className="p-1 transition-colors hover:text-gold disabled:opacity-40"
                                >
                                  <Icon path={ICON_PENCIL} className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === nb.id}
                                  onClick={() => void removeNotebook(nb)}
                                  title={t.notes.del.button}
                                  aria-label={t.notes.del.button}
                                  className="p-1 transition-colors hover:text-red-400 disabled:opacity-40"
                                >
                                  <Icon path={ICON_TRASH} className="h-3.5 w-3.5" />
                                </button>
                              </span>
                              <button
                                type="button"
                                disabled={busyId === nb.id}
                                onClick={() => setMenuNotebook(nb)}
                                title={tp.menu}
                                aria-label={tp.menu}
                                data-tour={i === 0 ? "admin-notes-nb-menu" : undefined}
                                className="shrink-0 rounded p-1 transition-colors hover:text-gold disabled:opacity-40"
                              >
                                <Icon path={ICON_DOTS} className="h-4 w-4" />
                              </button>
                            </div>

                            {/* ── 第三層：頁面樹（只有開著的那一本）─── */}
                            {isSelected && (
                              <div className="mt-0.5 mb-1 border-l border-gold/15 pl-1">
                                {controller.loading ? (
                                  <p className="px-2 py-2 text-xs text-muted">
                                    {t.common.loading}
                                  </p>
                                ) : controller.error ? (
                                  <p className="px-2 py-2 text-xs text-muted">
                                    {controller.error}
                                  </p>
                                ) : (
                                  <PageTree
                                    pages={controller.pages}
                                    rootId={controller.tree?.notebook.rootPageId ?? null}
                                    selectedId={controller.selectedId}
                                    onSelect={controller.select}
                                    onAddChild={(parentId) =>
                                      void controller.createPage(parentId, {
                                        select: true,
                                      })
                                    }
                                    onRename={(p) => void controller.renamePage(p)}
                                    onMove={(p) => controller.setMovingPage(p)}
                                    onDelete={(p) => void controller.deletePage(p)}
                                    busyId={controller.busyId}
                                  />
                                )}
                              </div>
                            )}
                          </li>
                        </React.Fragment>
                      );
                    })}

                    {/* 末端落點指示線 */}
                    {dragId !== null &&
                      dropTarget?.userId === group.userId &&
                      dropTarget.index === group.notebooks.length && (
                        <li
                          aria-hidden="true"
                          className="mx-1 h-0.5 rounded bg-gold/70"
                        />
                      )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── 跨會員轉移確認 ─────────────────────────────── */}
      <Modal
        isOpen={pendingTransfer !== null}
        onClose={() => !transferring && setPendingTransfer(null)}
        title={tp.transferTitle}
        size="sm"
        tourId="notes-transfer"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPendingTransfer(null)}
              disabled={transferring}
              className="rounded-lg border border-gold/25 px-4 py-2 text-sm text-muted transition-colors hover:text-gold disabled:opacity-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={() => void submitTransfer()}
              disabled={transferring}
              data-tour="notes-transfer-submit"
              className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {transferring ? tp.transferring : tp.transferSubmit}
            </button>
          </>
        }
      >
        {pendingTransfer && (
          <div className="space-y-4">
            <p className="text-sm">
              {tp.transferConfirm
                .replace("{name}", pendingTransfer.notebook.title)
                .replace(
                  "{client}",
                  pendingTransfer.target.name ||
                    `#${pendingTransfer.target.userId}`,
                )}
            </p>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={grantOnTransfer}
                onChange={(e) => setGrantOnTransfer(e.target.checked)}
                className="mt-0.5 accent-[color:var(--color-gold)]"
              />
              <span>
                <span className="block">
                  {tp.transferGrant.replace(
                    "{course}",
                    pendingTransfer.notebook.courseTitle || "—",
                  )}
                </span>
                <span className="block text-xs text-muted">
                  {tp.transferGrantHint}
                </span>
              </span>
            </label>
            {transferError && (
              <p role="alert" className="text-sm text-red-400">
                {transferError}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ── 手機「⋯」選單 ─────────────────────────────── */}
      <Modal
        isOpen={menuNotebook !== null}
        onClose={() => setMenuNotebook(null)}
        title={tp.menuTitle}
        size="sm"
      >
        {menuNotebook && (
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  const nb = menuNotebook;
                  setMenuNotebook(null);
                  setTransferPick(nb);
                }}
                className="w-full rounded px-2 py-2 text-left text-sm transition-colors hover:bg-gold/10 hover:text-gold"
              >
                {tp.transferTo}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  nudge(menuNotebook, -1);
                  setMenuNotebook(null);
                }}
                className="w-full rounded px-2 py-2 text-left text-sm transition-colors hover:bg-gold/10 hover:text-gold"
              >
                {tp.moveUp}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  nudge(menuNotebook, 1);
                  setMenuNotebook(null);
                }}
                className="w-full rounded px-2 py-2 text-left text-sm transition-colors hover:bg-gold/10 hover:text-gold"
              >
                {tp.moveDown}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  const nb = menuNotebook;
                  setMenuNotebook(null);
                  void renameNotebook(nb);
                }}
                className="w-full rounded px-2 py-2 text-left text-sm transition-colors hover:bg-gold/10 hover:text-gold"
              >
                {tp.rename}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  const nb = menuNotebook;
                  setMenuNotebook(null);
                  void removeNotebook(nb);
                }}
                className="w-full rounded px-2 py-2 text-left text-sm text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                {t.notes.del.button}
              </button>
            </li>
          </ul>
        )}
      </Modal>

      {/* ── 手機「轉移給…」會員清單 ────────────────────── */}
      <Modal
        isOpen={transferPick !== null}
        onClose={() => setTransferPick(null)}
        title={tp.transferTo}
        size="sm"
      >
        <p className="mb-3 text-sm text-muted">{tp.transferPick}</p>
        {transferTargets.length === 0 ? (
          <p className="py-4 text-sm text-muted">{tp.transferNoTarget}</p>
        ) : (
          <ul className="max-h-[50vh] overflow-y-auto modal-scroll">
            {transferTargets.map((g) => (
              <li key={g.userId}>
                <button
                  type="button"
                  onClick={() => {
                    const nb = transferPick;
                    setTransferPick(null);
                    if (nb) openTransfer(nb, g);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors hover:bg-gold/10 hover:text-gold"
                >
                  <Icon path={ICON_USER} className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{g.name || `#${g.userId}`}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <CreateNotebookModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={onChanged}
      />
    </div>
  );
};

export default AdminNotesTree;
