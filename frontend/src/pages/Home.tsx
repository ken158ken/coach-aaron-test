/**
 * Home 頁面 - 首頁
 * @module pages/Home
 * @theme abyss (THE ABYSS 深海主題)
 */

import React, { useEffect } from "react";
import { useTheme } from "@/context";
import { AbyssScene } from "@/components/three";
import {
  HeroSection,
  CoachIntroSection,
  PodcastSection,
  ReviewSection,
} from "@/components/sections";

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

  return (
    <div className="relative min-h-screen bg-abyss-bg">
      {/* Three.js Background */}
      <AbyssScene />

      {/* Hero Section */}
      <HeroSection />

      {/* Coach Introduction (Luxe Style) */}
      <div className="relative z-10 bg-luxe-bg">
        <CoachIntroSection />
      </div>

      {/* Podcast Section (Abyss Style) */}
      <PodcastSection />

      {/* Review Section (Prism Style) */}
      <ReviewSection />
    </div>
  );
};

export default Home;
