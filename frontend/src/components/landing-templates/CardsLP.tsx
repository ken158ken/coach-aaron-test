/**
 * CardsLP — 圖文卡片網格版 Landing Page
 *
 * 版型：Hero → 圖文卡片網格（每卡：圖 + 標題 + 說明 + 選用按鈕）→ CTA
 * 模板代號：AARON_CARDS
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
  LP_MUTED,
  LP_BORDER,
  type LPProps,
} from "./lpUtils";
import { useLpShell, LpChrome, mediaCls } from "./lpTheme";

const CardsLP: React.FC<LPProps> = ({ project, fields }) => {
  const { cssVars, mode, toggle } = useLpShell(project);

  useEffect(() => {
    const prev = document.title;
    document.title = project.seo_title || project.project_name;
    return () => {
      document.title = prev;
    };
  }, [project]);

  // ── Hero ──
  const heroBg = project.hero_image_url || pick(fields, "hero_image");
  const heroTitle = pick(fields, "hero_title");
  const heroSub = pick(fields, "hero_subtitle");
  const heroCtaTxt = pick(fields, "hero_cta_text");
  const heroCtaUrl = pick(fields, "hero_cta_url") || "/booking";

  // ── Cards ──
  const cardsTitle = pick(fields, "cards_title");
  const cards = collectIndexed(fields, "card", 9, [
    "image",
    "title",
    "desc",
    "cta_text",
    "cta_url",
  ]);

  // ── CTA ──
  const ctaTitle = pick(fields, "cta_title");
  const ctaDesc = pick(fields, "cta_desc");
  const ctaBtnTxt = pick(fields, "cta_button_text") || "免費諮詢";
  const ctaBtnUrl = pick(fields, "cta_button_url") || "/booking";

  const showHero =
    sectionVisible(project, "hero") &&
    (heroBg || heroTitle || heroSub || heroCtaTxt);
  const showCards =
    sectionVisible(project, "cards") && (cardsTitle || cards.length > 0);
  const showCta =
    sectionVisible(project, "cta") && (ctaTitle || ctaDesc || ctaBtnTxt);

  return (
    <div
      className="lp-root min-h-screen font-sans antialiased"
      style={{ ...cssVars, background: LP_BG, color: LP_TEXT }}
    >
      <LpChrome mode={mode} onToggle={toggle} />
      {/* ── Hero ──────────────────────────────────────────── */}
      {showHero && (
        <section
          className={mediaCls(!!heroBg, "relative min-h-[55vh] sm:min-h-[65vh] flex items-center justify-center overflow-hidden")}
          style={
            heroBg
              ? {
                  backgroundImage: `url(${heroBg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: "linear-gradient(160deg, var(--lp-surface) 0%, var(--lp-bg) 100%)" }
          }
        >
          {heroBg && <div className="absolute inset-0 bg-black/60" />}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-24">
            {heroTitle && (
              <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-5 tracking-tight">
                <span style={{ color: LP_PRIMARY }}>{heroTitle}</span>
              </h1>
            )}
            {heroSub && (
              <p className="text-lg sm:text-2xl text-white/80 font-light mb-8 tracking-wide">
                {heroSub}
              </p>
            )}
            {heroCtaTxt && (
              <a
                href={heroCtaUrl}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-black font-bold text-lg transition-all hover:scale-105 hover:opacity-90 active:scale-100"
                style={{ background: LP_PRIMARY }}
              >
                {heroCtaTxt}
                <span>→</span>
              </a>
            )}
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${LP_BG})` }}
          />
        </section>
      )}

      {/* ── Cards Grid ────────────────────────────────────── */}
      {showCards && (
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            {cardsTitle && (
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
                {cardsTitle}
              </h2>
            )}
            {cards.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1"
                    style={{
                      background: LP_SURFACE,
                      border: `1px solid ${LP_BORDER}`,
                    }}
                  >
                    <img
                      src={imgSrc(card.image)}
                      alt={card.title}
                      className="w-full aspect-video object-cover rounded-t-2xl"
                    />
                    <div className="p-6 flex flex-col flex-1">
                      {card.title && (
                        <h3
                          className="text-lg font-bold mb-3"
                          style={{ color: LP_PRIMARY }}
                        >
                          {card.title}
                        </h3>
                      )}
                      {card.desc && (
                        <p
                          className="text-sm leading-relaxed flex-1"
                          style={{ color: LP_MUTED }}
                        >
                          {card.desc}
                        </p>
                      )}
                      {card.cta_text && (
                        <a
                          href={card.cta_url || "#"}
                          className="inline-flex items-center gap-1 mt-5 text-sm font-semibold transition-opacity hover:opacity-70"
                          style={{ color: LP_PRIMARY }}
                        >
                          {card.cta_text}
                          <span>→</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────── */}
      {showCta && (
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${
                (cssVars as Record<string, string>)["--lp-primary"] ?? "#c5a059"
              }22 0%, transparent 70%)`,
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            {ctaTitle && (
              <h2 className="text-4xl sm:text-5xl font-black mb-6">{ctaTitle}</h2>
            )}
            {ctaDesc && (
              <p className="text-white/60 mb-10 text-lg leading-relaxed">
                {ctaDesc}
              </p>
            )}
            {ctaBtnTxt && (
              <a
                href={ctaBtnUrl}
                className="inline-flex items-center gap-2 px-12 py-5 rounded-full text-black font-bold text-xl transition-all hover:scale-105 hover:opacity-90"
                style={{ background: LP_PRIMARY }}
              >
                {ctaBtnTxt} →
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default CardsLP;
