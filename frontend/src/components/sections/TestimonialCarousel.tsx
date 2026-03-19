/**
 * TestimonialCarousel - 學員見證 3D Coverflow 自動輪播
 * @module components/sections/TestimonialCarousel
 * @description 支援兩種版型：直立式 (portrait) 和橫式 (landscape)
 *              左右各露出前後一張卡，透視旋轉進退 (coverflow)
 *              is_published=false 時首頁隱藏；preview=true 強制顯示
 */

import React, { useState, useEffect, useCallback, CSSProperties } from "react";
import {
  slidesService,
  type TestimonialSlide,
  type TestimonialConfig,
} from "@/services/slides.service";

interface TestimonialCarouselProps {
  preview?: boolean;
  initialSlides?: TestimonialSlide[];
  initialConfig?: TestimonialConfig;
}

// ─── 位置計算工具 ─────────────────────────────────────────────
function getRelPos(i: number, current: number, total: number): number {
  let p = (i - current + total) % total;
  if (p > total / 2) p -= total;
  return p;
}

// ─── 版型常數 ─────────────────────────────────────────────────
const LAYOUTS = {
  portrait: {
    CARD_W:  280,
    OFFSET:  230,
    ROT:      14,
    S_SCALE: 0.84,
    S_OPA:   0.50,
    STAGE_H:  500,
  },
  landscape: {
    CARD_W:  380,
    OFFSET:  320,
    ROT:      16,
    S_SCALE: 0.82,
    S_OPA:   0.48,
    STAGE_H:  380,
  },
} as const;

function cardStyle(
  pos: number,
  layout: keyof typeof LAYOUTS,
): CSSProperties {
  const { CARD_W, OFFSET, ROT, S_SCALE, S_OPA } = LAYOUTS[layout];
  const T = 'all 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  const base: CSSProperties = { position: 'absolute', top: 0, left: '50%', width: CARD_W, transition: T };

  if (pos === 0) return {
    ...base,
    transform: 'translateX(-50%) perspective(1000px) rotateY(0deg) scale(1)',
    opacity: 1, zIndex: 10, pointerEvents: 'auto',
  };
  if (pos === -1) return {
    ...base,
    transform: `translateX(calc(-50% - ${OFFSET}px)) perspective(1000px) rotateY(${ROT}deg) scale(${S_SCALE})`,
    opacity: S_OPA, zIndex: 5, pointerEvents: 'auto', cursor: 'pointer',
  };
  if (pos === 1) return {
    ...base,
    transform: `translateX(calc(-50% + ${OFFSET}px)) perspective(1000px) rotateY(-${ROT}deg) scale(${S_SCALE})`,
    opacity: S_OPA, zIndex: 5, pointerEvents: 'auto', cursor: 'pointer',
  };
  const sign = pos > 0 ? '+' : '-';
  return {
    ...base,
    transform: `translateX(calc(-50% ${sign} ${OFFSET * 2.4}px)) perspective(1000px) rotateY(${pos > 0 ? -ROT * 2 : ROT * 2}deg) scale(0.65)`,
    opacity: 0, zIndex: 1, pointerEvents: 'none',
  };
}

