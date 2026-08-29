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

/**
 * 格式選項：`labelKey` 對應核心字典的 `exportFeature.format*`。
 * 模組層級常數不能碰 `t`，所以只存 key，渲染時再查字典。
 */
const FORMAT_OPTIONS = [
  { value: "xlsx", labelKey: "formatXlsx" },
  { value: "docx", labelKey: "formatDocx" },
  { value: "html", labelKey: "formatHtml" },
  { value: "md",   labelKey: "formatMd" },
  { value: "txt",  labelKey: "formatTxt" },
] as const;

type ExportFormat = (typeof FORMAT_OPTIONS)[number]["value"];

/** 模組清單：名稱／說明改由 `adminExportPage.moduleNames|moduleDescs` 依 key 查表 */
const MODULES = [
  { key: "users",         icon: "👥" },
  { key: "courses",       icon: "📚" },
  { key: "articles",      icon: "📰" },
  { key: "videos",        icon: "🎬" },
  { key: "lessons",       icon: "🎓" },
  { key: "bookings",      icon: "📅" },
  { key: "chat_all",      icon: "💬" },
  { key: "marquee",       icon: "📢" },
  { key: "podcast",       icon: "🎙️" },
  { key: "notifications", icon: "🔔" },
  { key: "site_content",  icon: "📝" },
  { key: "whitelist",     icon: "🛡️" },
  { key: "landing_pages", icon: "🏠" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

// ===== 下載觸發函式 =====
async function triggerDownload(
  url: string,
  token: string,
  failMsg: string,
): Promise<void> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || failMsg);
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
      await triggerDownload(
        `/api/admin/export/${moduleKey}?format=${format}`,
        token,
        t.adminExportPage.downloadFailed,
      );
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
      await triggerDownload(
        `/api/admin/export/full?format=${format}`,
        token,
        t.adminExportPage.downloadFailed,
      );
      showToast(t.exportFeature.exportSuccess, true);
    } catch (err) {
      showToast((err as Error).message || t.exportFeature.exportFailed, false);
    } finally {
      setLoadingKey(null);
    }
  };

  /** 目前選中格式的顯示文字（給按鈕標籤用） */
  const selectedFormat = FORMAT_OPTIONS.find((o) => o.value === format);
  const formatLabel = selectedFormat
    ? t.exportFeature[selectedFormat.labelKey]
    : format.toUpperCase();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs text-luxe-muted uppercase tracking-widest">Admin</span>
        <h1 className="text-2xl font-light text-luxe-text mt-1">
          {t.exportFeature.exportCenter}
        </h1>
        <p className="text-sm text-luxe-muted mt-1">
          {t.adminExportPage.pageSubtitle}
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
      <div
        data-tour="export-format"
        className="bg-luxe-surface border border-luxe-gold/10 rounded-xl p-5"
      >
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
              {t.exportFeature[opt.labelKey]}
            </button>
          ))}
        </div>
      </div>

      {/* 分模組匯出 */}
      <div>
        <h2 className="text-base font-medium text-luxe-text mb-4">
          {t.exportFeature.moduleExport}
        </h2>
        <div
          data-tour="export-modules"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
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
                    <p className="text-sm font-medium text-luxe-text truncate">
                      {t.adminExportPage.moduleNames[mod.key as ModuleKey]}
                    </p>
                    <p className="text-xs text-luxe-muted mt-0.5 leading-relaxed">
                      {t.adminExportPage.moduleDescs[mod.key as ModuleKey]}
                    </p>
                  </div>
                </div>
                <button
                  data-tour="export-module-btn"
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
                      {t.adminExportPage.exportingShort}
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t.adminExportPage.exportBtn}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 全站匯出 */}
      <div
        data-tour="export-full"
        className="bg-luxe-surface border border-luxe-gold/20 rounded-xl p-6"
      >
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
                {t.exportFeature.fullExportBtn} ({formatLabel})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminExport;
