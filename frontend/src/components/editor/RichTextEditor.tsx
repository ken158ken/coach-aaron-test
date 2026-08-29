/**
 * 富文本編輯器元件
 * @module components/editor/RichTextEditor
 * @description 共用的 Tiptap 編輯器，支援完整的格式化功能
 *
 * 注意：此元件已棄用，建議使用 components/ui/editor/RichTextEditor
 *
 * 工具列文案在 `locales/adminExtra.ts` 的 `adminRichEditor` namespace。
 */

import React from "react";
import { Editor, EditorContent } from "@tiptap/react";
import { Tooltip } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

interface RichTextEditorProps {
  editor: Editor | null;
  onInsertImage?: () => void;
  onInsertYoutube?: () => void;
  onInsertLoom?: () => void;
  onInsertLink?: () => void;
  onInsertImageGallery?: () => void;
}

/**
 * 富文本編輯器元件
 * @description 提供完整的 Tiptap 編輯器 UI，包含工具列、BubbleMenu 和 FloatingMenu
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  editor,
  onInsertImage,
  onInsertYoutube,
  onInsertLoom,
  onInsertLink,
  onInsertImageGallery,
}) => {
  const { t } = useLanguage();
  const te = t.adminRichEditor;

  if (!editor) {
    return null;
  }

  /**
   * 字體選單：中文字體的顯示名走字典（英文介面會附上英文名），
   * 西文字體本來就是英文原名，兩種語言都直接用字面值。
   */
  const fontOptions: { label: string; value: string }[] = [
    { label: te.fontDefault, value: "" },
    { label: te.fontJhengHei, value: "Microsoft JhengHei" },
    { label: te.fontPMingLiU, value: "PMingLiU" },
    { label: te.fontKai, value: "DFKai-SB" },
    { label: "Arial", value: "Arial" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Courier New", value: "Courier New" },
    { label: "Georgia", value: "Georgia" },
  ];

  return (
    <div className="space-y-4">
      {/* 編輯器工具列
          data-tour 是新手導覽（frontend/src/tours/）的定位錨點 */}
      <div
        data-tour="editor-toolbar"
        className="flex flex-wrap gap-1 p-2 bg-luxe-surface rounded-lg border border-luxe-gold/20"
      >
        {/* 文字格式 - 第一行 */}
        <Tooltip label={te.bold}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("bold") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            <strong>B</strong>
          </button>
        </Tooltip>
        <Tooltip label={te.italic}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("italic") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            <em>I</em>
          </button>
        </Tooltip>
        <Tooltip label={te.underline}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("underline") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            <u>U</u>
          </button>
        </Tooltip>
        <Tooltip label={te.strike}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("strike") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            <s>S</s>
          </button>
        </Tooltip>
        <Tooltip label={te.subscript}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("subscript") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            X<sub>2</sub>
          </button>
        </Tooltip>
        <Tooltip label={te.superscript}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("superscript") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            X<sup>2</sup>
          </button>
        </Tooltip>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 文字顏色 */}
        <div className="relative group">
          <Tooltip label={te.textColor}>
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1"
            >
              <span className="text-red-500">A</span>
              <span className="text-[10px]">▼</span>
            </button>
          </Tooltip>
          <div className="absolute top-full left-0 mt-1 p-2 bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl hidden group-hover:grid grid-cols-5 gap-1 z-50 min-w-[140px]">
            {[
              "#ef4444",
              "#f97316",
              "#eab308",
              "#22c55e",
              "#06b6d4",
              "#3b82f6",
              "#8b5cf6",
              "#ec4899",
              "#ffffff",
              "#000000",
            ].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => editor.chain().focus().setColor(color).run()}
                title={te.setTextColorTitle.replace("{color}", color)}
                className="w-6 h-6 rounded border border-luxe-gold/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetColor().run()}
              title={te.clearTextColorTitle}
              className="col-span-5 text-xs text-gray-400 hover:text-white py-1"
            >
              {te.clearTextColor}
            </button>
          </div>
        </div>

        {/* 螢光筆 */}
        <div className="relative group">
          <Tooltip label={te.highlight}>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1 ${editor.isActive("highlight") ? "bg-luxe-gold text-black" : ""}`}
            >
              <span className="bg-yellow-300 text-black px-1">H</span>
              <span className="text-[10px]">▼</span>
            </button>
          </Tooltip>
          <div className="absolute top-full left-0 mt-1 p-2 bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl hidden group-hover:grid grid-cols-5 gap-1 z-50 min-w-[140px]">
            {[
              "#fef08a",
              "#fed7aa",
              "#bbf7d0",
              "#a5f3fc",
              "#c4b5fd",
              "#fbcfe8",
              "#fecaca",
              "#e5e5e5",
              "#fde047",
              "#4ade80",
            ].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHighlight({ color }).run()
                }
                title={te.setHighlightTitle.replace("{color}", color)}
                className="w-6 h-6 rounded border border-luxe-gold/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              title={te.clearHighlightTitle}
              className="col-span-5 text-xs text-gray-400 hover:text-white py-1"
            >
              {te.clearHighlight}
            </button>
          </div>
        </div>

        {/* 字體選擇 */}
        <div className="relative group">
          <Tooltip label={te.font}>
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1"
            >
              <span>{te.font}</span>
              <span className="text-[10px]">▼</span>
            </button>
          </Tooltip>
          <div className="absolute top-full left-0 mt-1 p-2 bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl hidden group-hover:block z-50 min-w-[160px]">
            {fontOptions.map((font) => (
              <button
                key={font.value}
                type="button"
                onClick={() =>
                  font.value
                    ? editor.chain().focus().setFontFamily(font.value).run()
                    : editor.chain().focus().unsetFontFamily().run()
                }
                title={te.setFontTitle.replace("{name}", font.label)}
                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                style={{ fontFamily: font.value || "inherit" }}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 標題 */}
        <Tooltip label={te.heading1}>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("heading", { level: 1 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            H1
          </button>
        </Tooltip>
        <Tooltip label={te.heading2}>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("heading", { level: 2 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            H2
          </button>
        </Tooltip>
        <Tooltip label={te.heading3}>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("heading", { level: 3 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            H3
          </button>
        </Tooltip>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 列表 */}
        <Tooltip label={te.bulletList}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("bulletList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            •
          </button>
        </Tooltip>
        <Tooltip label={te.orderedList}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("orderedList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            1.
          </button>
        </Tooltip>
        <Tooltip label={te.taskList}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("taskList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            ☑
          </button>
        </Tooltip>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 區塊 */}
        <Tooltip label={te.blockquote}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("blockquote") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            ❝
          </button>
        </Tooltip>
        <Tooltip label={te.codeBlock}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("codeBlock") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            {"</>"}
          </button>
        </Tooltip>
        <Tooltip label={te.divider}>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
          >
            ―
          </button>
        </Tooltip>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 對齊 */}
        <Tooltip label={te.alignLeft}>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive({ textAlign: "left" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            ⬅
          </button>
        </Tooltip>
        <Tooltip label={te.alignCenter}>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive({ textAlign: "center" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            ⬛
          </button>
        </Tooltip>
        <Tooltip label={te.alignRight}>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive({ textAlign: "right" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            ➡
          </button>
        </Tooltip>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 表格 */}
        <div className="relative group">
          <Tooltip label={te.table}>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1 ${editor.isActive("table") ? "bg-luxe-gold text-black" : ""}`}
            >
              ⊞<span className="text-[10px]">▼</span>
            </button>
          </Tooltip>
          <div className="absolute top-full left-0 mt-1 p-2 bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl hidden group-hover:block z-50 min-w-[160px]">
            <button
              type="button"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              title={te.insertTableTitle}
              className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
            >
              📊 {te.insertTable}
            </button>
            {editor.isActive("table") && (
              <>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  title={te.addColumnTitle}
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                >
                  ➕ {te.addColumn}
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  title={te.addRowTitle}
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                >
                  ➕ {te.addRow}
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  title={te.deleteColumnTitle}
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                >
                  ➖ {te.deleteColumn}
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  title={te.deleteRowTitle}
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                >
                  ➖ {te.deleteRow}
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  title={te.deleteTableTitle}
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                >
                  🗑️ {te.deleteTable}
                </button>
              </>
            )}
          </div>
        </div>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 插入媒體 */}
        {onInsertImage && (
          <Tooltip label={te.insertImage}>
            <button
              type="button"
              onClick={onInsertImage}
              data-tour="editor-insert-image"
              className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
            >
              🖼️
            </button>
          </Tooltip>
        )}
        {onInsertImageGallery && (
          <Tooltip label={te.insertGallery}>
            <button
              type="button"
              onClick={onInsertImageGallery}
              className={`px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 ${editor.isActive("imageGallery") ? "bg-luxe-gold text-black" : ""}`}
            >
              🏞️
            </button>
          </Tooltip>
        )}
        {onInsertYoutube && (
          <Tooltip label={te.insertYoutube}>
            <button
              type="button"
              onClick={onInsertYoutube}
              className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
            >
              🎬
            </button>
          </Tooltip>
        )}
        {onInsertLoom && (
          <Tooltip label={te.insertLoom}>
            <button
              type="button"
              onClick={onInsertLoom}
              className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
            >
              🎙️
            </button>
          </Tooltip>
        )}
        {onInsertLink && (
          <Tooltip label={te.insertLink}>
            <button
              type="button"
              onClick={onInsertLink}
              className={`px-3 py-1.5 text-sm rounded ${editor.isActive("link") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
            >
              🔗
            </button>
          </Tooltip>
        )}
        {editor.isActive("link") && (
          <Tooltip label={te.removeLink}>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
            >
              ✕
            </button>
          </Tooltip>
        )}
      </div>

      {/* 編輯器內容區域 */}
      <div className="min-h-[600px] p-6 bg-luxe-surface rounded-lg border border-luxe-gold/20">
        {/* 注意：BubbleMenu 和 FloatingMenu 已移除，因為 Tiptap 3.x API 變更 */}
        {/* 建議使用新版 components/ui/editor/RichTextEditor */}

        <EditorContent
          editor={editor}
          className="prose prose-invert max-w-none min-h-[550px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[550px]"
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
