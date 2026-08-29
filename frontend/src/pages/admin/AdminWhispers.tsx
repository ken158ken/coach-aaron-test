/**
 * AdminWhispers — 悄悄話後台管理（唯讀）
 * @module pages/admin/AdminWhispers
 * @theme luxe
 * 只有 admin_whitelist 成員可查看，不可編輯/刪除
 */

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { get } from "@/services/api";

interface Whisper {
  whisper_id: number;
  name: string;
  contact: string;
  message: string;
  created_at: string;
  expires_at: string;
}

const AdminWhispers: React.FC = () => {
  const { t, isZhTW } = useLanguage();
  const wp = t.adminWhispersPage;

  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await get<Whisper[]>("/api/whispers");
        setWhispers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(t.adminWhispersPage.loadFailed);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [t]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(isZhTW ? "zh-TW" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div>
      <div className="mb-6" data-tour="whispers-header">
        <h1 className="text-xl sm:text-2xl font-light text-luxe-text">{wp.pageTitle}</h1>
        <p className="text-sm text-luxe-muted">
          {wp.pageSubtitle.replace("{n}", String(whispers.length))}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/*
        `whispers-list` 是新手導覽的錨點：不管收件匣是空的還是有訊息都存在，
        導覽才不會因為「今天剛好沒人留言」就少掉一半步驟。
      */}
      <div data-tour="whispers-list">
      {loading ? (
        <p className="text-luxe-muted py-12 text-center text-sm">{t.common.loading}</p>
      ) : whispers.length === 0 ? (
        <div className="text-center py-16" data-tour="whispers-empty">
          <p className="text-4xl mb-3">🤫</p>
          <p className="text-luxe-muted text-sm">{wp.emptyState}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {whispers.map((w) => {
            const remaining = daysLeft(w.expires_at);
            return (
              <div
                key={w.whisper_id}
                data-tour="whispers-card"
                className="bg-luxe-surface rounded-lg border border-luxe-gold/10 p-4 sm:p-5 hover:border-luxe-gold/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2" data-tour="whispers-contact">
                    <span className="text-lg">🤫</span>
                    <div>
                      <p className="text-sm font-medium text-luxe-text">{w.name}</p>
                      <p className="text-xs text-luxe-muted">{w.contact}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0" data-tour="whispers-expiry">
                    <p className="text-[10px] text-luxe-muted">{formatDate(w.created_at)}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        remaining <= 3
                          ? "bg-red-500/15 text-red-400"
                          : remaining <= 7
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-luxe-gold/10 text-luxe-muted"
                      }`}
                    >
                      {wp.daysLeft.replace("{n}", String(remaining))}
                    </span>
                  </div>
                </div>
                <p
                  data-tour="whispers-message"
                  className="text-sm text-luxe-text/80 leading-relaxed bg-luxe-bg/40 rounded-lg p-3 border border-luxe-gold/5"
                >
                  {w.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
      </div>

      <p
        data-tour="whispers-note"
        className="mt-6 text-xs text-luxe-muted/50 text-center"
      >
        {wp.footerNote}
      </p>
    </div>
  );
};

export default AdminWhispers;
