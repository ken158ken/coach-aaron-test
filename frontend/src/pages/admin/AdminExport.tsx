/**
 * AdminExport — 後台匯出中心
 * /admin/export
 *
 * 功能：
 *   - 選擇格式（md/txt/html/xlsx/docx）
 *   - 分模組匯出
 *   - 全站一次匯出（多 Sheet Excel）
 */

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getAuthToken } from "@/services/api";

// ===== 格式選項 =====
const FORMAT_OPTIONS = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "docx", label: "Word (.docx)" },
  { value: "html", label: "網頁 (.html)" },
  { value: "md",   label: "Markdown (.md)" },
  { value: "txt",  label: "純文字 (.txt)" },
] as const;

type ExportFormat = (typeof FORMAT_OPTIONS)[number]["value"];

// ===== 模組清單 =====
const MODULES = [
  { key: "users",         icon: "👥", name: "使用者名單",    desc: "所有會員資料（不含密碼）" },
  { key: "courses",       icon: "📚", name: "課程",          desc: "課程名稱、分類、價格、狀態" },
  { key: "articles",      icon: "📰", name: "文章",          desc: "文章標題、分類、狀態、瀏覽數" },
  { key: "videos",        icon: "🎬", name: "Reels 影片",    desc: "影片標題、平台、連結" },
  { key: "lessons",       icon: "🎓", name: "教學影片",      desc: "Loom 教學影片、時長、關鍵字" },
  { key: "bookings",      icon: "📅", name: "預約記錄",      desc: "預約者、時段、狀態、備註" },
  { key: "chat_all",      icon: "💬", name: "所有聊天記錄",  desc: "所有對話訊息（最多 5,000 則）" },
  { key: "marquee",       icon: "📢", name: "跑馬燈",        desc: "認證與成果跑馬燈文字" },
  { key: "podcast",       icon: "🎙️", name: "Podcast",       desc: "Podcast 集數列表" },
  { key: "notifications", icon: "🔔", name: "通知記錄",      desc: "系統通知記錄（最多 3,000 筆）" },
  { key: "site_content",  icon: "📝", name: "站內文案",      desc: "網站各區塊文案鍵值" },
  { key: "whitelist",     icon: "🛡️", name: "管理員白名單",  desc: "管理員 Email 清單" },
  { key: "landing_pages", icon: "🏠", name: "Landing Pages", desc: "動態頁面專案列表" },
];

// ===== 下載觸發函式 =====
async function triggerDownload(url: string, token: string): Promise<void> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "下載失敗");
  }
  const disposition = res.headers.get("content-disposition") || "";
  let filename = "export";
  const match = disposition.match(/filename\*=UTF-8''(.+)/i);
  if (match) filename = decodeURIComponent(match[1]);

  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objUrl);
}

// ===== 元件 =====

const AdminExport: React.FC = () => {
  const { t } = useLanguage();

  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleModuleExport = async (moduleKey: string) => {
    const token = getAuthToken();
    if (!token) return;
    setLoadingKey(moduleKey);
    try {
      await triggerDownload(`/api/admin/export/${moduleKey}?format=${format}`, token);
      showToast(t.exportFeature.exportSuccess, true);
    } catch (err) {
      showToast((err as Error).message || t.exportFeature.exportFailed, false);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleFullExport = async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoadingKey("__full__");
    try {
      await triggerDownload(`/api/admin/export/full?format=${format}`, token);
      showToast(t.exportFeature.exportSuccess, true);
    } catch (err) {
      showToast((err as Error).message || t.exportFeature.exportFailed, false);
    } finally {
      setLoadingKey(null);
    }
  };

  /** 目前選中格式的顯示文字（給按鈕標籤用） */
  const formatLabel =
    FORMAT_OPTIONS.find((o) => o.value === format)?.label ?? format.toUpperCase();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs text-luxe-muted uppercase tracking-widest">Admin</span>
        <h1 className="text-2xl font-light text-luxe-text mt-1">
          {t.exportFeature.exportCenter}
        </h1>
        <p className="text-sm text-luxe-muted mt-1">
          選擇格式後點擊各模組的匯出按鈕，或一次匯出全站資料。
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg transition-all ${
            toast.ok
              ? "bg-green-600/90 text-white"
              : "bg-red-600/90 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* 格式選擇 */}
      <div className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-5">
        <h2 className="text-sm font-medium text-luxe-text mb-3">
          {t.exportFeature.selectFormat}
        </h2>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFormat(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                format === opt.value
                  ? "bg-luxe-gold/20 border-luxe-gold text-luxe-gold"
                  : "border-luxe-gold/20 text-luxe-muted hover:border-luxe-gold/40 hover:text-luxe-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分模組匯出 */}
      <div>
        <h2 className="text-base font-medium text-luxe-text mb-4">
          {t.exportFeature.moduleExport}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((mod) => {
            const isLoading = loadingKey === mod.key;
            return (
              <div
                key={mod.key}
                className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-4 flex items-start justify-between gap-3 hover:border-luxe-gold/25 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xl shrink-0 mt-0.5">{mod.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-luxe-text truncate">{mod.name}</p>
                    <p className="text-xs text-luxe-muted mt-0.5 leading-relaxed">{mod.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleModuleExport(mod.key)}
                  disabled={isLoading || loadingKey !== null}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    isLoading
                      ? "border-luxe-gold/30 text-luxe-gold cursor-wait"
                      : "border-luxe-gold/20 text-luxe-muted hover:border-luxe-gold hover:text-luxe-gold disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="w-3 h-3 border border-t-transparent border-luxe-gold rounded-full animate-spin" />
                      匯出中
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      匯出
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 全站匯出 */}
      <div className="bg-luxe-surface border border-luxe-gold/20 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-luxe-text flex items-center gap-2">
              <span>🗂️</span>
              {t.exportFeature.fullExport}
            </h2>
            <p className="text-sm text-luxe-muted mt-1 max-w-lg">
              {t.exportFeature.fullExportDesc}
            </p>
          </div>
          <button
            onClick={handleFullExport}
            disabled={loadingKey !== null}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              loadingKey === "__full__"
                ? "bg-luxe-gold/30 text-luxe-gold cursor-wait"
                : "bg-luxe-gold/20 hover:bg-luxe-gold/30 text-luxe-gold border border-luxe-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {loadingKey === "__full__" ? (
              <>
                <span className="w-4 h-4 border border-t-transparent border-luxe-gold rounded-full animate-spin" />
                {t.exportFeature.exporting}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.exportFeature.fullExportBtn}（{formatLabel}）
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminExport;
