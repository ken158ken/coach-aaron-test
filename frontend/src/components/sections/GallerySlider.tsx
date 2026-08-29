/**
 * GallerySlider - 相片輪播 3D Coverflow + Focus Cards 聚焦效果
 * @module components/sections/GallerySlider
 * @description 左右各露出前後一張卡，透視旋轉進退 (coverflow)
 *              hover 時聚焦中央卡，側卡 blur/dim；framer-motion spring 動畫
 *              is_published=false 時首頁隱藏；preview=true 強制顯示
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  slidesService,
  type GallerySlide,
  type GalleryConfig,
} from '@/services/site/slides.service';
import Sparkles from '@/components/ui/Sparkles';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useLanguage } from '@/context/LanguageContext';

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

const CARD_W = 520; // 卡片寬度 px
const OFFSET = 380; // 左右卡中心偏移量 px
const ROT = 18; // 旋轉角度 deg
const S_SCALE = 0.8; // 側卡縮放
const S_OPA = 0.35; // 側卡不透明度（Focus Cards: 更暗）

// ─── 單張卡片（Focus Cards 3D tilt + animate position） ───────
interface SlideCardProps {
  slide: GallerySlide;
  pos: number;
  index: number;
  isFocused: boolean; // 整個輪播正在被 hover
  onClick?: () => void;
}

const SlideCard: React.FC<SlideCardProps> = ({
  slide,
  pos,
  index,
  isFocused,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const copy = t.gallery;

  // 3D tilt — 只在中央卡 (pos===0) 啟用
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]: string[]) =>
      `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.10) 0%, transparent 65%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pos !== 0) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // 位置動畫值
  const isCenter = pos === 0;
  const isLeft = pos === -1;
  const isRight = pos === 1;
  const isHidden = !isCenter && !isLeft && !isRight;

  const x = isCenter
    ? '-50%'
    : isLeft
      ? `calc(-50% - ${OFFSET}px)`
      : isRight
        ? `calc(-50% + ${OFFSET}px)`
        : pos > 0
          ? `calc(-50% + ${OFFSET * 2.2}px)`
          : `calc(-50% - ${OFFSET * 2.2}px)`;
  const rotateY_ = isCenter
    ? 0
    : isLeft
      ? ROT
      : isRight
        ? -ROT
        : pos > 0
          ? -ROT * 2
          : ROT * 2;
  const scale = isCenter ? 1 : isLeft || isRight ? S_SCALE : 0.6;

  // Focus Cards 效果：輪播被 hover 且自己是側卡 → 更暗更模糊
  const opacity = isHidden ? 0 : isCenter ? 1 : isFocused ? S_OPA * 0.6 : S_OPA;
  const blur = isCenter ? 0 : isFocused ? 3 : 0;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: CARD_W,
        x,
        rotateY: rotateY_,
        scale,
        opacity,
        filter: blur > 0 ? `blur(${blur}px) brightness(0.65)` : undefined,
        transformStyle: isCenter ? 'preserve-3d' : undefined,
        zIndex: isCenter ? 10 : isLeft || isRight ? 5 : 1,
        pointerEvents: isHidden ? 'none' : 'auto',
        cursor: isLeft || isRight ? 'pointer' : 'default',
        perspective: isCenter ? '1000px' : undefined,
      }}
      animate={{ opacity, scale, rotateY: rotateY_ }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
    >
      {/* 3D tilt 只套在中央卡 */}
      <motion.div style={isCenter ? { rotateX, rotateY } : {}}>
        {/* Glare 高光 — 只在中央卡 */}
        {isCenter && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
            style={{ background: glareBg }}
          />
        )}

        {/* Card body */}
        <div
          className={`rounded-2xl border overflow-hidden shadow-xl shadow-black/40 transition-colors duration-300 ${
            isCenter ? 'border-gold/25' : 'border-white/5'
          }`}
        >
          {/* Image — 16:10 橫版 */}
          <div
            className="relative"
            style={{
              aspectRatio: '16/10',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <img
              src={slide.image_url}
              alt={slide.caption || copy.photoAlt.replace('{n}', String(index + 1))}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Caption overlay — 只在中央卡顯示 */}
            {isCenter && slide.caption && (
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-linear-to-t from-black/70 to-transparent">
                <p className="text-white/90 text-sm sm:text-base font-light">
                  {slide.caption}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 側卡提示箭頭 */}
        {(isLeft || isRight) && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-black/55 border border-gold/20 text-white/50 ${
              isLeft ? 'right-3' : 'left-3'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isLeft ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
              />
            </svg>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Component ────────────────────────────────────────────────
const GallerySlider: React.FC<GallerySliderProps> = ({
  preview = false,
  initialSlides,
  initialConfig,
}) => {
  const [slides, setSlides] = useState<GallerySlide[]>(initialSlides ?? []);
  const [config, setConfig] = useState<GalleryConfig>(
    initialConfig ?? { is_published: true }
  );
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(!initialSlides);
  const [isHovered, setIsHovered] = useState(false);

  const { get } = useSiteContent();
  const { t, isZhTW } = useLanguage();
  const copy = t.gallery;

  /**
   * site_content 只存中文（`GET /api/content` 未回傳 content_value_en）：
   * 中文模式 DB 值優先，英文模式一律用字典。
   */
  const pick = (key: string, dict: string): string =>
    isZhTW ? get(key, dict) : dict;

  const gHeader = {
    tagline: pick('gallery_tagline', copy.tagline),
    // 與 DirectionAwareGallery 分工：本區＝培訓現場（課程／講座照），
    // Moments＝幕後／團隊／日常，避免兩區標題語意重疊
    title: pick('gallery_title', copy.title),
    subtitle: pick('gallery_subtitle', copy.subtitle),
  };

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
        setSlides(s);
        setConfig(c);
      } catch {
        /* 靜默 */
      } finally {
        setLoading(false);
      }
    })();
  }, [initialSlides]);

  const next = () => setCurrent((i) => (i + 1) % slides.length);
  const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);

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
  if (loading)
    return (
      <div className="py-20 text-center text-white/30 text-sm">
        {t.common.loading}
      </div>
    );
  if (!slides.length) return null;

  const STAGE_H = Math.round(CARD_W * (10 / 16)) + 20;

  return (
    <section className="py-16 sm:py-20">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12 px-4" data-aos="fade-up">
        <Sparkles color="#c5a059">
          <span className="text-gold text-xs uppercase tracking-widest">
            {gHeader.tagline}
          </span>
        </Sparkles>
        <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
          {gHeader.title}
        </h2>
        <p className="mt-2 text-sm text-white/40">{gHeader.subtitle}</p>
      </div>

      {/* Coverflow Stage */}
      <div
        className="relative overflow-hidden"
        style={{ height: STAGE_H }}
        data-aos="fade-up"
        data-aos-delay="100"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Cards */}
        <AnimatePresence initial={false}>
          {slides.map((slide, i) => {
            const pos = getRelPos(i, current, slides.length);
            return (
              <SlideCard
                key={slide.id}
                slide={slide}
                pos={pos}
                index={i}
                isFocused={isHovered}
                onClick={() => {
                  if (pos === -1) prev();
                  if (pos === 1) next();
                }}
              />
            );
          })}
        </AnimatePresence>

        {/* Left / Right edge gradient */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-36 bg-linear-to-r from-black to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-36 bg-linear-to-l from-black to-transparent z-20 pointer-events-none" />

        {/* Nav arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label={copy.prev}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 border border-gold/25 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/50 hover:bg-black/80 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label={copy.next}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 border border-gold/25 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/50 hover:bg-black/80 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
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
                aria-label={copy.slideLabel.replace('{n}', String(i + 1))}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-6 bg-gold'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
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
