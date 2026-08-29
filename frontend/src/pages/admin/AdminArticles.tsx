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
  ImageUploadTargetProvider,
} from "@/components/ui";
// 直接具名 import：避免 tiptap 經由 ui barrel 汙染前台主 chunk
import { RichTextEditor } from "@/components/ui/editor";
import { useLanguage } from "@/context/LanguageContext";
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

/** 檢視模式的圖示（文案在字典裡，見元件內的 viewOptions） */
const viewIcons: { mode: ViewMode; icon: string }[] = [
  { mode: "list", icon: "☰" },
  { mode: "card-sm", icon: "▪▪▪" },
  { mode: "card-md", icon: "◻◻" },
  { mode: "card-lg", icon: "⬜" },
];

const AdminArticles: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tp = t.adminArticlesPage;

  /** 檢視模式選項（label 需要字典，所以放在元件內） */
  const viewOptions = useMemo(
    () =>
      viewIcons.map(({ mode, icon }) => ({
        mode,
        icon,
        label: {
          list: tp.view.list,
          "card-sm": tp.view.cardSm,
          "card-md": tp.view.cardMd,
          "card-lg": tp.view.cardLg,
        }[mode],
      })),
    [tp],
  );

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
        setError(tp.toast.loadFailedFormat);
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      setArticles([]);
      setError(tp.toast.loadFailed);
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
        setError(tp.toast.titleRequired);
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
      setError(tp.toast.createFailed);
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
      setError(tp.toast.updateFailed);
    }
  };

  const handleDelete = async (article: Article) => {
    const confirmed = await dialog.confirm({
      title: tp.confirm.deleteTitle,
      message: tp.confirm.deleteMessage.replace(
        "{title}",
        article.article_title,
      ),
      variant: "danger",
      confirmText: t.common.delete,
    });
    if (!confirmed) return;

    try {
      await articleService.delete(article.article_id);
      fetchArticles();
    } catch (err) {
      console.error("Failed to delete article:", err);
      setError(tp.toast.deleteFailed);
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
      setError(tp.toast.toggleFeaturedFailed);
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
        label: t.common.draft,
      },
      published: {
        dot: "bg-emerald-400",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        label: t.common.published,
      },
      archived: {
        dot: "bg-amber-400",
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        label: tp.statusArchived,
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
        label: t.common.draft,
      },
      published: {
        dot: "bg-emerald-400",
        text: "text-emerald-300",
        bg: "bg-black/60 backdrop-blur-sm",
        label: t.common.published,
      },
      archived: {
        dot: "bg-amber-400",
        text: "text-amber-300",
        bg: "bg-black/60 backdrop-blur-sm",
        label: tp.statusArchived,
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
      header: t.adminCommon.colTitle,
      isPrimary: true,
      sortValue: (article: Article) =>
        (article.article_title || "").toLowerCase(),
      render: (article: Article) => (
        <p className="text-luxe-text">{article.article_title}</p>
      ),
    },
    { key: "article_category" as const, header: t.adminCommon.colCategory },
    {
      key: "is_featured" as const,
      header: tp.col.featured,
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
          title={article.is_featured ? tp.featured.unset : tp.featured.set}
        >
          {article.is_featured ? tp.featured.on : tp.featured.off}
        </button>
      ),
    },
    {
      key: "status" as const,
      header: t.adminCommon.colStatus,
      render: (article: Article) => getStatusBadge(article.status),
    },
    {
      key: "view_count" as const,
      header: tp.col.views,
      hideOnMobile: true,
      sortValue: (article: Article) => article.view_count || 0,
      render: (article: Article) => article.view_count?.toLocaleString() || "0",
    },
    {
      key: "rating_average" as const,
      header: tp.col.rating,
      hideOnMobile: true,
      sortValue: (article: Article) => article.rating_average || 0,
      render: (article: Article) =>
        article.rating_count > 0
          ? `${article.rating_average.toFixed(1)} (${article.rating_count})`
          : "-",
    },
    {
      key: "created_at" as const,
      header: t.adminCommon.colCreatedAt,
      hideOnMobile: true,
      render: (article: Article) => article.created_at?.split("T")[0] || "-",
    },
    {
      key: "actions" as const,
      header: t.adminCommon.colActions,
      sortable: false,
      render: (article: Article) => (
        <div className="flex gap-2">
          <button
            onClick={() =>
              navigate(`/admin/articles/${article.article_id}/edit`)
            }
            className="text-luxe-gold hover:underline text-sm"
          >
            {t.common.edit}
          </button>
          <button
            onClick={() => openEditModal(article)}
            className="text-blue-400 hover:underline text-sm"
          >
            {tp.quickEdit}
          </button>
          <button
            onClick={() => handleDelete(article)}
            className="text-red-400 hover:underline text-sm"
          >
            {t.common.delete}
          </button>
        </div>
      ),
    },
  ];

  if (loading && articles.length === 0) {
    return <Loading text={t.common.loading} />;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            {t.admin.articles}
          </h1>
          <p className="text-sm sm:text-base text-luxe-muted">
            {tp.pageSubtitle}
          </p>
        </div>
        <div className="flex gap-3">
          <PillButton
            theme="luxe"
            variant="outline"
            data-tour="articles-quick-add"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            {tp.quickAdd}
          </PillButton>
          <PillButton
            theme="luxe"
            variant="filled"
            data-tour="articles-full-editor"
            onClick={() => navigate("/admin/articles/new")}
          >
            {tp.newArticle}
          </PillButton>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
        <Input
          placeholder={tp.searchPlaceholder}
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
          data-tour="articles-search"
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
          data-tour="articles-status-filter"
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
          <option value="all">{tp.filter.allStatus}</option>
          <option value="draft">{t.common.draft}</option>
          <option value="published">{t.common.published}</option>
          <option value="archived">{tp.statusArchived}</option>
        </select>
        <select
          value={categoryFilter}
          data-tour="articles-category-filter"
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
          <option value="all">{tp.filter.allCategories}</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={featuredFilter}
          data-tour="articles-featured-filter"
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
          <option value="all">{tp.filter.allArticles}</option>
          <option value="featured">{tp.filter.featuredOnly}</option>
          <option value="normal">{tp.filter.normalOnly}</option>
        </select>
        <PillButton theme="luxe" variant="outline" onClick={handleSearch}>
          {t.common.search}
        </PillButton>

        {/* 檢視模式切換 */}
        <div
          data-tour="articles-view-toggle"
          className="flex gap-1 bg-luxe-surface rounded-lg p-1 border border-luxe-gold/10 ml-auto"
        >
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
          {(featuredFilter === "featured"
            ? tp.filter.featuredCount
            : tp.filter.normalCount
          ).replace(
            "{n}",
            String(
              articles.filter((a) =>
                featuredFilter === "featured" ? a.is_featured : !a.is_featured,
              ).length,
            ),
          )}
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
            data-tour="articles-table"
            columns={columns}
            data={filteredArticles}
            keyExtractor={(article) => String(article.article_id)}
            loading={loading}
            theme="luxe"
            emptyMessage={tp.emptyState}
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
            <div className="text-center py-12 text-luxe-muted">
              {t.common.loading}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-luxe-muted">
              {tp.emptyState}
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
                        {tp.featured.on}
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
                        {article.article_description || tp.noDescription}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-luxe-muted">
                      <span>
                        {article.article_category ||
                          t.adminCommon.uncategorized}
                      </span>
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
                        {t.common.edit}
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(article)}
                        className="text-yellow-400 hover:underline text-xs"
                      >
                        {article.is_featured
                          ? tp.featured.unset
                          : tp.featured.short}
                      </button>
                      <button
                        onClick={() => handleDelete(article)}
                        className="text-red-400 hover:underline text-xs"
                      >
                        {t.common.delete}
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
        title={editingArticle ? tp.form.editTitle : tp.form.createTitle}
        theme="luxe"
        size="xl"
        tourId="article-quick"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* 基本資訊 */}
          <div className="space-y-4">
            <Input
              label={tp.form.title}
              data-tour="article-form-title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              theme="luxe"
            />
            <Input
              label={tp.form.slug}
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              theme="luxe"
              placeholder={tp.form.slugPlaceholder}
            />
          </div>

          {/* 分類與關鍵字 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TagInput
              label={t.adminCommon.colCategory}
              tags={formData.category}
              onChange={handleCategoryChange}
              theme="luxe"
              placeholder={tp.form.tagPlaceholder}
              hint={tp.form.categoryHint}
              maxTags={5}
            />
            <TagInput
              label={tp.form.keywords}
              tags={formData.keywords}
              onChange={handleKeywordsChange}
              theme="luxe"
              placeholder={tp.form.tagPlaceholder}
              hint={tp.form.keywordsHint}
              maxTags={10}
            />
          </div>

          {/* 簡介 */}
          <Textarea
            label={tp.form.description}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            theme="luxe"
            rows={2}
          />

          {/* 內容編輯器 */}
          <div data-tour="article-form-content">
            <label className="block text-luxe-muted text-sm mb-2">
              {tp.form.content}
            </label>
            <ImageUploadTargetProvider
              value={{ entity: "article", entityKey: editingArticle?.article_id ?? null }}
            >
              <RichTextEditor
                content={formData.content}
                onChange={handleContentChange}
                theme="luxe"
                placeholder={tp.form.contentPlaceholder}
                minHeight="350px"
              />
            </ImageUploadTargetProvider>
          </div>

          {/* 狀態與精選 */}
          <div
            data-tour="article-form-status"
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1">
              <label className="block text-luxe-muted text-sm mb-2">
                {t.adminCommon.colStatus}
              </label>
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
                <option value="draft">{t.common.draft}</option>
                <option value="published">{t.admin.publish}</option>
                <option value="archived">{tp.statusArchive}</option>
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
                <span className="text-luxe-text">{tp.form.setFeatured}</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-luxe-gold/20">
          <PillButton
            theme="luxe"
            variant="outline"
            data-tour="article-form-cancel"
            onClick={() => {
              setShowCreateModal(false);
              setEditingArticle(null);
              resetForm();
            }}
          >
            {t.common.cancel}
          </PillButton>
          <PillButton
            theme="luxe"
            variant="filled"
            data-tour="article-form-submit"
            onClick={editingArticle ? handleUpdate : handleCreate}
          >
            {editingArticle ? tp.updateBtn : tp.createBtn}
          </PillButton>
        </div>
      </Modal>
    </div>
  );
};

export default AdminArticles;
