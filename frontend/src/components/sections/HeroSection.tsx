/**
 * HeroSection 元件 - 首頁 Hero 區塊
 * @module components/sections/HeroSection
 */

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
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

  // ✅ SSR-safe：使用確定性範本（第一筆），避免 Math.random() hydration mismatch
  const [heroTitle, setHeroTitle] = useState(() =>
    getDefaultTemplate("hero_title", "打造 理想體態\n遇見更好的自己"),
  );
  const [heroSubtitle, setHeroSubtitle] = useState(() =>
    getDefaultTemplate(
      "hero_subtitle",
      "專業一對一健身指導，量身打造訓練計畫\n科學化訓練 × 飲食規劃 × 心理建設",
    ),
  );

  // 從後台載入內容，若 DB 回傳空值則保留隨機範本
  useEffect(() => {
    contentService
      .getPublicContent()
      .then((content) => {
        if (content.hero_title?.trim()) setHeroTitle(content.hero_title);
        if (content.hero_subtitle?.trim())
          setHeroSubtitle(content.hero_subtitle);
      })
      .catch(() => {
        // API 失敗時保留隨機範本，不做額外處理
      });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title — 快速切入，小位移，略帶斜角
      gsap.fromTo(
        titleRef.current,
        { y: 24, opacity: 0, skewX: -2 },
        { y: 0, opacity: 1, skewX: 0, duration: 0.6, ease: "expo.out", delay: 0.15 },
      );

      // Subtitle — 接連切入
      gsap.fromTo(
        subtitleRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.35 },
      );

      // CTA — 最後收尾
      gsap.fromTo(
        ctaRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "expo.out", delay: 0.5 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className={`studio-hero relative min-h-screen flex flex-col items-center justify-center text-center px-4 ${className}`}
    >
      {/* Studio 攝影棚背景 */}
      <div className="studio-hero-bg" aria-hidden="true" />
      <div className="studio-floor-line" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-2 sm:px-4">
        {/* Title */}
        <h1
          ref={titleRef}
          className="silver-heading font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight tracking-[4px] sm:tracking-[6px] uppercase"
        >
          {heroTitle.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
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
