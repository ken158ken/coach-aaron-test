/**
 * AppleCardsCarousel — Aceternity「apple-cards-carousel」的 Vite 適配版
 * 參考：https://ui.aceternity.com/components/apple-cards-carousel
 *
 * 行為：可橫向捲動的高卡片、左右箭頭按鈕、點卡片展開 modal 顯示詳情。
 *
 * 與原版差異（刻意調整，避免膨脹 bundle / 破壞 SSR）：
 *   - 動畫改用專案既有的 framer-motion（原版用 motion/react）
 *   - 箭頭 / 關閉 X 圖示改 inline SVG（原版用 @tabler/icons-react，不引入）
 *   - 圖片用一般 <img>（原版用 next/image）
 *   - useOutsideClick / Esc 關閉 / 鎖 body scroll 全部只在 useEffect 內
 *     操作 document，render 期間不存取 window/document（SSR 安全）
 *   - 無圖片時顯示主題色佔位面板（含大編號），供尚未上傳照片的情境
 *   - 樣式配合本站深色主題（bg-surface、border-white/10、text-gold）
 *
 * 匯出：
 *   - Carousel  橫向捲動容器 + 左右箭頭
 *   - Card      單張卡片（點擊展開 modal）
 *   - CarouselCard  卡片資料型別
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from "@/context/LanguageContext";

// ─── 型別 ─────────────────────────────────────────────────────

export interface CarouselCard {
  /** 圖片網址；留空則顯示主題色佔位面板（客戶之後塞圖片） */
  src?: string;
  /** 卡片標題 */
  title: string;
  /** 分類 / eyebrow */
  category: string;
  /** 展開 modal 內顯示的詳情內容 */
  content: React.ReactNode;
}

// ─── inline SVG 圖示 ──────────────────────────────────────────

const ArrowLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── 圖片 / 佔位面板 ──────────────────────────────────────────

const CardImage: React.FC<{ card: CarouselCard; index: number }> = ({ card, index }) => (
  <>
    {card.src ? (
      <img
        src={card.src}
        alt={card.title}
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    ) : (
      // 佔位面板：大編號 + 標題，之後填 src 即可覆蓋
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-white/[0.06] to-black/40">
        <span className="text-6xl font-thin leading-none text-gold/25 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
    )}
    {/* 由上而下的深色漸層，讓分類 / 標題文字在任何圖上都清楚 */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/10 pointer-events-none" />
  </>
);

// ─── Card ─────────────────────────────────────────────────────

interface CardProps {
  card: CarouselCard;
  index: number;
  /** 卡片本體使用的 layout id 前綴，供 framer-motion 共享布局；可省略 */
  layoutIdPrefix?: string;
}

export const Card: React.FC<CardProps> = ({ card, index, layoutIdPrefix }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const layoutId = layoutIdPrefix ? `${layoutIdPrefix}-${index}` : undefined;

  // Esc 關閉 + 鎖 body scroll（僅在 useEffect 內操作 document，SSR 安全）
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // useOutsideClick：點 modal 外面關閉
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // 下一輪才掛，避免開啟當下的那次點擊立刻觸發關閉
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', onClick);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <>
      {/* 卡片本體 */}
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={() => setOpen(true)}
        aria-label={t.carouselUi.expand.replace("{title}", card.title)}
        className="group relative z-10 flex h-72 w-56 shrink-0 flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-surface text-left transition-colors duration-300 hover:border-gold/30 sm:h-96 sm:w-72"
      >
        <CardImage card={card} index={index} />
        <div className="relative z-20 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-widest text-gold/90">{card.category}</p>
          <p className="mt-1.5 max-w-full text-lg font-light leading-snug text-white/90 sm:text-xl">
            {card.title}
          </p>
        </div>
      </motion.button>

      {/* 展開 modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              ref={modalRef}
              layoutId={layoutId}
              role="dialog"
              aria-modal="true"
              aria-label={card.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-[60] mx-auto my-10 w-[92%] max-w-2xl rounded-3xl border border-white/10 bg-surface p-6 shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.chatUi.close}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

              <p className="text-xs uppercase tracking-widest text-gold/90">{card.category}</p>
              <h3 className="mt-2 pr-10 text-2xl font-light leading-tight text-white/90 sm:text-3xl">
                {card.title}
              </h3>
              <div className="mt-5 text-sm leading-relaxed text-white/70">{card.content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Carousel ─────────────────────────────────────────────────

interface CarouselProps {
  /** 已組好的卡片節點（通常是一組 <Card />） */
  items: React.ReactNode[];
}

export const Carousel: React.FC<CarouselProps> = ({ items }) => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  // 初次與 resize 時更新箭頭可用狀態（僅 useEffect 內碰 window，SSR 安全）
  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
    // items 長度變動時重新計算
  }, [items.length]);

  const scrollBy = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    // 約一張卡片寬（含間距）
    const amount = Math.max(el.clientWidth * 0.8, 260);
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex w-full gap-4 overflow-x-auto scroll-smooth py-4 pl-1 pr-4 sm:gap-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={i} className="last:pr-4">
            {item}
          </div>
        ))}
      </div>

      {/* 左右箭頭：可捲動時才顯示 / 可用 */}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canLeft}
          aria-label={t.carouselUi.prevBatch}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface text-white/70 transition-colors enabled:hover:border-gold/40 enabled:hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canRight}
          aria-label={t.carouselUi.nextBatch}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface text-white/70 transition-colors enabled:hover:border-gold/40 enabled:hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Carousel;
