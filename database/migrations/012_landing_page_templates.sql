-- ============================================================
-- Migration 012: Landing Page 模板系統
-- 建立時間: 2026-03-24
-- 說明:
--   建立完整的 Landing Page 模板 CMS 系統，包含：
--   1. lp_templates        — 模板主檔（設計、視覺、分類、JSX 整合）
--   2. lp_template_sections — 模板區塊定義（hero/metrics/pricing 等）
--   3. lp_template_fields   — 各區塊的可編輯欄位（文字/圖片/選項等）
--   4. lp_template_field_options — 選項欄位的值定義
--   5. lp_projects          — 客戶 / 課程專案實例
--   6. lp_project_field_values — 各專案覆寫的欄位值
--
-- 圖片規則：所有圖片欄位一律存 Cloudinary URL（TEXT），禁止存二進位。
-- 縮圖支援：thumbnail_url（小圖）+ preview_url（hover 全尺寸，Aceternity link-preview）
-- 欄位設計原則：寧多勿少，沒用到的欄位不渲染，不影響系統。
--
-- 前置條件：
--   Migration 009 的 public.is_admin() 函數必須存在
-- ============================================================

BEGIN;


-- ============================================================
-- 共用 updated_at trigger 函數（若已存在則更新）
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ============================================================
-- 一、lp_templates — 模板主檔
--
-- 每份 HTML 檔對應一列，記錄：
--   - 識別資訊（code, slug, file_name）
--   - 分類資訊（page_kind, category_tags, page_layout, animation_type）
--   - 預設品牌內容（brand_name, html_title, meta_description）
--   - 視覺預覽（thumbnail_url 小圖 / preview_url 大圖，均為 Cloudinary URL）
--   - JSX 整合（jsx_component_key, jsx_prop_schema, color_vars）
--   - 管理旗標（is_active, is_featured, sort_order）
-- ============================================================
CREATE TABLE IF NOT EXISTS lp_templates (
    id                      BIGSERIAL       PRIMARY KEY,

    -- 識別
    template_code           VARCHAR(64)     NOT NULL UNIQUE,    -- 'PREMIUM_001'
    source_file_name        VARCHAR(255)    UNIQUE,             -- 'Premium_01_Cyberpunk_GSAP.html'
    template_slug           VARCHAR(128)    NOT NULL UNIQUE,    -- 'cyberpunk'

    -- 分類
    page_kind               VARCHAR(64)     NOT NULL DEFAULT 'brand_narrative',
    -- 常見值: 'brand_narrative', 'product_shop', 'lead_gen', 'pricing', 'saas', 'portfolio'
    category_tags           TEXT[]          NOT NULL DEFAULT '{}',
    -- 例: '{dark-theme, gsap, product, tech}'
    page_layout             VARCHAR(64)     NOT NULL DEFAULT 'standard',
    -- 常見值: 'standard', 'fullscreen-hero', 'split-screen', 'horizontal-scroll', 'magazine', 'one-page'
    animation_type          VARCHAR(64)     NOT NULL DEFAULT 'aos',
    -- 常見值: 'gsap', 'gsap-scroll', 'aos', 'framer', 'css', 'mixed', 'none'

    -- 預設品牌內容
    brand_name              VARCHAR(255),
    html_title              TEXT,
    meta_description        TEXT,

    -- ── 視覺預覽（全部用 Cloudinary URL）──────────────────────
    -- thumbnail_url : 縮圖（管理後台模板選擇器用，建議 400x300 Cloudinary transformation）
    -- preview_url   : 全尺寸截圖（Aceternity link-preview hover 用）
    -- 上傳方式: 截圖後上傳至 Cloudinary，存入 URL；可用同一張圖片用 Cloudinary 轉換小圖
    thumbnail_url           TEXT,           -- Cloudinary 縮圖 URL（如 .../w_400,h_300,c_fill/...）
    preview_url             TEXT,           -- Cloudinary 全尺寸預覽 URL（hover 時顯示）

    -- ── JSX 整合 ───────────────────────────────────────────
    jsx_component_key       VARCHAR(128),   -- React 元件名稱，例如 'ProductShopLP', 'BrandNarrativeLP'
    jsx_prop_schema         JSONB           NOT NULL DEFAULT '{}'::JSONB,
    -- JSON Schema，描述此模板接受的 props 結構（可選，用於型別驗證）

    -- 主題顏色變數（從 CSS :root 提取）
    -- 例: {"--accent": "#ef4444", "--bg": "#050505", "--text": "#e0e0e0"}
    color_vars              JSONB           NOT NULL DEFAULT '{}'::JSONB,

    -- 分析來源元資料
    analysis_generated_at   TIMESTAMPTZ,

    -- 管理旗標
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    is_featured             BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_order              INTEGER         NOT NULL DEFAULT 0,

    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lp_templates IS 'Landing Page 模板定義，每份 HTML 模板對應一列';
COMMENT ON COLUMN lp_templates.thumbnail_url IS 'Cloudinary 縮圖 URL，禁止存二進位，只存 URL';
COMMENT ON COLUMN lp_templates.preview_url   IS 'Cloudinary 全尺寸截圖 URL（Aceternity link-preview hover 用）';
COMMENT ON COLUMN lp_templates.jsx_component_key IS '對應的 React 元件 key，如 ProductShopLP';
COMMENT ON COLUMN lp_templates.color_vars    IS 'CSS :root 變數 JSON，如 {"--accent":"#ef4444"}';


-- ============================================================
-- 二、lp_template_sections — 模板區塊定義
--
-- 將每個模板拆成語意化的區塊，例如 hero / metrics / features / pricing。
-- 每個區塊有獨立的 section_type 用於前端 JSX 渲染選擇器。
-- 支援縮圖（section 截圖，Cloudinary URL）供管理 UI 預覽。
--
-- section_type 常見值（欄位不設 ENUM 以保留彈性）:
--   nav           導覽列
--   hero          主視覺 / Banner
--   metrics       數字統計展示（3000W / ±1°C 等）
--   features      功能特點（icon + title + desc）
--   process       流程 / 時間軸（Step 1 → Step 2 → ...）
--   testimonials  客戶見證 / 評價
--   gallery       圖片 / 影片 Gallery
--   pricing       價格方案比較
--   comparison    產品規格比較表
--   faq           常見問題 Accordion
--   cta           行動呼籲區塊（大按鈕）
--   form          詢價 / 聯絡表單
--   shop          產品選購器（選項 + 加入購物車）
--   video         影片嵌入（YouTube / Cloudinary Video）
--   about         品牌 / 創辦人 / 團隊介紹
--   awards        認證 / 獎項 / 媒體報導 Badge
--   brands        合作品牌 Logo 牆
--   footer        頁尾
--   meta          SEO / Open Graph 元資料
--   content       通用內容區塊（無法歸類時使用）
-- ============================================================
CREATE TABLE IF NOT EXISTS lp_template_sections (
    id                      BIGSERIAL       PRIMARY KEY,
    template_id             BIGINT          NOT NULL REFERENCES lp_templates(id) ON DELETE CASCADE,

    section_key             VARCHAR(128)    NOT NULL,   -- 'hero', 'features', 'pricing_table'
    section_name            VARCHAR(255)    NOT NULL,   -- 後台顯示名稱（中文可）
    section_type            VARCHAR(64)     NOT NULL,   -- 語意類型（見上方說明）

    -- 來源資訊（Python 分析時的 DOM selector）
    dom_selector            VARCHAR(255),

    -- 版面提示（供 JSX 元件判斷排版方式）
    layout_cols             SMALLINT        NOT NULL DEFAULT 1,   -- 欄數 1~6
    layout_variant          VARCHAR(64),
    -- 例: 'card-grid', 'list', 'horizontal-scroll', 'full-bleed', 'split-left', 'split-right', 'accordion'

    -- 區塊截圖預覽（Cloudinary URL）
    thumbnail_url           TEXT,           -- 此區塊的截圖縮圖，Cloudinary URL

    -- 區塊內容預覽文字（純文字摘要，管理 UI 用）
    text_preview            TEXT,

    -- 是否預設顯示
    is_visible_by_default   BOOLEAN         NOT NULL DEFAULT TRUE,

    sort_order              INTEGER         NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (template_id, section_key)
);

COMMENT ON TABLE lp_template_sections IS 'Landing Page 模板的語意化區塊定義';
COMMENT ON COLUMN lp_template_sections.thumbnail_url IS 'Cloudinary 區塊截圖 URL';


-- ============================================================
-- 三、lp_template_fields — 可編輯欄位定義
--
-- 每個區塊下的可客製化欄位，涵蓋：
--   文字類：plain_text, long_text, rich_text
--   媒體類：cloudinary_image, cloudinary_video
--   連結類：url, cloudinary_image（均存 URL，不存二進位）
--   顏色類：color_hex
--   數值類：number, boolean
--   互動類：select, option_group, form_input
--   複合類：stat_item, feature_item, testimonial_item, faq_item
--           price_text, cta_label, icon_name, badge_text, json_array
--
-- field_kind 說明（可擴充，不設 ENUM）:
--   plain_text      單行文字
--   long_text       多行文字（textarea）
--   rich_text       富文字（HTML，不含圖片）
--   url             URL 字串
--   cloudinary_image Cloudinary 圖片 URL（縮圖/Hero 背景/產品圖等）
--   cloudinary_video Cloudinary 影片 URL
--   color_hex       CSS 顏色值（#rrggbb / rgba）
--   number          數值
--   boolean         開關（true/false）
--   select          單選下拉（配合 field_options 使用）
--   option_group    多選規格群組（顏色/尺寸/方案，配合 field_options）
--   form_input      表單欄位描述器（type/name/placeholder）
--   price_text      價格文字（'NT$32,800' / '$299.00'）
--   cta_label       CTA 按鈕文案
--   icon_name       Icon 識別字串（如 heroicons: 'check-circle'）
--   badge_text      徽章 / 標籤短文字
--   stat_item       統計項目（數值 + 標籤，JSON: {value, label, unit}）
--   feature_item    功能項目（icon + title + desc，JSON）
--   testimonial_item 客戶見證（quote + author + role + avatar_url，JSON）
--   faq_item        FAQ 條目（question + answer，JSON）
--   json_array      通用 JSON 陣列（最彈性，自訂結構）
-- ============================================================
CREATE TABLE IF NOT EXISTS lp_template_fields (
    id                      BIGSERIAL       PRIMARY KEY,
    template_id             BIGINT          NOT NULL REFERENCES lp_templates(id) ON DELETE CASCADE,
    section_id              BIGINT          REFERENCES lp_template_sections(id) ON DELETE SET NULL,

    -- 識別
    field_key               VARCHAR(160)    NOT NULL,   -- dot-notation: 'hero.title', 'features.item_001.icon'
    field_label             VARCHAR(255)    NOT NULL,   -- 後台 UI 標籤

    -- 型別
    field_kind              VARCHAR(64)     NOT NULL,   -- 見上方說明
    data_type               VARCHAR(32)     NOT NULL DEFAULT 'string',
    -- 實際儲存型別: 'string', 'text', 'number', 'boolean', 'json', 'url'
    content_group           VARCHAR(64)     NOT NULL,
    -- 同 section_type 相似: 'hero', 'nav', 'seo', 'brand', 'media', 'content', 'price', 'cta', 'option', 'form', 'footer'
    field_category          VARCHAR(64),
    -- UI 分組標籤（供後台編輯 UI 分 Tab 顯示）:
    -- 'typography', 'media', 'color', 'layout', 'interaction', 'seo', 'commerce'

    -- 預設值與提示
    default_value           TEXT,           -- 模板預設文字內容
    placeholder_text        TEXT,           -- input placeholder
    help_text               TEXT,           -- 說明文字（後台 tooltip）

    -- 驗證規則（JSONB，依 field_kind 而異）
    -- cloudinary_image 範例: {"allowed_formats": ["jpg","png","webp"], "max_size_kb": 2048}
    -- url 範例: {"pattern": "^https://"}
    -- number 範例: {"min": 0, "max": 9999, "step": 1}
    -- plain_text 範例: {"max_length": 120}
    validation_rules        JSONB           NOT NULL DEFAULT '{}'::JSONB,

    -- 來源追蹤（Python 分析時的路徑）
    source_path             VARCHAR(255),   -- 'headings.h1[0]', 'hero.hero_title'

    -- JSX 整合
    jsx_prop_path           VARCHAR(255),   -- JSX component prop 路徑: 'hero.title', 'sections[0].cta.label'

    -- 行為旗標
    sort_order              INTEGER         NOT NULL DEFAULT 0,
    is_required             BOOLEAN         NOT NULL DEFAULT FALSE,
    is_repeatable           BOOLEAN         NOT NULL DEFAULT FALSE,  -- 可新增多列（如 nav items / FAQ）
    is_visible              BOOLEAN         NOT NULL DEFAULT TRUE,   -- 後台是否顯示此欄位

    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (template_id, field_key)
);

COMMENT ON TABLE lp_template_fields IS 'Landing Page 模板的可編輯欄位定義';
COMMENT ON COLUMN lp_template_fields.field_kind IS '欄位種類，cloudinary_image 表示此欄位應存 Cloudinary URL';
COMMENT ON COLUMN lp_template_fields.jsx_prop_path IS 'JSX 元件接收此欄位的 prop 路徑';


-- ============================================================
-- 四、lp_template_field_options — 欄位選項定義
--
-- 用於 select / option_group 類型的欄位（如顏色選擇、尺寸、方案等）。
-- thumbnail_url 可存 Cloudinary 色塊圖或產品選項圖，純 URL。
-- ============================================================
CREATE TABLE IF NOT EXISTS lp_template_field_options (
    id                      BIGSERIAL       PRIMARY KEY,
    field_id                BIGINT          NOT NULL REFERENCES lp_template_fields(id) ON DELETE CASCADE,

    option_key              VARCHAR(128)    NOT NULL,   -- 'option_001', 'black', 'plan_pro'
    option_label            VARCHAR(255)    NOT NULL,   -- 顯示文字

    -- 價格差異（可選，例如 '+$50', '-10%'）
    price_delta_text        VARCHAR(128),

    -- 額外資料（顏色值、尺寸規格等）
    option_value_json       JSONB           NOT NULL DEFAULT '{}'::JSONB,
    -- 範例（顏色選項）: {"hex": "#ef4444", "label_en": "Red"}
    -- 範例（尺寸選項）: {"width_mm": 300, "weight_g": 1200}

    -- 視覺縮圖（Cloudinary URL，如顏色樣本圖、選項產品圖）
    thumbnail_url           TEXT,           -- Cloudinary URL，禁止存二進位

    sort_order              INTEGER         NOT NULL DEFAULT 0,
    is_default              BOOLEAN         NOT NULL DEFAULT FALSE,

    UNIQUE (field_id, option_key)
);

COMMENT ON TABLE lp_template_field_options IS 'select/option_group 欄位的選項定義';
COMMENT ON COLUMN lp_template_field_options.thumbnail_url IS 'Cloudinary 選項縮圖（色塊圖/產品圖），只存 URL';


-- ============================================================
-- 五、lp_projects — 客戶 / 課程專案實例
--
-- 每個上線的 Landing Page 是一個 project，基於某個 template。
-- 關聯 courses.id 讓課程 Landing Page 與課程資料庫同步。
-- 媒體欄位（hero_image_url / logo_url / og_image_url）全為 Cloudinary URL。
-- custom_slug 決定前端路由，例如 /lp/變現陪跑
-- ============================================================
CREATE TABLE IF NOT EXISTS lp_projects (
    id                      BIGSERIAL       PRIMARY KEY,
    template_id             BIGINT          NOT NULL REFERENCES lp_templates(id) ON DELETE RESTRICT,

    -- 識別
    project_code            VARCHAR(64)     NOT NULL UNIQUE,  -- 'LP_COURSE_001', 'LP_PROMO_2026Q2'
    project_name            VARCHAR(255)    NOT NULL,         -- 後台顯示名稱
    customer_name           VARCHAR(255),                     -- 客戶 / 業主名稱

    -- 課程連結（可選，Landing Page 如果是課程銷售頁則關聯）
    course_id               BIGINT          REFERENCES courses(course_id) ON DELETE SET NULL,

    -- 語系
    locale                  VARCHAR(16)     NOT NULL DEFAULT 'zh-Hant',

    -- 主題圖片（Cloudinary URL，全部禁止存二進位）
    hero_image_url          TEXT,           -- Hero 背景大圖（Cloudinary URL）
    logo_url                TEXT,           -- 品牌 Logo（Cloudinary URL）
    og_image_url            TEXT,           -- Open Graph 分享圖（Cloudinary URL，建議 1200x630）
    favicon_url             TEXT,           -- Favicon（Cloudinary URL）

    -- SEO
    custom_slug             VARCHAR(255)    UNIQUE,           -- URL slug，例如 'bianxian-peipao'
    seo_title               TEXT,
    seo_description         TEXT,
    seo_keywords            TEXT[],

    -- Open Graph
    og_title                TEXT,
    og_description          TEXT,

    -- 狀態
    status                  VARCHAR(32)     NOT NULL DEFAULT 'draft',
    published_at            TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,    -- 可選，活動結束日期

    -- 額外設定（主題覆寫、Analytics 等）
    settings_json           JSONB           NOT NULL DEFAULT '{}'::JSONB,
    -- 範例: {"ga4_id": "G-XXXXXX", "fb_pixel": "1234567", "color_override": {"--accent": "#00f3ff"}}

    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CHECK (status IN ('draft', 'review', 'published', 'archived'))
);

COMMENT ON TABLE lp_projects IS 'Landing Page 專案實例，每個上線頁面一列';
COMMENT ON COLUMN lp_projects.hero_image_url IS 'Cloudinary URL，禁止存二進位';
COMMENT ON COLUMN lp_projects.logo_url       IS 'Cloudinary URL，禁止存二進位';
COMMENT ON COLUMN lp_projects.og_image_url   IS 'Cloudinary URL，建議 1200x630 px';


-- ============================================================
-- 六、lp_project_field_values — 專案欄位覆寫值
--
-- 只有跟模板預設值不同的欄位才需要在此建立一列（稀疏儲存）。
-- cloudinary_url   : 圖片 / 影片欄位存 Cloudinary URL（TEXT），禁止二進位
-- cloudinary_public_id : Cloudinary public_id，供管理（刪除/替換）時使用
-- value_text       : 文字 / 數字 / 顏色等純字串值
-- value_json       : JSON 類型欄位（stat_item / feature_item / json_array 等）
-- ============================================================
CREATE TABLE IF NOT EXISTS lp_project_field_values (
    id                      BIGSERIAL       PRIMARY KEY,
    project_id              BIGINT          NOT NULL REFERENCES lp_projects(id) ON DELETE CASCADE,
    field_id                BIGINT          NOT NULL REFERENCES lp_template_fields(id) ON DELETE CASCADE,

    -- 文字 / 數字 / URL / 顏色等純字串值
    value_text              TEXT,

    -- JSON 複合值（stat_item / feature_item / json_array 等）
    value_json              JSONB           NOT NULL DEFAULT '{}'::JSONB,

    -- 圖片 / 影片媒體（Cloudinary URL，不存二進位）
    cloudinary_url          TEXT,           -- Cloudinary 完整 URL
    cloudinary_public_id    TEXT,           -- Cloudinary public_id（供後台管理用）

    -- 重複欄位的排序（is_repeatable=TRUE 時，同 field_id 可有多列）
    sort_order              INTEGER         NOT NULL DEFAULT 0,

    -- 異動追蹤
    updated_by              VARCHAR(128),

    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, field_id, sort_order)
);

