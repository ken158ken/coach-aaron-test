/**
 * AnimatedTestimonials — Aceternity「animated-testimonials」的 Vite 適配版
 * 參考：https://ui.aceternity.com/components/animated-testimonials
 *
 * 與原版差異（刻意調整，避免膨脹 bundle / 破壞 SSR）：
 *   - 動畫改用專案既有的 framer-motion（原版用 motion/react）
 *   - 箭頭圖示改 inline SVG（原版用 @tabler/icons-react，不引入）
 *   - 圖片用一般 <img>（原版用 next/image）
 *   - 卡片旋轉角度改為「依索引的固定值」而非 Math.random()，
 *     避免 SSR / hydration 不一致（本元件雖多在 LazySection 內 client 渲染，
 *     仍保持確定性較安全）
 *   - 無圖片時顯示主題色佔位面板（含首字/徽章），供尚未上傳照片的情境
 *
 * 新增的互動 props（供 CareerCarousel 的需求）：
 *   - autoplayMs      自動輪播間隔（預設 5000）
 *   - pauseOnHover    hover 時暫停倒數（預設 true）
 *   - advanceOnClick  點擊圖片換下一張（預設 false）
 *   - showClickHint   hover 時顯示「點擊看下一段」提示（預設 false）
 *   - hoverScale      hover 時圖片稍微放大（預設 false）
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface AnimatedTestimonialItem {
  /** 主要文字（見證引言 / 經歷簡述） */
  quote: string;
  /** 名稱（姓名 / 職稱） */
  name: string;
  /** 副標（身份 / 單位・期間） */
  designation: string;
  /** 圖片網址；留空則顯示佔位面板 */
  src?: string;
  /** 圖片上的小徽章（例如經歷期間），可省略 */
  badge?: string;
}

interface AnimatedTestimonialsProps {
  testimonials: AnimatedTestimonialItem[];
  autoplay?: boolean;
  autoplayMs?: number;
  pauseOnHover?: boolean;
  advanceOnClick?: boolean;
  showClickHint?: boolean;
  hoverScale?: boolean;
  /** 點擊提示文字（showClickHint 為 true 時顯示） */
  clickHintText?: string;
}

// 依索引決定的固定旋轉角度（取代 Math.random，確保確定性）
const ROTATIONS = [-9, 7, -5, 9, -7, 5, -3, 8];

