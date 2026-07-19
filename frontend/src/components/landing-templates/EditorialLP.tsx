/**
 * EditorialLP — 左右交錯雜誌式 Landing Page
 *
 * 版型：Hero → 多組圖文交錯區塊（左圖右文 / 右圖左文 自動交替）→ CTA
 * 模板代號：AARON_EDITORIAL
 */

import React, { useEffect, useMemo } from "react";
import {
  buildCssVars,
  collectIndexed,
  imgSrc,
  pick,
  sectionVisible,
  LP_PRIMARY,
  LP_BG,
  LP_SURFACE,
  LP_TEXT,
  LP_MUTED,
  LP_BORDER,
  type LPProps,
} from "./lpUtils";

const EditorialLP: React.FC<LPProps> = ({ project, fields }) => {
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

  // ── Blocks（圖文交錯，最多 8 組）──
  const blocks = collectIndexed(fields, "block", 8, [
    "image", "title", "desc", "cta_text", "cta_url",
  ] as const);

  // ── CTA ──
  const ctaTitle  = pick(fields, "cta_title");
  const ctaDesc   = pick(fields, "cta_desc");
  const ctaBtnTxt = pick(fields, "cta_button_text") || "免費諮詢";
  const ctaBtnUrl = pick(fields, "cta_button_url") || "/booking";

  return (
    <div
      className="min-h-screen font-sans antialiased"
      style={{ ...cssVars, background: LP_BG, color: LP_TEXT }}
    >

      {/* ── Hero ──────────────────────────────────────────── */}
      {sectionVisible(project, "hero") && (
        <section
          className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
          style={heroBg
            ? { backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `linear-gradient(160deg, ${LP_SURFACE} 0%, ${LP_BG} 100%)` }}
        >
          {heroBg && <div className="absolute inset-0 bg-black/60" />}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-32">
            {heroSub && (
              <p className="text-sm sm:text-base font-light uppercase tracking-[0.3em] mb-6"
                style={{ color: LP_PRIMARY }}>
                {heroSub}
              </p>
            )}
            {heroTitle && (
              <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-8 tracking-tight">
                {heroTitle}
              </h1>
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

      {/* ── Blocks（圖文交錯）──────────────────────────────── */}
      {sectionVisible(project, "blocks") && blocks.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto flex flex-col gap-20 sm:gap-28">
            {blocks.map((block, i) => {
              const imageRight = i % 2 === 1; // 偶數圖在左，奇數圖在右
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-8 sm:gap-12 ${
                    imageRight ? "sm:flex-row-reverse" : "sm:flex-row"
                  }`}
                >
                  {/* 圖片側 */}
                  <div className="w-full sm:w-1/2">
                    <img
                      src={imgSrc(block.image)}
                      alt={block.title}
                      className="w-full aspect-[4/3] object-cover rounded-2xl"
                      style={{ border: `1px solid ${LP_BORDER}` }}
                    />
                  </div>

                  {/* 文字側 */}
                  <div className="w-full sm:w-1/2">
                    {block.title && (
                      <h2 className="text-2xl sm:text-4xl font-bold mb-5 leading-tight"
                        style={{ color: LP_PRIMARY }}>
                        {block.title}
                      </h2>
                    )}
                    {block.desc && (
                      <p className="text-base leading-relaxed mb-8 whitespace-pre-line"
                        style={{ color: LP_MUTED }}>
                        {block.desc}
                      </p>
                    )}
                    {block.cta_text && (
                      <a
                        href={block.cta_url || "#"}
                        className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold transition-all hover:scale-105 hover:opacity-90"
                        style={{ border: `1px solid ${LP_PRIMARY}`, color: LP_PRIMARY }}
                      >
                        {block.cta_text}
                        <span>→</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────── */}
      {sectionVisible(project, "cta") && (
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${(cssVars as Record<string, string>)["--lp-primary"] ?? "#c5a059"}22 0%, transparent 70%)` }} />
          <div className="relative z-10 max-w-2xl mx-auto">
            {ctaTitle && <h2 className="text-4xl sm:text-5xl font-black mb-6">{ctaTitle}</h2>}
            {ctaDesc && (
              <p className="mb-10 text-lg leading-relaxed" style={{ color: LP_MUTED }}>{ctaDesc}</p>
            )}
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

export default EditorialLP;
