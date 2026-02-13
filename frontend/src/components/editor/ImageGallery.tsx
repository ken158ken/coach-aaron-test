/**
 * Tiptap 圖片庫擴展 — 支援最多三張圖片一排
 * @module editor/ImageGallery
 *
 * @description
 * 自訂 TipTap Node 擴展，讓使用者在編輯器中以「圖片排列」的方式
 * 插入 1~3 張圖片，每張圖片可獨立拖曳調整大小。
 *
 * 技術：
 * - TipTap Node Extension + ReactNodeViewRenderer
 * - 支援 Cloudinary URL
 * - 以 Flexbox 水平排列，手機自動換行
 * - HTML 輸出為 <div class="image-gallery"> 包裹的 <img> 標籤
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import React, { useCallback, useRef, useState, useEffect } from "react";

// ============ 型別定義 ============

interface GalleryImage {
  src: string;
  alt?: string;
  width?: number;
}

// Cloudinary URL 驗證
const CLOUDINARY_REGEX = /^https:\/\/res\.cloudinary\.com\/.+/i;
const isValidCloudinaryUrl = (url: string): boolean =>
  CLOUDINARY_REGEX.test(url.trim());

// ============ 單張圖片子元件（含 Resize） ============

interface GalleryItemProps {
  image: GalleryImage;
  index: number;
  selected: boolean;
  onResize: (index: number, width: number) => void;
  onRemove: (index: number) => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({
  image,
  index,
  selected,
  onResize,
  onRemove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current =
        image.width || containerRef.current?.offsetWidth || 200;
    },
    [image.width],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(
        80,
        Math.min(startWidthRef.current + delta, 600),
      );
      onResize(index, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, index, onResize]);

  return (
    <div
      ref={containerRef}
      className="relative group flex-shrink-0"
      style={{
        width: image.width ? `${image.width}px` : "auto",
        maxWidth: "100%",
      }}
    >
      <img
        src={image.src}
        alt={image.alt || ""}
        className={`w-full h-auto rounded-lg object-cover ${
          selected
            ? "ring-2 ring-luxe-gold ring-offset-1 ring-offset-luxe-bg"
            : ""
        }`}
        draggable={false}
      />

      {/* 刪除按鈕 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
        title="移除此圖片"
      >
        ✕
      </button>

      {/* 調整大小手柄 */}
      <div
        className="absolute bottom-1 right-1 w-5 h-5 bg-luxe-gold rounded cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
        onMouseDown={handleMouseDown}
      >
        <svg
          className="w-3 h-3 text-black"
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

      {/* 尺寸指示 */}
      {selected && image.width && (
        <div className="absolute bottom-0 left-0 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded">
          {image.width}px
        </div>
      )}
    </div>
  );
};

// ============ 圖片庫新增面板 ============

interface AddImagePanelProps {
  onAdd: (url: string) => void;
  canAdd: boolean;
}

const AddImagePanel: React.FC<AddImagePanelProps> = ({ onAdd, canAdd }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const handleAdd = useCallback(() => {
    if (!url.trim()) {
      setError("請輸入圖片網址");
      return;
    }
    if (!isValidCloudinaryUrl(url)) {
      setError(
        "只能使用 Cloudinary 圖片網址（https://res.cloudinary.com/...）",
      );
      return;
    }
    onAdd(url.trim());
    setUrl("");
    setError("");
    setPreview(false);
  }, [url, onAdd]);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setError("");
    setPreview(isValidCloudinaryUrl(value));
  }, []);

  if (!canAdd) return null;

  return (
    <div className="flex-shrink-0 w-full sm:w-auto min-w-[120px] max-w-[240px]">
      <div className="border-2 border-dashed border-luxe-gold/30 rounded-lg p-2 hover:border-luxe-gold/60 transition-colors">
        <input
          type="text"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Cloudinary URL..."
          className="w-full text-xs bg-transparent border-none outline-none text-luxe-text placeholder:text-luxe-muted/50 mb-1.5"
        />
        {preview && (
          <img
            src={url}
            alt="預覽"
            className="w-full h-16 object-cover rounded mb-1.5"
            onError={() => setPreview(false)}
          />
        )}
        {error && <p className="text-red-400 text-[10px] mb-1">{error}</p>}
        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-1 text-xs bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold rounded transition-colors"
        >
          ＋ 新增圖片
        </button>
      </div>
    </div>
  );
};

