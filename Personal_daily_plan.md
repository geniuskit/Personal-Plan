# 每日執行計畫網頁 — 實作計畫

## Context

使用者需要一個可在 GitHub Pages 運行、手機友善的每日執行計畫追蹤網頁。
資料庫使用 Supabase，需支援 CRUD、儀表板、日曆熱點、歷史查詢等功能。
現有專案 `D:\Project\Claude` 幾乎是空的，從零開始建置。

---

## 技術選型

| 項目 | 選擇 | 理由 |
|------|------|------|
| 框架 | Vue 3 + Vite | 使用者熟悉，已有相關專案 |
| 樣式 | Tailwind CSS v3 | 快速開發、手機響應式 |
| 資料庫 | Supabase (JS Client) | 使用者指定 |
| 日曆 | 自製輕量 Calendar 元件 | 避免重型依賴，精確控制點點樣式 |
| 部署 | GitHub Pages + `gh-pages` 套件 | 靜態部署，無後端 |
| 環境變數 | `.env` + GitHub Actions secrets | Supabase key 不外洩 |

---

## 資料庫 Schema

### Table 1: `activity_templates`（活動項目定義）
```sql
CREATE TABLE activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  default_unit TEXT NOT NULL DEFAULT 'hr',  -- hr / min / 次
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 預設資料
INSERT INTO activity_templates (name, default_unit, sort_order) VALUES
  ('學習', 'hr', 1),
  ('閱讀', 'hr', 2),
  ('重訓', '次', 3),
  ('有氧', 'min', 4);
```

### Table 2: `daily_records`（每日主記錄）
```sql
CREATE TABLE daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date DATE NOT NULL UNIQUE,
  priority_order TEXT,          -- 如 "工作>有氧>學習>閱讀"
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_records_date ON daily_records(record_date);
```

### Table 3: `activity_records`（每日各活動細項）
```sql
CREATE TABLE activity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_record_id UUID NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activity_templates(id) ON DELETE CASCADE,
  can_do BOOLEAN,               -- 今天能不能做
  high_target TEXT,             -- 高標 (如 ">1hr")
  mid_target TEXT,              -- 中標
  low_target TEXT,              -- 低標
  actual_result TEXT,           -- 實際達成
  unit TEXT NOT NULL DEFAULT 'hr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(daily_record_id, activity_id)
);
```

### RLS 建議（Row Level Security）
```sql
-- 開啟 RLS（建議搭配 Supabase Auth，或先用 anon key 公開讀寫測試）
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_records ENABLE ROW LEVEL SECURITY;

-- 簡易公開政策（測試用，正式部署請改為 auth.uid() 綁定）
CREATE POLICY "allow all" ON activity_templates FOR ALL USING (true);
CREATE POLICY "allow all" ON daily_records FOR ALL USING (true);
CREATE POLICY "allow all" ON activity_records FOR ALL USING (true);
```

---

## 頁面與功能設計

### 路由結構（Vue Router）
```
/           → 今日儀表板（Dashboard）
/edit/:date → 新增 / 編輯某天的計畫
/history    → 歷史查詢（含日曆 + 列表）
/settings   → 管理活動項目（activity_templates CRUD）
```

### 1. 今日儀表板（`/`）
- 今日日期 + 重點項目順序
- 每個活動卡片顯示：能/不能、高中低標、實際達成進度條
- 完成率 % 圓形進度指標
- 「編輯今日」快速按鈕

### 2. 新增/編輯頁（`/edit/:date`）
- 日期選擇器（預設今天）
- 重點項目順序輸入欄
- 每個活動：toggle 能/不能、高中低標輸入、實際達成輸入、單位選擇
- 儲存、刪除整天按鈕

### 3. 歷史查詢（`/history`）
- 月曆視圖（左右切換月份）：有資料的日期顯示藍點 ●
- 點擊日期 → 顯示該天詳情卡片
- 日期範圍搜尋（起訖日期 input）
- 列表呈現符合條件的每日摘要

### 4. 設定（`/settings`）
- 管理 activity_templates：新增/重新命名/調整順序/刪除
- 顯示 Supabase 連線狀態

### 額外功能（超出需求但實用）
- **連續達標天數（Streak）**：Dashboard 顯示連續 N 天有記錄
- **週/月完成率統計**：History 頁底部小圖表（用 CSS bar，不引入 chart.js）
- **PWA manifest**：`manifest.json` + icon，手機可加到主畫面
- **深色主題**：預設深色（如截圖風格）

