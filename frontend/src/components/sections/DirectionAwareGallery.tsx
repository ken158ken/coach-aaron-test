/**
 * DirectionAwareGallery - 方向感知 Hover 相片庫
 * @module components/sections/DirectionAwareGallery
 * @description Aceternity Direction Aware Hover 風格：
 *              偵測滑鼠進入方向，overlay 從該方向滑入
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { slidesService, type GallerySlide } from '@/services/site/slides.service';
import { useSiteContent } from '@/hooks/useSiteContent';

type Dir = 'top' | 'bottom' | 'left' | 'right';

/** 根據滑鼠進入位置判斷方向 */
function detectDir(
  e: React.MouseEvent<HTMLDivElement>,
  el: HTMLDivElement
): Dir {
  const { left, top, width, height } = el.getBoundingClientRect();
  const x = (e.clientX - left) / width - 0.5;
  const y = (e.clientY - top) / height - 0.5;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'bottom' : 'top';
}

const OVERLAY_VARIANTS: Record<Dir, Variants> = {
  top: {
    initial: { y: '-100%', opacity: 0.8 },
    animate: { y: '0%', opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },
  bottom: {
    initial: { y: '100%', opacity: 0.8 },
    animate: { y: '0%', opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
  left: {
    initial: { x: '-100%', opacity: 0.8 },
    animate: { x: '0%', opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  right: {
    initial: { x: '100%', opacity: 0.8 },
    animate: { x: '0%', opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
};

// ─── Single gallery item ──────────────────────────────────────
interface GalleryItemProps {
  slide: GallerySlide;
  index: number;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ slide, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [dir, setDir] = useState<Dir>('top');

  const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current) setDir(detectDir(e, ref.current));
    setHovered(true);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-xl cursor-pointer group"
      style={{ aspectRatio: '1 / 1', background: 'rgba(255,255,255,0.03)' }}
    >
      <img
        src={slide.image_url}
        alt={slide.caption || `相片 ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      <AnimatePresence>
        {hovered && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[2px] p-4 text-center"
            variants={OVERLAY_VARIANTS[dir]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {slide.caption ? (
              <p className="text-white/90 text-sm font-light leading-relaxed">
                {slide.caption}
              </p>
            ) : (
              <p className="text-white/50 text-xs">相片 {index + 1}</p>
            )}
            <div className="mt-3 w-8 h-px bg-gold/70" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────
const DirectionAwareGallery: React.FC = () => {
  const [slides, setSlides] = useState<GallerySlide[]>([]);
  const [loading, setLoading] = useState(true);

  const { get } = useSiteContent();
  const mHeader = {
    tagline: get('moments_tagline', 'Moments'),
    title: get('moments_title', '精彩回顧'),
    subtitle: get('moments_subtitle', 'Hover 探索每張照片背後的故事'),
  };

  useEffect(() => {
    slidesService
      .getGallery()
      .then((s) => setSlides(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!slides.length) return null;

  const displaySlides = slides.slice(0, 8);

  return (
    <section className="py-16 sm:py-20 px-4">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12" data-aos="fade-up">
        <span className="text-gold text-xs uppercase tracking-widest">
          {mHeader.tagline}
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
          {mHeader.title}
        </h2>
        <p className="mt-2 text-sm text-white/40">{mHeader.subtitle}</p>
      </div>

      <div
        className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
        data-aos="fade-up"
        data-aos-delay="100"
      >
        {displaySlides.map((slide, i) => (
          <GalleryItem key={slide.id} slide={slide} index={i} />
        ))}
      </div>
    </section>
  );
};

export default DirectionAwareGallery;
