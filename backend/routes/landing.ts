/**
 * @fileoverview Landing Page 模板 & 專案路由
 *
 * 公開路由（無需登入）：
 *   GET /api/landing/templates          — 模板列表（page_kind / tags 篩選）
 *   GET /api/landing/templates/:id      — 單一模板 + sections + fields
 *   GET /api/landing/projects/slug/:slug — 已發布專案（by custom_slug）
 *
 * 管理員路由（需 requireAdmin）：
 *   GET    /api/landing/projects         — 所有專案列表
 *   POST   /api/landing/projects         — 建立新專案
 *   GET    /api/landing/projects/:id     — 單一專案（含解析後欄位值）
 *   PUT    /api/landing/projects/:id     — 更新專案基本資料
 *   PUT    /api/landing/projects/:id/fields — 批次更新欄位覆寫值
 *   DELETE /api/landing/projects/:id     — 刪除專案
 */

import express, { Request, Response, Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { sanitizeId } from "../utils/sanitizer.js";
import { logger } from "../utils/logger.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(null, ok);
  },
});

const router: Router = express.Router();

// ─────────────────────────────────────────────────────────────
// 輔助：統一錯誤回應
// ─────────────────────────────────────────────────────────────
function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ error: message });
}

// ─────────────────────────────────────────────────────────────
// 公開 API
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/landing/templates
 * 模板列表，支援篩選與分頁
 *
 * Query params:
 *   page_kind   — 'brand_narrative' | 'product_shop' | 'pricing' | 'lead_gen'
 *   tag         — 單一 category_tags 值（包含比對）
 *   animation   — animation_type 篩選
 *   featured    — '1' → 只取 is_featured=true
 *   page        — 頁碼（從 1 開始，預設 1）
 *   limit       — 每頁筆數（最大 100，預設 24）
 */
router.get("/templates", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page_kind, tag, animation, featured } = req.query;
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 24));
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    let query = supabaseAdmin
      .from("lp_templates")
      .select(
        "id, template_code, template_slug, page_kind, category_tags, " +
        "page_layout, animation_type, brand_name, html_title, " +
        "thumbnail_url, preview_url, jsx_component_key, color_vars, " +
        "is_featured, sort_order, is_active",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id",         { ascending: true })
      .range(from, to);

    if (page_kind) query = query.eq("page_kind", page_kind as string);
    if (animation)  query = query.eq("animation_type", animation as string);
    if (featured === "1") query = query.eq("is_featured", true);
    if (tag)        query = query.contains("category_tags", [tag as string]);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data:       data ?? [],
      total:      count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    logger.error("landing templates 列表失敗", err);
    sendError(res, 500, "無法取得模板列表");
  }
});


/**
 * GET /api/landing/templates/:id
 * 單一模板，含所有 sections 和 fields（不含 options，options 另行按需取得）
 *
 * Query params:
 *   include_options — '1' → 同時回傳 field_options（資料量較大）
 */
router.get("/templates/:id", async (req: Request, res: Response): Promise<void> => {
  const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
  if (!isValid) { sendError(res, 400, errorMessage!); return; }

  try {
    const { data: template, error: tErr } = await supabaseAdmin
      .from("lp_templates")
      .select("*")
      .eq("id", numericValue)
      .eq("is_active", true)
      .single();

    if (tErr || !template) { sendError(res, 404, "找不到此模板"); return; }

    // sections（排序後回傳）
    const { data: sections, error: sErr } = await supabaseAdmin
      .from("lp_template_sections")
      .select("*")
      .eq("template_id", numericValue)
      .order("sort_order", { ascending: true });

    if (sErr) throw sErr;

    // fields（含 section_id 對應）
    const { data: fields, error: fErr } = await supabaseAdmin
      .from("lp_template_fields")
      .select("*")
      .eq("template_id", numericValue)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (fErr) throw fErr;

    // 若要求同時回傳 options
    let options: unknown[] = [];
    if (req.query.include_options === "1" && fields && fields.length > 0) {
      const fieldIds = fields.map((f: { id: number }) => f.id);
      const { data: opts, error: oErr } = await supabaseAdmin
        .from("lp_template_field_options")
        .select("*")
        .in("field_id", fieldIds)
        .order("sort_order", { ascending: true });
      if (oErr) throw oErr;
      options = opts ?? [];
    }

    res.json({ template, sections: sections ?? [], fields: fields ?? [], options });
  } catch (err) {
    logger.error("landing template 詳情失敗", err);
    sendError(res, 500, "無法取得模板詳情");
  }
});


