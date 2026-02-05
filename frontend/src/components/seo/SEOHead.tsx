/**
 * SEOHead 元件 - 動態 SEO Meta 標籤管理
 * @module components/seo/SEOHead
 *
 * @description
 * 此元件使用 react-helmet-async 在 SSR 時動態注入 meta 標籤，
 * 讓搜尋引擎爬蟲可以正確讀取頁面的 SEO 資訊。
 *
 * @example
 * ```tsx
 * <SEOHead
 *   title="健身新手指南"
 *   description="完整的健身入門教學..."
 *   keywords={['健身', '新手', '教學']}
 *   image="https://example.com/og-image.jpg"
 *   url="https://example.com/articles/fitness-guide"
 *   type="article"
 *   publishedTime="2026-01-25T10:00:00Z"
 *   author="Coach Aaron"
 * />
 * ```
 */

import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  /** 頁面標題 */
  title?: string;
  /** 頁面描述 (SEO meta description，建議 160 字以內) */
  description?: string;
  /** 關鍵字陣列 */
  keywords?: string[];
  /** OG Image URL (社群分享圖片) */
  image?: string;
  /** 頁面完整 URL */
  url?: string;
  /** OG 類型 (website, article, product) */
  type?: "website" | "article" | "product";
  /** 文章發布時間 (ISO 8601) */
  publishedTime?: string;
  /** 文章修改時間 (ISO 8601) */
  modifiedTime?: string;
  /** 作者名稱 */
  author?: string;
  /** 是否為文章 */
  isArticle?: boolean;
  /** 文章分類 */
  category?: string;
  /** 不要被搜尋引擎索引 */
  noIndex?: boolean;
}

/** 預設網站資訊 */
const DEFAULT_SITE_NAME = "阿倫教官 | Coach Aaron";
const DEFAULT_DESCRIPTION =
  "專業健身教練，提供線上課程、一對一訓練與健身知識分享";
const DEFAULT_IMAGE = "/images/og-default.jpg";
const DEFAULT_URL = "https://coach-aaron.com";

/**
 * SEOHead - 動態 SEO Meta 標籤元件
 *
 * @param {SEOHeadProps} props - SEO 屬性
 * @returns {JSX.Element} Helmet 元件
 */
const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  isArticle = false,
  category,
  noIndex = false,
}) => {
  // 組合完整標題
  const fullTitle = title
    ? `${title} | ${DEFAULT_SITE_NAME}`
    : DEFAULT_SITE_NAME;

  // 確保圖片是完整 URL（處理 null/undefined）
  const imageUrl = image || DEFAULT_IMAGE;
  const fullImage = imageUrl.startsWith("http")
    ? imageUrl
    : `${DEFAULT_URL}${imageUrl}`;

  // 確保 URL 是完整的
  const fullUrl = url?.startsWith("http") ? url : `${DEFAULT_URL}${url || ""}`;

  return (
    <Helmet>
      {/* 基本 Meta 標籤 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      {author && <meta name="author" content={author} />}

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph (Facebook, LINE, etc.) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={isArticle ? "article" : type} />
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:locale" content="zh_TW" />

      {/* 文章專用 OG 標籤 */}
      {isArticle && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {isArticle && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {isArticle && author && (
        <meta property="article:author" content={author} />
      )}
      {isArticle && category && (
        <meta property="article:section" content={category} />
      )}
      {isArticle &&
        keywords.map((keyword, idx) => (
          <meta key={idx} property="article:tag" content={keyword} />
        ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};

export default SEOHead;
