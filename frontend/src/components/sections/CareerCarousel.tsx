/**
 * CareerCarousel - 其他人設經歷輪播
 * @module components/sections/CareerCarousel
 *
 * @description
 * 一次顯示 N 筆經歷、整組換場、下方一組一個圓點。
 * 改造自舊的 `CardStackTestimonial.tsx`（合併學員見證區塊後回收其輪播邏輯），
 * 因此不需要引入任何新套件 —— 只用專案既有的 framer-motion。
 *
 * 顯示筆數：桌機 2 筆、手機 1 筆（useMediaQuery，SSR 下先以手機值渲染，
 * 初值在 server / client 首次渲染皆為 false，不會造成 hydration mismatch）。
 *
 * ─── 文案替換說明 ──────────────────────────────────────────────
 * 正式文案產出後，只需改下方兩個常數即可，元件邏輯無須更動：
 *   - `CAREER_COPY`        區塊標題／副標（可再被 site_content 覆寫）
 *   - `CAREER_EXPERIENCES` 三段經歷內容
 * 未來若要改為後台可編輯，把 `CAREER_EXPERIENCES` 換成 API 回傳的同型別
 * 陣列即可（型別為 `CareerExperience[]`），其餘程式碼不動。
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
  /** 亮點數字（可省略） */
  highlight?: {
    value: string;
    label: string;
  };
}

// ─── 文案（定稿版，來源 REPORTS/INDEX_B2B文案_定稿草案.md 第 6 節）──

/**
 * 區塊標題文案；同名的 site_content key 若有值會優先採用。
 *
 * 這一區是「商業背書」而非體態背書：它要回答訪客唯一的問題「你憑什麼教我做業績？」
 * 銷售實戰（房仲）→ 第一線私教（成吉思汗）→ 教練團隊管理（威豪總教官）。
 *
 * 主標題備選：'一條不典型的路' ／ '職涯三段'
 * 導言備選：
 *   B 案：'我沒有體育科班背景，這反而是我最大的資產。因為我是從外面的商業世界走進健身房的，
 *          所以我看得見教練們看不見的那一塊。'
 *   C 案：'銷售、私教、管理。三個身分，一條線，通往同一件事：怎麼讓專業變成收入。'
 */
const CAREER_COPY = {
  tagline: 'Career Path',
  title: '我憑什麼教你做業績',
  subtitle:
    '教練變現這件事，我不是讀來的。賣過最難賣的東西、自己在第一線賣過課、也帶過一整團教練衝業績——這三段加起來，才是我現在能教你的原因。',
} as const;

/**
 * 三段經歷（定稿文案）。
 *
 * ⚠️ 依人設提案紅線與待佐證清單：
 *   - 房仲「單月業績約 200 萬」標為低信心／建議模糊化 → 已移除 highlight
 *   - 私教「月入約 8 萬」標為待佐證 → 已移除 highlight，客戶確認後可加回
 *   - 威豪一律稱「在地健身房總教官」，不得寫「大型健身房」
 */
export const CAREER_EXPERIENCES: CareerExperience[] = [
  {
    // 標題備選：'從房仲開始，我先學會了成交' ／ '房仲業務經紀人'
    id: 'realtor',
    period: '早期・業務時期',
    role: '房仲業務經紀人｜先學會賣最難賣的東西',
    org: '房仲不動產業',
    summary:
      '我的職涯不是從健身房開始的，是從房仲開始的。這段時間讓我學會的不是話術，是讀人。',
    bullets: [
      '開發、帶看、探詢需求、議價、促成，一套完整銷售流程跑過無數遍',
      '在成交週期以「月」計算、被拒絕是日常的環境裡練出韌性',
      '看懂客戶說「我再考慮」時，真正在意的到底是什麼',
      '這是我後來能把銷售心理學帶進健身產業的底層能力',
    ],
    // ⚠️ 履歷載有「單月業績約 200 萬」，人設提案標為低信心／建議模糊化，
    //    客戶提供佐證後可解除註解：
    // highlight: { value: '200 萬', label: '單月業績' },
  },
  {
    // 標題備選：'轉職進健身房，我從一堂課賣起' ／ '私人教練 @ 成吉思汗健身'
    id: 'personal-trainer',
    period: '轉職・入行',
    role: '成吉思汗私人教練｜自己先站上第一線',
    org: '成吉思汗健身（連鎖健身品牌）',
    summary:
      '我把業務時期的銷售能力直接搬進健身房，很快建立起穩定的私教客群。專業和銷售不是二選一，雙軌並進才走得遠。',
    bullets: [
      '在連鎖體系擔任私人教練，做體能評估、身體組成分析與個人化課表',
      '同時負責諮詢、成交與續課，完整走過第一線私教的收入循環',
      '我教的每一套成交流程，都是自己親手跑過、被拒絕過、再修正出來的',
    ],
    // ⚠️ 履歷載有「私教月入約 8 萬」，人設提案標為待佐證，
    //    客戶確認可用後可解除註解（並可於 summary 末補一句「我自己的私教月收入曾做到 8 萬。」）：
    // highlight: { value: '8 萬', label: '私教月收入' },
  },
  {
    // 標題備選：'總教官｜帶 50 人教練團隊' ／ '教練經理 @ 威豪健身 Pro Fitness'
    id: 'head-coach',
    period: '現職・教練經理／總教官',
    role: '威豪健身總教官｜從做業績，到教一整團人做業績',
    org: '威豪健身 Pro Fitness（台東）・現任',
    summary:
      '帶團隊之後我才真正看懂——一個人業績好是天賦，一整團業績都好，那是系統。',
    bullets: [
      '統籌約 50 人教練團隊：排班調度、教學品質管控、招募面試與客訴處理',
      '設定並追蹤業績與續約 KPI，建立教練育成與考核制度',
      '把「怎麼成交」「怎麼續約」拆成可以教、可以複製、可以考核的標準',
      '這也是我現在教教練的方式：不給你一套話術，給你一套能自己運轉的系統',
    ],
    highlight: { value: '50 人', label: '教練團隊' },
  },
];

