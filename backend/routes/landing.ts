/**
 * @fileoverview Landing Page 模板 & 專案路由
 *
 * 公開路由（無需登入）：
 *   GET /api/landing/templates          — 模板列表（page_kind / tags 篩選）
 *   GET /api/landing/templates/:id      — 單一模板 + sections + fields
 *   GET /api/landing/projects/slug/:slug — 已發布專案（by custom_slug）
 *   POST /api/landing/leads             — LP 表單報名（限流 + 蜜罐，寫入 lp_leads 並寄信通知）
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
import rateLimit from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticateToken, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { sanitizeId, sanitizeSearchQuery } from "../utils/sanitizer.js";
import { logger } from "../utils/logger.js";
import { IMAGE_BUCKETS, deleteFolder } from "../utils/imageStorage.js";

/** LP 專案圖片 bucket（常數集中在 utils/imageStorage.ts） */
const LP_IMAGE_BUCKET = IMAGE_BUCKETS.LANDING;

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
    // 主查詢：不 join lp_template_variants（避免 migration 023 未跑時整個 query 壞掉）
    const { data: project, error: pErr } = await supabaseAdmin
      .from("lp_projects")
      .select("*, lp_templates(template_code, jsx_component_key, color_vars, animation_type)")
      .eq("custom_slug", slug)
      .eq("status", "published")
      .single();

    if (pErr || !project) { sendError(res, 404, "找不到此頁面"); return; }

    // 若 project 有 variant_id，另外查 variant color_vars 並合併
    // 用 try-catch 包住，確保 migration 023 未跑時不影響主流程
    const variantId = (project as Record<string, unknown>).variant_id as number | null;
    if (variantId && project.lp_templates) {
      try {
        const { data: variant } = await supabaseAdmin
          .from("lp_template_variants")
          .select("color_vars")
          .eq("id", variantId)
          .maybeSingle();
        if (variant?.color_vars) {
          (project.lp_templates as { color_vars: Record<string, string> }).color_vars = {
            ...(project.lp_templates as { color_vars: Record<string, string> }).color_vars,
            ...(variant.color_vars as Record<string, string>),
          };
        }
      } catch {
        // variant 表未建立或查詢失敗，略過，不影響頁面顯示
      }
    }

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

    // 硬刪除 → 清掉 `lp-images/{projectId}/` 整個資料夾
    const removed = await deleteFolder(LP_IMAGE_BUCKET, String(numericValue));

    logger.info("刪除 LP 專案", {
      id: numericValue,
      imagesRemoved: removed,
      admin: req.user?.email,
    });
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
        .from(LP_IMAGE_BUCKET)
        .upload(filename, webpBuffer, { contentType: "image/webp", upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabaseAdmin.storage
        .from(LP_IMAGE_BUCKET)
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
      const { error } = await supabaseAdmin.storage.from(LP_IMAGE_BUCKET).remove([path]);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      logger.error("LP 圖片刪除失敗", err);
      sendError(res, 500, "圖片刪除失敗");
    }
  },
);

// ─────────────────────────────────────────────────────────────
// 公開 API：Landing Page 表單報名（lead）
// ─────────────────────────────────────────────────────────────

/** 報名表單限流：每 IP 15 分鐘 8 次 */
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: "送出次數過多，請 15 分鐘後再試" },
});

/** 去除標籤與危險前綴，但保留換行（摘要是多行的） */
function cleanLine(input: unknown, max: number): string {
  return String(input ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, max);
}

/**
 * POST /api/landing/leads
 * 公開端點：LP 版面的預約/報名表單送出。
 *
 * 完整答案以結構化 JSON 存進 lp_leads.answers，並同時寄信通知教練，
 * 兩條路徑任一成功即視為送出成功（不會有「假送出」）。
 */
