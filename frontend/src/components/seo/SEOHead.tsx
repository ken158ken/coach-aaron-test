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
  /** 商品價格（用於 Course schema 的 offers；未提供則不輸出 offers） */
  price?: number;
  /** 是否公開顯示價格（false 時不輸出 offers，避免與頁面「請洽詢」不一致） */
  showPrice?: boolean;
  /** 麵包屑（依序由淺到深，不含站台首頁；首頁會自動加在最前） */
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/** 預設網站資訊 */
const DEFAULT_SITE_NAME = "阿倫教官 | Coach Aaron";
// ⚠️ 本站為純 B2B（服務對象是健身教練同業，非一般健身會員），
//    預設描述不得再出現「一對一訓練」等 B2C 服務字眼。
const DEFAULT_DESCRIPTION =
  "阿倫教官｜私教變現顧問、教練職涯培訓講師。給私人教練的商業實戰培訓：銷售心理學、體驗課成交、續約經營與個人品牌，把專業變成穩定收入。";
const DEFAULT_IMAGE = "/images/og-default.jpg";

/**
 * 網站根 URL — 優先使用環境變數 VITE_SITE_URL
 * SSR 環境無 import.meta.env 時自動 fallback
 */
const DEFAULT_URL: string = (() => {
  try {
    return (
      import.meta.env?.VITE_SITE_URL || "https://coach-aaron-test.vercel.app"
    );
  } catch {
    return "https://coach-aaron-test.vercel.app";
  }
})();

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
  price,
  showPrice = true,
  breadcrumbs,
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

  // JSON-LD 結構化資料
  // 以 @graph 收納多個實體（Article / Course / BreadcrumbList），
  // 只輸出單一 <script>，避免 Helmet 對多個同型別 script 的處理歧異
  const jsonLd = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graph: Record<string, any>[] = [];

    if (isArticle) {
      graph.push({
        "@type": "Article",
        headline: title || DEFAULT_SITE_NAME,
        description,
        image: fullImage,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        author: { "@type": "Person", name: author || "阿倫教官" },
        publisher: {
          "@type": "Organization",
          name: DEFAULT_SITE_NAME,
          logo: { "@type": "ImageObject", url: `${DEFAULT_URL}/icons/icon-192.png` },
        },
        url: fullUrl,
        articleSection: category,
        keywords: keywords.join(", "),
      });
    }
    // Course：只要是 product 型別就輸出（過去因額外要求 price 而永遠不成立）
    if (type === "product" && title) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const course: Record<string, any> = {
        "@type": "Course",
        name: title,
        description,
        image: fullImage,
        url: fullUrl,
        provider: {
          "@type": "Person",
          name: "阿倫教官",
          sameAs: "https://www.instagram.com/coach.luen/",
        },
      };
      // 價格公開且為有效數值時才輸出 offers，與頁面顯示保持一致
      if (showPrice && typeof price === "number" && Number.isFinite(price)) {
        course.offers = {
          "@type": "Offer",
          price,
          priceCurrency: "TWD",
          availability: "https://schema.org/InStock",
          url: fullUrl,
        };
      }
      graph.push(course);
    }

    // BreadcrumbList
    if (breadcrumbs && breadcrumbs.length > 0) {
      const items = [{ name: "首頁", url: "/" }, ...breadcrumbs];
      graph.push({
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.name,
          item: item.url.startsWith("http")
            ? item.url
            : `${DEFAULT_URL}${item.url}`,
        })),
      });
    }

    if (graph.length === 0) return null;
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graph,
    });
  })();

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

      {/* JSON-LD 結構化資料 */}
      {jsonLd && (
        <script type="application/ld+json">{jsonLd}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