/**
 * GET /api/landing/projects/slug/:slug
 * 已發布專案（前端公開頁面用，by custom_slug）
 */
router.get("/projects/slug/:slug", async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug || "").trim().slice(0, 255);
  if (!slug) { sendError(res, 400, "slug 不可為空"); return; }

  try {
    const { data: project, error: pErr } = await supabaseAdmin
      .from("lp_projects")
      .select("*, lp_templates(template_code, jsx_component_key, color_vars, animation_type), lp_template_variants(color_vars)")
      .eq("custom_slug", slug)
      .eq("status", "published")
      .single();

    if (pErr || !project) { sendError(res, 404, "找不到此頁面"); return; }

    // 若有 variant，將 variant.color_vars 合併覆蓋 template.color_vars
    const variantVars = (project.lp_template_variants as { color_vars?: Record<string, string> } | null)?.color_vars;
    if (variantVars && project.lp_templates) {
      (project.lp_templates as { color_vars: Record<string, string> }).color_vars = {
        ...(project.lp_templates as { color_vars: Record<string, string> }).color_vars,
        ...variantVars,
      };
    }
    // 不把 variant 物件暴露給前端
    delete (project as Record<string, unknown>).lp_template_variants;

    // 解析後的欄位值（用 view）
    const { data: resolvedFields, error: rfErr } = await supabaseAdmin
      .from("vw_lp_project_resolved_fields")
      .select("*")
      .eq("project_id", project.id)
      .order("field_sort_order", { ascending: true });

    if (rfErr) throw rfErr;

    res.json({ project, resolvedFields: resolvedFields ?? [] });
  } catch (err) {
    logger.error("landing project slug 查詢失敗", err);
    sendError(res, 500, "無法取得頁面資料");
  }
});


// ─────────────────────────────────────────────────────────────
// 管理員 API（requireAdmin）
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/landing/projects
 * 所有專案列表（含草稿）
 */
router.get("/projects", authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;
    const status = req.query.status as string | undefined;

    let query = supabaseAdmin
      .from("lp_projects")
      .select(
        "id, project_code, project_name, customer_name, status, " +
        "custom_slug, published_at, created_at, updated_at, " +
        "lp_templates(template_code, template_slug, thumbnail_url)",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data:       data ?? [],
      total:      count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    logger.error("landing projects 列表失敗", err);
    sendError(res, 500, "無法取得專案列表");
  }
});


/**
 * POST /api/landing/projects
 * 建立新專案
 *
 * Body: { template_id, project_name, customer_name?, locale?, custom_slug?, ... }
 */
router.post("/projects", authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const {
    template_id,
    project_name,
    customer_name,
    course_id,
    locale,
    custom_slug,
    seo_title,
    seo_description,
    seo_keywords,
    og_title,
    og_description,
    hero_image_url,
    logo_url,
    og_image_url,
    favicon_url,
    settings_json,
  } = req.body;

  if (!template_id || !project_name) {
    sendError(res, 400, "template_id 與 project_name 為必填");
    return;
  }

  // 驗證 template 存在
  const { data: tmpl, error: tmplErr } = await supabaseAdmin
    .from("lp_templates")
    .select("id")
    .eq("id", Number(template_id))
    .eq("is_active", true)
    .single();

  if (tmplErr || !tmpl) {
    sendError(res, 404, "找不到此模板");
    return;
  }

  // 自動產生唯一 project_code（LP_YYYYMMDD_XXXX）
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const project_code = `LP_${datePart}_${randPart}`;

  try {
    const { data, error } = await supabaseAdmin
      .from("lp_projects")
      .insert({
        template_id:     Number(template_id),
        project_code,
        project_name:    String(project_name).trim().slice(0, 255),
        customer_name:   customer_name  ? String(customer_name).trim().slice(0, 255)  : null,
        course_id:       course_id      ? Number(course_id)       : null,
        locale:          locale         ? String(locale).slice(0, 16) : "zh-Hant",
        custom_slug:     custom_slug    ? String(custom_slug).trim().slice(0, 255).toLowerCase() : null,
        seo_title:       seo_title      || null,
        seo_description: seo_description || null,
        seo_keywords:    Array.isArray(seo_keywords) ? seo_keywords : [],
        og_title:        og_title       || null,
        og_description:  og_description || null,
        hero_image_url:  hero_image_url || null,
        logo_url:        logo_url       || null,
        og_image_url:    og_image_url   || null,
        favicon_url:     favicon_url    || null,
        settings_json:   settings_json  || {},
        status:          "draft",
      })
      .select()
      .single();

    if (error) throw error;

    logger.info("建立 LP 專案", { project_code, template_id, admin: req.user?.email });
    res.status(201).json(data);
  } catch (err) {
    logger.error("建立 LP 專案失敗", err);
    sendError(res, 500, "建立專案失敗");
  }
});


