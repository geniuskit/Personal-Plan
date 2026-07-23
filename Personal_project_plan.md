# 個人專案管理系統 — 設計計畫

## Context

在既有「每日執行計畫」網頁（Vue 3 + Vite + Tailwind + Supabase，hash router、底部 NavBar）之上，
新增一套「個人專案管理系統」，用來追蹤跨日的長期專案（英文、資訊、財務、閱讀、實作…）。

- **共用**：同一個 GitHub repo、同一個 GitHub Pages 網站、同一個 Supabase DB。
- **不變動**：既有「每日執行計畫」頁面完全不動。
- **整合**：新系統為同一個 SPA 內的新區塊（新增 `/pm/...` 路由），並在導覽列彼此加連結。
- **命名**：新資料表一律加 `pm_` 前綴，避免與舊表（`daily_records`、`activity_templates`、`daily_learning_entries`…）衝突。

---

## 資料階層

```
分類 Category (英文 / 資訊 / 財務 / 閱讀 / 實作，可自行維護)
  └── 專案 Project              ← 規格書「project items」主檔
        ├── 歷程 Log            ← 「project歷程」每日學習紀錄（同日可多筆）
        ├── 階段 Session        ← 「project session」
        │     └── 細項 Detail   ← 「Session歷程」內容細項
        └── 檢討 Review         ← 「project review」（保留多筆歷史）
```

---

## 已定案的四項決策

1. **時數**：拆成結構化欄位（數值＋單位＋內容），同日可多筆 → 可自動統計總時數。
2. **Review**：每個專案保留多筆歷史。
3. **長草日**：簡化版 → `進行中` 才計算＝今天−最後更新日；`暫擱` 不顯示、不累計。
4. **分類**：使用者可自行維護（新增/改名/排序/刪除）。

---

## 資料庫 Schema（Supabase / PostgreSQL）

```sql
-- 1. 分類
CREATE TABLE pm_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- 英文 / 資訊 / 財務 / 閱讀 / 實作
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 專案主檔（對應 project items）
CREATE TABLE pm_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES pm_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,                 -- 專案名（英文文法 / EIP系統…）
  deadline_days INT,                  -- 期限天數（90 / 30）
  daily_min_unit TEXT,               -- 每日最小單位（>1hr / >1單元 / >2項目），多行文字
  description TEXT,                   -- 說明
  start_date DATE,                    -- 專案開始日
  end_date DATE,                      -- 專案完成日
  status SMALLINT NOT NULL DEFAULT 0, -- 0未啟動 1進行中 2暫擱 3結案 4棄置
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pm_projects_status ON pm_projects(status);

-- 3. 專案歷程（對應 project歷程）
--    1 專案 → 多歷程；每筆歷程有「第幾天(day_number)」欄位，
--    同一 day_number 可對應多筆日期（未達每日最小單位時，多日合併算同一天）。
--    day_number / log_date / content 皆由使用者手動維護。
CREATE TABLE pm_project_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  day_number INT,                     -- 專案第幾天（手動；多筆日期可共用同一天數）
  log_date DATE,                      -- 日期（手動）
  duration_min INT,                   -- 時數（存分鐘，1hr=60；可空）
  item_count INT,                     -- 項目／單元個數（可空）
  content TEXT,                       -- 內容（動詞時態題庫*旋元佑…）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pm_logs_project_day ON pm_project_logs(project_id, day_number);

-- 4. 階段（對應 project session）
CREATE TABLE pm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                 -- 動詞時態 / 平台評估…
  status SMALLINT NOT NULL DEFAULT 0, -- 0未啟動 1進行中 2暫擱 3完成 4棄置
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pm_sessions_project ON pm_sessions(project_id);

-- 5. 細項（對應 Session歷程）
CREATE TABLE pm_session_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES pm_sessions(id) ON DELETE CASCADE,
  detail_name TEXT,                   -- 內容細項（ooo1 / xxx1…，可空）
  start_date DATE,
  end_date DATE,
  status SMALLINT NOT NULL DEFAULT 0, -- 0未啟動 1進行中 2暫擱 3完成 4棄置
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pm_details_session ON pm_session_details(session_id);

-- 6. 檢討（對應 project review）— 多筆歷史
CREATE TABLE pm_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  review_date DATE,                   -- review 日期
  next_review_date DATE,              -- 預計下次 review 日期
  content TEXT,                       -- review 內容
  core_result TEXT,                   -- 我想達成的核心結果
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pm_reviews_project ON pm_reviews(project_id);

-- RLS（沿用既有系統的公開政策）
ALTER TABLE pm_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_project_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_session_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_reviews          ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON pm_categories      FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_projects        FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_project_logs    FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_sessions        FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_session_details FOR ALL USING (true);
CREATE POLICY "allow all" ON pm_reviews         FOR ALL USING (true);

-- 預設分類
INSERT INTO pm_categories (name, sort_order) VALUES
  ('英文', 1), ('資訊', 2), ('財務', 3), ('閱讀', 4), ('實作', 5);
```

