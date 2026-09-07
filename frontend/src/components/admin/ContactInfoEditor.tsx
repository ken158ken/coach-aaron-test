/**
 * ContactInfoEditor — 後台「內容管理 → 聯絡資訊」
 *
 * 編輯 /contact 頁的所有可抽換資訊：形象照、名稱/頭銜、Email、LINE、
 * 營業時間（中英）、表單說明（中英）、社群連結（JSON 整組）。
 *
 * 儲存機制：全部落在 site_content 的 `contact_*` keys——已存在就 PUT、
 * 不存在就 POST 建立（首次儲存會自動長出所有列）。前台 Contact.tsx 的
 * `cc()` 讀不到值時 fallback 到 constants 舊值，因此「留空 = 用預設」。
 */

import React, { useEffect, useState } from "react";
import { PillButton, ImageInput } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
  contentService,
  type SiteContent,
} from "@/services/site/content.service";

/** 社群連結一列（與前台 BadgeItem 對齊；存成 JSON 陣列） */
interface SocialRow {
  name: string;
  href: string;
  icon: string;
  desc: string;
  bg: string;
}

/** 要管理的 keys 與其 site_content 中文名／型別（建立列時用） */
const FIELD_DEFS: Array<{ key: string; label: string; type: "text" | "image" | "json" }> = [
  { key: "contact_photo_url", label: "聯絡頁-教練形象照", type: "image" },
  { key: "contact_name", label: "聯絡頁-顯示名稱", type: "text" },
  { key: "contact_title", label: "聯絡頁-頭銜", type: "text" },
  { key: "contact_email", label: "聯絡頁-Email", type: "text" },
  { key: "contact_line_id", label: "聯絡頁-LINE ID", type: "text" },
  { key: "contact_line_url", label: "聯絡頁-LINE 連結", type: "text" },
  { key: "contact_hours", label: "聯絡頁-營業時間", type: "text" },
  { key: "contact_form_intro", label: "聯絡頁-表單說明", type: "text" },
  { key: "contact_socials", label: "聯絡頁-社群連結(JSON)", type: "json" },
];

const INPUT_CLS =
  "w-full bg-luxe-surface border border-luxe-gold/20 rounded-lg px-3 py-1.5 text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50";

const EMPTY_SOCIAL: SocialRow = { name: "", href: "", icon: "🔗", desc: "", bg: "#444444" };

