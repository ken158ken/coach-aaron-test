/**
 * 頁尾元件 - LUXE 風格
 * @module components/layout/Footer
 */

import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaFacebook, FaTiktok, FaPodcast } from "react-icons/fa";
import type { IconType } from "react-icons";

interface SocialLink {
  icon: IconType;
  url: string;
  label: string;
}

/**
 * Footer 元件
 *
 * @returns {JSX.Element} 頁尾元件
 */
const Footer: React.FC = (): JSX.Element => {
  const socialLinks: SocialLink[] = [
    {
      icon: FaInstagram,
      url: "https://www.instagram.com/coach.luen/",
      label: "Instagram",
    },
    {
      icon: FaFacebook,
      url: "https://www.facebook.com/populuen/",
      label: "Facebook",
    },
    {
      icon: FaTiktok,
      url: "https://www.tiktok.com/@coachluen",
      label: "TikTok",
    },
    {
      icon: FaPodcast,
      url: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
      label: "Podcast",
    },
  ];

  return (
    <footer className="bg-luxe-black border-t border-white/10 py-5 sm:py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* 主要內容 - 單行排列 */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="text-base sm:text-lg font-display tracking-widest"
              style={{ color: "var(--luxe-gold)" }}
            >
              阿倫教官
            </span>
            <span className="hidden sm:inline text-luxe-text-dim text-xs">
              心理學 × 健身講師
            </span>
          </div>

          {/* Links - 水平排列，手機上可滾動 */}
          <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <Link
              to="/"
              className="link-underline text-[11px] sm:text-xs text-luxe-text-dim hover:text-luxe-gold transition-colors duration-300 whitespace-nowrap"
            >
              教練介紹
            </Link>
            <Link
              to="/courses"
              className="link-underline text-[11px] sm:text-xs text-luxe-text-dim hover:text-luxe-gold transition-colors duration-300 whitespace-nowrap"
            >
              線上課程
            </Link>
            <Link
              to="/videos"
              className="link-underline text-[11px] sm:text-xs text-luxe-text-dim hover:text-luxe-gold transition-colors duration-300 whitespace-nowrap"
            >
              短影音
            </Link>
            <Link
              to="/contact"
              className="link-underline text-[11px] sm:text-xs text-luxe-text-dim hover:text-luxe-gold transition-colors duration-300 whitespace-nowrap"
            >
              聯絡我
            </Link>
          </nav>

          {/* Social */}
          <div className="flex items-center gap-2 sm:gap-3">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 sm:w-8 sm:h-8 border border-white/20 rounded flex items-center justify-center text-luxe-text-dim hover:border-luxe-gold hover:text-luxe-gold hover:scale-110 hover:shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all duration-300 text-xs sm:text-sm"
                aria-label={social.label}
              >
                <social.icon />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5 text-center">
          <p className="text-[9px] sm:text-[10px] text-luxe-text-dim/60 tracking-wider">
            © 2026 阿倫教官 - All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
