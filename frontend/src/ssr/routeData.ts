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

/** slug/id 只允許安全字元，避免把任意字串拼進 API URL */
const SAFE_PARAM = /^[A-Za-z0-9._~-]{1,200}$/;

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

  // /articles/:slug
  if (segments.length === 2 && segments[0] === "articles") {
    const slug = segments[1];
    if (!SAFE_PARAM.test(slug)) return [];
    return [
      {
        key: dataKeys.article(slug),
        path: `/api/articles/${encodeURIComponent(slug)}`,
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
    const id = segments[1];
    if (!SAFE_PARAM.test(id)) return [];
    return [
      {
        key: dataKeys.course(id),
        path: `/api/courses/${encodeURIComponent(id)}`,
      },
    ];
  }

  // /lessons
  if (segments.length === 1 && segments[0] === "lessons") {
    return [{ key: dataKeys.lessonsList(), path: "/api/lessons" }];
  }

  // /lessons/:id
  if (segments.length === 2 && segments[0] === "lessons") {
    const id = segments[1];
    if (!SAFE_PARAM.test(id)) return [];
    return [
      {
        key: dataKeys.lesson(id),
        path: `/api/lessons/${encodeURIComponent(id)}`,
      },
    ];
  }

  // /page/:slug（Landing Page）
  if (segments.length === 2 && segments[0] === "page") {
    const slug = segments[1];
    if (!SAFE_PARAM.test(slug)) return [];
    return [
      {
        key: dataKeys.landing(slug),
        path: `/api/landing/projects/slug/${encodeURIComponent(slug)}`,
      },
    ];
  }

  return [];
}
