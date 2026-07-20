/**
 * CareerCarousel - 其他人設經歷輪播（animated-testimonials 版）
 * @module components/sections/CareerCarousel
 *
 * @description
 * 用 Aceternity「animated-testimonials」版型呈現三段職涯經歷：
 * 圖片堆疊 + 文字淡入，整張換場、可自動輪播。
 * 只用專案既有的 framer-motion（透過共用元件 AnimatedTestimonials），
 * 不引入新套件。
 *
 * 敘事採「倒敘法」：現職總教官在最前，回推到最早的房仲業務。
 * 顯示順序 = 反轉 CAREER_EXPERIENCES（head-coach → personal-trainer → realtor）。
 *
 * 每一段經歷可帶一張照片（`image`）；未提供時 AnimatedTestimonials 會顯示
 * 帶編號的主題色佔位面板，版面仍完整，之後放上真實照片即可。
 *
 * SSR 安全：期間標籤與所有內容皆為寫死字串，未用 new Date() / random，
 * 每筆 quote 由共用元件保留在隱藏 DOM，避免職稱／簡述對 SEO 消失。
 *
 * ─── 文案／照片替換說明 ────────────────────────────────────────
 *   - `CAREER_COPY`        區塊標題／副標（可再被 site_content 覆寫）
 *   - `CAREER_EXPERIENCES` 各段經歷內容與照片路徑
 * 未來若要改為後台可編輯，把 `CAREER_EXPERIENCES` 換成 API 回傳的
 * 同型別陣列即可（型別為 `CareerExperience[]`），其餘程式碼不動。
 */

import React from 'react';
import { useSiteContent } from '@/hooks/useSiteContent';
import {
  AnimatedTestimonials,
  type AnimatedTestimonialItem,
} from '@/components/ui/animated-testimonials';

// ─── 型別 ─────────────────────────────────────────────────────

/** 單筆經歷 */
export interface CareerExperience {
  /** 穩定的識別碼（作為 React key，勿與其他筆重複） */
  id: string;
  /** 期間標籤，例如「現職」「2015–2018」。⚠️ 必須是寫死的字串，
   *  不可用 new Date() 推算，否則 SSR 與 client 會產生 hydration mismatch */
  period: string;
  /** 職稱 */
  role: string;
  /** 單位 / 公司 */
  org: string;
  /** 一句話簡述 */
  summary: string;
  /** 重點條列（建議 2–4 條） */
  bullets: string[];
  /** 照片路徑（可省略；未提供時顯示主題色佔位面板） */
  image?: string;
  /** 亮點數字（可省略） */
  highlight?: {
    value: string;
    label: string;
  };
}

// ─── 文案（定稿版，來源 REPORTS/INDEX_B2B文案_定稿草案.md 第 6 節）──

const CAREER_COPY = {
  tagline: 'Career Path',
  title: '我憑什麼教你做業績',
  subtitle:
    '教練變現這件事，我不是讀來的。賣過最難賣的東西、自己在第一線賣過課、也帶過一整團教練衝業績——這三段加起來，才是我現在能教你的原因。',
} as const;

/**
 * 各段經歷（定稿文案）。
 *
 * ⚠️ 陣列以「時間正序」保存（realtor → personal-trainer → head-coach），
 * 供其他程式／未來後台沿用；顯示時在元件內反轉成倒敘法。
 *
 * 照片：先留空 → 顯示帶編號的佔位面板。要放真實照片時，
 * 把圖片放到 frontend/public/images/ 下，並在此填 image: '/images/xxx.jpg'。
 */
