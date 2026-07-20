/**
 * ServicesSection - 主要服務項目與專長（精簡・需求導向版）
 * @module components/sections/ServicesSection
 *
 * @description
 * 精簡版：不再把 9 門課全部列出，而是收斂成「三種需求 → 三種服務」的
 * 三張卡片，一列排完。每張卡對應一個客戶痛點（成交/續約卡關、想單點補強、
 * 想針對自己客製），並用真實 `courses` 資料算出「幾門方案／起價」，
 * 點擊帶到課程總覽看完整內容。
 *
 * 為什麼這樣做：首頁要「快速提出需求 + 有動畫」，不需要在首頁就攤開所有課程；
 * 課程明細留在 /courses。這樣首頁篇幅大幅縮短、資訊層次更清楚。
 *
 * 動畫：framer-motion whileInView 逐張淡入上移（不引入新套件）。
 * 資料仍來自 courseService.getCourses()（GET /api/courses），沿用
 * show_price 規則計算起價。SSR：資料在 useEffect 取得，載入中顯示等高骨架。
 *
 * ─── 文案替換說明 ──────────────────────────────────────────────
 * 區塊標題可由 site_content 的 services_tagline / services_title /
 * services_subtitle 覆寫；三張卡的痛點與說明改 `NEED_CARDS` 即可。
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '@/services';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { Course } from '@/types';

// ─── 文案（來源 REPORTS/INDEX_B2B文案_定稿草案.md 第 3 節）──

const SERVICES_COPY = {
  tagline: 'Services',
  title: '你現在卡在哪一關？',
  subtitle: '三種需求、三種服務。不必全買，從最痛的那一個先解決。',
  inquirePrice: '價格洽詢',
  free: '免費',
  from: '起',
  cta: '看完整課程',
} as const;

/**
 * 三張需求卡。`match` 用關鍵字比對 course_category，
 * 藉此把該類課程的「門數」與「起價」動態算進卡片。
 */
interface NeedCard {
  key: string;
  /** 對應課程分類的關鍵字 */
  match: string[];
  /** 痛點（eyebrow） */
  need: string;
  /** 服務名稱 */
  title: string;
  /** 一句話說明（精簡） */
  blurb: string;
  /** 點擊前往（課程總覽） */
  to: string;
}

const NEED_CARDS: NeedCard[] = [
  {
    key: 'coaching',
    match: ['陪跑'],
    need: '想要整套系統、有人陪著落地',
    title: '變現陪跑方案',
    blurb: '每週覆盤、追蹤邀約與成交數、訊息隨時問——把變現系統真正裝進你的日常。',
    to: '/courses',
  },
  {
    key: 'online',
    match: ['線上'],
    need: '先從最痛的一個關卡補強',
    title: '線上課程',
    blurb: '體驗課成交、反對問題、續約話術——單點突破，隨時可看、無觀看期限。',
    to: '/courses',
  },
  {
    key: 'oneonone',
    match: ['一對一', '1對1'],
    need: '想針對自己的數字客製',
    title: '一對一諮詢',
    blurb: '課程講通則，你的瓶頸是你自己的。不給模板，直接從你的狀況下手。',
    to: '/courses',
  },
];

/** 某一分類的統計（門數 + 起價文字） */
interface NeedStat {
  count: number;
  priceText: string | null;
}

/** 計算某張需求卡對應分類的門數與起價 */
function statFor(card: NeedCard, courses: Course[]): NeedStat {
  const matched = courses.filter((c) => {
    const cat = c.course_category?.trim() || '';
    return card.match.some((m) => cat.includes(m));
  });
  if (matched.length === 0) return { count: 0, priceText: null };

  // 起價：只看有開放售價、且價格 > 0 的課程，取最小值
  const prices = matched
    .filter((c) => c.show_price && c.price && c.price > 0)
    .map((c) => c.price as number);

  let priceText: string | null;
  if (prices.length === 0) {
    priceText = SERVICES_COPY.inquirePrice;
  } else {
    const min = Math.min(...prices);
    priceText = `NT$ ${min.toLocaleString()} ${SERVICES_COPY.from}`;
  }
  return { count: matched.length, priceText };
}

// ─── Component ────────────────────────────────────────────────

const ServicesSection: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { get } = useSiteContent();

  useEffect(() => {
    let cancelled = false;
    courseService
      .getCourses()
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .catch((err) => {
        console.warn('[ServicesSection] 載入課程失敗', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-16 sm:py-20 px-4 bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-gold text-xs uppercase tracking-widest">
            {get('services_tagline', SERVICES_COPY.tagline)}
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
            {get('services_title', SERVICES_COPY.title)}
          </h2>
          <p className="mt-2 text-sm text-white/40 max-w-xl mx-auto">
            {get('services_subtitle', SERVICES_COPY.subtitle)}
          </p>
        </div>

        {/* 三張需求卡，一列排完 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {NEED_CARDS.map((card, i) => {
            const stat = loading ? null : statFor(card, courses);
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  delay: Math.min(i, 4) * 0.1,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link
                  to={card.to}
                  className="group h-full flex flex-col gap-3 bg-surface border border-white/10 rounded-2xl p-6 sm:p-7 hover:border-gold/30 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* 痛點 eyebrow */}
                  <span className="text-xs text-gold/80 tracking-wide">
                    {card.need}
                  </span>

                  {/* 服務名稱 */}
                  <h3 className="text-lg sm:text-xl font-light text-white/90 group-hover:text-gold transition-colors duration-300">
                    {card.title}
                  </h3>

                  {/* 一句話說明 */}
                  <p className="text-sm text-white/55 leading-relaxed flex-1">
                    {card.blurb}
                  </p>

                  {/* 門數 + 起價 + 前往 */}
                  <div className="pt-3 mt-auto border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="text-xs text-white/40">
                      {stat === null ? (
                        <span className="inline-block w-16 h-3 rounded bg-white/10 animate-pulse align-middle" />
                      ) : stat.count > 0 ? (
                        <>
                          <span className="text-white/70">{stat.count}</span> 門方案
                          {stat.priceText && (
                            <span className="text-gold ml-2">{stat.priceText}</span>
                          )}
                        </>
                      ) : (
                        '方案整理中'
                      )}
                    </span>
                    <span className="text-xs text-white/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all duration-300 shrink-0">
                      {SERVICES_COPY.cta} →
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
