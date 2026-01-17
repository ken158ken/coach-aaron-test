/**
 * 首頁英雄區塊元件
 * @module components/Hero
 */

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaPodcast,
  FaStar,
} from "react-icons/fa";
import type { IconType } from "react-icons";

interface SocialLink {
  icon: IconType;
  url: string;
  color: string;
}

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("gsap").then(({ default: gsap }) => {
      const tl = gsap.timeline();

      if (heroRef.current && textRef.current && btnRef.current) {
        tl.fromTo(heroRef.current, { opacity: 0 }, { opacity: 1, duration: 1 })
          .fromTo(
            textRef.current.children,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.2,
              ease: "power3.out",
            },
          )
          .fromTo(
            btnRef.current,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
          );
      }
    });
  }, []);

  const socialLinks: SocialLink[] = [
    {
      icon: FaInstagram,
      url: "https://www.instagram.com/coach.luen/",
      color: "hover:text-pink-500",
    },
    {
      icon: FaFacebook,
      url: "https://www.facebook.com/populuen/",
      color: "hover:text-blue-500",
    },
    {
      icon: FaTiktok,
      url: "https://www.tiktok.com/@coachluen",
      color: "hover:text-white",
    },
    {
      icon: FaPodcast,
      url: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
      color: "hover:text-purple-500",
    },
  ];

  return (
    <div
      ref={heroRef}
      className="hero min-h-screen bg-base-200"
      style={{
        backgroundImage: "url(/photos/coach-2.jpg)",
        backgroundPosition: "center -300px",
        backgroundSize: "cover",
      }}
    >
      <div className="hero-overlay bg-black bg-opacity-70"></div>
      <div className="hero-content pt-10 md:pt-14 text-center text-neutral-content">
        <div className="max-w-lg">
          <div ref={textRef}>
            <p className="text-lg mb-2 tracking-widest opacity-80">
              心理學 × 健身講師
            </p>
            <h1 className="mb-5 text-5xl md:text-6xl font-bold">
              <span className="text-primary">阿倫教官</span>
            </h1>
            <p className="mb-4 text-lg leading-relaxed">
              運動和健身是一件不容易的事情，
              <br />
              結合心理學知識,幫助你在讓自己身體更好的路上,
              <br />
              同時有著心理層次的支持。
            </p>
            {/* Podcast 評分 */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={i < 5 ? "" : "opacity-30"} />
                ))}
              </div>
              <span className="text-sm opacity-80">
                4.8 • 54則評價 • 58集Podcast
              </span>
            </div>
            {/* Social Links */}
            <div className="flex justify-center gap-4 mb-8">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-circle btn-ghost text-2xl ${social.color} transition-colors`}
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>
          <div
            ref={btnRef}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/courses"
              className="btn btn-primary btn-lg border-0 shadow-lg hover:scale-105 transition-transform duration-300"
            >
              開始訓練
            </Link>
            <a
              href="https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-black"
            >
              🎧 收聽Podcast
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
