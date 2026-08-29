/**
 * RichTextEditor 元件 - Tiptap 富文本編輯器
 * @module components/ui/editor/RichTextEditor
 * @description 支援上傳圖片 / Cloudinary 圖片、YouTube 影片嵌入、可調整尺寸
 *
 * 功能特性：
 * - 插圖走全站統一的 ImageInput（上傳到自家 Storage 或貼 Cloudinary 網址）
 * - 影片限 YouTube
 * - 圖片/影片可自訂尺寸
 * - 選中元素後可編輯調整
 */

import React, { useCallback, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Tooltip } from "@/components/ui";
import ImageInput, { useImageUploadTarget } from "@/components/ui/ImageInput";
import { isAllowedImageUrl } from "@/lib/imageUrl";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { useLanguage } from "@/context/LanguageContext";
import type { AllTranslations } from "@/context/LanguageContext";

/** 主題類型 */
type Theme = "abyss" | "prism" | "luxe";

interface RichTextEditorProps {
  /** 初始內容 (HTML 格式) */
  content?: string;
  /** 內容變更回調 */
  onChange?: (html: string) => void;
  /** 佔位文字 */
  placeholder?: string;
  /** 主題 */
  theme?: Theme;
  /** 是否唯讀 */
  readonly?: boolean;
  /** 最小高度 */
  minHeight?: string;
  /** 自訂樣式 */
  className?: string;
}

/** YouTube URL 驗證正則 */
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

/** 預設圖片尺寸選項 */
const imageSizePresets = (t: AllTranslations) => [
  { label: t.richEditor.sizeSmall.replace("{v}", "25%"), value: 25 },
  { label: t.richEditor.sizeMedium.replace("{v}", "50%"), value: 50 },
  { label: t.richEditor.sizeLarge.replace("{v}", "75%"), value: 75 },
  { label: t.richEditor.sizeFull.replace("{v}", "100%"), value: 100 },
];

/** 預設影片尺寸選項 */
const videoSizePresets = (t: AllTranslations) => [
  {
    label: t.richEditor.sizeSmall.replace("{v}", "360p"),
    width: 480,
    height: 270,
  },
  {
    label: t.richEditor.sizeMedium.replace("{v}", "480p"),
    width: 640,
    height: 360,
  },
  {
    label: t.richEditor.sizeLarge.replace("{v}", "720p"),
    width: 854,
    height: 480,
  },
  {
    label: t.richEditor.sizeXLarge.replace("{v}", "1080p"),
    width: 1280,
    height: 720,
  },
];

/** 主題樣式配置 */
const themeStyles: Record<
  Theme,
  {
    container: string;
    toolbar: string;
    toolbarButton: string;
    toolbarButtonActive: string;
    editor: string;
    modalBg: string;
    modalContent: string;
    input: string;
    editPanel: string;
  }
