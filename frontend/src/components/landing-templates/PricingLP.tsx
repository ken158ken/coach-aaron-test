/**
 * PricingLP — 定價方案 Landing Page
 *
 * 版型：Hero → 3 欄定價卡 → FAQ 手風琴 → CTA
 * 模板代號：AARON_PRICING
 */

import React, { useEffect, useMemo, useState } from "react";
import { buildCssVars, pick, type LPProps } from "./lpUtils";

const PricingLP: React.FC<LPProps> = ({ project, fields }) => {
  const cssVars = useMemo(() => buildCssVars(project), [project]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = project.seo_title || project.project_name;
    return () => { document.title = prev; };
  }, [project]);

  const heroTitle = pick(fields, "hero_title");
  const heroSub   = pick(fields, "hero_subtitle");

  // Plans
  const plans = [1, 2, 3].map((i) => ({
    name:     pick(fields, `plan_${i}_name`),
    price:    pick(fields, `plan_${i}_price`),
    period:   pick(fields, `plan_${i}_period`),
    badge:    pick(fields, `plan_${i}_badge`),
    features: pick(fields, `plan_${i}_features`),
    ctaTxt:   pick(fields, `plan_${i}_cta_text`) || "立即報名",
    ctaUrl:   pick(fields, `plan_${i}_cta_url`) || "/booking",
    featured: i === 2, // middle card is featured
  })).filter((p) => p.name);

  // FAQ
  const faqTitle = pick(fields, "faq_title");
  const faqs = [1, 2, 3, 4].map((i) => ({
    q: pick(fields, `faq_${i}_question`),
    a: pick(fields, `faq_${i}_answer`),
  })).filter((f) => f.q);

  // CTA
  const ctaTitle  = pick(fields, "cta_title");
  const ctaDesc   = pick(fields, "cta_desc");
  const ctaBtnTxt = pick(fields, "cta_button_text") || "免費諮詢";
  const ctaBtnUrl = pick(fields, "cta_button_url") || "/booking";

  return (
    <div className="min-h-screen font-sans antialiased" style={{ ...cssVars, background: "var(--lp-bg, #0a0a0a)", color: "var(--lp-text, #ffffff)" }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          {heroTitle && (
            <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">{heroTitle}</h1>
          )}
          {heroSub && (
            <p className="text-lg text-white/60 leading-relaxed">{heroSub}</p>
          )}
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────────────────── */}
      {plans.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 flex flex-col transition-all ${plan.featured ? "ring-2 scale-[1.03]" : ""}`}
                style={{
                  background: plan.featured ? `linear-gradient(135deg, var(--lp-surface, #141414) 0%, rgba(201,169,110,0.05) 100%)` : "var(--lp-surface, #141414)",
                  border: `1px solid ${plan.featured ? "var(--lp-primary, #c5a059)" : "var(--lp-border, rgba(255,255,255,0.1))"}`,
                  outline: plan.featured ? "2px solid var(--lp-primary, #c5a059)" : undefined,
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-black whitespace-nowrap"
                    style={{ background: "var(--lp-primary, #c5a059)" }}
                  >
                    {plan.badge}
                  </span>
                )}

                {/* Plan name */}
                <h3 className="text-xl font-bold mb-4" style={{ color: plan.featured ? "var(--lp-primary, #c5a059)" : "inherit" }}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.period && <span className="text-white/40 ml-1 text-sm">{plan.period}</span>}
                </div>

                {/* Features list */}
                {plan.features && (
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.split("\n").filter(Boolean).map((feat, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                        <span className="mt-0.5 shrink-0" style={{ color: "var(--lp-primary, #c5a059)" }}>✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <a
                  href={plan.ctaUrl}
                  className="block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={plan.featured
                    ? { background: "var(--lp-primary, #c5a059)", color: "#000" }
                    : { border: "1px solid var(--lp-border, rgba(255,255,255,0.2))", color: "var(--lp-text, #fff)" }
                  }
                >
                  {plan.ctaTxt}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            {faqTitle && (
              <h2 className="text-3xl font-bold text-center mb-12">{faqTitle}</h2>
            )}
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--lp-border, rgba(255,255,255,0.1))" }}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-sm font-medium transition-colors hover:bg-white/5"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {faq.q}
                    <span
                      className="shrink-0 text-lg transition-transform"
                      style={{ color: "var(--lp-primary, #c5a059)", transform: openFaq === i ? "rotate(45deg)" : "none" }}
                    >
                      +
                    </span>
                  </button>
                  {openFaq === i && faq.a && (
                    <div className="px-6 pb-5 text-sm text-white/60 leading-relaxed border-t" style={{ borderColor: "var(--lp-border, rgba(255,255,255,0.1))" }}>
                      <p className="pt-4">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "var(--lp-surface, #141414)" }}>
        <div className="max-w-xl mx-auto text-center">
          {ctaTitle && <h2 className="text-3xl font-bold mb-4">{ctaTitle}</h2>}
          {ctaDesc && <p className="text-white/60 mb-8 leading-relaxed">{ctaDesc}</p>}
          <a
            href={ctaBtnUrl}
            className="inline-block px-10 py-4 rounded-xl font-bold text-black transition-all hover:scale-105 hover:opacity-90"
            style={{ background: "var(--lp-primary, #c5a059)" }}
          >
            {ctaBtnTxt}
          </a>
        </div>
      </section>
    </div>
  );
};

export default PricingLP;
