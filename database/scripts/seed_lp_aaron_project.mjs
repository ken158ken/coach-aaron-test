#!/usr/bin/env node
/**
 * seed_lp_aaron_project.mjs
 * ──────────────────────────────────────────────────────────
 * 冪等建立「阿倫指定版面」的【已發布專案】（lp_projects）。
 *
 * 為什麼需要這支：
 *   前一波只跑了 seed_lp_aaron_template.mjs，建立了 lp_templates(AARON_CONSULT_001,
 *   id=339) 與其 sections/fields，但**沒有建立任何 lp_project**。
 *   後台「LANDING PAGE 管理」列表（GET /api/landing/projects）只列 lp_projects，
 *   所以業主在管理列表看不到這個版面；且沒有已發布專案，
 *   /page/aaron-consult 會 404、無法預覽、線上打不開。
 *   （模板本身 is_active=true、sort_order=0，其實已在「新增 LP」挑選器最前面。）
 *
 * 本支只寫入一張表：lp_projects（以 custom_slug 為唯一鍵 upsert，可重複執行）。
 *   欄位內容全部沿用 lp_template_fields.default_value（種子預設文案），
 *   因此不需要寫 lp_project_field_values —— vw_lp_project_resolved_fields
 *   會自動以 default_value 回填每個欄位。
 *
 * 用法：
 *   node database/scripts/seed_lp_aaron_project.mjs           # 寫入／更新並發布
 *   node database/scripts/seed_lp_aaron_project.mjs --dry     # 只列印，不寫入
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry");

// ── 憑證：讀 backend/.env（與 seed_lp_aaron_template.mjs 相同慣例）────
const envPath = join(__dirname, "..", "..", "backend", ".env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ backend/.env 缺 SUPABASE_URL / SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const TEMPLATE_CODE = "AARON_CONSULT_001";
const SLUG = "aaron-consult";

async function selectOne(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`${table} 查詢失敗 ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

async function upsert(table, rows, onConflict) {
  if (DRY_RUN) {
    console.log(`   [dry] ${table} ← ${rows.length} rows (on_conflict=${onConflict})`);
    console.log(JSON.stringify(rows, null, 2));
    return rows;
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${table} upsert 失敗 ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function main() {
  console.log(`\n🌱 種子：阿倫指定版面【已發布專案】${DRY_RUN ? "  [DRY RUN]" : ""}`);
  console.log(`   目標：${SUPABASE_URL}`);

  // 1) 取模板 id + 分享文案（沿用模板既有的 html_title / meta_description）
  const tpl = await selectOne(
    "lp_templates",
    `template_code=eq.${TEMPLATE_CODE}&select=id,html_title,meta_description,brand_name`,
  );
  if (!tpl?.id) throw new Error(`找不到模板 ${TEMPLATE_CODE}，請先跑 seed_lp_aaron_template.mjs`);
  console.log(`   ✅ 模板 ${TEMPLATE_CODE} id=${tpl.id}`);

  // 2) 若已存在同 slug 專案，沿用其 project_code；否則產生新的
  const existing = await selectOne(
    "lp_projects",
    `custom_slug=eq.${SLUG}&select=id,project_code,status`,
  );
  const project_code = existing?.project_code || "LP_AARON_CONSULT";

  const now = new Date().toISOString();
  const row = {
    template_id: tpl.id,
    project_code,
    project_name: tpl.brand_name || "阿倫指定版面",
    customer_name: "阿倫教官",
    locale: "zh-Hant",
    custom_slug: SLUG,
    seo_title: tpl.html_title || "讓專業變成收入 | 阿倫教官 50 分鐘免費視訊面談",
    seo_description:
      tpl.meta_description ||
      "阿倫教官 50 分鐘免費視訊面談：用銷售心理學穩定業績、讓學生自然續約、用自媒體經營創造獲客。",
    og_title: tpl.html_title || "讓專業變成收入 | 阿倫教官",
    og_description:
      tpl.meta_description ||
      "阿倫教官 50 分鐘免費視訊面談：找到突破瓶頸的關鍵，用更少的時間達到更高的收入。",
    seo_keywords: ["阿倫教官", "健身教練", "教練職涯", "免費諮詢", "銷售心理學", "自媒體經營"],
    settings_json: {},
    status: "published",
    published_at: existing?.status === "published" ? undefined : now,
  };
  // undefined 會被 JSON.stringify 丟掉，避免覆蓋既有 published_at
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);

  const [saved] = await upsert("lp_projects", [row], "custom_slug");
  console.log(
    `   ✅ lp_projects  id=${saved?.id ?? "(dry)"}  slug=/${SLUG}  status=published`,
  );

  console.log(`\n🎉 完成。`);
  console.log(`   後台「LANDING PAGE 管理」可見「${row.project_name}」（已發布，可預覽）`);
  console.log(`   線上： /page/${SLUG}\n`);
}

main().catch((err) => {
  console.error("\n❌ 種子失敗：", err.message);
  process.exit(1);
});
