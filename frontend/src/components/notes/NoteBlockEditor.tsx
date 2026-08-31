/**
 * BlockNote 編輯器本體（**只在瀏覽器載入**）
 * @module components/notes/NoteBlockEditor
 *
 * ⚠️ 這支檔案是整個筆記本功能唯一 import `@blocknote/*` 的地方，而且只能被
 *    `React.lazy()` 動態載入（見 PageEditor.tsx）。理由與 tours 的 driver.js
 *    相同：BlockNote 在 module scope 就會摸 `window`／`document`，SSR
 *    (`renderToString`) 一旦同步載入就整頁 500。
 *
 *    **自訂 block／slash 項也一律寫在這一支**，不要另開檔案 —— 只要有第二個
 *    檔案 import `@blocknote/*`，`vite.config.ts` 的 `ssrStubNoteEditor`
 *    （只攔 `./NoteBlockEditor`）就漏了，SSR bundle 會重新長出 3 MB。
 *
 *    另一個理由是體積：@blocknote/* + @mantine/* 約 1 MB，靠
 *    `vite.config.ts` 的 `vendor-notes` 規則切成 async chunk，
 *    前台訪客一個 byte 都不會下載到。
 *
 * ⚠️ CSS 也只在這裡 import。Vite 的 cssCodeSplit 會把它切成跟著這個 async
 *    chunk 一起載入的獨立樣式檔，不會進 index.html 的首屏 CSS。
 *
 * 授權紅線：**絕不安裝／import 任何 `@blocknote/xl-*` 套件**（那些是
 * AGPL／商用授權）。core / react / mantine 是 MPL-2.0，可安全使用。
 *
 * ## 自訂 `pageLink` block（N3）
 * slash 選單的「子頁面」／「資料庫」會先真的建一頁（呼叫端負責打 API），
 * 再於游標處插入一顆 `pageLink` block，渲染成可點的頁面卡片列。
 * 它 **只存 `pageId` / `title` / `pageType` 三個字串 prop**，標題以頁面樹
 * 快取為準即時解析 —— 這樣改頁名時舊卡片會跟著更新，頁被刪掉則顯示灰態。
 * props 裡的 title 只是「樹還沒回來／複製到別的筆記本」時的保底文字。
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type { Block, PartialBlock } from "@blocknote/core";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core";
import { en as bnEn, zhTW as bnZhTW } from "@blocknote/core/locales";
import {
  createReactBlockSpec,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
  type DefaultReactSuggestionItem,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useLanguage } from "@/context/LanguageContext";
import type { NoteBlock, NotePageType } from "@/services/notes/notes.service";

import "@blocknote/mantine/style.css";
import "./notes-editor.css";

// =======================================================
// pageLink：指向同一本筆記本裡另一頁的卡片列
// =======================================================

/**
 * 宿主（PageEditor）提供給 block 渲染用的東西。
 *
 * 走 React context 而不是 block props 的理由：BlockNote 的自訂 block 是用
 * `createPortal` 掛進編輯器的 React 子樹（見 @blocknote/react 的
 * `EditorContent.tsx`），portal 會保留 context，所以 Provider 放在
 * `<BlockNoteView>` 外面就傳得到 —— 連 `toExternalHTML`（複製到剪貼簿）
 * 那條路徑也是走 `elementRenderer`，一樣在樹裡面。
 */
interface NoteEditorHost {
  /** pageId → 最新標題（來自左側頁面樹）。**不在裡面 = 已刪除** */
  titles: ReadonlyMap<number, string>;
  onOpenPage?: (pageId: number) => void;
}

const HostContext = createContext<NoteEditorHost | null>(null);

/** `pageLink` 的 prop schema：一律用字串，避免 DOM 屬性來回轉型 */
const PAGE_LINK_CONFIG = {
  type: "pageLink",
  propSchema: {
    /** 目標頁 id（字串化的整數） */
    pageId: { default: "" },
    /** 建立當下的標題，僅作為解析不到時的保底 */
    title: { default: "" },
    /** "page" | "database" —— 只影響圖示與徽章 */
    pageType: { default: "page" },
  },
  content: "none",
} as const;

const ICON_DOC = "📄";
const ICON_DB = "🗂️";

