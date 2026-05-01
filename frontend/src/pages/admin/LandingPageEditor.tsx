/**
 * LandingPageEditor — Landing Page 欄位編輯器
 *
 * 真實 API 版本：載入專案 + 解析後欄位，逐欄編輯後批次儲存。
 * 支援文字 / Cloudinary 圖片 / URL / Textarea / Select 等欄位類型。
 *
 * @module pages/admin/LandingPageEditor
 * @theme luxe (LUXE 高端主題)
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { landingService } from "../../services/site/landing.service";
import type {
  LpProjectDetail,
  LpResolvedField,
  LpVariant,
} from "../../services/site/landing.service";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface FieldEdit {
  field_id: number;
  field_key: string;
  field_label: string;
  field_kind: string;
  data_type: string;
  content_group: string;
  is_required: boolean;
  /** value_text for plain text / url; cloudinary_url for image */
  text: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  /** original value (to detect changes) */
  originalText: string;
  originalCloudinaryUrl: string;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const logger = {
  info: (msg: string, d?: unknown) => console.log(`[LPEditor] ${msg}`, d ?? ""),
  error: (msg: string, e?: unknown) => console.error(`[LPEditor] ${msg}`, e ?? ""),
};

/** 分組 label */
const GROUP_LABELS: Record<string, string> = {
  hero: "Hero 主視覺",
  about: "關於我們",
  intro: "介紹",
  features: "核心特色",
  benefits: "方案優勢",
  services: "服務項目",
  process: "服務流程",
  testimonials: "學員見證",
  reviews: "好評回饋",
  pricing: "費用方案",
  plans: "課程方案",
  faq: "常見問題",
  team: "教練團隊",
  gallery: "成果展示",
  cta: "行動呼籲",
  contact: "聯絡資訊",
  footer: "頁尾",
  meta: "SEO / Meta",
  seo: "SEO 設定",
  social: "社群連結",
  general: "其他",
};

function getGroupLabel(group: string): string {
  const k = group.toLowerCase();
  for (const [key, label] of Object.entries(GROUP_LABELS)) {
    if (k.includes(key)) return label;
  }
  return group;
}

function resolvedToEdit(f: LpResolvedField): FieldEdit {
  const text = f.resolved_text ?? "";
  const cloudinaryUrl = f.cloudinary_url ?? "";
  return {
    field_id: f.field_id,
    field_key: f.field_key,
    field_label: f.field_label,
    field_kind: f.field_kind,
    data_type: f.data_type,
    content_group: f.content_group || "general",
    is_required: f.is_required,
    text,
    cloudinaryUrl,
    cloudinaryPublicId: f.cloudinary_public_id ?? "",
    originalText: text,
    originalCloudinaryUrl: cloudinaryUrl,
  };
}

function isImageField(fe: FieldEdit): boolean {
  return fe.field_kind === "image" || fe.data_type === "image";
}