> = {
  abyss: {
    container: "border-abyss-accent/30",
    toolbar: "bg-abyss-bg border-abyss-accent/20",
    toolbarButton:
      "text-abyss-text/70 hover:text-abyss-accent hover:bg-abyss-accent/10",
    toolbarButtonActive: "text-abyss-accent bg-abyss-accent/20",
    editor: "bg-abyss-bg text-abyss-text",
    modalBg: "bg-abyss-bg/95",
    modalContent: "bg-abyss-bg border-abyss-accent/30",
    input:
      "bg-abyss-bg border-abyss-accent/30 text-abyss-text focus:border-abyss-accent",
    editPanel: "bg-abyss-bg/95 border-abyss-accent/40",
  },
  prism: {
    container: "border-prism-accent/30",
    toolbar: "bg-prism-bg border-prism-accent/20",
    toolbarButton:
      "text-prism-text/70 hover:text-prism-accent hover:bg-prism-accent/10",
    toolbarButtonActive: "text-prism-accent bg-prism-accent/20",
    editor: "bg-prism-bg text-prism-text",
    modalBg: "bg-prism-bg/95",
    modalContent: "bg-prism-bg border-prism-accent/30",
    input:
      "bg-prism-bg border-prism-accent/30 text-prism-text focus:border-prism-accent",
    editPanel: "bg-prism-bg/95 border-prism-accent/40",
  },
  luxe: {
    container: "border-luxe-gold/30",
    toolbar: "bg-luxe-black border-luxe-gold/20",
    toolbarButton:
      "text-luxe-text/70 hover:text-luxe-gold hover:bg-luxe-gold/10",
    toolbarButtonActive: "text-luxe-gold bg-luxe-gold/20",
    editor: "bg-luxe-bg text-luxe-text",
    modalBg: "bg-luxe-black/95",
    modalContent: "bg-luxe-bg border-luxe-gold/30",
    input:
      "bg-luxe-bg border-luxe-gold/30 text-luxe-text focus:border-luxe-gold",
    editPanel: "bg-luxe-black/95 border-luxe-gold/40",
  },
};

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[RichTextEditor] ${msg}`, data || ""),
  warn: (msg: string, data?: unknown) =>
    console.warn(`[RichTextEditor] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[RichTextEditor] ${msg}`, err || ""),
};

/** 工具列按鈕元件 */
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  disabled,
  title,
  children,
  className = "",
}) => (
  <Tooltip label={title}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  </Tooltip>
);

/**
 * RichTextEditor - Tiptap 富文本編輯器
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = "",
  onChange,
  placeholder,
  theme = "luxe",
  readonly = false,
  minHeight = "300px",
  className = "",
}) => {
  const { t } = useLanguage();
  const styles = themeStyles[theme];
  const IMAGE_SIZE_PRESETS = imageSizePresets(t);
  const VIDEO_SIZE_PRESETS = videoSizePresets(t);

  // Modal 狀態
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  /*
   * 這三個是編輯器內建的手寫彈窗（插圖／影片／連結）。
   * 它們原本既沒鎖 body 捲動也不吃 Escape —— 彈窗開著時滑鼠滾輪會直接
   * 捲到背後的頁面。統一交給 useModalBehavior 處理（計數器會處理疊層）。
   */
  useModalBehavior(showImageModal, () => setShowImageModal(false));
  useModalBehavior(showVideoModal, () => setShowVideoModal(false));
  useModalBehavior(showLinkModal, () => setShowLinkModal(false));

  // 圖片表單
  // 上傳目標由外層的 ImageUploadTargetProvider 決定（沒包就退回 article/temp）
  const uploadTarget = useImageUploadTarget();
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageWidth, setImageWidth] = useState(100);
  const [imageAlign, setImageAlign] = useState<"left" | "center" | "right">(
    "center",
  );

  // 影片表單
  const [videoUrl, setVideoUrl] = useState("");
  const [videoWidth, setVideoWidth] = useState(640);
  const [videoHeight, setVideoHeight] = useState(360);

  // 連結表單
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // 錯誤訊息
  const [error, setError] = useState("");

  // 編輯面板狀態
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editPanelType, setEditPanelType] = useState<"image" | "video" | null>(
    null,
  );
  const [editPanelPosition, setEditPanelPosition] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null,
  );

  // 編輯中的元素屬性
  const [editImageWidth, setEditImageWidth] = useState(100);
  const [editVideoWidth, setEditVideoWidth] = useState(640);
  const [editVideoHeight, setEditVideoHeight] = useState(360);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        dropcursor: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto cursor-pointer transition-all",
        },
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-luxe-gold underline hover:no-underline",
        },
      }),
      Youtube.configure({
        width: videoWidth,
        height: videoHeight,
        HTMLAttributes: {
          class: "rounded-lg mx-auto cursor-pointer",
        },
        nocookie: true,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? t.richEditor.placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
    ],
    content,
    editable: !readonly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      handleDrop: () => {
        logger.warn("拖放功能已停用");
        setError(t.richEditor.errNoDrop);
        setTimeout(() => setError(""), 3000);
        return true;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              logger.warn("已阻止圖片貼上");
              setError(t.richEditor.errNoPaste);
              setTimeout(() => setError(""), 3000);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // 監聽編輯器點擊事件
  useEffect(() => {
    if (!editor || readonly) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.tagName === "IMG") {
        const img = target as HTMLImageElement;
        if (!isAllowedImageUrl(img.src)) {
          setError(t.richEditor.errImageSourceLegacy);
        }

        setSelectedElement(img);
        setEditPanelType("image");
        const currentWidth = img.style.width ? parseInt(img.style.width) : 100;
        setEditImageWidth(currentWidth);

        const rect = img.getBoundingClientRect();
        const maxX =
          typeof window !== "undefined" ? window.innerWidth - 150 : 800;
        const maxY =
          typeof window !== "undefined" ? window.innerHeight - 200 : 600;
        setEditPanelPosition({
          x: Math.min(rect.left + rect.width / 2, maxX),
          y: Math.min(rect.bottom + 10, maxY),
        });
        setShowEditPanel(true);
        return;
      }

      if (
        target.tagName === "IFRAME" &&
        target.closest("[data-youtube-video]")
      ) {
        const iframe = target as HTMLIFrameElement;
        setSelectedElement(iframe);
        setEditPanelType("video");
        setEditVideoWidth(iframe.width ? parseInt(iframe.width) : 640);
        setEditVideoHeight(iframe.height ? parseInt(iframe.height) : 360);

        const rect = iframe.getBoundingClientRect();
        const maxX =
          typeof window !== "undefined" ? window.innerWidth - 150 : 800;
        const maxY =
          typeof window !== "undefined" ? window.innerHeight - 200 : 600;
        setEditPanelPosition({
          x: Math.min(rect.left + rect.width / 2, maxX),
          y: Math.min(rect.bottom + 10, maxY),
        });
        setShowEditPanel(true);
        return;
      }

      setShowEditPanel(false);
      setSelectedElement(null);
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener("click", handleClick);

    return () => {
      editorElement.removeEventListener("click", handleClick);
    };
  }, [editor, readonly]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest("[data-edit-panel]") &&
        !target.closest(".ProseMirror")
      ) {
        setShowEditPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  /** 驗證並插入圖片（自家 Storage 上傳結果或 Cloudinary 網址） */
  const handleInsertImage = useCallback(() => {
    setError("");

    if (!imageUrl.trim()) {
      setError(t.richEditor.errNeedImage);
      return;
    }

    if (!isAllowedImageUrl(imageUrl)) {
      setError(t.richEditor.errImageSourceInvalid);
      logger.warn("不允許的圖片來源被拒絕", imageUrl);
      return;
    }

    logger.info("插入圖片", { url: imageUrl, width: imageWidth });

    const alignStyle =
      imageAlign === "center"
        ? "display: block; margin: 0 auto;"
        : imageAlign === "right"
          ? "float: right; margin-left: 1rem;"
          : "float: left; margin-right: 1rem;";

    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl,
        alt: imageAlt || t.richEditor.defaultAlt,
      })
      .run();

    editor.commands.updateAttributes("image", {
      style: `width: ${imageWidth}%; ${alignStyle}`,
    });

    setImageUrl("");
    setImageAlt("");
    setImageWidth(100);
    setImageAlign("center");
    setShowImageModal(false);
  }, [editor, imageUrl, imageAlt, imageWidth, imageAlign]);

  /** 驗證並插入 YouTube 影片 */
  const handleInsertVideo = useCallback(() => {
    setError("");

    if (!videoUrl.trim()) {
      setError(t.richEditor.errNeedVideoUrl);
      return;
    }

    if (!YOUTUBE_REGEX.test(videoUrl)) {
      setError(t.richEditor.errYoutubeOnly);
      logger.warn("非 YouTube 影片被拒絕", videoUrl);
      return;
    }

    logger.info("插入 YouTube 影片", {
      url: videoUrl,
      width: videoWidth,
      height: videoHeight,
    });

    editor
      .chain()
      .focus()
      .setYoutubeVideo({
        src: videoUrl,
        width: videoWidth,
        height: videoHeight,
      })
      .run();

    setVideoUrl("");
    setVideoWidth(640);
    setVideoHeight(360);
    setShowVideoModal(false);
  }, [editor, videoUrl, videoWidth, videoHeight]);

  /** 插入連結 */
  const handleInsertLink = useCallback(() => {
    setError("");

    if (!linkUrl.trim()) {
      setError(t.richEditor.errNeedLinkUrl);
      return;
    }

    let url = linkUrl;
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    if (linkText) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${linkText}</a>`)
        .run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }

    setLinkUrl("");
    setLinkText("");
    setShowLinkModal(false);
  }, [editor, linkUrl, linkText]);

  /** 更新選中圖片的尺寸 */
  const handleUpdateImageSize = useCallback(
    (width: number) => {
      if (selectedElement && selectedElement.tagName === "IMG") {
        const img = selectedElement as HTMLImageElement;
        img.style.width = `${width}%`;
        setEditImageWidth(width);
        onChange?.(editor.getHTML());
        logger.info("更新圖片尺寸", { width });
      }
    },
    [selectedElement, editor, onChange],
  );

  /** 更新選中影片的尺寸 */
  const handleUpdateVideoSize = useCallback(
    (width: number, height: number) => {
      if (selectedElement && selectedElement.tagName === "IFRAME") {
        const iframe = selectedElement as HTMLIFrameElement;
        iframe.width = String(width);
        iframe.height = String(height);
        setEditVideoWidth(width);
        setEditVideoHeight(height);
        onChange?.(editor.getHTML());
        logger.info("更新影片尺寸", { width, height });
      }
    },
    [selectedElement, editor, onChange],
  );

  /** 刪除選中元素 */
  const handleDeleteSelected = useCallback(() => {
    if (selectedElement) {
      selectedElement.remove();
      setShowEditPanel(false);
      setSelectedElement(null);
      onChange?.(editor.getHTML());
      logger.info("刪除元素");
    }
  }, [selectedElement, editor, onChange]);

  return (
    <div
      className={`border rounded-lg overflow-hidden ${styles.container} ${className}`}
    >
      {/* 全域錯誤提示 */}
      {error && (
        <div className="p-3 bg-red-500/20 border-b border-red-500/30 text-red-400 text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {/* 工具列 */}
      {!readonly && (
        <div className={`flex flex-wrap gap-1 p-2 border-b ${styles.toolbar}`}>
          {/* 文字格式 */}
          <div className="flex gap-1 pr-2 border-r border-current/10">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title={t.richEditor.toolBold}
              className={
                editor.isActive("bold")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <span className="font-bold">B</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title={t.richEditor.toolItalic}
              className={
                editor.isActive("italic")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <span className="italic">I</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title={t.richEditor.toolUnderline}
              className={
                editor.isActive("underline")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <span className="underline">U</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title={t.richEditor.toolStrike}
              className={
                editor.isActive("strike")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <span className="line-through">S</span>
            </ToolbarButton>
          </div>

          {/* 標題 */}
          <div className="flex gap-1 pr-2 border-r border-current/10">
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              title={t.richEditor.toolH1}
              className={
                editor.isActive("heading", { level: 1 })
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              title={t.richEditor.toolH2}
              className={
                editor.isActive("heading", { level: 2 })
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive("heading", { level: 3 })}
              title={t.richEditor.toolH3}
              className={
                editor.isActive("heading", { level: 3 })
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              H3
            </ToolbarButton>
          </div>

          {/* 列表 */}
          <div className="flex gap-1 pr-2 border-r border-current/10">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title={t.richEditor.toolBullet}
              className={
                editor.isActive("bulletList")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title={t.richEditor.toolOrdered}
              className={
                editor.isActive("orderedList")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
            </ToolbarButton>
          </div>

          {/* 對齊 */}
          <div className="flex gap-1 pr-2 border-r border-current/10">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              title={t.richEditor.toolAlignLeft}
              className={
                editor.isActive({ textAlign: "left" })
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h10M4 18h14"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              title={t.richEditor.toolAlignCenter}
              className={
                editor.isActive({ textAlign: "center" })
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M7 12h10M5 18h14"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              title={t.richEditor.toolAlignRight}
              className={
                editor.isActive({ textAlign: "right" })
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M10 12h10M6 18h14"
                />
              </svg>
            </ToolbarButton>
          </div>

          {/* 媒體 */}
          <div className="flex gap-1 pr-2 border-r border-current/10">
            <ToolbarButton
              onClick={() => setShowImageModal(true)}
              title={t.richEditor.toolInsertImage}
              className={styles.toolbarButton}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowVideoModal(true)}
              title={t.richEditor.toolInsertVideo}
              className={styles.toolbarButton}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowLinkModal(true)}
              title={t.richEditor.toolInsertLink}
              className={styles.toolbarButton}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </ToolbarButton>
          </div>

          {/* 引用與程式碼 */}
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title={t.richEditor.toolQuote}
              className={
                editor.isActive("blockquote")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              title={t.richEditor.toolCode}
              className={
                editor.isActive("codeBlock")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* 使用說明 */}
      {!readonly && (
        <div className="px-4 py-2 bg-blue-500/5 border-b border-blue-500/10 text-xs text-blue-300/70">
          {t.richEditor.usageHint}
        </div>
      )}

      {/* 編輯器內容 */}
      <EditorContent
        editor={editor}
        className={`prose prose-invert max-w-none p-4 ${styles.editor}
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
          [&_.ProseMirror_img]:cursor-pointer
          [&_.ProseMirror_img:hover]:ring-2
          [&_.ProseMirror_img:hover]:ring-luxe-gold/50
          [&_.ProseMirror_iframe]:cursor-pointer
        `}
        style={{ minHeight }}
      />

      {/* 選中元素編輯面板 */}
      {showEditPanel && (
        <div
          data-edit-panel
          className={`fixed z-50 p-4 rounded-lg border shadow-xl ${styles.editPanel}`}
          style={{
            left: `${editPanelPosition.x}px`,
            top: `${editPanelPosition.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          {editPanelType === "image" && (
            <div className="space-y-3 min-w-[200px]">
              <h4 className="text-sm font-medium">{t.richEditor.adjustImageSize}</h4>
              <div className="flex flex-wrap gap-2">
                {IMAGE_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleUpdateImageSize(preset.value)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      editImageWidth === preset.value
                        ? "bg-luxe-gold text-black"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-current/10">
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="flex-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                >
                  {t.common.delete}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditPanel(false)}
                  className="px-3 py-1.5 text-xs bg-white/10 rounded hover:bg-white/20"
                >
                  {t.chatUi.done}
                </button>
              </div>
            </div>
          )}

          {editPanelType === "video" && (
            <div className="space-y-3 min-w-[200px]">
              <h4 className="text-sm font-medium">{t.richEditor.adjustVideoSize}</h4>
              <p className="text-xs opacity-50">
                {t.richEditor.current} {editVideoWidth} x {editVideoHeight}
              </p>
              <div className="flex flex-wrap gap-2">
                {VIDEO_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      handleUpdateVideoSize(preset.width, preset.height)
                    }
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      editVideoWidth === preset.width
                        ? "bg-luxe-gold text-black"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-current/10">
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="flex-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                >
                  {t.common.delete}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditPanel(false)}
                  className="px-3 py-1.5 text-xs bg-white/10 rounded hover:bg-white/20"
                >
                  {t.chatUi.done}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 圖片插入 Modal */}
      {showImageModal && (
        <div
          className={`fixed inset-0 modal-layer modal-scroll flex items-center justify-center overflow-y-auto p-4 ${styles.modalBg}`}
        >
          <div
            className={`w-full max-w-md p-6 rounded-xl border ${styles.modalContent}`}
          >
            <h3 className="text-lg font-medium mb-4">{t.richEditor.insertImageTitle}</h3>

            <div className="space-y-4">
              <ImageInput
                label={t.richEditor.imageLabel}
                value={imageUrl}
                onChange={(url) => {
                  setImageUrl(url);
                  setError("");
                }}
                entity={uploadTarget.entity}
                entityKey={uploadTarget.entityKey}
                kind="content"
                aspectHint="16 / 9"
                required
              />
              <div>
                <label className="block text-sm mb-1">{t.richEditor.altTextLabel}</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder={t.richEditor.altTextPlaceholder}
                  className={`w-full px-3 py-2 rounded-lg border ${styles.input}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">{t.richEditor.sizeLabel}</label>
                  <select
                    value={imageWidth}
                    onChange={(e) => setImageWidth(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-lg border ${styles.input}`}
                  >
                    {IMAGE_SIZE_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">{t.richEditor.alignLabel}</label>
                  <select
                    value={imageAlign}
                    onChange={(e) =>
                      setImageAlign(
                        e.target.value as "left" | "center" | "right",
                      )
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${styles.input}`}
                  >
                    <option value="left">{t.richEditor.alignLeftWrap}</option>
                    <option value="center">{t.richEditor.alignCenter}</option>
                    <option value="right">{t.richEditor.alignRightWrap}</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm whitespace-pre-line">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-sm rounded-lg hover:bg-gray-500/20"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  className="px-4 py-2 text-sm bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90"
                >
                  {t.richEditor.insertImageTitle}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 影片插入 Modal */}
      {showVideoModal && (
        <div
          className={`fixed inset-0 modal-layer modal-scroll flex items-center justify-center overflow-y-auto p-4 ${styles.modalBg}`}
        >
          <div
            className={`w-full max-w-md p-6 rounded-xl border ${styles.modalContent}`}
          >
            <h3 className="text-lg font-medium mb-4">{t.richEditor.insertVideoTitle}</h3>

            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="font-medium text-red-400 text-sm mb-2">
                {t.richEditor.importantNotice}
              </p>
              <p className="text-xs text-gray-300">
                {t.richEditor.youtubeOnlyNotice}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">{t.richEditor.youtubeUrlLabel}</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full px-3 py-2 rounded-lg border ${styles.input}`}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">{t.richEditor.videoSizeLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setVideoWidth(preset.width);
                        setVideoHeight(preset.height);
                      }}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        videoWidth === preset.width
                          ? "bg-luxe-gold text-black"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs opacity-50 mt-1">
                  {t.richEditor.currentSize} {videoWidth} x {videoHeight}
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-sm whitespace-pre-line">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVideoModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-sm rounded-lg hover:bg-gray-500/20"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleInsertVideo}
                  className="px-4 py-2 text-sm bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90"
                >
                  {t.richEditor.insertVideoBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 連結插入 Modal */}
      {showLinkModal && (
        <div
          className={`fixed inset-0 modal-layer modal-scroll flex items-center justify-center overflow-y-auto p-4 ${styles.modalBg}`}
        >
          <div
            className={`w-full max-w-md p-6 rounded-xl border ${styles.modalContent}`}
          >
            <h3 className="text-lg font-medium mb-4">{t.richEditor.insertLinkTitle}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">{t.richEditor.linkUrlLabel}</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className={`w-full px-3 py-2 rounded-lg border ${styles.input}`}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">{t.richEditor.linkTextLabel}</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder={t.richEditor.linkTextPlaceholder}
                  className={`w-full px-3 py-2 rounded-lg border ${styles.input}`}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-sm rounded-lg hover:bg-gray-500/20"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="px-4 py-2 text-sm bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90"
                >
                  {t.richEditor.insertLinkTitle}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
