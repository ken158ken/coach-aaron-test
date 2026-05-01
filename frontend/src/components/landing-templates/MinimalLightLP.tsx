/**
 * MinimalLightLP — 極簡亮色 Landing Page
 *
 * 版型：留白 Hero → 分割介紹 → 大引言 → 4 格特色 → CTA
 * 模板代號：AARON_MINIMAL_LIGHT
 * 預設主題：簡約白（light_classic variant）
 */

import React, { useEffect, useMemo } from "react";
import { buildCssVars, pick, isImage, fv, byGroup, type LPProps } from "./lpUtils";

const MinimalLightLP: React.FC<LPProps> = ({ project, fields }) => {
  const cssVars = useMemo(() => buildCssVars(project), [project]);

  useEffect(() => {
    const prev = document.title;
    document.title = project.seo_title || project.project_name;
    return () => { document.title = prev; };
  }, [project]);

  const heroTitle  = pick(fields, "hero_title");
  const heroSub    = pick(fields, "hero_subtitle");
  const heroCtaTxt = pick(fields, "hero_cta_text") || "預約免費諮詢";
  const heroCtaUrl = pick(fields, "hero_cta_url") || "/booking";

  const aboutGroup   = byGroup(fields, "about");
  const aboutImg     = fv(aboutGroup.find(isImage) ?? ({} as never));
  const aboutTitle   = pick(fields, "about_title");
  const aboutBody    = pick(fields, "about_body");

  const quoteText        = pick(fields, "quote_text");
  const quoteAuthor      = pick(fields, "quote_author");
  const quoteAuthorTitle = pick(fields, "quote_author_title");

  const featureItems = [1, 2, 3, 4].map((i) => ({
    title: pick(fields, `feature_${i}_title`),
    desc:  pick(fields, `feature_${i}_desc`),
  })).filter((f) => f.title);

  const ctaTitle  = pick(fields, "cta_title");
  const ctaBtnTxt = pick(fields, "cta_button_text") || "預約免費評估";
  const ctaBtnUrl = pick(fields, "cta_button_url") || "/booking";

  return (
    <div className="min-h-screen font-sans antialiased" style={{ ...cssVars, background: "var(--lp-bg, #ffffff)", color: "var(--lp-text, #111827)" }}>

      {/* ── Hero (簡潔居中) ──────────────────────────────── */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-8 py-24">
        <div className="max-w-3xl mx-auto">
          {project.logo_url && (
            <img src={project.logo_url} alt="logo" className="h-12 mx-auto mb-12 opacity-80" />
          )}
          {heroTitle && (
            <h1 className="text-5xl sm:text-6xl font-light leading-tight mb-6 tracking-tight" style={{ color: "var(--lp-text, #111827)" }}>
              {heroTitle}
            </h1>
          )}
          {heroSub && (
            <p className="text-xl text-gray-500 mb-12 leading-relaxed font-light max-w-xl mx-auto"
              style={{ color: "var(--lp-muted, #6b7280)" }}>
              {heroSub}
            </p>
          )}
          <a
            href={heroCtaUrl}
            className="inline-block px-8 py-4 rounded-full font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ background: "var(--lp-primary, #2563eb)" }}
          >
            {heroCtaTxt}
          </a>
        </div>
      </section>

      {/* ── About — split layout ─────────────────────────── */}
      {(aboutImg || aboutTitle || aboutBody) && (
        <section className="py-24 px-8" style={{ background: "var(--lp-surface, #f8fafc)" }}>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            {/* Image side */}
            {aboutImg ? (
              <div className="rounded-3xl overflow-hidden aspect-[4/5] shadow-xl">
                <img src={aboutImg} alt={aboutTitle} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-3xl aspect-[4/5] flex items-center justify-center"
                style={{ background: "var(--lp-border, rgba(0,0,0,0.05))" }}>
                <span className="text-6xl opacity-20">📷</span>
              </div>
            )}
            {/* Text side */}
            <div>
              <div className="w-8 h-0.5 mb-8" style={{ background: "var(--lp-primary, #2563eb)" }} />
              {aboutTitle && (
                <h2 className="text-3xl font-semibold mb-6 leading-snug">{aboutTitle}</h2>
              )}
              {aboutBody && (
                <p className="text-base leading-loose" style={{ color: "var(--lp-muted, #6b7280)" }}>{aboutBody}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Pull Quote ───────────────────────────────────── */}
      {quoteText && (
        <section className="py-24 px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-4xl font-light leading-tight mb-8 italic" style={{ color: "var(--lp-text, #111827)" }}>
              <span style={{ color: "var(--lp-primary, #2563eb)", fontSize: "4rem", lineHeight: 0, verticalAlign: "text-bottom" }}>"</span>
              {" "}{quoteText}
            </p>
            {quoteAuthor && (
              <p className="font-semibold" style={{ color: "var(--lp-primary, #2563eb)" }}>{quoteAuthor}</p>
            )}
            {quoteAuthorTitle && (
              <p className="text-sm mt-1" style={{ color: "var(--lp-muted, #6b7280)" }}>{quoteAuthorTitle}</p>
            )}
          </div>
        </section>
      )}

      {/* ── Features — 2×2 grid ──────────────────────────── */}
      {featureItems.length > 0 && (
        <section className="py-24 px-8" style={{ background: "var(--lp-surface, #f8fafc)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-10">
              {featureItems.map((f, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-1 shrink-0 rounded-full mt-1" style={{ background: "var(--lp-primary, #2563eb)" }} />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    {f.desc && <p className="text-sm leading-relaxed" style={{ color: "var(--lp-muted, #6b7280)" }}>{f.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA (minimal) ────────────────────────────────── */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-lg mx-auto">
          {ctaTitle && <h2 className="text-4xl font-light mb-8">{ctaTitle}</h2>}
          <a
            href={ctaBtnUrl}
            className="inline-block px-10 py-4 rounded-full text-white font-semibold transition-all hover:opacity-90 hover:scale-105"
            style={{ background: "var(--lp-primary, #2563eb)" }}
          >
            {ctaBtnTxt} →
          </a>
        </div>
      </section>
    </div>
  );
};

export default MinimalLightLP;