/** 頁面卡片列的實際外觀（純 props，型別不與 BlockNote 泛型糾纏） */
const PageLinkCard: React.FC<{
  pageId: number;
  fallbackTitle: string;
  pageType: string;
}> = ({ pageId, fallbackTitle, pageType }) => {
  const { t } = useLanguage();
  const host = useContext(HostContext);

  const isDatabase = pageType === "database";
  const valid = Number.isFinite(pageId) && pageId > 0;

  /*
   * 「已刪除」只有在真的拿得到整棵樹時才敢下判斷：
   * titles 是空的（尚未載入／複製到別處）就退回 props.title，
   * 否則剛用 slash 建好的頁會閃一下灰色的「已刪除的頁面」。
   */
  const known = valid ? host?.titles.get(pageId) : undefined;
  const deleted =
    valid && !!host && host.titles.size > 0 && !host.titles.has(pageId);
  const label = deleted
    ? t.notes.pageLink.deleted
    : known?.trim() || fallbackTitle.trim() || t.notes.untitled;

  const clickable = valid && !deleted && !!host?.onOpenPage;

  return (
    <div className="notes-page-link" contentEditable={false}>
      <button
        type="button"
        draggable={false}
        disabled={!clickable}
        aria-label={`${t.notes.pageLink.open}：${label}`}
        onClick={() => host?.onOpenPage?.(pageId)}
        className="notes-page-link-btn"
        data-deleted={deleted ? "true" : "false"}
      >
        <span aria-hidden="true" className="notes-page-link-icon">
          {isDatabase ? ICON_DB : ICON_DOC}
        </span>
        <span className="notes-page-link-title">{label}</span>
        {isDatabase && (
          <span className="notes-page-link-badge">
            {t.notes.pageLink.badgeDatabase}
          </span>
        )}
      </button>
    </div>
  );
};

const createPageLinkBlockSpec = createReactBlockSpec(PAGE_LINK_CONFIG, {
  meta: { selectable: true },
  render: (props) => (
    <PageLinkCard
      pageId={Number(props.block.props.pageId)}
      fallbackTitle={props.block.props.title}
      pageType={props.block.props.pageType}
    />
  ),
});

/**
 * 編輯器 schema = 預設 block + pageLink。
 *
 * 模組層級只建一次：`useCreateBlockNote` 的 deps 一變就重建整個 editor，
 * schema 若每次 render 都是新物件，打字打到一半就會被抽換掉。
 */
const notesSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    pageLink: createPageLinkBlockSpec(),
  },
});

// =======================================================
// 編輯器
// =======================================================

export interface NoteBlockEditorProps {
  /** 初始內容（BlockNote block 陣列）；空／null 時給一顆空段落 */
  initialContent: NoteBlock[] | null;
  /** 可否編輯（讀取中／衝突時鎖住） */
  editable?: boolean;
  /** 深色主題（跟站內 ThemeContext 連動，不吃系統 prefers-color-scheme） */
  dark: boolean;
  /** 介面語言（BlockNote 內建 zh-TW 字典，缺的字才回退英文） */
  lang: "zh-TW" | "en";
  /** 內容變動（每次敲鍵都會觸發，debounce 由呼叫端負責） */
  onChange: (blocks: NoteBlock[]) => void;
  /**
   * slash 選單「子頁面」／「資料庫」→ 建一頁並回傳它。
   * 回 null（或未提供）時這兩個選項不會出現在選單裡。
   */
  onCreateChildPage?: (
    type: NotePageType,
  ) => Promise<{ id: number; title: string } | null>;
  /** pageLink 卡片點擊 → 開啟該頁 */
  onOpenPage?: (pageId: number) => void;
  /** 頁面樹快取（pageId → 標題），給 pageLink 解析最新標題／判斷已刪除 */
  pageTitles?: ReadonlyMap<number, string>;
}

/**
 * 空文件的預設值。
 *
 * BlockNote 的 `initialContent` 傳空陣列會直接 throw
 * （"initialContent must be a non-empty array"），所以新頁一律給一顆空段落。
 */
const EMPTY_DOC: PartialBlock[] = [{ type: "paragraph", content: [] }];

/** slash 選單自訂項的小圖示（emoji，不拉 react-icons 進 vendor-notes） */
const SlashIcon: React.FC<{ char: string }> = ({ char }) => (
  <span aria-hidden="true" style={{ fontSize: "1rem", lineHeight: 1 }}>
    {char}
  </span>
);

const EMPTY_TITLES: ReadonlyMap<number, string> = new Map();

