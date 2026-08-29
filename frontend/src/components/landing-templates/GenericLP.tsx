/**
 * GenericLP — 通用 Landing Page 渲染器
 *
 * 根據 resolvedFields（vw_lp_project_resolved_fields）動態渲染任意模板，
 * 依 content_group 分組顯示各 section，並套用 lp_templates.color_vars。
 *
 * @module components/landing-templates/GenericLP
 * @theme luxe (LUXE 高端主題)
 */

import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { LpPublicProject, LpResolvedField } from "../../services/site/landing.service";
import { getHiddenSections } from "./lpUtils";

// ─────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────

interface Props {
  project: LpPublicProject;
  fields: LpResolvedField[];
}

/** 取欄位顯示值：圖片優先 cloudinary_url，文字用 resolved_text */
function fieldValue(f: LpResolvedField): string {
  return f.cloudinary_url || f.resolved_text || "";
}

/** 判斷是否為圖片欄位 */
function isImage(f: LpResolvedField): boolean {
  return (
    f.field_kind === "image" ||
    f.data_type === "image" ||
    !!f.cloudinary_url
  );
}

/** 判斷是否為 CTA/按鈕欄位 */
function isCta(f: LpResolvedField): boolean {
  const k = f.field_key.toLowerCase();
  return k.includes("cta") || k.includes("button") || k.includes("btn");
}

/** 判斷是否為 URL 欄位 */
function isUrl(f: LpResolvedField): boolean {
  return f.field_kind === "url" || f.data_type === "url";
}

/** 判斷欄位 key 是否為標題 */
function isTitleKey(key: string): boolean {
  const k = key.toLowerCase();
  return k.includes("title") || k.includes("heading") || k.includes("name");
}

/** 判斷欄位 key 是否為副標題 */
function isSubtitleKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.includes("subtitle") ||
    k.includes("tagline") ||
    k.includes("subheading") ||
    k.includes("caption")
  );
}

// 在 hero group 之後，cta / footer 之前渲染的 group 順序
const GROUP_ORDER_MAP: Record<string, number> = {
  hero: 0,
  about: 10,
  intro: 11,
  features: 20,
  benefits: 21,
  services: 30,
  process: 35,
  testimonials: 40,
  reviews: 41,
  pricing: 50,
  plans: 51,
  faq: 60,
  team: 70,
  gallery: 80,
  cta: 90,
  contact: 91,
  footer: 99,
};

function groupOrder(name: string): number {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(GROUP_ORDER_MAP)) {
    if (key.includes(k)) return v;
  }
  return 50;
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

/** Hero section — 全寬大圖 + 標題 + CTA */
const HeroSection: React.FC<{
  fields: LpResolvedField[];
  heroImage: string | null;
}> = ({ fields, heroImage }) => {
  const title = fields.find((f) => isTitleKey(f.field_key));
  const subtitle = fields.find((f) => isSubtitleKey(f.field_key));
  const body = fields.find((f) => {
    const k = f.field_key.toLowerCase();
    return (
      k.includes("desc") ||
      k.includes("body") ||
      k.includes("intro") ||
      k.includes("text")
    );
  });
  const ctaTextField = fields.find(
    (f) => isCta(f) && !isUrl(f),
  );
  const ctaUrlField = fields.find(
    (f) => (isCta(f) && isUrl(f)) || f.field_key.toLowerCase().includes("url"),
  );
  const bgImage = heroImage || fields.find(isImage);

  const ctaText = ctaTextField ? fieldValue(ctaTextField) : null;
  const ctaHref = ctaUrlField ? fieldValue(ctaUrlField) : "/contact";

  const titleVal = title ? fieldValue(title) : null;
  const subtitleVal = subtitle ? fieldValue(subtitle) : null;
  const bodyVal = body ? fieldValue(body) : null;
  const bgUrl = typeof bgImage === "string" ? bgImage : bgImage ? fieldValue(bgImage) : null;

  return (
    <section
      className="relative min-h-[70vh] flex items-center justify-center text-center px-6 py-20 overflow-hidden"
      style={
        bgUrl
          ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)" }
      }
    >
      {/* Overlay */}
      {bgUrl && (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
      )}

      <div className="relative z-10 max-w-3xl mx-auto">
        {titleVal && (
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight text-white">
            <span className="text-[var(--lp-primary,#C9A96E)]">{titleVal}</span>
          </h1>
        )}
        {subtitleVal && (
          <p className="text-xl sm:text-2xl text-white/80 mb-4 font-light">
            {subtitleVal}
          </p>
        )}
        {bodyVal && (
          <p className="text-base text-white/60 max-w-xl mx-auto mb-8 leading-relaxed">
            {bodyVal}
          </p>
        )}
        {(ctaText || ctaHref) && (
          <a
            href={ctaHref}
            className="inline-block px-8 py-3 rounded-lg font-semibold text-black transition-all hover:scale-105 hover:opacity-90 active:scale-100"
            style={{ background: "var(--lp-primary, #C9A96E)" }}
          >
            {ctaText || "立即了解"}
          </a>
        )}
      </div>
    </section>
  );
};

