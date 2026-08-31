/**
 * BlockNote 編輯器本體（**只在瀏覽器載入**）
 * @module components/notes/NoteBlockEditor
 *
 * ⚠️ 這支檔案是整個筆記本功能唯一 import `@blocknote/*` 的地方，而且只能被
 *    `React.lazy()` 動態載入（見 PageEditor.tsx）。理由與 tours 的 driver.js
 *    相同：BlockNote 在 module scope 就會摸 `window`／`document`，SSR
 *    (`renderToString`) 一旦同步載入就整頁 500。
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
 */

import React, { useCallback, useMemo } from "react";
import type { Block, PartialBlock } from "@blocknote/core";
import { en as bnEn, zhTW as bnZhTW } from "@blocknote/core/locales";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { NoteBlock } from "@/services/notes/notes.service";

import "@blocknote/mantine/style.css";
import "./notes-editor.css";

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
}

/**
 * 空文件的預設值。
 *
 * BlockNote 的 `initialContent` 傳空陣列會直接 throw
 * （"initialContent must be a non-empty array"），所以新頁一律給一顆空段落。
 */
const EMPTY_DOC: PartialBlock[] = [{ type: "paragraph", content: [] }];

const NoteBlockEditor: React.FC<NoteBlockEditorProps> = ({
  initialContent,
  editable = true,
  dark,
  lang,
  onChange,
}) => {
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

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      // 明確給字串 → 跟站內主題連動；給物件會讓它自己去讀系統 prefers-color-scheme
      theme={dark ? "dark" : "light"}
      onChange={handleChange}
      className="notes-canvas"
      data-readonly={editable ? "false" : "true"}
      data-tour="notes-editor-canvas"
    />
  );
};

export type { Block as NoteEditorBlock };
export default NoteBlockEditor;
