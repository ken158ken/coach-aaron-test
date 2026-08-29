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
 *   - 區塊標題／副標與各段經歷文案：i18n 字典 `t.careerCarousel`
 *     （中文模式仍可被 site_content 的 career_* 覆寫）
 *   - 照片路徑：本檔的 `CAREER_IMAGES`
 * 未來若要改為後台可編輯，改由 `experiences` prop 傳入 API 回傳的
 * 同型別陣列即可（型別為 `CareerExperience[]`），其餘程式碼不動。
 */

import React, { useMemo } from 'react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useLanguage } from '@/context/LanguageContext';
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
  /** 多張照片（可省略）；提供時取代單張 image，該段顯示時每秒輪播一張 */
  images?: string[];
  /** 亮點數字（可省略） */
  highlight?: {
    value: string;
    label: string;
  };
}

// ─── 照片（純資料；文案全部在 i18n 字典 t.careerCarousel）────────

/**
 * 各段經歷的照片。
 *
 * ⚠️ 以「時間正序」保存（realtor → personal-trainer → head-coach）；
 * 顯示時在元件內反轉成倒敘法。
 *
 * 要換照片時，把圖片放到 frontend/public/images/ 下，
 * 在此填 '/images/xxx.jpg' 即可（文案不必動）。
 *
 * ⚠️ 履歷載有 realtor「單月業績約 200 萬」、personal-trainer「私教月入約 8 萬」，
 * 人設提案標為待佐證，客戶提供佐證後才可加上 highlight。
 */
const CAREER_IMAGES: Record<string, string[]> = {
  realtor: [
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1784556095/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_17_qsdcqo.jpg',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1784556029/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_7_l7vuqk.jpg',
  ],
  personalTrainer: [
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1784556003/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_6_rhqnrz.jpg',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1784556003/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_4_nwwdvd.jpg',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1784556004/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_5_fwm8am.jpg',
  ],
  headCoach: [
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1784556128/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_9_tp7sdh.jpg',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1784556119/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260720_16_knkkoy.jpg',
    'https://res.cloudinary.com/daejq0zo9/image/upload/v1773471265/LINE_ALBUM_%E5%B8%A5%E7%85%A7_260314_12_hmvfuj.jpg',
  ],
};

/** 自動輪播間隔（ms） */
const AUTOPLAY_MS = 5000;

// ─── 資料對應：CareerExperience → AnimatedTestimonialItem ──────
//   name = role（職稱）  designation = org（單位）
//   badge = period（期間） quote = summary（一句話簡述）
//   images = images（多張，該段顯示時每秒輪播）；src = image（單張 fallback）
const toTestimonial = (exp: CareerExperience): AnimatedTestimonialItem => ({
  name: exp.role,
  designation: exp.org,
  badge: exp.period,
  quote: exp.summary,
  src: exp.image,
  images: exp.images,
});

// ─── Component ────────────────────────────────────────────────

interface CareerCarouselProps {
  /** 覆寫經歷資料（預設用字典文案；未來接 DB 時由此傳入） */
  experiences?: CareerExperience[];
}

const CareerCarousel: React.FC<CareerCarouselProps> = ({
  experiences: experiencesProp,
}) => {
  const { get } = useSiteContent();
  const { t, isZhTW } = useLanguage();
  const copy = t.careerCarousel;

  /**
   * site_content 只存中文（`GET /api/content` 未回傳 content_value_en）：
   * 中文模式 DB 值優先，英文模式一律用字典。
   */
  const pick = (key: string, dict: string): string =>
    isZhTW ? get(key, dict) : dict;

  /** 由字典組出經歷（時間正序）；照片來自 CAREER_IMAGES */
  const experiencesFromCopy = useMemo<CareerExperience[]>(() => {
    const c = copy.experiences;
    return [
      { id: 'realtor', ...c.realtor, images: CAREER_IMAGES.realtor },
      {
        id: 'personal-trainer',
        ...c.personalTrainer,
        images: CAREER_IMAGES.personalTrainer,
      },
      {
        id: 'head-coach',
        period: c.headCoach.period,
        role: c.headCoach.role,
        org: c.headCoach.org,
        summary: c.headCoach.summary,
        bullets: c.headCoach.bullets,
        images: CAREER_IMAGES.headCoach,
        highlight: {
          value: c.headCoach.highlightValue,
          label: c.headCoach.highlightLabel,
        },
      },
    ];
  }, [copy]);

  const experiences = experiencesProp ?? experiencesFromCopy;

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
            {pick('career_tagline', copy.tagline)}
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
            {pick('career_title', copy.title)}
          </h2>
          <p className="mt-2 text-sm text-white/40 max-w-2xl mx-auto">
            {pick('career_subtitle', copy.subtitle)}
          </p>
        </div>

        {/* animated-testimonials 版型 */}
        <AnimatedTestimonials
          testimonials={testimonials}
          autoplay
          autoplayMs={AUTOPLAY_MS}
          imageRotateMs={1000}
          pauseOnHover
          advanceOnClick
          showClickHint
          clickHintText={copy.clickHint}
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
