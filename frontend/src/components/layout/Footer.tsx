/**
 * 頁尾元件 - Studio 風格
 * @module components/layout/Footer
 */

import React from "react";
import { Link } from "react-router-dom";
import { SOCIAL_LINKS } from "@/constants";
import { LogoMark } from "@/components/brand";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Inline SVG 社群圖示
 *
 * 取代 react-icons（原本整包約 555 KiB 進 bundle，而全站僅本檔使用）。
 * 路徑資料與 viewBox 直接取自 react-icons 的 Fa/Si 定義，
 * 並複製其 IconBase 預設屬性（stroke/fill = currentColor、strokeWidth 0、
 * 寬高 1em），因此渲染結果與原本逐像素相同。
 */
type SvgIcon = React.FC;

const svgProps = {
  stroke: "currentColor",
  fill: "currentColor",
  strokeWidth: 0,
  height: "1em",
  width: "1em",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

const IconInstagram: SvgIcon = () => (
  <svg {...svgProps} viewBox="0 0 448 512">
    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
  </svg>
);

const IconFacebook: SvgIcon = () => (
  <svg {...svgProps} viewBox="0 0 512 512">
    <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
  </svg>
);

const IconTiktok: SvgIcon = () => (
  <svg {...svgProps} viewBox="0 0 448 512">
    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
  </svg>
);

const IconPodcast: SvgIcon = () => (
  <svg {...svgProps} viewBox="0 0 448 512">
    <path d="M267.429 488.563C262.286 507.573 242.858 512 224 512c-18.857 0-38.286-4.427-43.428-23.437C172.927 460.134 160 388.898 160 355.75c0-35.156 31.142-43.75 64-43.75s64 8.594 64 43.75c0 32.949-12.871 104.179-20.571 132.813zM156.867 288.554c-18.693-18.308-29.958-44.173-28.784-72.599 2.054-49.724 42.395-89.956 92.124-91.881C274.862 121.958 320 165.807 320 220c0 26.827-11.064 51.116-28.866 68.552-2.675 2.62-2.401 6.986.628 9.187 9.312 6.765 16.46 15.343 21.234 25.363 1.741 3.654 6.497 4.66 9.449 1.891 28.826-27.043 46.553-65.783 45.511-108.565-1.855-76.206-63.595-138.208-139.793-140.369C146.869 73.753 80 139.215 80 220c0 41.361 17.532 78.7 45.55 104.989 2.953 2.771 7.711 1.77 9.453-1.887 4.774-10.021 11.923-18.598 21.235-25.363 3.029-2.2 3.304-6.566.629-9.185zM224 0C100.204 0 0 100.185 0 224c0 89.992 52.602 165.647 125.739 201.408 4.333 2.118 9.267-1.544 8.535-6.31-2.382-15.512-4.342-30.946-5.406-44.339-.146-1.836-1.149-3.486-2.678-4.512-47.4-31.806-78.564-86.016-78.187-147.347.592-96.237 79.29-174.648 175.529-174.899C320.793 47.747 400 126.797 400 224c0 61.932-32.158 116.49-80.65 147.867-.999 14.037-3.069 30.588-5.624 47.23-.732 4.767 4.203 8.429 8.535 6.31C395.227 389.727 448 314.187 448 224 448 100.205 347.815 0 224 0zm0 160c-35.346 0-64 28.654-64 64s28.654 64 64 64 64-28.654 64-64-28.654-64-64-64z" />
  </svg>
);

const IconNotion: SvgIcon = () => (
  <svg {...svgProps} role="img" viewBox="0 0 24 24">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
  </svg>
);

interface SocialLink {
  icon: SvgIcon;
  url: string;
  label: string;
}

const Footer: React.FC = (): JSX.Element => {
  const { t } = useLanguage();

  const socialLinks: SocialLink[] = [
    { icon: IconInstagram, url: SOCIAL_LINKS.INSTAGRAM, label: "Instagram" },
    { icon: IconFacebook, url: SOCIAL_LINKS.FACEBOOK, label: "Facebook" },
    { icon: IconTiktok, url: SOCIAL_LINKS.TIKTOK, label: "TikTok" },
    { icon: IconPodcast, url: SOCIAL_LINKS.PODCAST, label: "Podcast" },
    { icon: IconNotion, url: SOCIAL_LINKS.NOTION, label: "Notion" },
  ];

  return (
    <footer className="site-footer py-5 sm:py-6 px-4 md:px-8">
      <div className="studio-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">

          {/* Brand：用 mark + 銀刃字，而非橫式 lockup —— 頁尾單列高度下
              lockup 的次行「AARON COACH」只剩約 7px，且會失去 silver-text 效果 */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LogoMark className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
            <span className="font-display font-bold tracking-[4px] silver-text text-base sm:text-lg">
              {t.layoutExtra.brandName}
            </span>
            <span className="hidden sm:inline text-muted text-xs tracking-wider">
              {t.layoutExtra.brandTagline}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto max-w-full hide-scrollbar">
            {[
              { to: "/", label: t.nav.home },
              { to: "/courses", label: t.nav.courses },
              { to: "/videos", label: t.nav.videos },
              { to: "/contact", label: t.nav.contact },
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
            © 2026 {t.layoutExtra.brandName} - {t.layoutExtra.rightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
