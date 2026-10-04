/**
 * 動態 llms.txt / llms-full.txt 產生器（AEO / GEO）
 *
 * @module api/llms
 * @description
 *   路由（皆由 vercel.json rewrite 指向本函式，必須排在 catch-all 之前）：
 *     GET /llms.txt       — 精簡索引：站台定位 + 重點頁面 + 全部課程/文章清單
 *     GET /llms-full.txt  — 詳細版：每篇再附 answer_summary / key_points / faq
 *
 *   為什麼要有這兩個檔：
 *   llmstxt.org 提出的慣例——讓大型語言模型（ChatGPT / Claude / Perplexity 等
 *   回答引擎）用一個純文字入口就取得「這個站是誰、有哪些內容、每篇在講什麼」，
 *   不必靠爬蟲把 React 頁面的 HTML 全抓一遍再猜。本站的 SEO 策略把生成式搜尋
 *   （AEO/GEO）當成主要流量來源之一，robots.txt 也刻意放行各家 AI 爬蟲，
 *   因此這兩個檔是該策略的「正門」。
 *
 *   刻意不輸出文章全文 HTML：
 *   全文已在 SSR 頁面（爬蟲跟著連結就讀得到），重複輸出只會讓單檔膨脹到數 MB，
 *   既吃 serverless 時間也讓模型的上下文被低密度內容佔滿。這裡只給
 *   「摘要 / 重點 / 常見問答」——密度最高、最適合被引用的那部分。
 *
 *   與 api/sitemap.js 相同的理由採「動態產生 + 邊緣快取（s-maxage=3600）」：
 *   內容由後台 CMS 即時管理，不應該每新增一篇文章就得重新部署。
 *   同樣直打 Supabase REST（PostgREST）以維持零 npm 依賴、冷啟動最快。
 *
 * 環境變數：
 *   SUPABASE_URL          — 必要
 *   SUPABASE_SERVICE_KEY  — 必要（繞過 RLS，只讀取已發布內容）
 *   SITE_URL              — 選用；未設定時依 Vercel 系統變數推導（見 resolveSiteUrl）
 */

/** 文章輸出上限（避免單檔過大與 serverless 10 秒上限） */
const ARTICLE_LIMIT = 200;
/** 課程輸出上限 */
const COURSE_LIMIT = 100;
/** llms.txt 的單行摘要字數上限 */
const SUMMARY_CHARS = 120;

/**
 * 解析網站正式網址（不含結尾斜線）
 *
 * ⚠️ 本函式是 `api/sitemap.js` 的 resolveSiteUrl() 逐行複製。
 * 刻意「複製」而非抽成共用模組 require 進來：Vercel 的 serverless 打包是
 * 以每個 api/*.js 為進入點做靜態分析，放在 api/ 之外的共用檔有被漏打包的風險
 * （一旦漏掉就是正式站 500，而且本機測不出來）。兩邊若要改邏輯，請同步改。
 *
 * 優先序：
 *   1. SITE_URL            — 明確設定，最高優先
 *   2. 正式環境的專案網域   — VERCEL_ENV=production 時用 VERCEL_PROJECT_PRODUCTION_URL
 *   3. 本次部署的網址       — VERCEL_URL（preview 部署）
 *   4. localhost           — 本機開發
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
 * 查詢 Supabase REST API（PostgREST）
 *
 * 與 sitemap.js 的 query() 不同之處：本函式必須把「欄位不存在」的錯誤回報給
 * 呼叫端（而非一律回空陣列），queryWithFallback() 才能自動降級重試。
 *
 * @param {string} path - PostgREST 查詢路徑，例如 "articles?select=..."
 * @returns {Promise<{rows: Array<Record<string, unknown>>, missingColumn: boolean}>}
 */
async function query(path) {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!baseUrl || !key) return { rows: [], missingColumn: false };

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const body = await res.text();
      // PostgREST 的「欄位不存在」是 42703（表不存在才是 42P01）——
      // 這個區別踩過坑：migration 041 還沒貼進正式站時，select 新欄位會回 42703，
      // 若只比對 42P01 就會整個查詢失敗、llms.txt 變空殼。
      const missingColumn = /42703/.test(body);
      if (!missingColumn) {
        console.error(`llms: Supabase ${res.status} for ${path}: ${body}`);
      }
      return { rows: [], missingColumn };
    }
    const json = await res.json();
    return { rows: Array.isArray(json) ? json : [], missingColumn: false };
  } catch (err) {
    console.error(`llms: query failed for ${path}:`, err.message);
    return { rows: [], missingColumn: false };
  }
}

