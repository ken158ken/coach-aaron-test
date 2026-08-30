/**
 * GalleryLP — 相簿/作品集瀑布版 Landing Page
 *
 * 版型：Hero → 圖片瀑布/網格（圖多文少）→ 學員見證 → CTA
 * 模板代號：AARON_GALLERY
 */

import React, { useEffect } from "react";
import {
  pick,
  collectIndexed,
  sectionVisible,
  imgSrc,
  LP_PRIMARY,
  LP_BG,
  LP_SURFACE,
  LP_TEXT,
  LP_BORDER,
  type LPProps,
} from "./lpUtils";
import { useLpShell, LpChrome, mediaCls } from "./lpTheme";

const GalleryLP: React.FC<LPProps> = ({ project, fields }) => {
  const { cssVars, mode, toggle } = useLpShell(project);

  useEffect(() => {
    const prev = document.title;
    document.title = project.seo_title || project.project_name;
    return () => { document.title = prev; };
  }, [project]);

  // Hero
  const heroBg    = project.hero_image_url || pick(fields, "hero_image");
  const heroTitle = pick(fields, "hero_title");
  const heroSub   = pick(fields, "hero_subtitle");

  // Gallery（瀑布流）
  // 完全沒有上傳任何圖片時，顯示 6 個佔位圖格子讓 admin 看得到版面；
  // 一旦有任何項目，就只渲染有內容的項目。
  const galleryTitle = pick(fields, "gallery_title");
  const collected = collectIndexed(fields, "gallery", 12, ["image", "caption"]);
  const galleryItems = collected.length > 0
    ? collected
    : Array.from({ length: 6 }, () => ({ image: "", caption: "" }));

  // Testimonials
  const testiTitle = pick(fields, "testimonials_title");
  const testiItems = collectIndexed(fields, "testimonial", 3, ["avatar", "name", "role", "text"])
    .filter((t) => t.name || t.text);

  // CTA
  const ctaTitle  = pick(fields, "cta_title");
  const ctaDesc   = pick(fields, "cta_desc");
  const ctaBtnTxt = pick(fields, "cta_button_text") || "免費諮詢";
  const ctaBtnUrl = pick(fields, "cta_button_url") || "/booking";

  const showHero  = sectionVisible(project, "hero") && (heroTitle || heroSub || heroBg);
  const showGal   = sectionVisible(project, "gallery");
  const showTesti = sectionVisible(project, "testimonials") && testiItems.length > 0;
  const showCta   = sectionVisible(project, "cta") && (ctaTitle || ctaDesc);

  return (
    <div
      className="lp-root min-h-screen font-sans antialiased"
      style={{ ...cssVars, background: LP_BG, color: LP_TEXT }}
    >
      <LpChrome mode={mode} onToggle={toggle} />

      {/* ── Hero ──────────────────────────────────────────── */}
      {showHero && (
        <section
          className={mediaCls(!!heroBg, "relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden")}
          style={heroBg
            ? { backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(160deg, var(--lp-surface) 0%, var(--lp-bg) 100%)" }}
        >
          {heroBg && <div className="absolute inset-0 bg-black/60" />}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-24">
            {heroTitle && (
              <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-5 tracking-tight">
                <span style={{ color: LP_PRIMARY }}>{heroTitle}</span>
              </h1>
            )}
            {heroSub && (
              <p className="text-lg sm:text-2xl text-white/80 font-light tracking-wide">
                {heroSub}
              </p>
            )}
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${LP_BG})` }}
          />
        </section>
      )}

      {/* ── Gallery（瀑布流）──────────────────────────────── */}
      {showGal && (
        <section className="py-20 sm:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            {galleryTitle && (
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16">
                {galleryTitle}
              </h2>
            )}
            <div className="columns-2 md:columns-3 gap-4">
              {galleryItems.map((g, i) => (
                <figure
                  key={i}
                  className="group relative mb-4 break-inside-avoid rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${LP_BORDER}` }}
                >
                  <img
                    src={imgSrc(g.image)}
                    alt={g.caption || `gallery-${i + 1}`}
                    loading="lazy"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {g.caption && (
                    <figcaption className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <p className="relative text-sm text-white font-medium leading-snug">
                        {g.caption}
                      </p>
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────────── */}
      {showTesti && (
        <section className="py-24 px-6" style={{ background: LP_SURFACE }}>
          <div className="max-w-5xl mx-auto">
            {testiTitle && (
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{testiTitle}</h2>
            )}
            <div className="grid sm:grid-cols-3 gap-6">
              {testiItems.map((t, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 flex flex-col"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${LP_BORDER}` }}
                >
                  <p className="text-4xl mb-4" style={{ color: LP_PRIMARY, opacity: 0.4 }}>"</p>
                  {t.text && (
                    <p className="text-sm text-white/70 leading-relaxed mb-6 flex-1 italic">{t.text}</p>
                  )}
                  <div className="flex items-center gap-3">
                    {t.avatar ? (
                      <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: LP_PRIMARY, color: "#000" }}
                      >
                        {t.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      {t.role && <p className="text-xs text-white/40">{t.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────── */}
      {showCta && (
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${(cssVars as Record<string, string>)["--lp-primary"] ?? "#c5a059"}22 0%, transparent 70%)` }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            {ctaTitle && <h2 className="text-4xl sm:text-5xl font-black mb-6">{ctaTitle}</h2>}
            {ctaDesc && <p className="text-white/60 mb-10 text-lg leading-relaxed">{ctaDesc}</p>}
            <a
              href={ctaBtnUrl}
              className="inline-flex items-center gap-2 px-12 py-5 rounded-full text-black font-bold text-xl transition-all hover:scale-105 hover:opacity-90"
              style={{ background: LP_PRIMARY }}
            >
              {ctaBtnTxt} →
            </a>
          </div>
        </section>
      )}
    </div>
  );
};

export default GalleryLP;