---

## 自動計算欄位（不另存，前端即時計算）

| 顯示項目 | 計算方式 |
|---|---|
| 已學習日數 | 該專案 `pm_project_logs` 的**不重複 day_number 數**（day_number 由使用者手動填） |
| **各 project item 總時數** | **以 project item 為單位**加總其 `duration_min`，換算 hr，顯示於各專案卡片。**這是主要要看的數字**（不做跨專案的單一大加總） |
| 累積項目數 | 該專案 `item_count` 加總 |
| Last Updated | 該專案 `pm_project_logs` 的 **max(log_date)** |
| Sessions 數 | 該專案 `pm_sessions` 的筆數 |
| 階段 Progress | 該階段細項中 `status=3(完成)` 數 / `status≠4(未棄置)` 細項數 |
| 專案 Progress（Dashboard） | 該專案**所有階段細項**：完成數合計 / 未棄置細項數合計（EIP＝0/5 即此邏輯） |
| 分類小計（選用） | 各分類底下進行中 project item 的總時數加總，顯示於分類標題；**如不需要可省略** |
| 長草日 | 若 `status=1進行中`：今天 − Last Updated（天）；`暫擱` 不顯示 |

> 註 1：`day_number`（第幾天）、`log_date`（日期）、`content`（內容）皆由使用者手動維護；系統只做**時數／項目數的加總**。
> 註 1-0：**維護以單筆為單位（一日期一列），顯示則依 `day_number` 分組合併**——同天數的多筆日期，其時數/項目數加總、日期與內容合併呈現於同一列。
> 註 1-1：新增歷程時，`day_number` 會**自動帶入該專案目前最大天數**（若當日累積已達每日最小單位，可手動 +1；未達則沿用同一天數合併），使用者仍可自行修改。
> 註 2：狀態一律**手動**設定。即使把整個專案 `status` 改成結案，也**不會**連動變更階段/細項的狀態。Progress 僅為顯示用計算，不回寫狀態。

---

## 頁面與功能

> 設計原則（第 6 點）：**歷程、階段各自有獨立的「增刪修查」頁面**；主頁 Dashboard 只做**整合顯示**、不在上面做完整編輯。

### 路由（新增，皆掛 `/pm` 前綴）
```
/pm            → PM 主頁（簡潔 Dashboard，只顯示進行中；純顯示）
/pm/logs       → 歷程管理（獨立 CRUD；類別→專案；≥20 筆最近歷程）
/pm/sessions   → 階段管理（獨立 CRUD；類別→專案；Session＋細項）
/pm/manage     → 專案維護（專案主檔清單＋狀態＋檢討，依狀態分區）
/pm/categories → 分類管理
```
PM 區塊內有自己的**頂部次選單**（主頁 / 歷程 / 階段 / 維護 / 分類）切換，底部 NavBar 只保留一個「🎯 專案」頁籤，維持乾淨。

### 1. PM 主頁 `/pm`（簡潔 Dashboard，純顯示；額外功能 #1、#3、#4）
- 依**分類分組**，每組只列 `進行中` 專案。
- 專案卡片（乾淨為主）：專案名、Progress（完成細項/總細項）、長草日、每日最小單位、**該專案總時數（hr）**、累積項目數。
- 時數以「分類 → project item」層級呈現，**每個 project item 顯示自己的總時數**；**不做**跨專案的單一大加總（分類小計為選用，預設不放）。
- 卡片有 **`＋/−` 展開/收縮**，展開後**整合顯示**該專案的階段(Session) 進度與**最近 5 個天數的歷程**（同天數合併顯示；要新增/編輯 → 到「歷程管理」或「階段管理」）。

