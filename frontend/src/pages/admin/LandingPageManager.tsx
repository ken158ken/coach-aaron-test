/**
 * LandingPageManager — Landing Page 專案管理
 *
 * 兩種子頁面（state-based routing）：
 *   "list"   — 顯示所有 LP 專案（接 /api/landing/projects）
 *   "picker" — 模板選擇器（接 /api/landing/templates），用於建立新專案
 *
 * @module pages/admin/LandingPageManager
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { PillButton, Input, useDialog } from "@/components/ui";
import {
  landingService,
  PAGE_KIND_LABELS,
  STATUS_LABELS,
} from "@/services/landing.service";
import type {
  LpTemplate,
  LpProject,
  PageKind,
  ProjectStatus,
} from "@/services/landing.service";
import { useScrollLock } from "@/hooks/useScrollLock";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const PAGE_KIND_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部類型" },
  ...Object.entries(PAGE_KIND_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const STATUS_BADGE: Record<
  ProjectStatus,
  { bg: string; text: string }
> = {
  draft:     { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  review:    { bg: "bg-blue-500/20",   text: "text-blue-400"   },
  published: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  archived:  { bg: "bg-gray-500/20",   text: "text-gray-400"   },
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

/** 狀態徽章 */
const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${s.bg} ${s.text}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
};

/** select 共用樣式 */
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

// ─────────────────────────────────────────────────────────
// Template Picker
// ─────────────────────────────────────────────────────────

interface TemplatePickerProps {
  onClose: () => void;
  onSelect: (template: LpTemplate, projectName: string) => Promise<void>;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({
  onClose,
  onSelect,
}) => {
  useScrollLock(true);

  const [templates, setTemplates] = useState<LpTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageKind, setPageKind] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<LpTemplate | null>(null);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const LIMIT = 24;

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch templates
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Record<string, unknown> = { page, limit: LIMIT };
    if (pageKind !== "all") params.page_kind = pageKind;
    // tag search via debounced search (searches brand_name-like via backend slug)
    // For now template search is done client-side from loaded data

    landingService
      .getTemplates(params as Parameters<typeof landingService.getTemplates>[0])
      .then((res) => {
        if (cancelled) return;
        setTemplates(res.data);
        setTotal(res.total);
      })
      .catch(() => {
        if (!cancelled) setError("無法載入模板列表");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, pageKind]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [pageKind]);

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