// ============ Gallery NodeView 主元件 ============

const ImageGalleryComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const images: GalleryImage[] = node.attrs.images || [];
  const MAX_IMAGES = 3;

  const handleResize = useCallback(
    (index: number, width: number) => {
      const updated = [...images];
      updated[index] = { ...updated[index], width };
      updateAttributes({ images: updated });
    },
    [images, updateAttributes],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      updateAttributes({ images: updated });
    },
    [images, updateAttributes],
  );

  const handleAdd = useCallback(
    (url: string) => {
      if (images.length >= MAX_IMAGES) return;
      const updated = [...images, { src: url, alt: "", width: undefined }];
      updateAttributes({ images: updated });
    },
    [images, updateAttributes],
  );

  return (
    <NodeViewWrapper
      className={`my-4 ${selected ? "ring-2 ring-luxe-gold/50 ring-offset-2 ring-offset-luxe-bg rounded-lg" : ""}`}
    >
      <div className="relative">
        {/* 標籤 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-luxe-gold/60 bg-luxe-gold/10 px-2 py-0.5 rounded">
            📷 圖片庫 ({images.length}/{MAX_IMAGES})
          </span>
        </div>

        {/* 圖片排列區 */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-start">
          {images.map((img, index) => (
            <GalleryItem
              key={`${img.src}-${index}`}
              image={img}
              index={index}
              selected={selected}
              onResize={handleResize}
              onRemove={handleRemove}
            />
          ))}

          {/* 新增面板 */}
          <AddImagePanel
            onAdd={handleAdd}
            canAdd={images.length < MAX_IMAGES}
          />
        </div>

        {/* 空狀態提示 */}
        {images.length === 0 && (
          <p className="text-luxe-muted/50 text-xs mt-1">
            點擊上方「＋ 新增圖片」加入圖片，最多 {MAX_IMAGES} 張一排
          </p>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// ============ TipTap 擴展定義 ============

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageGallery: {
      /**
       * 插入圖片庫區塊
       * @param images - 初始圖片陣列（可為空陣列）
       */
      setImageGallery: (images?: GalleryImage[]) => ReturnType;
    };
  }
}

export const ImageGallery = Node.create({
  name: "imageGallery",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => {
          try {
            const raw = element.getAttribute("data-images");
            return raw ? JSON.parse(raw) : [];
          } catch {
            // 向下相容：解析子 img 標籤
            const imgs = element.querySelectorAll("img");
            return Array.from(imgs).map((img) => ({
              src: img.getAttribute("src") || "",
              alt: img.getAttribute("alt") || "",
              width: img.getAttribute("width")
                ? parseInt(img.getAttribute("width")!, 10)
                : undefined,
            }));
          }
        },
        renderHTML: (attributes) => {
          return { "data-images": JSON.stringify(attributes.images || []) };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-gallery"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const images: GalleryImage[] = HTMLAttributes["data-images"]
      ? (() => {
          try {
            return JSON.parse(HTMLAttributes["data-images"]);
          } catch {
            return [];
          }
        })()
      : [];

    // 產生 HTML：外層 div.image-gallery 包裹多個 img
    const imgElements = images.map((img: GalleryImage) => {
      const attrs: Record<string, string> = {
        src: img.src,
        alt: img.alt || "",
        class: "rounded-lg object-cover",
        style: img.width
          ? `width:${img.width}px;max-width:100%`
          : "max-width:100%",
        loading: "lazy",
      };
      if (img.width) attrs.width = String(img.width);
      return ["img", attrs];
    });

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "image-gallery",
        class: "image-gallery flex flex-wrap gap-3 my-4",
        style: `display:flex;flex-wrap:wrap;gap:12px;margin:16px 0`,
      }),
      ...imgElements,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGalleryComponent);
  },

  addCommands() {
    return {
      setImageGallery:
        (images = []) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { images },
          });
        },
    };
  },
});

export default ImageGallery;
