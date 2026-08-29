/**
 * LandingPageNew — 新增 Landing Page（模板選擇器）
 *
 * 獨立全螢幕路由：/admin/landing-pages/new
 * 選好模板 + 填入專案名稱後建立專案，直接跳轉至編輯器。
 *
 * @module pages/admin/LandingPageNew
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { PillButton, Input, useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { landingService } from "@/services/site/landing.service";
import type { LpTemplate, PageKind } from "@/services/site/landing.service";
import { useScrollLock } from "@/hooks/useScrollLock";
// 獨立全頁路由（不在 AdminLayout 之下），所以「?」導覽鈕要自己掛一顆
import { HelpTourButton } from "@/tours";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

/** 類型篩選的顯示順序（文案改由 `adminLandingPageNewPage.pageKind` 查表） */
const PAGE_KIND_ORDER: PageKind[] = [
  "brand_narrative",
  "product_shop",
  "pricing",
  "lead_gen",
  "saas",
  "portfolio",
];

const SELECT_CLS =
  "bg-luxe-surface border border-luxe-gold/20 rounded-lg px-4 py-3 pr-10 " +
  "text-luxe-text text-sm focus:outline-none focus:border-luxe-gold/50 " +
  "focus:ring-2 focus:ring-luxe-gold/20 appearance-none cursor-pointer " +
  "hover:border-luxe-gold/40 transition-all [&>option]:bg-luxe-surface [&>option]:text-luxe-text";

const SELECT_BG = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C9A96E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 0.5rem center",
  backgroundSize: "1.25em 1.25em",
};

const LIMIT = 24;

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

