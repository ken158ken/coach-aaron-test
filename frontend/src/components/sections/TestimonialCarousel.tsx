/**
 * TestimonialCarousel - 真實學員留言（唯一的學員見證區塊）
 * @module components/sections/TestimonialCarousel
 * @description 支援三種版型（由後台 testimonial_config.card_layout 切換）：
 *              - portrait   直立式 coverflow（圖為主）
 *              - landscape  橫式 coverflow（圖為主）
 *              - quote-grid 三欄引言牆（文字為主，原 CardStackTestimonial 版型）
 *              左右各露出前後一張卡，透視旋轉進退 (coverflow)
 *              is_published=false 時首頁隱藏；preview=true 強制顯示
 *
 * 2026-07 改版：原本首頁有兩個讀同一份 getTestimonials() 資料的區塊
 *              （Student Reviews / Real Reviews），已合併為本元件。
 *              CardStackTestimonial 的三欄引言版型移入此處成為 quote-grid，
 *              並修掉舊版「不檢查 is_published + 內建 pravatar 假資料」的 bug。
 */

import React, { useState, useEffect, useCallback, useMemo, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  slidesService,
  type TestimonialSlide,
  type TestimonialConfig,
  type TestimonialCardLayout,
} from '@/services/site/slides.service';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getInitialData } from '@/ssr/initialData';
import { dataKeys } from '@/ssr/routeData';
import { CardStack, type CardStackItem } from '@/components/ui/card-stack';

// ─── Aceternity AnimatedTestimonials 風格：逐字淡入 ───────────────────────
const AnimatedQuote: React.FC<{ text: string; slideId: number }> = ({
  text,
  slideId,
}) => {
  const words = text.split(' ');
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={slideId}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="inline"
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.25em]"
            variants={{
              hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
              visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
            }}
            transition={{
              duration: 0.35,
              delay: i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  );
};

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
    CARD_W: 280,
    OFFSET: 230,
    ROT: 14,
    S_SCALE: 0.84,
    S_OPA: 0.5,
    STAGE_H: 500,
  },
  landscape: {
    CARD_W: 380,
    OFFSET: 320,
    ROT: 16,
    S_SCALE: 0.82,
    S_OPA: 0.48,
    STAGE_H: 380,
  },
} as const;

function cardStyle(pos: number, layout: keyof typeof LAYOUTS): CSSProperties {
  const { CARD_W, OFFSET, ROT, S_SCALE, S_OPA } = LAYOUTS[layout];
  const T = 'all 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  const base: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: CARD_W,
    transition: T,
  };

  if (pos === 0)
    return {
      ...base,
      transform: 'translateX(-50%) perspective(1000px) rotateY(0deg) scale(1)',
      opacity: 1,
      zIndex: 10,
      pointerEvents: 'auto',
    };
  if (pos === -1)
    return {
      ...base,
      transform: `translateX(calc(-50% - ${OFFSET}px)) perspective(1000px) rotateY(${ROT}deg) scale(${S_SCALE})`,
      opacity: S_OPA,
      zIndex: 5,
      pointerEvents: 'auto',
      cursor: 'pointer',
    };
  if (pos === 1)
    return {
      ...base,
      transform: `translateX(calc(-50% + ${OFFSET}px)) perspective(1000px) rotateY(-${ROT}deg) scale(${S_SCALE})`,
      opacity: S_OPA,
      zIndex: 5,
      pointerEvents: 'auto',
      cursor: 'pointer',
    };
  const sign = pos > 0 ? '+' : '-';
  return {
    ...base,
    transform: `translateX(calc(-50% ${sign} ${OFFSET * 2.4}px)) perspective(1000px) rotateY(${pos > 0 ? -ROT * 2 : ROT * 2}deg) scale(0.65)`,
    opacity: 0,
    zIndex: 1,
    pointerEvents: 'none',
  };
}

