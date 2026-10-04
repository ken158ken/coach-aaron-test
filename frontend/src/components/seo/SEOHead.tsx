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
import { useLanguage } from "@/context/LanguageContext";
import { SOCIAL_LINKS } from "@/constants";
import type { FaqItem } from "@/types/content";

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
  /**
   * 是否把品牌後綴接在 title 後面（`標題 | 阿倫教官`）。
   * 首頁等「title 本身已含品牌名」的頁面傳 false，避免標題被 Google 截斷。
   */
  titleTemplate?: boolean;
  /**
   * 是否輸出教練本人的 `Person` 結構化資料（/about 用；首頁會自動輸出）。
   * 全站共用同一個 `@id`，Google 才會把各頁的描述歸到同一個人。
   */
  person?: boolean;
  /** 商品價格（用於 Course schema 的 offers；未提供則不輸出 offers） */
  price?: number;
  /** 是否公開顯示價格（false 時不輸出 offers，避免與頁面「請洽詢」不一致） */
  showPrice?: boolean;
  /** 麵包屑（依序由淺到深，不含站台首頁；首頁會自動加在最前） */
  breadcrumbs?: Array<{ name: string; url: string }>;
  /**
   * AEO 常見問題（→ @graph 的 `FAQPage`）。
   * answer 必須是「純文字」：本元件會剝除標籤再做 HTML 跳脫，
   * 避免 `</script>` 之類的字串把 JSON-LD 的 <script> 提前關閉。
   */
  faq?: FaqItem[];
  /**
   * 答案摘要（DB 的 answer_summary）→ `Article.abstract` / `Course.abstract`。
   * 未提供時退回 description，讓生成式搜尋引擎至少有一句可引用的摘要。
   */
  abstract?: string;
  /** 課程適用程度（→ `Course.educationalLevel`，例如「初階」/「進階」） */
  educationalLevel?: string;
  /**
   * 教練證照名稱（→ `Person.hasCredential`，每項包成
   * `EducationalOccupationalCredential`）。由 /about 的證照清單傳入。
   */
  credentials?: string[];
}

/** 預設網站資訊（依語言切換） */
const SITE_NAME_ZH = "阿倫教官 | Coach Aaron";
const SITE_NAME_EN = "Coach Aaron";
/** 品牌名（JSON-LD provider / author fallback 用） */
const BRAND_NAME_ZH = "阿倫教官";
const BRAND_NAME_EN = "Coach Aaron";
// ⚠️ 本站為純 B2B（服務對象是健身教練同業，非一般健身會員），
//    預設描述不得再出現「一對一訓練」等 B2C 服務字眼。
const DESCRIPTION_ZH =
  "阿倫教官｜私教變現顧問、教練職涯培訓講師。給私人教練的商業實戰培訓：銷售心理學、體驗課成交、續約經營與個人品牌，把專業變成穩定收入。";
const DESCRIPTION_EN =
  "Coach Aaron — business coach and career educator for personal trainers. Practical training in sales psychology, converting trial sessions, client retention and personal branding, so you can turn your coaching expertise into reliable income.";
const DEFAULT_IMAGE = "/images/og-default.jpg";

/**
 * 品牌 logo（JSON-LD 用）
 * 需為可直接抓取的點陣圖；Google 建議至少 112×112，這裡用 512×512 的 PWA icon。
 * 對應檔案：public/icons/icon-512.png
 */
const BRAND_LOGO_PATH = "/icons/icon-512.png";
const BRAND_LOGO_SIZE = 512;

/** 教練本人的職稱（Person.jobTitle） */
const JOB_TITLE_ZH = "私教變現顧問・銷售心理學講師";
const JOB_TITLE_EN =
  "Business coach for personal trainers & sales psychology trainer";
/**
 * 教練的社群（Person / Organization 的 sameAs）
 *
 * 只列「同一個實體在其他平台的官方帳號」——Google 靠這組連結把本站的
 * Person 與站外的頻道／節目收斂成同一個知識圖譜節點。
 * 網址一律取自 `@/constants` 既有定義（勿在此另寫新網址，避免兩處不同步）。
 */
const SAME_AS = [
  "https://www.instagram.com/coach.luen/",
  SOCIAL_LINKS.YOUTUBE,
  SOCIAL_LINKS.PODCAST,
  SOCIAL_LINKS.NOTION,
  SOCIAL_LINKS.LINE_OFFICIAL,
];