  const handleConfirm = async () => {
    if (!selected || !projectName.trim()) return;
    setCreating(true);
    try {
      await onSelect(selected, projectName.trim());
    } finally {
      setCreating(false);
    }
  };

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-luxe-bg">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-luxe-gold/10 bg-luxe-surface shrink-0">
        <button
          onClick={onClose}
          className="text-luxe-muted hover:text-luxe-text transition-colors"
          aria-label="關閉"
        >
          ✕
        </button>
        <div>
          <h2 className="text-lg font-light text-luxe-text">選擇模板</h2>
          <p className="text-xs text-luxe-muted">
            共 {total} 份模板 ・ 選擇一個作為新專案的基礎
          </p>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Template Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 px-6 py-3 border-b border-luxe-gold/10 shrink-0">
            <Input
              placeholder="搜尋模板名稱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              theme="luxe"
              className="w-52"
            />
            <select
              value={pageKind}
              onChange={(e) => setPageKind(e.target.value)}
              className={SELECT_CLS}
              style={SELECT_BG}
            >
              {PAGE_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="ml-auto text-xs text-luxe-muted self-center">
              顯示 {filtered.length} 筆
            </span>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-luxe-muted text-sm">
                載入中...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-400 text-sm">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-luxe-muted text-sm">
                找不到符合條件的模板
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((tpl) => (
                  <button
                    key={tpl.id}
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
                          <span className="text-[9px]">
                            {tpl.animation_type.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* page_kind badge */}
                      <span className="absolute top-1 right-1 bg-luxe-bg/80 text-luxe-gold text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {PAGE_KIND_LABELS[tpl.page_kind] ?? tpl.page_kind}
                      </span>
                      {/* selected checkmark */}
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
                ‹ 上一頁
              </button>
              <span className="text-xs text-luxe-muted">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-xs text-luxe-muted hover:text-luxe-text disabled:opacity-30 disabled:cursor-not-allowed"
              >
                下一頁 ›
              </button>
            </div>
          )}
        </div>

        {/* Right: Selection Panel */}
        <div className="w-72 shrink-0 border-l border-luxe-gold/10 flex flex-col bg-luxe-surface">
          {selected ? (
            <div className="flex flex-col h-full p-5 gap-4">
              <div>
                <p className="text-xs text-luxe-muted mb-1">已選模板</p>
                <p className="text-sm text-luxe-text font-medium">
                  {selected.brand_name ?? selected.template_slug}
                </p>
                <p className="text-[10px] text-luxe-muted mt-0.5">
                  {selected.template_code} ・{" "}
                  {PAGE_KIND_LABELS[selected.page_kind] ?? selected.page_kind}
                </p>
              </div>

              {/* Template preview thumbnail */}
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
                  專案名稱 <span className="text-red-400">*</span>
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例：2026 春季特訓班"
                  theme="luxe"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirm();
                  }}
                />
                <p className="text-[10px] text-luxe-muted mt-1">
                  可在建立後修改
                </p>
              </div>

              <PillButton
                theme="luxe"
                variant="filled"
                onClick={handleConfirm}
                disabled={!projectName.trim() || creating}
                className="w-full"
              >
                {creating ? "建立中..." : "建立專案 →"}
              </PillButton>

              <button
                onClick={() => setSelected(null)}
                className="text-xs text-luxe-muted hover:text-luxe-text text-center"
              >
                重新選擇
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-luxe-muted/40 p-8 text-center">
              <span className="text-4xl">👆</span>
              <p className="text-sm">點擊左側模板卡片以選取</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

const LandingPageManager: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useDialog();

  const [view, setView] = useState<"list" | "picker">("list");

  // Project list state
  const [projects, setProjects] = useState<LpProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await landingService.getProjects(
        params as Parameters<typeof landingService.getProjects>[0],
      );
      setProjects(res.data);
      setTotal(res.total);
    } catch {
      setError("無法載入專案列表");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Search filter (client-side)
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const q = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        (p.project_code ?? "").toLowerCase().includes(q) ||
        (p.custom_slug ?? "").toLowerCase().includes(q),
    );
  }, [projects, searchTerm]);

  // Create project from template
  const handleTemplateSelect = useCallback(
    async (template: LpTemplate, projectName: string) => {
      try {
        const newProject = await landingService.createProject({
          template_id: template.id,
          project_name: projectName,
        });
        setView("list");
        navigate(`/admin/landing-pages/${newProject.id}/edit`);
      } catch {
        dialog.alert({
          title: "建立失敗",
          message: "無法建立專案，請稍後再試。",
        });
      }
    },
    [navigate, dialog],
  );

  // Toggle status
  const handleToggleStatus = useCallback(
    async (project: LpProject) => {
      try {
        const updated =
          project.status === "published"
            ? await landingService.unpublishProject(project.id)
            : await landingService.publishProject(project.id);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === updated.id
              ? { ...p, status: updated.status, updated_at: updated.updated_at }
              : p,
          ),
        );
      } catch {
        dialog.alert({ title: "操作失敗", message: "狀態更新失敗" });
      }
    },
    [dialog],
  );

  // Delete project
  const handleDelete = useCallback(
    async (project: LpProject) => {
      const confirmed = await dialog.confirm({
        title: "刪除確認",
        message: `確定要刪除「${project.project_name}」嗎？此操作不可復原。`,
        variant: "danger",
        confirmText: "刪除",
        cancelText: "取消",
      });
      if (!confirmed) return;
      try {
        await landingService.deleteProject(project.id);
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
        setTotal((t) => t - 1);
      } catch {
        dialog.alert({ title: "刪除失敗", message: "無法刪除此專案" });
      }
    },
    [dialog],
  );

  // ── Render picker overlay ──
  if (view === "picker") {
    return (
      <TemplatePicker
        onClose={() => setView("list")}
        onSelect={handleTemplateSelect}
      />
    );
  }

  // ── Render project list ──
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            Landing Page 管理
          </h1>
          <p className="text-sm text-luxe-muted">
            共 {total} 個專案
          </p>
        </div>
        <PillButton
          theme="luxe"
          variant="filled"
          onClick={() => setView("picker")}
        >
          ＋ 新增 Landing Page
        </PillButton>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Input
          placeholder="搜尋專案..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme="luxe"
          className="w-56"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={SELECT_CLS}
          style={SELECT_BG}
        >
          <option value="all">全部狀態</option>
          {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-luxe-muted text-sm">
          載入中...
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-3">{error}</p>
          <PillButton theme="luxe" variant="outline" onClick={fetchProjects}>
            重試
          </PillButton>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-luxe-muted">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-base mb-5">
            {projects.length === 0 ? "尚無 Landing Page 專案" : "找不到符合條件的專案"}
          </p>
          <PillButton
            theme="luxe"
            variant="outline"
            onClick={() => setView("picker")}
          >
            立即建立
          </PillButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((project) => {
            const tmpl = project.lp_templates;
            return (
              <div
                key={project.id}
                className="group bg-luxe-surface rounded-lg border border-luxe-gold/10 hover:border-luxe-gold/30 overflow-hidden transition-all hover:shadow-lg hover:shadow-luxe-gold/5"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-luxe-bg flex items-center justify-center relative">
                  {tmpl?.thumbnail_url ? (
                    <img
                      src={tmpl.thumbnail_url}
                      alt={project.project_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-luxe-muted/30">
                      <span className="text-4xl">🚀</span>
                      <span className="text-[10px]">Landing Page</span>
                    </div>
                  )}
                  <span className="absolute top-1.5 left-1.5">
                    <StatusBadge status={project.status} />
                  </span>
                  {tmpl?.template_slug && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] text-luxe-muted/60 bg-luxe-bg/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {tmpl.template_slug}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-luxe-text truncate mb-0.5">
                    {project.project_name}
                  </h3>
                  <p className="text-[10px] text-luxe-muted truncate mb-2">
                    {project.custom_slug ? `/${project.custom_slug}` : project.project_code}
                  </p>
                  <p className="text-[10px] text-luxe-muted/60 mb-2">
                    更新 {new Date(project.updated_at).toLocaleDateString("zh-TW")}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-luxe-gold/5">
                    <button
                      onClick={() => navigate(`/admin/landing-pages/${project.id}/edit`)}
                      className="text-luxe-gold hover:underline text-xs flex-1"
                    >
                      編輯
                    </button>
                    {project.status === "published" && project.custom_slug && (
                      <Link
                        to={`/page/${project.custom_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs"
                      >
                        預覽
                      </Link>
                    )}
                    <button
                      onClick={() => handleToggleStatus(project)}
                      className="text-emerald-400 hover:underline text-xs"
                    >
                      {project.status === "published" ? "下架" : "發布"}
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="text-red-400 hover:underline text-xs"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LandingPageManager;