/** 自動輪播間隔（ms） */
const AUTOPLAY_MS = 4500;

// ─── 單張經歷卡 ───────────────────────────────────────────────

const ExperienceCard: React.FC<{ exp: CareerExperience; index: number }> = ({
  exp,
  index,
}) => (
  <motion.article
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className="bg-surface border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col gap-4 hover:border-gold/25 transition-colors duration-300"
  >
    {/* 期間標籤 */}
    <span className="self-start text-xs bg-gold/15 text-gold border border-gold/20 px-2.5 py-1 rounded-full">
      {exp.period}
    </span>

    {/* 職稱 / 單位 */}
    <div>
      <h3 className="text-lg sm:text-xl font-light text-white/90 leading-tight">
        {exp.role}
      </h3>
      <p className="mt-1 text-sm text-white/40">{exp.org}</p>
    </div>

    {/* 簡述 */}
    <p className="text-white/70 text-sm leading-relaxed">{exp.summary}</p>

    {/* Divider */}
    <div className="w-8 h-px bg-gold/30" />

    {/* 重點條列 */}
    <ul className="space-y-2 flex-1">
      {exp.bullets.map((b, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
          <span className="w-1.5 h-1.5 mt-1.5 bg-gold rounded-full shrink-0" />
          {b}
        </li>
      ))}
    </ul>

    {/* 亮點數字 */}
    {exp.highlight && (
      <div className="pt-3 border-t border-white/5">
        <span className="text-gold text-xl sm:text-2xl font-light">
          {exp.highlight.value}
        </span>
        <span className="ml-2 text-xs text-white/40">
          {exp.highlight.label}
        </span>
      </div>
    )}
  </motion.article>
);

// ─── Component ────────────────────────────────────────────────

interface CareerCarouselProps {
  /** 覆寫經歷資料（預設用內建常數；未來接 DB 時由此傳入） */
  experiences?: CareerExperience[];
}

const CareerCarousel: React.FC<CareerCarouselProps> = ({
  experiences = CAREER_EXPERIENCES,
}) => {
  const [groupIdx, setGroupIdx] = useState(0);
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward
  const [paused, setPaused] = useState(false);

  const { get } = useSiteContent();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // 桌機一次 2 筆、手機一次 1 筆
  const perPage = isDesktop ? 2 : 1;
  const totalGroups = Math.ceil(experiences.length / perPage);

  // 斷點變化導致組數變少時，避免 groupIdx 越界
  useEffect(() => {
    setGroupIdx((i) => (i >= totalGroups ? 0 : i));
  }, [totalGroups]);

  // 自動輪播；hover 中或使用者要求減少動態時停止
  useEffect(() => {
    if (totalGroups <= 1 || paused || reduceMotion) return;
    const t = setInterval(() => {
      setDirection(1);
      setGroupIdx((i) => (i + 1) % totalGroups);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [totalGroups, paused, reduceMotion]);

  if (!experiences.length) return null;

  const start = groupIdx * perPage;
  const groupItems = experiences.slice(start, start + perPage);
  // 未輪到的經歷仍保留在 HTML 裡（display:none），避免職稱／單位對 SEO 消失
  const hiddenItems = experiences.filter((e) => !groupItems.includes(e));

  const goTo = (idx: number) => {
    setDirection(idx > groupIdx ? 1 : -1);
    setGroupIdx(idx);
  };

  return (
    <section className="py-16 sm:py-20 px-4 bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-gold text-xs uppercase tracking-widest">
            {get('career_tagline', CAREER_COPY.tagline)}
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
            {get('career_title', CAREER_COPY.title)}
          </h2>
          <p className="mt-2 text-sm text-white/40">
            {get('career_subtitle', CAREER_COPY.subtitle)}
          </p>
        </div>

        {/* 一次 N 筆、整組換場 */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={groupIdx}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 40 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch"
            >
              {groupItems.map((exp, i) => (
                <ExperienceCard key={exp.id} exp={exp} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SEO：未顯示的經歷文字仍留在 DOM（不可見、不進無障礙樹） */}
        <div hidden aria-hidden="true">
          {hiddenItems.map((exp) => (
            <div key={exp.id}>
              <h3>
                {exp.role} — {exp.org}
              </h3>
              <p>{exp.summary}</p>
            </div>
          ))}
        </div>

        {/* Dot indicators（一組一個圓點） */}
        {totalGroups > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalGroups }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`第 ${i + 1} 組經歷`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === groupIdx
                    ? 'w-6 bg-gold'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CareerCarousel;
