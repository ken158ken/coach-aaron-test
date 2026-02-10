/**
 * Articles 頁面 - 文章列表
 * @module pages/Articles
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { articleService } from "@/services/article.service";
import { useTheme } from "@/context";
import { PageHeader, Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { PrismScene } from "@/components/three";
import { useScrollReveal, getStaggerClass } from "@/hooks/useScrollReveal";
import type { Article } from "@/types";

/**
 * Articles - 公開文章列表頁面
 *
 * @returns {JSX.Element} 文章列表頁面
 */
const Articles: React.FC = () => {
  const { setTheme } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const articlesRef = useScrollReveal();

  useEffect(() => {
    setTheme("luxe");
  }, [setTheme]);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, selectedCategory]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await articleService.getAll({
        page: currentPage,
        limit: 9,
        category: selectedCategory || undefined,
      });

      if (res && res.articles && Array.isArray(res.articles)) {
        setArticles(res.articles);
        setTotalPages(res.totalPages || 1);

        // 從文章中提取分類
        const cats = [
          ...new Set(
            res.articles
              .map((a) => a.article_category)
              .filter((c): c is string => !!c),
          ),
        ];
        if (cats.length > 0 && categories.length === 0) {
          setCategories(cats);
        }
      } else {
        setArticles([]);
        setError("載入文章失敗");
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      setArticles([]);
      setError("載入文章失敗");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-luxe-bg relative">
        <PrismScene />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loading text="載入中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxe-bg relative">
      {/* Three.js Background */}
      <PrismScene />

      {/* SEO Meta 標籤 */}
      <SEOHead
        title="專業知識"
        description="健身教練的專業分享與訓練心得，提供健身新手入門指南、訓練技巧、營養建議等實用內容"
        keywords={["健身", "訓練", "教練", "健身知識", "運動"]}
        url="/articles"
      />

      {/* 主要內容 - 統一 z-10 wrapper 確保在 Three.js 之上 */}
      <div className="relative z-10">
        <PageHeader title="專業知識" subtitle="健身教練的專業分享與訓練心得" />

        <div className="container mx-auto px-4 py-8 sm:py-12">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8 justify-center">
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setCurrentPage(1);
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  selectedCategory === ""
                    ? "bg-luxe-gold text-luxe-black shadow-lg shadow-luxe-gold/30"
                    : "bg-luxe-surface text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50 border border-transparent"
                }`}
              >
                全部
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-luxe-gold text-luxe-black shadow-lg shadow-luxe-gold/30"
                      : "bg-luxe-surface text-luxe-muted hover:text-luxe-gold hover:border-luxe-gold/50 border border-transparent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm sm:text-base text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Articles Grid */}
          {articles.length > 0 ? (
            <div
              ref={articlesRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            >
              {articles.map((article, index) => (
                <Link
                  key={article.article_id}
                  to={`/articles/${article.article_slug || article.article_id}`}
                  className={`group scroll-reveal ${getStaggerClass(index)}`}
                >
                  <article className="bg-luxe-surface rounded-lg overflow-hidden border border-luxe-gold/10 hover:border-luxe-gold/40 hover:shadow-xl hover:shadow-luxe-gold/10 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    {/* Thumbnail */}
                    {article.article_thumbnail_url ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={article.article_thumbnail_url}
                          alt={article.article_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-luxe-gold/10 flex items-center justify-center">
                        <span className="text-4xl sm:text-6xl text-luxe-gold/30">
                          📝
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col">
                      {/* Category & Featured */}
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        {article.article_category && (
                          <span className="text-[10px] sm:text-xs text-luxe-gold">
                            {article.article_category}
                          </span>
                        )}
                        {article.is_featured && (
                          <span className="text-[10px] sm:text-xs text-yellow-500">
                            ★ 精選
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-base sm:text-xl font-light text-luxe-text mb-2 sm:mb-3 group-hover:text-luxe-gold transition-colors line-clamp-2">
                        {article.article_title}
                      </h2>

                      {/* Description */}
                      {article.article_description && (
                        <p className="text-luxe-muted text-xs sm:text-sm mb-3 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-3">
                          {article.article_description}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-luxe-muted mt-auto gap-2">
                        <span className="whitespace-nowrap">
                          {formatDate(
                            article.published_at || article.created_at,
                          )}
                        </span>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="whitespace-nowrap">
                            {article.view_count || 0} 瀏覽
                          </span>
                          {article.rating_count > 0 && (
                            <span className="whitespace-nowrap hidden sm:inline">
                              ★ {article.rating_average.toFixed(1)} (
                              {article.rating_count})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <p className="text-sm sm:text-base text-luxe-muted">
                目前沒有文章
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-8 sm:mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-luxe-surface text-sm sm:text-base text-luxe-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-luxe-gold/20 hover:border-luxe-gold/50 hover:scale-105 border border-transparent transition-all duration-300"
              >
                上一頁
              </button>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-luxe-muted">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-luxe-surface text-sm sm:text-base text-luxe-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-luxe-gold/20 hover:border-luxe-gold/50 hover:scale-105 border border-transparent transition-all duration-300"
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Articles;
