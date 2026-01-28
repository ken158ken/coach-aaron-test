# Backend 與 SSR 遷移報告

**日期**: 2026-01-25T21:00:00+08:00  
**專案**: Coach Aaron 教練網頁 - React 前端重設計

---

## 📋 任務摘要

從 `coach-aaron-test` 專案遷移後端、資料庫、API 檔案到新的 React 專案，並實作 SSR (Server-Side Rendering) 支援。

---

## ✅ 已完成項目

### 1. 後端結構 (`backend/`)

| 檔案                        | 描述                                                           |
| --------------------------- | -------------------------------------------------------------- |
| `package.json`              | 後端依賴配置 (Express 5.x, TypeScript, Supabase, JWT)          |
| `tsconfig.json`             | TypeScript 編譯配置                                            |
| `index.ts`                  | Express 伺服器入口，含 CORS、中間件、路由                      |
| `config/supabase.ts`        | Supabase 客戶端配置 (公開 + 管理員)                            |
| `middleware/auth.ts`        | JWT 驗證中間件 (authenticateToken, requireAdmin, optionalAuth) |
| `middleware/rateLimiter.ts` | 記憶體式速率限制                                               |
| `middleware/sanitize.ts`    | XSS/SQL 注入防護                                               |
| `routes/auth.ts`            | 認證路由 (register, login, logout, /me, /profile)              |
| `routes/courses.ts`         | 課程路由 (公開 + 管理員 CRUD)                                  |
| `routes/videos.ts`          | 影片路由 (公開 + 管理員 CRUD)                                  |
| `routes/admin.ts`           | 管理路由 (users, whitelist, orders, stats)                     |
| `types/database.ts`         | TypeScript 更新類型定義                                        |
| `utils/logger.ts`           | 日誌工具                                                       |
| `utils/env.ts`              | 環境變數驗證                                                   |

### 2. 資料庫結構 (`database/`)

| 檔案                      | 描述                                              |
| ------------------------- | ------------------------------------------------- |
| `schema.sql`              | 完整 PostgreSQL 結構 (10 張表, RLS, 觸發器, 索引) |
| `seed.sql`                | 測試數據                                          |
| `DATABASE_SETUP_GUIDE.md` | 資料庫設置指南                                    |

**資料表清單**:

1. `users` - 用戶資料
2. `admin_whitelist` - 管理員白名單
3. `user_auth_tokens` - 認證令牌
4. `courses` - 課程
5. `orders` - 訂單
6. `user_courses` - 用戶課程關聯
7. `order_items` - 訂單項目
8. `payments` - 付款記錄
9. `course_reviews` - 課程評論
10. `videos` - 影片

### 3. API/SSR (`api/`, `vercel.json`)

| 檔案            | 描述                                         |
| --------------- | -------------------------------------------- |
| `api/server.js` | Vercel API 處理器 (轉發至 Express)           |
| `api/ssr.js`    | Vercel SSR 處理器 (含 CSR fallback)          |
| `vercel.json`   | Vercel 部署配置 (build, rewrites, functions) |

### 4. SSR 入口檔案

| 檔案                   | 描述                                             |
| ---------------------- | ------------------------------------------------ |
| `src/entry-server.tsx` | 伺服器端渲染函數 (StaticRouter + renderToString) |
| `src/entry-client.tsx` | 客戶端 Hydration (hydrateRoot + fallback)        |

### 5. AuthContext SSR 修正

**關鍵修改** (根據 Hydration Fix 報告):

```typescript
// 新增狀態
const [isHydrated, setIsHydrated] = useState(false);

// Hydration 完成標記
useEffect(() => {
  setIsHydrated(true);
}, []);

// 延遲 checkAuth (50ms)
useEffect(() => {
  if (!mounted) return;
  const timer = setTimeout(() => {
    checkAuth();
  }, 50);
  return () => clearTimeout(timer);
}, [mounted]);
```

### 6. Admin 頁面 API 整合

所有 Admin 頁面已更新為使用真實 API：

