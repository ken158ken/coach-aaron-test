/**
 * StoryLP — 個人故事版 Landing Page
 *
 * 版型：電影感全屏 Hero → 關於我（分割） → 垂直時間軸 → Gallery → 聯絡 CTA
 * 模板代號：AARON_STORY
 */

import React, { useEffect, useMemo } from "react";
import { buildCssVars, pick, isImage, fv, byGroup, type LPProps } from "./lpUtils";

const StoryLP: React.FC<LPProps> = ({ project, fields }) => {
  const cssVars = useMemo(() => buildCssVars(project), [project]);

  useEffect(() => {
    const prev = document.title;
    document.title = project.seo_title || project.project_name;
    return () => { document.title = prev; };
  }, [project]);

  const heroBg      = project.hero_image_url || fv(byGroup(fields, "hero").find(isImage) ?? ({} as never));
  const heroTitle   = pick(fields, "hero_title");
  const heroTagline = pick(fields, "hero_tagline");

  const aboutGroup  = byGroup(fields, "about");
  const aboutImg    = fv(aboutGroup.find(isImage) ?? ({} as never));
  const aboutTitle  = pick(fields, "about_title");
  const aboutBody1  = pick(fields, "about_body_1");
  const aboutBody2  = pick(fields, "about_body_2");

  const msTitle = pick(fields, "milestones_title");
  const milestones = [1, 2, 3, 4].map((i) => ({
    year:  pick(fields, `milestone_${i}_year`),
    title: pick(fields, `milestone_${i}_title`),
    desc:  pick(fields, `milestone_${i}_desc`),
  })).filter((m) => m.year || m.title);

  const galleryTitle = pick(fields, "gallery_title");
  const galleryItems = [1, 2, 3].map((i) => {
    const imgField = byGroup(fields, "gallery").find((f) => f.field_key === `gallery_${i}_image`);
    return {
      img:     fv(imgField ?? ({} as never)),
      caption: pick(fields, `gallery_${i}_caption`),
    };
  }).filter((g) => g.img);

  const contactTitle  = pick(fields, "contact_title");
  const contactDesc   = pick(fields, "contact_desc");
  const contactBtnTxt = pick(fields, "contact_button_text") || "傳訊息給我";
  const contactBtnUrl = pick(fields, "contact_button_url") || "/contact";

  return (
    <div className="min-h-screen font-sans antialiased" style={{ ...cssVars, background: "var(--lp-bg, #0a0a0a)", color: "var(--lp-text, #ffffff)" }}>

      {/* ── Cinematic Hero ────────────────────────────────── */}
      <section
        className="relative h-screen flex items-end pb-20 px-8 overflow-hidden"
        style={heroBg
          ? { backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(160deg, #1a1a2e, #0a0a0a)" }
        }
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="relative z-10 max-w-3xl">
          {heroTitle && (
            <h1 className="text-6xl sm:text-8xl font-black leading-none mb-4 tracking-tighter">
              {heroTitle}
            </h1>
          )}
          {heroTagline && (
            <p className="text-xl text-white/70 font-light leading-relaxed max-w-xl">{heroTagline}</p>
          )}
          <div className="mt-8 flex items-center gap-2" style={{ color: "var(--lp-primary, #c5a059)" }}>
            <div className="w-8 h-px" style={{ background: "var(--lp-primary, #c5a059)" }} />
            <span className="text-xs uppercase tracking-[0.3em]">Scroll to discover</span>
          </div>
        </div>
      </section>

      {/* ── About — image left + text right ──────────────── */}
      {(aboutImg || aboutTitle) && (
        <section className="py-32 px-8">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            {aboutImg ? (
              <div className="relative">
                <div className="rounded-2xl overflow-hidden aspect-[3/4]">
                  <img src={aboutImg} alt={aboutTitle} className="w-full h-full object-cover" />
                </div>
                {/* Gold accent corner */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-xl opacity-30"
                  style={{ background: "var(--lp-primary, #c5a059)" }} />
              </div>
            ) : (
              <div className="rounded-2xl aspect-[3/4] flex items-center justify-center"
                style={{ background: "var(--lp-surface, #141414)", border: "1px solid var(--lp-border, rgba(255,255,255,0.1))" }}>
                <span className="text-6xl opacity-20">📷</span>
              </div>
            )}
            <div>
              <div className="w-10 h-0.5 mb-8" style={{ background: "var(--lp-primary, #c5a059)" }} />
              {aboutTitle && (
                <h2 className="text-4xl font-bold mb-8 leading-tight">{aboutTitle}</h2>
              )}
              {aboutBody1 && (
                <p className="text-base text-white/70 leading-loose mb-6">{aboutBody1}</p>
              )}
              {aboutBody2 && (
                <p className="text-base text-white/70 leading-loose">{aboutBody2}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Timeline ──────────────────────────────────────── */}
      {milestones.length > 0 && (
        <section className="py-32 px-8" style={{ background: "var(--lp-surface, #141414)" }}>
          <div className="max-w-3xl mx-auto">
            {msTitle && (
              <h2 className="text-3xl font-bold mb-16 text-center">{msTitle}</h2>
            )}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[3.5rem] top-0 bottom-0 w-px" style={{ background: "var(--lp-border, rgba(255,255,255,0.1))" }} />

              <div className="space-y-12">
                {milestones.map((ms, i) => (
                  <div key={i} className="flex gap-8 items-start">
                    {/* Year + dot */}
                    <div className="w-28 shrink-0 flex items-center gap-3 pt-1">
                      <span className="text-sm font-bold w-12 text-right shrink-0"
                        style={{ color: "var(--lp-primary, #c5a059)" }}>
                        {ms.year}
                      </span>
                      <div className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          background: "var(--lp-primary, #c5a059)",
                          boxShadow: "0 0 0 4px var(--lp-surface, #141414)",
                        }} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <h3 className="font-bold text-lg mb-2">{ms.title}</h3>
                      {ms.desc && <p className="text-sm text-white/60 leading-relaxed">{ms.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ───────────────────────────────────────── */}
      {galleryItems.length > 0 && (
        <section className="py-32 px-8">
          <div className="max-w-5xl mx-auto">
            {galleryTitle && (
              <h2 className="text-3xl font-bold mb-12 text-center">{galleryTitle}</h2>
            )}
            <div className="grid grid-cols-3 gap-4">
              {galleryItems.map((g, i) => (
                <div key={i} className={`rounded-xl overflow-hidden ${i === 0 ? "row-span-2 col-span-1" : ""}`}>
                  <div className="relative group h-full min-h-[200px]">
                    <img
                      src={g.img}
                      alt={g.caption}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ minHeight: i === 0 ? "400px" : "180px" }}
                    />
                    {g.caption && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <p className="text-sm text-white">{g.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contact CTA ───────────────────────────────────── */}
      <section className="py-32 px-8 text-center"
        style={{ background: "var(--lp-surface, #141414)", borderTop: "1px solid var(--lp-border, rgba(255,255,255,0.1))" }}>
        <div className="max-w-xl mx-auto">
          {contactTitle && <h2 className="text-4xl font-bold mb-6">{contactTitle}</h2>}
          {contactDesc && <p className="text-white/60 mb-10 leading-relaxed">{contactDesc}</p>}
          <a
            href={contactBtnUrl}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl font-bold text-black transition-all hover:scale-105 hover:opacity-90"
            style={{ background: "var(--lp-primary, #c5a059)" }}
          >
            {contactBtnTxt} →
          </a>
        </div>
      </section>
    </div>
  );
};

export default StoryLP;
