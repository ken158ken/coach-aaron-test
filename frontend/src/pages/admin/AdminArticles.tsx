/**
 * AdminArticles 頁面 - 文章管理
 * @module pages/admin/AdminArticles
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import {
  DataTable,
  Pagination,
  PillButton,
  Input,
  Loading,
  Modal,
  Textarea,
} from "@/components/ui";
import { articleService } from "@/services/article.service";
import type { Article, ArticleStatus } from "@/types";

/**
 * AdminArticles - 文章管理頁面
 *
 * @returns {JSX.Element} 文章管理頁面
 */
const AdminArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // 表單狀態
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    category: "",
    status: "draft" as ArticleStatus,
    isFeatured: false,
  });

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

      await articleService.create({
        title: formData.title,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        content: formData.content || undefined,
        category: formData.category || undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
      });

      setShowCreateModal(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error("Failed to create article:", err);
      setError("建立文章失敗");
    }
  };

  const handleUpdate = async () => {
    if (!editingArticle) return;

    try {
      setError("");
      await articleService.update(editingArticle.article_id, {
        title: formData.title,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        content: formData.content || undefined,
        category: formData.category || undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
      });

      setEditingArticle(null);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error("Failed to update article:", err);
      setError("更新文章失敗");
    }
  };

  const handleDelete = async (article: Article) => {
    if (!confirm(`確定要刪除「${article.article_title}」嗎？`)) return;

    try {
      await articleService.delete(article.article_id);
      fetchArticles();
    } catch (err) {
      console.error("Failed to delete article:", err);
      setError("刪除文章失敗");
    }
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.article_title,
      slug: article.article_slug || "",
      description: article.article_description || "",
      content: article.article_content || "",
      category: article.article_category || "",
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
      category: "",
      status: "draft",
      isFeatured: false,
    });
  };

  const getStatusBadge = (status: ArticleStatus) => {
    const styles = {
      draft: "bg-gray-500/20 text-gray-400",
      published: "bg-green-500/20 text-green-400",
      archived: "bg-yellow-500/20 text-yellow-400",
    };
    const labels = {
      draft: "草稿",
      published: "已發布",
      archived: "已封存",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const columns = [
    {
      key: "article_title" as const,
      header: "標題",
      isPrimary: true,
      render: (article: Article) => (
        <div>
          <p className="text-luxe-text">{article.article_title}</p>
          {article.is_featured && (
            <span className="text-xs text-luxe-gold">★ 精選</span>
          )}
        </div>
      ),
    },
    { key: "article_category" as const, header: "分類" },
    {
      key: "status" as const,
      header: "狀態",
      render: (article: Article) => getStatusBadge(article.status),
    },
    {
      key: "view_count" as const,
      header: "瀏覽",
      hideOnMobile: true,
      render: (article: Article) => article.view_count?.toLocaleString() || "0",
    },
    {
      key: "rating_average" as const,
      header: "評分",
      hideOnMobile: true,
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
      render: (article: Article) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(article)}
            className="text-luxe-gold hover:underline text-sm"
          >
            編輯
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light text-luxe-text">文章管理</h1>
          <p className="text-luxe-muted">管理網站文章與部落格內容</p>
        </div>
        <PillButton
          theme="luxe"
          variant="filled"
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          新增文章
        </PillButton>
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
          className="w-full sm:w-auto bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 text-luxe-text focus:outline-none focus:border-luxe-gold/50 [&>option]:bg-luxe-bg [&>option]:text-luxe-text"
        >
          <option value="all">全部狀態</option>
          <option value="draft">草稿</option>
          <option value="published">已發布</option>
          <option value="archived">已封存</option>
        </select>
        <PillButton theme="luxe" variant="outline" onClick={handleSearch}>
          搜尋
        </PillButton>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={articles}
        keyExtractor={(article) => String(article.article_id)}
        loading={loading}
        theme="luxe"
        emptyMessage="沒有找到文章"
      />

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          theme="luxe"
        />
      </div>

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
        size="lg"
      >
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
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            theme="luxe"
            placeholder="自動生成如留空"
          />
          <Input
            label="分類"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            theme="luxe"
          />
          <Textarea
            label="簡介 (SEO 描述)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            theme="luxe"
            rows={2}
          />
          <Textarea
            label="內容"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            theme="luxe"
            rows={10}
          />
          <div className="flex gap-4">
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
        <div className="flex justify-end gap-3 mt-6">
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