// ─── Component ────────────────────────────────────────────────
const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  preview = false,
  initialSlides,
  initialConfig,
}) => {
  const [slides, setSlides]   = useState<TestimonialSlide[]>(initialSlides ?? []);
  const [config, setConfig]   = useState<TestimonialConfig>(
    initialConfig ?? { interval_ms: 4000, is_published: true, card_layout: 'portrait' },
  );
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(!initialSlides);
  const [paused,  setPaused]  = useState(false);

  useEffect(() => {
    if (initialSlides) return;
    (async () => {
      try {
        const [s, c] = await Promise.all([
          slidesService.getTestimonials(),
          slidesService.getTestimonialsConfig(),
        ]);
        setSlides(s); setConfig(c);
      } catch { /* 靜默 */ } finally { setLoading(false); }
    })();
  }, [initialSlides]);

  // 後台預覽切換版型時同步更新
  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

  const next = useCallback(() => setCurrent(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(i => (i - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const t = setInterval(next, config.interval_ms);
    return () => clearInterval(t);
  }, [slides.length, config.interval_ms, paused, next]);

  if (!preview && !config.is_published) return null;
  if (loading) return <div className="py-20 text-center text-white/30 text-sm">載入中...</div>;
  if (!slides.length) return null;

  const layout = config.card_layout ?? 'portrait';
  const { STAGE_H } = LAYOUTS[layout];
  const isLandscape = layout === 'landscape';

  return (
    <section className="py-16 sm:py-20">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12 px-4" data-aos="fade-up">
        <span className="text-gold text-xs uppercase tracking-widest">Student Reviews</span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">學員見證</h2>
        <p className="mt-2 text-sm text-white/40">真實的學員回饋，見證業績蛻變的歷程</p>
      </div>

      {/* Coverflow Stage */}
      <div
        className="relative overflow-hidden"
        style={{ height: STAGE_H }}
        data-aos="fade-up"
        data-aos-delay="100"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Cards */}
        {slides.map((slide, i) => {
          const pos      = getRelPos(i, current, slides.length);
          const isLeft   = pos === -1;
          const isRight  = pos ===  1;
          const isCenter = pos ===  0;

          return (
            <div
              key={slide.id}
              style={cardStyle(pos, layout)}
              onClick={() => {
                if (isLeft)  prev();
                if (isRight) next();
              }}
            >
              {/* Card body */}
              <div
                className={`bg-surface rounded-2xl border overflow-hidden shadow-lg shadow-black/30 transition-colors duration-300 ${
                  isCenter ? 'border-gold/20' : 'border-white/5'
                }`}
              >
                {isLandscape ? (
                  /* ── 橫式版型 ── */
                  <>
                    <div className="relative overflow-hidden bg-white/5" style={{ aspectRatio: '16/10' }}>
                      <img
                        src={slide.image_url}
                        alt={slide.name || '學員見證'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Quote overlay 在圖片底部 */}
                      {isCenter && slide.quote && (
                        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
                            「{slide.quote}」
                          </p>
                        </div>
                      )}
                    </div>
                    {isCenter && (
                      <div className="p-3 sm:p-4 flex flex-wrap items-center gap-2">
                        <span className="text-white/90 font-medium text-sm">{slide.name}</span>
                        {slide.achievement && (
                          <span className="text-xs bg-gold/15 text-gold border border-gold/20 px-2.5 py-1 rounded-full">
                            {slide.achievement}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* ── 直立式版型 ── */
                  <>
                    <div className="overflow-hidden bg-white/5" style={{ aspectRatio: '4/5' }}>
                      <img
                        src={slide.image_url}
                        alt={slide.name || '學員見證'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {isCenter && (
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <span className="text-white/90 font-medium text-sm">{slide.name}</span>
                          {slide.achievement && (
                            <span className="text-xs bg-gold/15 text-gold border border-gold/20 px-2.5 py-1 rounded-full shrink-0">
                              {slide.achievement}
                            </span>
                          )}
                        </div>
                        {slide.quote && (
                          <p className="text-white/55 text-xs sm:text-sm leading-relaxed">
                            「{slide.quote}」
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 側卡提示箭頭 */}
              {(isLeft || isRight) && (
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 border border-gold/20 text-white/50 ${
                  isLeft ? 'right-2' : 'left-2'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isLeft ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        {/* Edge gradients */}
        <div className="absolute inset-y-0 left-0 w-20 sm:w-28 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 sm:w-28 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />

        {/* Nav arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="上一張"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 border border-gold/25 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/50 hover:bg-black/80 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="下一張"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 border border-gold/25 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/50 hover:bg-black/80 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-6 px-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`第 ${i + 1} 張`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-gold' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TestimonialCarousel;