const ContactInfoEditor: React.FC = () => {
  const { t } = useLanguage();
  const c = t.adminContact;

  /** content_key → 既有列（拿 content_id 判斷 PUT / POST） */
  const [rows, setRows] = useState<Map<string, SiteContent>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [photoUrl, setPhotoUrl] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [lineUrl, setLineUrl] = useState("");
  const [hours, setHours] = useState("");
  const [hoursEn, setHoursEn] = useState("");
  const [formIntro, setFormIntro] = useState("");
  const [formIntroEn, setFormIntroEn] = useState("");
  const [socials, setSocials] = useState<SocialRow[]>([]);

  useEffect(() => {
    contentService
      .getAllAdmin()
      .then((list) => {
        const map = new Map<string, SiteContent>();
        for (const item of list) map.set(item.content_key, item);
        setRows(map);
        const v = (k: string) => map.get(k)?.content_value ?? "";
        const vEn = (k: string) => map.get(k)?.content_value_en ?? "";
        setPhotoUrl(v("contact_photo_url"));
        setName(v("contact_name"));
        setTitle(v("contact_title"));
        setEmail(v("contact_email"));
        setLineId(v("contact_line_id"));
        setLineUrl(v("contact_line_url"));
        setHours(v("contact_hours"));
        setHoursEn(vEn("contact_hours"));
        setFormIntro(v("contact_form_intro"));
        setFormIntroEn(vEn("contact_form_intro"));
        try {
          const arr = JSON.parse(v("contact_socials") || "[]");
          if (Array.isArray(arr)) {
            setSocials(
              arr
                .filter((s) => s && typeof s.name === "string")
                .map((s) => ({ ...EMPTY_SOCIAL, ...s })),
            );
          }
        } catch {
          setSocials([]);
        }
      })
      .catch(() => setMsg({ ok: false, text: c.loadFailed }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 單一 key 的 upsert（存在→PUT，不存在→POST；回傳最新列供更新快取） */
  const upsert = async (
    key: string,
    value: string,
    valueEn?: string,
  ): Promise<SiteContent> => {
    const def = FIELD_DEFS.find((f) => f.key === key)!;
    const existing = rows.get(key);
    if (existing) {
      return contentService.updateContent(existing.content_id, {
        contentValue: value,
        ...(valueEn !== undefined ? { contentValueEn: valueEn } : {}),
      });
    }
    return contentService.createContent({
      contentKey: key,
      contentName: def.label,
      contentValue: value,
      ...(valueEn !== undefined ? { contentValueEn: valueEn } : {}),
      contentType: def.type,
      sortOrder: 900, // 排在既有內容之後，不干擾其他 section
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const socialsJson = JSON.stringify(
        socials.filter((s) => s.name.trim() && s.href.trim()),
      );
      const jobs: Array<[string, string, string?]> = [
        ["contact_photo_url", photoUrl],
        ["contact_name", name.trim()],
        ["contact_title", title.trim()],
        ["contact_email", email.trim()],
        ["contact_line_id", lineId.trim()],
        ["contact_line_url", lineUrl.trim()],
        ["contact_hours", hours.trim(), hoursEn.trim()],
        ["contact_form_intro", formIntro, formIntroEn],
        ["contact_socials", socialsJson],
      ];
      const next = new Map(rows);
      for (const [key, value, valueEn] of jobs) {
        const saved = await upsert(key, value, valueEn);
        if (saved?.content_key) next.set(saved.content_key, saved);
      }
      setRows(next);
      setMsg({ ok: true, text: c.saved });
    } catch {
      setMsg({ ok: false, text: c.saveFailed });
    } finally {
      setSaving(false);
    }
  };

  const moveSocial = (idx: number, dir: -1 | 1) => {
    setSocials((list) => {
      const next = [...list];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return list;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const setSocialField = (idx: number, field: keyof SocialRow, value: string) =>
    setSocials((list) => list.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-luxe-gold/40 border-t-luxe-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-tour="contact-info-editor">
      <div>
        <h2 className="text-lg text-luxe-text font-medium">{c.heading}</h2>
        <p className="text-sm text-luxe-muted mt-1">{c.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左：照片 */}
        <div>
          <ImageInput
            label={c.photo}
            hint={c.photoHint}
            value={photoUrl}
            onChange={setPhotoUrl}
            entity="site-content"
            entityKey="site_contact_photo"
            kind="photo"
            aspectHint="1 / 1"
          />
        </div>

        {/* 右：基本欄位 */}
        <div className="space-y-4">
          {(
            [
              [c.name, name, setName, "阿倫教官"],
              [c.title, title, setTitle, "威豪健身總教官｜私教變現專家"],
              [c.email, email, setEmail, "s330221@gmail.com"],
              [c.lineId, lineId, setLineId, "@667nqldx"],
            ] as Array<[string, string, (v: string) => void, string]>
          ).map(([label, value, setter, ph]) => (
            <div key={label}>
              <label className="block text-xs text-luxe-muted mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={ph}
                className={INPUT_CLS}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-luxe-muted mb-1">
              {c.lineUrl}
              <span className="ml-2 text-luxe-muted/70">{c.lineUrlHint}</span>
            </label>
            <input
              type="text"
              value={lineUrl}
              onChange={(e) => setLineUrl(e.target.value)}
              placeholder="https://line.me/R/ti/p/@667nqldx"
              className={INPUT_CLS}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-luxe-muted mb-1">{c.hours}</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="週一至週六 09:00 - 21:00"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs text-luxe-muted mb-1">{c.hoursEn}</label>
              <input
                type="text"
                value={hoursEn}
                onChange={(e) => setHoursEn(e.target.value)}
                placeholder="Mon–Sat 09:00 - 21:00"
                className={INPUT_CLS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 表單說明（中英） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-luxe-muted mb-1">
            {c.formIntro}
            <span className="ml-2 text-luxe-muted/70">{c.formIntroHint}</span>
          </label>
          <textarea
            value={formIntro}
            onChange={(e) => setFormIntro(e.target.value)}
            rows={3}
            className={`${INPUT_CLS} resize-none`}
          />
        </div>
        <div>
          <label className="block text-xs text-luxe-muted mb-1">{c.formIntroEn}</label>
          <textarea
            value={formIntroEn}
            onChange={(e) => setFormIntroEn(e.target.value)}
            rows={3}
            className={`${INPUT_CLS} resize-none`}
          />
        </div>
      </div>

      {/* 社群連結 */}
      <div>
        <div className="flex items-baseline gap-3 mb-2">
          <h3 className="text-sm text-luxe-text font-medium">{c.socials}</h3>
          <span className="text-xs text-luxe-muted">{c.socialsHint}</span>
        </div>
        <div className="space-y-2">
          {socials.map((s, idx) => (
            <div
              key={idx}
              className="grid grid-cols-2 sm:grid-cols-[1fr_1.6fr_64px_1fr_1fr_auto] gap-2 items-center bg-luxe-surface/60 border border-luxe-gold/10 rounded-lg p-2"
            >
              <input value={s.name} onChange={(e) => setSocialField(idx, "name", e.target.value)} placeholder={c.colName} className={INPUT_CLS} />
              <input value={s.href} onChange={(e) => setSocialField(idx, "href", e.target.value)} placeholder={c.colUrl} className={INPUT_CLS} />
              <input value={s.icon} onChange={(e) => setSocialField(idx, "icon", e.target.value)} placeholder={c.colIcon} className={`${INPUT_CLS} text-center`} />
              <input value={s.desc} onChange={(e) => setSocialField(idx, "desc", e.target.value)} placeholder={c.colDesc} className={INPUT_CLS} />
              <input value={s.bg} onChange={(e) => setSocialField(idx, "bg", e.target.value)} placeholder={c.bgHint} className={INPUT_CLS} />
              <div className="flex items-center gap-1 justify-end col-span-2 sm:col-span-1">
                <button type="button" title={c.moveUp} onClick={() => moveSocial(idx, -1)} className="px-2 py-1 text-luxe-muted hover:text-luxe-gold text-sm">↑</button>
                <button type="button" title={c.moveDown} onClick={() => moveSocial(idx, 1)} className="px-2 py-1 text-luxe-muted hover:text-luxe-gold text-sm">↓</button>
                <button type="button" title={c.remove} onClick={() => setSocials((l) => l.filter((_, i) => i !== idx))} className="px-2 py-1 text-red-400/70 hover:text-red-400 text-sm">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSocials((l) => [...l, { ...EMPTY_SOCIAL }])}
          className="mt-2 px-3 py-1.5 text-sm text-luxe-gold border border-luxe-gold/30 rounded-lg hover:bg-luxe-gold/10 transition-colors"
        >
          {c.addSocial}
        </button>
      </div>

      {/* 儲存 */}
      <div className="flex items-center gap-4 pt-2 border-t border-luxe-gold/10">
        <PillButton onClick={handleSave} disabled={saving}>
          {saving ? c.saving : c.save}
        </PillButton>
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
            {msg.ok ? "✓" : "✗"} {msg.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default ContactInfoEditor;
