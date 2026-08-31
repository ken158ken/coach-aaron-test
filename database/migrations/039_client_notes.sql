-- =====================================================
-- 039: 客戶筆記本（阿倫 × 客戶「雙人共筆」，Notion 式頁面樹 + /database 看板）
-- 請貼到 Supabase Dashboard SQL Editor 執行（冪等，可重跑）
-- =====================================================
--
-- 權限模型（應用層執行，見 backend/routes/notes.ts）：
--   - coach 本人 / admin_whitelist → 所有筆記本完全存取
--   - 客戶 → 僅 client_user_id = 自己的筆記本，且該 course_id 在
--     user_courses 有有效授權（is_active 且未過期）。
--     金流未接前由 admin 以 POST /api/notes/admin/grant-course 手動開通
--     （= fake 購買；之後真結帳寫同一張 user_courses，流程不變）。
--
-- 設計要點：
--   - ancestors BIGINT[]：祖先路徑（root→parent 順序）。分享繼承、麵包屑、
--     子樹查詢（GIN @>）都靠它，PostgREST 不用遞迴 CTE。搬移頁面時由後端重寫。
--   - type='database' 的頁面：categories JSONB 存有序分類 [{id,name,color}]，
--     其子頁用 category_id 對應 → 看板分組。刻意只做「單一 select」不做屬性系統。
--   - content JSONB：BlockNote 文件（JSON block 陣列），非 HTML。
--   - version：內容樂觀鎖（雙人共筆撞寫 → 409 提示重載，不做即時協作）。
--   - 軟刪除 deleted_at；notebooks 的 (client,course) 唯一性用部分索引，
--     軟刪後可重建同組合。

CREATE TABLE IF NOT EXISTS notebooks (
  id              BIGSERIAL PRIMARY KEY,
  client_user_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id       INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT '',
  root_page_id    BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notebooks_client_course
  ON notebooks(client_user_id, course_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS note_pages (
  id           BIGSERIAL PRIMARY KEY,
  notebook_id  BIGINT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  parent_id    BIGINT REFERENCES note_pages(id) ON DELETE CASCADE,
  ancestors    BIGINT[] NOT NULL DEFAULT '{}',
  type         VARCHAR(10) NOT NULL DEFAULT 'page' CHECK (type IN ('page','database')),
  title        TEXT NOT NULL DEFAULT '',
  icon         TEXT,
  content      JSONB,
  categories   JSONB,
  category_id  TEXT,
  sort_order   DOUBLE PRECISION NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL DEFAULT 1,
  created_by   INTEGER,
  updated_by   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_note_pages_notebook
  ON note_pages(notebook_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_note_pages_parent ON note_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_note_pages_anc ON note_pages USING GIN(ancestors);
CREATE INDEX IF NOT EXISTS idx_notebooks_client
  ON notebooks(client_user_id) WHERE deleted_at IS NULL;
