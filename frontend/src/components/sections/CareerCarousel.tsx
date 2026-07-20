/**
 * CareerCarousel - 其他人設經歷輪播（圖文版）
 * @module components/sections/CareerCarousel
 *
 * @description
 * 一次顯示「一個時期」，圖左文右、整張換場、可自動輪播。
 * 只用專案既有的 framer-motion，不引入新套件。
 *
 * 每一段經歷可帶一張照片（`image`）；未提供時顯示帶期間編號的
 * 主題色佔位面板，版面仍完整，之後放上真實照片即可。
 *
 * SSR 安全：期間標籤與所有內容皆為寫死字串，未用 new Date() / random，
 * 未輪到的經歷仍以隱藏節點保留在 DOM，避免職稱對 SEO 消失。
 *
 * ─── 文案／照片替換說明 ────────────────────────────────────────
 *   - `CAREER_COPY`        區塊標題／副標（可再被 site_content 覆寫）
 *   - `CAREER_EXPERIENCES` 各段經歷內容與照片路徑
 * 未來若要改為後台可編輯，把 `CAREER_EXPERIENCES` 換成 API 回傳的
 * 同型別陣列即可（型別為 `CareerExperience[]`），其餘程式碼不動。
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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
 * 照片：先留空 → 顯示帶期間編號的佔位面板。要放真實照片時，
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

// ─── 照片面板（有圖顯示圖，無圖顯示帶編號的主題色佔位）──────────
const PhotoPanel: React.FC<{ exp: CareerExperience; index: number; total: number }> = ({
  exp,
  index,
  total,
}) => (
  <div className="relative w-full h-56 md:h-auto md:min-h-[22rem] overflow-hidden bg-gradient-to-br from-white/[0.06] to-black/40">
    {exp.image ? (
      <img
        src={exp.image}
        alt={`${exp.role}｜${exp.org}`}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    ) : (
      // 佔位面板：大編號 + 期間，之後填 image 即可覆蓋
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
        <span className="text-6xl md:text-7xl font-thin text-gold/25 tabular-nums leading-none">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="text-xs tracking-widest text-white/30 uppercase">
          {`Chapter ${index + 1} / ${total}`}
        </span>
      </div>
    )}
    {/* 底部漸層，讓期間標籤在任何圖上都清楚 */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
    <span className="absolute left-4 bottom-4 text-xs bg-black/40 backdrop-blur-sm text-gold border border-gold/25 px-3 py-1 rounded-full">
      {exp.period}
    </span>
  </div>
);

// ─── 單張經歷（圖左文右）──────────────────────────────────────
const ExperienceSlide: React.FC<{ exp: CareerExperience; index: number; total: number }> = ({
  exp,
  index,
  total,
}) => (
  <article className="grid grid-cols-1 md:grid-cols-2 bg-surface border border-white/10 rounded-2xl overflow-hidden">
    <PhotoPanel exp={exp} index={index} total={total} />

    <div className="flex flex-col gap-4 p-6 sm:p-8">
      <div>
        <h3 className="text-xl sm:text-2xl font-light text-white/90 leading-tight">
          {exp.role}
        </h3>
        <p className="mt-1 text-sm text-white/40">{exp.org}</p>
      </div>

      <p className="text-white/70 text-sm leading-relaxed">{exp.summary}</p>

      <div className="w-8 h-px bg-gold/30" />

      <ul className="space-y-2 flex-1">
        {exp.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
            <span className="w-1.5 h-1.5 mt-1.5 bg-gold rounded-full shrink-0" />
            {b}
          </li>
        ))}
      </ul>

      {exp.highlight && (
        <div className="pt-3 border-t border-white/5">
          <span className="text-gold text-xl sm:text-2xl font-light">
            {exp.highlight.value}
          </span>
          <span className="ml-2 text-xs text-white/40">{exp.highlight.label}</span>
        </div>
      )}
    </div>
  </article>
);

// ─── Component ────────────────────────────────────────────────

interface CareerCarouselProps {
  /** 覆寫經歷資料（預設用內建常數；未來接 DB 時由此傳入） */
  experiences?: CareerExperience[];
}

const CareerCarousel: React.FC<CareerCarouselProps> = ({
  experiences = CAREER_EXPERIENCES,
}) => {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward
  const [paused, setPaused] = useState(false);

  const { get } = useSiteContent();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const total = experiences.length;

  // 自動輪播；hover 中或使用者要求減少動態時停止
  useEffect(() => {
    if (total <= 1 || paused || reduceMotion) return;
    const t = setInterval(() => {
      setDirection(1);
      setIdx((i) => (i + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [total, paused, reduceMotion]);

  if (!total) return null;

  const go = (next: number, dir: number) => {
    setDirection(dir);
    setIdx((next + total) % total);
  };
  const current = experiences[idx];

  return (
    <section className="py-16 sm:py-20 px-4 bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
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

        {/* 一次一張、整張滑動換場 */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 60 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -60 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <ExperienceSlide exp={current} index={idx} total={total} />
            </motion.div>
          </AnimatePresence>

          {/* 左右箭頭（桌機浮在卡片外側，手機貼邊） */}
          {total > 1 && (
            <>
              <button
                onClick={() => go(idx - 1, -1)}
                aria-label="上一段經歷"
                className="absolute top-1/2 -translate-y-1/2 left-2 md:-left-5 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-gold hover:border-gold/40 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => go(idx + 1, 1)}
                aria-label="下一段經歷"
                className="absolute top-1/2 -translate-y-1/2 right-2 md:-right-5 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-gold hover:border-gold/40 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* SEO：未顯示的經歷文字仍留在 DOM（不可見、不進無障礙樹） */}
        <div hidden aria-hidden="true">
          {experiences.map((exp) =>
            exp.id === current.id ? null : (
              <div key={exp.id}>
                <h3>
                  {exp.role} — {exp.org}
                </h3>
                <p>{exp.summary}</p>
              </div>
            ),
          )}
        </div>

        {/* 圓點 + 計數（一段一個圓點） */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-4 mt-7">
            <div className="flex gap-2">
              {experiences.map((exp, i) => (
                <button
                  key={exp.id}
                  onClick={() => go(i, i > idx ? 1 : -1)}
                  aria-label={`第 ${i + 1} 段：${exp.role}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === idx ? 'w-6 bg-gold' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-white/30 tabular-nums">
              {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default CareerCarousel;