// ─── Header（從 DB 讀取 tagline/title/subtitle）──────────────
const TestimonialHeader: React.FC = () => {
  const { get } = useSiteContent();
  return (
    <div className="text-center mb-10 sm:mb-12 px-4" data-aos="fade-up">
      <span className="text-gold text-xs uppercase tracking-widest">
        {get('testimonial_tagline', 'Student Reviews')}
      </span>
      {/* 標題備選：'教練同業的實戰回饋' ／ '合作教練怎麼說'
          導言備選：'我的學生，都是教練。所以這些回饋談的不是體重掉了幾公斤，
                    而是續課率、成交數，跟月底那張數字。' ／
                   '來自現役教練同業的真實回饋——關於業績、續約，
                    以及重新相信自己專業值多少錢這件事。' */}
      <h2 className="mt-2 text-2xl sm:text-3xl font-light text-white/90">
        {get('testimonial_title', '真實學員留言')}
      </h2>
      <p className="mt-2 text-sm text-white/40">
        {get(
          'testimonial_subtitle',
          '這裡的每一則留言，都來自現役私人教練'
        )}
      </p>
    </div>
  );
};

// ─── quote-grid 版型：三欄引言牆 ──────────────────────────────
// 移植自舊 CardStackTestimonial.tsx（一次顯示 3 筆、整組換場）
// 與舊版差異：
//   1. 不再有 DEMO_CARDS 假資料 —— 無資料時由外層直接不渲染
//   2. is_published 由外層統一把關
//   3. 補上 hover 暫停與 prefers-reduced-motion
const QUOTE_GRID_PER_PAGE = 3;

