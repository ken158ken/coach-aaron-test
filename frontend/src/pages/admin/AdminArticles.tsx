/**
 * AdminArticles 頁面 - 文章管理
 * @module pages/admin/AdminArticles
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  Pagination,
  PillButton,
  Input,
  Loading,
  Modal,
  Textarea,
  TagInput,
  useDialog,
} from "@/components/ui";
// 直接具名 import：避免 tiptap 經由 ui barrel 汙染前台主 chunk
import { RichTextEditor } from "@/components/ui/editor";
import { articleService } from "@/services/content/article.service";
import type { Article, ArticleStatus } from "@/types";

/** 日誌工具 */
const logger = {
  info: (msg: string, data?: unknown) =>
    console.log(`[AdminArticles] ${msg}`, data || ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[AdminArticles] ${msg}`, err || ""),
};

/**
 * AdminArticles - 文章管理頁面
 *
 * @returns {JSX.Element} 文章管理頁面
 */
type ViewMode = "list" | "card-sm" | "card-md" | "card-lg";

const viewOptions: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: "list", icon: "☰", label: "清單" },
  { mode: "card-sm", icon: "▪▪▪", label: "小圖" },
  { mode: "card-md", icon: "◻◻", label: "中圖" },
  { mode: "card-lg", icon: "⬜", label: "大圖" },
];

const AdminArticles: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useDialog();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // 表單狀態
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    category: [] as string[],
    keywords: [] as string[],
    status: "draft" as ArticleStatus,
    isFeatured: false,
  });

  /** 更新內容回調 */
  const handleContentChange = useCallback((html: string) => {
    setFormData((prev) => ({ ...prev, content: html }));
  }, []);

  /** 更新分類標籤回調 */
  const handleCategoryChange = useCallback((tags: string[]) => {
    setFormData((prev) => ({ ...prev, category: tags }));
  }, []);

  /** 更新關鍵字標籤回調 */
  const handleKeywordsChange = useCallback((tags: string[]) => {
    setFormData((prev) => ({ ...prev, keywords: tags }));
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, statusFilter]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await articleService.getAllAdmin({
        page: currentPage,
        limit: 10,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined,
      });

      if (res && res.articles && Array.isArray(res.articles)) {
        setArticles(res.articles);
        setTotalPages(res.totalPages || 1);
      } else {
        console.error("Failed to fetch articles:", res);
        setArticles([]);
        setError("載入文章失敗：數據格式錯誤");
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      setArticles([]);
      setError("載入文章失敗");
    } finally {
      setLoading(false);
    }
  };

  /** 從文章中提取所有唯一分類 */
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach((a) => {
      if (a.article_category) {
        a.article_category.split(",").forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) cats.add(trimmed);
        });
      }
    });
    return Array.from(cats).sort();
  }, [articles]);

  /** 依據精選 + 分類篩選器過濾文章（client-side） */
  const filteredArticles = useMemo(() => {
    let result = articles;
    if (featuredFilter !== "all") {
      result = result.filter((a) =>
        featuredFilter === "featured" ? a.is_featured : !a.is_featured,
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((a) =>
        (a.article_category || "")
          .toLowerCase()
          .includes(categoryFilter.toLowerCase()),
      );
    }
    return result;
  }, [articles, featuredFilter, categoryFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchArticles();
  };

  const handleCreate = async () => {
    try {
      setError("");
      if (!formData.title.trim()) {
        setError("標題為必填");
        return;
      }

      logger.info("Creating article", { title: formData.title });
      await articleService.create({
        title: formData.title,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        content: formData.content || undefined,
        category: formData.category.join(",") || undefined,
        keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
      });

      logger.info("Article created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      logger.error("Failed to create article", err);
      setError("建立文章失敗");
    }
  };

  const handleUpdate = async () => {
    if (!editingArticle) return;

    try {
      setError("");
      logger.info("Updating article", { id: editingArticle.article_id });
      await articleService.update(editingArticle.article_id, {
        title: formData.title,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        content: formData.content || undefined,
        category: formData.category.join(",") || undefined,
        keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
      });

      logger.info("Article updated successfully");
      setEditingArticle(null);
      resetForm();
      fetchArticles();
    } catch (err) {
      logger.error("Failed to update article", err);
      setError("更新文章失敗");
    }
  };

  const handleDelete = async (article: Article) => {
    const confirmed = await dialog.confirm({
      title: "刪除文章",
      message: `確定要刪除「${article.article_title}」嗎？此操作無法復原。`,
      variant: "danger",
      confirmText: "刪除",
    });
    if (!confirmed) return;

    try {
      await articleService.delete(article.article_id);
      fetchArticles();
    } catch (err) {
      console.error("Failed to delete article:", err);
      setError("刪除文章失敗");
    }
  };

  /**
   * 快速切換精選狀態
   */
  const handleToggleFeatured = async (article: Article) => {
    try {
      const newFeatured = !article.is_featured;
      logger.info("Toggling featured", {
        id: article.article_id,
        featured: newFeatured,
      });
      await articleService.update(article.article_id, {
        isFeatured: newFeatured,
      });
      // 更新本地狀態（避免重新載入）
      setArticles((prev) =>
        prev.map((a) =>
          a.article_id === article.article_id
            ? { ...a, is_featured: newFeatured }
            : a,
        ),
      );
      logger.info("Featured toggled successfully");
    } catch (err) {
      logger.error("Failed to toggle featured", err);
      setError("切換精選狀態失敗");
    }
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    // 將分類和關鍵字字串轉換為陣列
    const categoryArray = article.article_category
      ? article.article_category
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const keywordsArray = article.article_keywords
      ? article.article_keywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    setFormData({
      title: article.article_title,
      slug: article.article_slug || "",
      description: article.article_description || "",
      content: article.article_content || "",
      category: categoryArray,
      keywords: keywordsArray,
      status: article.status,
      isFeatured: article.is_featured,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      content: "",
      category: [],
      keywords: [],
      status: "draft",
      isFeatured: false,
    });
  };

  /** 狀態徽章（表格用） */
  const getStatusBadge = (status: ArticleStatus) => {
    const config = {
      draft: {
        dot: "bg-gray-400",
        text: "text-gray-400",
        bg: "bg-gray-500/10",
        label: "草稿",
      },
      published: {
        dot: "bg-emerald-400",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        label: "已發布",
      },
      archived: {
        dot: "bg-amber-400",
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        label: "已封存",
      },
    };
    const s = config[status];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full ${s.bg} ${s.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  };

  /** 狀態徽章（卡片浮標用，帶 absolute 定位） */
  const getCardStatusBadge = (status: ArticleStatus) => {
    const config = {
      draft: {
        dot: "bg-gray-400",
        text: "text-gray-300",
        bg: "bg-black/60 backdrop-blur-sm",
        label: "草稿",
      },
      published: {
        dot: "bg-emerald-400",
        text: "text-emerald-300",
        bg: "bg-black/60 backdrop-blur-sm",
        label: "已發布",
      },
      archived: {
        dot: "bg-amber-400",
        text: "text-amber-300",
        bg: "bg-black/60 backdrop-blur-sm",
        label: "已封存",
      },
    };
    const s = config[status];
    return (
      <span
        className={`absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-full ${s.bg} ${s.text} font-medium`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
        {s.label}
      </span>
    );
  };

  const columns = [
    {
      key: "article_title" as const,
      header: "標題",
      isPrimary: true,
      sortValue: (article: Article) =>
        (article.article_title || "").toLowerCase(),
      render: (article: Article) => (
        <p className="text-luxe-text">{article.article_title}</p>
      ),
    },
    { key: "article_category" as const, header: "分類" },
    {
      key: "is_featured" as const,
      header: "精選",
      sortValue: (article: Article) => (article.is_featured ? 1 : 0),
      render: (article: Article) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFeatured(article);
          }}
          className={`px-2 py-1 text-xs rounded cursor-pointer transition-all duration-200 hover:scale-105 ${
            article.is_featured
              ? "bg-luxe-gold/20 text-luxe-gold hover:bg-luxe-gold/30"
              : "bg-luxe-muted/10 text-luxe-muted/50 hover:bg-luxe-gold/10 hover:text-luxe-gold/70"
          }`}
          title={article.is_featured ? "取消精選" : "設為精選"}
        >
          {article.is_featured ? "★ 精選" : "☆ 普通"}
        </button>
      ),
    },
    {
      key: "status" as const,
      header: "狀態",
      render: (article: Article) => getStatusBadge(article.status),
    },
    {
      key: "view_count" as const,
      header: "瀏覽",
      hideOnMobile: true,
      sortValue: (article: Article) => article.view_count || 0,
      render: (article: Article) => article.view_count?.toLocaleString() || "0",
    },
    {
      key: "rating_average" as const,
      header: "評分",
      hideOnMobile: true,
      sortValue: (article: Article) => article.rating_average || 0,
      render: (article: Article) =>
        article.rating_count > 0
          ? `${article.rating_average.toFixed(1)} (${article.rating_count})`
          : "-",
    },
    {
      key: "created_at" as const,
      header: "建立日期",
      hideOnMobile: true,
      render: (article: Article) => article.created_at?.split("T")[0] || "-",
    },
    {
      key: "actions" as const,
      header: "操作",
      sortable: false,
      render: (article: Article) => (
        <div className="flex gap-2">
          <button
            onClick={() =>
              navigate(`/admin/articles/${article.article_id}/edit`)
            }
            className="text-luxe-gold hover:underline text-sm"
          >
            編輯
          </button>
          <button
            onClick={() => openEditModal(article)}
            className="text-blue-400 hover:underline text-sm"
          >
            快速編輯
          </button>
          <button
            onClick={() => handleDelete(article)}
            className="text-red-400 hover:underline text-sm"
          >
            刪除
          </button>
        </div>
      ),
    },
  ];

  if (loading && articles.length === 0) {
    return <Loading text="載入中..." />;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            文章管理
          </h1>
          <p className="text-sm sm:text-base text-luxe-muted">
            管理網站文章與部落格內容
          </p>
        </div>
        <div className="flex gap-3">
          <PillButton
            theme="luxe"
            variant="outline"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            快速新增
          </PillButton>
          <PillButton
            theme="luxe"
            variant="filled"
            onClick={() => navigate("/admin/articles/new")}
          >
            新增文章 →
          </PillButton>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
        <Input
          placeholder="搜尋文章..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            // 實時搜尋：延遲 300ms 後自動搜尋
            if (e.target.value === "") {
              setCurrentPage(1);
              fetchArticles();
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          theme="luxe"
          className="w-full sm:w-64"
          icon={
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer hover:border-luxe-gold/40 transition-all duration-200 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          <option value="all">全部狀態</option>
          <option value="draft">草稿</option>
          <option value="published">已發布</option>
          <option value="archived">已封存</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer hover:border-luxe-gold/40 transition-all duration-200 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          <option value="all">全部分類</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={featuredFilter}
          onChange={(e) => {
            setFeaturedFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer hover:border-luxe-gold/40 transition-all duration-200 [&>option]:bg-luxe-surface [&>option]:text-luxe-text"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          <option value="all">全部文章</option>
          <option value="featured">★ 僅精選</option>
          <option value="normal">☆ 普通文章</option>
        </select>
        <PillButton theme="luxe" variant="outline" onClick={handleSearch}>
          搜尋
        </PillButton>

        {/* 檢視模式切換 */}
        <div className="flex gap-1 bg-luxe-surface rounded-lg p-1 border border-luxe-gold/10 ml-auto">
          {viewOptions.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => setViewMode(opt.mode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === opt.mode
                  ? "bg-luxe-gold/20 text-luxe-gold"
                  : "text-luxe-muted hover:text-luxe-text"
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 篩選結果計數 */}
      {featuredFilter !== "all" && (
        <div className="mb-3 text-xs text-luxe-muted">
          {featuredFilter === "featured" ? "★ 精選" : "☆ 普通"}文章：
          {
            articles.filter((a) =>
              featuredFilter === "featured" ? a.is_featured : !a.is_featured,
            ).length
          }{" "}
          篇
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {viewMode === "list" ? (
        <>
          <DataTable
            columns={columns}
            data={filteredArticles}
            keyExtractor={(article) => String(article.article_id)}
            loading={loading}
            theme="luxe"
            emptyMessage="沒有找到文章"
            sortable
          />
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              theme="luxe"
            />
          </div>
        </>
      ) : (
        <>
          {loading ? (
            <div className="text-center py-12 text-luxe-muted">載入中...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              沒有找到文章
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                viewMode === "card-sm"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  : viewMode === "card-md"
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {filteredArticles.map((article) => (
                <div
                  key={article.article_id}
                  className={`group bg-luxe-surface rounded-lg border border-luxe-gold/10 hover:border-luxe-gold/30 overflow-hidden transition-all ${
                    !article.is_featured ? "" : "ring-1 ring-luxe-gold/20"
                  }`}
                >
                  {/* 縮圖 */}
                  <div className="aspect-[16/9] bg-luxe-bg flex items-center justify-center relative">
                    {article.article_thumbnail_url ? (
                      <img
                        src={article.article_thumbnail_url}
                        alt={article.article_title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl text-luxe-muted/30">📝</span>
                    )}
                    {/* 狀態浮標 */}
                    {getCardStatusBadge(article.status)}
                    {/* 精選浮標 */}
                    {article.is_featured && (
                      <span className="absolute top-1.5 right-1.5 bg-luxe-gold/90 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                        ★ 精選
                      </span>
                    )}
                  </div>

                  {/* 資訊 */}
                  <div className="p-3">
                    <h3
                      className={`font-medium text-luxe-text truncate mb-1 ${
                        viewMode === "card-sm" ? "text-xs" : "text-sm"
                      }`}
                    >
                      {article.article_title}
                    </h3>
                    {viewMode !== "card-sm" && (
                      <p className="text-xs text-luxe-muted line-clamp-2 mb-2">
                        {article.article_description || "無描述"}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-luxe-muted">
                      <span>{article.article_category || "未分類"}</span>
                      <span>👁 {article.view_count || 0}</span>
                    </div>

                    {/* 操作按鈕（觸控裝置始終顯示，桌面 hover 顯示） */}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-luxe-gold/5">
                      <button
                        onClick={() =>
                          navigate(`/admin/articles/${article.article_id}/edit`)
                        }
                        className="text-luxe-gold hover:underline text-xs flex-1"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(article)}
                        className="text-yellow-400 hover:underline text-xs"
                      >
                        {article.is_featured ? "取消精選" : "精選"}
                      </button>
                      <button
                        onClick={() => handleDelete(article)}
                        className="text-red-400 hover:underline text-xs"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              theme="luxe"
            />
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || !!editingArticle}
        onClose={() => {
          setShowCreateModal(false);
          setEditingArticle(null);
          resetForm();
        }}
        title={editingArticle ? "編輯文章" : "新增文章"}
        theme="luxe"
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* 基本資訊 */}
          <div className="space-y-4">
            <Input
              label="標題 *"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              theme="luxe"
            />
            <Input
              label="Slug (網址識別碼)"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              theme="luxe"
              placeholder="自動生成如留空"
            />
          </div>

          {/* 分類與關鍵字 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TagInput
              label="分類"
              tags={formData.category}
              onChange={handleCategoryChange}
              theme="luxe"
              placeholder="輸入後按 Enter 新增"
              hint="可新增多個分類"
              maxTags={5}
            />
            <TagInput
              label="關鍵字 (SEO)"
              tags={formData.keywords}
              onChange={handleKeywordsChange}
              theme="luxe"
              placeholder="輸入後按 Enter 新增"
              hint="用於搜尋引擎優化"
              maxTags={10}
            />
          </div>

          {/* 簡介 */}
          <Textarea
            label="簡介 (SEO 描述)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            theme="luxe"
            rows={2}
          />

          {/* 內容編輯器 */}
          <div>
            <label className="block text-luxe-muted text-sm mb-2">
              文章內容
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              theme="luxe"
              placeholder="開始撰寫文章內容..."
              minHeight="350px"
            />
          </div>

          {/* 狀態與精選 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-luxe-muted text-sm mb-2">狀態</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ArticleStatus,
                  })
                }
                className="w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-2 text-luxe-text [&>option]:bg-luxe-bg [&>option]:text-luxe-text"
              >
                <option value="draft">草稿</option>
                <option value="published">發布</option>
                <option value="archived">封存</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-luxe-gold/30"
                />
                <span className="text-luxe-text">設為精選</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-luxe-gold/20">
          <PillButton
            theme="luxe"
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              setEditingArticle(null);
              resetForm();
            }}
          >
            取消
          </PillButton>
          <PillButton
            theme="luxe"
            variant="filled"
            onClick={editingArticle ? handleUpdate : handleCreate}
          >
            {editingArticle ? "更新" : "建立"}
          </PillButton>
        </div>
      </Modal>
    </div>
  );
};

export default AdminArticles;