router.post("/leads", leadLimiter, async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // 蜜罐：機器人填了就靜默成功
    if (body.website || body.honeypot) {
      res.json({ success: true });
      return;
    }

    const name = cleanLine(body.name, 60);
    const phone = cleanLine(body.phone, 40);
    const email = cleanLine(body.email, 254);
    const summary = cleanLine(body.summary, 8000);

    if (!name || !phone) {
      sendError(res, 400, "請填寫姓名與聯絡電話");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      sendError(res, 400, "電子信箱格式不正確");
      return;
    }

    const answers =
      body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
        ? (body.answers as Record<string, unknown>)
        : {};

    const projectId = Number(body.project_id);
    const row = {
      project_id: Number.isFinite(projectId) && projectId > 0 ? projectId : null,
      project_slug: cleanLine(body.project_slug, 255) || null,
      project_name: cleanLine(body.project_name, 255) || null,
      name,
      phone,
      email: email || null,
      line_id: cleanLine(body.line_id, 100) || null,
      instagram: cleanLine(body.instagram, 100) || null,
      answers,
      summary,
      status: "new",
    };

    // 1) 落地：寫入 lp_leads
    let stored = false;
    const { error: dbErr } = await supabaseAdmin.from("lp_leads").insert(row);
    if (dbErr) {
      // 資料表尚未建立（migration 未套用）時不擋使用者，改由信件保底
      logger.error("lp_leads 寫入失敗", dbErr);
    } else {
      stored = true;
    }

    // 2) 通知：寄信給教練（附完整逐題答案）
    let mailed = false;
    const resendApiKey = process.env.RESEND_API_KEY;
    const coachEmail = process.env.COACH_EMAIL || "s330221@gmail.com";
    if (resendApiKey) {
      try {
        const esc = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const mailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Coach Aaron 網站 <onboarding@resend.dev>",
            to: [coachEmail],
            ...(email ? { reply_to: email } : {}),
            subject: `[LP 報名] ${row.project_name || "Landing Page"} - ${name}`,
            html:
              `<h2>新的 Landing Page 報名</h2>` +
              `<p><b>頁面：</b>${esc(row.project_name || "-")}` +
              (row.project_slug ? `（/page/${esc(row.project_slug)}）` : "") +
              `</p><hr/><pre style="white-space:pre-wrap;font-family:inherit;font-size:15px">${esc(summary)}</pre>`,
          }),
        });
        mailed = mailRes.ok;
        if (!mailRes.ok) logger.error("lead 通知信寄送失敗", await mailRes.text());
      } catch (mailErr) {
        logger.error("lead 通知信例外", mailErr);
      }
    }

    if (!stored && !mailed) {
      sendError(res, 500, "送出失敗，請稍後再試或直接用 LINE 聯繫");
      return;
    }

    res.json({ success: true, stored, mailed });
  } catch (err) {
    logger.error("LP lead 送出失敗", err);
    sendError(res, 500, "送出失敗，請稍後再試");
  }
});

// ─────────────────────────────────────────────────────────────
// 管理員 API：表單報名（lp_leads）管理
// ─────────────────────────────────────────────────────────────
//
// 教練後台檢視／處理 Landing Page 報名。全掛 requireAdmin、一律 supabaseAdmin。
// 路由順序：literal 前綴（/leads/stats）必須註冊在動態 `/leads/:id` 之前，
//           否則 stats 會被 :id 攔截。
//

/** lead 狀態白名單 */
const LEAD_STATUSES = [
  "new",
  "contacted",
  "booked",
  "closed",
  "spam",
] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

/** 列表卡片用欄位（不含較大的 answers）*/
const LEAD_LIST_COLUMNS =
  "id, project_id, project_slug, project_name, name, phone, email, " +
  "line_id, instagram, summary, status, coach_note, created_at, updated_at";

const COACH_NOTE_MAX = 5000;

/**
 * GET /api/landing/leads
 * 報名列表（分頁 + 搜尋姓名/電話/email + status 篩選），依建立時間新→舊
 */
