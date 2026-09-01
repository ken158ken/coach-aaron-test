/**
 * database 頁的分類看板（欄＝分類、卡＝子頁）
 * @module components/notes/DatabaseBoard
 *
 * 對應業主在 Notion 的用法：每本筆記本的 root 是一個看板，欄位是自訂分類
 * （「第 1 期」「飲食」「檢測紀錄」…），卡片就是一頁筆記，點開即進入該頁。
 *
 * ## 欄
 * 欄序 = database 頁 `categories` 陣列的順序，最後永遠固定一欄「未分類」。
 * 「未分類」收 `category_id` 為 null **或懸空**（分類被刪掉但子頁沒跟著改）的卡片
 * —— 刪分類刻意不做資料遷移，這一欄就是安全網。
 *
 * ## 拖曳
 * 用原生 HTML5 drag events，**不引入 dnd 套件**（dnd-kit/react-dnd 都是
 * 30 KB 起跳，而且會被打進 vendor-misc 那顆共用 chunk）。
 * 觸控裝置上 HTML5 dnd 不會觸發，因此每張卡另外給「⋯」選單 →「移到分類…」，
 * 手機走選單、桌機走拖曳，兩條路徑打同一支 `onMoveCard`。
 *
 * ## 排序
 * `sort_order` 是 DOUBLE PRECISION（039 SQL），所以欄內插入位置可以直接取
 * 前後鄰居的中點，一次 PATCH 就搞定，不必把整欄重新編號。
 * 算法抽在 `./sortOrder`，與後台筆記本樹的拖曳排序共用同一份。
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import type { NoteCategory, NotePageNode } from "@/services/notes/notes.service";
import CategoryManagerModal from "./CategoryManagerModal";
import { safeCategoryColor, tintCategoryColor } from "./categoryColors";
import { sortOrderForIndex } from "./sortOrder";

/** 「未分類」欄的 key（不是真的分類 id，只用於 UI 比對） */
const UNCATEGORIZED = "__uncategorized__";

interface BoardColumn {
  key: string;
  /** null = 未分類欄 */
  category: NoteCategory | null;
  cards: NotePageNode[];
}

/** 拖曳中的落點：哪一欄、插在第幾張卡之前 */
interface DropTarget {
  colKey: string;
  index: number;
}