---

## 專案目錄結構

```
D:\Project\Claude\
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自動部署
├── public/
│   ├── manifest.json
│   └── icon.png
└── src/
    ├── main.js
    ├── App.vue
    ├── router/index.js
    ├── lib/
    │   └── supabase.js         # Supabase client 初始化
    ├── composables/
    │   ├── useRecords.js       # CRUD for daily_records + activity_records
    │   └── useActivities.js    # CRUD for activity_templates
    ├── views/
    │   ├── DashboardView.vue
    │   ├── EditView.vue
    │   ├── HistoryView.vue
    │   └── SettingsView.vue
    └── components/
        ├── ActivityCard.vue    # 單一活動卡片（顯示用）
        ├── ActivityForm.vue    # 單一活動表單（編輯用）
        ├── MiniCalendar.vue    # 日曆元件（有資料天顯示點）
        └── NavBar.vue          # 底部導覽列（手機友善）
```

---

## 部署流程

1. GitHub repo 建立（可用現有 `D:\Project\Claude` push）
2. Supabase 建立專案 → 執行上述 SQL → 取得 URL + anon key
3. GitHub repo Settings → Secrets → 加入 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
4. GitHub Actions `deploy.yml` 自動 build → push 到 `gh-pages` branch
5. GitHub Pages 設定來源為 `gh-pages` branch

---

---

## 修改：「不能」狀態也顯示 x 欄位

### 問題
`ActivityCard.vue` 第 18 行用 `v-if="rec.can_do"` 把高中低標和實際達成整個隱藏，
導致「不能」的活動卡片只顯示一行標題，看不出 x 狀態。

### 修改 `src/components/ActivityCard.vue`
- 移除 `v-if="rec.can_do"`，改為**無條件顯示**高中低標 grid
- 當 `can_do = false` 時，三欄值顯示 `x`（灰色 `text-slate-500`）
- 右上角實際達成：`can_do = false` 時也顯示 `x`（灰色）
- 進度條維持 `v-if="rec.can_do && rec.actual_result"`（不能做就不顯示進度）

### 修改 `src/components/ActivityForm.vue`
- 維持 `v-if="modelValue.can_do"` 隱藏輸入欄（不能做時不需輸入目標）
- 新增：當 `can_do = false` 時，顯示一排靜態「x」提示，讓使用者看到目前狀態

---

---

## 新功能：每日學習閱讀日誌（簡化版）

### Context
使用者只需要紀錄「今天學了什麼、讀了什麼」，不需要進度條、結束日等複雜追蹤。
設計為純日誌模式：每天多筆、分學習/閱讀兩區顯示於 Dashboard、書單 tab 提供表格查詢。

**廢棄原有 `learning_items` 設計，改用 `daily_learning_entries`。**

---

### 資料庫 SQL

```sql
-- 先刪除舊的（若已建立）
DROP TABLE IF EXISTS learning_items;

-- 新建日誌表
CREATE TABLE daily_learning_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '學習',  -- 學習 / 閱讀
  status TEXT NOT NULL DEFAULT '進行中',  -- 預覽 / 進行中 / 完成 / 無
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_entry_date ON daily_learning_entries(entry_date);
ALTER TABLE daily_learning_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON daily_learning_entries FOR ALL USING (true);
```

---

### Composable：`src/composables/useLearning.js`（改寫）
- `fetchEntriesByDate(date)` – 取某天所有日誌
- `fetchEntriesByRange(from, to)` – 範圍查詢（書單頁用）
- `upsertEntry(fields)` – 新增或更新
- `deleteEntry(id)`

---

### Dashboard 新區塊（`DashboardView.vue`）
在活動卡片下方新增兩個分區：
- **今日學習**：category='學習' 的當日項目
- **今日閱讀**：category='閱讀' 的當日項目
- 每個 entry 顯示：標題、狀態 badge、備註
- 每區右上角有「+」可快速新增（帶入今日日期與對應 category）
- 資料從 `fetchEntriesByDate(today)` 取得

---

### 書單頁（`LearningView.vue`）（改寫）
**上方**
- 日期選擇器（預設今天）＋「搜尋」按鈕（可跨日查詢）
- 類別 tabs：全部 / 學習 / 閱讀
- 狀態篩選下拉：全部 / 進行中 / 預覽 / 完成 / 無
- 「+ 新增」按鈕

