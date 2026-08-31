/**
 * 單頁編輯器（標題 + BlockNote 畫布 + 自動儲存 + 樂觀鎖衝突處理）
 * @module components/notes/PageEditor
 *
 * ## SSR
 * BlockNote 只能在瀏覽器跑（module scope 就會摸 document），所以：
 *   1. `NoteBlockEditor` 走 `React.lazy` 動態載入 —— 與 tours 的 driver.js 同模式；
 *   2. 外加 `mounted` gate，確保伺服器端連 Suspense fallback 以外的東西都不碰。
 * 兩層保險缺一不可：只有 lazy 的話，未來若有人把它換成靜態 import 就會炸 SSR。
 *
 * ## 自動儲存
 * onChange → debounce 1.5s → `PATCH /api/notes/pages/:id` 帶 `{content, version}`。
 * 撞寫（對方先存）後端回 409 + currentVersion → 這裡鎖住編輯並顯示衝突橫幅，
 * 使用者按「重新載入」才會用對方的版本覆蓋畫面（不自動蓋掉正在打的字）。
 *
 * ⚠️ 「使用者互動前不存檔」：BlockNote 載入時會正規化文件（補 id、補
 *    trailingBlock），那也會觸發 onChange。若不擋，光是「開啟一頁」就會寫回
 *    一次、把 version 往上推，另一端正在編輯的自動儲存就會無辜吃 409。
 *    因此以 capture 事件（鍵盤／指標／貼上／拖放／聚焦）作為「真的有人在編輯」
 *    的閘門，未觸發前 onChange 只更新基準值、不排程儲存。
 */

import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import {
  notesService,
  asVersionConflict,
  isNotesUnavailable,
  serverMessageOf,
  type NoteBlock,
  type NotePageDetail,
  type NotePageNode,
} from "@/services/notes/notes.service";
import DatabasePagePlaceholder from "./DatabasePagePlaceholder";

/** BlockNote 本體：只有走到這行才會下載 vendor-notes chunk */
const NoteBlockEditor = lazy(() => import("./NoteBlockEditor"));

/** 內容自動儲存的靜置時間 */
const CONTENT_DEBOUNCE_MS = 1500;
/** 標題自動儲存的靜置時間（比內容短，改名要有即時感） */
const TITLE_DEBOUNCE_MS = 800;

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";

export interface PageEditorProps {
  pageId: number;
  /** 這一頁的直屬子頁（database 佔位卡片牆用；一般頁不需要） */
  childPages: NotePageNode[];
  /** 標題存檔成功 → 讓左側樹同步 */
  onTitleSaved: (pageId: number, title: string) => void;
  /** 開啟另一頁（database 卡片點擊） */
  onOpenPage: (pageId: number) => void;
  /** 新增子頁（database 卡片牆的「＋」） */
  onAddChild: (parentId: number) => void;
}

/** 儲存狀態指示燈 */
const SaveIndicator: React.FC<{ state: SaveState }> = ({ state }) => {
  const { t } = useLanguage();
  const map: Record<SaveState, { text: string; tone: string }> = {
    idle: { text: "", tone: "" },
    dirty: { text: t.notes.saveDirty, tone: "text-muted" },
    saving: { text: t.notes.saving, tone: "text-muted" },
    saved: { text: t.notes.saved, tone: "text-gold" },
    error: { text: t.notes.saveFailed, tone: "text-red-400" },
    conflict: { text: t.notes.saveConflict, tone: "text-amber-400" },
  };
  const { text, tone } = map[state];
  if (!text) return null;
  return (
    <span
      data-tour="notes-save-state"
      aria-live="polite"
      className={`text-xs whitespace-nowrap ${tone}`}
    >
      {text}
    </span>
  );
};

