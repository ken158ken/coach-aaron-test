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
import { useLanguage } from "@/context/LanguageContext";

export interface AnimatedTestimonialItem {
  /** 主要文字（見證引言 / 經歷簡述） */
  quote: string;
  /** 名稱（姓名 / 職稱） */
  name: string;
  /** 副標（身份 / 單位・期間） */
  designation: string;
  /** 圖片網址；留空則顯示佔位面板 */
  src?: string;
  /** 多張圖片網址；提供（>1 張）且該項為 active 時，會依 imageRotateMs 內層輪播。
   *  優先於 src；非 active 的項目只顯示 images[0]。 */
  images?: string[];
  /** 圖片上的小徽章（例如經歷期間），可省略 */
  badge?: string;
}

/**
 * Cloudinary 傳輸優化：在 `/image/upload/` 之後插入 `f_auto,q_auto,w_900`，
 * 讓 Cloudinary 自動選格式／壓縮並限制寬度，降低傳輸量。
 * 非 Cloudinary（或找不到 upload 段）的網址原樣返回；已含相同轉換則不重複插入。
 */
const optimizeCloudinary = (url: string): string => {
  const marker = '/image/upload/';
  const at = url.indexOf(marker);
  if (at === -1) return url;
  const after = at + marker.length;
  const rest = url.slice(after);
  if (rest.startsWith('f_auto,q_auto,w_900/')) return url;
  return `${url.slice(0, after)}f_auto,q_auto,w_900/${rest}`;
};

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
  /** 內層照片輪播間隔（ms）；0＝不輪播（預設）。
   *  >0 時，當前 active 項目若有多張 images，會每 imageRotateMs 換一張。 */
  imageRotateMs?: number;
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
  clickHintText,
  imageRotateMs = 0,
}) => {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  // 內層照片索引：只作用於「當前 active 項目」的多張 images
  const [imageIndex, setImageIndex] = useState(0);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // SSR / hydration 首次 render 必須「可見」：framer-motion 的 initial 會被
  // 序列化成 inline style（opacity:0 / blur），JS 到位前整區隱形，正是
  // 首頁「往下捲一片空白」bug 的成因之一。mount 後才啟用 initial，
  // 讓之後的換張進場動畫照舊。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const total = testimonials.length;
  const handleNext = () => setActive((p) => (p + 1) % total);
  const handlePrev = () => setActive((p) => (p - 1 + total) % total);
  const isActive = (index: number) => index === active;

  // 當前 active 項目的照片數（用於決定是否內層輪播）
  const activeImageCount = testimonials[active]?.images?.length ?? 0;

  // 自動輪播；hover（若 pauseOnHover）或 reduce-motion 時暫停
  useEffect(() => {
    if (!autoplay || total <= 1 || reduceMotion) return;
    if (pauseOnHover && hovered) return;
    const t = setInterval(handleNext, autoplayMs);
    return () => clearInterval(t);
  }, [autoplay, total, reduceMotion, pauseOnHover, hovered, autoplayMs]);

  // active 項目切換時，內層照片索引重置為 0（跳到這段經歷從第一張開始）
  useEffect(() => {
    setImageIndex(0);
  }, [active]);

  // 內層照片輪播：僅在 imageRotateMs>0、非 reduce-motion、當前項有多張時啟動
  useEffect(() => {
    if (imageRotateMs <= 0 || reduceMotion || activeImageCount <= 1) return;
    const t = setInterval(() => {
      setImageIndex((p) => (p + 1) % activeImageCount);
    }, imageRotateMs);
    return () => clearInterval(t);
  }, [active, imageRotateMs, reduceMotion, activeImageCount]);

  if (!total) return null;

  const current = testimonials[active];

  // 計算某項目「當前該顯示的圖片 URL」：
  //   有 images → active 用 images[imageIndex]、非 active 用 images[0]；
  //   否則 fallback 到 src；再否則 undefined（顯示佔位面板）。皆套 Cloudinary 優化。
  const resolveSrc = (item: AnimatedTestimonialItem, itemActive: boolean): string | undefined => {
    const imgs = item.images;
    if (imgs && imgs.length > 0) {
      const idx = itemActive ? imageIndex % imgs.length : 0;
      return optimizeCloudinary(imgs[idx]);
    }
    return item.src ? optimizeCloudinary(item.src) : undefined;
  };

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
          aria-label={advanceOnClick ? t.carouselUi.nextItem : undefined}
        >
          <AnimatePresence>
            {testimonials.map((t, index) => (
              <motion.div
                key={`${t.name}-${index}`}
                initial={mounted ? { opacity: 0, scale: 0.9, rotate: ROTATIONS[index % ROTATIONS.length] } : false}
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
                <PhotoOrPlaceholder
                  item={t}
                  index={index}
                  displaySrc={resolveSrc(t, isActive(index))}
                />
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
                {clickHintText ?? t.carouselUi.clickHint} →
              </span>
            </div>
          )}
        </div>

        {/* ── 文字區 ───────────────────────────────── */}
        <div className="flex flex-col justify-between py-2 md:py-4">
          <motion.div
            key={active}
            initial={mounted ? { y: 20, opacity: 0 } : false}
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
                      initial={mounted ? { filter: 'blur(8px)', opacity: 0, y: 4 } : false}
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
                  aria-label={t.carouselUi.prevSlide}
                  className="group/btn w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/40 transition-colors"
                >
                  <svg className="w-4 h-4 transition-transform group-hover/btn:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  aria-label={t.carouselUi.nextSlide}
                  className="group/btn w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/40 transition-colors"
                >
                  <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="flex gap-1.5 ml-1">
                  {testimonials.map((item, i) => (
                    <button
                      key={`dot-${item.name}-${i}`}
                      onClick={() => setActive(i)}
                      aria-label={t.carouselUi.goToSlide.replace("{n}", String(i + 1))}
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

/**
 * 有圖顯示圖，無圖顯示主題色佔位面板（首字/徽章）。
 * `displaySrc` 為呼叫端算好的「當前該顯示的圖片 URL」
 * （已處理 images 輪播索引與 Cloudinary 優化）。
 */
const PhotoOrPlaceholder: React.FC<{
  item: AnimatedTestimonialItem;
  index: number;
  displaySrc?: string;
}> = ({ item, index, displaySrc }) => (
  <div className="relative h-full w-full rounded-3xl overflow-hidden">
    {displaySrc ? (
      <img
        src={displaySrc}
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
