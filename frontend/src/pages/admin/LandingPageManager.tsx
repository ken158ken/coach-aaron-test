/**
 * LandingPageManager — Landing Page 專案列表管理
 *
 * 顯示所有 LP 專案（接 /api/landing/projects）。
 * 新增專案由獨立路由 /admin/landing-pages/new 處理（LandingPageNew）。
 *
 * @module pages/admin/LandingPageManager
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { PillButton, Input, useDialog } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { landingService } from "@/services/site/landing.service";
import type {
  LpProject,
  ProjectStatus,
} from "@/services/site/landing.service";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

/** 狀態顯示順序（文案改由 `adminLandingPagesPage.status` 查表） */
const STATUS_ORDER: ProjectStatus[] = ["draft", "review", "published", "archived"];

const STATUS_BADGE: Record<ProjectStatus, { bg: string; text: string }> = {
  draft:     { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  review:    { bg: "bg-blue-500/20",   text: "text-blue-400"   },
  published: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  archived:  { bg: "bg-gray-500/20",   text: "text-gray-400"   },
};

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
// Sub-components
// ─────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const { t } = useLanguage();
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${s.bg} ${s.text}`}>
      {t.adminLandingPagesPage.status[status] ?? status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

const LandingPageManager: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useDialog();
  const { t, isZhTW } = useLanguage();
  const lp = t.adminLandingPagesPage;

  const [projects, setProjects] = useState<LpProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ── Fetch projects ──
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
      setError(t.adminLandingPagesPage.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Client-side search filter
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

  // ── Toggle publish status ──
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
        dialog.alert({
          title: lp.statusUpdateFailedTitle,
          message: lp.statusUpdateFailedMessage,
        });
      }
    },
    [dialog, lp],
  );

  // ── Delete project ──
  const handleDelete = useCallback(
    async (project: LpProject) => {
      const confirmed = await dialog.confirm({
        title: lp.deleteConfirmTitle,
        message: lp.deleteConfirmMessage.replace("{name}", project.project_name),
        variant: "danger",
        confirmText: t.common.delete,
        cancelText: t.common.cancel,
      });
      if (!confirmed) return;
      try {
        await landingService.deleteProject(project.id);
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
        setTotal((t) => t - 1);
      } catch {
        dialog.alert({
          title: lp.deleteFailedTitle,
          message: lp.deleteFailedMessage,
        });
      }
    },
    [dialog, lp, t],
  );

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div data-tour="lp-header">
          <h1 className="text-xl sm:text-2xl font-light text-luxe-text">
            {lp.pageTitle}
          </h1>
          <p className="text-sm text-luxe-muted">
            {lp.projectCount.replace("{n}", String(total))}
          </p>
        </div>
        <PillButton
          theme="luxe"
          variant="filled"
          data-tour="lp-add"
          onClick={() => navigate("/admin/landing-pages/new")}
        >
          {lp.addBtn}
        </PillButton>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Input
          placeholder={lp.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme="luxe"
          className="w-56"
          data-tour="lp-search"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          data-tour="lp-status-filter"
          className={SELECT_CLS}
          style={SELECT_BG}
        >
          <option value="all">{lp.allStatuses}</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{lp.status[s]}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-luxe-muted text-sm">{t.common.loading}</div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-3">{error}</p>
          <PillButton theme="luxe" variant="outline" onClick={fetchProjects}>
            {t.adminCommon.retry}
          </PillButton>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-luxe-muted">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-base mb-5">
            {projects.length === 0 ? lp.emptyState : lp.noResults}
          </p>
          <PillButton
            theme="luxe"
            variant="outline"
            onClick={() => navigate("/admin/landing-pages/new")}
          >
            {lp.createFirstBtn}
          </PillButton>
        </div>
      ) : (
        <div
          data-tour="lp-grid"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
        >
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
                    {lp.updatedAt.replace(
                      "{date}",
                      new Date(project.updated_at).toLocaleDateString(
                        isZhTW ? "zh-TW" : "en-US",
                      ),
                    )}
                  </p>

                  {/* Actions */}
                  <div
                    data-tour="lp-card-actions"
                    className="flex flex-wrap gap-2 pt-2 border-t border-luxe-gold/5"
                  >
                    <button
                      onClick={() => navigate(`/admin/landing-pages/${project.id}/edit`)}
                      className="text-luxe-gold hover:underline text-xs flex-1"
                    >
                      {t.common.edit}
                    </button>
                    {project.status === "published" && project.custom_slug && (
                      <Link
                        to={`/page/${project.custom_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs"
                      >
                        {t.adminCommon.preview}
                      </Link>
                    )}
                    <button
                      onClick={() => handleToggleStatus(project)}
                      className="text-emerald-400 hover:underline text-xs"
                    >
                      {project.status === "published" ? lp.unpublishBtn : t.admin.publish}
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="text-red-400 hover:underline text-xs"
                    >
                      {t.common.delete}
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
