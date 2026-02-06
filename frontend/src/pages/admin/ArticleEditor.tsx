/**
 * 文章編輯器頁面
 * @module pages/admin/ArticleEditor
 * @description 全螢幕文章編輯頁面，使用 Tiptap 富文本編輯器
 * @features localStorage 自動暫存、分類管理、使用說明、發布前預覽
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  FloatingMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
// 新增擴展 - 使用具名匯入 (named imports)
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
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import Mention from "@tiptap/extension-mention";
import Focus from "@tiptap/extension-focus";
import FontFamily from "@tiptap/extension-font-family";

// 初始化 lowlight 語法高亮
const lowlight = createLowlight(common);

import { useAuth } from "@/context";
import { Loading } from "@/components/ui";
import { useDialog } from "@/components/ui/Dialog";
import { ResizableImage, ResizableYoutube } from "@/components/editor";
import { articleService } from "@/services/article.service";
import ArticlePreviewModal from "@/components/admin/ArticlePreviewModal";

/**
 * 驗證 Cloudinary 圖片網址
 */
const isValidCloudinaryUrl = (url: string): boolean => {
  return /^https?:\/\/res\.cloudinary\.com\/.+/.test(url);
};

/**
 * 驗證 YouTube 網址
 */
const isValidYouTubeUrl = (url: string): boolean => {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/).+/.test(
    url,
  );
};

/**
 * 提取 YouTube 影片 ID
 */
const extractYouTubeId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/** 文章資料結構 */
interface ArticleData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  content: string;
  status: "draft" | "published";
}

/** 分類資料結構 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/** localStorage key */
const STORAGE_KEY = "article_draft";
const CATEGORIES_KEY = "article_categories";

