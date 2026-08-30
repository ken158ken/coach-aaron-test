/**
 * AdminLeads — 表單報名後台（教練視角）
 * @module pages/admin/AdminLeads
 * @theme luxe
 *
 * Landing Page 送來的報名資料（lp_leads）檢視與處理：
 * 狀態統計籤（計數＋篩選）＋搜尋＋大/中/小顯示切換＋卡片牆，
 * 詳情含完整逐題 answers、summary、可點聯絡資訊、狀態一鍵切換 chip、
 * 可編輯 coach_note、刪除單筆。
 *
 * 透明度白名單：luxe-gold 僅用 index.css 已定義的 /5 /10 /15 /20 /25 /30
 * （border 另有 /40 /50）；其餘用標準 Tailwind 色階（amber/sky/emerald/red）。
 */

import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS, zhTW } from "date-fns/locale";
import { useLanguage } from "@/context/LanguageContext";
import { useDialog } from "@/components/ui";
import {
  leadsService,
  LEAD_STATUSES,
  type LeadSummary,
  type LeadDetail,
  type LeadStatus,
  type LeadStats,
} from "@/services/site/leads.service";

/** 狀態徽章樣式（luxe）*/
const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  contacted: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  booked: "bg-luxe-gold/15 text-luxe-gold border-luxe-gold/30",
  closed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  spam: "bg-red-500/15 text-red-400 border-red-500/30",
};

type SizeMode = "large" | "medium" | "small";
const SIZE_KEY = "admin_leads_size";

/** 把單題答案轉成可讀字串（陣列逗號串接、物件 JSON、其餘直接字串化）*/
function renderAnswerValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map((v) => String(v)).join("、");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** 取前幾行作為卡片摘要預覽 */
function previewSummary(summary: string | null, lines: number): string {
  if (!summary) return "";
  return summary
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, lines)
    .join(" · ");
}

