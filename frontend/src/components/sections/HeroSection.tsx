/**
 * HeroSection 元件 - 首頁 Hero 區塊
 * @module components/sections/HeroSection
 */

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GlowButton, TextButton } from "@/components/ui";
import { contentService } from "@/services/content.service";
import { getDefaultTemplate } from "@/utils/contentTemplates";

interface HeroSectionProps {
  className?: string;
}

/**
 * HeroSection - 首頁主視覺區塊
 *
 * @param {HeroSectionProps} props - 元件屬性
 * @returns {JSX.Element} Hero 區塊
 */
const HeroSection: React.FC<HeroSectionProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // Flip Words — 標題循環換字
  const flipWords = ["體態", "自信", "健康", "未來"];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setWordIndex((i) => (i + 1) % flipWords.length),
      2500,
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
      `radial-gradient(700px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(197,160,89,0.10) 0%, rgba(197,160,89,0.03) 35%, transparent 65%)`,
  );

  const handleSpotlightMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  };

  // ✅ SSR-safe：使用確定性範本
  const [heroTitle, setHeroTitle] = useState(() =>
    getDefaultTemplate("hero_title", "打造 理想體態\n遇見更好的自己"),
  );
  const [heroSubtitle, setHeroSubtitle] = useState(() =>
    getDefaultTemplate(
      "hero_subtitle",
      "專業一對一健身指導，量身打造訓練計畫\n科學化訓練 × 飲食規劃 × 心理建設",
    ),
  );

  // 滑鼠視差邏輯
  useEffect(() => {
    if (!containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // 計算滑鼠相對於中心的位置 (-0.5 ~ 0.5)
      const xPos = (clientX / innerWidth) - 0.5;
      const yPos = (clientY / innerHeight) - 0.5;

      // 背景微動 (反向，幅度大一點)
      gsap.to(bgRef.current, {
        x: xPos * -30,
        y: yPos * -20,
        duration: 1.2,
        ease: "power2.out"
      });

      // 線條微動 (同向，幅度適中)
      gsap.to(lineRef.current, {
        x: xPos * 15,
        y: yPos * 10,
        duration: 1.5,
        ease: "power2.out"
      });

      // 內容微動 (反向，幅度極小)
      gsap.to([titleRef.current, subtitleRef.current, ctaRef.current], {
        x: xPos * -10,
        y: yPos * -5,
        duration: 1,
        ease: "power2.out",
        stagger: 0.02
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 原始登場動畫
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title — 快速切入，小位移，略帶斜角
      gsap.fromTo(
        titleRef.current,
        { y: 40, opacity: 0, skewX: -4 },
        { y: 0, opacity: 1, skewX: 0, duration: 1.2, ease: "expo.out", delay: 0.2 },
      );

      // Subtitle — 接連切入
      gsap.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "expo.out", delay: 0.4 },
      );

      // CTA — 最後收尾
      gsap.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", delay: 0.6 },
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
          position: "absolute", inset: 0, zIndex: 0,
          transform: "translateY(calc(var(--scroll-y, 0) * -0.18px))",
          willChange: "transform",
        }}
      >
        <div ref={bgRef} className="studio-hero-bg scale-110" />
      </div>
      <div ref={lineRef} className="studio-floor-line opacity-30" aria-hidden="true" />

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
          {heroTitle.split("\n").map((line, i) => {
            if (i === 0) {
              // Flip Words: 最後一個詞動畫切換
              const parts = line.trim().split(/\s+/);
              const staticPart = parts.slice(0, -1).join(" ");
              return (
                <React.Fragment key={i}>
                  {staticPart}{" "}
                  <span className="relative inline-block">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={wordIndex}
                        initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block text-luxe-gold"
                      >
                        {flipWords[wordIndex]}
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
          {heroSubtitle.split("\n").map((line, i) => (
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
            探索課程
          </GlowButton>
          <TextButton to="/contact" theme="studio">
            預約諮詢
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
