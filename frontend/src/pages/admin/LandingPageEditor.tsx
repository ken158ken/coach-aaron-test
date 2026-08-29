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
import { useScrollLock } from "@/hooks/useScrollLock";
import { ImageInput } from "@/components/ui";
// 獨立全頁路由（不在 AdminLayout 之下），所以「?」導覽鈕要自己掛一顆
import { HelpTourButton } from "@/tours";
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
  blocks: "圖文交錯區塊",
  scenes: "大圖段落",
  cards: "圖文卡片",
  stats: "數字統計",
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
  /** 圖片欄位一定會拿到；非圖片欄位不會用到 */
  onUploadImage: (file: File) => Promise<string>;
}> = ({ field, onChange, onUploadImage }) => {
  const changed = isChanged(field);

  const set = (patch: Partial<FieldEdit>) =>
    onChange({ ...field, ...patch });

  if (isImageField(field)) {
    return (
      <div className="max-w-xs">
        <ImageInput
          value={field.cloudinaryUrl}
          onChange={(url) =>
            set({
              cloudinaryUrl: url,
              // 換圖 / 移除都讓 public_id 失效，避免殘留舊資產的引用
              // （url 變了就不能沿用舊 public_id —— 那是舊圖的識別碼）
              cloudinaryPublicId:
                url && url === field.cloudinaryUrl
                  ? field.cloudinaryPublicId
                  : "",
            })
          }
          // LP 圖片放在 lp-images/{projectId}/，沿用既有的 landing 上傳 API
          uploadFn={onUploadImage}
          // 刻意不在「✕」當下就刪 storage 檔：使用者可能還沒按儲存（或儲存失敗），
          // 立即刪檔會讓線上頁面先破圖。未被引用的舊檔由每日孤兒掃描回收。
          aspectHint="16 / 9"
        />
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
        className={`w-full bg-luxe-bg border rounded-lg px-3 py-2.5 text-base text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 resize-y min-h-20 transition-colors ${
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
        className={`w-full bg-luxe-bg border rounded-lg px-3 py-2.5 text-base text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 transition-colors ${
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
        className={`w-full bg-luxe-bg border rounded-lg px-3 py-2.5 text-base text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 transition-colors ${
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
      className={`w-full bg-luxe-bg border rounded-lg px-3 py-2.5 text-base text-luxe-text placeholder:text-luxe-muted/40 focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 transition-colors ${
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

  // 全螢幕編輯器：鎖住背景 Lenis 頁面捲動，改由內部各 pane 原生捲動
  useScrollLock(true);

  // ── State ──
  const [project, setProject] = useState<LpProjectDetail | null>(null);
  const [fieldEdits, setFieldEdits] = useState<FieldEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // 區塊顯示/隱藏（存於 settings_json.hidden_sections）
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [savingSection, setSavingSection] = useState<string | null>(null);

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

        // 載入區塊隱藏設定
        const hs = (proj.settings_json as Record<string, unknown> | undefined)?.hidden_sections;
        setHiddenSections(Array.isArray(hs) ? hs.map(String) : []);

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

  // ── Section visibility handler ──
  const handleToggleSection = useCallback(async (group: string) => {
    const next = hiddenSections.includes(group)
      ? hiddenSections.filter((g) => g !== group)
      : [...hiddenSections, group];
    const prevHidden = hiddenSections;
    setHiddenSections(next);
    setSavingSection(group);
    try {
      const nextSettings = {
        ...(project?.settings_json ?? {}),
        hidden_sections: next,
      };
      const updated = await landingService.updateProject(projectId, {
        settings_json: nextSettings,
      });
      setProject((prev) =>
        prev ? { ...prev, settings_json: updated.settings_json ?? nextSettings } : prev,
      );
    } catch (err) {
      logger.error("區塊顯示切換失敗", err);
      alert("區塊顯示切換失敗，請稍後再試");
      setHiddenSections(prevHidden); // rollback
    } finally {
      setSavingSection(null);
    }
  }, [hiddenSections, project, projectId]);

  // ── Image upload handler ──
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const { url } = await landingService.uploadImage(projectId, file);
    return url;
  }, [projectId]);

  /*
   * 「✕」移除圖片刻意不立即刪 storage 檔：欄位變更要等「儲存」才寫進 DB，
   * 先刪檔會讓已發布頁面在儲存前（或儲存失敗時）就破圖。
   * 未被任何欄位引用的舊檔由每日孤兒掃描 cron 回收。
   */

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
    <div className="fixed inset-0 z-50 flex flex-col bg-luxe-bg overflow-hidden">
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
          <div className="flex flex-col" data-tour="lped-title">
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
            data-tour="lped-publish"
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
            data-tour="lped-save"
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
            <div className="px-3 mb-4" data-tour="lped-variants">
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
              data-tour="lped-info-nav"
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeGroup === "__info__"
                  ? "bg-luxe-gold/10 text-luxe-gold"
                  : "text-luxe-muted hover:text-luxe-text hover:bg-white/3"
              }`}
            >
              基本設定
            </button>
          </div>

          {/* Field groups */}
          <div className="px-3" data-tour="lped-groups">
            <p className="text-[10px] text-luxe-muted/50 uppercase tracking-widest mb-1 px-2">
              頁面內容
            </p>
            <p className="text-[9px] text-luxe-muted/30 mb-2 px-2 leading-snug">
              點眼睛圖示可隱藏該區塊（不會在公開頁顯示）
            </p>
            {groups.map((g) => {
              const hasChanges = fieldEdits
                .filter((f) => f.content_group === g)
                .some(isChanged);
              const isHidden = hiddenSections.includes(g);
              const isToggling = savingSection === g;
              return (
                <div
                  key={g}
                  className={`group/nav flex items-center rounded-lg transition-colors ${
                    activeGroup === g ? "bg-luxe-gold/10" : "hover:bg-white/3"
                  }`}
                >
                  <button
                    onClick={() => setActiveGroup(g)}
                    className={`flex-1 min-w-0 text-left pl-3 pr-1 py-2.5 rounded-l-lg text-sm flex items-center gap-1.5 transition-colors ${
                      activeGroup === g
                        ? "text-luxe-gold"
                        : "text-luxe-muted group-hover/nav:text-luxe-text"
                    }`}
                  >
                    <span className={`truncate ${isHidden ? "line-through opacity-40" : ""}`}>
                      {getGroupLabel(g)}
                    </span>
                    {hasChanges && (
                      <span className="w-1.5 h-1.5 rounded-full bg-luxe-gold shrink-0" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleSection(g)}
                    disabled={isToggling}
                    data-tour="lped-section-toggle"
                    title={isHidden ? "目前隱藏，點擊顯示此區塊" : "目前顯示，點擊隱藏此區塊"}
                    aria-label={isHidden ? "顯示此區塊" : "隱藏此區塊"}
                    className={`shrink-0 px-2 py-2 rounded-r-lg transition-colors ${
                      isToggling ? "animate-pulse" : ""
                    } ${
                      isHidden
                        ? "text-luxe-muted/30 hover:text-luxe-text"
                        : "text-luxe-gold/60 hover:text-luxe-gold"
                    }`}
                  >
                    {isHidden ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.52 10.52 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l11.544 11.544M21 21l-2.228-2.228" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Main editing area ── */}
        <main className="flex-1 overflow-y-auto" data-tour="lped-fields">
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
                    className="w-full bg-luxe-bg border border-luxe-gold/10 rounded-lg px-3 py-2.5 text-base text-luxe-text focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 focus:border-luxe-gold/30 transition-colors"
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
                      className="flex-1 bg-luxe-bg border border-luxe-gold/10 rounded-lg px-3 py-2.5 text-base text-luxe-text focus:outline-none focus:ring-1 focus:ring-luxe-gold/40 focus:border-luxe-gold/30 transition-colors"
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
                          <label className="text-sm font-medium text-luxe-text">
                            {fe.field_label}
                            {fe.is_required && (
                              <span className="text-red-400 ml-1">*</span>
                            )}
                          </label>
                          <p className="text-[11px] text-luxe-muted/40 mt-0.5 font-mono">
                            {fe.field_key}
                          </p>
                        </div>
                        <span className="text-[10px] text-luxe-muted/30 bg-white/3 border border-white/5 px-1.5 py-0.5 rounded shrink-0">
                          {fe.field_kind}
                        </span>
                      </div>
                      <FieldInput
                          field={fe}
                          onChange={updateField}
                          onUploadImage={handleImageUpload}
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

      {/* 浮動「?」頁面導覽（此路由不在 AdminLayout 下，需自行掛載） */}
      <HelpTourButton />
    </div>
  );
};

export default LandingPageEditor;