const LandingPageNew: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useDialog();
  const { t } = useLanguage();
  const lpn = t.adminLandingPageNewPage;
  useScrollLock(true); // 全屏路由，永遠鎖定 body scroll

  /** 模板類型標籤：以 key 查字典，找不到就退回原始 key */
  const kindLabel = useCallback(
    (kind: string) =>
      lpn.pageKind[kind as PageKind] ?? kind,
    [lpn],
  );

  // Template list state
  const [templates, setTemplates] = useState<LpTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageKind, setPageKind] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Selection state
  const [selected, setSelected] = useState<LpTemplate | null>(null);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Debounce search ──
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // ── Fetch templates ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Record<string, unknown> = { page, limit: LIMIT };
    if (pageKind !== "all") params.page_kind = pageKind as PageKind;

    landingService
      .getTemplates(params as Parameters<typeof landingService.getTemplates>[0])
      .then((res) => {
        if (cancelled) return;
        setTemplates(res.data);
        setTotal(res.total);
      })
      .catch(() => {
        if (!cancelled) setError(lpn.loadFailed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, pageKind, lpn]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [pageKind]);

  // Keyboard: Escape → back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/admin/landing-pages");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return templates;
    const q = debouncedSearch.toLowerCase();
    return templates.filter(
      (t) =>
        t.template_slug.toLowerCase().includes(q) ||
        (t.brand_name ?? "").toLowerCase().includes(q) ||
        (t.html_title ?? "").toLowerCase().includes(q),
    );
  }, [templates, debouncedSearch]);

  const totalPages = Math.ceil(total / LIMIT);

  // ── Create project ──
  const handleConfirm = useCallback(async () => {
    if (!selected || !projectName.trim()) return;
    setCreating(true);
    try {
      const newProject = await landingService.createProject({
        template_id: selected.id,
        project_name: projectName.trim(),
      });
      navigate(`/admin/landing-pages/${newProject.id}/edit`);
    } catch {
      dialog.alert({
        title: lpn.createFailedTitle,
        message: lpn.createFailedMessage,
      });
    } finally {
      setCreating(false);
    }
  }, [selected, projectName, navigate, dialog, lpn]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-luxe-bg">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-luxe-gold/10 bg-luxe-surface shrink-0">
        <button
          onClick={() => navigate("/admin/landing-pages")}
          data-tour="lpnew-back"
          className="flex items-center gap-1.5 text-sm text-luxe-muted hover:text-luxe-text transition-colors"
          aria-label={t.common.back}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.common.back}
        </button>
        <div className="w-px h-4 bg-luxe-gold/10" />
        <div>
          <h2 className="text-lg font-light text-luxe-text">{lpn.heading}</h2>
          <p className="text-xs text-luxe-muted">
            {lpn.subheading.replace("{n}", String(total))}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Left: Template Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 px-6 py-3 border-b border-luxe-gold/10 shrink-0">
            <Input
              placeholder={lpn.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              theme="luxe"
              className="w-52"
              data-tour="lpnew-search"
            />
            <select
              value={pageKind}
              onChange={(e) => setPageKind(e.target.value)}
              data-tour="lpnew-kind-filter"
              className={SELECT_CLS}
              style={SELECT_BG}
            >
              <option value="all">{lpn.allKinds}</option>
              {PAGE_KIND_ORDER.map((k) => (
                <option key={k} value={k}>{lpn.pageKind[k]}</option>
              ))}
            </select>
            <span className="ml-auto text-xs text-luxe-muted self-center">
              {lpn.showingCount.replace("{n}", String(filtered.length))}
            </span>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-luxe-muted text-sm">
                {t.common.loading}
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-400 text-sm">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-luxe-muted text-sm">
                {lpn.noResults}
              </div>
            ) : (
              <div
                data-tour="lpnew-grid"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"
              >
                {filtered.map((tpl) => (
                  <button
                    key={tpl.id}
                    /*
                     * 新手導覽會點第一張卡來示範「選了模板之後右側會出現什麼」。
                     * 只改本地 state，不會建立專案（那是「建立」鈕的事）。
                     */
                    data-tour="lpnew-card"
                    onClick={() => {
                      setSelected(tpl);
                      setProjectName(tpl.brand_name ?? tpl.template_slug);
                    }}
                    className={`group text-left rounded-lg overflow-hidden border transition-all ${
                      selected?.id === tpl.id
                        ? "border-luxe-gold ring-2 ring-luxe-gold/40"
                        : "border-luxe-gold/10 hover:border-luxe-gold/40"
                    } bg-luxe-surface`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-4/3 bg-luxe-bg flex items-center justify-center relative overflow-hidden">
                      {tpl.thumbnail_url ? (
                        <img
                          src={tpl.thumbnail_url}
                          alt={tpl.template_slug}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-luxe-muted/30">
                          <span className="text-3xl">🎨</span>
                          <span className="text-[9px]">{tpl.animation_type.toUpperCase()}</span>
                        </div>
                      )}
                      <span className="absolute top-1 right-1 bg-luxe-bg/80 text-luxe-gold text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {kindLabel(tpl.page_kind)}
                      </span>
                      {selected?.id === tpl.id && (
                        <div className="absolute inset-0 bg-luxe-gold/10 flex items-center justify-center">
                          <span className="text-3xl text-luxe-gold">✓</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs text-luxe-text truncate font-medium">
                        {tpl.brand_name ?? tpl.template_slug}
                      </p>
                      <p className="text-[10px] text-luxe-muted truncate">
                        {tpl.template_code}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-luxe-gold/10 shrink-0">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded text-xs text-luxe-muted hover:text-luxe-text disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ‹ {t.common.prev}
              </button>
              <span className="text-xs text-luxe-muted">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-xs text-luxe-muted hover:text-luxe-text disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t.common.next} ›
              </button>
            </div>
          )}
        </div>

        {/* Right: Selection Panel */}
        <div
          data-tour="lpnew-panel"
          className="w-72 shrink-0 border-l border-luxe-gold/10 flex flex-col bg-luxe-surface"
        >
          {selected ? (
            <div className="flex flex-col h-full p-5 gap-4">
              <div>
                <p className="text-xs text-luxe-muted mb-1">{lpn.selectedTemplate}</p>
                <p className="text-sm text-luxe-text font-medium">
                  {selected.brand_name ?? selected.template_slug}
                </p>
                <p className="text-[10px] text-luxe-muted mt-0.5">
                  {selected.template_code} ・{kindLabel(selected.page_kind)}
                </p>
              </div>

              {selected.thumbnail_url && (
                <div className="aspect-4/3 rounded overflow-hidden">
                  <img
                    src={selected.thumbnail_url}
                    alt={selected.template_slug}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <label className="text-xs text-luxe-muted block mb-1.5">
                  {lpn.projectNameLabel} <span className="text-red-400">*</span>
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={lpn.projectNamePlaceholder}
                  theme="luxe"
                  data-tour="lpnew-name"
                  onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                />
                <p className="text-[10px] text-luxe-muted mt-1">{lpn.projectNameHint}</p>
              </div>

              <PillButton
                theme="luxe"
                variant="filled"
                data-tour="lpnew-confirm"
                onClick={handleConfirm}
                disabled={!projectName.trim() || creating}
                className="w-full"
              >
                {creating ? lpn.creating : lpn.confirmBtn}
              </PillButton>

              <button
                onClick={() => setSelected(null)}
                className="text-xs text-luxe-muted hover:text-luxe-text text-center"
              >
                {lpn.reselectBtn}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-luxe-muted/40 p-8 text-center">
              <span className="text-4xl">👆</span>
              <p className="text-sm">{lpn.emptyPanelTitle}</p>
              <p className="text-xs mt-4">{lpn.emptyPanelHint}</p>
            </div>
          )}
        </div>
      </div>

      {/* 浮動「?」頁面導覽（此路由不在 AdminLayout 下，需自行掛載） */}
      <HelpTourButton />
    </div>
  );
};

export default LandingPageNew;
