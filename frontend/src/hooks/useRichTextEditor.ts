/**
 * Tiptap 編輯器配置 Hook
 * @module hooks/useRichTextEditor
 * @description 提供完整的 Tiptap 編輯器配置
 */

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Typography } from "@tiptap/extension-typography";
// import { Dropcursor } from "@tiptap/extension-dropcursor"; // 已包含在 StarterKit 中
// import { Gapcursor } from "@tiptap/extension-gapcursor"; // 已包含在 StarterKit 中
import Mention from "@tiptap/extension-mention";
import Focus from "@tiptap/extension-focus";
import FontFamily from "@tiptap/extension-font-family";
import { BubbleMenu } from "@tiptap/extension-bubble-menu";
import { FloatingMenu } from "@tiptap/extension-floating-menu";
import {
  ResizableImage,
  ResizableYoutube,
  ResizableLoom,
  ImageGallery,
} from "@/components/editor";

// 初始化 lowlight 語法高亮
const lowlight = createLowlight(common);

interface UseRichTextEditorOptions {
  content: string;
  placeholder?: string;
  onUpdate: (html: string) => void;
}

/**
 * 使用富文本編輯器
 * @param options - 編輯器選項
 * @returns Tiptap 編輯器實例
 */
export const useRichTextEditor = ({
  content,
  placeholder = "開始撰寫內容...（輸入 @ 可提及他人）",
  onUpdate,
}: UseRichTextEditorOptions) => {
  const editor = useEditor({
    // SSR 相容性設定
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // 停用預設 codeBlock，使用 lowlight 版本
        codeBlock: false,
        dropcursor: {
          color: "#d4af37",
          width: 2,
        },
      }),
      // 程式碼語法高亮
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
      }),
      // 基本格式
      Underline,
      Subscript,
      Superscript,
      // 文字樣式
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily.configure({
        types: ["textStyle"],
      }),
      // 對齊
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      // 表格
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      // 待辦清單
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      // @提及功能
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          items: ({ query }) => {
            return ["Aaron 教練", "營養師", "學員", "健身房", "教練團隊"]
              .filter((item) =>
                item.toLowerCase().startsWith(query.toLowerCase()),
              )
              .slice(0, 5);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = document.createElement("div");
                component.className = "mention-suggestions";

                if (props.items.length > 0) {
                  popup = document.createElement("div");
                  popup.className =
                    "bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl p-1 max-h-60 overflow-auto";
                  props.items.forEach((item: string, index: number) => {
                    const button = document.createElement("button");
                    button.className =
                      "w-full text-left px-3 py-2 text-sm rounded hover:bg-luxe-gold/20 transition-colors";
                    button.textContent = item;
                    button.onclick = () => props.command({ id: item });
                    if (index === props.selectedIndex) {
                      button.classList.add("bg-luxe-gold/10");
                    }
                    popup.appendChild(button);
                  });
                  component.appendChild(popup);
                  document.body.appendChild(component);
                }
              },
              onUpdate: (props: any) => {
                if (popup && props.items.length > 0) {
                  popup.innerHTML = "";
                  props.items.forEach((item: string, index: number) => {
                    const button = document.createElement("button");
                    button.className =
                      "w-full text-left px-3 py-2 text-sm rounded hover:bg-luxe-gold/20 transition-colors";
                    button.textContent = item;
                    button.onclick = () => props.command({ id: item });
                    if (index === props.selectedIndex) {
                      button.classList.add("bg-luxe-gold/10");
                    }
                    popup.appendChild(button);
                  });
                }
              },
              onExit: () => {
                if (component) {
                  component.remove();
                }
              },
            };
          },
        },
      }),
      // 焦點追蹤
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
      // 浮動工具列
      BubbleMenu,
      FloatingMenu,
      // 媒體
      ResizableImage,
      ImageGallery,
      Link.configure({
        openOnClick: false,
      }),
      ResizableYoutube,
      ResizableLoom,
      // 功能性
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
      Typography,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  return editor;
};

export default useRichTextEditor;