const QuoteGridView: React.FC<{
  slides: TestimonialSlide[];
  intervalMs: number;
}> = ({ slides, intervalMs }) => {
  const [groupIdx, setGroupIdx] = useState(0);
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward
  const [paused, setPaused] = useState(false);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const totalGroups = Math.ceil(slides.length / QUOTE_GRID_PER_PAGE);

  // 自動輪播（整組切換）；只有一組、hover 中或使用者要求減少動態時不啟動
  useEffect(() => {
    if (totalGroups <= 1 || paused || reduceMotion) return;
    const t = setInterval(() => {
      setDirection(1);
      setGroupIdx((i) => (i + 1) % totalGroups);
    }, intervalMs);
    return () => clearInterval(t);
  }, [totalGroups, paused, reduceMotion, intervalMs]);

  // 資料變少時避免 groupIdx 越界
  useEffect(() => {
    setGroupIdx((i) => (i >= totalGroups ? 0 : i));
  }, [totalGroups]);

  // 當前組的卡片（不循環補滿，最後一組可能少於 3 張，避免重複 key）
  const groupCards = slides.slice(
    groupIdx * QUOTE_GRID_PER_PAGE,
    groupIdx * QUOTE_GRID_PER_PAGE + QUOTE_GRID_PER_PAGE
  );

  const goTo = (idx: number) => {
    setDirection(idx > groupIdx ? 1 : -1);
    setGroupIdx(idx);
  };

  return (
    <div
      className="max-w-5xl mx-auto px-4"
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
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {groupCards.map((card, i) => {
            const hasAvatar = !!card.image_url?.startsWith('http');
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.07,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bg-surface border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 hover:border-gold/25 transition-colors duration-300"
              >
                {/* Quote */}
                {card.quote && (
                  <p className="text-white/70 text-sm leading-relaxed flex-1">
                    「{card.quote}」
                  </p>
                )}

                {/* Divider */}
                <div className="w-8 h-px bg-gold/30" />

                {/* Author */}
                <div className="flex items-center gap-3">
                  {hasAvatar ? (
                    <img
                      src={card.image_url}
                      alt={card.name || '學員'}
                      loading="lazy"
                      className="w-9 h-9 rounded-full object-cover border border-white/15 shrink-0"
                    />
                  ) : (
                    /* 無頭像時用姓名首字，不再回退到 pravatar 假圖 */
                    <span
                      aria-hidden="true"
                      className="w-9 h-9 rounded-full border border-white/15 bg-white/5 shrink-0 flex items-center justify-center text-gold text-xs"
                    >
                      {card.name?.trim().charAt(0) || '·'}
                    </span>
                  )}
                  <div>
                    <p className="text-white/90 text-sm font-medium leading-tight">
                      {card.name}
                    </p>
                    {card.achievement && (
                      <p className="text-gold text-xs mt-0.5">
                        {card.achievement}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators（一組一個圓點） */}
      {totalGroups > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalGroups }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`第 ${i + 1} 組`}
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
  );
};

// ─── 前台預設版型：三欄各自輪播的 card-stack ─────────────────
// 桌機同時顯示最多三欄，每欄一個獨立 CardStack，各自每 5 秒翻牌。
// 三欄餵入「同一份已發布清單」但分別以位移 0 / 1 / 2 旋轉，
// 使任一時刻三欄頂端都是不同留言，且各欄各自循環。
// 留言不足時欄數 = min(3, 留言數)；窄螢幕（<768px）收成單欄餵完整清單。
const FRONT_COLUMNS = 3;
const FRONT_INTERVAL_MS = 5000;

const FrontTestimonialStacks: React.FC<{ items: CardStackItem[] }> = ({
  items,
}) => {
  // SSR 安全：初值 false（=窄螢幕單欄），client 端 hydrate 後再依斷點升級為多欄
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const columnCount = isDesktop ? Math.min(FRONT_COLUMNS, items.length) : 1;

  // 每欄 = 以位移 offset 旋轉後的完整清單
  const columns = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, offset) => [
        ...items.slice(offset),
        ...items.slice(0, offset),
      ]),
    [items, columnCount]
  );

  // 完整字面量供 Tailwind JIT 掃描
  const gridColsClass =
    columnCount >= 3
      ? 'md:grid-cols-3'
      : columnCount === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-1';

  return (
    <div
      className={`mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 ${gridColsClass}`}
    >
      {columns.map((colItems, i) => (
        <CardStack
          key={i}
          items={colItems}
          intervalMs={FRONT_INTERVAL_MS}
          visibleCount={3}
        />
      ))}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────
const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  preview = false,
  initialSlides,
  initialConfig,
}) => {
  // ── SSR 預抓資料：props（admin 預覽）優先，其次 __INITIAL_DATA__，
  //    server 與 client 首次 render 讀同一份 → 不會 hydration mismatch。
  //    SSR 資料只作「初值」：mount 後仍照常 fetch 覆蓋（SSR HTML 可能是
  //    CDN 舊快取；且 config 預抓可能單獨失敗，必須補抓才能反映下架狀態）──
  const ssrSlides = getInitialData<TestimonialSlide[]>(dataKeys.testimonials());
  const seedSlides =
    initialSlides ?? (Array.isArray(ssrSlides) ? ssrSlides : undefined);
  const ssrConfig = getInitialData<TestimonialConfig>(
    dataKeys.testimonialsConfig()
  );

  const [slides, setSlides] = useState<TestimonialSlide[]>(seedSlides ?? []);
  const [config, setConfig] = useState<TestimonialConfig>(
    initialConfig ??
      ssrConfig ?? {
        interval_ms: 4000,
        is_published: true,
        card_layout: 'portrait',
      }
  );
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(!seedSlides);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (initialSlides) return; // admin 預覽由 props 供資料，不打 API
    (async () => {
      try {
        const [s, c] = await Promise.all([
          slidesService.getTestimonials(),
          slidesService.getTestimonialsConfig(),
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

  // 後台預覽切換版型時同步更新
  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

  // 前台 Aceternity card-stack 的資料對應
  //   content     ← 見證內容（quote 欄位）
  //   name        ← 見證者姓名
  //   designation ← 身份/成就（achievement 欄位；資料模型沒有 role）
  //   （card-stack 以文字為主，頭像非必要，故不對應 image_url）
  const cardStackItems = useMemo<CardStackItem[]>(
    () =>
      slides.map((s) => ({
        id: s.id,
        name: s.name,
        designation: s.achievement,
        content: s.quote ? <>「{s.quote}」</> : null,
      })),
    [slides]
  );

  const next = useCallback(
    () => setCurrent((i) => (i + 1) % slides.length),
    [slides.length]
  );
  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const t = setInterval(next, config.interval_ms);
    return () => clearInterval(t);
  }, [slides.length, config.interval_ms, paused, next]);

  if (!preview && !config.is_published) return null;
  if (loading)
    return (
      <div className="py-20 text-center text-white/30 text-sm">載入中...</div>
    );
  if (!slides.length) return null;

  // ── 前台預設呈現：三欄各自輪播的 Aceternity card-stack ──
  //    桌機同時顯示最多三欄，每欄一個獨立 card-stack、各自每 5 秒翻牌循環；
  //    三欄以位移 0/1/2 旋轉同一份清單，任一時刻頂端都是不同留言。
  //    留言不足時欄數 = min(3, 留言數)；窄螢幕收成單欄餵完整清單。
  //    admin 預覽（preview=true）仍走下方既有的 portrait/landscape/quote-grid
  //    版型分支，讓後台可預覽 card_layout 設定；is_published 由上方守門。
  if (!preview) {
    return (
      <section className="py-16 sm:py-20">
        <TestimonialHeader />
        <FrontTestimonialStacks items={cardStackItems} />
      </section>
    );
  }

  const layout: TestimonialCardLayout = config.card_layout ?? 'portrait';

  // ── quote-grid：文字引言牆版型（非 coverflow，走獨立分支）──
  if (layout === 'quote-grid') {
    return (
      <section className="py-16 sm:py-20 bg-transparent">
        <TestimonialHeader />
        <QuoteGridView slides={slides} intervalMs={config.interval_ms} />
      </section>
    );
  }

  const { STAGE_H } = LAYOUTS[layout];
  const isLandscape = layout === 'landscape';

  return (
    <section className="py-16 sm:py-20">
      {/* Header */}
      <TestimonialHeader />

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
          const pos = getRelPos(i, current, slides.length);
          const isLeft = pos === -1;
          const isRight = pos === 1;
          const isCenter = pos === 0;

          return (
            <div
              key={slide.id}
              style={cardStyle(pos, layout)}
              onClick={() => {
                if (isLeft) prev();
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
                    <div
                      className="relative overflow-hidden bg-white/5"
                      style={{ aspectRatio: '16/10' }}
                    >
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
                            「
                            <AnimatedQuote
                              text={slide.quote}
                              slideId={slide.id}
                            />
                            」
                          </p>
                        </div>
                      )}
                    </div>
                    {isCenter && (
                      <div className="p-3 sm:p-4 flex flex-wrap items-center gap-2">
                        <span className="text-white/90 font-medium text-sm">
                          {slide.name}
                        </span>
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
                    <div
                      className="overflow-hidden bg-white/5"
                      style={{ aspectRatio: '4/5' }}
                    >
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
                          <span className="text-white/90 font-medium text-sm">
                            {slide.name}
                          </span>
                          {slide.achievement && (
                            <span className="text-xs bg-gold/15 text-gold border border-gold/20 px-2.5 py-1 rounded-full shrink-0">
                              {slide.achievement}
                            </span>
                          )}
                        </div>
                        {slide.quote && (
                          <p className="text-white/55 text-xs sm:text-sm leading-relaxed">
                            「
                            <AnimatedQuote
                              text={slide.quote}
                              slideId={slide.id}
                            />
                            」
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 側卡提示箭頭 */}
              {(isLeft || isRight) && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 border border-gold/20 text-white/50 ${
                    isLeft ? 'right-2' : 'left-2'
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5"
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
              aria-label="下一張"
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

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-6 px-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`第 ${i + 1} 張`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 bg-gold'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TestimonialCarousel;
