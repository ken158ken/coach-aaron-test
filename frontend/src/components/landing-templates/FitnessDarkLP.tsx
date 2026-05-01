/**
 * FitnessDarkLP — 健身深黑版 Landing Page
 *
 * 版型：全寬 Hero → 數據帶 → 特色卡片 → 見證輪播 → CTA
 * 模板代號：AARON_FITNESS_DARK
 */

import React, { useEffect, useMemo } from "react";
import { buildCssVars, byGroup, pick, isImage, fv, type LPProps } from "./lpUtils";

const FitnessDarkLP: React.FC<LPProps> = ({ project, fields }) => {
  const cssVars = useMemo(() => buildCssVars(project), [project]);

  useEffect(() => {
    const prev = document.title;
    document.title = project.seo_title || project.project_name;
    return () => { document.title = prev; };
  }, [project]);

  const hero  = byGroup(fields, "hero");
  const testi = byGroup(fields, "testimonials");

  const heroBg     = project.hero_image_url || fv(hero.find(isImage) ?? ({} as never));
  const heroTitle  = pick(fields, "hero_title");
  const heroSub    = pick(fields, "hero_subtitle");
  const heroDesc   = pick(fields, "hero_description");
  const heroCtaTxt = pick(fields, "hero_cta_text");
  const heroCtaUrl = pick(fields, "hero_cta_url") || "/booking";

  // Stats (max 3)
  const statItems = [1, 2, 3].map((i) => ({
    number: pick(fields, `stat_${i}_number`),
    label:  pick(fields, `stat_${i}_label`),
  })).filter((s) => s.number);

  // Features
  const featureTitle = pick(fields, "features_title");
  const featureItems = [1, 2, 3].map((i) => ({
    icon:  pick(fields, `feature_${i}_icon`),
    title: pick(fields, `feature_${i}_title`),
    desc:  pick(fields, `feature_${i}_desc`),
  })).filter((f) => f.title);

  // Testimonials
  const testiTitle = pick(fields, "testimonials_title");
  const testiItems = [1, 2, 3].map((i) => ({
    avatar: fv(testi.find((f) => f.field_key === `testimonial_${i}_avatar`) ?? ({} as never)),
    name:   pick(fields, `testimonial_${i}_name`),
    role:   pick(fields, `testimonial_${i}_role`),
    text:   pick(fields, `testimonial_${i}_text`),
  })).filter((t) => t.name || t.text);

  // CTA
  const ctaTitle  = pick(fields, "cta_title");
  const ctaDesc   = pick(fields, "cta_desc");
  const ctaBtnTxt = pick(fields, "cta_button_text") || "免費諮詢";
  const ctaBtnUrl = pick(fields, "cta_button_url") || "/booking";

  return (
    <div className="min-h-screen font-sans antialiased" style={{ ...cssVars, background: "var(--lp-bg, #0a0a0a)", color: "var(--lp-text, #ffffff)" }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={heroBg ? { backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center top" } : { background: "linear-gradient(160deg, #111 0%, #0a0a0a 100%)" }}
      >
        {heroBg && <div className="absolute inset-0 bg-black/60" />}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-32">
          {heroTitle && (
            <h1 className="text-5xl sm:text-7xl font-black leading-none mb-6 tracking-tight">
              <span style={{ color: "var(--lp-primary, #c5a059)" }}>{heroTitle}</span>
            </h1>
          )}
          {heroSub && (
            <p className="text-xl sm:text-2xl text-white/80 font-light mb-4 tracking-wide">
              {heroSub}
            </p>
          )}
          {heroDesc && (
            <p className="text-base text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">{heroDesc}</p>
          )}
          {heroCtaTxt && (
            <a
              href={heroCtaUrl}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-black font-bold text-lg transition-all hover:scale-105 hover:opacity-90 active:scale-100"
              style={{ background: "var(--lp-primary, #c5a059)" }}
            >
              {heroCtaTxt}
              <span>→</span>
            </a>
          )}
        </div>
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--lp-bg, #0a0a0a))" }} />
      </section>

      {/* ── Stats Band ────────────────────────────────────── */}
      {statItems.length > 0 && (
        <section className="py-16 px-6" style={{ background: "var(--lp-surface, #141414)" }}>
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
            {statItems.map((s, i) => (
              <div key={i}>
                <p className="text-4xl sm:text-5xl font-black mb-2" style={{ color: "var(--lp-primary, #c5a059)" }}>{s.number}</p>
                <p className="text-sm text-white/50 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Features ──────────────────────────────────────── */}
      {featureItems.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            {featureTitle && (
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
                {featureTitle}
              </h2>
            )}
            <div className="grid sm:grid-cols-3 gap-6">
              {featureItems.map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-8 transition-all hover:-translate-y-1"
                  style={{ background: "var(--lp-surface, #141414)", border: "1px solid var(--lp-border, rgba(255,255,255,0.1))" }}
                >
                  {f.icon && <div className="text-4xl mb-4">{f.icon}</div>}
                  <h3 className="text-lg font-bold mb-3" style={{ color: "var(--lp-primary, #c5a059)" }}>{f.title}</h3>
                  {f.desc && <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────────── */}
      {testiItems.length > 0 && (
        <section className="py-24 px-6" style={{ background: "var(--lp-surface, #141414)" }}>
          <div className="max-w-5xl mx-auto">
            {testiTitle && (
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{testiTitle}</h2>
            )}
            <div className="grid sm:grid-cols-3 gap-6">
              {testiItems.map((t, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 flex flex-col"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--lp-border, rgba(255,255,255,0.1))" }}
                >
                  <p className="text-4xl mb-4" style={{ color: "var(--lp-primary, #c5a059)", opacity: 0.4 }}>"</p>
                  {t.text && (
                    <p className="text-sm text-white/70 leading-relaxed mb-6 flex-1 italic">{t.text}</p>
                  )}
                  <div className="flex items-center gap-3">
                    {t.avatar ? (
                      <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: "var(--lp-primary, #c5a059)", color: "#000" }}>
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
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${(cssVars as Record<string, string>)["--lp-primary"] ?? "#c5a059"}22 0%, transparent 70%)` }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          {ctaTitle && <h2 className="text-4xl sm:text-5xl font-black mb-6">{ctaTitle}</h2>}
          {ctaDesc && <p className="text-white/60 mb-10 text-lg leading-relaxed">{ctaDesc}</p>}
          <a
            href={ctaBtnUrl}
            className="inline-flex items-center gap-2 px-12 py-5 rounded-full text-black font-bold text-xl transition-all hover:scale-105 hover:opacity-90"
            style={{ background: "var(--lp-primary, #c5a059)" }}
          >
            {ctaBtnTxt} →
          </a>
        </div>
      </section>
    </div>
  );
};

export default FitnessDarkLP;
