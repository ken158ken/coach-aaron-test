-- ============================================================
-- Migration 023: Landing Page 樣式 Variant 系統
-- 建立時間: 2026-05-01
-- 說明:
--   1. 新增 lp_template_variants — 每個模板的多種配色/樣式方案
--   2. lp_projects 加 variant_id — 記錄專案當前套用的樣式
--   3. 補建 lp-images Storage bucket（image upload 用）
--   4. 為現有 AARON_GENERIC_001 補齊三種 variant
--
-- 執行順序：在 012, 013 之後執行
-- ============================================================

BEGIN;

-- ============================================================
-- 一、lp_template_variants — 模板樣式方案
-- ============================================================
CREATE TABLE IF NOT EXISTS lp_template_variants (
    id              BIGSERIAL       PRIMARY KEY,
    template_id     BIGINT          NOT NULL REFERENCES lp_templates(id) ON DELETE CASCADE,

    variant_key     VARCHAR(64)     NOT NULL,   -- 'dark_gold', 'dark_blue', 'light_classic'
    label           TEXT            NOT NULL,   -- 後台顯示名（中文）
    label_en        TEXT,                       -- 英文名（選填）

    -- 覆蓋 lp_templates.color_vars 的顏色方案
    -- 鍵名對應 CSS var: primary → --lp-primary, bg → --lp-bg, 以此類推
    color_vars      JSONB           NOT NULL DEFAULT '{}'::JSONB,

    -- 樣式預覽小圖（Cloudinary URL 或 Supabase Storage URL）
    preview_thumbnail TEXT,

    is_default      BOOLEAN         NOT NULL DEFAULT false,
    sort_order      INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (template_id, variant_key)
);

COMMENT ON TABLE lp_template_variants IS 'Landing Page 模板的多種配色/樣式方案，套用時覆蓋 lp_templates.color_vars';
COMMENT ON COLUMN lp_template_variants.color_vars IS '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#fff","muted":"#888","border":"rgba(255,255,255,0.1)"}';

-- ============================================================
-- 二、lp_projects 加 variant_id
-- ============================================================
ALTER TABLE lp_projects
  ADD COLUMN IF NOT EXISTS variant_id BIGINT REFERENCES lp_template_variants(id) ON DELETE SET NULL;

COMMENT ON COLUMN lp_projects.variant_id IS '套用的樣式 variant；NULL = 使用模板預設 color_vars';

-- ============================================================
-- 三、RLS
-- ============================================================
ALTER TABLE lp_template_variants ENABLE ROW LEVEL SECURITY;

-- 公開讀取（設計工具 / 前台預覽用）
CREATE POLICY "lp_variants_public_read" ON lp_template_variants
  FOR SELECT USING (true);

-- Admin 完整操作
CREATE POLICY "lp_variants_admin_all" ON lp_template_variants
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 四、Supabase Storage — lp-images bucket
--   注意: INSERT 成功需要 service-role key；若跳錯可在 Supabase
--   dashboard → Storage → New bucket 手動建立：
--   Name: lp-images, Public: true, Max size: 5MB
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lp-images',
  'lp-images',
  true,
  5242880,    -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy 掛在 storage.objects（Supabase 正確寫法，不是 storage.policies）
DO $$
BEGIN
  -- 公開讀取
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='lp-images-public-read'
  ) THEN
    EXECUTE 'CREATE POLICY "lp-images-public-read" ON storage.objects FOR SELECT USING (bucket_id = ''lp-images'')';
  END IF;

  -- Admin 上傳
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='lp-images-admin-insert'
  ) THEN
    EXECUTE 'CREATE POLICY "lp-images-admin-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''lp-images'' AND public.is_admin())';
  END IF;

  -- Admin 刪除
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='lp-images-admin-delete'
  ) THEN
    EXECUTE 'CREATE POLICY "lp-images-admin-delete" ON storage.objects FOR DELETE USING (bucket_id = ''lp-images'' AND public.is_admin())';
  END IF;
END $$;

-- ============================================================
-- 五、為現有模板 AARON_GENERIC_001 補齊 3 個 variant
-- ============================================================
DO $$
DECLARE v_template_id BIGINT;
BEGIN
  SELECT id INTO v_template_id FROM lp_templates WHERE template_code = 'AARON_GENERIC_001';
  IF v_template_id IS NOT NULL THEN
    INSERT INTO lp_template_variants (template_id, variant_key, label, label_en, color_vars, is_default, sort_order)
    VALUES
      (v_template_id, 'dark_gold',     '品牌金', 'Dark Gold',
       '{"primary":"#c5a059","bg":"#0a0a0a","surface":"#141414","text":"#ffffff","muted":"#888888","border":"rgba(255,255,255,0.1)"}',
       true, 0),
      (v_template_id, 'dark_blue',     '深海藍', 'Dark Blue',
       '{"primary":"#60a5fa","bg":"#050d1a","surface":"#0f172a","text":"#f0f9ff","muted":"#94a3b8","border":"rgba(255,255,255,0.08)"}',
       false, 1),
      (v_template_id, 'light_classic', '簡約白', 'Light Classic',
       '{"primary":"#2563eb","bg":"#ffffff","surface":"#f8fafc","text":"#111827","muted":"#6b7280","border":"rgba(0,0,0,0.1)"}',
       false, 2)
    ON CONFLICT (template_id, variant_key) DO NOTHING;
  END IF;
END $$;

COMMIT;
