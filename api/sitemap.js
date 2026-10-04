/**
 * 動態 sitemap.xml 產生器
 *
 * @module api/sitemap
 * @description
 *   路由：GET /sitemap.xml（由 vercel.json rewrite 指向本函式，必須排在 catch-all 之前）
 *
 *   為什麼用「動態產生」而非「建置時產生」：
 *   本站內容由後台 CMS 即時管理（articles / courses / lesson_videos / lp_projects
 *   皆可由非工程師在 /admin 編輯並立即生效）。若改為建置時輸出靜態檔，客戶每新增
 *   一篇文章都必須重新部署，sitemap 才會反映真實內容——這與現有「後台改完即時生效」
 *   的使用體驗衝突，也會快速消耗 Vercel 建置額度。動態產生 + 邊緣快取
 *   （s-maxage=3600）可兼顧即時性與效能：Google 一天抓不到幾次，成本可忽略。
 *
 *   直接打 Supabase REST API（PostgREST）而不經過 backend Express app，
 *   是為了讓本函式維持零 npm 依賴、冷啟動最快、且與後端部署解耦。
 *
 * 環境變數：
 *   SUPABASE_URL          — 必要
 *   SUPABASE_SERVICE_KEY  — 必要（繞過 RLS，只讀取已發布內容）
 *   SITE_URL              — 選用；未設定時依 Vercel 系統變數推導（見 resolveSiteUrl）
 */

/**
 * 解析網站正式網址（不含結尾斜線）
 *
 * 優先序：
 *   1. SITE_URL            — 明確設定，最高優先
 *   2. 正式環境的專案網域   — VERCEL_ENV=production 時用 VERCEL_PROJECT_PRODUCTION_URL
 *   3. 本次部署的網址       — VERCEL_URL（preview 部署）
 *   4. localhost           — 本機開發
 *
 * 刻意不寫死任何 *-test.vercel.app，避免正式站的 sitemap 指向測試站。
 *
 * @returns {string} 例如 "https://example.com"
 */
function resolveSiteUrl() {
  const explicit = process.env.SITE_URL || process.env.VITE_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:5173";
}

/**
 * 查詢 Supabase REST API
 *
 * @param {string} path - PostgREST 查詢路徑，例如 "articles?select=..."
 * @returns {Promise<Array<Record<string, unknown>>>} 查詢結果；失敗時回傳空陣列
 */
async function query(path) {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!baseUrl || !key) return [];

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error(`sitemap: Supabase ${res.status} for ${path}`);
      return [];
    }
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    console.error(`sitemap: query failed for ${path}:`, err.message);
    return [];
  }
}

/**
 * 將任意時間值正規化為 W3C Datetime（YYYY-MM-DD），無效則回傳 null
 *
 * @param {...unknown} candidates - 依優先序嘗試的時間值
 * @returns {string|null}
 */
