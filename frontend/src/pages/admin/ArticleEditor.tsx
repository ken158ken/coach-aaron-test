/**
 * 文章編輯器頁面
 * @module pages/admin/ArticleEditor
 * @description 簡潔的文章編輯頁面，使用 Tiptap 富文本編輯器
 * @features localStorage 自動暫存、分類管理、使用說明
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { useAuth } from "@/context";
import { Loading } from "@/components/ui";
import { articleService } from "@/services/article.service";

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

  // Tiptap 編輯器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      Placeholder.configure({
        placeholder: "開始撰寫文章內容...",
      }),
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

  /** 插入圖片 */
  const handleInsertImage = useCallback(() => {
    const url = prompt("請輸入圖片網址 (建議使用 Cloudinary):");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  /** 插入 YouTube */
  const handleInsertYoutube = useCallback(() => {
    const url = prompt("請輸入 YouTube 網址:");
    if (url && editor) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  /** 插入連結 */
  const handleInsertLink = useCallback(() => {
    const url = prompt("請輸入連結網址:");
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

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

  /** 發布文章 */
  const handlePublish = useCallback(async () => {
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
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
            >
              {isSaving ? "儲存中..." : "儲存草稿"}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-luxe-gold text-black hover:bg-luxe-gold/90 rounded-lg disabled:opacity-50 font-medium"
            >
              發布文章
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：文章內容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 標題 */}
            <div>
              <input
                type="text"
                value={article.title}
                onChange={(e) => {
                  setArticle((prev) => ({ ...prev, title: e.target.value }));
                  setHasChanges(true);
                }}
                placeholder="文章標題"
                className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-gray-600"
              />
            </div>

            {/* 編輯器工具列 */}
            <div className="flex flex-wrap gap-1 p-2 bg-luxe-surface rounded-lg border border-luxe-gold/20">
              {/* 文字格式 */}
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                title="粗體 - 讓文字變粗，強調重點"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("bold") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                title="斜體 - 讓文字傾斜，常用於引用或強調"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("italic") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                title="底線 - 在文字下方加線"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("underline") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                <u>U</u>
              </button>

              <span className="w-px bg-luxe-gold/30 mx-1" />

              {/* 標題 */}
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                title="大標題 - 文章主標題，字體最大"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("heading", { level: 1 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                H1
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                title="中標題 - 段落標題，字體中等"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("heading", { level: 2 }) ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 3 }).run()
                }
                title="小標題 - 子段落標題，字體較小"
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
                • 列表
              </button>
              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                title="編號列表 - 用數字條列步驟，適合有順序的清單"
                className={`px-3 py-1.5 text-sm rounded ${editor?.isActive("orderedList") ? "bg-luxe-gold text-black" : "hover:bg-luxe-gold/20"}`}
              >
                1. 列表
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

              {/* 插入 */}
              <button
                type="button"
                onClick={handleInsertImage}
                title="插入圖片 - 貼上圖片網址即可插入圖片（建議使用 Cloudinary）"
                className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
              >
                🖼️ 圖片
              </button>
              <button
                type="button"
                onClick={handleInsertYoutube}
                title="插入 YouTube 影片 - 貼上 YouTube 網址即可嵌入影片"
                className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
              >
                🎬 影片
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                title="插入連結 - 將文字轉換成可點擊的連結"
                className="px-3 py-1.5 text-sm rounded hover:bg-luxe-gold/20"
              >
                🔗 連結
              </button>
            </div>

            {/* 編輯器內容 */}
            <div className="min-h-[400px] p-4 bg-luxe-surface rounded-lg border border-luxe-gold/20">
              <EditorContent
                editor={editor}
                className="prose prose-invert max-w-none min-h-[350px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[350px]"
              />
            </div>
          </div>

          {/* 右側：文章資訊 */}
          <div className="space-y-6">
            <div className="p-4 bg-luxe-surface rounded-lg border border-luxe-gold/20">
              <h2 className="text-sm font-medium text-luxe-gold mb-4">
                文章資訊
              </h2>

              <div className="space-y-4">
                {/* Slug */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    網址代稱
                    <button
                      type="button"
                      onClick={() => {
                        setArticle((prev) => ({
                          ...prev,
                          slug: generateSlug(prev.title),
                        }));
                        setHasChanges(true);
                      }}
                      className="ml-2 text-luxe-gold hover:underline"
                    >
                      自動產生
                    </button>
                  </label>
                  <input
                    type="text"
                    value={article.slug}
                    onChange={(e) => {
                      setArticle((prev) => ({ ...prev, slug: e.target.value }));
                      setHasChanges(true);
                    }}
                    placeholder="article-url-slug"
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                  />
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
                      placeholder="輸入標籤..."
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
    </div>
  );
};

export default ArticleEditor;