const NoteBlockEditor: React.FC<NoteBlockEditorProps> = ({
  initialContent,
  editable = true,
  dark,
  lang,
  onChange,
  onCreateChildPage,
  onOpenPage,
  pageTitles,
}) => {
  const { t } = useLanguage();

  /*
   * 這個元件是「用 key 重建」的：切頁 / 重新載入都由 PageEditor 換 key，
   * 所以 initialContent 只在掛載當下讀一次，deps 給 [] 即可
   * （useCreateBlockNote 的第二參數是 deps，變動會重建整個 editor 實例）。
   */
  const doc = useMemo<PartialBlock[]>(
    () =>
      Array.isArray(initialContent) && initialContent.length > 0
        ? (initialContent as PartialBlock[])
        : EMPTY_DOC,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editor = useCreateBlockNote(
    {
      schema: notesSchema,
      initialContent: doc,
      // BlockNote 官方就附 zh-TW 字典，不要自己拼 dictionary 物件塞錯型別
      dictionary: lang === "zh-TW" ? bnZhTW : bnEn,
      // 尾端永遠留一顆空段落，游標點到最下面就能繼續打（Notion 行為）
      trailingBlock: true,
    },
    [lang],
  );

  const handleChange = useCallback(() => {
    onChange(editor.document as unknown as NoteBlock[]);
  }, [editor, onChange]);

  /*
   * 宿主資訊。identity 跟著 pageTitles 變 —— 標題改了才會讓已渲染的
   * pageLink 卡片重繪；否則 context 物件不變，portal 裡的卡片不會更新。
   */
  const host = useMemo<NoteEditorHost>(
    () => ({ titles: pageTitles ?? EMPTY_TITLES, onOpenPage }),
    [pageTitles, onOpenPage],
  );

  /** 建頁 → 在游標處插入 pageLink block */
  const insertPageLink = useCallback(
    async (type: NotePageType) => {
      if (!onCreateChildPage) return;
      const created = await onCreateChildPage(type);
      if (!created) return;
      /*
       * 走到這裡時 suggestion menu 已經關閉、`/` 查詢字串也被清掉了
       * （@blocknote/react 的 SuggestionMenuWrapper 是先 close+clear 再呼叫
       * onItemClick），所以直接對「目前這一顆 block」做插入／取代即可。
       */
      insertOrUpdateBlockForSlashMenu(editor, {
        type: "pageLink",
        props: {
          pageId: String(created.id),
          title: created.title ?? "",
          pageType: type,
        },
      } as PartialBlock<typeof notesSchema.blockSchema>);
    },
    [editor, onCreateChildPage],
  );

  /** slash 選單：預設項 + 筆記本自訂項 */
  const getSlashItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const items: DefaultReactSuggestionItem[] = [
        ...getDefaultReactSlashMenuItems(editor),
      ];
      if (onCreateChildPage) {
        items.push(
          {
            title: t.notes.slash.subPageTitle,
            subtext: t.notes.slash.subPageSubtext,
            group: t.notes.slash.group,
            aliases: ["subpage", "page", "child", "子頁", "子頁面", "頁面"],
            icon: <SlashIcon char={ICON_DOC} />,
            onItemClick: () => {
              void insertPageLink("page");
            },
          },
          {
            title: t.notes.slash.databaseTitle,
            subtext: t.notes.slash.databaseSubtext,
            group: t.notes.slash.group,
            aliases: ["database", "board", "db", "資料庫", "看板", "分類"],
            icon: <SlashIcon char={ICON_DB} />,
            onItemClick: () => {
              void insertPageLink("database");
            },
          },
        );
      }
      return filterSuggestionItems(items, query);
    },
    [editor, onCreateChildPage, insertPageLink, t],
  );

  return (
    <HostContext.Provider value={host}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        // 明確給字串 → 跟站內主題連動；給物件會讓它自己去讀系統 prefers-color-scheme
        theme={dark ? "dark" : "light"}
        onChange={handleChange}
        className="notes-canvas"
        data-readonly={editable ? "false" : "true"}
        data-tour="notes-editor-canvas"
        // 關掉內建 slash 選單，改用下面這顆帶自訂項的 controller
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getSlashItems}
        />
      </BlockNoteView>
    </HostContext.Provider>
  );
};

export type { Block as NoteEditorBlock };
export default NoteBlockEditor;
