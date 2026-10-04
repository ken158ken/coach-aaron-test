/**
 * 路由 → 資料需求對應表（同構）
 * @module ssr/routeData
 *
 * @description
 * 單一事實來源：SSR 端依此表決定要預抓哪些 API，
 * 頁面元件則用同一組 key builder 去 `getInitialData()`，
 * 保證伺服器寫入的 key 與客戶端讀取的 key 永遠一致。
 */

/** 一筆預抓需求 */
export interface PrefetchSpec {
  /** 存進 `__INITIAL_DATA__` 的鍵 */
  key: string;
  /** 相對 API 路徑（會接在 apiBase 之後） */
  path: string;
  /** 標註用途：此筆屬次要資料（目前 prefetch 對所有 spec 一視同仁——
   *  任何一筆失敗都只是該 key 缺席、不會擋 SSR；此欄位僅供閱讀者理解優先序） */
  optional?: boolean;
  /**
   * 此筆是「本路由的主實體」（詳情頁的文章 / 課程 / 影片 / LP 本體）。
   *
   * 只有 primary 的請求收到 **HTTP 404** 時，prefetch 才會標記
   * `__notFound`，讓 `api/ssr.js` 回 HTTP 404（修正軟 404）。
   * 逾時 / 5xx / 非 JSON 一律不標記 —— 維持優雅降級，絕不把暫時性故障
   * 變成讓 Google 刪索引的 404。
   */
  primary?: boolean;
  /** 單筆逾時（毫秒）；未設定時用 prefetch options 的全域 timeoutMs */
  timeoutMs?: number;
}

// ── key builders（頁面元件與 SSR 共用） ──────────────────────

export const dataKeys = {
  article: (slug: string) => `article:${slug}`,
  /** 文章詳情頁側欄「熱門文章」 */
  articlesPopular: () => "articles:popular",
  /** 文章列表頁第一頁、未篩選分類 */
  articlesList: () => "articles:list:p1",
  /**
   * 分類主題頁 /articles/topic/:category
   * key 帶「解碼後」的原始分類 slug（sales / mindset / retention），
   * 與頁面端 useParams + decodeURIComponent 的結果一致。
   */
  articlesByCategory: (category: string) => `articles:category:${category}`,
  course: (id: string | number) => `course:${id}`,
  coursesList: () => "courses:list",
  lesson: (id: string | number) => `lesson:${id}`,
  lessonsList: () => "lessons:list",
  landing: (slug: string) => `landing:${slug}`,
  /** 首頁：site_content 全站文案 key-value map */
  siteContent: () => "content:site",
  /** 首頁：學員見證 slides */
  testimonials: () => "slides:testimonials",
  /** 首頁：學員見證輪播設定 */
  testimonialsConfig: () => "slides:testimonials:config",
  /** 首頁：Moments 相片牆 slides */
  gallery: () => "slides:gallery",
  /** 首頁：Credentials 跑馬燈項目 */
  marquee: () => "marquee:list",
};

// ── 路由比對 ────────────────────────────────────────────────

