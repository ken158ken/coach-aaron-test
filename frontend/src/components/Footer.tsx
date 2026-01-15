/**
 * 頁尾元件
 * @module components/Footer
 */

import React from "react";
import { FaInstagram, FaFacebook, FaTiktok, FaPodcast } from "react-icons/fa";
import type { IconType } from "react-icons";

interface SocialLink {
  icon: IconType;
  url: string;
  label: string;
}

const Footer: React.FC = () => {
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
    <footer className="footer footer-center p-10 bg-neutral text-neutral-content">
      <aside>
        <p className="font-bold text-2xl tracking-tighter">
          <span className="text-primary">阿倫教官</span>
        </p>
        <p className="text-sm opacity-80">心理學 × 健身講師</p>
        <p className="font-bold mt-2">Podcast「陪你健身」</p>
      </aside>
      <nav>
        <div className="flex gap-4">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-circle text-xl hover:text-primary transition-colors"
              aria-label={social.label}
            >
              <social.icon />
            </a>
          ))}
        </div>
      </nav>
      <aside>
        <p className="text-sm opacity-60">
          Copyright © 2025 阿倫教官 - All rights reserved
        </p>
      </aside>
    </footer>
  );
};

export default Footer;
