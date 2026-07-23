-- ============================================================
-- 個人專案管理系統（PM）— Supabase / PostgreSQL Schema
-- 與既有「每日執行計畫」共用同一個 DB，資料表一律加 pm_ 前綴。
-- 在 Supabase SQL Editor 執行一次即可。
-- ============================================================

-- 1. 分類
CREATE TABLE IF NOT EXISTS pm_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- 英文 / 資訊 / 財務 / 閱讀 / 實作
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 專案主檔（對應 project items）
CREATE TABLE IF NOT EXISTS pm_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES pm_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  deadline_days INT,                  -- 期限天數
  daily_min_unit TEXT,               -- 每日最小單位（>1hr / >1單元 / >2項目）
  description TEXT,                   -- 說明
  start_date DATE,                    -- 專案開始日
  end_date DATE,                      -- 專案完成日
  status SMALLINT NOT NULL DEFAULT 0, -- 0未啟動 1進行中 2暫擱 3結案 4棄置
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pm_projects_status ON pm_projects(status);

-- 3. 專案歷程（對應 project歷程）— 1 專案對多歷程，同天數可多筆日期
CREATE TABLE IF NOT EXISTS pm_project_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  day_number INT,                     -- 專案第幾天（手動；多筆日期可共用同一天數）
  log_date DATE,                      -- 日期（手動）
  duration_min INT,                   -- 時數（存分鐘，1hr=60）
  item_count INT,                     -- 項目／單元個數
  content TEXT,                       -- 內容
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pm_logs_project_day ON pm_project_logs(project_id, day_number);

-- 4. 階段（對應 project session）
CREATE TABLE IF NOT EXISTS pm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0, -- 0未啟動 1進行中 2暫擱 3完成 4棄置
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pm_sessions_project ON pm_sessions(project_id);

-- 5. 細項（對應 Session歷程）
CREATE TABLE IF NOT EXISTS pm_session_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES pm_sessions(id) ON DELETE CASCADE,
  detail_name TEXT,
  start_date DATE,
  end_date DATE,
  status SMALLINT NOT NULL DEFAULT 0, -- 0未啟動 1進行中 2暫擱 3完成 4棄置
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pm_details_session ON pm_session_details(session_id);

-- 6. 檢討（對應 project review）— 多筆歷史
CREATE TABLE IF NOT EXISTS pm_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  review_date DATE,
  next_review_date DATE,
  content TEXT,
  core_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pm_reviews_project ON pm_reviews(project_id);

-- RLS（沿用既有系統的公開政策；正式部署可改為 auth.uid() 綁定）
ALTER TABLE pm_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_project_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_session_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_reviews          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all" ON pm_categories;
DROP POLICY IF EXISTS "allow all" ON pm_projects;
DROP POLICY IF EXISTS "allow all" ON pm_project_logs;
DROP POLICY IF EXISTS "allow all" ON pm_sessions;
DROP POLICY IF EXISTS "allow all" ON pm_session_details;
DROP POLICY IF EXISTS "allow all" ON pm_reviews;
CREATE POLICY "allow all" ON pm_categories      FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_projects        FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_project_logs    FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_sessions        FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_session_details FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_reviews         FOR ALL USING (true);

-- 預設分類（重複執行不會出錯）
INSERT INTO pm_categories (name, sort_order) VALUES
  ('英文', 1), ('資訊', 2), ('財務', 3), ('閱讀', 4), ('實作', 5)
ON CONFLICT (name) DO NOTHING;