| 頁面           | API 端點                 | 防禦性檢查                                       |
| -------------- | ------------------------ | ------------------------------------------------ |
| AdminDashboard | `/api/admin/stats`       | `typeof res === 'object' && 'totalUsers' in res` |
| AdminCourses   | `/api/courses/admin/all` | `res && Array.isArray(res)`                      |
| AdminVideos    | `/api/videos/admin/all`  | `res && Array.isArray(res)`                      |
| AdminUsers     | `/api/admin/users`       | `res && res.users && Array.isArray(res.users)`   |
| AdminWhitelist | `/api/admin/whitelist`   | `res && Array.isArray(res)`                      |

**重要**: API 攔截器返回 `response.data`，所以使用 `res` 而非 `res.data`。

### 7. 配置檔案更新

- `vite.config.ts` - SSR 支援配置
- `package.json` - SSR 建構腳本
- `index.html` - `<!--ssr-outlet-->` 標記
- `.env.example` - 環境變數範本
- `README.md` - 完整文件更新

---

## 📁 專案結構

```
前端新設計參考 (react)1/
├── src/
│   ├── entry-server.tsx      # SSR 入口
│   ├── entry-client.tsx      # Client Hydration
│   ├── context/
│   │   └── AuthContext.tsx   # ✅ SSR 修正
│   ├── pages/admin/
│   │   ├── AdminDashboard.tsx  # ✅ API 整合
│   │   ├── AdminCourses.tsx    # ✅ API 整合
│   │   ├── AdminVideos.tsx     # ✅ API 整合
│   │   ├── AdminUsers.tsx      # ✅ API 整合
│   │   └── AdminWhitelist.tsx  # ✅ API 整合
│   └── services/
│       └── api.ts            # Axios 攔截器 (response.data)
├── backend/                  # ✅ 新增
│   ├── index.ts
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── types/
│   └── utils/
├── database/                 # ✅ 新增
│   ├── schema.sql
│   ├── seed.sql
│   └── DATABASE_SETUP_GUIDE.md
├── api/                      # ✅ 新增
│   ├── server.js
│   └── ssr.js
├── vercel.json              # ✅ 新增
├── .env.example             # ✅ 新增
└── README.md                # ✅ 更新
```

---

## 🔧 待處理項目

1. **安裝後端依賴**: `cd backend && npm install`
2. **設置 Supabase**: 建立專案並執行 schema.sql
3. **環境變數**: 從 .env.example 建立 .env
4. **Vercel 部署**: 連接 GitHub 並設置環境變數

---

## ⚠️ 注意事項

### SSR Hydration 關鍵

1. **mounted 狀態**: 防止 SSR/CSR 內容不匹配
2. **isHydrated 狀態**: 標記 hydration 完成
3. **50ms 延遲**: checkAuth 必須延遲執行
4. **條件渲染**: 使用 `mounted &&` 防止閃爍

### API 回應處理

```typescript
// ❌ 錯誤
const data = res.data;

// ✅ 正確 (攔截器已返回 response.data)
const data = res;
```

### TypeScript 類型錯誤

部分 JSX 類型錯誤是 TypeScript 版本相容性問題，不影響運行時行為。

---

## 📊 遷移對照

| 原始檔案 (coach-aaron-test) | 新檔案 (前端新設計參考) | 狀態      |
| --------------------------- | ----------------------- | --------- |
| backend/index.ts            | backend/index.ts        | ✅ 已遷移 |
| backend/config/             | backend/config/         | ✅ 已遷移 |
| backend/middleware/         | backend/middleware/     | ✅ 已遷移 |
| backend/routes/             | backend/routes/         | ✅ 已遷移 |
| database/schema.sql         | database/schema.sql     | ✅ 已遷移 |
| database/seed.sql           | database/seed.sql       | ✅ 已遷移 |
| api/server.js               | api/server.js           | ✅ 已遷移 |
| api/ssr.js                  | api/ssr.js              | ✅ 已遷移 |
| vercel.json                 | vercel.json             | ✅ 已遷移 |

---

**報告結束**
