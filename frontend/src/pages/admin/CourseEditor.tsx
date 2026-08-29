/**
 * 課程編輯器頁面
 * @module pages/admin/CourseEditor
 * @description 簡潔的課程編輯頁面，使用 Tiptap 富文本編輯器
 * @features localStorage 自動暫存、分類管理、使用說明
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/context";
import {
  Loading,
  Tooltip,
  ImageInput,
  ImagePickerModal,
  ImageUploadTargetProvider,
} from "@/components/ui";
import { useDialog } from "@/components/ui/Dialog";
import { RichTextEditor } from "@/components/editor";
import { useRichTextEditor } from "@/hooks/useRichTextEditor";
import { courseService } from "@/services/content/course.service";
import { imageUrlError } from "@/lib/imageUrl";

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

/** 課程資料結構 */
interface CourseData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  coverImage: string;
  bannerImage: string;
  videoUrl: string;
  content: string;
  price: string;
  duration: string;
  level: string;
  status: "draft" | "published";
}

/** 分類資料結構 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/** localStorage key */
const STORAGE_KEY = "course_draft";
const CATEGORIES_KEY = "course_categories";

/** 預設分類 */
const DEFAULT_CATEGORIES: Category[] = [
  { id: "strength", name: "肌力訓練", slug: "strength" },
  { id: "cardio", name: "有氧體能", slug: "cardio" },
  { id: "flexibility", name: "柔軟度訓練", slug: "flexibility" },
  { id: "nutrition", name: "營養規劃", slug: "nutrition" },
  { id: "mindset", name: "心態訓練", slug: "mindset" },
  { id: "running", name: "跑步訓練", slug: "running" },
];

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[CourseEditor] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[CourseEditor] ${msg}`, err || ""),
};

const CourseEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const isNew = !id || id === "new";

  // 使用美化對話框
  const dialog = useDialog();

  // 客戶端掛載狀態 (防止 SSR 水合問題)
  const [mounted, setMounted] = useState(false);

  // 課程狀態
  const [course, setCourse] = useState<CourseData>({
    title: "",
    slug: "",
    description: "",
    category: "",
    tags: [],
    coverImage: "",
    bannerImage: "",
    videoUrl: "",
    content: "",
    price: "",
    duration: "",
    level: "beginner",
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

  // 使用說明 Modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 內文插圖 Modal（取代舊的純文字 prompt）
  const [showImagePicker, setShowImagePicker] = useState(false);

  /** 圖片上傳目標：已存檔課程用 id，新課程走 temp（後端儲存時搬正） */
  const uploadEntityKey = isNew ? null : (id ?? null);

  useScrollLock(showCategoryModal || showHelpModal);

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
          const res = await courseService.checkSlug(
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
      const sanitized = value
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, "")
        .slice(0, 60);
      setCourse((prev) => ({ ...prev, slug: sanitized }));
      setHasChanges(true);
      checkSlugDuplicate(sanitized);
    },
    [checkSlugDuplicate],
  );

  // 使用共用的富文本編輯器 Hook
  const editor = useRichTextEditor({
    content: course.content,
    placeholder: "開始撰寫課程內容...（輸入 @ 可提及他人）",
    onUpdate: (html) => {
      setCourse((prev) => ({ ...prev, content: html }));
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
              setCourse(data.course);
              editor.commands.setContent(data.course.content || "");
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

  // 載入既有課程資料（編輯模式）
  useEffect(() => {
    if (isNew || !id || !mounted || !editor) return;

    const loadCourse = async () => {
      try {
        setIsLoading(true);
        logger.info("載入課程資料, id:", id);
        const data = await courseService.getById(Number(id));
        logger.info("課程資料已載入:", data);

        const keywordsArray: string[] = data.course_keywords
          ? String(data.course_keywords)
              .split(",")
              .map((k: string) => k.trim())
              .filter(Boolean)
          : Array.isArray(data.keywords)
            ? data.keywords
            : [];

        const mapped: CourseData = {
          id: String(data.course_id),
          title: data.course_title || data.title || "",
          slug: data.course_slug || data.slug || "",
          description: data.course_description || data.description || "",
          category: data.course_category || data.category || "",
          tags: keywordsArray,
          coverImage: data.course_thumbnail_url || data.thumbnail || "",
          bannerImage: data.course_banner_url || "",
          videoUrl: "",
          content: data.course_content || data.content || "",
          price: data.price ? String(data.price) : "",
          duration: data.duration_minutes
            ? String(data.duration_minutes)
            : data.duration || "",
          level: data.course_level || data.level || "beginner",
          status: (data.status as "draft" | "published") || "draft",
        };

        setCourse(mapped);

        // 設定 Tiptap 編輯器內容
        if (mapped.content) {
          editor.commands.setContent(mapped.content);
        }

        logger.info("課程資料已填入表單");
      } catch (error) {
        logger.error("載入課程失敗:", error);
        await dialog.alert({
          title: "載入失敗",
          message: "載入課程失敗，請返回重試",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [isNew, id, mounted, editor]);

  // 自動儲存到 localStorage (每 30 秒，僅客戶端)
  useEffect(() => {
    if (typeof window === "undefined" || !mounted || !hasChanges) return;

    const autoSave = setInterval(() => {
      if (course.title || course.content) {
        try {
          const data = {
            course,
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
  }, [mounted, hasChanges, course]);

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
    if (tagInput.trim() && !course.tags.includes(tagInput.trim())) {
      setCourse((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
      setHasChanges(true);
    }
  }, [tagInput, course.tags]);

  /** 移除標籤 */
  const handleRemoveTag = useCallback((tag: string) => {
    setCourse((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
    setHasChanges(true);
  }, []);

  /** 設定圖片欄位（封面 / Banner），值由 ImageInput 提供 */
  const setImageField = useCallback(
    (field: "coverImage" | "bannerImage", url: string) => {
      setCourse((prev) => ({ ...prev, [field]: url }));
      setHasChanges(true);
    },
    [],
  );

  /** 插入內文插圖：開啟 ImageInput modal（上傳 or Cloudinary 網址） */
  const handleInsertImage = useCallback(() => {
    setShowImagePicker(true);
  }, []);

  /** Modal 確認後把圖片塞進編輯器 */
  const handleImagePicked = useCallback(
    (url: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertContent({
          type: "resizableImage",
          attrs: { src: url },
        })
        .run();
    },
    [editor],
  );

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
      if (!isValidYouTubeUrl(url)) {
        await dialog.alert({
          type: "error",
          title: "無效的影片網址",
          message: "只能使用 YouTube 影片網址！",
        });
        return;
      }
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
  const handleSaveDraft = useCallback(async () => {
    try {
      const data = {
        course,
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
  }, [course, dialog]);

  /** 發布課程 */
  const handlePublish = useCallback(async () => {
    if (!course.title.trim()) {
      await dialog.alert({
        title: "提示",
        message: "請輸入課程標題",
        type: "warning",
      });
      return;
    }

    // 驗證圖片網址：自家 Storage 上傳結果 或 Cloudinary 皆可
    // （舊版誤用只認 Cloudinary 的驗證，導致「上傳截圖」成功後反而無法存檔）
    const coverError = imageUrlError(course.coverImage, "封面圖片");
    const bannerError = imageUrlError(course.bannerImage, "Banner 圖片");
    if (coverError || bannerError) {
      await dialog.alert({
        title: "圖片網址錯誤",
        message: coverError || bannerError || "",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const slug = course.slug || generateSlug();
      const payload = {
        courseTitle: course.title,
        courseSlug: slug,
        courseDescription: course.description,
        courseContent: course.content,
        courseVideoUrl: course.videoUrl,
        courseThumbnailUrl: course.coverImage,
        courseBannerUrl: course.bannerImage,
        courseKeywords: course.tags,
        courseCategory: course.category,
        price: Number(course.price) || 0,
        currency: "TWD",
        status: "published" as const,
      };

      logger.info("發布課程:", payload);

      if (isNew) {
        await courseService.create(payload);
      } else {
        await courseService.update(Number(id), payload);
      }

      localStorage.removeItem(STORAGE_KEY);
      setHasChanges(false);
      await dialog.alert({
        title: "發布成功",
        message: "課程已發布！",
        type: "success",
      });
      navigate("/admin/courses");
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
  }, [course, generateSlug, isNew, id, navigate, dialog]);

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
      if (deletedCategory && course.category === deletedCategory.slug) {
        setCourse((prev) => ({ ...prev, category: "" }));
      }

      // TODO: 同步到資料庫
      logger.info("刪除分類:", categoryId);
    },
    [categories, course.category, dialog],
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
    navigate("/admin/courses");
  }, [navigate, hasChanges, dialog]);

  // 權限保護
  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-luxe-bg">
        <Loading text={isLoading ? "載入課程資料..." : "載入中..."} />
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
            <h1 className="font-medium">{isNew ? "新增課程" : "編輯課程"}</h1>
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
              發布課程
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：課程內容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 標題 */}
            <div>
              <input
                type="text"
                value={course.title}
                onChange={(e) => {
                  setCourse((prev) => ({ ...prev, title: e.target.value }));
                  setHasChanges(true);
                }}
                placeholder="課程標題"
                className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-gray-600"
              />
            </div>

            {/* 富文本編輯器
                Provider 讓編輯器內的插圖（圖片庫 node view）知道要傳到哪個課程 */}
            <ImageUploadTargetProvider
              value={{ entity: "course", entityKey: uploadEntityKey }}
            >
              <RichTextEditor
                editor={editor}
                onInsertImage={handleInsertImage}
                onInsertImageGallery={handleInsertImageGallery}
                onInsertYoutube={handleInsertYoutube}
                onInsertLink={handleInsertLink}
              />
            </ImageUploadTargetProvider>
          </div>

          {/* 右側：課程資訊 */}
          <div className="space-y-6">
            <div className="p-4 bg-luxe-surface rounded-lg border border-luxe-gold/20">
              <h2 className="text-sm font-medium text-luxe-gold mb-4">
                課程資訊
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
                          <p>影響課程網址的美觀度，例如：</p>
                          <p className="text-luxe-gold/80 my-1">
                            /courses/<strong>beginner-training</strong>
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
                      /courses/
                    </span>
                    <input
                      type="text"
                      value={course.slug}
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

                {/* 簡介 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    課程簡介
                  </label>
                  <textarea
                    value={course.description}
                    onChange={(e) => {
                      setCourse((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    placeholder="簡短描述課程內容..."
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
                    value={course.category}
                    onChange={(e) => {
                      setCourse((prev) => ({
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
                    {course.tags.map((tag) => (
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

                {/* 封面圖片 (縮圖) */}
                <ImageInput
                  label="封面縮圖"
                  hint="列表卡片用"
                  value={course.coverImage}
                  onChange={(url) => setImageField("coverImage", url)}
                  entity="course"
                  entityKey={uploadEntityKey}
                  kind="cover"
                  aspectHint="16 / 9"
                />

                {/* Banner 圖片 (大圖) */}
                <ImageInput
                  label="Banner 大圖"
                  hint="內頁頂部橫幅用"
                  value={course.bannerImage}
                  onChange={(url) => setImageField("bannerImage", url)}
                  entity="course"
                  entityKey={uploadEntityKey}
                  kind="banner"
                  aspectHint="21 / 9"
                />

                {/* 價格 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    價格 (NT$)
                  </label>
                  <input
                    type="text"
                    value={course.price}
                    onChange={(e) => {
                      setCourse((prev) => ({ ...prev, price: e.target.value }));
                      setHasChanges(true);
                    }}
                    placeholder="例：3000"
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                  />
                </div>

                {/* 課程時長 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    課程時長
                  </label>
                  <input
                    type="text"
                    value={course.duration}
                    onChange={(e) => {
                      setCourse((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    placeholder="例：60 分鐘"
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                  />
                </div>

                {/* 難度等級 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    難度等級
                  </label>
                  <select
                    value={course.level}
                    onChange={(e) => {
                      setCourse((prev) => ({ ...prev, level: e.target.value }));
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
                    <option value="beginner">初學者</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">高級</option>
                    <option value="all">所有程度</option>
                  </select>
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
                        checked={course.status === "draft"}
                        onChange={() => {
                          setCourse((prev) => ({ ...prev, status: "draft" }));
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
                        checked={course.status === "published"}
                        onChange={() => {
                          setCourse((prev) => ({
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
                📚 課程編輯器使用說明
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
                    1. <strong>輸入標題</strong>：在最上方的大輸入框輸入課程標題
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
                    4. <strong>發布課程</strong>：確認內容後點擊「發布課程」
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
                    ：課程的網址名稱，點「自動產生」會根據標題產生
                  </li>
                  <li>
                    <strong>課程簡介</strong>
                    ：簡短介紹課程內容，會顯示在課程列表
                  </li>
                  <li>
                    <strong>分類</strong>
                    ：選擇課程類型，點「管理分類」可以新增或刪除分類
                  </li>
                  <li>
                    <strong>標籤</strong>
                    ：輸入關鍵字後按 Enter 或點 + 新增
                  </li>
                  <li>
                    <strong>封面圖片</strong>
                    ：貼上圖片網址，建議使用 Cloudinary
                  </li>
                  <li>
                    <strong>價格</strong>
                    ：填入課程價格（新台幣）
                  </li>
                  <li>
                    <strong>課程時長</strong>
                    ：例如「60 分鐘」或「8 週課程」
                  </li>
                  <li>
                    <strong>難度等級</strong>
                    ：選擇適合的學員程度
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
                  <li>
                    • 可以嵌入<strong>訓練影片</strong>讓學員更好理解動作
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

      {/* 內文插圖選擇 Modal（上傳 / Cloudinary 網址） */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onConfirm={handleImagePicked}
        entity="course"
        entityKey={uploadEntityKey}
        kind="content"
        title="插入圖片"
      />
    </div>
  );
};

export default CourseEditor;