/** 預設分類 */
const DEFAULT_CATEGORIES: Category[] = [
  { id: "training", name: "訓練技巧", slug: "training" },
  { id: "nutrition", name: "營養知識", slug: "nutrition" },
  { id: "mindset", name: "心態建設", slug: "mindset" },
  { id: "lifestyle", name: "生活分享", slug: "lifestyle" },
  { id: "news", name: "最新消息", slug: "news" },
];

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[ArticleEditor] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[ArticleEditor] ${msg}`, err || ""),
};

const ArticleEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const isNew = !id || id === "new";

  // 客戶端掛載狀態 (防止 SSR 水合問題)
  const [mounted, setMounted] = useState(false);

  // 文章狀態
  const [article, setArticle] = useState<ArticleData>({
    title: "",
    slug: "",
    excerpt: "",
    category: "",
    tags: [],
    coverImage: "",
    content: "",
    status: "draft",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 分類管理
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // 預覽 Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // 側邊欄收合狀態
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 使用說明 Modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  /** 自動生成 slug */
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
  }, []);

  // Tiptap 編輯器 - 完整功能版
  const editor = useEditor({
    // SSR 相容性設定
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // 停用預設 codeBlock，使用 lowlight 版本
        codeBlock: false,
        // StarterKit 已包含：bold, italic, strike, blockquote,
        // horizontalRule, bulletList, orderedList, dropcursor, gapcursor
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
      // 基本格式 (StarterKit 沒有的)
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
      // 媒體
      ResizableImage,
      Link.configure({
        openOnClick: false,
      }),
      ResizableYoutube,
      // 功能性
      Placeholder.configure({
        placeholder: "開始撰寫文章內容...（輸入 @ 可提及他人）",
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
      Typography,
    ],
    content: article.content,
    onUpdate: ({ editor }) => {
      setArticle((prev) => ({ ...prev, content: editor.getHTML() }));
      setHasChanges(true);
    },
  });

  // 設置客戶端掛載狀態
  useEffect(() => {
    setMounted(true);
  }, []);

  // 載入分類 (僅客戶端)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(CATEGORIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          logger.info("已載入分類:", parsed);
        }
      } else {
        localStorage.setItem(
          CATEGORIES_KEY,
          JSON.stringify(DEFAULT_CATEGORIES),
        );
      }
    } catch (error) {
      logger.error("載入分類失敗:", error);
    }
  }, []);

  // 載入草稿 (從 localStorage，僅客戶端)
  useEffect(() => {
    if (typeof window === "undefined" || !mounted || !isNew || !editor) return;

    // 使用 setTimeout 確保在客戶端完全掛載後執行
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.savedAt) {
            const savedTime = new Date(data.savedAt);
            const confirmed = window.confirm(
              `發現上次編輯的草稿（${savedTime.toLocaleString()}）\n\n是否要恢復？`,
            );
            if (confirmed) {
              setArticle(data.article);
              editor.commands.setContent(data.article.content || "");
              setLastSaved(savedTime);
              logger.info("已恢復草稿");
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } catch (error) {
        logger.error("載入草稿失敗:", error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mounted, isNew, editor]);

  // 自動儲存到 localStorage (每 30 秒，僅客戶端)
  useEffect(() => {
    if (typeof window === "undefined" || !mounted || !hasChanges) return;

    const autoSave = setInterval(() => {
      if (article.title || article.content) {
        try {
          const data = {
            article,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          setLastSaved(new Date());
          logger.info("自動儲存草稿");
        } catch (error) {
          logger.error("自動儲存失敗:", error);
        }
      }
    }, 30000);

    return () => clearInterval(autoSave);
  }, [mounted, hasChanges, article]);

  // 監聯離開頁面 (僅客戶端)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  /** 新增標籤 */
  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !article.tags.includes(tagInput.trim())) {
      setArticle((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
      setHasChanges(true);
    }
  }, [tagInput, article.tags]);

  /** 移除標籤 */
  const handleRemoveTag = useCallback((tag: string) => {
    setArticle((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
    setHasChanges(true);
  }, []);

  // 使用美化對話框
  const dialog = useDialog();

  /** 插入圖片（強制 Cloudinary 驗證） */
  const handleInsertImage = useCallback(async () => {
    const url = await dialog.prompt({
      title: "插入圖片",
      message: "請輸入 Cloudinary 圖片網址：",
      placeholder: "https://res.cloudinary.com/...",
      validation: (value) => {
        if (!isValidCloudinaryUrl(value)) {
          return "❌ 只能使用 Cloudinary 圖片網址！\n請確保網址以 https://res.cloudinary.com/ 開頭";
        }
        return null;
      },
      renderPreview: (value) =>
        isValidCloudinaryUrl(value) ? (
          <div className="mt-4 rounded-lg overflow-hidden border border-luxe-gold/30">
            <img
              src={value}
              alt="圖片預覽"
              className="max-h-48 mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : null,
    });

    if (url && editor) {
      // 二次驗證（防護措施）
      if (!isValidCloudinaryUrl(url)) {
        await dialog.alert({
          type: "error",
          title: "無效的圖片網址",
          message: "只能使用 Cloudinary 圖片網址！",
        });
        return;
      }
      // 使用可調整大小的圖片擴展
      editor
        .chain()
        .focus()
        .insertContent({
          type: "resizableImage",
          attrs: { src: url },
        })
        .run();
    }
  }, [editor, dialog]);

  /** 插入 YouTube（強制 YouTube 驗證 + 即時預覽） */
  const handleInsertYoutube = useCallback(async () => {
    const url = await dialog.prompt({
      title: "插入 YouTube 影片",
      message: "請輸入 YouTube 影片網址：",
      placeholder: "https://www.youtube.com/watch?v=...",
      validation: (value) => {
        if (!isValidYouTubeUrl(value)) {
          return "❌ 只能使用 YouTube 影片網址！\n支援格式：youtube.com/watch?v=, youtu.be/, youtube.com/shorts/";
        }
        return null;
      },
      renderPreview: (value) => {
        const videoId = extractYouTubeId(value);
        return videoId ? (
          <div className="mt-4 rounded-lg overflow-hidden border border-luxe-gold/30">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube 預覽"
              className="w-full aspect-video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null;
      },
    });

    if (url && editor) {
      // 二次驗證（防護措施）
      if (!isValidYouTubeUrl(url)) {
        await dialog.alert({
          type: "error",
          title: "無效的影片網址",
          message: "只能使用 YouTube 影片網址！",
        });
        return;
      }
      // 使用可調整大小的 YouTube 擴展
      editor
        .chain()
        .focus()
        .insertContent({
          type: "resizableYoutube",
          attrs: { src: url, width: 640, height: 360 },
        })
        .run();
    }
  }, [editor, dialog]);

  /** 插入連結 */
  const handleInsertLink = useCallback(async () => {
    const url = await dialog.prompt({
      title: "插入連結",
      message: "請輸入網址：",
      placeholder: "https://...",
      validation: (value) => {
        try {
          new URL(value);
          return null;
        } catch {
          return "請輸入有效的網址";
        }
      },
    });

    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor, dialog]);

  /** 手動儲存草稿到 localStorage */
  const handleSaveDraft = useCallback(() => {
    try {
      const data = {
        article,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLastSaved(new Date());
      setHasChanges(false);
      alert("✅ 草稿已儲存到瀏覽器！\n\n下次打開這個頁面時會詢問是否恢復。");
      logger.info("手動儲存草稿成功");
    } catch (error) {
      logger.error("儲存草稿失敗:", error);
      alert("❌ 儲存失敗，請稍後再試");
    }
  }, [article]);

  /** 顯示預覽（發布前確認） */
  const handleShowPreview = useCallback(() => {
    if (!article.title.trim()) {
      alert("請輸入文章標題");
      return;
    }
    setShowPreviewModal(true);
  }, [article.title]);

  /** 確認發布文章 */
  const handleConfirmPublish = useCallback(async () => {
    if (!article.title.trim()) {
      alert("請輸入文章標題");
      return;
    }

    setIsSaving(true);
    try {
      const slug = article.slug || generateSlug(article.title);
      const payload = {
        title: article.title,
        slug,
        description: article.excerpt,
        content: article.content,
        thumbnailUrl: article.coverImage,
        keywords: article.tags,
        category: article.category,
        status: "published",
        isFeatured: false,
      };

      logger.info("發布文章:", payload);

      if (isNew) {
        // 建立新文章
        await articleService.create(payload);
      } else {
        // 更新現有文章
        await articleService.update(Number(id), payload);
      }

      // 清除 localStorage 草稿
      localStorage.removeItem(STORAGE_KEY);
      setHasChanges(false);
      setShowPreviewModal(false);
      alert("✅ 文章已發布！");
      navigate("/admin/articles");
    } catch (error) {
      logger.error("發布失敗:", error);
      alert("❌ 發布失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  }, [article, generateSlug, isNew, id, navigate]);

  /** 新增分類 */
  const handleAddCategory = useCallback(() => {
    if (!newCategoryName.trim()) return;

    const slug = newCategoryName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    const newCategory: Category = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      slug,
    };

    const updated = [...categories, newCategory];
    setCategories(updated);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    setNewCategoryName("");

    // TODO: 同步到資料庫
    logger.info("新增分類:", newCategory);
  }, [newCategoryName, categories]);

  /** 刪除分類 */
  const handleDeleteCategory = useCallback(
    (categoryId: string) => {
      if (!confirm("確定要刪除此分類嗎？")) return;

      const updated = categories.filter((c) => c.id !== categoryId);
      setCategories(updated);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));

      // 如果目前選中的分類被刪除，清空選擇
      const deletedCategory = categories.find((c) => c.id === categoryId);
      if (deletedCategory && article.category === deletedCategory.slug) {
        setArticle((prev) => ({ ...prev, category: "" }));
      }

      // TODO: 同步到資料庫
      logger.info("刪除分類:", categoryId);
    },
    [categories, article.category],
  );

  /** 返回列表 */
  const handleBack = useCallback(() => {
    if (hasChanges) {
      if (!confirm("有未儲存的變更，確定要離開嗎？")) {
        return;
      }
    }
    navigate("/admin/articles");
  }, [navigate, hasChanges]);

  // 權限保護
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-luxe-bg">
        <Loading text="載入中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-luxe-bg text-luxe-text">
      {/* 頂部工具列 */}
      <header className="sticky top-0 z-10 bg-luxe-black border-b border-luxe-gold/20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回
            </button>
            <span className="text-gray-500">|</span>
            <h1 className="font-medium">{isNew ? "新增文章" : "編輯文章"}</h1>
            {hasChanges && (
              <span className="text-xs text-amber-400">● 未儲存</span>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-500">
                上次儲存：{lastSaved.toLocaleTimeString()}
              </span>
            )}

            {/* 說明按鈕 */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              title="查看使用說明"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-luxe-gold/20 text-luxe-gold hover:bg-luxe-gold/30 text-sm font-bold"
            >
              ?
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* 字數統計 */}
            {editor && (
              <span className="text-xs text-gray-500">
                {editor.storage.characterCount?.characters() || 0} 字
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              title="儲存草稿到瀏覽器"
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
            >
              {isSaving ? "儲存中..." : "儲存草稿"}
            </button>
            <button
              type="button"
              onClick={handleShowPreview}
              disabled={isSaving}
              title="預覽文章並確認發布"
              className="px-4 py-2 text-sm bg-luxe-gold text-black hover:bg-luxe-gold/90 rounded-lg disabled:opacity-50 font-medium"
            >
              預覽並發布
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容 - 全寬佈局 */}
      <main className="h-[calc(100vh-64px)] flex overflow-hidden">
        {/* 左側：文章編輯區（全寬） */}
        <div
          className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${sidebarCollapsed ? "" : "mr-80"}`}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 標題 */}
            <div>
              <input
                type="text"
                value={article.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setArticle((prev) => ({
                    ...prev,
                    title: newTitle,
                    // 自動產生 slug
                    slug: generateSlug(newTitle),
                  }));
                  setHasChanges(true);
                }}
                placeholder="文章標題"
                className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-gray-600"
              />
            </div>

            {/* 編輯器工具列 */}
            <div className="flex flex-wrap gap-1 p-2 bg-luxe-surface rounded-lg border border-luxe-gold/20">
              {/* 文字格式 - 第一行 */}
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                title="粗體 (Ctrl+B) - 讓文字變粗，強調重點"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("bold") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                title="斜體 (Ctrl+I) - 讓文字傾斜，常用於引用或強調"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("italic") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                title="底線 (Ctrl+U) - 在文字下方加線"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("underline") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                <u>U</u>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                title="刪除線 - 在文字中間畫線，表示刪除或更正"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("strike") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                <s>S</s>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleSubscript().run()}
                title="下標 - 文字縮小並下移，如 H₂O"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("subscript") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                X<sub>2</sub>
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleSuperscript().run()
                }
                title="上標 - 文字縮小並上移，如 X²"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("superscript") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
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
                      onClick={() =>
                        editor?.chain().focus().setColor(color).run()
                      }
                      title={`設定文字顏色: ${color}`}
                      className="w-6 h-6 rounded border border-luxe-gold/20 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().unsetColor().run()}
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
                  className={`px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1 ${editor?.isActive("highlight") ? "bg-luxe-gold text-black" : ""}`}
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
                        editor?.chain().focus().toggleHighlight({ color }).run()
                      }
                      title={`設定螢光筆顏色: ${color}`}
                      className="w-6 h-6 rounded border border-luxe-gold/20 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().unsetHighlight().run()
                    }
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
                          ? editor
                              ?.chain()
                              .focus()
                              .setFontFamily(font.value)
                              .run()
                          : editor?.chain().focus().unsetFontFamily().run()
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
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                title="大標題 (H1) - 文章主標題，字體最大，每篇文章建議只用一次"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("heading", { level: 1 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                H1
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                title="中標題 (H2) - 段落標題，字體中等，用於劃分主要段落"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("heading", { level: 2 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 3 }).run()
                }
                title="小標題 (H3) - 子段落標題，字體較小，用於細分內容"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("heading", { level: 3 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                H3
              </button>

              <span className="w-px bg-luxe-gold/30 mx-1" />

              {/* 列表 */}
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                title="項目符號列表 - 用圓點條列重點，適合無順序的清單"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("bulletList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                •
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                title="編號列表 - 用數字條列步驟，適合有順序的清單"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("orderedList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                1.
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleTaskList().run()}
                title="待辦清單 - 可勾選的任務清單"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("taskList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                ☑
              </button>

              <span className="w-px bg-luxe-gold/30 mx-1" />

              {/* 區塊 */}
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                title="引用區塊 - 引用他人的話或重要內容"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("blockquote") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                ❝
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                title="程式碼區塊 - 顯示程式碼，保留格式"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("codeBlock") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                {"</>"}
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().setHorizontalRule().run()
                }
                title="水平分隔線 - 在段落之間加入分隔線"
                className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
              >
                ―
              </button>

              <span className="w-px bg-luxe-gold/30 mx-1" />

              {/* 對齊 */}
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().setTextAlign("left").run()
                }
                title="左對齊 - 文字靠左排列（預設）"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive({ textAlign: "left" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                ⬅
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().setTextAlign("center").run()
                }
                title="置中對齊 - 文字置中排列，適合標題或引言"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive({ textAlign: "center" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                ⬛
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().setTextAlign("right").run()
                }
                title="右對齊 - 文字靠右排列"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive({ textAlign: "right" }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                ➡
              </button>

              <span className="w-px bg-luxe-gold/30 mx-1" />

              {/* 表格 */}
              <div className="relative group">
                <button
                  type="button"
                  title="表格 - 插入或編輯表格"
                  className={`px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 flex items-center gap-1 ${editor?.isActive("table") ? "bg-luxe-gold text-black" : ""}`}
                >
                  ⊞<span className="text-[10px]">▼</span>
                </button>
                <div className="absolute top-full left-0 mt-1 p-2 bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl hidden group-hover:block z-50 min-w-[160px]">
                  <button
                    type="button"
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run()
                    }
                    title="插入 3x3 表格"
                    className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                  >
                    📊 插入表格 (3x3)
                  </button>
                  {editor?.isActive("table") && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().addColumnAfter().run()
                        }
                        title="在右側新增一欄"
                        className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                      >
                        ➕ 新增欄
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().addRowAfter().run()
                        }
                        title="在下方新增一列"
                        className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
                      >
                        ➕ 新增列
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().deleteColumn().run()
                        }
                        title="刪除當前欄"
                        className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                      >
                        ➖ 刪除欄
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().deleteRow().run()
                        }
                        title="刪除當前列"
                        className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                      >
                        ➖ 刪除列
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor?.chain().focus().deleteTable().run()
                        }
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
              <button
                type="button"
                onClick={handleInsertImage}
                title="插入圖片 - 貼上 Cloudinary 圖片網址（僅支援 Cloudinary）"
                className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
              >
                🖼️
              </button>
              <button
                type="button"
                onClick={handleInsertYoutube}
                title="插入 YouTube 影片 - 貼上 YouTube 網址（僅支援 YouTube）"
                className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
              >
                🎬
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                title="插入連結 - 將文字轉換成可點擊的連結"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("link") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                🔗
              </button>
              {editor?.isActive("link") && (
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().unsetLink().run()}
                  title="移除連結"
                  className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20 text-red-400"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 編輯器內容 - 更大的編輯區域 */}
            <div className="min-h-[600px] p-6 bg-luxe-surface rounded-lg border border-luxe-gold/20">
              {editor && (
                <>
                  {/* BubbleMenu - 選取文字時彈出的快速工具列 */}
                  <BubbleMenu
                    editor={editor}
                    tippyOptions={{ duration: 100 }}
                    className="flex gap-1 p-1 bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl"
                  >
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`px-2 py-1 text-sm rounded ${editor.isActive("bold") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
                      title="粗體"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                      }
                      className={`px-2 py-1 text-sm rounded ${editor.isActive("italic") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
                      title="斜體"
                    >
                      <em>I</em>
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                      }
                      className={`px-2 py-1 text-sm rounded ${editor.isActive("underline") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
                      title="底線"
                    >
                      <u>U</u>
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleStrike().run()
                      }
                      className={`px-2 py-1 text-sm rounded ${editor.isActive("strike") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
                      title="刪除線"
                    >
                      <s>S</s>
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleHighlight().run()
                      }
                      className={`px-2 py-1 text-sm rounded ${editor.isActive("highlight") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
                      title="螢光筆"
                    >
                      <span className="bg-yellow-300 text-black px-1">H</span>
                    </button>
                  </BubbleMenu>

                  {/* FloatingMenu - 空行時彈出的工具選單 */}
                  <FloatingMenu
                    editor={editor}
                    tippyOptions={{ duration: 100 }}
                    className="flex gap-1 p-1 bg-luxe-black border border-luxe-gold/30 rounded-lg shadow-xl"
                  >
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                      }
                      className="px-2 py-1 text-sm rounded hover:bg-luxe-gold/20"
                      title="插入大標題"
                    >
                      H1
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                      }
                      className="px-2 py-1 text-sm rounded hover:bg-luxe-gold/20"
                      title="插入中標題"
                    >
                      H2
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                      }
                      className="px-2 py-1 text-sm rounded hover:bg-luxe-gold/20"
                      title="插入項目符號列表"
                    >
                      •
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                      }
                      className="px-2 py-1 text-sm rounded hover:bg-luxe-gold/20"
                      title="插入編號列表"
                    >
                      1.
                    </button>
                    <button
                      onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                      }
                      className="px-2 py-1 text-sm rounded hover:bg-luxe-gold/20"
                      title="插入引用區塊"
                    >
                      ❝
                    </button>
                  </FloatingMenu>
                </>
              )}

              <EditorContent
                editor={editor}
                className="prose prose-invert max-w-none min-h-[550px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[550px]"
              />
            </div>
          </div>
        </div>

        {/* 右側：可收合的側邊欄 */}
        <div
          className={`fixed right-0 top-16 h-[calc(100vh-64px)] w-80 bg-luxe-bg border-l border-luxe-gold/20 overflow-y-auto transition-transform duration-300 ${sidebarCollapsed ? "translate-x-full" : "translate-x-0"}`}
        >
          {/* 收合按鈕 */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "展開側邊欄" : "收合側邊欄"}
            className="absolute -left-10 top-4 w-10 h-10 flex items-center justify-center bg-luxe-surface border border-luxe-gold/20 rounded-l-lg text-luxe-gold hover:bg-luxe-gold/10"
          >
            {sidebarCollapsed ? "◀" : "▶"}
          </button>

          <div className="p-4 space-y-6">
            <div className="p-4 bg-luxe-surface rounded-lg border border-luxe-gold/20">
              <h2 className="text-sm font-medium text-luxe-gold mb-4">
                文章資訊
              </h2>

              <div className="space-y-4">
                {/* Slug（自動產生，唯讀） */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    網址代稱
                    <span className="ml-2 text-gray-500">（自動產生）</span>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-luxe-black/50 border border-luxe-gold/20 rounded-lg text-sm text-gray-400">
                    <span>/articles/</span>
                    <span className="text-luxe-text truncate">
                      {article.slug || "尚未輸入標題"}
                    </span>
                  </div>
                </div>

                {/* 摘要 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    摘要
                  </label>
                  <textarea
                    value={article.excerpt}
                    onChange={(e) => {
                      setArticle((prev) => ({
                        ...prev,
                        excerpt: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    placeholder="簡短描述文章內容..."
                    rows={3}
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none resize-none text-sm"
                  />
                </div>

                {/* 分類 */}
                <div>
                  <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>分類</span>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-luxe-gold hover:underline"
                    >
                      管理分類
                    </button>
                  </label>
                  <select
                    value={article.category}
                    onChange={(e) => {
                      setArticle((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                  >
                    <option value="">選擇分類</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 標籤 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    標籤
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                      placeholder="輸入標籤按 enter 新增"
                      className="flex-1 px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-luxe-gold/20 text-luxe-gold rounded-lg hover:bg-luxe-gold/30"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-luxe-gold/10 text-luxe-gold text-xs rounded"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 封面圖片 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    封面圖片
                  </label>
                  <input
                    type="url"
                    value={article.coverImage}
                    onChange={(e) => {
                      setArticle((prev) => ({
                        ...prev,
                        coverImage: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                  />
                  {article.coverImage && (
                    <img
                      src={article.coverImage}
                      alt="封面預覽"
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>

                {/* 狀態 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    狀態
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={article.status === "draft"}
                        onChange={() => {
                          setArticle((prev) => ({ ...prev, status: "draft" }));
                          setHasChanges(true);
                        }}
                        className="accent-luxe-gold"
                      />
                      <span className="text-sm">草稿</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="published"
                        checked={article.status === "published"}
                        onChange={() => {
                          setArticle((prev) => ({
                            ...prev,
                            status: "published",
                          }));
                          setHasChanges(true);
                        }}
                        className="accent-luxe-gold"
                      />
                      <span className="text-sm">已發布</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作說明 */}
            <div className="p-4 bg-luxe-gold/5 border border-luxe-gold/20 rounded-lg">
              <h3 className="text-xs font-medium text-luxe-gold mb-2">
                💡 使用提示
              </h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 滑鼠移到按鈕上可看詳細說明</li>
                <li>• 草稿每 30 秒自動儲存到瀏覽器</li>
                <li>• 點擊「管理分類」可新增/刪除分類</li>
                <li>• 按 Enter 快速新增標籤</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 分類管理 Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-luxe-bg border border-luxe-gold/30 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">管理分類</h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 新增分類 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="輸入新分類名稱..."
                className="flex-1 px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90 text-sm font-medium"
              >
                新增
              </button>
            </div>

            {/* 分類列表 */}
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-luxe-surface rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{cat.name}</p>
                    <p className="text-xs text-gray-500">slug: {cat.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    刪除
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              ⚠️ 分類目前儲存在瀏覽器中，之後會同步到資料庫
            </p>
          </div>
        </div>
      )}

      {/* 使用說明 Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-luxe-bg border border-luxe-gold/30 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-luxe-gold">
                📝 文章編輯器使用說明
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-sm">
              {/* 基本操作 */}
              <section>
                <h4 className="text-luxe-gold font-medium mb-2">🖊️ 基本操作</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    1. <strong>輸入標題</strong>：在最上方的大輸入框輸入文章標題
                  </li>
                  <li>
                    2. <strong>撰寫內容</strong>
                    ：在編輯區域直接打字，就像使用 Word 一樣
                  </li>
                  <li>
                    3. <strong>儲存草稿</strong>
                    ：點擊「儲存草稿」按鈕，會存到瀏覽器中（不會遺失）
                  </li>
                  <li>
                    4. <strong>發布文章</strong>：確認內容後點擊「發布文章」
                  </li>
                </ul>
              </section>

              {/* 工具列說明 */}
              <section>
                <h4 className="text-luxe-gold font-medium mb-2">
                  🔧 工具列按鈕說明
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">B I U</p>
                    <p className="text-gray-400 text-xs">
                      粗體、斜體、底線 - 選取文字後點擊
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">H1 H2 H3</p>
                    <p className="text-gray-400 text-xs">
                      標題大小 - H1 最大，H3 最小
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">• 列表 / 1. 列表</p>
                    <p className="text-gray-400 text-xs">項目符號或編號列表</p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">⬅ ⬛ ➡</p>
                    <p className="text-gray-400 text-xs">
                      文字對齊：左、中、右
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">🖼️ 圖片</p>
                    <p className="text-gray-400 text-xs">
                      插入網路圖片（貼上圖片網址）
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">🎬 影片</p>
                    <p className="text-gray-400 text-xs">
                      插入 YouTube 影片（貼上 YT 網址）
                    </p>
                  </div>
                </div>
              </section>

              {/* 右側欄位說明 */}
              <section>
                <h4 className="text-luxe-gold font-medium mb-2">
                  📋 右側設定說明
                </h4>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <strong>網址代稱</strong>
                    ：文章的網址名稱，點「自動產生」會根據標題產生
                  </li>
                  <li>
                    <strong>摘要</strong>
                    ：簡短介紹文章內容，會顯示在文章列表
                  </li>
                  <li>
                    <strong>分類</strong>
                    ：選擇文章類型，點「管理分類」可以新增或刪除分類
                  </li>
                  <li>
                    <strong>標籤</strong>
                    ：輸入關鍵字後按 Enter 或點 + 新增
                  </li>
                  <li>
                    <strong>封面圖片</strong>
                    ：貼上圖片網址，建議使用 Cloudinary
                  </li>
                </ul>
              </section>

              {/* 小技巧 */}
              <section>
                <h4 className="text-luxe-gold font-medium mb-2">💡 小技巧</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    • 草稿會<strong>每 30 秒自動儲存</strong>
                    ，不用擔心意外關閉
                  </li>
                  <li>
                    • 滑鼠<strong>停在按鈕上</strong>會顯示說明文字
                  </li>
                  <li>
                    • 想插入圖片？建議先上傳到{" "}
                    <a
                      href="https://cloudinary.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-luxe-gold hover:underline"
                    >
                      Cloudinary
                    </a>{" "}
                    再貼上網址
                  </li>
                </ul>
              </section>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full py-3 bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90 font-medium"
            >
              我知道了！
            </button>
          </div>
        </div>
      )}

      {/* 預覽 Modal */}
      <ArticlePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handleConfirmPublish}
        article={article}
        isSubmitting={isSaving}
      />
    </div>
  );
};

export default ArticleEditor;