function toLastmod(...candidates) {
  for (const value of candidates) {
    if (!value) continue;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * XML 字元逸出（slug 理論上安全，但仍防禦性處理）
 *
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 產生單一 <url> 節點
 *
 * @param {string} siteUrl
 * @param {{ path: string, lastmod?: string|null, changefreq?: string, priority?: string }} entry
 * @returns {string}
 */
function urlNode(siteUrl, entry) {
  const parts = [`    <loc>${escapeXml(siteUrl + entry.path)}</loc>`];
  if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq)
    parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority) parts.push(`    <priority>${entry.priority}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

/**
 * 取得一批資料列中「最新」的日期（YYYY-MM-DD），供列表頁的 <lastmod> 使用
 *
 * 用意：首頁與列表頁本身沒有 updated_at，但它們的內容會隨子項目變動；
 * 以「該類最新內容的更新日」當 lastmod，Google 才知道何時值得重抓。
 * 沒有任何有效日期時回傳 null（urlNode 會省略 <lastmod>）。
 *
 * @param {Array<Record<string, unknown>>} rows
 * @param {string[]} fields - 要比較的欄位（任一有效者都納入比較）
 * @returns {string|null} 例如 "2026-09-14"
 */
function newestLastmod(rows, fields) {
  let newest = null;
  for (const row of rows) {
    for (const field of fields) {
      const d = toLastmod(row[field]);
      // YYYY-MM-DD 的字典順序 == 時間順序，可直接比較字串
      if (d && (!newest || d > newest)) newest = d;
    }
  }
  return newest;
}

/**
 * 靜態（非資料庫驅動）的公開頁面
 *
 * `lastmodFrom` 標示該頁的 lastmod 要取自哪一類內容的最新更新時間
 * （首頁 "all" = 全部內容）；未標示者不輸出 <lastmod>
 * （/contact、/privacy、/terms 等純程式碼頁的改動時間在 git 裡，
 *   硬寫日期只會變成不準的雜訊）。
 *
 * 註：`/llms.txt` 與 `/llms-full.txt`（api/llms.js）刻意**不**列入 sitemap——
 * sitemap 是「可索引的 HTML 網頁」清單，放純文字檔只會讓 Search Console 報
 * 「已擷取但未索引」的雜訊。那兩個檔的入口是 robots.txt 的註解與慣例路徑。
 *
 * 註：/about 路由確實存在（App.tsx 的 `/about` → pages/About.tsx，頁面有
 * SEOHead 與完整文案），故納入。此處只列「公開且有索引價值」的路由；
 * 登入後頁面（/member、/dashboard、/checkout、/booking、/my-bookings、
 * /chat、/notifications、/coach、/notes）與 /login、/register、/admin 皆不列入。
 */
const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0", lastmodFrom: "all" },
  {
    path: "/courses",
    changefreq: "weekly",
    priority: "0.9",
    lastmodFrom: "courses",
  },
  {
    path: "/articles",
    changefreq: "daily",
    priority: "0.9",
    lastmodFrom: "articles",
  },
  {
    path: "/lessons",
    changefreq: "weekly",
    priority: "0.7",
    lastmodFrom: "lessons",
  },
  { path: "/videos", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  {
    path: "/pages",
    changefreq: "monthly",
    priority: "0.4",
    lastmodFrom: "landing",
  },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

module.exports = async function handler(req, res) {
  const siteUrl = resolveSiteUrl();

  try {
    const [articles, courses, lessons, landingPages] = await Promise.all([
      query(
        "articles?select=article_id,article_slug,article_category,updated_at,published_at" +
          "&status=eq.published&deleted_at=is.null",
      ),
      query(
        "courses?select=course_id,updated_at,created_at" +
          "&status=eq.published&deleted_at=is.null",
      ),
      query(
        "lesson_videos?select=id,updated_at,created_at" +
          "&is_published=eq.true&deleted_at=is.null",
      ),
      query(
        "lp_projects?select=custom_slug,updated_at,published_at" +
          "&status=eq.published&custom_slug=not.is.null",
      ),
    ]);

    // 各類內容的最新更新日 → 供首頁與列表頁的 <lastmod>
    const latest = {
      articles: newestLastmod(articles, ["updated_at", "published_at"]),
      courses: newestLastmod(courses, ["updated_at", "created_at"]),
      lessons: newestLastmod(lessons, ["updated_at", "created_at"]),
      landing: newestLastmod(landingPages, ["updated_at", "published_at"]),
    };
    latest.all = newestLastmod(
      [
        { d: latest.articles },
        { d: latest.courses },
        { d: latest.lessons },
        { d: latest.landing },
      ],
      ["d"],
    );

    /** @type {Array<{path: string, lastmod?: string|null, changefreq?: string, priority?: string}>} */
    const entries = STATIC_PAGES.map(({ lastmodFrom, ...page }) => ({
      ...page,
      lastmod: lastmodFrom ? latest[lastmodFrom] || null : null,
    }));

    // 文章：URL 使用 slug，缺 slug 時退回 id（與 Articles.tsx:163 的連結規則一致）
    for (const a of articles) {
      const key = a.article_slug || a.article_id;
      if (!key) continue;
      entries.push({
        path: `/articles/${key}`,
        lastmod: toLastmod(a.updated_at, a.published_at),
        changefreq: "monthly",
        priority: "0.8",
      });
    }

    // 主題分類頁：/articles/topic/{分類}
    //
    // 分類值是原始字串（正式站實際為英文 slug：sales / mindset / retention；
    // 顯示名稱由前端對應表決定），路由參數一律 encodeURIComponent。
    // 這裡用 Map 以原始值為 key 收集每個分類的「文章數」與「最新更新日」，
    // 讓 <lastmod> 反映該分類底下任一篇文章被改過的時間。
    // 只收 published 文章（上面的查詢已過濾）；且**至少 2 篇才列入** ——
    // 單篇分類（例如測試文帶的「訓練計畫,居家訓練」）會形成薄弱主題頁，
    // 頁面本身仍可開（不是 404），只是不主動送進索引。
    const MIN_ARTICLES_PER_TOPIC = 2;
    const categoryLatest = new Map();
    for (const a of articles) {
      const category = typeof a.article_category === "string" ? a.article_category.trim() : "";
      if (!category) continue;
      const d = toLastmod(a.updated_at, a.published_at);
      const prev = categoryLatest.get(category);
      if (!prev) {
        categoryLatest.set(category, { count: 1, lastmod: d || null });
      } else {
        prev.count += 1;
        if (d && (!prev.lastmod || d > prev.lastmod)) prev.lastmod = d;
      }
    }
    for (const [category, { count, lastmod }] of categoryLatest) {
      if (count < MIN_ARTICLES_PER_TOPIC) continue;
      entries.push({
        path: `/articles/topic/${encodeURIComponent(category)}`,
        lastmod,
        changefreq: "weekly",
        priority: "0.6",
      });
    }

    // 課程：URL 使用數字 course_id（CourseDetail.tsx 以 Number(id) 取用）
    for (const c of courses) {
      if (!c.course_id) continue;
      entries.push({
        path: `/courses/${c.course_id}`,
        lastmod: toLastmod(c.updated_at, c.created_at),
        changefreq: "weekly",
        priority: "0.8",
      });
    }

    // 課堂影片：URL 使用數字 id
    for (const l of lessons) {
      if (!l.id) continue;
      entries.push({
        path: `/lessons/${l.id}`,
        lastmod: toLastmod(l.updated_at, l.created_at),
        changefreq: "monthly",
        priority: "0.6",
      });
    }

    // Landing pages：status='published' 且有 custom_slug
    for (const p of landingPages) {
      if (!p.custom_slug) continue;
      entries.push({
        path: `/page/${p.custom_slug}`,
        lastmod: toLastmod(p.updated_at, p.published_at),
        changefreq: "monthly",
        priority: "0.7",
      });
    }

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      entries.map((e) => urlNode(siteUrl, e)).join("\n") +
      "\n</urlset>\n";

    console.log(`✅ sitemap: ${entries.length} URLs for ${siteUrl}`);

    res
      .status(200)
      .setHeader("Content-Type", "application/xml; charset=utf-8")
      .setHeader(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=86400",
      )
      .end(xml);
  } catch (err) {
    console.error("❌ sitemap 產生失敗:", err);
    // 刻意回 500 而非「200 + 空 sitemap」：
    // 空 sitemap 會讓 Google 以為所有頁面都被移除，5xx 則會讓它稍後重試。
    res
      .status(500)
      .setHeader("Content-Type", "text/plain; charset=utf-8")
      .end("sitemap generation failed");
  }
};
