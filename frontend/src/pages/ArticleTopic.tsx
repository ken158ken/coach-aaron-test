/**
 * ArticleTopic 頁面 - 分類主題頁 /articles/topic/:category
 * @module pages/ArticleTopic
 *
 * @description
 * AEO 主題叢集（topic cluster）的落地頁：把同一個分類的文章集中成一頁，
 * 給搜尋引擎與生成式引擎一個「這個站對這個主題有系統性內容」的入口。
 *
 * ⚠️ 要點
 *   ● `:category` 是 **DB 的 `article_category` 原值**，目前是英文 slug
 *     （sales / mindset / retention；舊測試文才是逗號分隔中文），URL 上可能
 *     被百分比編碼。react-router 的 useParams 已解碼，但仍再 decode 一次
 *     （try/catch）以容忍直接餵進來的編碼字串；SSR 端 `routeData.ts` 用同樣
 *     的解碼結果組 key，兩邊必須一致才不會 hydration mismatch。
 *     **顯示名稱**才查字典的 `categoryLabels`（見 useLocalize().catLabel）；
 *     URL 與 API 的 `?category=` 一律帶原始 slug。
 *   ● 這是**公開可索引**路由 → App.tsx 必須用靜態 import（見 App.tsx 檔頭說明）。
 *   ● 0 篇文章 → noIndex（避免大量空殼分類頁被收錄成薄內容）。
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { articleService } from "@/services/content/article.service";
import { PageHeader, Loading } from "@/components/ui";
import { SEOHead } from "@/components/seo";
import { ArticleCard } from "@/components/articles/RelatedArticles";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalize } from "@/hooks/useLocalize";
import { getInitialData } from "@/ssr/initialData";
import { dataKeys } from "@/ssr/routeData";
import type { Article, ArticlesResponse } from "@/types";

/** 容錯解碼：已解碼的中文照原樣回傳，含 `%` 的怪字串不會炸 */
function safeDecode(raw?: string): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const ArticleTopic: React.FC = () => {
  const { category: rawCategory } = useParams<{ category: string }>();
  const { t } = useLanguage();
  const { catLabel } = useLocalize();

  const category = useMemo(() => safeDecode(rawCategory), [rawCategory]);

  // ── SSR 預抓資料（key 帶分類，切到別的分類不會誤用） ──
  const ssrList = category
    ? getInitialData<ArticlesResponse>(dataKeys.articlesByCategory(category))
    : undefined;
  const ssrArticles = Array.isArray(ssrList?.articles) ? ssrList.articles : [];

  const [articles, setArticles] = useState<Article[]>(ssrArticles);
  const [loading, setLoading] = useState(ssrArticles.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await articleService.getAll({ category, limit: 50 });
        if (cancelled) return;
        setArticles(Array.isArray(res?.articles) ? res.articles : []);
      } catch (err) {
        console.error("Failed to fetch topic articles:", err);
        if (!cancelled) {
          setArticles([]);
          setError(t.articlesExtra.loadFailed);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // t 只用於錯誤文案，不納入依賴避免切語言時重抓
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  /**
   * 顯示用的分類名稱。
   * DB 的 article_category 是英文 slug（sales / mindset / retention），
   * article_category_en 全為 null → 一律查字典的 categoryLabels，
   * 未知 slug（舊測試文的中文分類）直接顯示原值。URL 參數維持原始 slug。
   */
  const displayCategory = catLabel(category) || category;

  const heading = t.articleTopic.h1Template.replace("{category}", displayCategory);
  const intro = t.articleTopic.introTemplate.replace(
    "{category}",
    displayCategory,
  );
  const topicUrl = `/articles/topic/${encodeURIComponent(category)}`;

  const seoHead = (
    <SEOHead
      title={t.articleTopic.seoTitleTemplate.replace(
        "{category}",
        displayCategory,
      )}
      description={intro}
      keywords={[displayCategory, ...t.articlesExtra.seoKeywords]}
      url={topicUrl}
      abstract={intro}
      // 空分類（或載入失敗）不要被索引，避免薄內容頁進索引
      noIndex={(!loading && articles.length === 0) || Boolean(error)}
      breadcrumbs={[
        { name: t.article.pageLabel, url: "/articles" },
        { name: displayCategory, url: topicUrl },
      ]}
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

      <div className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="studio-container">
          <PageHeader
            label={t.articleTopic.label}
            title={heading}
            subtitle={intro}
          />

          {/* 篇數 */}
          {articles.length > 0 && (
            <p className="text-center text-xs sm:text-sm text-muted mb-6 sm:mb-8">
              {t.articleTopic.countTemplate.replace(
                "{count}",
                String(articles.length),
              )}
            </p>
          )}

          {error && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm sm:text-base text-red-400 text-center">
              {error}
            </div>
          )}

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {articles.map((article) => (
                <ArticleCard
                  key={article.article_id}
                  article={article}
                  headingLevel="h2"
                  descriptionLimit={90}
                />
              ))}
            </div>
          ) : (
            !error && (
              <div className="text-center py-12 sm:py-16">
                <p className="text-sm sm:text-base text-muted">
                  {t.articleTopic.empty}
                </p>
              </div>
            )
          )}

          {/* 底部導流 */}
          <div className="mt-10 sm:mt-14 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              to="/articles"
              className="px-5 py-2.5 rounded-lg bg-surface border border-gold/20 text-sm text-white/80 hover:border-gold/50 hover:text-white transition-colors"
            >
              ← {t.articleTopic.backToArticles}
            </Link>
            <Link
              to="/courses"
              className="px-5 py-2.5 rounded-lg bg-surface border border-gold/20 text-sm text-white/80 hover:border-gold/50 hover:text-white transition-colors"
            >
              {t.articleTopic.toCourses} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleTopic;