/**
 * GET /api/landing/projects/published
 * 已發布頁面清單（公開，無需登入）
 * 回傳: { data: [...], total: number }
 */
router.get("/projects/published", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error, count } = await supabaseAdmin
      .from("lp_projects")
      .select(
        "id, project_name, custom_slug, seo_title, seo_description, published_at, updated_at",
        { count: "exact" },
      )
      .eq("status", "published")
      .not("custom_slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ data: data ?? [], total: count ?? 0 });
  } catch (err) {
    logger.error("landing published projects 列表失敗", err);
    sendError(res, 500, "無法取得頁面列表");
  }
});


/**
 * GET /api/landing/projects/:id
 * 單一專案詳情（含解析後欄位值）
 */
router.get("/projects/:id", authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
  if (!isValid) { sendError(res, 400, errorMessage!); return; }

  try {
    const { data: project, error: pErr } = await supabaseAdmin
      .from("lp_projects")
      .select("*, lp_templates(*)")
      .eq("id", numericValue)
      .single();

    if (pErr || !project) { sendError(res, 404, "找不到此專案"); return; }

    // 解析後的欄位值（用 view）
    const { data: resolvedFields, error: rfErr } = await supabaseAdmin
      .from("vw_lp_project_resolved_fields")
      .select("*")
      .eq("project_id", numericValue)
      .order("field_sort_order", { ascending: true });

    if (rfErr) throw rfErr;

    res.json({ project, resolvedFields: resolvedFields ?? [] });
  } catch (err) {
    logger.error("landing project 詳情失敗", err);
    sendError(res, 500, "無法取得專案詳情");
  }
});


/**
 * PUT /api/landing/projects/:id
 * 更新專案基本資料（不含欄位覆寫值）
 */
router.put("/projects/:id", authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
  if (!isValid) { sendError(res, 400, errorMessage!); return; }

  const ALLOWED_FIELDS = [
    "project_name", "customer_name", "course_id", "locale",
    "custom_slug", "status", "published_at", "expires_at",
    "seo_title", "seo_description", "seo_keywords",
    "og_title", "og_description",
    "hero_image_url", "logo_url", "og_image_url", "favicon_url",
    "settings_json",
    "variant_id",
  ] as const;

  const VALID_STATUSES = ["draft", "review", "published", "archived"];

  // 只取允許的欄位
  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in req.body) updates[key] = req.body[key];
  }

  if (updates.status && !VALID_STATUSES.includes(updates.status as string)) {
    sendError(res, 400, "status 值無效");
    return;
  }

  // 發布時自動填入 published_at
  if (updates.status === "published" && !updates.published_at) {
    updates.published_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    sendError(res, 400, "沒有可更新的欄位");
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("lp_projects")
      .update(updates)
      .eq("id", numericValue)
      .select("*, lp_templates(template_code, template_slug, thumbnail_url)")
      .single();

    if (error) throw error;
    if (!data) { sendError(res, 404, "找不到此專案"); return; }

    logger.info("更新 LP 專案", { id: numericValue, fields: Object.keys(updates), admin: req.user?.email });
    res.json(data);
  } catch (err) {
    logger.error("更新 LP 專案失敗", err);
    sendError(res, 500, "更新專案失敗");
  }
});


/**
 * PUT /api/landing/projects/:id/fields
 * 批次更新（upsert）欄位覆寫值
 *
 * Body: { values: Array<{ field_id, value_text?, value_json?, cloudinary_url?, cloudinary_public_id?, sort_order? }> }
 */
