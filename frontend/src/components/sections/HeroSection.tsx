/**
 * HeroSection 元件 - 首頁 Hero 區塊
 * @module components/sections/HeroSection
 */

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { GlowButton, TextButton } from "@/components/ui";

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

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.from(titleRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.3,
      });

      // Subtitle animation
      gsap.from(subtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.6,
      });

      // CTA animation
      gsap.from(ctaRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.9,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className={`
        relative
        min-h-screen
        flex
        flex-col
        items-center
        justify-center
        text-center
        px-4
        ${className}
      `}
    >
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-2 sm:px-4">
        {/* Title */}
        <h1
          ref={titleRef}
          className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 text-abyss-text leading-tight"
        >
          打造
          <span className="text-abyss-accent"> 理想體態 </span>
          <br />
          遇見更好的自己
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-base sm:text-xl md:text-2xl text-abyss-text/70 mb-8 sm:mb-10 max-w-2xl mx-auto font-light"
        >
          專業一對一健身指導，量身打造訓練計畫
          <br className="hidden sm:block" />
          <span className="sm:hidden"> · </span>
          科學化訓練 × 飲食規劃 × 心理建設
        </p>

        {/* CTA */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <GlowButton to="/courses" size="lg">
            探索課程
          </GlowButton>
          <TextButton to="/contact" theme="abyss">
            預約諮詢
          </TextButton>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-abyss-text/50">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-abyss-accent to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