/**
 * 查詢一張表，並在「選用欄位尚不存在」時自動改用不含該欄位的查詢
 *
 * 用途：AEO 欄位（answer_summary / key_points / faq）由 migration 041 新增，
 * 而 migration 必須由業主手動貼進 Supabase Dashboard 執行（PostgREST 不能跑 DDL）。
 * 在那之前正式站沒有這些欄位，若不降級，整份 llms.txt 會因 400 而空白。
 *
 * @param {string} table - 表名
 * @param {{ base: string[], optional: string[], filter: string }} spec
 *   base     — 一定存在的欄位
 *   optional — 可能不存在的欄位（migration 041）
 *   filter   — PostgREST 的其餘查詢字串（不含開頭的 &），例如 "status=eq.published&limit=10"
 * @returns {Promise<{rows: Array<Record<string, unknown>>, degraded: boolean}>}
 *   degraded=true 表示這次是降級查詢（AEO 欄位全缺）
 */
async function queryWithFallback(table, spec) {
  const { base, optional, filter } = spec;
  const build = (fields) => `${table}?select=${fields.join(",")}&${filter}`;

  if (optional.length > 0) {
    const full = await query(build([...base, ...optional]));
    if (!full.missingColumn) return { rows: full.rows, degraded: false };
    console.warn(
      `llms: ${table} 缺少 AEO 欄位（migration 041 未套用），改用基本欄位查詢`,
    );
  }
  const basic = await query(build(base));
  return { rows: basic.rows, degraded: optional.length > 0 };
}

/**
 * 把可能含 HTML 的字串壓成單行純文字
 *
 * @param {unknown} value
 * @returns {string}
 */