### 2. 歷程管理 `/pm/logs`（獨立 CRUD；第 1.1、5、6 點）
- 先選**大類別 → 專案**（逐一查看）。
- **顯示（合併模式，預設）**：以 `day_number`（天數）**分組合併**顯示——同一天數的多筆日期資料，其**日期、時數、項目數、內容合併呈現於同一列**（時數/項目數加總、日期與內容並列），依天數**由大到小**排序，一次至少顯示**最近 20 個天數**。
- **維護（逐筆模式）**：新增/編輯/刪除仍以**單筆**（一個日期一列）為單位。可在合併列上展開該天數底下的各筆明細進行編輯。
- 新增時 `day_number` **自動帶入目前最大天數**，可自行修改（同天數可對應多筆日期）。
- 底部彙總：該專案累積總時數、累積項目數、已學習日數（=不重複天數）。

### 3. 階段管理 `/pm/sessions`（獨立 CRUD；第 6 點）
- 先選**大類別 → 專案**。
- 管理該專案的 **Session**（增刪修查、狀態、排序）與其 **細項**（內容細項、開始/完成日、狀態）。
- 即時顯示各 Session 的 Progress（完成細項/未棄置細項）。

### 4. 專案維護 `/pm/manage`（專案主檔；額外功能 #3）
- 全部專案依 `status`（未啟動/進行中/暫擱/結案/棄置）**分區顯示**。
- 專案主檔 CRUD：分類、期限天數、每日最小單位、說明、開始/完成日、狀態切換。
- **檢討 Review**：每個專案可展開多筆 review 歷史（review 日期、下次日期、內容、核心結果）。

### 5. 分類管理 `/pm/categories`
- `pm_categories` CRUD：新增/改名/排序/刪除。

### 6. 導覽整合
- 既有底部 NavBar 增加一個「🎯 專案」頁籤指向 `/pm`。
- PM 區塊頂部次選單提供 主頁/歷程/階段/維護/分類 切換，並含一個「📋 每日計畫」連結指回既有 Dashboard `/`。
- 既有「每日執行計畫」頁面與資料表完全不變動。

---

## 待建置檔案清單（本階段先不動工）

```
src/main.js                          # 加 /pm 路由
src/components/NavBar.vue             # 加「🎯 專案」頁籤
src/components/PmSubNav.vue           # PM 區塊頂部次選單（主頁/歷程/階段/維護/分類 + 回每日計畫）
src/composables/usePmProjects.js     # 專案主檔 + 分類 CRUD、彙總計算（總時數/項目數/長草日）
src/composables/usePmLogs.js         # 歷程 CRUD、day_number 自動帶入
src/composables/usePmSessions.js     # 階段 + 細項 CRUD、Progress 計算
src/composables/usePmReviews.js      # 檢討 CRUD
src/views/PmDashboardView.vue        # 1. 主頁（簡潔，純顯示）
src/views/PmLogsView.vue             # 2. 歷程管理（獨立 CRUD，≥20筆）
src/views/PmSessionsView.vue         # 3. 階段管理（獨立 CRUD）
src/views/PmManageView.vue           # 4. 專案維護（主檔＋狀態＋檢討）
src/views/PmCategoriesView.vue       # 5. 分類管理
src/components/PmProjectCard.vue      # 主頁專案卡片（可展開，整合顯示階段＋最近5筆歷程）
src/components/PmProjectPicker.vue    # 類別→專案 選擇器（歷程/階段頁共用）
src/components/PmSessionBlock.vue     # 階段+細項編輯區塊
```

---

## 驗證方式（建置後）
1. 在 Supabase 執行上述 SQL，確認六張表與預設分類建立成功。
2. `npm run dev` 本機啟動，於 `/pm` 新增專案、歷程、階段、細項，確認 Progress、總時數、長草日計算正確。
3. 確認主頁只顯示進行中、維護頁依狀態分區。
4. 確認 NavBar 可在「每日計畫」與「專案」之間切換，舊頁面行為不變。
5. 手機響應式測試 → push GitHub 確認 Actions 部署成功。