COMMENT ON TABLE lp_project_field_values IS '專案欄位覆寫值，只存與模板預設不同的欄位';
COMMENT ON COLUMN lp_project_field_values.cloudinary_url       IS 'Cloudinary 圖片/影片 URL，禁止存二進位';
COMMENT ON COLUMN lp_project_field_values.cloudinary_public_id IS 'Cloudinary public_id，供刪除/替換管理用';


-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lp_templates_page_kind
    ON lp_templates(page_kind, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_lp_templates_category_tags
    ON lp_templates USING GIN(category_tags);

CREATE INDEX IF NOT EXISTS idx_lp_templates_jsx_component_key
    ON lp_templates(jsx_component_key)
    WHERE jsx_component_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lp_template_sections_template_id
    ON lp_template_sections(template_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_lp_template_fields_template_id
    ON lp_template_fields(template_id, content_group, sort_order);

CREATE INDEX IF NOT EXISTS idx_lp_template_fields_section_id
    ON lp_template_fields(section_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_lp_template_fields_field_kind
    ON lp_template_fields(field_kind)
    WHERE field_kind IN ('cloudinary_image', 'cloudinary_video');

CREATE INDEX IF NOT EXISTS idx_lp_template_field_options_field_id
    ON lp_template_field_options(field_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_lp_projects_template_id
    ON lp_projects(template_id, status);

CREATE INDEX IF NOT EXISTS idx_lp_projects_course_id
    ON lp_projects(course_id)
    WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lp_projects_custom_slug
    ON lp_projects(custom_slug)
    WHERE custom_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lp_projects_status
    ON lp_projects(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_lp_project_field_values_project_id
    ON lp_project_field_values(project_id, field_id);


-- ============================================================
-- View: vw_lp_project_resolved_fields
-- 解析後的欄位值視圖：優先取專案覆寫值，否則 fallback 至模板預設值
-- cloudinary_url 欄位同樣套用 COALESCE fallback
-- ============================================================
CREATE OR REPLACE VIEW vw_lp_project_resolved_fields AS
SELECT
    p.id                                            AS project_id,
    p.project_code,
    p.status                                        AS project_status,
    t.id                                            AS template_id,
    t.template_code,
    t.jsx_component_key,
    s.section_key,
    s.section_type,
    f.id                                            AS field_id,
    f.field_key,
    f.field_label,
    f.field_kind,
    f.data_type,
    f.content_group,
    f.field_category,
    f.jsx_prop_path,
    f.is_required,
    f.is_repeatable,
    -- 文字值：優先取專案值，fallback 模板預設
    COALESCE(v.value_text, f.default_value)         AS resolved_text,
    -- JSON 值：若專案有值則取專案值，否則取 validation_rules（因 default 是純文字）
    CASE
        WHEN v.value_json != '{}'::JSONB THEN v.value_json
        ELSE f.validation_rules
    END                                             AS resolved_json,
    -- Cloudinary URL：優先取專案覆寫值
    v.cloudinary_url,
    v.cloudinary_public_id,
    v.sort_order                                    AS value_sort_order,
    f.sort_order                                    AS field_sort_order
FROM lp_projects AS p
JOIN lp_templates AS t
    ON t.id = p.template_id
JOIN lp_template_fields AS f
    ON f.template_id = t.id
LEFT JOIN lp_template_sections AS s
    ON s.id = f.section_id
LEFT JOIN lp_project_field_values AS v
    ON v.project_id = p.id
   AND v.field_id = f.id;

COMMENT ON VIEW vw_lp_project_resolved_fields IS
'解析後的 Landing Page 欄位值，cloudinary_url 為圖片 URL（非二進位）';


-- ============================================================
-- Triggers: updated_at 自動更新
-- ============================================================
DROP TRIGGER IF EXISTS trg_lp_templates_updated_at ON lp_templates;
CREATE TRIGGER trg_lp_templates_updated_at
    BEFORE UPDATE ON lp_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_lp_template_fields_updated_at ON lp_template_fields;
CREATE TRIGGER trg_lp_template_fields_updated_at
    BEFORE UPDATE ON lp_template_fields
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_lp_projects_updated_at ON lp_projects;
CREATE TRIGGER trg_lp_projects_updated_at
    BEFORE UPDATE ON lp_projects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_lp_project_field_values_updated_at ON lp_project_field_values;
CREATE TRIGGER trg_lp_project_field_values_updated_at
    BEFORE UPDATE ON lp_project_field_values
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- RLS（Row Level Security）
-- 讀取：所有人可讀已啟用的模板 + 已發布的專案
-- 寫入：僅管理員（is_admin() 來自 Migration 009）
-- ============================================================

-- lp_templates
ALTER TABLE lp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active templates" ON lp_templates;
CREATE POLICY "Public read active templates"
    ON lp_templates FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access templates" ON lp_templates;
CREATE POLICY "Admin full access templates"
    ON lp_templates FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- lp_template_sections
ALTER TABLE lp_template_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read sections" ON lp_template_sections;
CREATE POLICY "Public read sections"
    ON lp_template_sections FOR SELECT
    USING (
        template_id IN (SELECT id FROM lp_templates WHERE is_active = TRUE)
    );

DROP POLICY IF EXISTS "Admin full access sections" ON lp_template_sections;
CREATE POLICY "Admin full access sections"
    ON lp_template_sections FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- lp_template_fields
ALTER TABLE lp_template_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read fields" ON lp_template_fields;
CREATE POLICY "Public read fields"
    ON lp_template_fields FOR SELECT
    USING (
        is_visible = TRUE
        AND template_id IN (SELECT id FROM lp_templates WHERE is_active = TRUE)
    );

DROP POLICY IF EXISTS "Admin full access fields" ON lp_template_fields;
CREATE POLICY "Admin full access fields"
    ON lp_template_fields FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- lp_template_field_options
ALTER TABLE lp_template_field_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read field options" ON lp_template_field_options;
CREATE POLICY "Public read field options"
    ON lp_template_field_options FOR SELECT
    USING (
        field_id IN (
            SELECT f.id FROM lp_template_fields f
            JOIN lp_templates t ON t.id = f.template_id
            WHERE f.is_visible = TRUE AND t.is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Admin full access field options" ON lp_template_field_options;
CREATE POLICY "Admin full access field options"
    ON lp_template_field_options FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- lp_projects
ALTER TABLE lp_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published projects" ON lp_projects;
CREATE POLICY "Public read published projects"
    ON lp_projects FOR SELECT
    USING (status = 'published');

DROP POLICY IF EXISTS "Admin full access projects" ON lp_projects;
CREATE POLICY "Admin full access projects"
    ON lp_projects FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- lp_project_field_values
ALTER TABLE lp_project_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published project values" ON lp_project_field_values;
CREATE POLICY "Public read published project values"
    ON lp_project_field_values FOR SELECT
    USING (
        project_id IN (SELECT id FROM lp_projects WHERE status = 'published')
    );

DROP POLICY IF EXISTS "Admin full access project values" ON lp_project_field_values;
CREATE POLICY "Admin full access project values"
    ON lp_project_field_values FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ============================================================
-- field_kind 參考值（儲存於 comment，不用 ENUM 以保留彈性）
-- ============================================================
COMMENT ON COLUMN lp_template_fields.field_kind IS
'欄位種類:
  plain_text       — 單行文字
  long_text        — 多行文字
  rich_text        — 富文字（HTML）
  url              — URL 字串
  cloudinary_image — Cloudinary 圖片 URL（不存二進位）
  cloudinary_video — Cloudinary 影片 URL（不存二進位）
  color_hex        — CSS 顏色值
  number           — 數值
  boolean          — 開關
  select           — 單選（配合 field_options）
  option_group     — 多選規格群組（顏色/尺寸/方案）
  form_input       — 表單欄位描述器
  price_text       — 價格文字（NT$32,800）
  cta_label        — CTA 按鈕文案
  icon_name        — Icon 識別字串
  badge_text       — 徽章短文字
  stat_item        — 統計項目 JSON {value, label, unit}
  feature_item     — 功能項目 JSON {icon, title, desc}
  testimonial_item — 客戶見證 JSON {quote, author, role, avatar_url}
  faq_item         — FAQ JSON {question, answer}
  json_array       — 通用 JSON 陣列';

COMMIT;
