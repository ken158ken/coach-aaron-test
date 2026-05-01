/**
 * Landing Page 服務層
 * @module services/landing.service
 */

import { get, post, put, del } from "../api";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type PageKind =
  | "brand_narrative"
  | "product_shop"
  | "pricing"
  | "lead_gen"
  | "saas"
  | "portfolio";

export type ProjectStatus = "draft" | "review" | "published" | "archived";

export interface LpTemplate {
  id: number;
  template_code: string;
  template_slug: string;
  page_kind: PageKind;
  category_tags: string[];
  page_layout: string;
  animation_type: string;
  brand_name: string | null;
  html_title: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  jsx_component_key: string | null;
  color_vars: Record<string, string>;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface LpTemplateDetail extends LpTemplate {
  meta_description: string | null;
  jsx_prop_schema: Record<string, unknown>;
  analysis_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LpSection {
  id: number;
  template_id: number;
  section_key: string;
  section_name: string;
  section_type: string;
  dom_selector: string | null;
  layout_cols: number;
  layout_variant: string | null;
  thumbnail_url: string | null;
  text_preview: string | null;
  is_visible_by_default: boolean;
  sort_order: number;
}

export interface LpField {
  id: number;
  template_id: number;
  section_id: number | null;
  field_key: string;
  field_label: string;
  field_kind: string;
  data_type: string;
  content_group: string;
  field_category: string | null;
  default_value: string | null;
  placeholder_text: string | null;
  help_text: string | null;
  validation_rules: Record<string, unknown>;
  source_path: string | null;
  jsx_prop_path: string | null;
  sort_order: number;
  is_required: boolean;
  is_repeatable: boolean;
  is_visible: boolean;
}

export interface LpProject {
  id: number;
  template_id: number;
  project_code: string;
  project_name: string;
  customer_name: string | null;
  course_id: number | null;
  locale: string;
  status: ProjectStatus;
  custom_slug: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  lp_templates?: {
    template_code: string;
    template_slug: string;
    thumbnail_url: string | null;
  };
}

export interface LpProjectDetail extends LpProject {
  hero_image_url: string | null;
  logo_url: string | null;
  og_image_url: string | null;
  favicon_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  og_title: string | null;
  og_description: string | null;
  settings_json: Record<string, unknown>;
  lp_templates?: LpTemplateDetail;
}

/** 公開頁面專案（by slug 取得，含部分 template 欄位） */
export interface LpPublicProject {
  id: number;
  project_code: string;
  project_name: string;
  customer_name: string | null;
  locale: string;
  status: "published";
  custom_slug: string;
  hero_image_url: string | null;
  logo_url: string | null;
  og_image_url: string | null;
  favicon_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  og_title: string | null;
  og_description: string | null;
  settings_json: Record<string, unknown>;
  published_at: string | null;
  lp_templates: {
    template_code: string;
    jsx_component_key: string | null;
    color_vars: Record<string, string>;
    animation_type: string;
  } | null;
}

export interface LpResolvedField {
  project_id: number;
  project_code: string;
  template_id: number;
  template_code: string;
  jsx_component_key: string | null;
  section_key: string | null;
  section_type: string | null;
  field_id: number;
  field_key: string;
  field_label: string;
  field_kind: string;
  data_type: string;
  content_group: string;
  field_category: string | null;
  jsx_prop_path: string | null;
  is_required: boolean;
  is_repeatable: boolean;
  resolved_text: string | null;
  resolved_json: Record<string, unknown>;
  cloudinary_url: string | null;
  cloudinary_public_id: string | null;
  value_sort_order: number;
  field_sort_order: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Landing Page 樣式方案 */
export interface LpVariant {
  id: number;
  variant_key: string;
  label: string;
  label_en: string | null;
  color_vars: Record<string, string>;
  preview_thumbnail: string | null;
  is_default: boolean;
  sort_order: number;
}

// ─────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────

export const landingService = {
  // ── Templates ──────────────────────────────────────────

  /** 取模板列表（公開，無需登入） */
  getTemplates: (params?: {
    page_kind?: string;
    tag?: string;
    animation?: string;
    featured?: "1";
    page?: number;
    limit?: number;
  }) =>
    get<PaginatedResponse<LpTemplate>>("/api/landing/templates", { params }),

  /** 取單一模板詳情 + sections + fields */
  getTemplate: (id: number, includeOptions = false) =>
    get<{
      template: LpTemplateDetail;
      sections: LpSection[];
      fields: LpField[];
      options: unknown[];
    }>(`/api/landing/templates/${id}`, {
      params: includeOptions ? { include_options: "1" } : {},
    }),

  // ── Projects ───────────────────────────────────────────

  /** 取已發布頁面清單（公開，無需登入） */
  getPublishedProjects: () =>
    get<{
      data: Array<{
        id: number;
        project_name: string;
        custom_slug: string;
        seo_title: string | null;
        seo_description: string | null;
        published_at: string | null;
        updated_at: string;
      }>;
      total: number;
    }>("/api/landing/projects/published"),

  /** 取已發布公開頁面（by custom_slug，無需登入） */
  getProjectBySlug: (slug: string) =>
    get<{ project: LpPublicProject; resolvedFields: LpResolvedField[] }>(
      `/api/landing/projects/slug/${encodeURIComponent(slug)}`,
    ),

  /** 取所有專案列表（需管理員） */
  getProjects: (params?: { status?: string; page?: number; limit?: number }) =>
    get<PaginatedResponse<LpProject>>("/api/landing/projects", { params }),

  /** 取單一專案詳情含解析後欄位值（需管理員） */
  getProject: (id: number) =>
    get<{ project: LpProjectDetail; resolvedFields: LpResolvedField[] }>(
      `/api/landing/projects/${id}`,
    ),

  /** 建立新專案（需管理員） */
  createProject: (data: {
    template_id: number;
    project_name: string;
    customer_name?: string;
    locale?: string;
    custom_slug?: string;
  }) => post<LpProjectDetail>("/api/landing/projects", data),

  /** 更新專案基本資料（需管理員） */
  updateProject: (id: number, data: Partial<LpProjectDetail>) =>
    put<LpProjectDetail>(`/api/landing/projects/${id}`, data),

  /** 批次更新欄位覆寫值（需管理員） */
  updateProjectFields: (
    id: number,
    values: Array<{
      field_id: number;
      value_text?: string;
      value_json?: Record<string, unknown>;
      cloudinary_url?: string;
      cloudinary_public_id?: string;
      sort_order?: number;
    }>,
  ) =>
    put<{ updated: number; data: unknown[] }>(
      `/api/landing/projects/${id}/fields`,
      { values },
    ),

  /** 刪除專案（需管理員） */
  deleteProject: (id: number) =>
    del<{ success: boolean }>(`/api/landing/projects/${id}`),

  /** 更新專案狀態並發布 */
  publishProject: (id: number) =>
    put<LpProjectDetail>(`/api/landing/projects/${id}`, {
      status: "published",
    }),

  /** 下架專案 */
  unpublishProject: (id: number) =>
    put<LpProjectDetail>(`/api/landing/projects/${id}`, { status: "draft" }),

  /** 取得模板的所有樣式方案 */
  getVariants: (templateId: number) =>
    get<{ variants: LpVariant[] }>(`/api/landing/templates/${templateId}/variants`),

  /** 套用樣式方案 */
  setVariant: (projectId: number, variantId: number | null) =>
    put<LpProjectDetail>(`/api/landing/projects/${projectId}`, { variant_id: variantId }),

  /** 上傳圖片（multipart/form-data，field: image） */
  uploadImage: async (projectId: number, file: File): Promise<{ url: string; path: string }> => {
    const { getAuthToken } = await import("../api");
    const token = getAuthToken();
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`/api/landing/projects/${projectId}/images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "上傳失敗");
    }
    return res.json();
  },

  /** 刪除已上傳的圖片 */
  deleteImage: (projectId: number, path: string) =>
    del<{ success: boolean }>(`/api/landing/projects/${projectId}/images`, { data: { path } }),
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

export const PAGE_KIND_LABELS: Record<string, string> = {
  brand_narrative: "品牌敘事",
  product_shop:    "產品銷售",
  pricing:         "方案介紹",
  lead_gen:        "詢價蒐集",
  saas:            "SaaS",
  portfolio:       "作品集",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft:     "草稿",
  review:    "審核中",
  published: "已發布",
  archived:  "已封存",
};
