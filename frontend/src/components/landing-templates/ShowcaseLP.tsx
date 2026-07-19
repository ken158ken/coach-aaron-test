/**
 * ShowcaseLP — 全寬大圖視覺式 Landing Page
 *
 * 版型：全屏 Hero → 多段「全寬大圖 + 疊字」→ 數據帶 → CTA
 * 視覺衝擊強、電影感。
 * 模板代號：AARON_SHOWCASE
 */

import React, { useEffect, useMemo } from "react";
import {
  buildCssVars,
  pick,
  collectIndexed,
  sectionVisible,
  imgSrc,
  LP_PRIMARY,
  LP_BG,
  LP_SURFACE,
  LP_TEXT,
  LP_MUTED,
  type LPProps,
} from "./lpUtils";

const ShowcaseLP: React.FC<LPProps> = ({ project, fields }) => {
  const cssVars = useMemo(() => buildCssVars(project), [project]);

  useEffect(() => {
    const prev = document.title;
    document.title = project.seo_title || project.project_name;
    return () => { document.title = prev; };
  }, [project]);

  // ── Hero ──
  const heroBg     = project.hero_image_url || pick(fields, "hero_image");
  const heroTitle  = pick(fields, "hero_title");
  const heroSub    = pick(fields, "hero_subtitle");
  const heroCtaTxt = pick(fields, "hero_cta_text");
  const heroCtaUrl = pick(fields, "hero_cta_url") || "/booking";

  // ── Scenes（多段全寬大圖）──
  const scenes = collectIndexed(fields, "scene", 6, ["image", "title", "desc"]);

  // ── Stats（數據帶）──
  const statItems = collectIndexed(fields, "stat", 3, ["number", "label"])
    .filter((s) => s.number);

  // ── CTA ──
  const ctaTitle  = pick(fields, "cta_title");
  const ctaDesc   = pick(fields, "cta_desc");
  const ctaBtnTxt = pick(fields, "cta_button_text") || "免費諮詢";
  const ctaBtnUrl = pick(fields, "cta_button_url") || "/booking";

  const primaryHex = (cssVars as Record<string, string>)["--lp-primary"] ?? "#c5a059";

  const statCols =
    statItems.length === 1 ? "grid-cols-1"
    : statItems.length === 2 ? "grid-cols-2"
    : "grid-cols-3";

  return (
    <div className="min-h-screen font-sans antialiased" style={{ ...cssVars, background: LP_BG, color: LP_TEXT }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      {sectionVisible(project, "hero") && (heroBg || heroTitle || heroSub) && (
        <section
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={heroBg
            ? { backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(160deg, #111 0%, #0a0a0a 100%)" }}
        >
          {heroBg && <div className="absolute inset-0 bg-black/60" />}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-32">
            {heroTitle && (
              <h1 className="text-6xl sm:text-7xl font-black leading-none mb-6 tracking-tight" style={{ color: LP_PRIMARY }}>
                {heroTitle}
              </h1>
            )}
            {heroSub && (
              <p className="text-xl sm:text-2xl text-white/80 font-light mb-10 tracking-wide max-w-2xl mx-auto leading-relaxed">
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
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${LP_BG})` }} />
        </section>
      )}

      {/* ── Scenes（多段全寬大圖 + 疊字）──────────────────── */}
      {sectionVisible(project, "scenes") && scenes.length > 0 && (
        <div>
          {scenes.map((scene, i) => (
            <section
              key={i}
              className="relative min-h-[80vh] flex items-end overflow-hidden"
              style={{ backgroundImage: `url(${imgSrc(scene.image)})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              {/* 電影感深色漸層 overlay：上方淡、下方濃，讓段落間視覺連續 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.85) 100%)" }}
              />
              <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 pb-16 sm:pb-24">
                {scene.title && (
                  <h2 className="text-4xl sm:text-6xl font-black leading-tight mb-4 tracking-tight" style={{ color: LP_PRIMARY }}>
                    {scene.title}
                  </h2>
                )}
                {scene.desc && (
                  <p className="text-base sm:text-xl text-white/80 font-light max-w-2xl leading-relaxed">
                    {scene.desc}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Stats Band（數據帶）────────────────────────────── */}
      {sectionVisible(project, "stats") && statItems.length > 0 && (
        <section className="py-16 px-6" style={{ background: LP_SURFACE }}>
          <div className={`max-w-4xl mx-auto grid ${statCols} gap-8 text-center`}>
            {statItems.map((s, i) => (
              <div key={i}>
                <p className="text-4xl sm:text-5xl font-black mb-2" style={{ color: LP_PRIMARY }}>{s.number}</p>
                {s.label && <p className="text-sm uppercase tracking-widest" style={{ color: LP_MUTED }}>{s.label}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────── */}
      {sectionVisible(project, "cta") && (ctaTitle || ctaDesc) && (
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${primaryHex}22 0%, transparent 70%)` }} />
          <div className="relative z-10 max-w-2xl mx-auto">
            {ctaTitle && <h2 className="text-4xl sm:text-5xl font-black mb-6">{ctaTitle}</h2>}
            {ctaDesc && <p className="mb-10 text-lg leading-relaxed" style={{ color: LP_MUTED }}>{ctaDesc}</p>}
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

export default ShowcaseLP;
