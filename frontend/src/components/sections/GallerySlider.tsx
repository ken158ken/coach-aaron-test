/**
 * GallerySlider - 相片輪播 3D Coverflow 手動翻頁
 * @module components/sections/GallerySlider
 * @description 左右各露出前後一張卡，透視旋轉進退 (coverflow)
 *              is_published=false 時首頁隱藏；preview=true 強制顯示
 */

import React, { useState, useEffect, useRef, CSSProperties } from "react";
import { slidesService, type GallerySlide, type GalleryConfig } from "@/services/slides.service";

interface GallerySliderProps {
  preview?: boolean;
  initialSlides?: GallerySlide[];
  initialConfig?: GalleryConfig;
}

// ─── 位置計算工具 ─────────────────────────────────────────────
function getRelPos(i: number, current: number, total: number): number {
  let p = (i - current + total) % total;
  if (p > total / 2) p -= total;
  return p;
}

const CARD_W  = 520;  // 卡片寬度 px（橫版較寬）
const OFFSET  = 380;  // 左右卡中心偏移量 px
const ROT     = 18;   // 旋轉角度 deg
const S_SCALE = 0.80; // 側卡縮放
const S_OPA   = 0.45; // 側卡不透明度

function cardStyle(pos: number): CSSProperties {
  const T = 'all 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  const base: CSSProperties = { position: 'absolute', top: 0, left: '50%', width: CARD_W, transition: T };

  if (pos === 0) return {
    ...base,
    transform: 'translateX(-50%) perspective(1200px) rotateY(0deg) scale(1)',
    opacity: 1, zIndex: 10, pointerEvents: 'auto',
  };
  if (pos === -1) return {
    ...base,
    transform: `translateX(calc(-50% - ${OFFSET}px)) perspective(1200px) rotateY(${ROT}deg) scale(${S_SCALE})`,
    opacity: S_OPA, zIndex: 5, pointerEvents: 'auto', cursor: 'pointer',
  };
  if (pos === 1) return {
    ...base,
    transform: `translateX(calc(-50% + ${OFFSET}px)) perspective(1200px) rotateY(-${ROT}deg) scale(${S_SCALE})`,
    opacity: S_OPA, zIndex: 5, pointerEvents: 'auto', cursor: 'pointer',
  };
  // 更遠的隱藏牌
  const sign = pos > 0 ? '+' : '-';
  return {
    ...base,
    transform: `translateX(calc(-50% ${sign} ${OFFSET * 2.2}px)) perspective(1200px) rotateY(${pos > 0 ? -ROT * 2 : ROT * 2}deg) scale(0.60)`,
    opacity: 0, zIndex: 1, pointerEvents: 'none',
  };
}

// ─── Component ────────────────────────────────────────────────
const GallerySlider: React.FC<GallerySliderProps> = ({
  preview = false,
  initialSlides,
  initialConfig,
}) => {
  const [slides, setSlides] = useState<GallerySlide[]>(initialSlides ?? []);
  const [config, setConfig] = useState<GalleryConfig>(
    initialConfig ?? { is_published: true },
  );
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(!initialSlides);

  // 觸控滑動追蹤
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (initialSlides) return;
    (async () => {
      try {
        const [s, c] = await Promise.all([
          slidesService.getGallery(),
          slidesService.getGalleryConfig(),
        ]);
        setSlides(s); setConfig(c);
      } catch { /* 靜默 */ } finally { setLoading(false); }
    })();
  }, [initialSlides]);

  const next = () => setCurrent(i => (i + 1) % slides.length);
  const prev = () => setCurrent(i => (i - 1 + slides.length) % slides.length);

  // 觸控滑動
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };

  // 鍵盤導航
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (!preview && !config.is_published) return null;
  if (loading) return <div className="py-20 text-center text-white/30 text-sm">載入中...</div>;
  if (!slides.length) return null;

  // 舞台高度 = 卡片高度(16:10 比例) + 底部指示器
  const STAGE_H = Math.round(CARD_W * (10 / 16)) + 20;

  return (
    <section className="py-16 sm:py-20">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12 px-4" data-aos="fade-up">
        <span className="text-gold text-xs uppercase tracking-widest">Gallery</span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">相片記錄</h2>
        <p className="mt-2 text-sm text-white/40">每張照片背後都有一個真實的蛻變故事</p>
      </div>

      {/* Coverflow Stage */}
      <div
        className="relative overflow-hidden"
        style={{ height: STAGE_H }}
        data-aos="fade-up"
        data-aos-delay="100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
              style={cardStyle(pos)}
              onClick={() => {
                if (isLeft)  prev();
                if (isRight) next();
              }}
            >
              {/* Card body */}
              <div
                className={`rounded-2xl border overflow-hidden shadow-xl shadow-black/40 transition-colors duration-300 ${
                  isCenter ? 'border-gold/25' : 'border-white/5'
                }`}
              >
                {/* Image — 16:10 橫版 */}
                <div className="relative" style={{ aspectRatio: '16/10', background: 'rgba(255,255,255,0.05)' }}>
                  <img
                    src={slide.image_url}
                    alt={slide.caption || `相片 ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Caption overlay — 只在中央卡顯示 */}
                  {isCenter && slide.caption && (
                    <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white/90 text-sm sm:text-base font-light">{slide.caption}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 側卡提示箭頭 */}
              {(isLeft || isRight) && (
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-black/55 border border-gold/20 text-white/50 ${
                  isLeft ? 'right-3' : 'left-3'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isLeft ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        {/* Left / Right edge gradient */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-36 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-36 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />

        {/* Nav arrows (above gradient) */}
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

      {/* Counter + Dot indicators */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 px-4">
          <span className="text-xs text-white/30 tabular-nums">
            {current + 1} / {slides.length}
          </span>
          <div className="flex gap-1.5">
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
        </div>
      )}
    </section>
  );
};

export default GallerySlider;
