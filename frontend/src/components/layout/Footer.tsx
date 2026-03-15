/**
 * 頁尾元件 - Studio 風格
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

const Footer: React.FC = (): JSX.Element => {
  const socialLinks: SocialLink[] = [
    { icon: FaInstagram, url: "https://www.instagram.com/coach.luen/", label: "Instagram" },
    { icon: FaFacebook, url: "https://www.facebook.com/populuen/", label: "Facebook" },
    { icon: FaTiktok, url: "https://www.tiktok.com/@coachluen", label: "TikTok" },
    { icon: FaPodcast, url: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280", label: "Podcast" },
  ];

  return (
    <footer className="site-footer py-5 sm:py-6 px-4 md:px-8">
      <div className="studio-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="font-display font-bold tracking-[4px] silver-text text-base sm:text-lg">
              阿倫教官
            </span>
            <span className="hidden sm:inline text-muted text-xs tracking-wider">
              心理學 × 健身講師
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto max-w-full hide-scrollbar">
            {[
              { to: "/", label: "教練介紹" },
              { to: "/courses", label: "線上課程" },
              { to: "/videos", label: "短影音" },
              { to: "/contact", label: "聯絡我" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="nav-link text-[11px] sm:text-xs whitespace-nowrap"
                style={{ letterSpacing: "1px" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {socialLinks.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="footer-social-icon w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm hover:scale-110"
              >
                <s.icon />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-copyright mt-4 pt-4 text-center">
          <p className="text-[9px] sm:text-[10px] tracking-widest">
            © 2026 阿倫教官 - All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