/** 去掉 query string / hash 與結尾斜線 */
function normalizePath(url: string): string {
  const withoutHash = url.split("#")[0];
  const pathname = withoutHash.split("?")[0];
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

/** 不得出現在單一 path segment 的字元（控制字元與路徑/查詢分隔符） */
// eslint-disable-next-line no-control-regex
const UNSAFE_PARAM_CHARS = /[\u0000-\u001f\u007f/?#&]/;

/**
 * 解碼並驗證單一路由參數（slug / id）
 *
 * req.url 的 segment 是百分比編碼過的（中文 slug 會是 `%E4%B8%AD`），
 * 必須先 decode 再由呼叫端 `encodeURIComponent()` 重新編碼，否則會雙重編碼。
 * 回傳 null 表示不安全/異常，呼叫端應放棄預抓（不等於 404）。
 *
 * @param raw 原始（可能已百分比編碼的）segment
 * @returns 解碼後的參數，或 null
 */
function decodeParam(raw: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded || decoded.length > 200) return null;
  if (UNSAFE_PARAM_CHARS.test(decoded)) return null;
  return decoded;
}

/**
 * 依 URL 取得該路由需要預抓的資料清單
 *
 * @param url 請求 URL（可含 query string）
 * @returns 預抓需求清單；不需要預抓的路由回傳空陣列
 */
export function getPrefetchSpecs(url: string): PrefetchSpec[] {
  const pathname = normalizePath(url || "/");

  // 後台 / 登入後頁面一律不預抓
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/member") ||
    pathname.startsWith("/dashboard")
  ) {
    return [];
  }

  const segments = pathname.split("/").filter(Boolean);

  // / （首頁）— 各 section 的資料全部預抓，SSR HTML 才有真實內容
  //   courses 為主要內容（ServicesSection）；其餘缺席時各元件有寫死的
  //   fallback 或骨架，故標 optional 並給較短逾時（3000ms），
  //   避免次要 API 偶發變慢時拖長整頁 TTFB（客端 mount 後仍會補抓）
  if (segments.length === 0) {
    const OPTIONAL_TIMEOUT_MS = 3000;
    return [
      { key: dataKeys.coursesList(), path: "/api/courses" },
      {
        key: dataKeys.siteContent(),
        path: "/api/content",
        optional: true,
        timeoutMs: OPTIONAL_TIMEOUT_MS,
      },
      {
        key: dataKeys.testimonials(),
        path: "/api/slides/testimonials",
        optional: true,
        timeoutMs: OPTIONAL_TIMEOUT_MS,
      },
      {
        key: dataKeys.testimonialsConfig(),
        path: "/api/slides/testimonials/config",
        optional: true,
        timeoutMs: OPTIONAL_TIMEOUT_MS,
      },
      {
        key: dataKeys.gallery(),
        path: "/api/slides/gallery",
        optional: true,
        timeoutMs: OPTIONAL_TIMEOUT_MS,
      },
      {
        key: dataKeys.marquee(),
        path: "/api/marquee",
        optional: true,
        timeoutMs: OPTIONAL_TIMEOUT_MS,
      },
    ];
  }

  // /articles
  if (segments.length === 1 && segments[0] === "articles") {
    return [
      { key: dataKeys.articlesList(), path: "/api/articles?page=1&limit=9" },
    ];
  }

  // /articles/topic/:category（分類主題頁；category 是 DB 的 article_category
  // 原值 —— 目前是英文 slug sales / mindset / retention，顯示名稱由前端字典查表）
  if (
    segments.length === 3 &&
    segments[0] === "articles" &&
    segments[1] === "topic"
  ) {
    const category = decodeParam(segments[2]);
    if (!category) return [];
    return [
      {
        // 不標 primary：空分類不該回 HTTP 404（頁面自己 noIndex 即可），
        // 而且分類是使用者可拼出的任意字串，不宜當成「主實體不存在」。
        key: dataKeys.articlesByCategory(category),
        path: `/api/articles?category=${encodeURIComponent(category)}&limit=50`,
        optional: true,
      },
    ];
  }

  // /articles/:slug
  if (segments.length === 2 && segments[0] === "articles") {
    const slug = decodeParam(segments[1]);
    if (!slug) return [];
    return [
      {
        key: dataKeys.article(slug),
        path: `/api/articles/${encodeURIComponent(slug)}`,
        primary: true,
      },
      {
        key: dataKeys.articlesPopular(),
        path: "/api/articles?limit=12",
        optional: true,
      },
    ];
  }

  // /courses
  if (segments.length === 1 && segments[0] === "courses") {
    return [{ key: dataKeys.coursesList(), path: "/api/courses" }];
  }

  // /courses/:id
  if (segments.length === 2 && segments[0] === "courses") {
    const id = decodeParam(segments[1]);
    if (!id) return [];
    return [
      {
        key: dataKeys.course(id),
        path: `/api/courses/${encodeURIComponent(id)}`,
        primary: true,
      },
    ];
  }

  // /lessons
  if (segments.length === 1 && segments[0] === "lessons") {
    return [{ key: dataKeys.lessonsList(), path: "/api/lessons" }];
  }

  // /lessons/:id
  if (segments.length === 2 && segments[0] === "lessons") {
    const id = decodeParam(segments[1]);
    if (!id) return [];
    return [
      {
        key: dataKeys.lesson(id),
        path: `/api/lessons/${encodeURIComponent(id)}`,
        primary: true,
      },
    ];
  }

  // /page/:slug（Landing Page）
  if (segments.length === 2 && segments[0] === "page") {
    const slug = decodeParam(segments[1]);
    if (!slug) return [];
    return [
      {
        key: dataKeys.landing(slug),
        path: `/api/landing/projects/slug/${encodeURIComponent(slug)}`,
        primary: true,
      },
    ];
  }

  return [];
}