**表格欄位**（手機 = 卡片，桌面 = table）
| 日期 | 書名／課程 | 類別 | 狀態 | 備註 | 操作 |

**新增/編輯** Bottom Sheet Modal：
- 日期（預設今天）、類別（學習/閱讀）、狀態、標題、備註

---

### 修改檔案清單
1. `src/composables/useLearning.js` – 全部改寫
2. `src/views/LearningView.vue` – 全部改寫
3. `src/views/DashboardView.vue` – 更新書單區塊邏輯

---

## 舊版：學習書單／課程追蹤（已被上方取代，保留供參考）

### Context（舊）

### Context
使用者希望在既有的每日執行計畫之外，額外追蹤正在閱讀的書籍或進修的課程，
並讓 Dashboard 多一個專區顯示「進行中」的項目，查詢介面以表格呈現。

---

### 額外設計（超出需求但實用）
| 欄位 | 說明 |
|------|------|
| `category` | 書籍 / 課程 / 影片 / 文章（方便分類篩選） |
| `start_date` / `end_date` | 開始與完成日期，可計算花了幾天 |
| `total_units` | 總頁數或總集數（選填，用於計算進度 %） |
| `current_unit` | 目前讀到第幾頁／第幾集 |
| `rating` | 完成後自評 1–5 顆星 |
| `url` | 書籍連結、課程連結（方便快速跳轉） |

---

### 資料庫 SQL

```sql
CREATE TABLE learning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '書籍',   -- 書籍/課程/影片/文章
  status TEXT NOT NULL DEFAULT '預覽',     -- 預覽/進行中/完成/無
  start_date DATE,
  end_date DATE,
  total_units INT,          -- 總頁數或總集數
  current_unit INT,         -- 目前進度
  rating INT,               -- 1~5，完成後填
  notes TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learning_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON learning_items FOR ALL USING (true);
```

---

### 新增路由
`src/main.js` 加入：
```
{ path: '/learning', component: LearningView }
```
NavBar 加入第五個頁籤「📚 書單」→ `/learning`

---

### 新增 Composable：`src/composables/useLearning.js`
沿用既有 `fetch*/upsert*/delete*` 命名模式：
- `fetchLearningItems(filters?)` – 取全部，可帶 status/category 篩選
- `upsertLearningItem(fields)` – 新增或更新（onConflict: id）
- `deleteLearningItem(id)`
- `fetchTodayActive()` – 取 status='進行中' 的項目（供 Dashboard 用）

---

### Dashboard 新增區塊（`DashboardView.vue`）
在備註區塊下方新增「📚 進行中」專區：
- 依 `category` 分組顯示（書籍 / 課程 各一小標題）
- 每個項目顯示：標題、進度條（current_unit/total_units）、狀態標籤
- 右側「➕」快速跳轉到 `/learning` 新增

---

### 新頁面：`src/views/LearningView.vue`
**上方工具列**
- 狀態篩選 tabs：全部 / 預覽 / 進行中 / 完成
- 類別篩選下拉：全部 / 書籍 / 課程 / 影片 / 文章
- 「+ 新增」按鈕

**表格欄位**（手機用卡片列表，桌面用 table）
| 書名/課程名 | 分類 | 狀態 | 進度 | 開始 | 完成 | 評分 | 操作 |

**新增/編輯** 使用 Bottom Sheet Modal（從底部滑出），欄位：
- 標題（必填）、分類、狀態
- 開始日期 / 完成日期
- 總頁數 / 目前進度（計算 % 顯示）
- 評分（1~5 顆星，status=完成 時才顯示）
- 備註、URL

---

### 修改檔案清單
1. `src/main.js` – 加路由
2. `src/components/NavBar.vue` – 加書單頁籤
3. `src/composables/useLearning.js` – 新建
4. `src/views/DashboardView.vue` – 加進行中書單區塊
5. `src/views/LearningView.vue` – 新建

---

## 驗證方式

1. `npm run dev` 本機啟動，填入今日資料，確認 Dashboard 顯示正確
2. 切換至 History，確認日曆藍點出現在有資料的日期
3. 點擊日期，確認詳情卡片載入正確
4. 手機瀏覽器測試響應式排版
5. push 到 GitHub 確認 Actions 成功、GitHub Pages 可正常存取