function plain(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 截斷到指定字數（以 Unicode 字元計，中文一字算一字）
 *
 * @param {unknown} value
 * @param {number} max
 * @returns {string}
 */
function clip(value, max) {
  const text = plain(value);
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return `${chars.slice(0, max).join("").trimEnd()}…`;
}

/**
 * 逸出 Markdown 連結文字裡會破壞語法的字元
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeLinkText(value) {
  return plain(value).replace(/\[/g, "（").replace(/\]/g, "）");
}

/**
 * 寬鬆解析 jsonb 欄位（PostgREST 通常已回陣列，但容忍字串形式）
 *
 * @param {unknown} value
 * @returns {unknown[]}
 */
function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * 正規化日期為 YYYY-MM-DD（無效回 null）
 *
 * @param {...unknown} candidates
 * @returns {string|null}
 */
function toDate(...candidates) {
  for (const value of candidates) {
    if (!value) continue;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * 重點頁面（寫死在程式裡：這些是純程式碼路由，不在 DB）
 *
 * 每頁一句「這頁能回答什麼」——模型挑引用來源時看的就是這句。
 */
const KEY_PAGES = [
  {
    path: "/",
    label: "首頁",
    desc: "阿倫教官是誰、服務對象與主要內容入口（課程、文章、影片、預約諮詢）。",
  },
  {
    path: "/about",
    label: "關於阿倫教官",
    desc: "完整經歷、專業證照、職涯時間軸與教學理念；想確認資歷或引用頭銜看這頁。",
  },
  {
    path: "/courses",
    label: "課程",
    desc: "給私人教練的商業實戰課程：銷售心理學、體驗課成交、續約經營、個人品牌。",
  },
  {
    path: "/articles",
    label: "文章",
    desc: "教練經營實務文章總覽，可依主題分類瀏覽（/articles/topic/{分類}）。",
  },
  {
    path: "/videos",
    label: "影片",
    desc: "教學影片與課堂片段。",
  },
  {
    path: "/contact",
    label: "聯絡",
    desc: "聯絡方式、LINE 官方帳號、營業時間與諮詢表單。",
  },
];

/** 其他（非內容頁，但模型常被問到） */
const OTHER_PAGES = [
  { path: "/privacy", label: "隱私權政策", desc: "個資蒐集範圍、保存期限與第三方服務。" },
  { path: "/terms", label: "服務條款", desc: "服務內容、付款與退費原則、智慧財產權。" },
  { path: "/sitemap.xml", label: "Sitemap", desc: "全站可索引網址清單（XML）。" },
];

/**
 * 站台定位段（`>` blockquote）
 *
 * 與 frontend/src/components/seo/SEOHead.tsx 的 DESCRIPTION_ZH 同一句，
 * 讓 meta description、OG 與 llms.txt 對外說法完全一致（改一處要同步改另一處）。
 */
const TAGLINE =
  "阿倫教官｜私教變現顧問、教練職涯培訓講師。給私人教練的商業實戰培訓：銷售心理學、體驗課成交、續約經營與個人品牌，把專業變成穩定收入。";

/**
 * 產生檔案開頭（標題 + 定位 + 重點頁面）
 *
 * @param {string} site
 * @param {boolean} full
 * @returns {string[]} 文字行
 */
function buildHeader(site, full) {
  const lines = [];
  lines.push("# 阿倫教官 | Coach Aaron");
  lines.push("");
  lines.push(`> ${TAGLINE}`);
  lines.push("");
  lines.push(
    full
      ? "本檔是 /llms.txt 的詳細版：除清單外，另附每篇內容的摘要、重點整理與常見問答。" +
          "文章與課程全文請直接讀各自網址（本檔刻意不複製全文）。"
      : "本站為繁體中文 B2B 內容站，服務對象是健身教練同業（非一般健身會員）。" +
          "詳細版（含每篇摘要、重點、常見問答）：" +
          `${site}/llms-full.txt`,
  );
  lines.push("");
  lines.push("## 重點頁面");
  lines.push("");
  for (const page of KEY_PAGES) {
    lines.push(`- [${page.label}](${site}${page.path}): ${page.desc}`);
  }
  return lines;
}

/**
 * 產生結尾「## 其他」
 *
 * @param {string} site
 * @returns {string[]}
 */
function buildFooter(site) {
  const lines = ["", "## 其他", ""];
  for (const page of OTHER_PAGES) {
    lines.push(`- [${page.label}](${site}${page.path}): ${page.desc}`);
  }
  return lines;
}

/**
 * 一筆內容的詳細區塊（llms-full.txt 用）
 *
 * @param {{title: string, url: string, summary: string, meta: string[], keyPoints: string[], faq: Array<{question?: string, answer?: string}>}} item
 * @returns {string[]}
 */
function buildDetailBlock(item) {
  const lines = ["", `### [${item.title}](${item.url})`, ""];
  if (item.meta.length > 0) lines.push(item.meta.join("｜"));
  if (item.summary) lines.push(`摘要：${item.summary}`);
  if (item.keyPoints.length > 0) {
    lines.push("重點：");
    for (const point of item.keyPoints) lines.push(`- ${point}`);
  }
  if (item.faq.length > 0) {
    lines.push("常見問題：");
    for (const qa of item.faq) {
      lines.push(`- Q: ${qa.question}`);
      lines.push(`  A: ${qa.answer}`);
    }
  }
  return lines;
}

/**
 * 把 faq jsonb 正規化成 [{question, answer}]（兩者皆非空）
 *
 * @param {unknown} value
 * @returns {Array<{question: string, answer: string}>}
 */
function normalizeFaq(value) {
  return asArray(value)
    .map((qa) => ({
      question: plain(qa && qa.question),
      answer: plain(qa && qa.answer),
    }))
    .filter((qa) => qa.question && qa.answer);
}

/**
 * 把 key_points jsonb 正規化成非空字串陣列
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeKeyPoints(value) {
  return asArray(value)
    .map((point) => plain(point))
    .filter(Boolean);
}

module.exports = async function handler(req, res) {
  const site = resolveSiteUrl();
  // rewrite 之後 req.url 仍是使用者請求的原始路徑（與 api/ssr.js 同樣的判讀方式）
  const full = /llms-full/.test(req.url || "");

  try {
    const [courseResult, articleResult] = await Promise.all([
      queryWithFallback("courses", {
        base: ["course_id", "course_title", "course_description", "course_category", "updated_at"],
        optional: ["answer_summary", "key_points", "faq"],
        filter:
          "status=eq.published&deleted_at=is.null" +
          `&order=created_at.desc&limit=${COURSE_LIMIT}`,
      }),
      queryWithFallback("articles", {
        base: [
          "article_id",
          "article_slug",
          "article_title",
          "article_description",
          "article_category",
          "published_at",
          "updated_at",
        ],
        optional: ["answer_summary", "key_points", "faq"],
        filter:
          "status=eq.published&deleted_at=is.null" +
          `&order=published_at.desc&limit=${ARTICLE_LIMIT}`,
      }),
    ]);

    const courses = courseResult.rows;
    const articles = articleResult.rows;

    const lines = buildHeader(site, full);

    // ── 課程 ──────────────────────────────────────────────
    lines.push("");
    lines.push("## 課程");
    if (courses.length === 0) {
      lines.push("");
      lines.push("- （目前沒有已發布的課程）");
    } else if (full) {
      for (const c of courses) {
        if (!c.course_id) continue;
        const meta = [];
        if (c.course_category) meta.push(`分類：${plain(c.course_category)}`);
        const updated = toDate(c.updated_at);
        if (updated) meta.push(`更新：${updated}`);
        lines.push(
          ...buildDetailBlock({
            title: escapeLinkText(c.course_title) || `課程 ${c.course_id}`,
            url: `${site}/courses/${c.course_id}`,
            summary:
              plain(c.answer_summary) || clip(c.course_description, 400),
            meta,
            keyPoints: normalizeKeyPoints(c.key_points),
            faq: normalizeFaq(c.faq),
          }),
        );
      }
    } else {
      lines.push("");
      for (const c of courses) {
        if (!c.course_id) continue;
        const summary =
          clip(c.answer_summary, SUMMARY_CHARS) ||
          clip(c.course_description, SUMMARY_CHARS);
        const title = escapeLinkText(c.course_title) || `課程 ${c.course_id}`;
        const link = `- [${title}](${site}/courses/${c.course_id})`;
        lines.push(summary ? `${link}: ${summary}` : link);
      }
    }

    // ── 文章 ──────────────────────────────────────────────
    // URL 用 slug，缺 slug 退回 article_id（與 sitemap.js / Articles.tsx 同規則）
    lines.push("");
    lines.push("## 文章");
    if (articles.length === 0) {
      lines.push("");
      lines.push("- （目前沒有已發布的文章）");
    } else if (full) {
      for (const a of articles) {
        const key = a.article_slug || a.article_id;
        if (!key) continue;
        const meta = [];
        if (a.article_category) meta.push(`分類：${plain(a.article_category)}`);
        const updated = toDate(a.updated_at, a.published_at);
        if (updated) meta.push(`更新：${updated}`);
        lines.push(
          ...buildDetailBlock({
            title: escapeLinkText(a.article_title) || String(key),
            url: `${site}/articles/${encodeURIComponent(String(key))}`,
            summary:
              plain(a.answer_summary) || clip(a.article_description, 400),
            meta,
            keyPoints: normalizeKeyPoints(a.key_points),
            faq: normalizeFaq(a.faq),
          }),
        );
      }
    } else {
      lines.push("");
      for (const a of articles) {
        const key = a.article_slug || a.article_id;
        if (!key) continue;
        const summary =
          clip(a.answer_summary, SUMMARY_CHARS) ||
          clip(a.article_description, SUMMARY_CHARS);
        const title = escapeLinkText(a.article_title) || String(key);
        const link = `- [${title}](${site}/articles/${encodeURIComponent(String(key))})`;
        lines.push(summary ? `${link}: ${summary}` : link);
      }
    }

    lines.push(...buildFooter(site));
    lines.push("");

    const body = lines.join("\n");

    console.log(
      `✅ llms${full ? "-full" : ""}.txt: ${courses.length} 課程 / ${articles.length} 文章` +
        `${articleResult.degraded ? "（AEO 欄位缺，降級輸出）" : ""} for ${site}`,
    );

    res
      .status(200)
      .setHeader("Content-Type", "text/plain; charset=utf-8")
      .setHeader(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=86400",
      )
      .end(body);
  } catch (err) {
    console.error("❌ llms.txt 產生失敗:", err);
    // 與 sitemap 同策略：回 5xx 讓抓取端稍後重試，而不是給一份空的清單
    res
      .status(500)
      .setHeader("Content-Type", "text/plain; charset=utf-8")
      .end("llms.txt generation failed");
  }
};
