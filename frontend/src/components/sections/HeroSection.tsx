/**
 * HeroSection 元件 - 首頁 Hero 區塊
 * @module components/sections/HeroSection
 */

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { GlowButton, TextButton } from '@/components/ui';
import { contentService } from '@/services/site/content.service';
import { getDefaultTemplate } from '@/utils/contentTemplates';

interface HeroSectionProps {
  className?: string;
}

/**
 * HeroSection - 首頁主視覺區塊
 *
 * @param {HeroSectionProps} props - 元件屬性
 * @returns {JSX.Element} Hero 區塊
 */
const HeroSection: React.FC<HeroSectionProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // Flip Words — 標題循環換字（可由 DB 覆寫）
  // 定稿文案「甲組」，搭配主標 A 案「私教變現 系統」。
  // 客戶日後如要換主標，備選輪播詞組（見 REPORTS/INDEX_B2B文案_定稿草案.md 1-2）：
  //   乙組（搭主標 B 案）：['業績', '成交', '續約', '收入']
  //   丙組（搭主標 C 案）：['教練', '軍師', '後盾', '陪跑員']
  // ⚠️ 字數請維持 2–3 字，避免翻字時版面跳動。
  const [flipWords, setFlipWords] = useState<string[]>([
    '系統',
    '軍師',
    '陪跑',
    '實戰',
  ]);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setWordIndex((i) => (i + 1) % flipWords.length),
      2500
    );
    return () => clearInterval(t);
  }, []);

  // Spotlight — 滑鼠跟隨聚光燈
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const springX = useSpring(rawX, { stiffness: 60, damping: 18 });
  const springY = useSpring(rawY, { stiffness: 60, damping: 18 });
  const spotlightBg = useTransform(
    [springX, springY],
    ([x, y]: number[]) =>
      `radial-gradient(700px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(197,160,89,0.10) 0%, rgba(197,160,89,0.03) 35%, transparent 65%)`
  );

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  };

  // ✅ SSR-safe：使用確定性範本
  //
  // 主標採定稿 A 案（直球定位）。第一行「私教變現 系統」的最後一詞「系統」
  // 會被 flipWords 替換，關鍵字「私教變現」固定保留在 <h1> 內。
  // 備選主標（客戶日後可直接替換，記得同步換上面的 flipWords 組別）：
  //   B 案（痛點對話，搭乙組）：'你很會教 但業績呢\n私教變現，是一門可以學的技術'
  //   C 案（同行對同行，搭丙組）：'教練的 教練\n私教變現 × 銷售心理學，帶你走過我走過的路'
  const [heroTitle, setHeroTitle] = useState(() =>
    getDefaultTemplate('hero_title', '私教變現 系統\n把你的專業，變成穩定的收入')
  );
  // 副標採定稿新 A 案。備選：
  //   B 案：'十年健身產業、50 人教練團隊、130+ 位教練的實戰驗證\n專業不會自己變成收入，但它可以被設計成收入'
  //         ⚠️「130+ 位教練」屬待佐證數字，客戶確認後才可啟用
  //   C 案：'專業夠了，卡住的通常是系統\n銷售心理學 × 陪跑輔導，帶教練把技術換成穩定業績'
  const [heroSubtitle, setHeroSubtitle] = useState(() =>
    getDefaultTemplate(
      'hero_subtitle',
      '給私人教練的商業實戰培訓\n從體驗課成交、續約經營到個人品牌，一套可複製的變現系統'
    )
  );
  // CTA 備選：主按鈕 '查看課程與方案' ／ '我要提升業績'
  //           次按鈕 '先聊聊你的狀況' ／ '免費諮詢'
  const [ctaPrimary, setCtaPrimary] = useState('看變現方案');
  const [ctaSecondary, setCtaSecondary] = useState('預約 1 對 1 諮詢');

  // 從 DB 載入文案（空值或錯誤時保留 fallback）
  useEffect(() => {
    contentService
      .getPublicContent()
      .then((content) => {
        if (content.hero_title?.trim()) setHeroTitle(content.hero_title);
        if (content.hero_subtitle?.trim())
          setHeroSubtitle(content.hero_subtitle);
        if (content.hero_cta_primary?.trim())
          setCtaPrimary(content.hero_cta_primary);
        if (content.hero_cta_secondary?.trim())
          setCtaSecondary(content.hero_cta_secondary);
        if (content.hero_flip_words) {
          try {
            const arr = JSON.parse(content.hero_flip_words);
            if (Array.isArray(arr) && arr.length > 0) setFlipWords(arr);
          } catch (err) {
            console.warn('[HeroSection] 解析 hero_flip_words 失敗', err);
          }
        }
      })
      .catch((err) => {
        console.warn('[HeroSection] 載入網站內容失敗', err);
      });
  }, []);

  // 滑鼠視差邏輯
  useEffect(() => {
    if (!containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // 計算滑鼠相對於中心的位置 (-0.5 ~ 0.5)
      const xPos = clientX / innerWidth - 0.5;
      const yPos = clientY / innerHeight - 0.5;

      // 背景微動 (反向，幅度大一點)
      gsap.to(bgRef.current, {
        x: xPos * -30,
        y: yPos * -20,
        duration: 1.2,
        ease: 'power2.out',
      });

      // 線條微動 (同向，幅度適中)
      gsap.to(lineRef.current, {
        x: xPos * 15,
        y: yPos * 10,
        duration: 1.5,
        ease: 'power2.out',
      });

      // 內容微動 (反向，幅度極小)
      gsap.to([titleRef.current, subtitleRef.current, ctaRef.current], {
        x: xPos * -10,
        y: yPos * -5,
        duration: 1,
        ease: 'power2.out',
        stagger: 0.02,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 原始登場動畫
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title — 快速切入，小位移，略帶斜角
      gsap.fromTo(
        titleRef.current,
        { y: 40, opacity: 0, skewX: -4 },
        {
          y: 0,
          opacity: 1,
          skewX: 0,
          duration: 1.2,
          ease: 'expo.out',
          delay: 0.2,
        }
      );

      // Subtitle — 接連切入
      gsap.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'expo.out', delay: 0.4 }
      );

      // CTA — 最後收尾
      gsap.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', delay: 0.6 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleSpotlightMove}
      className={`studio-hero relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden ${className}`}
    >
      {/* Studio 攝影棚背景：外層 wrapper 負責滾動視差（CSS variable），內層 bgRef 負責滑鼠視差（GSAP） */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          transform: 'translateY(calc(var(--scroll-y, 0) * -0.18px))',
          willChange: 'transform',
        }}
      >
        <div ref={bgRef} className="studio-hero-bg scale-110" />
      </div>
      <div
        ref={lineRef}
        className="studio-floor-line opacity-30"
        aria-hidden="true"
      />

      {/* Spotlight 聚光燈 — 跟隨滑鼠位置 */}
      <motion.div
        aria-hidden="true"
        style={{ background: spotlightBg }}
        className="pointer-events-none absolute inset-0 z-1"
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-2 sm:px-4">
        {/* Title */}
        <h1
          ref={titleRef}
          className="silver-heading font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight tracking-[4px] sm:tracking-[6px] uppercase will-change-transform"
        >
          {heroTitle.split('\n').map((line, i) => {
            if (i === 0) {
              // Flip Words: 靜態前綴 + 動畫輪播詞
              //
              // 中文沒有詞間空白，舊寫法 split(/\s+/) + slice(0, -1) 會把
              // 「私教變現」這種整行單詞的主關鍵字整個丟掉、被輪播詞取代，
              // 導致 SSR 出來的 <h1> 讀不到關鍵字。
              // 規則：
              //   1. 含「|」→ 分隔符前為靜態前綴（可明確指定）
              //   2. 含空白 → 維持原行為，最後一個詞交給輪播動畫替換
              //   3. 皆無（純中文）→ 整行皆為靜態前綴，輪播詞附加於後
              const raw = line.trim();
              let staticPart: string;
              if (raw.includes('|')) {
                staticPart = raw.slice(0, raw.indexOf('|')).trim();
              } else if (/\s/.test(raw)) {
                staticPart = raw.split(/\s+/).slice(0, -1).join(' ');
              } else {
                staticPart = raw;
              }
              return (
                <React.Fragment key={i}>
                  {staticPart}{' '}
                  <span className="relative inline-block">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={wordIndex}
                        initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block text-luxe-gold"
                      >
                        {/* 後台改短 flipWords 時 wordIndex 可能越界，回退首詞避免 H1 出現空字 */}
                        {flipWords[wordIndex] ?? flipWords[0]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={i}>
                <br />
                {line}
              </React.Fragment>
            );
          })}
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-sm sm:text-base md:text-lg text-white/50 mb-8 sm:mb-10 max-w-xl mx-auto font-light tracking-[2px]"
        >
          {heroSubtitle.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <>
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> · </span>
                </>
              )}
              {line}
            </React.Fragment>
          ))}
        </p>

        {/* CTA */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <GlowButton to="/courses" size="lg">
            {ctaPrimary}
          </GlowButton>
          <TextButton to="/contact" theme="studio">
            {ctaSecondary}
          </TextButton>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-linear-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
