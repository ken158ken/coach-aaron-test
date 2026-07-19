/**
 * 文章編輯器頁面
 * @module pages/admin/ArticleEditor
 * @description 全螢幕文章編輯頁面，使用 Tiptap 富文本編輯器
 * @features localStorage 自動暫存、分類管理、使用說明、發布前預覽
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/context";
import { Loading, Tooltip } from "@/components/ui";
import { useDialog } from "@/components/ui/Dialog";
import { RichTextEditor } from "@/components/editor";
import { useRichTextEditor } from "@/hooks/useRichTextEditor";
import { articleService } from "@/services/content/article.service";
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

/**
 * 驗證 Loom 網址
 */
const isValidLoomUrl = (url: string): boolean => {
  return /^https?:\/\/(www\.)?loom\.com\/(share|embed)\/[a-f0-9]{32}/i.test(
    url.trim(),
  );
};

/**
 * 提取 Loom 影片 ID
 */
const extractLoomId = (url: string): string | null => {
  const cleaned = url.trim();
  if (/^[a-f0-9]{32}$/i.test(cleaned)) return cleaned.toLowerCase();
  const match = cleaned.match(
    /loom\.com\/(?:share|embed)\/([a-f0-9]{32})(?:[/?#]|$)/i,
  );
  return match ? match[1].toLowerCase() : null;
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
  bannerImage: string;
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

  // 使用美化對話框
  const dialog = useDialog();

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
    bannerImage: "",
    content: "",
    status: "draft",
  });

  const [isLoading, setIsLoading] = useState(!isNew);
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

  useScrollLock(showCategoryModal || showPreviewModal || showHelpModal);

  // Slug 狀態
  const [slugDuplicate, setSlugDuplicate] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [showSlugHelp, setShowSlugHelp] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout>>();

  /** 自動生成 slug（時間戳+短隨機碼） */
  const generateSlug = useCallback(() => {
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rand = Math.random().toString(36).substring(2, 8);
    return `${date}-${rand}`;
  }, []);

  /** 檢查 slug 是否重複（debounce 500ms） */
  const checkSlugDuplicate = useCallback(
    (slugValue: string) => {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
      if (!slugValue.trim()) {
        setSlugDuplicate(false);
        setSlugChecking(false);
        return;
      }
      setSlugChecking(true);
      slugCheckTimer.current = setTimeout(async () => {
        try {
          const res = await articleService.checkSlug(
            slugValue,
            isNew ? undefined : id,
          );
          setSlugDuplicate(res.exists);
        } catch {
          setSlugDuplicate(false);
        } finally {
          setSlugChecking(false);
        }
      }, 500);
    },
    [isNew, id],
  );

  /** Slug 輸入處理（禁止中文，僅允許英數字連字符） */
  const handleSlugChange = useCallback(
    (value: string) => {
      // 移除中文及特殊字元，僅保留 a-z 0-9 - _
      const sanitized = value
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, "")
        .slice(0, 60);
      setArticle((prev) => ({ ...prev, slug: sanitized }));
      setHasChanges(true);
      checkSlugDuplicate(sanitized);
    },
    [checkSlugDuplicate],
  );

  // 使用共用的富文本編輯器 Hook
  const editor = useRichTextEditor({
    content: article.content,
    placeholder: "開始撰寫文章內容...（輸入 @ 可提及他人）",
    onUpdate: (html) => {
      setArticle((prev) => ({ ...prev, content: html }));
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
    const timer = setTimeout(async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.savedAt) {
            const savedTime = new Date(data.savedAt);
            const confirmed = await dialog.confirm({
              title: "恢復草稿",
              message: `發現上次編輯的草稿（${savedTime.toLocaleString()}）\n\n是否要恢復？`,
            });
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
  }, [mounted, isNew, editor, dialog]);

  // 載入既有文章資料（編輯模式）
  useEffect(() => {
    if (isNew || !id || !mounted || !editor) return;

    const loadArticle = async () => {
      try {
        setIsLoading(true);
        logger.info("載入文章資料, id:", id);
        const data = await articleService.getByIdentifier(id);
        logger.info("文章資料已載入:", data);

        const keywordsArray: string[] = data.article_keywords
          ? data.article_keywords
              .split(",")
              .map((k: string) => k.trim())
              .filter(Boolean)
          : [];

        const mapped: ArticleData = {
          id: String(data.article_id),
          title: data.article_title || "",
          slug: data.article_slug || "",
          excerpt: data.article_description || "",
          category: data.article_category || "",
          tags: keywordsArray,
          coverImage: data.article_thumbnail_url || "",
          bannerImage: data.article_banner_url || "",
          content: data.article_content || "",
          status: (data.status as "draft" | "published") || "draft",
        };

        setArticle(mapped);

        // 設定 Tiptap 編輯器內容
        if (mapped.content) {
          editor.commands.setContent(mapped.content);
        }

        logger.info("文章資料已填入表單");
      } catch (error) {
        logger.error("載入文章失敗:", error);
        await dialog.alert({
          title: "載入失敗",
          message: "載入文章失敗，請返回重試",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [isNew, id, mounted, editor]);

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

  /** 插入圖片庫（最多三張一排） */
  const handleInsertImageGallery = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setImageGallery([]).run();
  }, [editor]);

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

  /** 插入 Loom（驗證 + 即時預覽） */
  const handleInsertLoom = useCallback(async () => {
    const url = await dialog.prompt({
      title: "插入 Loom 影片",
      message: "請輸入 Loom 影片連結：",
      placeholder: "https://www.loom.com/share/...",
      validation: (value) => {
        if (!isValidLoomUrl(value)) {
          return "❌ 只能使用 Loom 影片連結！\n格式：https://www.loom.com/share/<32 字元 id>";
        }
        return null;
      },
      renderPreview: (value) => {
        const loomId = extractLoomId(value);
        return loomId ? (
          <div className="mt-4 rounded-lg overflow-hidden border border-luxe-gold/30">
            <iframe
              src={`https://www.loom.com/embed/${loomId}`}
              title="Loom 預覽"
              className="w-full aspect-video"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : null;
      },
    });

    if (url && editor) {
      if (!isValidLoomUrl(url)) {
        await dialog.alert({
          type: "error",
          title: "無效的 Loom 連結",
          message: "請貼 Loom 分享連結（loom.com/share/<id>）",
        });
        return;
      }
      editor
        .chain()
        .focus()
        .insertContent({
          type: "resizableLoom",
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
  const handleSaveDraft = useCallback(async () => {
    try {
      const data = {
        article,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLastSaved(new Date());
      setHasChanges(false);
      await dialog.alert({
        title: "儲存成功",
        message: "草稿已儲存到瀏覽器！",
        type: "success",
      });
      logger.info("手動儲存草稿成功");
    } catch (error) {
      logger.error("儲存草稿失敗:", error);
      await dialog.alert({
        title: "儲存失敗",
        message: "儲存失敗，請稍後再試",
        type: "error",
      });
    }
  }, [article, dialog]);

  /** 顯示預覽（發布前確認） */
  const handleShowPreview = useCallback(async () => {
    if (!article.title.trim()) {
      await dialog.alert({
        title: "提示",
        message: "請輸入文章標題",
        type: "warning",
      });
      return;
    }
    setShowPreviewModal(true);
  }, [article.title, dialog]);

  /** 確認發布文章 */
  const handleConfirmPublish = useCallback(async () => {
    if (!article.title.trim()) {
      await dialog.alert({
        title: "提示",
        message: "請輸入文章標題",
        type: "warning",
      });
      return;
    }

    // 驗證圖片網址必須是 Cloudinary
    if (article.coverImage && !isValidCloudinaryUrl(article.coverImage)) {
      await dialog.alert({
        title: "圖片網址錯誤",
        message: "封面圖片必須使用 Cloudinary 網址（https://res.cloudinary.com/...）",
        type: "error",
      });
      return;
    }
    if (article.bannerImage && !isValidCloudinaryUrl(article.bannerImage)) {
      await dialog.alert({
        title: "圖片網址錯誤",
        message: "Banner 圖片必須使用 Cloudinary 網址（https://res.cloudinary.com/...）",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const slug = article.slug || generateSlug();
      const payload = {
        title: article.title,
        slug,
        description: article.excerpt,
        content: article.content,
        thumbnailUrl: article.coverImage,
        bannerUrl: article.bannerImage,
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
      await dialog.alert({
        title: "發布成功",
        message: "文章已發布！",
        type: "success",
      });
      navigate("/admin/articles");
    } catch (error) {
      logger.error("發布失敗:", error);
      await dialog.alert({
        title: "發布失敗",
        message: "發布失敗，請稍後再試",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [article, generateSlug, isNew, id, navigate, dialog]);

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
    async (categoryId: string) => {
      const confirmed = await dialog.confirm({
        title: "刪除分類",
        message: "確定要刪除此分類嗎？",
        variant: "danger",
        confirmText: "刪除",
      });
      if (!confirmed) return;

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
    [categories, article.category, dialog],
  );

  /** 返回列表 */
  const handleBack = useCallback(async () => {
    if (hasChanges) {
      const confirmed = await dialog.confirm({
        title: "離開頁面",
        message: "有未儲存的變更，確定要離開嗎？",
        variant: "danger",
        confirmText: "離開",
        cancelText: "繼續編輯",
      });
      if (!confirmed) return;
    }
    navigate("/admin/articles");
  }, [navigate, hasChanges, dialog]);

  // 權限保護
  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-luxe-bg">
        <Loading text={isLoading ? "載入文章資料..." : "載入中..."} />
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
            <Tooltip label="使用說明">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-luxe-gold/20 text-luxe-gold hover:bg-luxe-gold/30 text-sm font-bold"
              >
                ?
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center gap-3">
            {/* 字數統計 */}
            {editor && (
              <span className="text-xs text-gray-500">
                {editor.storage.characterCount?.characters() || 0} 字
              </span>
            )}
            <Tooltip label="儲存草稿">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
              >
                {isSaving ? "儲存中..." : "儲存草稿"}
              </button>
            </Tooltip>
            <Tooltip label="預覽並發布">
              <button
                type="button"
                onClick={handleShowPreview}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-luxe-gold text-black hover:bg-luxe-gold/90 rounded-lg disabled:opacity-50 font-medium"
              >
                預覽並發布
              </button>
            </Tooltip>
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
                  }));
                  setHasChanges(true);
                }}
                placeholder="文章標題"
                className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-gray-600"
              />
            </div>

            {/* 富文本編輯器 */}
            <RichTextEditor
              editor={editor}
              onInsertImage={handleInsertImage}
              onInsertImageGallery={handleInsertImageGallery}
              onInsertYoutube={handleInsertYoutube}
              onInsertLoom={handleInsertLoom}
              onInsertLink={handleInsertLink}
            />
          </div>
        </div>

        {/* 右側：可收合的側邊欄 */}
        <div
          className={`fixed right-0 top-16 h-[calc(100vh-64px)] w-80 bg-luxe-bg border-l border-luxe-gold/20 overflow-y-auto transition-transform duration-300 ${sidebarCollapsed ? "translate-x-full" : "translate-x-0"}`}
        >
          {/* 收合按鈕 */}
          <Tooltip
            label={sidebarCollapsed ? "展開側邊欄" : "收合側邊欄"}
            position="left"
          >
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -left-10 top-4 w-10 h-10 flex items-center justify-center bg-luxe-surface border border-luxe-gold/20 rounded-l-lg text-luxe-gold hover:bg-luxe-gold/10"
            >
              {sidebarCollapsed ? "◀" : "▶"}
            </button>
          </Tooltip>

          <div className="p-4 space-y-6">
            <div className="p-4 bg-luxe-surface rounded-lg border border-luxe-gold/20">
              <h2 className="text-sm font-medium text-luxe-gold mb-4">
                文章資訊
              </h2>

              <div className="space-y-4">
                {/* Slug（可編輯） */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-xs text-gray-400">
                      網址代稱
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSlugHelp((p) => !p)}
                        className="w-4 h-4 rounded-full bg-gray-600 text-gray-300 text-xs flex items-center justify-center hover:bg-luxe-gold hover:text-black transition-colors"
                        title="什麼是網址代稱？"
                      >
                        ?
                      </button>
                      {showSlugHelp && (
                        <div className="absolute left-6 top-0 z-50 w-64 p-3 bg-luxe-surface border border-luxe-gold/30 rounded-lg shadow-xl text-xs text-gray-300 leading-relaxed">
                          <p className="font-medium text-luxe-gold mb-1">
                            網址代稱 (Slug)
                          </p>
                          <p>影響文章網址的美觀度，例如：</p>
                          <p className="text-luxe-gold/80 my-1">
                            /articles/<strong>my-first-post</strong>
                          </p>
                          <p>
                            可輸入簡單英文，僅允許小寫英文、數字、連字符 (-)
                            和底線 (_)。
                          </p>
                          <p className="mt-1 text-gray-500">
                            留空則自動產生時間戳代碼。
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowSlugHelp(false)}
                            className="mt-2 text-luxe-gold hover:underline"
                          >
                            知道了
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 shrink-0">
                      /articles/
                    </span>
                    <input
                      type="text"
                      value={article.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="留空自動產生"
                      className="flex-1 min-w-0 px-2 py-1.5 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                    />
                  </div>
                  {slugChecking && (
                    <p className="text-xs text-gray-500 mt-1">檢查中...</p>
                  )}
                  {slugDuplicate && !slugChecking && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ 此網址代稱已被使用，請更換其他名稱
                    </p>
                  )}
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
                    rows={5}
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
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold focus:ring-2 focus:ring-luxe-gold/20 outline-none text-sm appearance-none cursor-pointer hover:border-luxe-gold/60 transition-all duration-200 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.5rem center",
                      backgroundSize: "1.25em 1.25em",
                    }}
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

                {/* 封面縮圖 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    封面縮圖
                    <span className="ml-1 text-gray-600">（列表卡片用）</span>
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
                    className={`w-full px-3 py-2 bg-luxe-bg border rounded-lg outline-none text-sm ${
                      article.coverImage && !isValidCloudinaryUrl(article.coverImage)
                        ? "border-red-500 focus:border-red-400"
                        : "border-luxe-gold/30 focus:border-luxe-gold"
                    }`}
                  />
                  {article.coverImage && !isValidCloudinaryUrl(article.coverImage) && (
                    <p className="text-xs text-red-400 mt-1">必須使用 Cloudinary 網址</p>
                  )}
                  {article.coverImage && isValidCloudinaryUrl(article.coverImage) && (
                    <img
                      src={article.coverImage}
                      alt="封面預覽"
                      className="mt-2 w-full h-24 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>

                {/* Banner 大圖 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Banner 大圖
                    <span className="ml-1 text-gray-600">（內頁頂部橫幅用）</span>
                  </label>
                  <input
                    type="url"
                    value={article.bannerImage}
                    onChange={(e) => {
                      setArticle((prev) => ({
                        ...prev,
                        bannerImage: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    placeholder="https://res.cloudinary.com/..."
                    className={`w-full px-3 py-2 bg-luxe-bg border rounded-lg outline-none text-sm ${
                      article.bannerImage && !isValidCloudinaryUrl(article.bannerImage)
                        ? "border-red-500 focus:border-red-400"
                        : "border-luxe-gold/30 focus:border-luxe-gold"
                    }`}
                  />
                  {article.bannerImage && !isValidCloudinaryUrl(article.bannerImage) && (
                    <p className="text-xs text-red-400 mt-1">必須使用 Cloudinary 網址</p>
                  )}
                  {article.bannerImage && isValidCloudinaryUrl(article.bannerImage) && (
                    <img
                      src={article.bannerImage}
                      alt="Banner 預覽"
                      className="mt-2 w-full h-24 object-cover rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-6 bg-black/70">
          <div className="bg-luxe-bg border border-luxe-gold/30 rounded-xl p-4 sm:p-6 w-full max-w-md mx-3 sm:mx-4 max-h-[80vh] overflow-y-auto my-auto">
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-6 bg-black/70">
          <div className="bg-luxe-bg border border-luxe-gold/30 rounded-xl p-4 sm:p-6 w-full max-w-2xl mx-3 sm:mx-4 max-h-[85vh] overflow-y-auto my-auto">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
