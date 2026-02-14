/**
 * Home 頁面 - 首頁
 * @module pages/Home
 * @theme abyss (THE ABYSS 深海主題)
 */

import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useTheme } from "@/context";
import { AbyssScene } from "@/components/three";
import {
  HeroSection,
  CoachIntroSection,
  PodcastSection,
  ReviewSection,
} from "@/components/sections";
import HomePopup from "@/components/sections/HomePopup";
import SEOHead from "@/components/seo/SEOHead";

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
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("abyss");
  }, [setTheme]);

  /** 初始化 AOS 滾動動畫 */
  useEffect(() => {
    try {
      AOS.init({
        duration: 800,
        easing: "ease-out-cubic",
        once: true,
        offset: 80,
        delay: 0,
        anchorPlacement: "top-bottom",
      });
      logger.info("AOS 滾動動畫已初始化");
    } catch (err) {
      console.error("[Home] AOS 初始化失敗:", err);
    }

    return () => {
      // 清理 AOS 監聽器
      AOS.refreshHard();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-abyss-bg">
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

      {/* Three.js Background */}
      <AbyssScene />

      {/* 首頁自定義彈窗 */}
      <HomePopup />

      {/* Hero Section - 淡入 + 上滑 */}
      <div data-aos="fade-up" data-aos-duration="1000">
        <HeroSection />
      </div>

      {/* Coach Introduction (Luxe Style) - 淡入 + 上滑 */}
      <div
        className="relative z-10 bg-luxe-bg"
        data-aos="fade-up"
        data-aos-duration="900"
        data-aos-delay="100"
      >
        <CoachIntroSection />
      </div>

      {/* Podcast Section (Abyss Style) - 淡入 + 上滑 */}
      <div data-aos="fade-up" data-aos-duration="900" data-aos-delay="100">
        <PodcastSection />
      </div>

      {/* Review Section (Prism Style) - 淡入 + 上滑 */}
      <div data-aos="fade-up" data-aos-duration="900" data-aos-delay="100">
        <ReviewSection />
      </div>
    </div>
  );
};

export default Home;
