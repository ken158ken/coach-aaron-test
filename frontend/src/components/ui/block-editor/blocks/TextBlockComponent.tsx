/**
 * 文字區塊元件
 * @module components/ui/block-editor/blocks/TextBlockComponent
 * @description 可雙擊進入 Tiptap 編輯模式
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import type { TextBlock } from "../types";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { useLanguage } from "@/context/LanguageContext";

interface TextBlockComponentProps {
  block: TextBlock;
  isSelected: boolean;
  isEditing: boolean;
  onContentChange: (content: string) => void;
  onDoubleClick: () => void;
  onBlur: () => void;
}

const TextBlockComponent: React.FC<TextBlockComponentProps> = ({
  block,
  isSelected,
  isEditing,
  onContentChange,
  onDoubleClick,
  onBlur,
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [localContent, setLocalContent] = useState(block.content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: block.content,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setLocalContent(html);
      onContentChange(html);
    },
  });

  // 同步編輯狀態
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
      if (isEditing) {
        editor.commands.focus("end");
      }
    }
  }, [editor, isEditing]);

  // 同步內容
  useEffect(() => {
    if (editor && block.content !== localContent) {
      editor.commands.setContent(block.content);
      setLocalContent(block.content);
    }
  }, [block.content]);

  // 處理點擊外部
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onBlur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, onBlur]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!block.locked) {
        onDoubleClick();
      }
    },
    [block.locked, onDoubleClick],
  );

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${
        isEditing ? "cursor-text" : "cursor-move"
      }`}
      style={{
        padding: block.padding,
        backgroundColor: block.backgroundColor,
        textAlign: block.textAlign,
        fontSize: block.fontSize,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <>
          {/* 編輯模式工具列 */}
          <div className="absolute -top-10 left-0 flex gap-1 p-1 bg-luxe-bg border border-luxe-gold/30 rounded-lg shadow-lg z-50">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-2 py-1 text-xs rounded ${
                editor?.isActive("bold")
                  ? "bg-luxe-gold text-black"
                  : "hover:bg-luxe-gold/20"
              }`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-2 py-1 text-xs rounded italic ${
                editor?.isActive("italic")
                  ? "bg-luxe-gold text-black"
                  : "hover:bg-luxe-gold/20"
              }`}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`px-2 py-1 text-xs rounded underline ${
                editor?.isActive("underline")
                  ? "bg-luxe-gold text-black"
                  : "hover:bg-luxe-gold/20"
              }`}
            >
              U
            </button>
            <span className="w-px bg-luxe-gold/30" />
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`px-2 py-1 text-xs rounded ${
                editor?.isActive("heading", { level: 1 })
                  ? "bg-luxe-gold text-black"
                  : "hover:bg-luxe-gold/20"
              }`}
            >
              H1
            </button>
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`px-2 py-1 text-xs rounded ${
                editor?.isActive("heading", { level: 2 })
                  ? "bg-luxe-gold text-black"
                  : "hover:bg-luxe-gold/20"
              }`}
            >
              H2
            </button>
            <span className="w-px bg-luxe-gold/30" />
            <button
              type="button"
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              className={`px-2 py-1 text-xs rounded ${
                editor?.isActive({ textAlign: "left" })
                  ? "bg-luxe-gold text-black"
                  : "hover:bg-luxe-gold/20"
              }`}
            >
              ⬅
            </button>
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().setTextAlign("center").run()
              }
              className={`px-2 py-1 text-xs rounded ${
                editor?.isActive({ textAlign: "center" })
                  ? "bg-luxe-gold text-black"
                  : "hover:bg-luxe-gold/20"
              }`}
            >
              ⬛
            </button>
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().setTextAlign("right").run()
              }
              className={`px-2 py-1 text-xs rounded ${
                editor?.isActive({ textAlign: "right" })
                  ? "bg-luxe-gold text-black"
                  : "hover:bg-luxe-gold/20"
              }`}
            >
              ➡
            </button>
          </div>
          <EditorContent
            editor={editor}
            className="prose prose-invert max-w-none h-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:h-full"
          />
        </>
      ) : (
        <div
          className="prose prose-invert max-w-none h-full overflow-hidden"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
        />
      )}

      {/* 雙擊提示 */}
      {isSelected && !isEditing && (
        <div className="absolute bottom-2 left-2 text-xs text-luxe-gold/50">
          {t.blockEditor.doubleClickToEdit}
        </div>
      )}
    </div>
  );
};

export default TextBlockComponent;
