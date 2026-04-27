/**
 * Tiptap 可調整大小 Loom 擴展
 * @module editor/ResizableLoom
 *
 * 跟 ResizableYoutube 一樣的拖曳行為與 16:9 限制；
 * 差別只在於 URL → embed iframe 轉換與 LOOM 標籤色。
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewProps,
} from "@tiptap/react";
import React, { useCallback, useRef, useState } from "react";

// ============ Loom ID 提取 ============

const extractLoomId = (url: string): string | null => {
  if (!url) return null;
  const cleaned = url.trim();
  if (/^[a-f0-9]{32}$/i.test(cleaned)) return cleaned.toLowerCase();
  const match = cleaned.match(
    /loom\.com\/(?:share|embed)\/([a-f0-9]{32})(?:[/?#]|$)/i,
  );
  return match ? match[1].toLowerCase() : null;
};

// ============ NodeView ============

const ResizableLoomComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { src, width = 640 } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const loomId = extractLoomId(src);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setStartX(e.clientX);
      setStartWidth(width);
    },
    [width],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(280, Math.min(startWidth + delta, 960));
      const newHeight = Math.round((newWidth * 9) / 16);
      updateAttributes({ width: newWidth, height: newHeight });
    },
    [isResizing, startX, startWidth, updateAttributes],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!loomId) {
    return (
      <NodeViewWrapper>
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          無效的 Loom 網址
        </div>
      </NodeViewWrapper>
    );
  }

  const height = Math.round((width * 9) / 16);

  return (
    <NodeViewWrapper
      className={`relative inline-block ${selected ? "ring-2 ring-luxe-gold ring-offset-2 ring-offset-luxe-bg" : ""}`}
    >
      <div
        ref={containerRef}
        className="relative group"
        style={{ width: `${width}px` }}
      >
        <iframe
          src={`https://www.loom.com/embed/${loomId}`}
          title="Loom Video"
          width={width}
          height={height}
          className="rounded-lg"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          allowFullScreen
        />

        {/* 調整大小手柄 */}
        <div
          className="absolute bottom-2 right-2 w-6 h-6 bg-luxe-gold rounded cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
          onMouseDown={handleMouseDown}
        >
          <svg
            className="w-4 h-4 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </div>

        {selected && (
          <div className="absolute bottom-0 left-0 px-2 py-1 bg-black/70 text-white text-xs rounded">
            {width} × {height}
          </div>
        )}

        {/* Loom 標籤（紫色） */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs rounded flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4l4 4-4 4-4-4 4-4zm0 12a4 4 0 1 1 4-4 4 4 0 0 1-4 4z" />
          </svg>
          Loom
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// ============ Tiptap Extension ============

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableLoom: {
      setResizableLoom: (options: { src: string }) => ReturnType;
    };
  }
}

export const ResizableLoom = Node.create({
  name: "resizableLoom",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: {
        default: 640,
        parseHTML: (element) => {
          const width = element.getAttribute("width");
          return width ? parseInt(width, 10) : 640;
        },
      },
      height: {
        default: 360,
        parseHTML: (element) => {
          const height = element.getAttribute("height");
          return height ? parseInt(height, 10) : 360;
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe[src*="loom.com"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const loomId = extractLoomId(HTMLAttributes.src);
    return [
      "iframe",
      mergeAttributes(HTMLAttributes, {
        src: loomId ? `https://www.loom.com/embed/${loomId}` : HTMLAttributes.src,
        frameborder: "0",
        allowfullscreen: "true",
        allow:
          "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media",
        class: "rounded-lg",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableLoomComponent);
  },

  addCommands() {
    return {
      setResizableLoom:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              width: 640,
              height: 360,
            },
          });
        },
    };
  },
});

export default ResizableLoom;