/**
 * 教練的專業領域（Person.knowsAbout）
 *
 * AEO/GEO 用途：讓「私人教練怎麼續約」這類問句式查詢能把本站認成主題權威。
 * 一律是 B2B 題目（服務對象是教練同業），不得出現 B2C 的訓練服務字眼。
 */
const KNOWS_ABOUT_ZH = [
  "私人教練銷售",
  "健身教練續約",
  "銷售心理學",
  "皮拉提斯銷售",
  "教練個人品牌",
];
const KNOWS_ABOUT_EN = [
  "Personal trainer sales",
  "Client retention for fitness coaches",
  "Sales psychology",
  "Pilates sales",
  "Personal branding for coaches",
];

/**
 * 把可能含 HTML 的字串轉成「可安全放進 JSON-LD 的純文字」
 *
 * 兩段處理各有必要：
 *   1. 剝標籤 + 還原常見實體 → FAQPage 的 Question/Answer 必須是純文字，
 *      Google 的 rich result 測試會把殘留標籤當成無效內容。
 *   2. 再次跳脫 `& < >` → JSON-LD 寫在 <script> 內，字串裡若出現
 *      `</script>` 會被瀏覽器當成結束標籤，整段結構化資料連同後續 HTML
 *      一起壞掉（JSON.stringify 不會處理這件事，它只管 JSON 合法）。
 *
 * @param value 原始字串（可能是後台編輯器產出的 HTML 片段）
 * @returns 單行純文字；空字串表示無內容
 */
