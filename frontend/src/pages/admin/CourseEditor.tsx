/**
 * 課程編輯器頁面
 * @module pages/admin/CourseEditor
 * @description 簡潔的課程編輯頁面，使用 Tiptap 富文本編輯器
 * @features localStorage 自動暫存、分類管理、使用說明
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth, useLanguage } from "@/context";
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
// 這頁是獨立全頁路由（不在 AdminLayout 底下），所以自己掛一顆「?」導覽鈕
import { HelpTourButton } from "@/tours";

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

/**
 * 預設分類的骨架：id 與 slug 是資料（存進 localStorage、寫進課程欄位），
 * 顯示名稱走字典（`defaultCategories[id]`），所以這裡不放中文。
 */
const DEFAULT_CATEGORY_SEEDS = [
  { id: "strength", slug: "strength" },
  { id: "cardio", slug: "cardio" },
  { id: "flexibility", slug: "flexibility" },
  { id: "nutrition", slug: "nutrition" },
  { id: "mindset", slug: "mindset" },
  { id: "running", slug: "running" },
] as const;

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

  const { t } = useLanguage();
  /** 本頁字典（縮短取用路徑） */
  const tx = t.adminCourseEditorPage;

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
  /** 預設分類（名稱依語言取字典） */
  const defaultCategories = useMemo<Category[]>(
    () =>
      DEFAULT_CATEGORY_SEEDS.map((seed) => ({
        ...seed,
        name: tx.defaultCategories[seed.id],
      })),
    [tx],
  );
  /** 顯示用分類名稱：預設分類跟著語言走，使用者自訂的用存下來的名稱 */
  const categoryLabel = useCallback(
    (cat: Category) =>
      (tx.defaultCategories as Record<string, string | undefined>)[cat.id] ??
      cat.name,
    [tx],
  );
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // 使用說明 Modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 內文插圖 Modal（取代舊的純文字 prompt）
  const [showImagePicker, setShowImagePicker] = useState(false);

  /** 圖片上傳目標：已存檔課程用 id，新課程走 temp（後端儲存時搬正） */
  const uploadEntityKey = isNew ? null : (id ?? null);

  /* 手寫彈窗（分類管理／使用說明）的捲動鎖 + Escape */
  useModalBehavior(showCategoryModal, () => setShowCategoryModal(false));
  useModalBehavior(showHelpModal, () => setShowHelpModal(false));

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
    placeholder: tx.form.contentPlaceholder,
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
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
      }
    } catch (error) {
      logger.error("載入分類失敗:", error);
    }
  }, [defaultCategories]);

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
              title: tx.confirm.restoreDraftTitle,
              message: tx.confirm.restoreDraftMessage.replace(
                "{time}",
                savedTime.toLocaleString(),
              ),
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
    // 字典刻意不列入相依：切語言不該再問一次「是否恢復草稿」。
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
          title: t.adminCommon.loadFailed,
          message: tx.toast.loadFailedMessage,
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
    // 只在進入編輯模式時載入一次；字典（t/tx）刻意不列入相依，
    // 否則切換語言會重新抓資料、覆蓋掉尚未儲存的編輯內容。
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
      title: tx.insert.youtubeTitle,
      message: tx.insert.youtubeMessage,
      placeholder: "https://www.youtube.com/watch?v=...",
      validation: (value) => {
        if (!isValidYouTubeUrl(value)) {
          return tx.insert.youtubeInvalid;
        }
        return null;
      },
      renderPreview: (value) => {
        const videoId = extractYouTubeId(value);
        return videoId ? (
          <div className="mt-4 rounded-lg overflow-hidden border border-luxe-gold/30">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={tx.insert.youtubePreviewTitle}
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
          title: tx.insert.youtubeInvalidTitle,
          message: tx.insert.youtubeInvalidMessage,
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
  }, [editor, dialog, tx]);

  /** 插入連結 */
  const handleInsertLink = useCallback(async () => {
    const url = await dialog.prompt({
      title: tx.insert.linkTitle,
      message: tx.insert.linkMessage,
      placeholder: "https://...",
      validation: (value) => {
        try {
          new URL(value);
          return null;
        } catch {
          return tx.insert.linkInvalid;
        }
      },
    });

    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor, dialog, tx]);

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
        title: tx.toast.draftSavedTitle,
        message: tx.toast.draftSavedMessage,
        type: "success",
      });
      logger.info("手動儲存草稿成功");
    } catch (error) {
      logger.error("儲存草稿失敗:", error);
      await dialog.alert({
        title: t.adminCommon.saveFailed,
        message: tx.toast.saveFailedMessage,
        type: "error",
      });
    }
  }, [course, dialog, t, tx]);

  /** 發布課程 */
  const handlePublish = useCallback(async () => {
    if (!course.title.trim()) {
      await dialog.alert({
        title: tx.toast.titleRequiredTitle,
        message: tx.toast.titleRequiredMessage,
        type: "warning",
      });
      return;
    }

    // 驗證圖片網址：自家 Storage 上傳結果 或 Cloudinary 皆可
    // （舊版誤用只認 Cloudinary 的驗證，導致「上傳截圖」成功後反而無法存檔）
    // lib 的錯誤字串是固定繁中，這裡只取「合不合法」，訊息走本頁字典
    const coverInvalid = imageUrlError(course.coverImage) !== null;
    const bannerInvalid = imageUrlError(course.bannerImage) !== null;
    if (coverInvalid || bannerInvalid) {
      await dialog.alert({
        title: tx.toast.imageUrlErrorTitle,
        message: coverInvalid
          ? tx.toast.coverUrlInvalid
          : tx.toast.bannerUrlInvalid,
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
        title: tx.toast.publishSuccessTitle,
        message: tx.toast.publishSuccessMessage,
        type: "success",
      });
      navigate("/admin/courses");
    } catch (error) {
      logger.error("發布失敗:", error);
      await dialog.alert({
        title: tx.toast.publishFailedTitle,
        message: tx.toast.publishFailedMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [course, generateSlug, isNew, id, navigate, dialog, tx]);

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
        title: tx.confirm.deleteCategoryTitle,
        message: tx.confirm.deleteCategoryMessage,
        variant: "danger",
        confirmText: t.common.delete,
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
    [categories, course.category, dialog, t, tx],
  );

  /** 返回列表 */
  const handleBack = useCallback(async () => {
    if (hasChanges) {
      const confirmed = await dialog.confirm({
        title: tx.confirm.leaveTitle,
        message: tx.confirm.leaveMessage,
        variant: "danger",
        confirmText: tx.confirm.leaveConfirm,
        cancelText: tx.confirm.leaveCancel,
      });
      if (!confirmed) return;
    }
    navigate("/admin/courses");
  }, [navigate, hasChanges, dialog, tx]);

  // 權限保護
  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-luxe-bg">
        <Loading text={isLoading ? tx.loadingCourse : t.common.loading} />
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
              {t.common.back}
            </button>
            <span className="text-gray-500">|</span>
            <h1 className="font-medium">
              {isNew ? t.admin.newCourse : tx.editTitle}
            </h1>
            {hasChanges && (
              <span className="text-xs text-amber-400">
                ● {t.adminCommon.unsavedChanges}
              </span>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-500">
                {tx.lastSavedAt.replace(
                  "{time}",
                  lastSaved.toLocaleTimeString(),
                )}
              </span>
            )}

            {/* 說明按鈕 */}
            <Tooltip label={tx.helpTooltip}>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-luxe-gold/20 text-luxe-gold hover:bg-luxe-gold/30 text-sm font-bold"
              >
                ?
              </button>
            </Tooltip>
          </div>

          <div
            data-tour="course-editor-actions"
            className="flex items-center gap-3"
          >
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
            >
              {isSaving ? t.adminCommon.saving : t.admin.saveDraft}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-luxe-gold text-black hover:bg-luxe-gold/90 rounded-lg disabled:opacity-50 font-medium"
            >
              {tx.publishCourse}
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
                placeholder={tx.form.titlePlaceholder}
                data-tour="course-editor-title"
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
                {tx.sidebar.panelTitle}
              </h2>

              <div className="space-y-4">
                {/* Slug（可編輯） */}
                <div data-tour="course-editor-slug">
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-xs text-gray-400">
                      {tx.form.slugLabel}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSlugHelp((p) => !p)}
                        className="w-4 h-4 rounded-full bg-gray-600 text-gray-300 text-xs flex items-center justify-center hover:bg-luxe-gold hover:text-black transition-colors"
                        title={tx.form.slugHelpTooltip}
                      >
                        ?
                      </button>
                      {showSlugHelp && (
                        <div className="absolute left-6 top-0 z-50 w-64 p-3 bg-luxe-surface border border-luxe-gold/30 rounded-lg shadow-xl text-xs text-gray-300 leading-relaxed">
                          <p className="font-medium text-luxe-gold mb-1">
                            {tx.sidebar.slugHelpTitle}
                          </p>
                          <p>{tx.sidebar.slugHelpIntro}</p>
                          <p className="text-luxe-gold/80 my-1">
                            /courses/<strong>beginner-training</strong>
                          </p>
                          <p>{tx.sidebar.slugHelpRule}</p>
                          <p className="mt-1 text-gray-500">
                            {tx.sidebar.slugHelpFallback}
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowSlugHelp(false)}
                            className="mt-2 text-luxe-gold hover:underline"
                          >
                            {tx.sidebar.slugHelpGotIt}
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
                      placeholder={tx.form.slugPlaceholder}
                      className="flex-1 min-w-0 px-2 py-1.5 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                    />
                  </div>
                  {slugChecking && (
                    <p className="text-xs text-gray-500 mt-1">
                      {tx.form.slugChecking}
                    </p>
                  )}
                  {slugDuplicate && !slugChecking && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ {tx.form.slugDuplicate}
                    </p>
                  )}
                </div>

                {/* 簡介 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    {tx.form.descriptionLabel}
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
                    placeholder={tx.form.descriptionPlaceholder}
                    rows={5}
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none resize-none text-sm"
                  />
                </div>

                {/* 分類 */}
                <div data-tour="course-editor-category">
                  <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>{tx.form.categoryLabel}</span>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-luxe-gold hover:underline"
                    >
                      {t.admin.manageCategories}
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
                    <option value="">{tx.form.categoryPlaceholder}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {categoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 標籤 */}
                <div data-tour="course-editor-tags">
                  <label className="block text-xs text-gray-400 mb-1">
                    {tx.form.tagsLabel}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                      placeholder={tx.form.tagsPlaceholder}
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
                  label={tx.form.coverLabel}
                  hint={tx.form.coverHint}
                  value={course.coverImage}
                  onChange={(url) => setImageField("coverImage", url)}
                  entity="course"
                  entityKey={uploadEntityKey}
                  kind="cover"
                  aspectHint="16 / 9"
                />

                {/* Banner 圖片 (大圖) */}
                <ImageInput
                  label={tx.form.bannerLabel}
                  hint={tx.form.bannerHint}
                  value={course.bannerImage}
                  onChange={(url) => setImageField("bannerImage", url)}
                  entity="course"
                  entityKey={uploadEntityKey}
                  kind="banner"
                  aspectHint="21 / 9"
                />

                {/* 價格 */}
                <div data-tour="course-editor-price">
                  <label className="block text-xs text-gray-400 mb-1">
                    {tx.form.priceLabel}
                  </label>
                  <input
                    type="text"
                    value={course.price}
                    onChange={(e) => {
                      setCourse((prev) => ({ ...prev, price: e.target.value }));
                      setHasChanges(true);
                    }}
                    placeholder={tx.form.pricePlaceholder}
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                  />
                </div>

                {/* 課程時長 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    {tx.form.durationLabel}
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
                    placeholder={tx.form.durationPlaceholder}
                    className="w-full px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
                  />
                </div>

                {/* 難度等級 */}
                <div data-tour="course-editor-level">
                  <label className="block text-xs text-gray-400 mb-1">
                    {tx.form.levelLabel}
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
                    <option value="beginner">{tx.level.beginner}</option>
                    <option value="intermediate">
                      {tx.level.intermediate}
                    </option>
                    <option value="advanced">{tx.level.advanced}</option>
                    <option value="all">{tx.level.all}</option>
                  </select>
                </div>

                {/* 狀態 */}
                <div data-tour="course-editor-status">
                  <label className="block text-xs text-gray-400 mb-1">
                    {tx.form.statusLabel}
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
                      <span className="text-sm">{t.common.draft}</span>
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
                      <span className="text-sm">{t.common.published}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作說明 */}
            <div className="p-4 bg-luxe-gold/5 border border-luxe-gold/20 rounded-lg">
              <h3 className="text-xs font-medium text-luxe-gold mb-2">
                💡 {tx.tips.heading}
              </h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• {tx.tips.hover}</li>
                <li>• {tx.tips.autosave}</li>
                <li>• {tx.tips.categories}</li>
                <li>• {tx.tips.tagEnter}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 分類管理 Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 modal-layer modal-scroll flex items-start sm:items-center justify-center overflow-y-auto py-6 bg-black/70">
          <div className="bg-luxe-bg border border-luxe-gold/30 rounded-xl p-4 sm:p-6 w-full max-w-md mx-3 sm:mx-4 max-h-[80vh] overflow-y-auto modal-scroll my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {t.admin.manageCategories}
              </h3>
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
                placeholder={tx.categoryModal.namePlaceholder}
                className="flex-1 px-3 py-2 bg-luxe-bg border border-luxe-gold/30 rounded-lg focus:border-luxe-gold outline-none text-sm"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90 text-sm font-medium"
              >
                {t.common.create}
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
                    <p className="text-sm font-medium">{categoryLabel(cat)}</p>
                    <p className="text-xs text-gray-500">slug: {cat.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    {t.common.delete}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              ⚠️ {tx.categoryModal.storageNote}
            </p>
          </div>
        </div>
      )}

      {/* 使用說明 Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 modal-layer modal-scroll flex items-start sm:items-center justify-center overflow-y-auto py-6 bg-black/70">
          <div className="bg-luxe-bg border border-luxe-gold/30 rounded-xl p-4 sm:p-6 w-full max-w-2xl mx-3 sm:mx-4 max-h-[85vh] overflow-y-auto modal-scroll my-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-luxe-gold">
                📚 {tx.help.title}
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
                <h4 className="text-luxe-gold font-medium mb-2">
                  🖊️ {tx.help.basicsHeading}
                </h4>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    1. <strong>{tx.help.basicsStep1}</strong>
                    {tx.help.basicsStep1Desc}
                  </li>
                  <li>
                    2. <strong>{tx.help.basicsStep2}</strong>
                    {tx.help.basicsStep2Desc}
                  </li>
                  <li>
                    3. <strong>{tx.help.basicsStep3}</strong>
                    {tx.help.basicsStep3Desc}
                  </li>
                  <li>
                    4. <strong>{tx.help.basicsStep4}</strong>
                    {tx.help.basicsStep4Desc}
                  </li>
                </ul>
              </section>

              {/* 工具列說明 */}
              <section>
                <h4 className="text-luxe-gold font-medium mb-2">
                  🔧 {tx.help.toolbarHeading}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">B I U</p>
                    <p className="text-gray-400 text-xs">
                      {tx.help.toolbarFormatDesc}
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">H1 H2 H3</p>
                    <p className="text-gray-400 text-xs">
                      {tx.help.toolbarHeadingDesc}
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">{tx.help.toolbarListName}</p>
                    <p className="text-gray-400 text-xs">
                      {tx.help.toolbarListDesc}
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">⬅ ⬛ ➡</p>
                    <p className="text-gray-400 text-xs">
                      {tx.help.toolbarAlignDesc}
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">{tx.help.toolbarImageName}</p>
                    <p className="text-gray-400 text-xs">
                      {tx.help.toolbarImageDesc}
                    </p>
                  </div>
                  <div className="p-3 bg-luxe-surface rounded-lg">
                    <p className="font-medium">{tx.help.toolbarVideoName}</p>
                    <p className="text-gray-400 text-xs">
                      {tx.help.toolbarVideoDesc}
                    </p>
                  </div>
                </div>
              </section>

              {/* 右側欄位說明 */}
              <section>
                <h4 className="text-luxe-gold font-medium mb-2">
                  📋 {tx.help.fieldsHeading}
                </h4>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <strong>{tx.form.slugLabel}</strong>
                    {tx.help.fieldSlugDesc}
                  </li>
                  <li>
                    <strong>{tx.form.descriptionLabel}</strong>
                    {tx.help.fieldDescriptionDesc}
                  </li>
                  <li>
                    <strong>{tx.form.categoryLabel}</strong>
                    {tx.help.fieldCategoryDesc}
                  </li>
                  <li>
                    <strong>{tx.form.tagsLabel}</strong>
                    {tx.help.fieldTagsDesc}
                  </li>
                  <li>
                    <strong>{tx.help.fieldCover}</strong>
                    {tx.help.fieldCoverDesc}
                  </li>
                  <li>
                    <strong>{tx.help.fieldPrice}</strong>
                    {tx.help.fieldPriceDesc}
                  </li>
                  <li>
                    <strong>{tx.form.durationLabel}</strong>
                    {tx.help.fieldDurationDesc}
                  </li>
                  <li>
                    <strong>{tx.form.levelLabel}</strong>
                    {tx.help.fieldLevelDesc}
                  </li>
                </ul>
              </section>

              {/* 小技巧 */}
              <section>
                <h4 className="text-luxe-gold font-medium mb-2">
                  💡 {tx.help.tipsHeading}
                </h4>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    • {tx.help.tipAutosaveLead}
                    <strong>{tx.help.tipAutosaveStrong}</strong>
                    {tx.help.tipAutosaveTail}
                  </li>
                  <li>
                    • {tx.help.tipHoverLead}
                    <strong>{tx.help.tipHoverStrong}</strong>
                    {tx.help.tipHoverTail}
                  </li>
                  <li>
                    • {tx.help.tipImageLead}{" "}
                    <a
                      href="https://cloudinary.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-luxe-gold hover:underline"
                    >
                      Cloudinary
                    </a>{" "}
                    {tx.help.tipImageTail}
                  </li>
                  <li>
                    • {tx.help.tipVideoLead}
                    <strong>{tx.help.tipVideoStrong}</strong>
                    {tx.help.tipVideoTail}
                  </li>
                </ul>
              </section>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full py-3 bg-luxe-gold text-black rounded-lg hover:bg-luxe-gold/90 font-medium"
            >
              {tx.help.gotIt}
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
        title={tx.insert.imageTitle}
      />

      {/* 右下角「?」新手導覽（本頁不在 AdminLayout 之下，需自行掛載） */}
      <HelpTourButton />
    </div>
  );
};

export default CourseEditor;
