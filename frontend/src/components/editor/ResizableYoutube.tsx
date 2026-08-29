/**
 * Tiptap 可調整大小 YouTube 擴展
 * @module editor/ResizableYoutube
 * @description 支援拖曳調整 YouTube 影片大小的 Tiptap 擴展
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewProps,
} from "@tiptap/react";
import React, { useCallback, useRef, useState } from "react";

// ============ YouTube ID 提取 ============

const extractYouTubeId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// ============ 可調整大小 YouTube Node View ============

const ResizableYoutubeComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { src, width = 640 } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const videoId = extractYouTubeId(src);

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
      // 維持 16:9 比例
      const newHeight = Math.round((newWidth * 9) / 16);
      updateAttributes({ width: newWidth, height: newHeight });
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

  if (!videoId) {
    return (
      <NodeViewWrapper>
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          無效的 YouTube 網址
        </div>
      </NodeViewWrapper>
    );
  }

  // 計算高度維持 16:9 比例
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
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube Video"
          width={width}
          height={height}
          className="rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

        {/* 尺寸顯示 */}
        {selected && (
          <div className="absolute bottom-0 left-0 px-2 py-1 bg-black/70 text-white text-xs rounded">
            {width} × {height}
          </div>
        )}

        {/* YouTube 標籤 */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs rounded flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          YouTube
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// ============ Tiptap 擴展 ============

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableYoutube: {
      setResizableYoutube: (options: { src: string }) => ReturnType;
    };
  }
}

export const ResizableYoutube = Node.create({
  name: "resizableYoutube",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
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
    return [
      {
        tag: 'iframe[src*="youtube.com"]',
      },
      {
        tag: 'iframe[src*="youtu.be"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = extractYouTubeId(HTMLAttributes.src);
    return [
      "iframe",
      mergeAttributes(HTMLAttributes, {
        src: `https://www.youtube.com/embed/${videoId}`,
        frameborder: "0",
        allowfullscreen: "true",
        class: "rounded-lg",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableYoutubeComponent);
  },

  addCommands() {
    return {
      setResizableYoutube:
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

export default ResizableYoutube;
