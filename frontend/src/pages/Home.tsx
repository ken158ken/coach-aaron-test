/**
 * Home 頁面 - 首頁
 * @module pages/Home
 * @theme abyss (THE ABYSS 深海主題)
 */

import React from "react";
import {
  HeroSection,
  CoachIntroSection,
  CertificationMarquee,
  PodcastExpandable,
  TestimonialCarousel,
  CardStackTestimonial,
  GallerySlider,
  DirectionAwareGallery,
} from "@/components/sections";
import HomePopup from "@/components/sections/HomePopup";
import SEOHead from "@/components/seo/SEOHead";
import LazySection from "@/components/ui/LazySection";

/**
 * Home - 網站首頁
 *
 * 動畫策略：
 *   - HeroSection：自帶 GSAP 進場動畫
 *   - CoachIntroSection / CertificationMarquee：自帶 data-aos（由 Lenis+AOS 驅動）
 *   - LazySection 下的各 section：各自用 framer-motion whileInView 或 data-aos
 *
 *   移除 Home 層的全域 GSAP section-reveal，原因：
 *     1. GSAP 在 mount 時掃 DOM，但 LazySection 內容尚未渲染 → 空 wrapper 被設成
 *        opacity:0，LazySection 渲染後 ScrollTrigger 位置已過期，trigger 在錯誤位置 fire
 *     2. GSAP + framer-motion 同時對同一 wrapper 設 opacity 造成衝突
 *     3. 各 section 已有自己的進場動畫，wrapper 層無需重複
 *
 * @returns {JSX.Element} 首頁
 */
const Home: React.FC = () => {
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

      {/* Hero Section — 自帶 GSAP 進場 */}
      <HeroSection />

      {/* Coach Introduction — 自帶 data-aos（framer-motion motion.div） */}
      <div className="relative z-10 bg-transparent">
        <CoachIntroSection />
      </div>

      {/* Certification Marquee — CSS @keyframes marquee，無需外層動畫 */}
      <div className="relative z-10 bg-transparent">
        <CertificationMarquee />
      </div>

      {/* 以下各 section 延遲渲染（距視窗 600px 前才掛載 DOM） */}
      {/* 各 section 內部自帶 data-aos 或 framer-motion 進場 */}

      <LazySection minHeight="500px">
        <PodcastExpandable />
      </LazySection>

      <LazySection minHeight="500px">
        <TestimonialCarousel />
      </LazySection>

      <LazySection minHeight="400px">
        <CardStackTestimonial />
      </LazySection>

      <LazySection minHeight="400px">
        <GallerySlider />
      </LazySection>

      <LazySection minHeight="400px">
        <DirectionAwareGallery />
      </LazySection>
    </div>
  );
};

export default Home;