export interface DatabaseBoardProps {
  /** 這個 database 頁自己的 id */
  pageId: number;
  /** 有序分類（null 視同空陣列） */
  categories: NoteCategory[] | null;
  /** 直屬子頁（已依 sort_order 升冪，沿用 API 順序） */
  childPages: NotePageNode[];
  /** 唯讀（衝突橫幅出現時鎖住，避免一邊改一邊撞） */
  readOnly?: boolean;
  onOpenPage: (pageId: number) => void;
  /** 該欄底部「＋ 新增」→ 建子頁（type page，帶 categoryId）；回傳 Promise 供鎖按鈕 */
  onAddCard: (categoryId: string | null) => void | Promise<unknown>;
  /** 卡片換分類／換位置 */
  onMoveCard: (
    cardId: number,
    categoryId: string | null,
    sortOrder?: number,
  ) => Promise<void>;
  /** 分類定義存檔（PATCH database 頁自己的 categories） */
  onSaveCategories: (categories: NoteCategory[]) => Promise<void>;
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

const ICON_PLUS = "M12 4v16m8-8H4";
const ICON_DOTS = "M12 5v.01M12 12v.01M12 19v.01";
const ICON_TUNE = "M4 6h16M4 12h16M4 18h16";
const ICON_DB =
  "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z";
const ICON_DOC =
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

/**
 * 落點的新 sort_order：取前後鄰居的中點（算法見 `./sortOrder`）。
 * @param list 目標欄的卡片（**已排除被拖曳的那張**）
 * @param index 要插進 list 的哪個位置
 */
const sortOrderForSlot = (list: NotePageNode[], index: number): number =>
  sortOrderForIndex(
    list.map((c) => c.sort_order),
    index,
  );

const DatabaseBoard: React.FC<DatabaseBoardProps> = ({
  pageId,
  categories,
  childPages,
  readOnly = false,
  onOpenPage,
  onAddCard,
  onMoveCard,
  onSaveCategories,
}) => {
  const { t, language } = useLanguage();

  const [dragCardId, setDragCardId] = useState<number | null>(null);
  /** 「＋ 新增」進行中的欄 key —— serverless 冷啟動建頁可達數秒，鎖全部新增鈕防連點 */
  const [addingColKey, setAddingColKey] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [menuCard, setMenuCard] = useState<NotePageNode | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [busyCardId, setBusyCardId] = useState<number | null>(null);
  /** 拖曳中的卡片 id：dragover 期間 dataTransfer 讀不到資料，只能自己記 */
  const dragIdRef = useRef<number | null>(null);

  const cats = useMemo(() => categories ?? [], [categories]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-TW", {
        month: "numeric",
        day: "numeric",
      }),
    [language],
  );

  /** 分類欄 + 固定墊底的「未分類」欄 */
  const columns = useMemo<BoardColumn[]>(() => {
    const known = new Set(cats.map((c) => c.id));
    const byCat = new Map<string, NotePageNode[]>();
    const orphans: NotePageNode[] = [];
    for (const p of childPages) {
      const cid = p.category_id;
      if (cid && known.has(cid)) {
        const list = byCat.get(cid);
        if (list) list.push(p);
        else byCat.set(cid, [p]);
      } else {
        // category_id 為 null 或指向已被刪除的分類 → 未分類
        orphans.push(p);
      }
    }
    return [
      ...cats.map((c) => ({
        key: c.id,
        category: c,
        cards: byCat.get(c.id) ?? [],
      })),
      { key: UNCATEGORIZED, category: null, cards: orphans },
    ];
  }, [cats, childPages]);

  const clearDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragCardId(null);
    setDropTarget(null);
  }, []);

  // ── 拖曳 ──────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.DragEvent, card: NotePageNode) => {
      if (readOnly) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = "move";
      // Firefox 不設 data 就不會開始拖曳；Safari 偶爾 throw，包起來即可
      try {
        e.dataTransfer.setData("text/plain", String(card.id));
      } catch {
        /* 忽略：dragIdRef 才是真正的來源 */
      }
      dragIdRef.current = card.id;
      setDragCardId(card.id);
    },
    [readOnly],
  );

  const markDropTarget = useCallback(
    (e: React.DragEvent, colKey: string, index: number) => {
      if (dragIdRef.current === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTarget((prev) =>
        prev && prev.colKey === colKey && prev.index === index
          ? prev
          : { colKey, index },
      );
    },
    [],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent, col: BoardColumn) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("text/plain");
      const cardId = dragIdRef.current ?? (raw ? Number(raw) : Number.NaN);
      const target = dropTarget;
      clearDrag();
      if (!Number.isFinite(cardId)) return;

      if (!childPages.some((p) => p.id === cardId)) return;

      const nextCategoryId = col.category ? col.category.id : null;
      /* col.cards 就是這一欄的全部卡片 → 找得到 = 本來就在這一欄 */
      const currentIndex = col.cards.findIndex((c) => c.id === cardId);

      // 落點索引是對「畫面上的清單」算的，排掉自己之後要往前挪一格
      let index =
        target && target.colKey === col.key ? target.index : col.cards.length;
      if (currentIndex !== -1 && currentIndex < index) index -= 1;

      const withoutSelf = col.cards.filter((c) => c.id !== cardId);
      index = Math.max(0, Math.min(index, withoutSelf.length));

      // 同一欄、同一個位置 → 什麼都沒變，不要白打一次 API
      if (currentIndex !== -1 && currentIndex === index) return;

      setBusyCardId(cardId);
      try {
        await onMoveCard(cardId, nextCategoryId, sortOrderForSlot(withoutSelf, index));
      } finally {
        setBusyCardId(null);
      }
    },
    [childPages, dropTarget, clearDrag, onMoveCard],
  );

  // ── 手機：卡片選單「移到分類…」──────────────────────
  const moveViaMenu = useCallback(
    async (categoryId: string | null) => {
      const card = menuCard;
      setMenuCard(null);
      if (!card) return;
      if ((card.category_id ?? null) === categoryId) return;
      setBusyCardId(card.id);
      try {
        await onMoveCard(card.id, categoryId);
      } finally {
        setBusyCardId(null);
      }
    },
    [menuCard, onMoveCard],
  );

  /** 卡片目前所在欄（選單裡標「目前位置」用） */
  const menuCardColumnKey = useMemo(() => {
    if (!menuCard) return null;
    const cid = menuCard.category_id;
    return cid && cats.some((c) => c.id === cid) ? cid : UNCATEGORIZED;
  }, [menuCard, cats]);

  // ── 畫面 ──────────────────────────────────────────────
  return (
    <div data-tour="notes-database-board">
      {/* 看板工具列 */}
      <div className="mb-3 flex items-center justify-between gap-2">
        {/* 手機沒有 HTML5 拖曳事件 → 換一句指向卡片「⋯」選單的提示 */}
        <span className="min-w-0 truncate text-xs uppercase tracking-widest text-muted">
          <span className="hidden sm:inline">{t.notes.board.dragHint}</span>
          <span className="sm:hidden">{t.notes.board.dragHintMobile}</span>
        </span>
        <button
          type="button"
          data-tour="notes-board-categories"
          onClick={() => setManagerOpen(true)}
          disabled={readOnly}
          className="flex shrink-0 items-center gap-1.5 rounded border border-gold/25 px-2.5 py-1 text-xs text-muted transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
        >
          <Icon path={ICON_TUNE} className="h-3.5 w-3.5" />
          {t.notes.board.manageCategories}
        </button>
      </div>

      {/*
        欄固定寬 + 橫向捲動（Notion 看板行為）。手機同樣是橫向捲，
        `overscroll-x-contain` 避免捲到底時把整頁往旁邊帶。
      */}
      <div className="-mx-1 flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-3">
        {columns.map((col) => {
          const isUncat = col.category === null;
          const color = isUncat ? null : safeCategoryColor(col.category!.color);
          const isDropCol = dropTarget?.colKey === col.key && dragCardId !== null;
          return (
            <section
              key={col.key}
              onDragOver={(e) => markDropTarget(e, col.key, col.cards.length)}
              onDrop={(e) => void handleDrop(e, col)}
              className={`flex w-60 shrink-0 flex-col rounded-lg border transition-colors sm:w-64 ${
                isDropCol
                  ? "border-gold/50 bg-gold/5"
                  : "border-gold/15 bg-surface-2/60"
              }`}
            >
              {/* 欄頭：色點 + 名稱 + 張數 */}
              <header
                className="flex items-center gap-2 rounded-t-lg border-b border-gold/10 px-3 py-2"
                style={
                  color ? { backgroundColor: tintCategoryColor(color, 10) } : undefined
                }
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color ?? "var(--color-muted)" }}
                />
                <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
                  {isUncat
                    ? t.notes.board.uncategorized
                    : col.category!.name.trim() || t.notes.cat.unnamed}
                </h3>
                <span className="shrink-0 rounded bg-gold/10 px-1.5 py-0.5 text-[11px] text-muted">
                  {col.cards.length}
                </span>
              </header>

              {/* 卡片 */}
              <ul className="min-h-16 flex-1 space-y-2 p-2">
                {col.cards.map((card, i) => {
                  const dragging = dragCardId === card.id;
                  const showLine =
                    isDropCol && dropTarget?.index === i && !dragging;
                  return (
                    <React.Fragment key={card.id}>
                      {showLine && (
                        <li
                          aria-hidden="true"
                          className="h-0.5 rounded bg-gold/70"
                        />
                      )}
                      <li
                        draggable={!readOnly}
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={clearDrag}
                        onDragOver={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const after = e.clientY > rect.top + rect.height / 2;
                          markDropTarget(e, col.key, after ? i + 1 : i);
                        }}
                        data-tour={i === 0 ? "notes-database-card" : undefined}
                        className={`group flex items-start gap-1 rounded-lg border border-gold/15 bg-surface p-2.5 transition-all ${
                          dragging ? "opacity-40" : "hover:border-gold/40"
                        } ${busyCardId === card.id ? "opacity-50" : ""} ${
                          readOnly ? "" : "cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenPage(card.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="flex items-center gap-1.5 text-sm">
                            <span
                              className="shrink-0 opacity-70"
                              aria-hidden="true"
                            >
                              {card.icon ? (
                                <span className="leading-none">{card.icon}</span>
                              ) : (
                                <Icon
                                  path={
                                    card.type === "database" ? ICON_DB : ICON_DOC
                                  }
                                  className="h-3.5 w-3.5"
                                />
                              )}
                            </span>
                            <span className="truncate">
                              {card.title?.trim() || t.notes.untitled}
                            </span>
                          </span>
                          <span className="mt-1 block text-[11px] text-muted">
                            {t.notes.board.updatedAt}
                            {card.updated_at
                              ? dateFmt.format(new Date(card.updated_at))
                              : "—"}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => setMenuCard(card)}
                          title={t.notes.board.moveTo}
                          aria-label={t.notes.board.moveTo}
                          className="shrink-0 rounded p-1 text-muted transition-colors hover:text-gold disabled:opacity-30"
                        >
                          <Icon path={ICON_DOTS} className="h-4 w-4" />
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}

                {/* 末端落點指示線 */}
                {isDropCol &&
                  dropTarget?.index === col.cards.length &&
                  dragCardId !== null && (
                    <li aria-hidden="true" className="h-0.5 rounded bg-gold/70" />
                  )}

                {col.cards.length === 0 && !isDropCol && (
                  <li className="py-3 text-center text-xs text-muted">
                    {t.notes.board.columnEmpty}
                  </li>
                )}
              </ul>

              <button
                type="button"
                disabled={readOnly || addingColKey !== null}
                data-tour={col.key === columns[0]?.key ? "notes-database-add" : undefined}
                onClick={() => {
                  if (addingColKey !== null) return;
                  setAddingColKey(col.key);
                  void Promise.resolve(
                    onAddCard(col.category ? col.category.id : null),
                  ).finally(() => setAddingColKey(null));
                }}
                className="m-2 mt-0 flex items-center justify-center gap-1.5 rounded border border-dashed border-gold/25 py-2 text-xs text-muted transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
              >
                <Icon path={ICON_PLUS} className="h-3.5 w-3.5" />
                {t.notes.board.addCard}
              </button>
            </section>
          );
        })}
      </div>

      {childPages.length === 0 && (
        <p className="mt-1 text-sm text-muted">{t.notes.dbEmpty}</p>
      )}

      {/* 手機用：卡片「移到分類…」 */}
      <Modal
        isOpen={menuCard !== null}
        onClose={() => setMenuCard(null)}
        title={t.notes.board.moveTo}
        size="sm"
      >
        <p className="mb-3 text-sm text-muted">
          {t.notes.board.moveHint.replace(
            "{name}",
            menuCard?.title?.trim() || t.notes.untitled,
          )}
        </p>
        <ul className="max-h-[50vh] overflow-y-auto modal-scroll">
          {[...cats, null].map((c) => {
            const key = c ? c.id : UNCATEGORIZED;
            const current = key === menuCardColumnKey;
            return (
              <li key={key}>
                <button
                  type="button"
                  disabled={current}
                  onClick={() => void moveViaMenu(c ? c.id : null)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors ${
                    current
                      ? "cursor-default text-muted opacity-60"
                      : "hover:bg-gold/10 hover:text-gold"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: c
                        ? safeCategoryColor(c.color)
                        : "var(--color-muted)",
                    }}
                  />
                  <span className="truncate">
                    {c ? c.name.trim() || t.notes.cat.unnamed : t.notes.board.uncategorized}
                  </span>
                  {current && (
                    <span className="ml-auto shrink-0 text-[11px] uppercase tracking-wider">
                      {t.notes.moveCurrentParent}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>

      <CategoryManagerModal
        key={pageId}
        isOpen={managerOpen}
        categories={cats}
        onClose={() => setManagerOpen(false)}
        onSave={onSaveCategories}
      />
    </div>
  );
};

export default DatabaseBoard;