/** Feature cards — 格狀排列 */
const FeatureGrid: React.FC<{ fields: LpResolvedField[]; title?: string }> = ({
  fields,
  title,
}) => {
  // 嘗試把欄位聚合成卡片（按 field_key suffix 分組：feature_1_title, feature_1_desc）
  const cardMap: Record<string, { title?: string; desc?: string; icon?: string; img?: string }> = {};

  fields.forEach((f) => {
    const val = fieldValue(f);
    if (!val) return;
    const k = f.field_key.toLowerCase();

    // 嘗試提取索引（feature_1_title → idx "1"）
    const match = k.match(/[_\-](\d+)[_\-]/);
    const idx = match ? match[1] : "0";

    if (!cardMap[idx]) cardMap[idx] = {};

    if (isImage(f)) {
      cardMap[idx].img = val;
    } else if (isTitleKey(k)) {
      cardMap[idx].title = val;
    } else if (isSubtitleKey(k) || k.includes("desc") || k.includes("text") || k.includes("body")) {
      cardMap[idx].desc = val;
    } else if (k.includes("icon")) {
      cardMap[idx].icon = val;
    }
  });

  const cards = Object.values(cardMap).filter((c) => c.title || c.desc || c.img);

  if (cards.length === 0) {
    // Fallback: render raw fields
    return (
      <div className="space-y-3">
        {title && <h2 className="text-2xl font-semibold text-white mb-4">{title}</h2>}
        {fields
          .filter((f) => fieldValue(f))
          .map((f) => (
            <p key={f.field_id} className="text-sm text-white/60">
              <span className="text-[var(--lp-primary,#C9A96E)] mr-2">{f.field_label}：</span>
              {fieldValue(f)}
            </p>
          ))}
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
          {title}
        </h2>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="rounded-xl p-6 border transition-all hover:border-[var(--lp-primary,#C9A96E)]/50"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(201,169,110,0.12)",
            }}
          >
            {card.img && (
              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <img src={card.img} alt={card.title || ""} className="w-full h-full object-cover" />
              </div>
            )}
            {card.icon && (
              <div className="text-3xl mb-3">{card.icon}</div>
            )}
            {card.title && (
              <h3 className="text-lg font-semibold text-[var(--lp-primary,#C9A96E)] mb-2">
                {card.title}
              </h3>
            )}
            {card.desc && (
              <p className="text-sm text-white/60 leading-relaxed">{card.desc}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Testimonial cards */
const TestimonialSection: React.FC<{ fields: LpResolvedField[]; title?: string }> = ({
  fields,
  title,
}) => {
  const quoteMap: Record<string, { name?: string; text?: string; role?: string; img?: string }> = {};

  fields.forEach((f) => {
    const val = fieldValue(f);
    if (!val) return;
    const k = f.field_key.toLowerCase();
    const match = k.match(/[_\-](\d+)/);
    const idx = match ? match[1] : "0";
    if (!quoteMap[idx]) quoteMap[idx] = {};

    if (isImage(f)) {
      quoteMap[idx].img = val;
    } else if (k.includes("name") || k.includes("author")) {
      quoteMap[idx].name = val;
    } else if (k.includes("role") || k.includes("title") || k.includes("position")) {
      quoteMap[idx].role = val;
    } else {
      quoteMap[idx].text = val;
    }
  });

  const quotes = Object.values(quoteMap).filter((q) => q.text || q.name);

  return (
    <div>
      {title && (
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
          {title}
        </h2>
      )}
      <div className="grid sm:grid-cols-2 gap-6">
        {quotes.map((q, i) => (
          <div
            key={i}
            className="rounded-xl p-6"
            style={{
              background: "rgba(201,169,110,0.04)",
              border: "1px solid rgba(201,169,110,0.12)",
            }}
          >
            <p className="text-white/70 text-sm leading-relaxed mb-4 italic">
              「{q.text}」
            </p>
            <div className="flex items-center gap-3">
              {q.img && (
                <img
                  src={q.img}
                  alt={q.name || ""}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                {q.name && (
                  <p className="text-sm font-semibold text-[var(--lp-primary,#C9A96E)]">
                    {q.name}
                  </p>
                )}
                {q.role && <p className="text-xs text-white/40">{q.role}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** CTA section */
const CtaSection: React.FC<{ fields: LpResolvedField[] }> = ({ fields }) => {
  const titleField = fields.find((f) => isTitleKey(f.field_key));
  const bodyField = fields.find((f) => {
    const k = f.field_key.toLowerCase();
    return k.includes("desc") || k.includes("body") || k.includes("text");
  });
  const btnTextField = fields.find((f) => isCta(f) && !isUrl(f));
  const btnUrlField = fields.find((f) => isCta(f) && isUrl(f));

  const titleVal = titleField ? fieldValue(titleField) : null;
  const bodyVal = bodyField ? fieldValue(bodyField) : null;
  const btnText = btnTextField ? fieldValue(btnTextField) : "立即諮詢";
  const btnHref = btnUrlField ? fieldValue(btnUrlField) : "/contact";

  return (
    <section
      className="text-center py-16 px-6 rounded-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(201,169,110,0.08) 0%, rgba(201,169,110,0.02) 100%)",
        border: "1px solid rgba(201,169,110,0.12)",
      }}
    >
      {titleVal && (
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{titleVal}</h2>
      )}
      {bodyVal && (
        <p className="text-white/60 max-w-xl mx-auto mb-8 text-sm sm:text-base leading-relaxed">
          {bodyVal}
        </p>
      )}
      <a
        href={btnHref}
        className="inline-block px-10 py-3.5 rounded-lg font-semibold text-black transition-all hover:scale-105 hover:opacity-90"
        style={{ background: "var(--lp-primary, #C9A96E)" }}
      >
        {btnText}
      </a>
    </section>
  );
};

/** Generic section — 任意 group 的 fallback */
const GenericSection: React.FC<{
  groupName: string;
  fields: LpResolvedField[];
}> = ({ groupName, fields }) => {
  const titleField = fields.find((f) => isTitleKey(f.field_key));
  const titleVal = titleField ? fieldValue(titleField) : null;
  const otherFields = fields.filter((f) => f !== titleField && fieldValue(f));

  return (
    <div>
      {titleVal && (
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
          {titleVal}
        </h2>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {otherFields.map((f) => {
          const val = fieldValue(f);
          if (!val) return null;
          if (isImage(f)) {
            return (
              <div key={f.field_id} className="rounded-xl overflow-hidden aspect-video">
                <img
                  src={val}
                  alt={f.field_label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            );
          }
          if (isUrl(f)) {
            return (
              <div key={f.field_id}>
                <p className="text-xs text-white/40 mb-1">{f.field_label}</p>
                <a
                  href={val}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--lp-primary,#C9A96E)] hover:underline text-sm"
                >
                  {val}
                </a>
              </div>
            );
          }
          if (isSubtitleKey(f.field_key)) {
            return (
              <p key={f.field_id} className="text-lg text-[var(--lp-primary,#C9A96E)] font-medium">
                {val}
              </p>
            );
          }
          return (
            <div key={f.field_id}>
              <p className="text-xs text-white/40 mb-1">{f.field_label}</p>
              <p className="text-sm text-white/70 leading-relaxed">{val}</p>
            </div>
          );
        })}
      </div>
      {otherFields.length === 0 && !titleVal && (
        <p className="text-white/30 text-sm italic text-center">
          （{groupName} — 尚未填寫內容）
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

const META_GROUPS = new Set(["meta", "seo", "social", "tracking", "analytics", "og"]);

const GenericLP: React.FC<Props> = ({ project, fields }) => {
  // Build CSS custom-property style object from template color_vars
  const cssVarsStyle = useMemo<React.CSSProperties>(() => {
    const vars = project.lp_templates?.color_vars ?? {};
    return Object.fromEntries(
      Object.entries(vars).map(([k, v]) => [`--lp-${k}`, v]),
    ) as React.CSSProperties;
  }, [project.lp_templates?.color_vars]);

  // SEO title
  const seoTitle = project.seo_title || project.project_name;
  const seoDesc = project.seo_description || "";

  // Set document title on mount / change
  useEffect(() => {
    const prev = document.title;
    document.title = seoTitle;
    return () => { document.title = prev; };
  }, [seoTitle]);

  // admin 隱藏的區塊（settings_json.hidden_sections）
  const hidden = useMemo(() => new Set(getHiddenSections(project)), [project]);

  // Group fields by content_group (skip empty values + meta groups + hidden groups)
  const { heroFields, contentGroups } = useMemo(() => {
    const grouped: Record<string, LpResolvedField[]> = {};
    fields.forEach((f) => {
      const group = (f.content_group || "general").toLowerCase();
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(f);
    });
    // Sort within each group
    Object.values(grouped).forEach((g) =>
      g.sort((a, b) => a.field_sort_order - b.field_sort_order),
    );

    const hero = hidden.has("hero") ? [] : grouped["hero"] || [];
    const rest = Object.entries(grouped)
      .filter(([key]) => key !== "hero" && !META_GROUPS.has(key) && !hidden.has(key))
      .sort(([a], [b]) => groupOrder(a) - groupOrder(b));

    return { heroFields: hero, contentGroups: rest };
  }, [fields, hidden]);

  // Section label display names
  const sectionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      about: "關於我們",
      intro: "介紹",
      features: "核心特色",
      benefits: "方案優勢",
      services: "服務項目",
      process: "服務流程",
      testimonials: "學員見證",
      reviews: "好評回饋",
      pricing: "費用方案",
      plans: "課程方案",
      faq: "常見問題",
      team: "教練團隊",
      gallery: "成果展示",
      cta: "立即行動",
      contact: "聯絡我們",
      footer: "頁尾",
      general: "其他資訊",
    };
    const k = key.toLowerCase();
    for (const [pattern, label] of Object.entries(labels)) {
      if (k.includes(pattern)) return label;
    }
    return key;
  };

  return (
    <div
      className="min-h-screen bg-studio-bg text-white"
      style={cssVarsStyle}
    >

      {/* Hero */}
      {(heroFields.length > 0 || project.hero_image_url) && (
        <HeroSection fields={heroFields} heroImage={project.hero_image_url} />
      )}

      {/* Logo (if no hero image, show at top) */}
      {project.logo_url && !project.hero_image_url && (
        <div className="flex justify-center py-8">
          <img
            src={project.logo_url}
            alt={project.project_name}
            className="h-14 object-contain"
          />
        </div>
      )}

      {/* Content sections */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {contentGroups.map(([groupKey, groupFields]) => {
          const visibleFields = groupFields.filter((f) => fieldValue(f));
          if (visibleFields.length === 0) return null;

          const label = sectionLabel(groupKey);
          const key = groupKey.toLowerCase();

          // Special renderers per section type
          if (key.includes("feature") || key.includes("benefit") || key.includes("service")) {
            return (
              <section key={groupKey}>
                <FeatureGrid fields={visibleFields} title={label} />
              </section>
            );
          }
          if (key.includes("testimonial") || key.includes("review")) {
            return (
              <section key={groupKey}>
                <TestimonialSection fields={visibleFields} title={label} />
              </section>
            );
          }
          if (key.includes("cta") || key.includes("contact")) {
            return (
              <section key={groupKey}>
                <CtaSection fields={visibleFields} />
              </section>
            );
          }

          // Default generic section
          return (
            <section key={groupKey}>
              <GenericSection groupName={label} fields={visibleFields} />
            </section>
          );
        })}

        {/* 若沒有任何 contentGroups，顯示 CTA */}
        {contentGroups.every(([, g]) => g.every((f) => !fieldValue(f))) && (
          <section className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">
              {project.project_name}
            </h2>
            <p className="text-white/40 mb-8 text-sm">
              {seoDesc || "Aaron 教練專業課程，為您量身打造最適合的訓練方案。"}
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-black transition-all hover:scale-105"
              style={{ background: "var(--lp-primary, #C9A96E)" }}
            >
              立即諮詢
            </Link>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-white/20 text-xs">
          © {new Date().getFullYear()} {project.project_name} · Aaron 教練
        </p>
      </footer>
    </div>
  );
};

export default GenericLP;