const AdminLeads: React.FC = () => {
  const { t, isZhTW } = useLanguage();
  const lp = t.adminLeadsPage;
  const dialog = useDialog();
  const dfLocale = isZhTW ? zhTW : enUS;

  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [size, setSize] = useState<SizeMode>("medium");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 備註編輯
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // 讀取顯示尺寸偏好
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIZE_KEY) as SizeMode | null;
      if (saved === "large" || saved === "medium" || saved === "small") setSize(saved);
    } catch {
      /* ignore */
    }
  }, []);
  const changeSize = (s: SizeMode) => {
    setSize(s);
    try {
      localStorage.setItem(SIZE_KEY, s);
    } catch {
      /* ignore */
    }
  };

  const formatTime = useCallback(
    (iso: string): string => {
      const d = new Date(iso);
      const diff = Date.now() - d.getTime();
      const min = Math.floor(diff / 60000);
      if (min < 1) return t.dateTime.justNow;
      if (min < 60) return t.dateTime.minutesAgo.replace("{n}", String(min));
      const hr = Math.floor(min / 60);
      if (hr < 24) return t.dateTime.hoursAgo.replace("{n}", String(hr));
      const day = Math.floor(hr / 24);
      if (day < 7) return t.dateTime.daysAgo.replace("{n}", String(day));
      return format(d, "yyyy/MM/dd HH:mm", { locale: dfLocale });
    },
    [t, dfLocale],
  );

  const fetchStats = useCallback(async () => {
    try {
      setStats(await leadsService.stats());
    } catch {
      /* 統計失敗不阻擋列表 */
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await leadsService.list({
        search,
        status: statusFilter,
        limit: 100,
      });
      setLeads(data.data);
    } catch (err) {
      console.error(err);
      setError(lp.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, lp.loadFailed]);

  useEffect(() => {
    const timer = setTimeout(fetchList, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchList, search]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const openLead = useCallback(
    async (id: number) => {
      setSelectedId(id);
      setDetail(null);
      setNoteSaved(false);
      try {
        setDetailLoading(true);
        const d = await leadsService.detail(id);
        setDetail(d);
        setNoteDraft(d.coach_note ?? "");
      } catch (err) {
        console.error(err);
        setError(lp.loadFailed);
        setSelectedId(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [lp.loadFailed],
  );

  const backToList = () => {
    setSelectedId(null);
    setDetail(null);
    void fetchList();
    void fetchStats();
  };

  const refreshDetail = async () => {
    if (selectedId) {
      const d = await leadsService.detail(selectedId);
      setDetail(d);
    }
    void fetchStats();
  };

  const handleSetStatus = async (status: LeadStatus) => {
    if (!selectedId || !detail) return;
    if (detail.status === status) return;
    try {
      await leadsService.setStatus(selectedId, status);
      await refreshDetail();
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: lp.errors.statusFailed, message: "" });
    }
  };

  const handleSaveNote = async () => {
    if (!selectedId) return;
    try {
      setSavingNote(true);
      setNoteSaved(false);
      await leadsService.setNote(selectedId, noteDraft.trim());
      setNoteSaved(true);
      await refreshDetail();
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: lp.errors.noteFailed, message: "" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !detail) return;
    const confirmed = await dialog.confirm({
      title: lp.del.confirmTitle,
      message: lp.del.confirmMessage.replace("{name}", detail.name),
      variant: "danger",
      confirmText: lp.del.confirmText,
    });
    if (!confirmed) return;
    try {
      await leadsService.remove(selectedId);
      backToList();
    } catch (err) {
      console.error(err);
      await dialog.alert({ title: lp.errors.deleteFailed, message: "" });
    }
  };

  // 統計籤定義（全部 + 5 狀態）
  const statChips: { key: LeadStatus | ""; label: string; count: number }[] = [
    { key: "", label: lp.stats.all, count: stats?.total ?? 0 },
    { key: "new", label: lp.stats.new, count: stats?.new ?? 0 },
    { key: "contacted", label: lp.stats.contacted, count: stats?.contacted ?? 0 },
    { key: "booked", label: lp.stats.booked, count: stats?.booked ?? 0 },
    { key: "closed", label: lp.stats.closed, count: stats?.closed ?? 0 },
    { key: "spam", label: lp.stats.spam, count: stats?.spam ?? 0 },
  ];

  const gridCols =
    size === "large"
      ? "grid-cols-1"
      : size === "small"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  // 聯絡連結
  const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
  const mailHref = (email: string) => `mailto:${email}`;
  const lineHref = (id: string) =>
    `https://line.me/ti/p/~${encodeURIComponent(id.replace(/^@/, ""))}`;
  const igHref = (handle: string) =>
    `https://instagram.com/${encodeURIComponent(handle.replace(/^@/, ""))}`;

  const contactLinkCls =
    "text-luxe-gold hover:underline break-all";

  // ─────────────────────────────────────────────────────────
  // 詳情視圖
  // ─────────────────────────────────────────────────────────
  if (selectedId) {
    const answerEntries = detail
      ? Object.entries(detail.answers || {}).filter(
          ([, v]) => v != null && v !== "",
        )
      : [];

    return (
      <div>
        <button
          onClick={backToList}
          className="text-sm text-luxe-muted hover:text-luxe-gold transition-colors mb-4"
          data-tour="adminleads-back"
        >
          {lp.backToList}
        </button>

        {detailLoading || !detail ? (
          <p className="text-luxe-muted py-16 text-center text-sm">{t.common.loading}</p>
        ) : (
          <div
            className="bg-luxe-surface rounded-2xl border border-luxe-gold/10 p-4 sm:p-6"
            data-tour="adminleads-detail"
          >
            {/* 頂列：狀態 + 時間 + 刪除 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[detail.status]}`}
                >
                  {lp.statusLabel[detail.status]}
                </span>
                <span className="text-xs text-luxe-muted">
                  {lp.createdAt.replace("{time}", formatTime(detail.created_at))}
                </span>
                <span className="text-xs text-luxe-muted">·</span>
                <span className="text-xs text-luxe-muted">
                  {lp.fromProject.replace(
                    "{name}",
                    detail.project_name || lp.unknownProject,
                  )}
                </span>
              </div>
              <button
                onClick={handleDelete}
                className="text-xs text-luxe-muted hover:text-red-400 transition-colors"
                data-tour="adminleads-delete"
              >
                🗑 {lp.del.button}
              </button>
            </div>

            {/* 姓名 */}
            <h1 className="text-xl sm:text-2xl font-light text-luxe-text mb-4 break-words">
              {detail.name}
            </h1>

            {/* 狀態一鍵切換 chip */}
            <div className="flex flex-wrap gap-2 mb-6" data-tour="adminleads-status-chips">
              {LEAD_STATUSES.map((s) => {
                const active = detail.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleSetStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? STATUS_STYLE[s] + " font-medium"
                        : "border-luxe-gold/15 text-luxe-muted hover:text-luxe-text hover:border-luxe-gold/30"
                    }`}
                  >
                    {lp.statusLabel[s]}
                  </button>
                );
              })}
            </div>

            {/* 聯絡資訊 */}
            <section className="mb-6" data-tour="adminleads-contact">
              <h2 className="text-sm font-medium text-luxe-gold/90 mb-2">
                {lp.contact.title}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-luxe-muted w-20 shrink-0">{lp.contact.phone}</dt>
                  <dd className="text-luxe-text break-all">
                    {detail.phone ? (
                      <a href={telHref(detail.phone)} className={contactLinkCls}>
                        {detail.phone}
                      </a>
                    ) : (
                      <span className="text-luxe-muted">{lp.contact.none}</span>
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-luxe-muted w-20 shrink-0">{lp.contact.email}</dt>
                  <dd className="text-luxe-text break-all">
                    {detail.email ? (
                      <a href={mailHref(detail.email)} className={contactLinkCls}>
                        {detail.email}
                      </a>
                    ) : (
                      <span className="text-luxe-muted">{lp.contact.none}</span>
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-luxe-muted w-20 shrink-0">{lp.contact.line}</dt>
                  <dd className="text-luxe-text break-all">
                    {detail.line_id ? (
                      <a
                        href={lineHref(detail.line_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={contactLinkCls}
                      >
                        {detail.line_id}
                      </a>
                    ) : (
                      <span className="text-luxe-muted">{lp.contact.none}</span>
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-luxe-muted w-20 shrink-0">{lp.contact.instagram}</dt>
                  <dd className="text-luxe-text break-all">
                    {detail.instagram ? (
                      <a
                        href={igHref(detail.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={contactLinkCls}
                      >
                        {detail.instagram}
                      </a>
                    ) : (
                      <span className="text-luxe-muted">{lp.contact.none}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            {/* 逐題回答 */}
            <section className="mb-6" data-tour="adminleads-answers">
              <h2 className="text-sm font-medium text-luxe-gold/90 mb-2">
                {lp.answers.title}
              </h2>
              {answerEntries.length === 0 ? (
                <p className="text-sm text-luxe-muted">{lp.answers.empty}</p>
              ) : (
                <ul className="space-y-3">
                  {answerEntries.map(([q, v]) => (
                    <li
                      key={q}
                      className="rounded-xl bg-luxe-bg/40 border border-luxe-gold/10 px-3.5 py-2.5"
                    >
                      <p className="text-xs text-luxe-muted mb-1 break-words">{q}</p>
                      <p className="text-sm text-luxe-text whitespace-pre-wrap break-words">
                        {renderAnswerValue(v)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 摘要 */}
            {detail.summary && (
              <section className="mb-6">
                <h2 className="text-sm font-medium text-luxe-gold/90 mb-2">
                  {lp.summary.title}
                </h2>
                <pre className="text-sm text-luxe-text whitespace-pre-wrap break-words font-sans rounded-xl bg-luxe-bg/40 border border-luxe-gold/10 px-3.5 py-3">
                  {detail.summary}
                </pre>
              </section>
            )}

            {/* 教練備註 */}
            <section
              className="pt-5 border-t border-luxe-gold/10"
              data-tour="adminleads-note"
            >
              <h2 className="text-sm font-medium text-luxe-gold/90 mb-2">
                {lp.note.title}
              </h2>
              <textarea
                value={noteDraft}
                onChange={(e) => {
                  setNoteDraft(e.target.value);
                  setNoteSaved(false);
                }}
                rows={3}
                maxLength={5000}
                placeholder={lp.note.placeholder}
                className="w-full rounded-xl bg-luxe-bg/60 border border-luxe-gold/15 px-3.5 py-2.5 text-sm text-luxe-text outline-none focus:border-luxe-gold/40 resize-y"
              />
              <div className="flex items-center justify-end gap-3 mt-3">
                {noteSaved && (
                  <span className="text-xs text-emerald-400">{lp.note.saved}</span>
                )}
                <button
                  disabled={savingNote || noteDraft === (detail.coach_note ?? "")}
                  onClick={handleSaveNote}
                  className="text-sm px-5 py-2 rounded-full bg-luxe-gold text-black font-medium hover:bg-luxe-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {savingNote ? lp.note.saving : lp.note.save}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 列表視圖
  // ─────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-5" data-tour="adminleads-header">
        <h1 className="text-xl sm:text-2xl font-light text-luxe-text">{lp.pageTitle}</h1>
        <p className="text-sm text-luxe-muted">
          {lp.pageSubtitle.replace("{n}", String(stats?.total ?? 0))}
        </p>
      </div>

      {/* 狀態統計籤 */}
      <div className="flex flex-wrap gap-2 mb-4" data-tour="adminleads-stats">
        {statChips.map((chip) => {
          const active = statusFilter === chip.key;
          return (
            <button
              key={chip.key || "all"}
              onClick={() => setStatusFilter(chip.key)}
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                active
                  ? "bg-luxe-gold/15 text-luxe-gold border-luxe-gold/40 font-medium"
                  : "border-luxe-gold/15 text-luxe-muted hover:text-luxe-text hover:border-luxe-gold/30"
              }`}
            >
              {chip.label}
              <span className={active ? "text-luxe-gold" : "text-luxe-muted/70"}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 搜尋 + 顯示尺寸 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lp.searchPlaceholder}
          data-tour="adminleads-search"
          className="w-full sm:max-w-xs rounded-full bg-luxe-bg/60 border border-luxe-gold/15 px-4 py-2 text-sm text-luxe-text outline-none focus:border-luxe-gold/40"
        />
        <div className="flex items-center gap-2" data-tour="adminleads-size">
          <span className="text-xs text-luxe-muted">{lp.display.label}</span>
          <div className="flex rounded-full border border-luxe-gold/15 overflow-hidden">
            {(["large", "medium", "small"] as SizeMode[]).map((s) => (
              <button
                key={s}
                onClick={() => changeSize(s)}
                className={`px-3 py-1 text-xs transition-colors ${
                  size === s
                    ? "bg-luxe-gold/20 text-luxe-gold"
                    : "text-luxe-muted hover:text-luxe-text"
                }`}
              >
                {lp.display[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div data-tour="adminleads-list">
        {loading ? (
          <p className="text-luxe-muted py-12 text-center text-sm">{t.common.loading}</p>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-luxe-muted text-sm">
              {search || statusFilter ? lp.emptySearch : lp.empty}
            </p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4`}>
            {leads.map((lead) => {
              const preview = previewSummary(lead.summary, size === "large" ? 3 : 2);
              return (
                <button
                  key={lead.id}
                  onClick={() => openLead(lead.id)}
                  data-tour="adminleads-card"
                  className={`text-left bg-luxe-surface rounded-2xl border border-luxe-gold/10 hover:border-luxe-gold/25 transition-colors flex flex-col ${
                    size === "small" ? "p-3" : "p-4 sm:p-5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[lead.status]}`}
                    >
                      {lp.statusLabel[lead.status]}
                    </span>
                    <span className="text-[11px] text-luxe-muted shrink-0">
                      {formatTime(lead.created_at)}
                    </span>
                  </div>
                  <h3
                    className={`font-medium text-luxe-text mb-1 line-clamp-1 ${
                      size === "large" ? "text-lg" : "text-base"
                    }`}
                  >
                    {lead.name}
                  </h3>
                  <p className="text-xs text-luxe-muted/80 mb-1 break-all">
                    {lead.phone}
                  </p>
                  <p className="text-xs text-luxe-muted/80 mb-1">
                    {lp.fromProject.replace(
                      "{name}",
                      lead.project_name || lp.unknownProject,
                    )}
                  </p>
                  {preview && size !== "small" && (
                    <p
                      className={`text-sm text-luxe-muted flex-1 mt-1 ${
                        size === "large" ? "line-clamp-3" : "line-clamp-2"
                      }`}
                    >
                      {preview}
                    </p>
                  )}
                  {lead.coach_note && (
                    <p className="text-[11px] text-luxe-gold/70 mt-2 line-clamp-1">
                      📝 {lead.coach_note}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeads;
