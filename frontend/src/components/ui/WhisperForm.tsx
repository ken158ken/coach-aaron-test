/**
 * WhisperForm — 說悄悄話表單（非登入訪客用）
 * 100字以內，嚴格消毒，帶 honeypot 欄位
 */

import React, { useState } from "react";
import { API_BASE_URL } from "@/constants";
import { useLanguage } from "@/context/LanguageContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TW_PHONE_REGEX = /^09\d{8}$/;

const WhisperForm: React.FC = () => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bot trap，正常用戶不會填
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const validate = (): string | null => {
    const n = name.trim();
    const c = contact.trim().replace(/\s/g, "");
    const m = message.trim();

    if (n.length < 1 || n.length > 50) return t.whisperForm.nameLength;
    if (!c) return t.whisperForm.contactRequired;
    if (!EMAIL_REGEX.test(c) && !TW_PHONE_REGEX.test(c))
      return t.whisperForm.contactInvalid;
    if (m.length < 1 || m.length > 100) return t.whisperForm.messageLength;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setResult({ ok: false, text: err }); return; }

    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/whispers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim().replace(/\s/g, ""),
          message: message.trim(),
          honeypot,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        setResult({ ok: true, text: data.message || t.whisperForm.sent });
        setName(""); setContact(""); setMessage("");
      } else {
        setResult({ ok: false, text: data.error || t.whisperForm.sendFailed });
      }
    } catch {
      setResult({ ok: false, text: t.whisperForm.networkError });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-glass rounded-xl p-5 sm:p-6">
      <h3 className="text-base font-medium text-white/90 mb-1">
        {t.whisperForm.heading}
      </h3>
      <p className="text-xs text-white/40 mb-4">
        {t.whisperForm.intro}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Honeypot — 隱藏，正常用戶不會填 */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        />

        <div>
          <label className="block text-xs text-white/50 mb-1">
          {t.whisperForm.nameLabel}
        </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder={t.whisperForm.namePlaceholder}
            className="w-full whisper-input rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">
            {t.whisperForm.contactLabel}{" "}
          <span className="text-white/30">{t.whisperForm.contactNote}</span>
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={100}
            placeholder={t.whisperForm.contactPlaceholder}
            className="w-full whisper-input rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">
            {t.whisperForm.messageLabel}
            <span className="ml-1 text-white/30">（{message.length}/100）</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 100))}
            maxLength={100}
            rows={3}
            placeholder={t.whisperForm.messagePlaceholder}
            className="w-full whisper-input rounded-lg px-3 py-2 text-sm resize-none"
            required
          />
        </div>

        {result && (
          <p className={`text-xs ${result.ok ? "text-emerald-400" : "text-red-400"}`}>
            {result.ok ? "✓" : "✗"} {result.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? t.bookingPage.submitting : t.whisperForm.submit}
        </button>

        <p className="text-[10px] text-white/25 text-center">
          {t.whisperForm.footer}
        </p>
      </form>
    </div>
  );
};

export default WhisperForm;