export const CAREER_EXPERIENCES: CareerExperience[] = [
  {
    id: 'realtor',
    period: '早期・業務時期',
    role: '房仲業務經紀人',
    org: '房仲不動產業',
    summary:
      '我的職涯不是從健身房開始的，是從房仲開始的。這段時間讓我學會的不是話術，是讀人。',
    bullets: [
      '開發、帶看、探詢需求、議價、促成，完整銷售流程跑過無數遍',
      '在被拒絕是日常的環境裡練出韌性',
      '看懂客戶說「我再考慮」時，真正在意的到底是什麼',
    ],
    // image: '/images/career-realtor.jpg',
    // ⚠️ 履歷載有「單月業績約 200 萬」，人設提案標為低信心，客戶提供佐證後可解除：
    // highlight: { value: '200 萬', label: '單月業績' },
  },
  {
    id: 'personal-trainer',
    period: '轉職・入行',
    role: '私人教練',
    org: '成吉思汗健身（連鎖健身品牌）',
    summary:
      '我把業務時期的銷售能力直接搬進健身房，很快建立起穩定的私教客群。專業和銷售不是二選一，雙軌並進才走得遠。',
    bullets: [
      '做體能評估、身體組成分析與個人化課表',
      '同時負責諮詢、成交與續課，走完第一線私教的收入循環',
      '我教的每一套成交流程，都是自己親手跑過、被拒絕過、再修正出來的',
    ],
    // image: '/images/career-pt.jpg',
    // ⚠️ 履歷載有「私教月入約 8 萬」，標為待佐證，客戶確認後可解除：
    // highlight: { value: '8 萬', label: '私教月收入' },
  },
  {
    id: 'head-coach',
    period: '現職・教練經理／總教官',
    role: '總教官',
    org: '威豪健身 Pro Fitness（台東）・現任',
    summary:
      '帶團隊之後我才真正看懂——一個人業績好是天賦，一整團業績都好，那是系統。',
    bullets: [
      '統籌約 50 人教練團隊：排班調度、教學品質管控、招募面試與客訴處理',
      '設定並追蹤業績與續約 KPI，建立教練育成與考核制度',
      '把「怎麼成交」「怎麼續約」拆成可以教、可以複製、可以考核的標準',
    ],
    // image: '/images/career-head-coach.jpg',
    highlight: { value: '50 人', label: '教練團隊' },
  },
];

/** 自動輪播間隔（ms） */
const AUTOPLAY_MS = 5000;

// ─── 資料對應：CareerExperience → AnimatedTestimonialItem ──────
//   name = role（職稱）  designation = org（單位）
//   badge = period（期間） quote = summary（一句話簡述）
//   src  = image（未提供 → 元件顯示佔位面板）
const toTestimonial = (exp: CareerExperience): AnimatedTestimonialItem => ({
  name: exp.role,
  designation: exp.org,
  badge: exp.period,
  quote: exp.summary,
  src: exp.image,
});

// ─── Component ────────────────────────────────────────────────

interface CareerCarouselProps {
  /** 覆寫經歷資料（預設用內建常數；未來接 DB 時由此傳入） */
  experiences?: CareerExperience[];
}

const CareerCarousel: React.FC<CareerCarouselProps> = ({
  experiences = CAREER_EXPERIENCES,
}) => {
  const { get } = useSiteContent();

  if (!experiences.length) return null;

  // 倒敘法：反轉時間正序 → 現職（head-coach）在前、房仲（realtor）在後
  const ordered = [...experiences].reverse();
  const testimonials = ordered.map(toTestimonial);

  return (
    <section className="py-16 sm:py-20 px-4 bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-gold text-xs uppercase tracking-widest">
            {get('career_tagline', CAREER_COPY.tagline)}
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
            {get('career_title', CAREER_COPY.title)}
          </h2>
          <p className="mt-2 text-sm text-white/40 max-w-2xl mx-auto">
            {get('career_subtitle', CAREER_COPY.subtitle)}
          </p>
        </div>

        {/* animated-testimonials 版型 */}
        <AnimatedTestimonials
          testimonials={testimonials}
          autoplay
          autoplayMs={AUTOPLAY_MS}
          pauseOnHover
          advanceOnClick
          showClickHint
          clickHintText="點擊看下一段"
          hoverScale
        />

        {/* SEO / 無障礙：把每段重點條列也留在隱藏 DOM（quote 由元件本身保留） */}
        <div hidden aria-hidden="true">
          {ordered.map((exp) => (
            <div key={exp.id}>
              <h3>
                {exp.role} — {exp.org}
              </h3>
              <ul>
                {exp.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareerCarousel;
