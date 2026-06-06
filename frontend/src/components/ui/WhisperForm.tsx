/**
 * WhisperForm — 說悄悄話表單（非登入訪客用）
 * 100字以內，嚴格消毒，帶 honeypot 欄位
 */

import React, { useState } from "react";
import { API_BASE_URL } from "@/constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TW_PHONE_REGEX = /^09\d{8}$/;

const WhisperForm: React.FC = () => {
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

    if (n.length < 1 || n.length > 50) return "姓名需在 1–50 字以內";
    if (!c) return "請填寫聯絡方式";
    if (!EMAIL_REGEX.test(c) && !TW_PHONE_REGEX.test(c))
      return "聯絡方式需為有效 Email 或台灣手機（09xxxxxxxx）";
    if (m.length < 1 || m.length > 100) return "悄悄話需在 1–100 字以內";
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
        setResult({ ok: true, text: data.message || "悄悄話已送出！" });
        setName(""); setContact(""); setMessage("");
      } else {
        setResult({ ok: false, text: data.error || "送出失敗，請稍後再試" });
      }
    } catch {
      setResult({ ok: false, text: "網路錯誤，請稍後再試" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-black/60 border border-white/8 p-5 sm:p-6">
      <h3 className="text-base font-medium text-white/90 mb-1">悄悄話</h3>
      <p className="text-xs text-white/40 mb-4">
        不想公開留言？可以在這裡說悄悄話（100字以內），訊息 30 天後自動消失。
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
          <label className="block text-xs text-white/50 mb-1">姓名 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="你的名字"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/40"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">
            聯絡方式 * <span className="text-white/30">（Email 或台灣手機，不對外公開）</span>
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={100}
            placeholder="email@example.com 或 09xxxxxxxx"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/40"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">
            悄悄話 *
            <span className="ml-1 text-white/30">（{message.length}/100）</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 100))}
            maxLength={100}
            rows={3}
            placeholder="想說的話..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/40 resize-none"
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
          {loading ? "送出中..." : "送出悄悄話"}
        </button>

        <p className="text-[10px] text-white/25 text-center">
          訊息經過嚴格消毒，30天後自動刪除，不對外公開
        </p>
      </form>
    </div>
  );
};

export default WhisperForm;
