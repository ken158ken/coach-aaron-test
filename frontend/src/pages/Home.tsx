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
  TestimonialCarousel,
  CareerCarousel,
  DirectionAwareGallery,
} from "@/components/sections";
import HomePopup from "@/components/sections/HomePopup";
import SEOHead from "@/components/seo/SEOHead";
import LazySection from "@/components/ui/LazySection";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* SEO Meta 標籤（文案見 locales 的 homeSeo namespace） */}
      <SEOHead
        title={t.homeSeo.title}
        description={t.homeSeo.description}
        keywords={t.homeSeo.keywords}
        image="/images/og-default.jpg"
        url="/"
        author={t.homeSeo.author}
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

      {/* Podcast 區塊已移除：podcast_episodes 表為空、僅顯示假的示範單集、
          且點擊無實際內容（客戶確認未使用）。如日後要恢復，重新掛回
          <PodcastExpandable /> 並在後台「Podcast 單集」新增真實單集即可。 */}

      {/* Credentials 專業認證 — 最末作為背書收尾
             CSS @keyframes marquee，無需外層動畫 */}
      <div className="relative z-10 bg-transparent">
        <CertificationMarquee />
      </div>
    </div>
  );
};

export default Home;