const PageEditor: React.FC<PageEditorProps> = ({
  pageId,
  childPages,
  onTitleSaved,
  onOpenPage,
  onAddChild,
}) => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const [page, setPage] = useState<NotePageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [conflictVersion, setConflictVersion] = useState<number | null>(null);
  /** 換 key 讓 BlockNote 整個重建（切頁／衝突後重新載入） */
  const [editorKey, setEditorKey] = useState(0);

  /** SSR gate：伺服器端永遠 false，編輯器連 lazy 都不會被要求 */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── 可變狀態放 ref，避免每次敲鍵都重建 callback ────────
  const versionRef = useRef<number>(1);
  const latestDocRef = useRef<NoteBlock[] | null>(null);
  const lastSavedJsonRef = useRef<string>("");
  const armedRef = useRef(false);
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const conflictRef = useRef(false);

  /** 真的有人在編輯（capture 事件）才開放自動儲存 —— 見檔首說明 */
  const arm = useCallback(() => {
    armedRef.current = true;
  }, []);

  // ── 載入單頁 ──────────────────────────────────────────
  const load = useCallback(
    async (opts: { keepScroll?: boolean } = {}) => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await notesService.getPage(pageId);
        setPage(res.page);
        setTitle(res.page.title || "");
        versionRef.current = res.page.version;
        latestDocRef.current = res.page.content;
        lastSavedJsonRef.current = JSON.stringify(res.page.content ?? []);
        armedRef.current = false;
        conflictRef.current = false;
        setConflictVersion(null);
        setSaveState("idle");
        if (!opts.keepScroll) setEditorKey((k) => k + 1);
      } catch (err) {
        setLoadError(
          isNotesUnavailable(err)
            ? t.notes.unavailableBody
            : serverMessageOf(err) || t.notes.loadFailed,
        );
        setPage(null);
      } finally {
        setLoading(false);
      }
    },
    [pageId, t],
  );

  useEffect(() => {
    void load();
    // 換頁時重建編輯器；load 內部也會遞增 editorKey
  }, [load]);

  // ── 內容儲存 ──────────────────────────────────────────
  const saveContent = useCallback(async () => {
    if (conflictRef.current || savingRef.current) return;
    const doc = latestDocRef.current;
    if (!doc) return;
    const json = JSON.stringify(doc);
    if (json === lastSavedJsonRef.current) {
      setSaveState("idle");
      return;
    }

    savingRef.current = true;
    setSaveState("saving");
    try {
      const res = await notesService.updatePageContent(
        pageId,
        doc,
        versionRef.current,
      );
      versionRef.current = res.version;
      lastSavedJsonRef.current = json;
      setSaveState("saved");
    } catch (err) {
      const conflict = asVersionConflict(err);
      if (conflict) {
        conflictRef.current = true;
        setConflictVersion(conflict.currentVersion);
        setSaveState("conflict");
      } else {
        setSaveState("error");
      }
    } finally {
      savingRef.current = false;
    }
  }, [pageId]);

  const handleContentChange = useCallback(
    (blocks: NoteBlock[]) => {
      latestDocRef.current = blocks;
      // 尚未有使用者互動 → 這是 BlockNote 的載入正規化，只更新基準、不寫回
      if (!armedRef.current) {
        lastSavedJsonRef.current = JSON.stringify(blocks);
        return;
      }
      if (conflictRef.current) return;
      setSaveState("dirty");
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
      contentTimerRef.current = setTimeout(() => {
        void saveContent();
      }, CONTENT_DEBOUNCE_MS);
    },
    [saveContent],
  );

  // ── 標題儲存（metadata，不帶 version）─────────────────
  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(() => {
        void (async () => {
          try {
            await notesService.updatePageMeta(pageId, { title: value });
            onTitleSaved(pageId, value);
          } catch {
            setSaveState("error");
          }
        })();
      }, TITLE_DEBOUNCE_MS);
    },
    [pageId, onTitleSaved],
  );

  /*
   * 離開這一頁（切頁／離開路由）時把還在 debounce 裡的變更送出去。
   * 不 await —— 元件已經在拆了，成敗只影響伺服器端；沒送成的話
   * 使用者回到這頁會看到舊內容，這比「卡住畫面等 API」好。
   */
  useEffect(() => {
    return () => {
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (conflictRef.current || !armedRef.current) return;
      const doc = latestDocRef.current;
      if (!doc) return;
      if (JSON.stringify(doc) === lastSavedJsonRef.current) return;
      void notesService
        .updatePageContent(pageId, doc, versionRef.current)
        .catch(() => {});
    };
  }, [pageId]);

  // ── 畫面 ──────────────────────────────────────────────
  if (loading && !page) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        {t.common.loading}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-muted">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded border border-gold/40 px-3 py-1.5 text-gold transition-colors hover:bg-gold/10"
        >
          {t.notes.retry}
        </button>
      </div>
    );
  }

  if (!page) return null;

  const isDatabase = page.type === "database";

  return (
    <div className="flex min-h-0 flex-col">
      {/* 標題列 + 儲存狀態 */}
      <div className="mb-3 flex items-start gap-3">
        <input
          data-tour="notes-page-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={t.notes.titlePlaceholder}
          aria-label={t.notes.titlePlaceholder}
          className="min-w-0 flex-1 bg-transparent font-display text-xl sm:text-2xl font-light tracking-wide text-inherit outline-none placeholder:text-muted focus:border-b focus:border-gold/40"
        />
        <div className="mt-2 shrink-0">
          <SaveIndicator state={saveState} />
        </div>
      </div>

      {/* 樂觀鎖衝突橫幅 */}
      {conflictVersion !== null && (
        <div
          role="alert"
          data-tour="notes-conflict-banner"
          className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
        >
          <span className="min-w-0 flex-1">{t.notes.conflictBody}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="shrink-0 rounded border border-amber-400/60 px-3 py-1 transition-colors hover:bg-amber-400/20"
          >
            {t.notes.conflictReload}
          </button>
        </div>
      )}

      {isDatabase ? (
        <DatabasePagePlaceholder
          pageId={page.id}
          childPages={childPages}
          onOpenPage={onOpenPage}
          onAddChild={onAddChild}
        />
      ) : (
        /*
          capture 事件 = 自動儲存的閘門（見檔首）。放在外層 div 而不是編輯器
          內部，是為了讓 BlockNote 的工具列、slash 選單等 portal 以外的互動
          也算數，而且不必為此改動 NoteBlockEditor 的 props 形狀。
        */
        <div
          onKeyDownCapture={arm}
          onPointerDownCapture={arm}
          onPasteCapture={arm}
          onDropCapture={arm}
          onFocusCapture={arm}
        >
          {mounted ? (
            <Suspense
              fallback={
                <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
                  {t.notes.editorLoading}
                </div>
              }
            >
              <NoteBlockEditor
                key={`${page.id}-${editorKey}`}
                initialContent={page.content}
                editable={conflictVersion === null}
                dark={isDark}
                lang={language === "en" ? "en" : "zh-TW"}
                onChange={handleContentChange}
              />
            </Suspense>
          ) : (
            <div className="min-h-[40vh]" />
          )}
        </div>
      )}
    </div>
  );
};

export default PageEditor;