function toPlainText(value: string): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
  description: descriptionProp,
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
  titleTemplate = true,
  person = false,
  price,
  showPrice = true,
  breadcrumbs,
  faq,
  abstract: abstractProp,
  educationalLevel,
  credentials,
}) => {
  // 依語言切換站台預設值（頁面未傳 description 時的 fallback、品牌名、og:locale）
  const { language } = useLanguage();
  const isEn = language === "en";
  const DEFAULT_SITE_NAME = isEn ? SITE_NAME_EN : SITE_NAME_ZH;
  const BRAND_NAME = isEn ? BRAND_NAME_EN : BRAND_NAME_ZH;
  const description = descriptionProp ?? (isEn ? DESCRIPTION_EN : DESCRIPTION_ZH);
  const ogLocale = isEn ? "en_US" : "zh_TW";
  const htmlLang = isEn ? "en" : "zh-TW";
  const homeCrumb = isEn ? "Home" : "首頁";

  // 組合完整標題
  // 後綴只放單一品牌名（中文「阿倫教官」／英文「Coach Aaron」）——
  // 舊版接的是 `阿倫教官 | Coach Aaron`，首頁標題會長到被搜尋結果截斷。
  // titleTemplate=false：頁面自備完整標題（首頁），原樣輸出。
  const fullTitle = title
    ? titleTemplate
      ? `${title} | ${BRAND_NAME}`
      : title
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

    // 全站共用 @id：首頁與 /about 指向同一個 Person / Organization 實體，
    // Google 才會把兩頁的資訊合併成同一個知識圖譜節點（而非兩個同名的人）
    const ORGANIZATION_ID = `${DEFAULT_URL}/#organization`;
    const PERSON_ID = `${DEFAULT_URL}/about#person`;
    const WEBSITE_ID = `${DEFAULT_URL}/#website`;

    /** 教練本人（首頁與 /about 共用同一份資料） */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const personEntity = (withImage: boolean): Record<string, any> => ({
      "@type": "Person",
      "@id": PERSON_ID,
      name: BRAND_NAME,
      alternateName: isEn ? BRAND_NAME_ZH : BRAND_NAME_EN,
      url: `${DEFAULT_URL}/about`,
      jobTitle: isEn ? JOB_TITLE_EN : JOB_TITLE_ZH,
      sameAs: SAME_AS,
      knowsAbout: isEn ? KNOWS_ABOUT_EN : KNOWS_ABOUT_ZH,
      // 證照：頁面沒傳就整個欄位不輸出（空陣列會被 Google 當成無效值）
      ...(credentials && credentials.length > 0
        ? {
            hasCredential: credentials.map((name) => ({
              "@type": "EducationalOccupationalCredential",
              name,
            })),
          }
        : {}),
      // 只有頁面明確給了圖片才當人物照（否則會把通用 OG 圖當成本人照片）
      ...(withImage ? { image: fullImage } : {}),
    });

    // Organization / WebSite / Person：只在首頁輸出一次，作為全站的品牌實體
    // （用 url prop 顯式判斷，不能只看 fullUrl —— 沒傳 url 的頁面
    //   其 fullUrl 也會等於站台根，會誤判成首頁）
    const isHome =
      url === "/" || url === DEFAULT_URL || url === `${DEFAULT_URL}/`;
    if (isHome) {
      graph.push({
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: BRAND_NAME,
        alternateName: isEn ? BRAND_NAME_ZH : BRAND_NAME_EN,
        url: DEFAULT_URL,
        logo: {
          "@type": "ImageObject",
          url: `${DEFAULT_URL}${BRAND_LOGO_PATH}`,
          width: BRAND_LOGO_SIZE,
          height: BRAND_LOGO_SIZE,
        },
        description,
        sameAs: SAME_AS,
        // 一人公司：創辦人即教練本人（同 @graph 內的 Person）
        founder: { "@id": PERSON_ID },
      });
      graph.push({
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: DEFAULT_SITE_NAME,
        url: DEFAULT_URL,
        inLanguage: htmlLang,
        publisher: { "@id": ORGANIZATION_ID },
      });
      graph.push(personEntity(false));
    } else if (person) {
      // /about：同一份 Person（同 @id），頁面若有給 image 就一併輸出
      graph.push(personEntity(Boolean(image) && image !== DEFAULT_IMAGE));
    }

    if (isArticle) {
      graph.push({
        "@type": "Article",
        headline: title || DEFAULT_SITE_NAME,
        description,
        image: fullImage,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        // author 用全站共用的 Person @id（而非每頁一個同名的新實體），
        // 文章的作者署名才會累積到教練本人這個節點上。
        // name 固定用品牌名：本站是單一作者站，DB 的作者顯示名（例如後台帳號暱稱）
        // 與 @id 指向的實體不一致時，會讓結構化資料自相矛盾（正式站實測出現「恩123」）。
        // 頁面上的署名仍照 author prop 顯示，不受影響。
        author: {
          "@type": "Person",
          "@id": PERSON_ID,
          name: BRAND_NAME,
        },
        publisher: {
          "@type": "Organization",
          name: DEFAULT_SITE_NAME,
          logo: { "@type": "ImageObject", url: `${DEFAULT_URL}${BRAND_LOGO_PATH}` },
        },
        url: fullUrl,
        articleSection: category,
        keywords: keywords.join(", "),
        // AEO：abstract 給生成式引擎一句可直接引用的摘要（退回 description）
        abstract: abstractProp || description,
        inLanguage: htmlLang,
        // 文章全文免費可讀，沒有付費牆（Google 會據此決定是否完整索引）
        isAccessibleForFree: true,
        mainEntityOfPage: fullUrl,
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
        // provider 指向全站共用的 Person @id（與 /about、文章作者同一節點）
        provider: {
          "@type": "Person",
          "@id": PERSON_ID,
          name: BRAND_NAME,
        },
        abstract: abstractProp || description,
        inLanguage: htmlLang,
      };
      if (educationalLevel) course.educationalLevel = educationalLevel;
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

    // FAQPage：文章／課程的常見問答（AEO 的主力——問句式查詢直接命中）
    // 同一頁最多一個 FAQPage 實體，`@id` 帶 #faq 以免與頁面主實體撞號。
    if (faq && faq.length > 0) {
      const questions = faq
        .map((item) => ({
          question: toPlainText(item?.question || ""),
          answer: toPlainText(item?.answer || ""),
        }))
        .filter((item) => item.question && item.answer);
      if (questions.length > 0) {
        graph.push({
          "@type": "FAQPage",
          "@id": `${fullUrl}#faq`,
          inLanguage: htmlLang,
          mainEntity: questions.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        });
      }
    }

    // BreadcrumbList
    if (breadcrumbs && breadcrumbs.length > 0) {
      const items = [{ name: homeCrumb, url: "/" }, ...breadcrumbs];
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
      {/* 語言（a11y + 搜尋引擎判讀頁面語言） */}
      <html lang={htmlLang} />

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
      <meta property="og:locale" content={ogLocale} />

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
