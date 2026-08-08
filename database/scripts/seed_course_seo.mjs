/**
 * seed_course_seo.mjs — 寫入 9 個課程（產品）的 SEO 專用欄位
 *
 * 前置：先在 Supabase Dashboard → SQL Editor 執行
 *       database/migrations/032_courses_seo_fields.sql（新增 seo_* 欄位）。
 *
 * 執行：node database/scripts/seed_course_seo.mjs
 *
 * 設計：
 *   - 只 PATCH seo_title / seo_description / seo_keywords（含 _en），
 *     「絕不」觸碰 course_title / course_description / course_content /
 *     course_keywords 等真實產品文案欄位。
 *   - 用 PATCH ?course_id=eq.N（單筆更新），不用 DELETE+POST——
 *     lp_projects.course_id 有 FK 指向 courses，清表重插會炸。
 *   - PATCH 前先以 expected_slug 核對該 id 對應的課程沒被換過，寫完逐筆回驗。
 *   - 憑證從 backend/.env 讀取（不硬編碼在本檔）。
 *
 * 文案準則：
 *   - SEO_CONTENT_PLAN.md：三個必備 tag「私人教練銷售／健身教練銷售／皮拉提斯銷售」。
 *     meta keywords 對 Google 無效，故前兩個 tag 已「自然織入」各筆 title/description
 *     正文；「皮拉提斯銷售」站上暫無對應內容，僅保留於 keywords（成效有限，
 *     須向客戶說明；若要真正吃到此字，需先產出皮拉提斯相關內容）。
 *   - ⚠️ 客戶紅線（migrations/030_b2b_site_content.sql L30-43）：
 *     「房仲單月 200 萬」「私教月入 8 萬」不得寫入任何文案；
 *     「130+ 教練年收破百萬」屬學員成效承諾已刪除，不得復活。
 *     已核可可用數字：50 人團隊、130+ 教練、1000+ 小時、10 年、58 集。
 *     「續約率 +60%」「續課率 95%」等留存數字未經核可口徑統一，一律不用。
 *   - seo_title 壓在 20 全形字內：SEOHead 會固定加上「 | 阿倫教官 | Coach Aaron」
 *     後綴，標題太長時品牌名會被 Google（約 28–33 全形字）截斷。
 *   - B2B 語氣（受眾是健身教練同業）、品牌名一律「阿倫教官」。
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 憑證：讀 backend/.env ────────────────────────────────────
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

// ── 9 筆課程的 SEO 資料 ──────────────────────────────────────
// expected_slug 僅作寫入前防呆核對，不會被寫入 DB。
const ROWS = [
  {
    course_id: 1,
    expected_slug: "monetization-coaching-3m",
    seo_title: "變現陪跑三個月方案｜私人教練銷售培訓",
    seo_description:
      "專為私人教練設計的 90 天業績衝刺陪跑：12 次一對一培訓、體驗課成交 SOP、每週視訊追蹤邀約與續約指標，並附贈總值 NT$41,420 線上課程。10 年健身教練銷售實戰，已協助 130+ 位教練把專業變成穩定收入。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,私教變現陪跑,變現陪跑,健身教練如何提升業績,體驗課成交,業績衝刺,教練商業培訓,阿倫教官",
    seo_title_en: "3-Month Sales Coaching for Trainers",
    seo_description_en:
      "A 90-day sales sprint for personal trainers: 12 one-on-one sessions, a proven trial-session closing system and weekly progress tracking—built from 10 years of fitness industry experience.",
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,trainer monetization coaching,how to increase PT revenue,trial session closing,Coach Aaron",
  },
  {
    course_id: 2,
    expected_slug: "monetization-coaching-6m",
    seo_title: "變現陪跑六個月方案｜業績衝刺到穩定續約",
    seo_description:
      "六個月 24 次一對一陪跑：前三個月建立體驗課成交系統衝業績，後三個月用會員關係心理學經營續約與轉介紹，為私人教練打造長期穩定收入。10 年產業實戰，帶你把私人教練銷售變成一套可複製的系統。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,私教變現陪跑,私人教練續約技巧,轉介紹流程,健身教練如何提升業績,長期收入,阿倫教官",
    seo_title_en: "6-Month Sales Coaching for Trainers",
    seo_description_en:
      "24 one-on-one sessions over six months: sprint your sales first, then build lasting income through renewal psychology and referral systems.",
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,client renewal strategy,referral system,trainer monetization,Coach Aaron",
  },
  {
    course_id: 3,
    expected_slug: "monetization-coaching-1y",
    seo_title: "變現陪跑一年方案｜業績、續約到個人品牌",
    seo_description:
      "一年 48 次一對一培訓的最完整方案：從業績衝刺、續約與轉介紹，到自媒體定位、口播腳本與鏡頭表現，一步步把私人教練打造成有個人品牌的經營者。10 年健身教練銷售與管理實戰，已協助 130+ 位教練突破業績瓶頸。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,私教變現陪跑,健身教練自媒體經營,教練個人品牌,口播腳本,健身教練如何提升業績,阿倫教官",
    seo_title_en: "1-Year Coaching: Sales to Personal Brand",
    seo_description_en:
      "The complete package: 48 one-on-one sessions covering sales, renewals and referrals, then personal branding and social media for fitness coaches.",
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,personal branding for trainers,social media for fitness coaches,trainer monetization,Coach Aaron",
  },
  {
    course_id: 4,
    expected_slug: "communication-psychology",
    seo_title: "表達力心理學｜健身教練的說服力線上課",
    seo_description:
      "說服力不是天生的，是可以學的。從影響決策的心理學原則、說服語言架構到非語言溝通，讓健身教練在諮詢與銷售對話中快速建立信任、提升成交率。專為健身教練銷售場景設計的線上課程，隨時開始。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,表達力心理學,銷售心理學,說服力訓練,溝通表達,教練變現線上課程,阿倫教官",
    seo_title_en: "Communication Psychology for Coaches",
    seo_description_en:
      "Persuasion is a learnable skill. Master decision psychology, persuasive language and non-verbal communication to close more consultations.",
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,communication psychology,persuasion skills,sales psychology,Coach Aaron",
  },
  {
    course_id: 5,
    expected_slug: "objection-handling-scripts",
    seo_title: "反對問題成交話術｜健身房銷售話術模板",
    seo_description:
      "太貴了、再考慮、問問家人——本課拆解每句拒絕背後的真正原因，提供價格、時間、猶豫等反對問題的實戰話術模板，讓健身教練從容接住拒絕、自然引導成交，不靠壓力推銷。私人教練銷售必備的一堂課。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,健身房銷售話術,反對問題處理,成交話術,拒絕處理,話術模板,教練變現線上課程,阿倫教官",
    seo_title_en: "Objection Handling Scripts for Coaches",
    seo_description_en:
      '"Too expensive," "let me think"—field-tested scripts for price, timing and hesitation objections that guide clients to enrollment without pressure.',
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,objection handling,closing scripts,gym sales scripts,Coach Aaron",
  },
  {
    course_id: 6,
    expected_slug: "trial-session-closing",
    seo_title: "體驗課成交全流程｜高轉換率體驗課系統",
    seo_description:
      "從課前背景分析與流程設計、課中破冰與痛點挖掘，到課後報價時機與跟進節奏，完整拆解一堂高轉換率體驗課的每個環節，讓體驗課成為私人教練銷售最穩定的成交入口，不再是免費勞動。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,體驗課成交,體驗課轉換率,健身房銷售流程,破冰技巧,課後跟進,教練變現線上課程,阿倫教官",
    seo_title_en: "Trial Session Closing Playbook",
    seo_description_en:
      "From pre-session analysis to in-session rapport and post-session follow-up—turn trial sessions into your most reliable enrollment channel.",
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,trial session conversion,fitness sales process,follow-up scripts,Coach Aaron",
  },
  {
    course_id: 7,
    expected_slug: "personal-trainer-renewal",
    seo_title: "私人教練續約必修課｜讓買過的人再買",
    seo_description:
      "開發新客戶的成本是維護舊客戶的五倍。學會辨識續約信號、掌握溝通時機、設計階梯式續約方案，並建立客戶管理與轉介紹流程，把單次成交變成穩定的長期收入。健身教練銷售的下半場，從續約開始。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,私人教練續約技巧,健身教練續課,續約話術,轉介紹,長期收入,阿倫教官",
    seo_title_en: "Client Renewal Essentials for Trainers",
    seo_description_en:
      "A new client costs five times more than keeping one. Read renewal signals, time your conversations and design tiered offers for lasting income.",
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,client renewal,client retention for trainers,referral marketing,Coach Aaron",
  },
  {
    course_id: 8,
    expected_slug: "one-on-one-coaching",
    seo_title: "一對一陪跑訓練｜量身打造業績突破計畫",
    seo_description:
      "從你目前的業績瓶頸出發：現況診斷與目標設定、量身定制銷售策略、話術演練模擬實戰，加上定期視訊覆盤與即時訊息支援。不是聽課，是真的陪你打仗的私人教練銷售實戰指導。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,教練一對一顧問,一對一陪跑,私教如何突破收入瓶頸,教練業績提升,銷售策略,實戰指導,阿倫教官",
    seo_title_en: "1-on-1 Coaching: Sales Breakthrough",
    seo_description_en:
      "Built around your bottleneck: diagnosis, a tailored sales strategy, live script drills, video reviews and instant messaging support. Real fieldwork, not lectures.",
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,1-on-1 business coaching,sales strategy for trainers,revenue breakthrough,Coach Aaron",
  },
  {
    course_id: 9,
    expected_slug: "mental-resilience-career",
    seo_title: "心理韌性與職涯定位｜教練職涯方向指引",
    seo_description:
      "技術只是入場券，心態決定你能走多遠。結合心理學與 Life Coaching 引導式對話，帶健身教練釐清自我優勢、強化面對挫折的心理韌性，並把職涯方向拆解成可執行的目標，走出自己的教練路。",
    seo_keywords:
      "私人教練銷售,健身教練銷售,皮拉提斯銷售,心理韌性,教練職涯發展,職涯定位,Life Coaching,自我認知,目標規劃,阿倫教官",
    seo_title_en: "Mental Resilience & Career Positioning",
    seo_description_en:
      "Skills get you in the door; mindset decides how far you go. Psychology and life-coaching dialogue to clarify strengths and set actionable career goals.",
    seo_keywords_en:
      "personal trainer sales,fitness coach sales,pilates sales,mental resilience,career positioning for coaches,life coaching,Coach Aaron",
  },
];

// ── 檢核 ─────────────────────────────────────────────────────
const REQUIRED_TAGS = ["私人教練銷售", "健身教練銷售", "皮拉提斯銷售"];
// 客戶紅線與未核可數字（030 migration / HANDOFF 報告），任何欄位出現即擋下
const FORBIDDEN = ["月入 8 萬", "月入8萬", "8 萬", "200 萬", "年收破百萬", "年收突破百萬", "NT$1M", "60%", "95%"];

for (const row of ROWS) {
  for (const tag of REQUIRED_TAGS) {
    if (!row.seo_keywords.includes(tag)) {
      console.error(`❌ course_id=${row.course_id} keywords 缺必備 tag「${tag}」`);
      process.exit(1);
    }
  }
  const texts = [row.seo_title, row.seo_description, row.seo_title_en, row.seo_description_en];
  for (const text of texts) {
    for (const bad of FORBIDDEN) {
      if (text.includes(bad)) {
        console.error(`❌ course_id=${row.course_id} 文案含紅線/未核可數字「${bad}」：${text}`);
        process.exit(1);
      }
    }
  }
  if (row.seo_title.length > 20) {
    console.error(`❌ course_id=${row.course_id} seo_title 超過 20 字（會截斷品牌後綴）：${row.seo_title}`);
    process.exit(1);
  }
  if (row.seo_title_en.length > 45) {
    console.error(`❌ course_id=${row.course_id} seo_title_en 超過 45 字元`);
    process.exit(1);
  }
  if (row.seo_description.length > 320 || row.seo_description_en.length > 320) {
    console.error(`❌ course_id=${row.course_id} seo_description 超過 varchar(320)`);
    process.exit(1);
  }
}

// ── 寫入 + 回驗 ──────────────────────────────────────────────
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

let failed = 0;
for (const { course_id, expected_slug, ...patch } of ROWS) {
  // 防呆：確認 id ↔ slug 對應沒被換過（避免課程重建後文案錯位）
  const pre = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?course_id=eq.${course_id}&select=course_slug`,
    { headers },
  );
  const [preRow] = await pre.json();
  if (!preRow) {
    failed++;
    console.error(`❌ course_id=${course_id} 不存在，跳過`);
    continue;
  }
  if (preRow.course_slug !== expected_slug) {
    failed++;
    console.error(
      `❌ course_id=${course_id} slug 不符（預期 ${expected_slug}，實際 ${preRow.course_slug}），跳過以免文案錯位`,
    );
    continue;
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?course_id=eq.${course_id}`,
    { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(patch) },
  );
  if (!res.ok) {
    failed++;
    const body = await res.text();
    console.error(`❌ course_id=${course_id} PATCH 失敗 (${res.status}): ${body}`);
    if (body.includes("PGRST204") || body.includes("column")) {
      console.error("   ↳ 看起來 seo_* 欄位還不存在，請先在 Supabase SQL Editor 執行 032_courses_seo_fields.sql");
      break;
    }
    continue;
  }
  // 回驗
  const check = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?course_id=eq.${course_id}&select=course_id,course_title,seo_title,seo_description,seo_keywords`,
    { headers },
  );
  const [row] = await check.json();
  const ok = row?.seo_title === patch.seo_title && row?.seo_description === patch.seo_description;
  console.log(`${ok ? "✅" : "⚠️"} course_id=${course_id}〈${row?.course_title}〉→ seo_title=「${row?.seo_title}」`);
  if (!ok) failed++;
}

console.log(failed === 0 ? "\n🎉 全部 9 筆 SEO 寫入並回驗成功" : `\n⚠️ 有 ${failed} 筆失敗，請檢查上方訊息`);
process.exit(failed === 0 ? 0 : 1);
