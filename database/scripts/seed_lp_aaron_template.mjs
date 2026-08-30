#!/usr/bin/env node
/**
 * seed_lp_aaron_template.mjs
 * ──────────────────────────────────────────────────────────
 * 冪等建立「阿倫指定版面」Landing Page 模板（客戶指定的成交頁）。
 *
 * 寫入範圍（僅此四張表，不碰任何其他資料表）：
 *   lp_templates / lp_template_variants / lp_template_sections / lp_template_fields
 *
 * 所有欄位的 default_value 即規格書逐字文案，客戶開專案後
 * 立刻所見即所得，不需要先填一輪內容。
 *
 * 對應的 React 元件：frontend/src/components/landing-templates/AaronConsultLP.tsx
 * （由 lp_templates.jsx_component_key = 'AaronConsultLP' 對應）
 *
 * 用法：
 *   node database/scripts/seed_lp_aaron_template.mjs           # 寫入
 *   node database/scripts/seed_lp_aaron_template.mjs --dry     # 只列印，不寫入
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry");

// ── 憑證：讀 backend/.env（與 seed_course_seo.mjs 相同慣例）────────
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

/** PostgREST upsert（冪等：以 onConflict 唯一鍵合併） */
async function upsert(table, rows, onConflict) {
  if (!rows.length) return [];
  if (DRY_RUN) {
    console.log(`   [dry] ${table} ← ${rows.length} rows (on_conflict=${onConflict})`);
    return rows.map((r, i) => ({ ...r, id: -(i + 1) }));
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${table} upsert 失敗 ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function selectOne(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`${table} 查詢失敗 ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

// ══════════════════════════════════════════════════════════
// 模板定義
// ══════════════════════════════════════════════════════════

const TEMPLATE_CODE = "AARON_CONSULT_001";

const TEMPLATE = {
  template_code: TEMPLATE_CODE,
  template_slug: "aaron-consult",
  source_file_name: null,
  page_kind: "lead_gen",
  category_tags: ["consultation", "lead-gen", "coaching", "form", "silver-blade"],
  page_layout: "standard",
  animation_type: "none",
  brand_name: "阿倫指定版面",
  html_title: "讓專業變成收入 | 阿倫教官 50 分鐘免費視訊面談",
  meta_description:
    "阿倫教官 50 分鐘免費視訊面談：用銷售心理學穩定業績、讓學生自然續約、用自媒體經營創造獲客。",
  jsx_component_key: "AaronConsultLP",
  jsx_prop_schema: {},
  // 只有 primary 會被前端調色引擎採用，其餘保留給後台顯示/相容
  color_vars: {
    primary: "#C9A96E",
    bg: "#12151A",
    surface: "#1C2027",
    text: "#FFFFFF",
    muted: "#C6CDD8",
    border: "rgba(255,255,255,0.16)",
  },
  is_active: true,
  is_featured: true,
  sort_order: 0, // 排在模板挑選器最前面
};

/** 風格變體：本版面深/淺主題自動推導，變體只決定金屬點綴色 */
const VARIANTS = [
  {
    variant_key: "brand_gold",
    label: "品牌金",
    label_en: "Brand Gold",
    color_vars: { primary: "#C9A96E" },
    is_default: true,
    sort_order: 0,
  },
  {
    variant_key: "steel_blue",
    label: "鋼藍",
    label_en: "Steel Blue",
    color_vars: { primary: "#5B8DEF" },
    is_default: false,
    sort_order: 1,
  },
  {
    variant_key: "graphite",
    label: "石墨銀",
    label_en: "Graphite",
    color_vars: { primary: "#8A94A6" },
    is_default: false,
    sort_order: 2,
  },
];

const SECTIONS = [
  ["hero", "① Hero 主視覺", "hero", 2],
  ["imagine", "② 想像一下", "content", 1],
  ["pains", "③ 痛點", "content", 1],
  ["results", "④ 學員真實成果", "testimonials", 2],
  ["audience", "⑤ 適合對象", "content", 1],
  ["about", "⑥ 關於阿倫教官", "about", 1],
  ["benefits", "⑦ 免費體驗獲得", "features", 3],
  ["pricing", "⑧ 價格卡", "pricing", 1],
  ["faq", "⑨ 常見問題（加碼問題掛點）", "faq", 1],
  ["form", "⑩ 預約表單", "contact", 1],
  ["contact", "⑪ 聯絡資訊", "contact", 2],
  ["sticky", "⑫ 手機懸浮 CTA", "cta", 1],
  ["seo", "⑬ 分享設定（OG）", "meta", 1],
];

// 欄位：[section_key, field_key, field_label, kind, default_value, help_text?]
// kind: t=plain_text/text, l=long_text/text_long, i=image/image, u=url/url
const F = [
  // ── ① Hero ──
  ["hero", "hero_badge", "徽章文字", "t", "阿倫教官・50分鐘免費視訊面談"],
  ["hero", "hero_title", "主標題", "t", "讓專業變成收入"],
  ["hero", "hero_subtitle", "副標題", "l", "如果你不擅長銷售、學生續約總是卡關、自媒體經營也沒效果"],
  ["hero", "hero_points_title", "列點前導句", "t", "要如何在 3 個月內，做到："],
  ["hero", "hero_point_1", "列點 1", "t", "用銷售心理學技巧，穩定每月 20 萬業績"],
  ["hero", "hero_point_2", "列點 2", "t", "讓學生自然續約，月收入穩定 8 萬以上"],
  ["hero", "hero_point_3", "列點 3", "t", "透過自媒體經營，創造每月三位獲客"],
  ["hero", "hero_closing_1", "收尾第 1 行", "t", "預約諮詢，找到突破瓶頸"],
  ["hero", "hero_closing_2", "收尾第 2 行", "t", "用更少的時間，達到更高的收入"],
  ["hero", "hero_cta_note_1", "CTA 上方說明 1", "t", "👉 填寫表單，和阿倫教官預約1對1視訊面談"],
  ["hero", "hero_cta_note_2", "CTA 上方說明 2", "t", "找到你突破瓶頸的關鍵，輕鬆月入8萬以上！"],
  ["hero", "hero_cta_text", "CTA 按鈕文字", "t", "立即預約諮詢"],
  ["hero", "hero_image", "人物照片", "i", null, "建議直式 4:5，會顯示在 Hero 右側"],

  // ── ② 想像區 ──
  ["imagine", "imagine_lead", "引言起頭", "t", "想像一下，三個月後的你—"],
  ["imagine", "imagine_point_1", "列點 1", "t", "有個人品牌的形象"],
  ["imagine", "imagine_point_2", "列點 2", "t", "有系統成交的方法"],
  ["imagine", "imagine_point_3", "列點 3", "t", "同時不再為業績困擾"],
  ["imagine", "imagine_point_4", "列點 4", "t", "你可以用自己的專業和熱情"],
  ["imagine", "imagine_point_5", "列點 5", "t", "活出你想成為的教練形象"],

  // ── ③ 痛點 ──
  ["pains", "pains_title", "標題", "t", "你是否也遇過這些狀況？"],
  ["pains", "pain_1", "狀況 1", "t", "體驗課帶的好，客戶總是說再考慮"],
  ["pains", "pain_2", "狀況 2", "t", "工作時間投入多，報酬卻不成比例"],
  ["pains", "pain_3", "狀況 3", "t", "每天都在思考，教練行業能做多久"],
  ["pains", "pain_4", "狀況 4（選填）", "t", null],
  ["pains", "pains_footer", "收尾句", "t", "不用擔心，你只是缺一套成長系統"],

  // ── ④ 學員真實成果 ──
  ["results", "results_title", "標題", "t", "學員真實成果"],
  ["results", "result_1_icon", "成果 1 圖示", "t", "🏆"],
  ["results", "result_1_text", "成果 1 文字", "t", "IG粉絲數5百-4萬（2年）"],
  ["results", "result_2_icon", "成果 2 圖示", "t", "⭐"],
  ["results", "result_2_text", "成果 2 文字", "t", "轉職教練→健身房老闆（2年）"],
  ["results", "result_3_icon", "成果 3 圖示", "t", "💪"],
  ["results", "result_3_text", "成果 3 文字", "t", "健身工作室老闆"],
  ["results", "result_4_icon", "成果 4 圖示（選填）", "t", null],
  ["results", "result_4_text", "成果 4 文字（選填）", "t", null],
  ["results", "results_image", "LINE 對話截圖", "i", null, "學員回饋截圖，顯示在成果卡右側"],
  ["results", "results_image_caption", "截圖說明", "t", "學員 LINE 回饋"],

  // ── ⑤ 適合對象 ──
  ["audience", "audience_title", "標題", "t", "諮詢最適合的你，如果你是"],
  ["audience", "audience_1", "對象 1", "t", "想提高成交率，建立穩定客源"],
  ["audience", "audience_2", "對象 2", "t", "想要少時間，去創造更高的收入"],
  ["audience", "audience_3", "對象 3", "t", "想打造系統性教練獲客模式"],
  ["audience", "audience_4", "對象 4（選填）", "t", null],

  // ── ⑥ 關於阿倫教官 ──
  ["about", "about_title", "標題", "t", "關於阿倫教官"],
  ["about", "about_para_1", "段落 1", "l", "房仲第5年，新人時期單月業績百萬紀錄。"],
  ["about", "about_para_2", "段落 2", "l",
    "轉職到健身產業 10 年，研讀心理學知識，成功協助 140 位新手教練，達年薪百萬。"],
  ["about", "about_para_3", "段落 3", "l",
    "希望用我走過的路，幫助你在教練職業，找到自己的職涯道路。"],
  ["about", "about_certs_title", "證照區標題", "t", "相關證照"],
  ["about", "about_certs", "相關證照（用／分隔）", "l",
    "NSCA 美國肌力與體能／TQUK 英國心理諮詢師／NLP 心理執行師／Andaction生活教練",
    "每一項用全形斜線／分隔，前台會自動排成條列"],
  ["about", "about_exp_title", "經歷區標題", "t", "經歷"],
  ["about", "about_exp", "經歷（用／分隔）", "l",
    "威豪健身總教官／永慶房屋經紀人-單月百萬業績／2019年全國健身模特兒-冠軍／健身體適能協會-證照講師／成吉思汗-私人教練",
    "每一項用全形斜線／分隔"],
  ["about", "about_practice_title", "實務經驗區標題", "t", "實務經驗"],
  ["about", "about_practice", "實務經驗（用／分隔）", "l",
    "培訓140位以上教練，年薪破百萬／教練培訓時數超過1000小時／八年健身房管理經驗／百場企業內訓講座",
    "每一項用全形斜線／分隔"],

  // ── ⑦ 免費體驗獲得 ──
  ["benefits", "benefits_title", "標題", "t", "這次免費體驗，你將獲得"],
  ["benefits", "benefits_subtitle", "副標", "t", "50 分鐘一對一客製化諮詢"],
  ["benefits", "benefit_1", "項目 1", "t", "探討目前遇到卡點"],
  ["benefits", "benefit_2", "項目 2", "t", "分析目前職涯方向"],
  ["benefits", "benefit_3", "項目 3", "t", "提供問題解決方針"],

  // ── ⑧ 價格卡 ──
  ["pricing", "price_original_label", "原價說明", "t", "原體驗諮詢售價"],
  ["pricing", "price_original_amount", "原價金額（數字）", "t", "4000"],
  ["pricing", "price_now_label", "優惠價說明", "t", "本月體驗價"],
  ["pricing", "price_now_amount", "優惠價金額（數字）", "t", "500"],
  ["pricing", "price_note", "備註小字", "t", "當天報名正式課程，體驗費全額折抵"],

  // ── ⑨ 常見問題（加碼問題掛點，預設空白不顯示）──
  ["faq", "faq_title", "標題", "t", "常見問題"],

  // ── ⑩ 預約表單 ──
  ["form", "form_title", "標題", "t", "立即預約諮詢"],
  ["form", "form_subtitle", "副標 1", "t", "填妥以下資料，我們將在 24 小時內與您聯繫"],
  ["form", "form_subtitle_2", "副標 2", "t", "完成填寫後，阿倫教官將主動和你聯繫🤜🤛"],
  ["form", "q_name_label", "題目：姓名", "t", "姓名"],
  ["form", "q_phone_label", "題目：行動電話", "t", "行動電話"],
  ["form", "q_phone_placeholder", "行動電話 placeholder", "t", "0912345678"],
  ["form", "q_email_label", "題目：電子信箱", "t", "電子信箱"],
  ["form", "q_ig_label", "題目：IG帳號", "t", "IG帳號"],
  ["form", "q_line_label", "題目：Line帳號", "t", "Line帳號"],
  ["form", "q_line_hint", "Line 帳號提示", "t", "必須開通好友"],
  ["form", "q_tenure_label", "題目：教練年資（必填單選）", "t", "從事私人教練多久時間"],
  ["form", "q_tenure_options", "年資選項（用／分隔）", "l",
    "剛入行 0–1 年／1–2年／2年-3年／3年以上", "每個選項用全形斜線／分隔"],
  ["form", "q_gym_label", "題目：健身房類型（單選）", "t", "所屬健身房類型"],
  ["form", "q_gym_options", "健身房類型選項（用／分隔）", "l",
    "連鎖健身房／中小型健身房／工作室／自由教練／準備進入健身產業"],
  ["form", "q_income_label", "題目：月收入範圍（必填單選）", "t",
    "你目前每月平均收入大約在哪個範圍？"],
  ["form", "q_income_options", "收入選項（用／分隔）", "l",
    "3 萬以下／3–5 萬／5–7 萬／7–9 萬／9 萬以上"],
  ["form", "q_pain_label", "題目：最大困擾（必填複選）", "t", "目前最大的困擾是什麼？"],
  ["form", "q_pain_options", "困擾選項（用／分隔）", "l",
    "不擅長銷售，學生不容易成交／學生續約率不高，收入不穩定／時間投入很多，但收入卻停滯／自媒體經營沒效果／其他",
    "選項寫「其他」時，前台會自動附上自由輸入欄"],
  ["form", "q_goal_label", "題目：三個月後的目標（開放題）", "l",
    "如果你能解決以上困擾，你希望 3 個月後達到什麼狀態？"],
  ["form", "q_extra_label", "題目：補充說明（開放題）", "l",
    "為了讓我能更好的幫助你、有什麼可能是可以讓我先知道的？"],
  ["form", "q_time_label", "題目：方便諮詢時段（必填單選）", "t", "方便諮詢時段"],
  ["form", "q_time_options", "時段選項（用／分隔）", "l",
    "早上(10點-12點)／下午(13點-17點)／其他"],
  ["form", "q_goalarea_label", "題目：主要目標（選填複選）", "t", "您的主要目標（選填）"],
  ["form", "q_goalarea_options", "主要目標選項（用／分隔）", "l",
    "提升業績／穩定客源／個人品牌／職涯討論"],
  ["form", "q_course_label", "題目：想體驗的課程（選填複選）", "t", "想體驗的課程（選填）"],
  ["form", "q_course_options", "課程選項（用／分隔）", "l",
    "體驗課流程設計／續約流程設計／轉介紹流程設計／自媒體定位"],
  ["form", "form_submit_text", "送出按鈕文字", "t", "立即預約諮詢"],
  ["form", "form_privacy_note", "底部隱私小字", "t", "我們保證不會把您的資料用於其他用途"],
  ["form", "form_success_title", "送出成功標題", "t", "已收到你的預約！"],
  ["form", "form_success_text", "送出成功說明", "l", "阿倫教官將主動和你聯繫🤜🤛"],

  // ── ⑪ 聯絡資訊 ──
  ["contact", "contact_title", "標題", "t", "其他聯絡方式"],
  ["contact", "contact_line_label", "LINE 按鈕文字", "t", "加 LINE 好友"],
  ["contact", "contact_line_id", "LINE ID", "t", "@667nqldx",
    "@ 開頭視為官方帳號；個人 ID 直接填帳號，手機點擊會直接開啟加好友"],
  ["contact", "contact_phone", "電話（選填，填了才顯示）", "t", null, "填入後手機點擊可直接撥號"],
  ["contact", "contact_ig_url", "Instagram 連結", "u", "https://www.instagram.com/coach.luen"],
  ["contact", "contact_email", "Email", "t", "s330221@gmail.com"],

  // ── ⑫ 手機懸浮 CTA ──
  ["sticky", "sticky_cta_text", "懸浮列：預約按鈕", "t", "立即預約"],
  ["sticky", "sticky_line_text", "懸浮列：LINE 按鈕", "t", "加 LINE"],

  // ── ⑬ 分享設定 ──
  ["seo", "seo_og_image", "分享縮圖（OG image）", "i", null,
    "分享到 IG／LINE／FB 時顯示的圖，建議 1200×630"],
  ["seo", "seo_share_desc", "分享描述", "l",
    "阿倫教官 50 分鐘免費視訊面談：用銷售心理學穩定業績、讓學生自然續約、用自媒體經營創造獲客。"],
];

// FAQ 掛點：8 組空白 Q/A，客戶（或後續「加碼問題」）填了才會出現在前台
for (let i = 1; i <= 8; i++) {
  F.push(["faq", `faq_${i}_q`, `問題 ${i}`, "t", null, "留空則此題不顯示"]);
  F.push(["faq", `faq_${i}_a`, `回答 ${i}`, "l", null]);
}

const KIND_MAP = {
  t: ["plain_text", "text"],
  l: ["long_text", "text_long"],
  i: ["image", "image"],
  u: ["url", "url"],
};

// ══════════════════════════════════════════════════════════
// 執行
// ══════════════════════════════════════════════════════════

async function main() {
  console.log(`\n🌱 種子：阿倫指定版面 (${TEMPLATE_CODE})${DRY_RUN ? "  [DRY RUN]" : ""}`);
  console.log(`   目標：${SUPABASE_URL}`);

  // 1) 模板
  const [tpl] = await upsert("lp_templates", [TEMPLATE], "template_code");
  const templateId = DRY_RUN
    ? -1
    : (tpl?.id ?? (await selectOne("lp_templates", `template_code=eq.${TEMPLATE_CODE}&select=id`))?.id);
  if (!templateId) throw new Error("取不到 template id");
  console.log(`   ✅ lp_templates  id=${templateId}`);

  // 2) 風格變體
  await upsert(
    "lp_template_variants",
    VARIANTS.map((v) => ({ ...v, template_id: templateId })),
    "template_id,variant_key",
  );
  console.log(`   ✅ lp_template_variants  ${VARIANTS.length} 筆`);

  // 3) 區塊
  const sectionRows = SECTIONS.map(([key, name, type, cols], i) => ({
    template_id: templateId,
    section_key: key,
    section_name: name,
    section_type: type,
    layout_cols: cols,
    is_visible_by_default: true,
    sort_order: i,
  }));
  const sections = await upsert("lp_template_sections", sectionRows, "template_id,section_key");
  const sectionId = Object.fromEntries(
    (DRY_RUN ? sectionRows.map((r, i) => ({ section_key: r.section_key, id: -(i + 1) })) : sections).map(
      (s) => [s.section_key, s.id],
    ),
  );
  console.log(`   ✅ lp_template_sections  ${sectionRows.length} 筆`);

  // 4) 欄位
  const perSectionOrder = {};
  const fieldRows = F.map(([sec, key, label, kind, def, help]) => {
    perSectionOrder[sec] = (perSectionOrder[sec] ?? -1) + 1;
    const [field_kind, data_type] = KIND_MAP[kind];
    return {
      template_id: templateId,
      section_id: sectionId[sec],
      field_key: key,
      field_label: label,
      field_kind,
      data_type,
      // content_group 必須等於 section_key：前台分組與後台隱藏區塊都吃這欄
      content_group: sec,
      field_category: null,
      default_value: def,
      placeholder_text: null,
      help_text: help ?? null,
      validation_rules: {},
      source_path: null,
      jsx_prop_path: null,
      sort_order: perSectionOrder[sec],
      is_required: false,
      is_repeatable: false,
      is_visible: true,
    };
  });

  // 分批寫入，避免單次 payload 過大
  for (let i = 0; i < fieldRows.length; i += 60) {
    await upsert("lp_template_fields", fieldRows.slice(i, i + 60), "template_id,field_key");
  }
  console.log(`   ✅ lp_template_fields  ${fieldRows.length} 筆`);

  console.log(`\n🎉 完成。後台「新增 Landing Page」模板挑選器可見「${TEMPLATE.brand_name}」`);
  console.log(`   元件：AaronConsultLP ・ 區塊 ${SECTIONS.length} 個 ・ 欄位 ${fieldRows.length} 個\n`);
}

main().catch((err) => {
  console.error("\n❌ 種子失敗：", err.message);
  process.exit(1);
});
