/**
 * 富文本編輯器元件
 * @module components/editor/RichTextEditor
 * @description 共用的 Tiptap 編輯器，支援完整的格式化功能
 *
 * 注意：此元件已棄用，建議使用 components/ui/editor/RichTextEditor
 */

import React from "react";
import { Editor, EditorContent } from "@tiptap/react";

interface RichTextEditorProps {
  editor: Editor | null;
  onInsertImage?: () => void;
  onInsertYoutube?: () => void;
  onInsertLink?: () => void;
}

/**
 * 富文本編輯器元件
 * @description 提供完整的 Tiptap 編輯器 UI，包含工具列、BubbleMenu 和 FloatingMenu
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  editor,
  onInsertImage,
  onInsertYoutube,
  onInsertLink,
}) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 編輯器工具列 */}
      <div className="flex flex-wrap gap-1 p-2 bg-luxe-surface rounded-lg border border-luxe-gold/20">
        {/* 文字格式 - 第一行 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="粗體 (Ctrl+B) - 讓文字變粗，強調重點"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("bold") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜體 (Ctrl+I) - 讓文字傾斜，常用於引用或強調"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("italic") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="底線 (Ctrl+U) - 在文字下方加線"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("underline") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="刪除線 - 在文字中間畫線，表示刪除或更正"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("strike") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          <s>S</s>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          title="下標 - 文字縮小並下移，如 H₂O"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("subscript") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          X<sub>2</sub>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          title="上標 - 文字縮小並上移，如 X²"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("superscript") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          X<sup>2</sup>
        </button>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 文字顏色 */}
        <div className="relative group">
          <button
            type="button"
            title="文字顏色 - 改變選取文字的顏色"
            className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1"
          >
            <span className="text-red-500">A</span>
            <span className="text-[10px]">▼</span>
          </button>
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
                title={`設定文字顏色: ${color}`}
                className="w-6 h-6 rounded border border-luxe-gold/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetColor().run()}
              title="清除文字顏色"
              className="col-span-5 text-xs text-gray-400 hover:text-white py-1"
            >
              清除顏色
            </button>
          </div>
        </div>

        {/* 螢光筆 */}
        <div className="relative group">
          <button
            type="button"
            title="螢光筆 - 為文字加上背景色標記"
            className={`px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1 ${editor.isActive("highlight") ? "bg-luxe-gold text-black" : ""}`}
          >
            <span className="bg-yellow-300 text-black px-1">H</span>
            <span className="text-[10px]">▼</span>
          </button>
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
                title={`設定螢光筆顏色: ${color}`}
                className="w-6 h-6 rounded border border-luxe-gold/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              title="清除螢光筆"
              className="col-span-5 text-xs text-gray-400 hover:text-white py-1"
            >
              清除螢光筆
            </button>
          </div>
        </div>

        {/* 字體選擇 */}
        <div className="relative group">
          <button
            type="button"
            title="字體 - 選擇文字字體"
            className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1"
          >
            <span>字體</span>
            <span className="text-[10px]">▼</span>
          </button>
          <div className="absolute top-full left-0 mt-1 p-2 bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl hidden group-hover:block z-50 min-w-[160px]">
            {[
              { name: "預設", value: "" },
              { name: "微軟正黑體", value: "Microsoft JhengHei" },
              { name: "新細明體", value: "PMingLiU" },
              { name: "標楷體", value: "DFKai-SB" },
              { name: "Arial", value: "Arial" },
              { name: "Times New Roman", value: "Times New Roman" },
              { name: "Courier New", value: "Courier New" },
              { name: "Georgia", value: "Georgia" },
            ].map((font) => (
              <button
                key={font.value}
                type="button"
                onClick={() =>
                  font.value
                    ? editor.chain().focus().setFontFamily(font.value).run()
                    : editor.chain().focus().unsetFontFamily().run()
                }
                title={`設定字體: ${font.name}`}
                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                style={{ fontFamily: font.value || "inherit" }}
              >
                {font.name}
              </button>
            ))}
          </div>
        </div>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 標題 */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="大標題 (H1) - 文章主標題，字體最大，每篇文章建議只用一次"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("heading", { level: 1 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="中標題 (H2) - 段落標題，字體中等，用於劃分主要段落"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("heading", { level: 2 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="小標題 (H3) - 子段落標題，字體較小，用於細分內容"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("heading", { level: 3 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          H3
        </button>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 列表 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="項目符號列表 - 用圓點條列重點，適合無順序的清單"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("bulletList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="編號列表 - 用數字條列步驟，適合有順序的清單"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("orderedList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="待辦清單 - 可勾選的任務清單"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("taskList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          ☑
        </button>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 區塊 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="引用區塊 - 引用他人的話或重要內容"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("blockquote") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          ❝
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="程式碼區塊 - 顯示程式碼，保留格式"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive("codeBlock") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          {"</>"}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="水平分隔線 - 在段落之間加入分隔線"
          className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
        >
          ―
        </button>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 對齊 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="左對齊 - 文字靠左排列（預設）"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive({ textAlign: "left" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="置中對齊 - 文字置中排列，適合標題或引言"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive({ textAlign: "center" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          ⬛
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="右對齊 - 文字靠右排列"
          className={`px-3 py-1.5 text-sm rounded ${editor.isActive({ textAlign: "right" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
        >
          ➡
        </button>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 表格 */}
        <div className="relative group">
          <button
            type="button"
            title="表格 - 插入或編輯表格"
            className={`px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1 ${editor.isActive("table") ? "bg-luxe-gold text-black" : ""}`}
          >
            ⊞<span className="text-[10px]">▼</span>
          </button>
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
              title="插入 3x3 表格"
              className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
            >
              📊 插入表格 (3x3)
            </button>
            {editor.isActive("table") && (
              <>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  title="在右側新增一欄"
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                >
                  ➕ 新增欄
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  title="在下方新增一列"
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                >
                  ➕ 新增列
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  title="刪除當前欄"
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                >
                  ➖ 刪除欄
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  title="刪除當前列"
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                >
                  ➖ 刪除列
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  title="刪除整個表格"
                  className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                >
                  🗑️ 刪除表格
                </button>
              </>
            )}
          </div>
        </div>

        <span className="w-px bg-luxe-gold/30 mx-1" />

        {/* 插入媒體 */}
        {onInsertImage && (
          <button
            type="button"
            onClick={onInsertImage}
            title="插入圖片 - 貼上 Cloudinary 圖片網址（僅支援 Cloudinary）"
            className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
          >
            🖼️
          </button>
        )}
        {onInsertYoutube && (
          <button
            type="button"
            onClick={onInsertYoutube}
            title="插入 YouTube 影片 - 貼上 YouTube 網址（僅支援 YouTube）"
            className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
          >
            🎬
          </button>
        )}
        {onInsertLink && (
          <button
            type="button"
            onClick={onInsertLink}
            title="插入連結 - 將文字轉換成可點擊的連結"
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("link") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            🔗
          </button>
        )}
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="移除連結"
            className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
          >
            ✕
          </button>
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
