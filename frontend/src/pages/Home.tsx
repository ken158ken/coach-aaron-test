/**
 * Home 頁面 - 首頁
 * @module pages/Home
 * @theme abyss (THE ABYSS 深海主題)
 */

import React, { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  HeroSection,
  CoachIntroSection,
  CertificationMarquee,
  PodcastSection,
  TestimonialCarousel,
  GallerySlider,
} from "@/components/sections";
import HomePopup from "@/components/sections/HomePopup";
import SEOHead from "@/components/seo/SEOHead";
import LazySection from "@/components/ui/LazySection";

gsap.registerPlugin(ScrollTrigger);

/** 日誌工具 */
const logger = {
  info: (msg: string) => console.log(`[Home] ${msg}`),
};

/**
 * Home - 網站首頁
 *
 * @returns {JSX.Element} 首頁
 */
const Home: React.FC = () => {
  /** GSAP ScrollTrigger 滾動入場動畫 */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".section-reveal");
    els.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        },
      );
    });
    logger.info("ScrollTrigger 動畫已初始化");

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* SEO Meta 標籤 */}
      <SEOHead
        title="私教變現專家 | 銷售心理學助健身教練月入8萬"
        description="10年健身產業經驗，整合銷售心理學與實戰技巧。專為私人教練打造的業績突破系統，已協助130+教練年收破百萬。不擅長銷售？學生續約卡關？讓阿倫教官幫你把專業換成穩定收入，100天月入8萬起。"
        keywords={[
          "阿倫教官",
          "私人教練變現",
          "銷售心理學",
          "健身教練續課",
          "教練業績提升",
          "健身房銷售",
          "學生續約技巧",
          "健身教練收入",
          "教練培訓",
          "NLP心理學",
          "健身教練行銷",
          "私教經營",
          "教練職涯發展",
          "私人教練銷售",
          "健身教練銷售",
          "皮拉提斯銷售",
        ]}
        image="/images/og-default.jpg"
        url="/"
        author="阿倫教官"
      />

      {/* 首頁自定義彈窗 */}
      <HomePopup />

      {/* Hero Section - GSAP handles its own animation */}
      <HeroSection />

      {/* Coach Introduction */}
      <div className="section-reveal relative z-10 bg-transparent">
        <CoachIntroSection />
      </div>

      {/* Certification Marquee — 認證標章無限滾動 */}
      <div className="section-reveal relative z-10 bg-transparent">
        <CertificationMarquee />
      </div>

      {/* Podcast Section — 延遲渲染，捲到前 400px 才載入 DOM */}
      <LazySection minHeight="500px" className="section-reveal">
        <PodcastSection />
      </LazySection>

      {/* 學員見證幻燈片（自動輪播）— 延遲渲染 */}
      <LazySection minHeight="500px" className="section-reveal">
        <TestimonialCarousel />
      </LazySection>

      {/* 相片輪播（手動翻頁）— 延遲渲染 */}
      <LazySection minHeight="400px" className="section-reveal">
        <GallerySlider />
      </LazySection>
    </div>
  );
};

export default Home;
