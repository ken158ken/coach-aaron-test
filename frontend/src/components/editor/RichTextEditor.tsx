/**
 * 富文本編輯器元件
 * @module components/editor/RichTextEditor
 * @description 共用的 Tiptap 編輯器，支援完整的格式化功能
 *
 * 注意：此元件已棄用，建議使用 components/ui/editor/RichTextEditor
 */

import React from "react";
import { Editor, EditorContent } from "@tiptap/react";
import { Tooltip } from "@/components/ui";

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
  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 編輯器工具列 */}
      <div className="flex flex-wrap gap-1 p-2 bg-luxe-surface rounded-lg border border-luxe-gold/20">
        {/* 文字格式 - 第一行 */}
        <Tooltip label="粗體 (Ctrl+B)">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("bold") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            <strong>B</strong>
          </button>
        </Tooltip>
        <Tooltip label="斜體 (Ctrl+I)">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("italic") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            <em>I</em>
          </button>
        </Tooltip>
        <Tooltip label="底線 (Ctrl+U)">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("underline") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            <u>U</u>
          </button>
        </Tooltip>
        <Tooltip label="刪除線">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("strike") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            <s>S</s>
          </button>
        </Tooltip>
        <Tooltip label="下標">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("subscript") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            X<sub>2</sub>
          </button>
        </Tooltip>
        <Tooltip label="上標">
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
          <Tooltip label="文字顏色">
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
          <Tooltip label="螢光筆">
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
          <Tooltip label="字體">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1"
            >
              <span>字體</span>
              <span className="text-[10px]">▼</span>
            </button>
          </Tooltip>
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
        <Tooltip label="大標題 (H1)">
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
        <Tooltip label="中標題 (H2)">
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
        <Tooltip label="小標題 (H3)">
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
        <Tooltip label="項目符號">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("bulletList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            •
          </button>
        </Tooltip>
        <Tooltip label="編號列表">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("orderedList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            1.
          </button>
        </Tooltip>
        <Tooltip label="待辦清單">
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
        <Tooltip label="引用區塊">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("blockquote") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            ❝
          </button>
        </Tooltip>
        <Tooltip label="程式碼區塊">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive("codeBlock") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            {"</>"}
          </button>
        </Tooltip>
        <Tooltip label="分隔線">
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
        <Tooltip label="靠左對齊">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive({ textAlign: "left" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            ⬅
          </button>
        </Tooltip>
        <Tooltip label="置中對齊">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`px-3 py-1.5 text-sm rounded ${editor.isActive({ textAlign: "center" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
          >
            ⬛
          </button>
        </Tooltip>
        <Tooltip label="靠右對齊">
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
          <Tooltip label="表格">
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
          <Tooltip label="插入圖片">
            <button
              type="button"
              onClick={onInsertImage}
              className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
            >
              🖼️
            </button>
          </Tooltip>
        )}
        {onInsertImageGallery && (
          <Tooltip label="插入圖片庫（最多3張一排）">
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
          <Tooltip label="插入 YouTube">
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
          <Tooltip label="插入 Loom">
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
          <Tooltip label="插入連結">
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
          <Tooltip label="移除連結">
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