function isChanged(fe: FieldEdit): boolean {
  return (
    fe.text !== fe.originalText ||
    fe.cloudinaryUrl !== fe.originalCloudinaryUrl
  );
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

/** 單一欄位的輸入元件 */
const FieldInput: React.FC<{
  field: FieldEdit;
  onChange: (fe: FieldEdit) => void;
  onUploadImage?: (file: File) => Promise<string>;
}> = ({ field, onChange, onUploadImage }) => {
  const changed = isChanged(field);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const set = (patch: Partial<FieldEdit>) =>
    onChange({ ...field, ...patch });

  const handleFileSelect = async (file: File) => {
    if (!onUploadImage) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      set({ cloudinaryUrl: url });
    } catch (err) {
      alert(`上傳失敗：${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  if (isImageField(field)) {
    return (
      <div className="space-y-3">
        {/* Current image preview */}
        {field.cloudinaryUrl && (
          <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden border border-luxe-gold/10 group">
            <img
              src={field.cloudinaryUrl}
              alt={field.field_label}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => set({ cloudinaryUrl: "", cloudinaryPublicId: "" })}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white/70 hover:text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload zone */}
        {onUploadImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full max-w-xs flex flex-col items-center gap-2 py-4 border-2 border-dashed rounded-lg text-xs text-luxe-muted hover:text-luxe-text hover:border-luxe-gold/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              style={{ borderColor: "rgba(197,160,89,0.2)" }}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-luxe-gold rounded-full animate-spin" />
                  上傳中…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  點擊上傳圖片
                  <span className="text-[10px] text-luxe-muted/50">JPG / PNG / WebP，最大 5MB</span>
                </>
              )}
            </button>
          </>
        )}

        {/* Manual URL input */}
        <div className="space-y-1">
          <p className="text-[10px] text-luxe-muted/40">或直接貼上圖片 URL</p>
          <input
            type="url"
            value={field.cloudinaryUrl}
            onChange={(e) => set({ cloudinaryUrl: e.target.value })}
            placeholder="https://..."
            className={`w-full bg-luxe-bg border rounded-lg px-3 py-2 text-sm text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 transition-colors ${
              changed ? "border-luxe-gold/50" : "border-luxe-gold/10 focus:border-luxe-gold/30"
            }`}
          />
        </div>
      </div>
    );
  }

  if (field.field_kind === "textarea" || field.data_type === "text_long") {
    return (
      <textarea
        value={field.text}
        onChange={(e) => set({ text: e.target.value })}
        placeholder={`請輸入 ${field.field_label}…`}
        rows={4}
        className={`w-full bg-luxe-bg border rounded-lg px-3 py-2 text-sm text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 resize-y min-h-20 transition-colors ${
          changed
            ? "border-luxe-gold/50"
            : "border-luxe-gold/10 focus:border-luxe-gold/30"
        }`}
      />
    );
  }

  if (field.field_kind === "url" || field.data_type === "url") {
    return (
      <input
        type="url"
        value={field.text}
        onChange={(e) => set({ text: e.target.value })}
        placeholder="https://..."
        className={`w-full bg-luxe-bg border rounded-lg px-3 py-2 text-sm text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 transition-colors ${
          changed
            ? "border-luxe-gold/50"
            : "border-luxe-gold/10 focus:border-luxe-gold/30"
        }`}
      />
    );
  }

  if (field.field_kind === "number" || field.data_type === "number") {
    return (
      <input
        type="number"
        value={field.text}
        onChange={(e) => set({ text: e.target.value })}
        placeholder="0"
        className={`w-full bg-luxe-bg border rounded-lg px-3 py-2 text-sm text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 transition-colors ${
          changed
            ? "border-luxe-gold/50"
            : "border-luxe-gold/10 focus:border-luxe-gold/30"
        }`}
      />
    );
  }

  // Default: text
  return (
    <input
      type="text"
      value={field.text}
      onChange={(e) => set({ text: e.target.value })}
      placeholder={`請輸入 ${field.field_label}…`}
      className={`w-full bg-luxe-bg border rounded-lg px-3 py-2 text-sm text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 transition-colors ${
        changed
          ? "border-luxe-gold/50"
          : "border-luxe-gold/10 focus:border-luxe-gold/30"
      }`}
    />
  );
};

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

const LandingPageEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : NaN;

  // ── State ──
  const [project, setProject] = useState<LpProjectDetail | null>(null);
  const [fieldEdits, setFieldEdits] = useState<FieldEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Project info editing
  const [projectName, setProjectName] = useState("");
  const [customSlug, setCustomSlug] = useState("");

  // Variant (樣式切換)
  const [variants, setVariants] = useState<LpVariant[]>([]);
  const [activeVariantId, setActiveVariantId] = useState<number | null>(null);
  const [savingVariant, setSavingVariant] = useState(false);

  // ── Load project ──
  useEffect(() => {
    if (isNaN(projectId)) {
      setError("無效的專案 ID");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { project: proj, resolvedFields } =
          await landingService.getProject(projectId);
        setProject(proj);
        setProjectName(proj.project_name);
        setCustomSlug(proj.custom_slug ?? "");

        const edits = resolvedFields
          .slice()
          .sort((a, b) => a.field_sort_order - b.field_sort_order)
          .map(resolvedToEdit);
        setFieldEdits(edits);

        // Default active group = first group
        if (edits.length > 0) {
          setActiveGroup(edits[0].content_group);
        }

        // 載入該模板的樣式方案
        if (proj.template_id) {
          try {
            const { variants: vs } = await landingService.getVariants(proj.template_id);
            setVariants(vs);
            // 設定目前 project 套用的 variant（需 lp_projects 包含 variant_id）
            const pWithVariant = proj as LpProjectDetail & { variant_id?: number | null };
            setActiveVariantId(pWithVariant.variant_id ?? null);
          } catch {
            // variant 載入失敗不阻擋主流程
          }
        }
      } catch (err) {
        logger.error("載入專案失敗", err);
        setError("無法載入專案資料，請重新整理");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId]);

  // ── Variant handler ──
  const handleVariantChange = useCallback(async (variantId: number | null) => {
    setActiveVariantId(variantId);
    setSavingVariant(true);
    try {
      await landingService.setVariant(projectId, variantId);
    } catch (err) {
      logger.error("樣式切換失敗", err);
      alert("樣式切換失敗");
    } finally {
      setSavingVariant(false);
    }
  }, [projectId]);

  // ── Image upload handler ──
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const { url } = await landingService.uploadImage(projectId, file);
    return url;
  }, [projectId]);

  // ── Derived ──
  const groups = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    fieldEdits.forEach((f) => {
      if (!seen.has(f.content_group)) {
        seen.add(f.content_group);
        list.push(f.content_group);
      }
    });
    return list;
  }, [fieldEdits]);

  const changedCount = useMemo(
    () => fieldEdits.filter(isChanged).length,
    [fieldEdits],
  );

  const activeFields = useMemo(
    () => fieldEdits.filter((f) => f.content_group === activeGroup),
    [fieldEdits, activeGroup],
  );

  // ── Handlers ──

  const updateField = useCallback((updated: FieldEdit) => {
    setFieldEdits((prev) =>
      prev.map((f) => (f.field_id === updated.field_id ? updated : f)),
    );
    setSaved(false);
  }, []);

  const handleSaveFields = useCallback(async () => {
    const changed = fieldEdits.filter(isChanged);
    if (changed.length === 0) return;

    setSaving(true);
    try {
      const values = changed.map((fe) => ({
        field_id: fe.field_id,
        value_text: fe.text || null,
        cloudinary_url: fe.cloudinaryUrl || null,
        cloudinary_public_id: fe.cloudinaryPublicId || null,
      }));
      await landingService.updateProjectFields(projectId, values as Parameters<typeof landingService.updateProjectFields>[1]);

      // Mark all as saved
      setFieldEdits((prev) =>
        prev.map((f) => ({
          ...f,
          originalText: f.text,
          originalCloudinaryUrl: f.cloudinaryUrl,
        })),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      logger.info("欄位儲存成功", { count: changed.length });
    } catch (err) {
      logger.error("儲存失敗", err);
      alert("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }, [fieldEdits, projectId]);

  const handleSaveInfo = useCallback(async () => {
    if (!project) return;
    setSavingInfo(true);
    try {
      const updated = await landingService.updateProject(projectId, {
        project_name: projectName.trim() || project.project_name,
        custom_slug: customSlug.trim().toLowerCase() || undefined,
      });
      setProject((prev) =>
        prev
          ? { ...prev, project_name: updated.project_name, custom_slug: updated.custom_slug, updated_at: updated.updated_at }
          : prev,
      );
      logger.info("專案資訊儲存成功");
    } catch (err) {
      logger.error("儲存專案資訊失敗", err);
      alert("儲存失敗，請稍後再試");
    } finally {
      setSavingInfo(false);
    }
  }, [project, projectId, projectName, customSlug]);

  const handleToggleStatus = useCallback(async () => {
    if (!project) return;
    const next = project.status === "published" ? "draft" : "published";
    try {
      const updated = await landingService.updateProject(projectId, {
        status: next,
      });
      setProject((prev) =>
        prev
          ? { ...prev, status: updated.status, updated_at: updated.updated_at, published_at: updated.published_at ?? prev.published_at }
          : prev,
      );
    } catch (err) {
      logger.error("狀態切換失敗", err);
      alert("操作失敗");
    }
  }, [project, projectId]);

  const handleBack = useCallback(() => {
    navigate("/admin/landing-pages");
  }, [navigate]);

  const handlePreview = useCallback(() => {
    if (project?.custom_slug) {
      window.open(`/page/${project.custom_slug}`, "_blank");
    }
  }, [project]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-luxe-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-7 h-7 border-2 border-t-transparent border-luxe-gold rounded-full animate-spin" />
          <p className="text-luxe-muted text-sm">載入中…</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-luxe-bg gap-4">
        <p className="text-red-400 text-sm">{error ?? "找不到此專案"}</p>
        <button
          onClick={handleBack}
          className="text-luxe-muted text-sm hover:text-luxe-text transition-colors"
        >
          ← 返回管理頁
        </button>
      </div>
    );
  }

  const statusColor =
    project.status === "published"
      ? "text-green-400"
      : project.status === "draft"
        ? "text-luxe-muted"
        : "text-yellow-400";

  const statusLabel: Record<string, string> = {
    draft: "草稿",
    review: "審核中",
    published: "已發布",
    archived: "已封存",
  };

  return (
    <div className="h-screen flex flex-col bg-luxe-bg overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-5 py-3 bg-luxe-surface border-b border-luxe-gold/10 shrink-0 z-30">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-luxe-muted hover:text-luxe-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <div className="w-px h-4 bg-luxe-gold/10" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-luxe-text leading-tight">
              {project.project_name}
            </span>
            <span className={`text-[10px] ${statusColor}`}>
              {statusLabel[project.status] ?? project.status}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {project.status === "published" && project.custom_slug && (
            <button
              onClick={handlePreview}
              className="px-3 py-1.5 text-xs text-luxe-muted hover:text-luxe-text border border-luxe-gold/20 rounded-lg transition-colors"
            >
              預覽
            </button>
          )}
          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              project.status === "published"
                ? "text-red-400 border-red-400/20 hover:bg-red-400/5"
                : "text-green-400 border-green-400/20 hover:bg-green-400/5"
            }`}
          >
            {project.status === "published" ? "下架" : "發布"}
          </button>
          <button
            onClick={handleSaveFields}
            disabled={saving || changedCount === 0}
            className={`px-4 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 transition-all ${
              saved
                ? "bg-green-500/10 text-green-400 border-green-400/30"
                : changedCount > 0
                  ? "bg-luxe-gold/15 text-luxe-gold border-luxe-gold/30 hover:bg-luxe-gold/25"
                  : "text-luxe-muted border-luxe-gold/10 opacity-50 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-t-transparent border-luxe-gold rounded-full animate-spin" />
                儲存中…
              </>
            ) : saved ? (
              "已儲存"
            ) : changedCount > 0 ? (
              `儲存 (${changedCount})`
            ) : (
              "無變更"
            )}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar: Group nav ── */}
        <aside className="w-48 shrink-0 border-r border-luxe-gold/10 bg-luxe-surface overflow-y-auto py-3">
          {/* Variant picker */}
          {variants.length > 0 && (
            <div className="px-3 mb-4">
              <p className="text-[10px] text-luxe-muted/50 uppercase tracking-widest mb-2 px-2">
                樣式 {savingVariant && <span className="text-luxe-gold animate-pulse">•</span>}
              </p>
              <div className="flex flex-wrap gap-1.5 px-2">
                {variants.map((v) => {
                  const isActive = activeVariantId === v.id || (!activeVariantId && v.is_default);
                  const primary = (v.color_vars as Record<string, string>).primary ?? "#c5a059";
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariantChange(v.id)}
                      title={v.label}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] transition-all ${
                        isActive
                          ? "bg-luxe-gold/15 text-luxe-gold border border-luxe-gold/40"
                          : "text-luxe-muted hover:text-luxe-text border border-transparent hover:border-luxe-gold/20"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: primary }} />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Project info section */}
          <div className="px-3 mb-4">
            <p className="text-[10px] text-luxe-muted/50 uppercase tracking-widest mb-2 px-2">
              專案資訊
            </p>
            <button
              onClick={() => setActiveGroup("__info__")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                activeGroup === "__info__"
                  ? "bg-luxe-gold/10 text-luxe-gold"
                  : "text-luxe-muted hover:text-luxe-text hover:bg-white/3"
              }`}
            >
              基本設定
            </button>
          </div>

          {/* Field groups */}
          <div className="px-3">
            <p className="text-[10px] text-luxe-muted/50 uppercase tracking-widest mb-2 px-2">
              頁面內容
            </p>
            {groups.map((g) => {
              const hasChanges = fieldEdits
                .filter((f) => f.content_group === g)
                .some(isChanged);
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-1 ${
                    activeGroup === g
                      ? "bg-luxe-gold/10 text-luxe-gold"
                      : "text-luxe-muted hover:text-luxe-text hover:bg-white/3"
                  }`}
                >
                  <span className="truncate">{getGroupLabel(g)}</span>
                  {hasChanges && (
                    <span className="w-1.5 h-1.5 rounded-full bg-luxe-gold shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main editing area ── */}
        <main className="flex-1 overflow-y-auto">
          {/* ── Info panel ── */}
          {activeGroup === "__info__" && (
            <div className="max-w-xl mx-auto py-8 px-6 space-y-6">
              <h2 className="text-lg font-semibold text-luxe-text">
                專案基本設定
              </h2>

              <div className="space-y-4 bg-luxe-surface rounded-xl p-5 border border-luxe-gold/10">
                <div>
                  <label className="block text-xs text-luxe-muted mb-1.5">
                    專案名稱
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-luxe-bg border border-luxe-gold/10 rounded-lg px-3 py-2 text-sm text-luxe-text focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 focus:border-luxe-gold/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-luxe-muted mb-1.5">
                    自訂網址 Slug
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-luxe-muted/60">/page/</span>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) =>
                        setCustomSlug(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
                        )
                      }
                      placeholder="my-page-slug"
                      className="flex-1 bg-luxe-bg border border-luxe-gold/10 rounded-lg px-3 py-2 text-sm text-luxe-text focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 focus:border-luxe-gold/30 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-luxe-muted">
                  <div>
                    <span className="text-luxe-muted/50">專案代碼</span>
                    <p className="text-luxe-text mt-0.5 font-mono text-[11px]">
                      {project.project_code}
                    </p>
                  </div>
                  <div>
                    <span className="text-luxe-muted/50">模板</span>
                    <p className="text-luxe-text mt-0.5 text-[11px]">
                      {project.lp_templates?.template_code ?? "—"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSaveInfo}
                  disabled={savingInfo}
                  className="w-full py-2 text-xs font-medium bg-luxe-gold/10 text-luxe-gold border border-luxe-gold/20 rounded-lg hover:bg-luxe-gold/20 transition-colors disabled:opacity-50"
                >
                  {savingInfo ? "儲存中…" : "儲存基本資訊"}
                </button>
              </div>
            </div>
          )}

          {/* ── Fields panel ── */}
          {activeGroup !== "__info__" && activeGroup !== null && (
            <div className="max-w-2xl mx-auto py-8 px-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-luxe-text">
                  {getGroupLabel(activeGroup)}
                </h2>
                {activeFields.some(isChanged) && (
                  <span className="text-[10px] text-luxe-gold border border-luxe-gold/20 px-2 py-0.5 rounded-full">
                    未儲存變更
                  </span>
                )}
              </div>

              {activeFields.length === 0 ? (
                <p className="text-luxe-muted text-sm">此分組沒有欄位。</p>
              ) : (
                <div className="space-y-4">
                  {activeFields.map((fe) => (
                    <div
                      key={fe.field_id}
                      className={`rounded-xl p-4 border transition-colors ${
                        isChanged(fe)
                          ? "border-luxe-gold/30 bg-luxe-gold/3"
                          : "border-luxe-gold/8 bg-luxe-surface"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-luxe-text">
                            {fe.field_label}
                            {fe.is_required && (
                              <span className="text-red-400 ml-1">*</span>
                            )}
                          </label>
                          <p className="text-[10px] text-luxe-muted/40 mt-0.5 font-mono">
                            {fe.field_key}
                          </p>
                        </div>
                        <span className="text-[9px] text-luxe-muted/30 bg-white/3 border border-white/5 px-1.5 py-0.5 rounded shrink-0">
                          {fe.field_kind}
                        </span>
                      </div>
                      <FieldInput
                          field={fe}
                          onChange={updateField}
                          onUploadImage={isImageField(fe) ? handleImageUpload : undefined}
                        />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Initial state — no group selected */}
          {activeGroup === null && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-luxe-muted text-sm">
                從左側選擇一個分組開始編輯
              </p>
            </div>
          )}
        </main>

        {/* ── Right: Mini live preview panel (template thumbnail) ── */}
        {project.lp_templates?.thumbnail_url && (
          <aside className="w-64 shrink-0 border-l border-luxe-gold/10 bg-luxe-surface hidden xl:flex flex-col p-4 gap-3 overflow-y-auto">
            <p className="text-[10px] text-luxe-muted/50 uppercase tracking-widest">
              模板預覽
            </p>
            <div className="aspect-video rounded-lg overflow-hidden border border-luxe-gold/10">
              <img
                src={project.lp_templates.thumbnail_url}
                alt="模板縮圖"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[10px] text-luxe-muted text-center">
              {project.lp_templates.template_code}
            </p>

            {project.custom_slug && project.status === "published" && (
              <a
                href={`/page/${project.custom_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-[11px] text-luxe-gold hover:underline"
              >
                查看已發布頁面 →
              </a>
            )}

            {/* Changed fields summary */}
            {changedCount > 0 && (
              <div className="mt-auto pt-3 border-t border-luxe-gold/10">
                <p className="text-[11px] text-luxe-muted text-center">
                  <span className="text-luxe-gold font-semibold">{changedCount}</span> 個欄位有未儲存的變更
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default LandingPageEditor;