router.put(
  "/projects/:id/fields",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
    if (!isValid) { sendError(res, 400, errorMessage!); return; }

    const values: unknown[] = req.body.values;
    if (!Array.isArray(values) || values.length === 0) {
      sendError(res, 400, "values 必須是非空陣列");
      return;
    }

    // 確認專案存在
    const { data: proj, error: projErr } = await supabaseAdmin
      .from("lp_projects")
      .select("id")
      .eq("id", numericValue)
      .single();

    if (projErr || !proj) { sendError(res, 404, "找不到此專案"); return; }

    // 建立 upsert rows
    const rows = values
      .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null && "field_id" in v)
      .map((v) => ({
        project_id:          numericValue,
        field_id:            Number(v.field_id),
        value_text:          v.value_text          != null ? String(v.value_text) : null,
        value_json:          v.value_json           != null ? v.value_json        : {},
        cloudinary_url:      v.cloudinary_url       != null ? String(v.cloudinary_url)       : null,
        cloudinary_public_id: v.cloudinary_public_id != null ? String(v.cloudinary_public_id) : null,
        sort_order:          Number(v.sort_order)   || 0,
        updated_by:          req.user?.email        || null,
      }));

    if (rows.length === 0) {
      sendError(res, 400, "沒有有效的欄位值");
      return;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("lp_project_field_values")
        .upsert(rows, { onConflict: "project_id,field_id,sort_order" })
        .select();

      if (error) throw error;

      logger.info("更新 LP 專案欄位值", { project_id: numericValue, count: rows.length, admin: req.user?.email });
      res.json({ updated: data?.length ?? 0, data: data ?? [] });
    } catch (err) {
      logger.error("更新 LP 專案欄位值失敗", err);
      sendError(res, 500, "更新欄位值失敗");
    }
  },
);


/**
 * DELETE /api/landing/projects/:id
 * 刪除專案（CASCADE 會同步清除 field_values）
 */
router.delete("/projects/:id", authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
  if (!isValid) { sendError(res, 400, errorMessage!); return; }

  try {
    const { error } = await supabaseAdmin
      .from("lp_projects")
      .delete()
      .eq("id", numericValue);

    if (error) throw error;

    logger.info("刪除 LP 專案", { id: numericValue, admin: req.user?.email });
    res.json({ success: true });
  } catch (err) {
    logger.error("刪除 LP 專案失敗", err);
    sendError(res, 500, "刪除專案失敗");
  }
});

// ─────────────────────────────────────────────────────────────
// 樣式 Variant
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/landing/templates/:id/variants
 * 取得某模板的所有樣式方案（公開）
 */
router.get("/templates/:id/variants", async (req: Request, res: Response): Promise<void> => {
  const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
  if (!isValid) { sendError(res, 400, errorMessage!); return; }

  try {
    const { data, error } = await supabaseAdmin
      .from("lp_template_variants")
      .select("id, variant_key, label, label_en, color_vars, preview_thumbnail, is_default, sort_order")
      .eq("template_id", numericValue)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    res.json({ variants: data ?? [] });
  } catch (err) {
    logger.error("取得 variant 失敗", err);
    sendError(res, 500, "取得樣式方案失敗");
  }
});

// ─────────────────────────────────────────────────────────────
// 圖片上傳（Landing Page 用）
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/landing/projects/:id/images
 * 上傳圖片至 Supabase Storage lp-images bucket
 * Body: multipart/form-data, field name: "image"
 * Returns: { url, path }
 */
router.post(
  "/projects/:id/images",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
    if (!isValid) { sendError(res, 400, errorMessage!); return; }

    if (!req.file) { sendError(res, 400, "請附上圖片檔案（field: image）"); return; }

    try {
      // 壓縮 → webp，max 1920px
      const webpBuffer = await sharp(req.file.buffer)
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const filename = `${numericValue}/${Date.now()}.webp`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from("lp-images")
        .upload(filename, webpBuffer, { contentType: "image/webp", upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabaseAdmin.storage
        .from("lp-images")
        .getPublicUrl(filename);

      logger.info("LP 圖片上傳成功", { projectId: numericValue, path: filename });
      res.json({ url: publicData.publicUrl, path: filename });
    } catch (err) {
      logger.error("LP 圖片上傳失敗", { error: (err as Error).message });
      sendError(res, 500, "圖片上傳失敗，請稍後再試");
    }
  },
);

/**
 * DELETE /api/landing/projects/:id/images
 * 刪除已上傳的圖片
 * Body: { path }
 */
router.delete(
  "/projects/:id/images",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const path = String(req.body.path || "").trim();
    if (!path) { sendError(res, 400, "path 不可為空"); return; }
    // 基本安全：path 只允許 projectId/timestamp.webp 格式
    if (!/^\d+\/\d+\.webp$/.test(path)) {
      sendError(res, 400, "path 格式無效");
      return;
    }
    try {
      const { error } = await supabaseAdmin.storage.from("lp-images").remove([path]);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("LP 圖片刪除失敗", err);
      sendError(res, 500, "圖片刪除失敗");
    }
  },
);

export default router;
