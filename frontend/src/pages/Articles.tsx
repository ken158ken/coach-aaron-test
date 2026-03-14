/**
 * Articles 頁面 - 文章列表
 * @module pages/Articles
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { articleService } from "@/services/article.service";
import { PageHeader, Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { useScrollReveal, getStaggerClass } from "@/hooks/useScrollReveal";
import type { Article } from "@/types";

/**
 * Articles - 公開文章列表頁面
 *
 * @returns {JSX.Element} 文章列表頁面
 */
const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const articlesRef = useScrollReveal();

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
      <div className="min-h-screen bg-transparent relative">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loading text="載入中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title="專業知識"
        description="健身教練的專業分享與訓練心得，提供健身新手入門指南、訓練技巧、營養建議等實用內容"
        keywords={["健身", "訓練", "教練", "健身知識", "運動"]}
        url="/articles"
      />

      {/* 主要內容 */}
      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="studio-container">
        <PageHeader label="Knowledge" title="專業知識" subtitle="健身教練的專業分享與訓練心得" />
          {/* Category Filter — 橫向 scroll，永遠顯示「全部」 */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 sm:mb-8 hide-scrollbar">
              <button
                onClick={() => { setSelectedCategory(""); setCurrentPage(1); }}
                className={`page-filter-pill shrink-0 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 ${selectedCategory === "" ? "active" : ""}`}
                style={selectedCategory !== "" ? {
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                } : undefined}
              >
                全部
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                  className={`page-filter-pill shrink-0 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 ${selectedCategory === cat ? "active" : ""}`}
                  style={selectedCategory !== cat ? {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.55)",
                  } : undefined}
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
            >
              {articles.map((article, index) => (
                <Link
                  key={article.article_id}
                  to={`/articles/${article.article_slug || article.article_id}`}
                  className={`group scroll-reveal ${getStaggerClass(index)}`}
                >
                  <article className="article-card-item bg-[#141414] rounded-lg overflow-hidden border border-[#c5a059]/10 hover:border-[#c5a059]/40 hover:shadow-xl hover:shadow-[#c5a059]/10 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    {/* Thumbnail */}
                    {article.article_thumbnail_url ? (
                      <div className="aspect-16/10 overflow-hidden">
                        <img
                          src={article.article_thumbnail_url}
                          alt={article.article_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="no-thumb aspect-16/10 bg-[#c5a059]/10 flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl text-[#c5a059]/30">
                          📝
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      {/* Category & Featured */}
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        {article.article_category && (
                          <span className="cat-label text-[10px] sm:text-xs text-[#c5a059]">
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
                      <h2 className="text-sm sm:text-base font-light text-white/90 mb-1.5 sm:mb-2 group-hover:text-[#c5a059] transition-colors line-clamp-2">
                        {article.article_title}
                      </h2>

                      {/* Description */}
                      {article.article_description && (
                        <p className="text-[#888] text-xs sm:text-sm mb-2 sm:mb-3 flex-1 line-clamp-1 sm:line-clamp-2">
                          {article.article_description}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-[#888] mt-auto gap-2">
                        <span className="whitespace-nowrap">
                          {formatDate(article.published_at || article.created_at)}
                        </span>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="whitespace-nowrap">
                            {article.view_count || 0} 瀏覽
                          </span>
                          {article.rating_count > 0 && (
                            <span className="whitespace-nowrap hidden sm:inline">
                              ★ {article.rating_average.toFixed(1)} ({article.rating_count})
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
              <p className="text-sm sm:text-base text-[#888]">
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
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#141414] text-sm sm:text-base text-white/90 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(197,160,89,0.2)] hover:border-[#c5a059]/50 hover:scale-105 border border-transparent transition-all duration-300"
              >
                上一頁
              </button>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#888]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#141414] text-sm sm:text-base text-white/90 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(197,160,89,0.2)] hover:border-[#c5a059]/50 hover:scale-105 border border-transparent transition-all duration-300"
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
