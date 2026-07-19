/**
 * Home 頁面 - 首頁
 * @module pages/Home
 * @theme abyss (THE ABYSS 深海主題)
 */

import React from "react";
import {
  HeroSection,
  CoachIntroSection,
  ServicesSection,
  CertificationMarquee,
  PodcastExpandable,
  TestimonialCarousel,
  CareerCarousel,
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
          // 2026-07 改版新增：對應新的服務項目與經歷區塊
          "私教變現陪跑",
          "教練變現線上課程",
          "教練一對一顧問",
          "教練經理",
          "健身總教官",
        ]}
        image="/images/og-default.jpg"
        url="/"
        author="阿倫教官"
      />

      {/* 首頁自定義彈窗 */}
      <HomePopup />

      {/* Hero Section — 自帶 GSAP 進場 */}
      <HeroSection />

      {/* 2. 關於教練 — 自帶 data-aos（framer-motion motion.div） */}
      <div className="relative z-10 bg-transparent">
        <CoachIntroSection />
      </div>

      {/* 3. 主要服務項目與專長 — 接既有 courses 資料
          離首屏近，刻意不包 LazySection（比照 CoachIntro / Marquee），
          元件自帶骨架佔位避免 CLS */}
      <div className="relative z-10 bg-transparent">
        <ServicesSection />
      </div>

      {/* 以下各 section 延遲渲染（距視窗 600px 前才掛載 DOM） */}
      {/* 各 section 內部自帶 data-aos 或 framer-motion 進場 */}

      {/* 4. 真實學員留言（原 Student Reviews + Real Reviews 合併，
             版型由後台 testimonial_config.card_layout 切換） */}
      <LazySection minHeight="500px">
        <TestimonialCarousel />
      </LazySection>

      {/* 5. Moments — 精彩瞬間相片牆 */}
      <LazySection minHeight="400px">
        <DirectionAwareGallery />
      </LazySection>

      {/* 6. 其他人設經歷 — 輪播 */}
      <LazySection minHeight="500px">
        <CareerCarousel />
      </LazySection>

      {/* 7. Podcast — 下移至頁面底部 */}
      <LazySection minHeight="500px">
        <PodcastExpandable />
      </LazySection>

      {/* 8. Credentials 專業認證 — 下移至最末作為背書收尾
             CSS @keyframes marquee，無需外層動畫 */}
      <div className="relative z-10 bg-transparent">
        <CertificationMarquee />
      </div>
    </div>
  );
};

export default Home;