router.get(
  "/leads",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const statusFilter = String(req.query.status || "").trim();

      let query = supabaseAdmin
        .from("lp_leads")
        .select(LEAD_LIST_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (
        statusFilter &&
        (LEAD_STATUSES as readonly string[]).includes(statusFilter)
      ) {
        query = query.eq("status", statusFilter);
      }

      const safeSearch = sanitizeSearchQuery(req.query.search);
      if (safeSearch) {
        // sanitizeSearchQuery 已移除 , ( ) . 等 PostgREST 中繼字元，可安全組 .or()
        query = query.or(
          `name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`,
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      res.json({
        data: data ?? [],
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      });
    } catch (err) {
      logger.error("取得報名列表失敗", err);
      sendError(res, 500, "無法取得報名列表");
    }
  },
);

/**
 * GET /api/landing/leads/stats
 * 各狀態計數（literal，須在 /leads/:id 之前）
 */
router.get(
  "/leads/stats",
  authenticateToken,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const results = await Promise.all(
        LEAD_STATUSES.map(async (status) => {
          const { count } = await supabaseAdmin
            .from("lp_leads")
            .select("id", { count: "exact", head: true })
            .eq("status", status);
          return [status, count || 0] as const;
        }),
      );
      const { count: total } = await supabaseAdmin
        .from("lp_leads")
        .select("id", { count: "exact", head: true });

      const byStatus = Object.fromEntries(results) as Record<LeadStatus, number>;
      res.json({ total: total || 0, ...byStatus });
    } catch (err) {
      logger.error("取得報名統計失敗", err);
      sendError(res, 500, "無法取得報名統計");
    }
  },
);

/**
 * GET /api/landing/leads/:id
 * 單筆完整報名（含 answers / summary）
 */
router.get(
  "/leads/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
    if (!isValid) { sendError(res, 400, errorMessage!); return; }

    try {
      const { data, error } = await supabaseAdmin
        .from("lp_leads")
        .select("*")
        .eq("id", numericValue)
        .maybeSingle();
      if (error) throw error;
      if (!data) { sendError(res, 404, "找不到此報名"); return; }
      res.json(data);
    } catch (err) {
      logger.error("取得報名詳情失敗", err);
      sendError(res, 500, "無法取得報名詳情");
    }
  },
);

/**
 * PUT /api/landing/leads/:id/status
 * 切換處理狀態
 */
router.put(
  "/leads/:id/status",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
    if (!isValid) { sendError(res, 400, errorMessage!); return; }

    const status = String(req.body.status || "");
    if (!(LEAD_STATUSES as readonly string[]).includes(status)) {
      sendError(res, 400, "狀態值無效");
      return;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("lp_leads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", numericValue)
        .select("id, status, updated_at")
        .maybeSingle();
      if (error) throw error;
      if (!data) { sendError(res, 404, "找不到此報名"); return; }
      res.json(data);
    } catch (err) {
      logger.error("切換報名狀態失敗", err);
      sendError(res, 500, "切換狀態失敗");
    }
  },
);

/**
 * PUT /api/landing/leads/:id/note
 * 更新教練備註（coach_note）
 */
router.put(
  "/leads/:id/note",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
    if (!isValid) { sendError(res, 400, errorMessage!); return; }

    const note = String(req.body.coach_note ?? "").slice(0, COACH_NOTE_MAX);

    try {
      const { data, error } = await supabaseAdmin
        .from("lp_leads")
        .update({ coach_note: note || null, updated_at: new Date().toISOString() })
        .eq("id", numericValue)
        .select("id, coach_note, updated_at")
        .maybeSingle();
      if (error) throw error;
      if (!data) { sendError(res, 404, "找不到此報名"); return; }
      res.json(data);
    } catch (err) {
      logger.error("更新報名備註失敗", err);
      sendError(res, 500, "更新備註失敗");
    }
  },
);

/**
 * DELETE /api/landing/leads/:id
 * 刪除單筆報名
 */
router.delete(
  "/leads/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const { isValid, numericValue, errorMessage } = sanitizeId(req.params.id, "id");
    if (!isValid) { sendError(res, 400, errorMessage!); return; }

    try {
      const { data: existing } = await supabaseAdmin
        .from("lp_leads")
        .select("id")
        .eq("id", numericValue)
        .maybeSingle();
      if (!existing) { sendError(res, 404, "找不到此報名"); return; }

      const { error } = await supabaseAdmin
        .from("lp_leads")
        .delete()
        .eq("id", numericValue);
      if (error) throw error;

      logger.info("刪除 LP 報名", { id: numericValue, admin: req.user?.email });
      res.json({ success: true });
    } catch (err) {
      logger.error("刪除報名失敗", err);
      sendError(res, 500, "刪除失敗");
    }
  },
);

export default router;
