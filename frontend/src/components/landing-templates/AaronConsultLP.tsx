/**
 * AaronConsultLP — 「阿倫指定版面」諮詢成交頁
 *
 * 客戶指定的獨立成交頁（可放 IG 主頁連結）。原版為綠色系諮詢頁，
 * 本版改為站上主頁「銀刃風」：淺色＝銀白清新、深色＝深黑高級、金色點綴。
 *
 * 所有文案、兩張圖片、價格數字、表單題目與選項皆為可編輯欄位，
 * 由 lp_template_fields 提供預設值、lp_project_field_values 覆蓋。
 * 選項以「／」分隔存在單一文字欄位中，讓後台不需要選項編輯器也能改題目。
 *
 * 區塊（content_group）：
 *   hero / imagine / pains / results / audience / about
 *   benefits / pricing / faq / form / contact / sticky / seo
 *
 * @module components/landing-templates/AaronConsultLP
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pick, imgSrc, isPlaceholder, sectionVisible, collectIndexed, type LPProps } from "./lpUtils";
import { useLpShell, LpChrome } from "./lpTheme";
import { SEOHead } from "@/components/seo";
import { post } from "../../services/api";

// ─────────────────────────────────────────────────────────
// 小工具
// ─────────────────────────────────────────────────────────

/** 把「A／B／C」拆成選項陣列（同時容許 | 與換行分隔） */
function splitOptions(raw: string): string[] {
  return raw
    .split(/[／|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 判斷是否為「其他」類選項（需附自由輸入） */
const isOtherOption = (opt: string) => /^其他/.test(opt.trim());

/** 由 LINE ID 產生加好友深連結：@ 開頭為官方帳號，其餘為個人 ID */
export function lineDeepLink(id: string): string {
  const v = id.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return v.startsWith("@")
    ? `https://line.me/R/ti/p/${encodeURIComponent(v)}`
    : `https://line.me/ti/p/~${encodeURIComponent(v)}`;
}

/** 電話正規化成 tel: 可撥號格式 */
const telHref = (raw: string) => `tel:${raw.replace(/[^\d+]/g, "")}`;

const FORM_ANCHOR = "lp-booking-form";

// ─────────────────────────────────────────────────────────
// 版面共用小元件
// ─────────────────────────────────────────────────────────

/** 區塊外框：交替使用 bg / bg-alt 以拉開層次 */
const Band: React.FC<{
  id?: string;
  tone?: "base" | "alt" | "surface";
  className?: string;
  children: React.ReactNode;
}> = ({ id, tone = "base", className = "", children }) => (
  <section
    id={id}
    className={`px-5 py-16 sm:px-8 sm:py-24 ${className}`}
    style={{
      background:
        tone === "alt"
          ? "var(--lp-bg-alt)"
          : tone === "surface"
            ? "var(--lp-surface-2)"
            : "var(--lp-bg)",
    }}
  >
    <div className="mx-auto w-full max-w-3xl">{children}</div>
  </section>
);

/** 區塊標題 */
const Heading: React.FC<{ children: React.ReactNode; center?: boolean }> = ({
  children,
  center = true,
}) => (
  <h2
    className={`mb-8 text-2xl font-bold leading-snug tracking-tight sm:text-3xl ${
      center ? "text-center" : ""
    }`}
    style={{ color: "var(--lp-text)" }}
  >
    {children}
  </h2>
);

/** 金色細槓（銀刃風的點綴） */
const GoldRule: React.FC<{ center?: boolean }> = ({ center = true }) => (
  <div
    className={`mb-6 h-[3px] w-12 rounded-full ${center ? "mx-auto" : ""}`}
    style={{ background: "var(--lp-primary)" }}
  />
);

/** 條列項目（金槓 / ✓ / ✗ 三種樣式） */
const Bullet: React.FC<{
  mark: "bar" | "check" | "cross";
  children: React.ReactNode;
  /** 額外樣式（例如卡片外觀）；直接掛在 <li> 上，避免 li 巢狀 li */
  className?: string;
  style?: React.CSSProperties;
}> = ({ mark, children, className = "", style }) => (
  <li className={`flex items-start gap-3 ${className}`} style={style}>
    {mark === "bar" && (
      <span
        className="mt-2 h-[3px] w-5 shrink-0 rounded-full"
        style={{ background: "var(--lp-primary)" }}
      />
    )}
    {mark === "check" && (
      <span className="mt-0.5 shrink-0 text-lg leading-6" style={{ color: "var(--lp-accent)" }}>
        ✓
      </span>
    )}
    {mark === "cross" && (
      <span className="mt-0.5 shrink-0 text-lg leading-6" style={{ color: "var(--lp-accent)" }}>
        ✗
      </span>
    )}
    <span className="text-[15px] leading-relaxed sm:text-base" style={{ color: "var(--lp-muted)" }}>
      {children}
    </span>
  </li>
);

// ─────────────────────────────────────────────────────────
// 表單
// ─────────────────────────────────────────────────────────

interface QuestionDef {
  key: string;
  label: string;
  options: string[];
  multi: boolean;
  required: boolean;
}

const FieldLabel: React.FC<{ label: string; required?: boolean; hint?: string }> = ({
  label,
  required,
  hint,
}) => (
  <div className="mb-2">
    <span className="text-sm font-semibold" style={{ color: "var(--lp-text)" }}>
      {label}
      {required && (
        <span className="ml-1" style={{ color: "var(--lp-accent)" }}>
          *
        </span>
      )}
    </span>
    {hint && (
      <span className="ml-2 text-xs" style={{ color: "var(--lp-faint)" }}>
        （{hint}）
      </span>
    )}
  </div>
);

const inputStyle: React.CSSProperties = {
  background: "var(--lp-bg-alt)",
  color: "var(--lp-text)",
  border: "1px solid var(--lp-border)",
};

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  invalid?: boolean;
}> = ({ label, value, onChange, required, hint, placeholder, type = "text", multiline, invalid }) => {
  const common = {
    value,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className:
      "w-full rounded-xl px-4 py-3 text-[15px] outline-none transition focus:ring-2 placeholder:opacity-60",
    style: {
      ...inputStyle,
      borderColor: invalid ? "#EF6A6A" : "var(--lp-border)",
      ...( { "--tw-ring-color": "var(--lp-ring)" } as React.CSSProperties),
    },
  };
  return (
    <div>
      <FieldLabel label={label} required={required} hint={hint} />
      {multiline ? (
        <textarea rows={3} {...common} />
      ) : (
        <input type={type} {...common} />
      )}
    </div>
  );
};

/** chip 單選／複選群組，含「其他」自由輸入 */
const ChipGroup: React.FC<{
  q: QuestionDef;
  selected: string[];
  otherText: string;
  onSelect: (next: string[]) => void;
  onOtherText: (v: string) => void;
  invalid?: boolean;
}> = ({ q, selected, otherText, onSelect, onOtherText, invalid }) => {
  const toggle = (opt: string) => {
    if (q.multi) {
      onSelect(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
    } else {
      onSelect(selected.includes(opt) ? [] : [opt]);
    }
  };
  const otherSelected = selected.some(isOtherOption);

  return (
    <div>
      <FieldLabel
        label={q.label}
        required={q.required}
        hint={q.multi ? "可複選" : undefined}
      />
      <div className="flex flex-wrap gap-2">
        {q.options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(opt)}
              className="rounded-full px-4 py-2 text-[13px] font-medium transition active:scale-95 sm:text-sm"
              style={{
                background: on ? "var(--lp-primary)" : "var(--lp-bg-alt)",
                color: on ? "var(--lp-on-primary)" : "var(--lp-muted)",
                border: `1px solid ${
                  on ? "var(--lp-primary)" : invalid ? "#EF6A6A" : "var(--lp-border)"
                }`,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {otherSelected && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => onOtherText(e.target.value)}
          placeholder="請說明…"
          className="mt-3 w-full rounded-xl px-4 py-2.5 text-[15px] outline-none"
          style={inputStyle}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 主元件
// ─────────────────────────────────────────────────────────

interface AnswerState {
  name: string;
  phone: string;
  email: string;
  ig: string;
  line: string;
  goal: string;
  extra: string;
  chips: Record<string, string[]>;
  others: Record<string, string>;
}

const EMPTY_ANSWERS: AnswerState = {
  name: "",
  phone: "",
  email: "",
  ig: "",
  line: "",
  goal: "",
  extra: "",
  chips: {},
  others: {},
};

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const AaronConsultLP: React.FC<LPProps> = ({ project, fields }) => {
  const { cssVars, mode, toggle } = useLpShell(project);
  const f = useCallback((k: string) => pick(fields, k), [fields]);
  const show = useCallback((g: string) => sectionVisible(project, g), [project]);

  // ── 表單狀態 ──
  const [a, setA] = useState<AnswerState>(EMPTY_ANSWERS);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof AnswerState>(k: K, v: AnswerState[K]) =>
    setA((prev) => ({ ...prev, [k]: v }));

  // ── 題組定義（題目與選項皆來自可編輯欄位）──
  const questions = useMemo<QuestionDef[]>(
    () =>
      [
        { key: "tenure", labelKey: "q_tenure_label", optKey: "q_tenure_options", multi: false, required: true },
        { key: "gym", labelKey: "q_gym_label", optKey: "q_gym_options", multi: false, required: false },
        { key: "income", labelKey: "q_income_label", optKey: "q_income_options", multi: false, required: true },
        { key: "pain", labelKey: "q_pain_label", optKey: "q_pain_options", multi: true, required: true },
        { key: "time", labelKey: "q_time_label", optKey: "q_time_options", multi: false, required: true },
        { key: "course", labelKey: "q_course_label", optKey: "q_course_options", multi: true, required: false },
        { key: "goalarea", labelKey: "q_goalarea_label", optKey: "q_goalarea_options", multi: true, required: false },
      ]
        .map((q) => ({
          key: q.key,
          label: f(q.labelKey),
          options: splitOptions(f(q.optKey)),
          multi: q.multi,
          required: q.required,
        }))
        .filter((q) => q.label && q.options.length > 0),
    [f],
  );

  const q = (key: string) => questions.find((x) => x.key === key);

  // ── 驗證 ──
  const missing = useMemo(() => {
    const m: string[] = [];
    if (!a.name.trim()) m.push("name");
    if (!a.phone.trim()) m.push("phone");
    if (!a.email.trim() || !EMAIL_RE.test(a.email.trim())) m.push("email");
    if (!a.ig.trim()) m.push("ig");
    if (!a.line.trim()) m.push("line");
    for (const qd of questions) {
      if (qd.required && !(a.chips[qd.key]?.length > 0)) m.push(qd.key);
    }
    return m;
  }, [a, questions]);

  /** 把所有答案整理成人類可讀的逐行摘要（信件與後台都看得到全文） */
  const buildSummary = useCallback(() => {
    const lines: string[] = [];
    lines.push(`姓名：${a.name}`);
    lines.push(`行動電話：${a.phone}`);
    lines.push(`電子信箱：${a.email}`);
    lines.push(`IG帳號：${a.ig}`);
    lines.push(`Line帳號：${a.line}`);
    for (const qd of questions) {
      const picked = a.chips[qd.key] ?? [];
      if (!picked.length) continue;
      const withOther = picked.map((p) =>
        isOtherOption(p) && a.others[qd.key] ? `其他：${a.others[qd.key]}` : p,
      );
      lines.push(`${qd.label}：${withOther.join("、")}`);
    }
    if (a.goal.trim()) lines.push(`${f("q_goal_label")}：${a.goal.trim()}`);
    if (a.extra.trim()) lines.push(`${f("q_extra_label")}：${a.extra.trim()}`);
    return lines.join("\n");
  }, [a, questions, f]);

  /** 結構化答案（存進 lp_leads.answers，教練端可看到完整內容） */
  const buildAnswers = useCallback(() => {
    const out: Record<string, unknown> = {
      name: a.name.trim(),
      phone: a.phone.trim(),
      email: a.email.trim(),
      instagram: a.ig.trim(),
      line_id: a.line.trim(),
    };
    for (const qd of questions) {
      const picked = a.chips[qd.key] ?? [];
      if (!picked.length) continue;
      out[qd.label] = picked.map((p) =>
        isOtherOption(p) && a.others[qd.key] ? `其他：${a.others[qd.key]}` : p,
      );
    }
    if (a.goal.trim()) out[f("q_goal_label")] = a.goal.trim();
    if (a.extra.trim()) out[f("q_extra_label")] = a.extra.trim();
    return out;
  }, [a, questions, f]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (honeypotRef.current?.value) {
      // 機器人：靜默成功，不送出
      setDone(true);
      return;
    }
    if (missing.length > 0) {
      setError("請完成標示 * 的必填項目");
      document
        .getElementById(FORM_ANCHOR)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSubmitting(true);
    const summary = buildSummary();
    const subject = `${project.project_name || "阿倫指定版面"} 諮詢預約 - ${a.name.trim()}`;

    const errMessage = (err: unknown, fallbackMsg: string) => {
      const apiMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      return apiMsg || fallbackMsg;
    };

    try {
      // 主要路徑：LP 專用 lead 端點（寫入 lp_leads + 寄信通知教練）
      await post("/api/landing/leads", {
        project_id: project.id,
        project_slug: project.custom_slug,
        project_name: project.project_name,
        name: a.name.trim(),
        phone: a.phone.trim(),
        email: a.email.trim(),
        line_id: a.line.trim(),
        instagram: a.ig.trim(),
        answers: buildAnswers(),
        summary,
      });
      setDone(true);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 端點尚未部署（404）→ 退回站上既有的聯絡表單 API，確保報名不會遺失
      if (status !== 404) {
        setError(errMessage(err, "送出失敗，請稍後再試"));
        setSubmitting(false);
        return;
      }
      try {
        await post("/api/contact", {
          name: a.name.trim(),
          email: a.email.trim(),
          phone: a.phone.trim(),
          subject: subject.slice(0, 100),
          message: summary.slice(0, 2000),
        });
        setDone(true);
      } catch (fbErr) {
        setError(errMessage(fbErr, "送出失敗，請稍後再試"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById(FORM_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── 聯絡資訊 ──
  const lineId = f("contact_line_id");
  const phone = f("contact_phone");
  const igUrl = f("contact_ig_url");
  const email = f("contact_email");
  const lineHref = lineDeepLink(lineId);

  // ── FAQ（掛點：預設無內容，客戶填了才出現）──
  const faqs = useMemo(() => collectIndexed(fields, "faq", 8, ["q", "a"] as const), [fields]);

  // ── 成果卡 ──
  const results = useMemo(
    () => collectIndexed(fields, "result", 6, ["icon", "text"] as const),
    [fields],
  );

  const heroImage = f("hero_image");
  const resultsImage = f("results_image");

  useEffect(() => {
    const prev = document.title;
    const t = project.seo_title || project.project_name;
    if (t) document.title = t;
    return () => {
      document.title = prev;
    };
  }, [project.seo_title, project.project_name]);

  const ogImage = f("seo_og_image") || project.og_image_url || heroImage;
  const shareDesc = f("seo_share_desc") || project.seo_description || f("hero_subtitle");

  return (
    <div className="lp-root min-h-screen font-sans antialiased" style={cssVars}>
      {/* 品牌標頭（LogoMark + 阿倫教官／Coach Aaron）＋ 整合日夜切換鈕 */}
      <LpChrome mode={mode} onToggle={toggle} />
      {/* 獨立頁自己的分享卡（覆蓋 viewer 的預設值，讓 IG/LINE 分享好看） */}
      <SEOHead
        title={project.seo_title || project.project_name}
        description={shareDesc || undefined}
        image={ogImage && !isPlaceholder(ogImage) ? ogImage : undefined}
        url={`/page/${project.custom_slug || ""}`}
      />

      {/* ── 1. Hero ─────────────────────────────────── */}
      {show("hero") && (
        <header
          className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20"
          style={{
            background:
              "linear-gradient(160deg, var(--lp-bg-alt) 0%, var(--lp-bg) 60%, var(--lp-surface) 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
            style={{ background: "var(--lp-primary-soft)" }}
          />
          <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              {f("hero_badge") && (
                <span
                  className="mb-5 inline-block rounded-full px-4 py-1.5 text-[12px] font-semibold tracking-wide sm:text-[13px]"
                  style={{
                    background: "var(--lp-primary-soft)",
                    color: "var(--lp-accent)",
                    border: "1px solid var(--lp-border-strong)",
                  }}
                >
                  {f("hero_badge")}
                </span>
              )}
              <h1
                className="mb-4 text-[34px] font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--lp-text)" }}
              >
                {f("hero_title")}
              </h1>
              {f("hero_subtitle") && (
                <p
                  className="mb-7 max-w-xl text-[15px] leading-relaxed sm:text-lg"
                  style={{ color: "var(--lp-muted)" }}
                >
                  {f("hero_subtitle")}
                </p>
              )}

              {f("hero_points_title") && (
                <p
                  className="mb-3 text-[15px] font-bold sm:text-base"
                  style={{ color: "var(--lp-text)" }}
                >
                  {f("hero_points_title")}
                </p>
              )}
              <ul className="mb-7 space-y-3">
                {[1, 2, 3].map((i) => {
                  const v = f(`hero_point_${i}`);
                  return v ? (
                    <Bullet key={i} mark="bar">
                      {v}
                    </Bullet>
                  ) : null;
                })}
              </ul>

              <div className="mb-7 space-y-1">
                {[1, 2].map((i) => {
                  const v = f(`hero_closing_${i}`);
                  return v ? (
                    <p
                      key={i}
                      className="text-[15px] font-semibold sm:text-base"
                      style={{ color: "var(--lp-accent)" }}
                    >
                      {v}
                    </p>
                  ) : null;
                })}
              </div>

              <div className="mb-5 space-y-1">
                {[1, 2].map((i) => {
                  const v = f(`hero_cta_note_${i}`);
                  return v ? (
                    <p
                      key={i}
                      className="text-[14px] leading-relaxed sm:text-[15px]"
                      style={{ color: "var(--lp-muted)" }}
                    >
                      {v}
                    </p>
                  ) : null;
                })}
              </div>

              <button
                type="button"
                onClick={scrollToForm}
                className="w-full rounded-xl px-8 py-4 text-base font-bold transition hover:opacity-90 active:scale-[0.98] sm:w-auto"
                style={{
                  background: "var(--lp-primary)",
                  color: "var(--lp-on-primary)",
                  boxShadow: "var(--lp-shadow)",
                }}
              >
                {f("hero_cta_text") || "立即預約諮詢"}
              </button>
            </div>

            {/* 人物照 */}
            <div className="order-first lg:order-last">
              <div
                className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl"
                style={{
                  border: "1px solid var(--lp-border-strong)",
                  boxShadow: "var(--lp-shadow)",
                }}
              >
                <img
                  src={imgSrc(heroImage)}
                  alt={f("hero_title") || "阿倫教官"}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ── 2. 想像區 ───────────────────────────────── */}
      {show("imagine") && f("imagine_lead") && (
        <Band tone="alt">
          <div
            className="rounded-2xl p-7 sm:p-10"
            style={{
              background: "var(--lp-surface)",
              border: "1px solid var(--lp-border)",
              boxShadow: "var(--lp-shadow)",
            }}
          >
            <GoldRule center={false} />
            <p
              className="mb-6 text-xl font-bold leading-snug sm:text-2xl"
              style={{ color: "var(--lp-text)" }}
            >
              {f("imagine_lead")}
            </p>
            <ul className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => {
                const v = f(`imagine_point_${i}`);
                return v ? (
                  <Bullet key={i} mark="bar">
                    {v}
                  </Bullet>
                ) : null;
              })}
            </ul>
          </div>
        </Band>
      )}

      {/* ── 3. 痛點區 ───────────────────────────────── */}
      {show("pains") && (
        <Band>
          <GoldRule />
          <Heading>{f("pains_title")}</Heading>
          <ul className="mx-auto max-w-xl space-y-4">
            {[1, 2, 3, 4].map((i) => {
              const v = f(`pain_${i}`);
              return v ? (
                <Bullet
                  key={i}
                  mark="cross"
                  className="rounded-xl px-5 py-4"
                  style={{
                    background: "var(--lp-surface)",
                    border: "1px solid var(--lp-border)",
                  }}
                >
                  {v}
                </Bullet>
              ) : null;
            })}
          </ul>
          {f("pains_footer") && (
            <p
              className="mt-8 text-center text-base font-bold sm:text-lg"
              style={{ color: "var(--lp-accent)" }}
            >
              {f("pains_footer")}
            </p>
          )}
        </Band>
      )}

      {/* ── 4. 學員真實成果 ─────────────────────────── */}
      {show("results") && (
        <Band tone="alt">
          <GoldRule />
          <Heading>{f("results_title")}</Heading>
          <div className="grid items-start gap-8 sm:grid-cols-2">
            <ul className="space-y-4">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 rounded-xl px-5 py-4"
                  style={{
                    background: "var(--lp-surface)",
                    border: "1px solid var(--lp-border)",
                    boxShadow: "var(--lp-shadow)",
                  }}
                >
                  <span className="text-2xl leading-none">{r.icon}</span>
                  <span
                    className="text-[15px] font-semibold leading-snug"
                    style={{ color: "var(--lp-text)" }}
                  >
                    {r.text}
                  </span>
                </li>
              ))}
            </ul>
            <figure className="m-0">
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  border: "1px solid var(--lp-border-strong)",
                  boxShadow: "var(--lp-shadow)",
                }}
              >
                <img
                  src={imgSrc(resultsImage)}
                  alt={f("results_image_caption") || "學員回饋"}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </div>
              {f("results_image_caption") && (
                <figcaption
                  className="mt-3 text-center text-xs"
                  style={{ color: "var(--lp-faint)" }}
                >
                  {f("results_image_caption")}
                </figcaption>
              )}
            </figure>
          </div>
        </Band>
      )}

      {/* ── 5. 適合對象 ─────────────────────────────── */}
      {show("audience") && (
        <Band tone="surface">
          <GoldRule />
          <Heading>{f("audience_title")}</Heading>
          <ul className="mx-auto max-w-xl space-y-4">
            {[1, 2, 3, 4].map((i) => {
              const v = f(`audience_${i}`);
              return v ? (
                <Bullet
                  key={i}
                  mark="check"
                  className="rounded-xl px-5 py-4"
                  style={{
                    background: "var(--lp-surface)",
                    border: "1px solid var(--lp-border)",
                  }}
                >
                  {v}
                </Bullet>
              ) : null;
            })}
          </ul>
        </Band>
      )}

      {/* ── 6. 關於阿倫教官 ─────────────────────────── */}
      {show("about") && (
        <Band>
          <GoldRule />
          <Heading>{f("about_title")}</Heading>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => {
              const v = f(`about_para_${i}`);
              return v ? (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed sm:text-base"
                  style={{ color: "var(--lp-muted)" }}
                >
                  {v}
                </p>
              ) : null;
            })}
          </div>
          <div className="mt-8 space-y-4">
            {(
              [
                ["about_certs_title", "about_certs"],
                ["about_exp_title", "about_exp"],
                ["about_practice_title", "about_practice"],
              ] as const
            ).map(([tk, bk]) => {
              const title = f(tk);
              const body = f(bk);
              if (!title || !body) return null;
              return (
                <div
                  key={tk}
                  className="rounded-xl p-5"
                  style={{
                    background: "var(--lp-surface)",
                    border: "1px solid var(--lp-border)",
                  }}
                >
                  <p
                    className="mb-3 flex items-center gap-2 text-[15px] font-bold"
                    style={{ color: "var(--lp-accent)" }}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: "var(--lp-primary)" }}
                    />
                    {title}
                  </p>
                  <ul className="space-y-2">
                    {splitOptions(body).map((item) => (
                      <li
                        key={item}
                        className="text-[14px] leading-relaxed sm:text-[15px]"
                        style={{ color: "var(--lp-muted)" }}
                      >
                        ・{item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Band>
      )}

      {/* ── 7. 免費體驗獲得 ─────────────────────────── */}
      {show("benefits") && (
        <Band tone="alt">
          <GoldRule />
          <Heading>{f("benefits_title")}</Heading>
          {f("benefits_subtitle") && (
            <p
              className="mb-8 text-center text-base font-semibold sm:text-lg"
              style={{ color: "var(--lp-accent)" }}
            >
              {f("benefits_subtitle")}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => {
              const v = f(`benefit_${i}`);
              return v ? (
                <div
                  key={i}
                  className="rounded-2xl p-6 text-center"
                  style={{
                    background: "var(--lp-surface)",
                    border: "1px solid var(--lp-border)",
                    boxShadow: "var(--lp-shadow)",
                  }}
                >
                  <div
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-base font-black"
                    style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}
                  >
                    {i}
                  </div>
                  <p
                    className="text-[15px] font-semibold leading-snug"
                    style={{ color: "var(--lp-text)" }}
                  >
                    {v}
                  </p>
                </div>
              ) : null;
            })}
          </div>
        </Band>
      )}

      {/* ── 8. 價格卡 ───────────────────────────────── */}
      {show("pricing") && (
        <Band>
          <div
            className="mx-auto max-w-md rounded-2xl p-8 text-center"
            style={{
              background: "var(--lp-surface)",
              border: "1px solid var(--lp-border-strong)",
              boxShadow: "var(--lp-shadow)",
            }}
          >
            {f("price_original_label") && (
              <p className="mb-3 text-sm line-through" style={{ color: "var(--lp-faint)" }}>
                {f("price_original_label")} ${f("price_original_amount")} 元
              </p>
            )}
            <p className="mb-1 text-sm font-semibold" style={{ color: "var(--lp-muted)" }}>
              {f("price_now_label")}
            </p>
            <p
              className="mb-4 text-5xl font-black tracking-tight sm:text-6xl"
              style={{ color: "var(--lp-accent)" }}
            >
              ${f("price_now_amount")}
              <span className="ml-1 text-2xl font-bold">元</span>
            </p>
            {f("price_note") && (
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--lp-faint)" }}>
                {f("price_note")}
              </p>
            )}
            <button
              type="button"
              onClick={scrollToForm}
              className="mt-6 w-full rounded-xl px-6 py-3.5 text-base font-bold transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}
            >
              {f("hero_cta_text") || "立即預約諮詢"}
            </button>
          </div>
        </Band>
      )}

      {/* ── 9. 常見問題（掛點，客戶填了才出現）──────── */}
      {show("faq") && faqs.length > 0 && (
        <Band tone="alt">
          <GoldRule />
          <Heading>{f("faq_title") || "常見問題"}</Heading>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl px-5 py-4"
                style={{
                  background: "var(--lp-surface)",
                  border: "1px solid var(--lp-border)",
                }}
              >
                <summary
                  className="cursor-pointer list-none text-[15px] font-semibold marker:hidden"
                  style={{ color: "var(--lp-text)" }}
                >
                  <span className="mr-2" style={{ color: "var(--lp-accent)" }}>
                    Q
                  </span>
                  {item.q}
                </summary>
                {item.a && (
                  <p
                    className="mt-3 text-[14px] leading-relaxed sm:text-[15px]"
                    style={{ color: "var(--lp-muted)" }}
                  >
                    {item.a}
                  </p>
                )}
              </details>
            ))}
          </div>
        </Band>
      )}

      {/* ── 10. 預約表單 ────────────────────────────── */}
      {show("form") && (
        <Band id={FORM_ANCHOR} tone="surface">
          <GoldRule />
          <Heading>{f("form_title")}</Heading>
          <div className="mb-8 space-y-1 text-center">
            {[f("form_subtitle"), f("form_subtitle_2")].map(
              (v, i) =>
                v && (
                  <p
                    key={i}
                    className="text-[14px] leading-relaxed sm:text-[15px]"
                    style={{ color: "var(--lp-muted)" }}
                  >
                    {v}
                  </p>
                ),
            )}
          </div>

          {done ? (
            <div
              className="mx-auto max-w-md rounded-2xl p-8 text-center"
              style={{
                background: "var(--lp-surface)",
                border: "1px solid var(--lp-primary)",
                boxShadow: "var(--lp-shadow)",
              }}
              role="status"
              aria-live="polite"
            >
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}
              >
                ✓
              </div>
              <p className="mb-2 text-xl font-bold" style={{ color: "var(--lp-text)" }}>
                {f("form_success_title") || "已收到你的預約！"}
              </p>
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--lp-muted)" }}>
                {f("form_success_text") || "阿倫教官將主動和你聯繫🤜🤛"}
              </p>
              {lineHref && (
                <a
                  href={lineHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-bold transition hover:opacity-90"
                  style={{ background: "#06C755", color: "#fff" }}
                >
                  {f("contact_line_label") || "順手加 LINE 好友"}
                </a>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mx-auto max-w-xl space-y-6 rounded-2xl p-6 sm:p-8"
              style={{
                background: "var(--lp-surface)",
                border: "1px solid var(--lp-border)",
                boxShadow: "var(--lp-shadow)",
              }}
            >
              {/* 蜜罐（防機器人），對使用者不可見 */}
              <input
                ref={honeypotRef}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute h-0 w-0 opacity-0"
              />

              <TextField
                label={f("q_name_label") || "姓名"}
                value={a.name}
                onChange={(v) => set("name", v)}
                required
                invalid={touched && missing.includes("name")}
              />
              <TextField
                label={f("q_phone_label") || "行動電話"}
                value={a.phone}
                onChange={(v) => set("phone", v)}
                required
                type="tel"
                placeholder={f("q_phone_placeholder") || "0912345678"}
                invalid={touched && missing.includes("phone")}
              />
              <TextField
                label={f("q_email_label") || "電子信箱"}
                value={a.email}
                onChange={(v) => set("email", v)}
                required
                type="email"
                placeholder="you@example.com"
                invalid={touched && missing.includes("email")}
              />
              <TextField
                label={f("q_ig_label") || "IG帳號"}
                value={a.ig}
                onChange={(v) => set("ig", v)}
                required
                invalid={touched && missing.includes("ig")}
              />
              <TextField
                label={f("q_line_label") || "Line帳號"}
                value={a.line}
                onChange={(v) => set("line", v)}
                required
                hint={f("q_line_hint") || "必須開通好友"}
                invalid={touched && missing.includes("line")}
              />

              {["tenure", "gym", "income", "pain"].map((k) => {
                const qd = q(k);
                return qd ? (
                  <ChipGroup
                    key={k}
                    q={qd}
                    selected={a.chips[k] ?? []}
                    otherText={a.others[k] ?? ""}
                    onSelect={(next) => set("chips", { ...a.chips, [k]: next })}
                    onOtherText={(v) => set("others", { ...a.others, [k]: v })}
                    invalid={touched && missing.includes(k)}
                  />
                ) : null;
              })}

              <TextField
                label={f("q_goal_label") || "你希望 3 個月後達到什麼狀態？"}
                value={a.goal}
                onChange={(v) => set("goal", v)}
                multiline
              />
              <TextField
                label={f("q_extra_label") || "有什麼可以讓我先知道的？"}
                value={a.extra}
                onChange={(v) => set("extra", v)}
                multiline
              />

              {["time", "goalarea", "course"].map((k) => {
                const qd = q(k);
                return qd ? (
                  <ChipGroup
                    key={k}
                    q={qd}
                    selected={a.chips[k] ?? []}
                    otherText={a.others[k] ?? ""}
                    onSelect={(next) => set("chips", { ...a.chips, [k]: next })}
                    onOtherText={(v) => set("others", { ...a.others, [k]: v })}
                    invalid={touched && missing.includes(k)}
                  />
                ) : null;
              })}

              {error && (
                <p
                  className="rounded-lg px-4 py-3 text-sm font-medium"
                  style={{ background: "rgba(239,106,106,0.12)", color: "#EF6A6A" }}
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl px-8 py-4 text-base font-bold transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}
              >
                {submitting ? "送出中…" : f("form_submit_text") || "立即預約諮詢"}
              </button>
              {f("form_privacy_note") && (
                <p className="text-center text-xs" style={{ color: "var(--lp-faint)" }}>
                  {f("form_privacy_note")}
                </p>
              )}
            </form>
          )}
        </Band>
      )}

      {/* ── 11. 聯絡資訊 ────────────────────────────── */}
      {show("contact") && (lineHref || phone || igUrl || email) && (
        <Band tone="base">
          <Heading>{f("contact_title") || "其他聯絡方式"}</Heading>
          <div className="mx-auto grid max-w-lg gap-3 sm:grid-cols-2">
            {lineHref && (
              <a
                href={lineHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-[15px] font-bold transition hover:opacity-90"
                style={{ background: "#06C755", color: "#fff" }}
              >
                {f("contact_line_label") || "加 LINE 好友"}
              </a>
            )}
            {phone && (
              <a
                href={telHref(phone)}
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-[15px] font-bold transition hover:opacity-90"
                style={{
                  background: "var(--lp-surface)",
                  color: "var(--lp-text)",
                  border: "1px solid var(--lp-border-strong)",
                }}
              >
                📞 {phone}
              </a>
            )}
            {igUrl && (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-[15px] font-bold transition hover:opacity-90"
                style={{
                  background: "var(--lp-surface)",
                  color: "var(--lp-text)",
                  border: "1px solid var(--lp-border-strong)",
                }}
              >
                📷 Instagram
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-[15px] font-bold transition hover:opacity-90"
                style={{
                  background: "var(--lp-surface)",
                  color: "var(--lp-text)",
                  border: "1px solid var(--lp-border-strong)",
                }}
              >
                ✉️ Email
              </a>
            )}
          </div>
        </Band>
      )}

      <footer
        className="px-5 py-10 pb-28 text-center sm:pb-10"
        style={{ background: "var(--lp-bg)", borderTop: "1px solid var(--lp-border)" }}
      >
        <p className="text-xs" style={{ color: "var(--lp-faint)" }}>
          © {new Date().getFullYear()} {project.project_name || "阿倫教官"}
        </p>
      </footer>

      {/* ── 手機版懸浮 CTA（捲動時常駐）───────────────── */}
      {show("sticky") && !done && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex gap-2 px-3 py-3 sm:hidden"
          style={{
            background: "var(--lp-surface)",
            borderTop: "1px solid var(--lp-border-strong)",
            boxShadow: "0 -8px 24px -12px rgba(0,0,0,0.45)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={scrollToForm}
            className="flex-1 rounded-xl px-4 py-3 text-[15px] font-bold active:scale-[0.98]"
            style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}
          >
            {f("sticky_cta_text") || "立即預約"}
          </button>
          {lineHref && (
            <a
              href={lineHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl px-5 py-3 text-[15px] font-bold active:scale-[0.98]"
              style={{ background: "#06C755", color: "#fff" }}
            >
              {f("sticky_line_text") || "加 LINE"}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default AaronConsultLP;
