/**
 * Articles 頁面 - 文章列表
 * @module pages/Articles
 * @theme luxe (LUXE 高端主題)
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { articleService } from "@/services/content/article.service";
import { PageHeader, Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { useScrollReveal, getStaggerClass } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks/useLocalize";
import { getInitialData } from "@/ssr/initialData";
import { dataKeys } from "@/ssr/routeData";
import type { Article, ArticlesResponse } from "@/types";

/**
 * Articles - 公開文章列表頁面
 *
 * @returns {JSX.Element} 文章列表頁面
 */
const Articles: React.FC = () => {
  const { t, language } = useLanguage();
  const { loc } = useLocalize();
  // ── SSR 預抓資料（僅第一頁、未篩選分類） ──
  const ssrList = getInitialData<ArticlesResponse>(dataKeys.articlesList());
  const ssrArticles = Array.isArray(ssrList?.articles) ? ssrList.articles : [];

  const [articles, setArticles] = useState<Article[]>(ssrArticles);
  const [loading, setLoading] = useState(ssrArticles.length === 0);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(ssrList?.totalPages || 1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>(() => [
    ...new Set(
      ssrArticles
        .map((a) => a.article_category)
        .filter((c): c is string => !!c),
    ),
  ]);
  const articlesRef = useScrollReveal();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
    return new Date(dateString).toLocaleDateString(
      language === "en" ? "en-US" : "zh-TW",
      { year: "numeric", month: "long", day: "numeric" },
    );
  };

  // SEO Meta 標籤 — 必須在 early return 之前建立，
  // 否則 loading 狀態下伺服器端輸出的 title 會是空的
  const seoHead = (
    <SEOHead
      title={t.article.pageLabel}
      description="健身教練的專業分享與訓練心得，提供健身新手入門指南、訓練技巧、營養建議等實用內容"
      keywords={["健身", "訓練", "教練", "健身知識", "運動"]}
      url="/articles"
      breadcrumbs={[{ name: t.article.pageLabel, url: "/articles" }]}
    />
  );

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-transparent relative">
        {seoHead}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loading text={t.common.loading} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative">
      {seoHead}

      {/* 主要內容 */}
      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="studio-container">
          <PageHeader label="Knowledge" title={t.article.pageLabel} subtitle={language === "en" ? "Professional insights and training tips from Coach Aaron" : "健身教練的專業分享與訓練心得"} />
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 sm:mb-8 hide-scrollbar">
              <button
                onClick={() => { setSelectedCategory(""); setCurrentPage(1); }}
                className={`page-filter-pill shrink-0 ${selectedCategory === "" ? "active" : ""}`}
              >
                {t.common.all}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                  className={`page-filter-pill shrink-0 ${selectedCategory === cat ? "active" : ""}`}
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

          {/* Articles Grid — Focus Cards */}
          {articles.length > 0 ? (
            <div
              ref={articlesRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {articles.map((article, index) => (
                <motion.div
                  key={article.article_id}
                  onMouseEnter={() => setHoveredIndex(index)}
                  initial={{
                    opacity: 1,
                    filter: "blur(0px) brightness(1)",
                    scale: 1,
                  }}
                  animate={{
                    opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.45,
                    filter: hoveredIndex === null || hoveredIndex === index ? "blur(0px) brightness(1)" : "blur(1.5px) brightness(0.55)",
                    scale: hoveredIndex === index ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`scroll-reveal ${getStaggerClass(index)}`}
                >
                <Link
                  to={`/articles/${article.article_slug || article.article_id}`}
                  className="group block h-full"
                >
                  <article className="article-card-item bg-surface rounded-lg overflow-hidden border border-gold/10 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 transition-all duration-300 h-full flex flex-col">
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
                        <span className="text-3xl sm:text-4xl text-gold/30">
                          📝
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      {/* Category & Featured */}
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        {article.article_category && (
                          <span className="cat-label text-[10px] sm:text-xs text-gold">
                            {loc(article as unknown as Record<string, unknown>, "article_category")}
                          </span>
                        )}
                        {article.is_featured && (
                          <span className="text-[10px] sm:text-xs text-yellow-500">
                            ★ {t.article.featured}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-sm sm:text-base font-light text-white/90 mb-1.5 sm:mb-2 group-hover:text-gold transition-colors line-clamp-2">
                        {loc(article as unknown as Record<string, unknown>, "article_title")}
                      </h2>

                      {/* Description */}
                      {article.article_description && (
                        <p className="text-muted text-xs sm:text-sm mb-2 sm:mb-3 flex-1 line-clamp-1 sm:line-clamp-2">
                          {loc(article as unknown as Record<string, unknown>, "article_description")}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted mt-auto gap-2">
                        <span className="whitespace-nowrap">
                          {formatDate(article.published_at || article.created_at)}
                        </span>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="whitespace-nowrap">
                            {article.view_count || 0} {t.common.views}
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
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <p className="text-sm sm:text-base text-muted">{t.common.noData}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-8 sm:mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-surface text-sm sm:text-base text-white/90 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(197,160,89,0.2)] hover:border-gold/50 hover:scale-105 border border-transparent transition-all duration-300"
              >
                {t.common.prev}
              </button>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-muted">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-surface text-sm sm:text-base text-white/90 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(197,160,89,0.2)] hover:border-gold/50 hover:scale-105 border border-transparent transition-all duration-300"
              >
                {t.common.next}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Articles;
