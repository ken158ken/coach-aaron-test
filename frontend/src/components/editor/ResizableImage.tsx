/**
 * Tiptap 可調整大小圖片擴展
 * @module editor/ResizableImage
 * @description 支援拖曳調整圖片大小的 Tiptap 擴展
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewProps,
} from "@tiptap/react";
import React, { useCallback, useRef, useState } from "react";

// ============ 可調整大小圖片 Node View ============

const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { src, alt, width } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setStartX(e.clientX);
      setStartWidth(width || containerRef.current?.offsetWidth || 300);
    },
    [width],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(100, Math.min(startWidth + delta, 800));
      updateAttributes({ width: newWidth });
    },
    [isResizing, startX, startWidth, updateAttributes],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 綁定全域事件
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

  return (
    <NodeViewWrapper
      className={`relative inline-block ${selected ? "ring-2 ring-luxe-gold ring-offset-2 ring-offset-luxe-bg" : ""}`}
    >
      <div
        ref={containerRef}
        className="relative group"
        style={{ width: width ? `${width}px` : "auto" }}
      >
        <img
          src={src}
          alt={alt || ""}
          className="max-w-full h-auto rounded-lg"
          draggable={false}
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

        {/* 尺寸顯示 */}
        {selected && width && (
          <div className="absolute bottom-0 left-0 px-2 py-1 bg-black/70 text-white text-xs rounded">
            {width}px
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// ============ Tiptap 擴展 ============

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: {
        src: string;
        alt?: string;
        title?: string;
      }) => ReturnType;
    };
  }
}

export const ResizableImage = Node.create({
  name: "resizableImage",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width");
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        class: "max-w-full h-auto rounded-lg",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setResizableImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default ResizableImage;