export const AnimatedTestimonials: React.FC<AnimatedTestimonialsProps> = ({
  testimonials,
  autoplay = false,
  autoplayMs = 5000,
  pauseOnHover = true,
  advanceOnClick = false,
  showClickHint = false,
  hoverScale = false,
  clickHintText = '點擊看下一張',
}) => {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const total = testimonials.length;
  const handleNext = () => setActive((p) => (p + 1) % total);
  const handlePrev = () => setActive((p) => (p - 1 + total) % total);
  const isActive = (index: number) => index === active;

  // 自動輪播；hover（若 pauseOnHover）或 reduce-motion 時暫停
  useEffect(() => {
    if (!autoplay || total <= 1 || reduceMotion) return;
    if (pauseOnHover && hovered) return;
    const t = setInterval(handleNext, autoplayMs);
    return () => clearInterval(t);
  }, [autoplay, total, reduceMotion, pauseOnHover, hovered, autoplayMs]);

  if (!total) return null;

  const current = testimonials[active];

  return (
    <div className="mx-auto max-w-sm px-4 md:max-w-4xl md:px-8">
      <div className="relative grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
        {/* ── 圖片堆疊 ─────────────────────────────── */}
        <div
          className={`relative h-72 sm:h-80 w-full ${
            advanceOnClick ? 'cursor-pointer' : ''
          } group/photo`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={advanceOnClick ? handleNext : undefined}
          role={advanceOnClick ? 'button' : undefined}
          aria-label={advanceOnClick ? '下一段' : undefined}
        >
          <AnimatePresence>
            {testimonials.map((t, index) => (
              <motion.div
                key={`${t.name}-${index}`}
                initial={{ opacity: 0, scale: 0.9, rotate: ROTATIONS[index % ROTATIONS.length] }}
                animate={{
                  opacity: isActive(index) ? 1 : 0.55,
                  scale: isActive(index)
                    ? hoverScale && hovered
                      ? 1.03
                      : 1
                    : 0.94,
                  rotate: isActive(index) ? 0 : ROTATIONS[index % ROTATIONS.length],
                  zIndex: isActive(index) ? 40 : total + 2 - index,
                  y: isActive(index) ? [0, -40, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.9, rotate: ROTATIONS[index % ROTATIONS.length] }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="absolute inset-0 origin-bottom"
              >
                <PhotoOrPlaceholder item={t} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 點擊提示（hover 時淡入） */}
          {showClickHint && (
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-3 z-50 flex justify-center transition-opacity duration-300 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="rounded-full bg-black/60 backdrop-blur-sm border border-gold/30 text-gold text-xs px-3 py-1">
                {clickHintText} →
              </span>
            </div>
          )}
        </div>

        {/* ── 文字區 ───────────────────────────────── */}
        <div className="flex flex-col justify-between py-2 md:py-4">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <h3 className="text-xl sm:text-2xl font-light text-white/90 leading-tight">
              {current.name}
            </h3>
            <p className="mt-1 text-sm text-white/40">{current.designation}</p>

            <motion.p className="mt-6 text-base sm:text-lg text-white/70 leading-relaxed">
              {reduceMotion
                ? current.quote
                : Array.from(current.quote).map((ch, i) => (
                    <motion.span
                      key={`${active}-${i}`}
                      initial={{ filter: 'blur(8px)', opacity: 0, y: 4 }}
                      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut', delay: 0.012 * i }}
                      className="inline-block"
                    >
                      {ch === ' ' ? ' ' : ch}
                    </motion.span>
                  ))}
            </motion.p>
          </motion.div>

          {/* 上一張 / 下一張 + 圓點 */}
          <div className="flex items-center gap-4 pt-8 md:pt-6">
            {total > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  aria-label="上一張"
                  className="group/btn w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/40 transition-colors"
                >
                  <svg className="w-4 h-4 transition-transform group-hover/btn:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  aria-label="下一張"
                  className="group/btn w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/40 transition-colors"
                >
                  <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="flex gap-1.5 ml-1">
                  {testimonials.map((t, i) => (
                    <button
                      key={`dot-${t.name}-${i}`}
                      onClick={() => setActive(i)}
                      aria-label={`第 ${i + 1} 張`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === active ? 'w-5 bg-gold' : 'w-1.5 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SEO / 無障礙：所有項目的文字都留在 DOM（不可見、不進無障礙樹） */}
      <div hidden aria-hidden="true">
        {testimonials.map((t, i) => (
          <div key={`seo-${t.name}-${i}`}>
            <h3>{t.name} — {t.designation}</h3>
            <p>{t.quote}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 有圖顯示圖，無圖顯示主題色佔位面板（首字/徽章） */
const PhotoOrPlaceholder: React.FC<{ item: AnimatedTestimonialItem; index: number }> = ({
  item,
  index,
}) => (
  <div className="relative h-full w-full rounded-3xl overflow-hidden">
    {item.src ? (
      <img
        src={item.src}
        alt={item.name}
        draggable={false}
        loading="lazy"
        className="h-full w-full object-cover object-center"
      />
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-white/[0.06] to-black/40">
        <span className="text-6xl font-thin text-gold/25 leading-none">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="text-sm text-white/40">{item.name}</span>
      </div>
    )}
    {/* 底部漸層 + 徽章 */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
    {item.badge && (
      <span className="absolute left-4 bottom-4 text-xs bg-black/40 backdrop-blur-sm text-gold border border-gold/25 px-3 py-1 rounded-full">
        {item.badge}
      </span>
    )}
  </div>
);

export default AnimatedTestimonials;
