# 🚀 Vercel 部署檢查清單

**專案**: Coach Aaron 健身教練平台  
**部署平台**: Vercel  
**部署時間**: 2026-01-17

---

## ✅ 部署前檢查 (已完成)

### 1. Git 狀態 ✅

- [x] 所有變更已提交
- [x] 已推送到 GitHub main 分支
- [x] Working tree clean
- [x] 最新提交: `462695e` (SSR 改進)

### 2. Build 配置 ✅

- [x] **vercel.json** 配置正確
- [x] buildCommand 包含完整流程
- [x] outputDirectory 設為 `.vercel_build_output`
- [x] functions includeFiles 包含 backend/dist
- [x] rewrites 路由配置正確

### 3. 前端建置 ✅

- [x] TypeScript 編譯通過
- [x] Vite build 成功
- [x] SSR bundle 生成
- [x] Client bundle 生成
- [x] build.js 腳本執行成功

### 4. 後端建置 ✅

- [x] TypeScript 編譯通過
- [x] ES modules 配置正確
- [x] backend/dist 生成
- [x] index.js + source maps 存在

### 5. SSR 相容性 ✅

- [x] 100% SSR 相容
- [x] 所有瀏覽器 API 有保護
- [x] entry-server.tsx 錯誤處理完整
- [x] api/ssr.js CSR fallback 機制
- [x] AuthContext SSR 安全

### 6. API 配置 ✅

- [x] api/server.js 動態載入 backend
- [x] api/ssr.js 動態載入 entry-server
- [x] 統一使用 TypeScript API 客戶端
- [x] CORS 設定正確

### 7. 環境變數 ⚠️

需要在 Vercel Dashboard 設定：

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `JWT_SECRET`
- [ ] `FRONTEND_URL` (可選)
- [ ] `NODE_ENV=production`

---

## 🔄 部署流程

### Vercel 自動部署

1. **觸發**: Git push 到 main 分支 ✅
2. **建置**: Vercel 執行 buildCommand
3. **部署**: 建置產物上傳到 CDN
4. **完成**: 分配部署 URL

### 建置步驟順序

```bash
cd frontend && npm ci              # 安裝前端依賴
npm run build                      # 建置前端 (client + server)
cd .. && node build.js             # 複製到 .vercel_build_output
cd backend && npm ci               # 安裝後端依賴
npm run build                      # 編譯 TypeScript 到 dist
cd ..                              # 回到根目錄
```

---

## 🌐 部署 URL

### Production

- **主要 URL**: https://coach-aaron-test.vercel.app
- **狀態**: 🟡 部署中...

### Preview (分支部署)

- **最新部署**: https://coach-aaron-test-git-main-ken158ken.vercel.app
- **狀態**: 🟡 等待建置...

---

## 🧪 部署後驗證

### 基本功能測試

- [ ] 首頁載入正常
- [ ] 路由導航正常 (/, /courses, /videos, /photos, /contact)
- [ ] SSR 運作 (查看頁面原始碼有內容)
- [ ] CSR hydration 正常

### API 測試

- [ ] `/api/health` 返回 200
- [ ] `/api/auth/me` 正常運作
- [ ] `/api/courses` 資料載入
- [ ] `/api/videos` 資料載入

### 進階測試

- [ ] 登入功能
- [ ] 註冊功能
- [ ] 會員中心
- [ ] 管理後台 (需管理員權限)

---

## 🐛 常見問題排查

### 如果看到 500 錯誤

1. 檢查 Vercel Function Logs
2. 確認環境變數已設定
3. 查看 `api/ssr` 或 `api/server` logs

### 如果 SSR 失敗

- ✅ 已有 CSR fallback，頁面仍可顯示
- 檢查 Function Logs 的 `[SSR] Render error`
- 可能原因：缺少環境變數或元件錯誤

### 如果 Backend API 500

1. 確認 `backend/dist` 已正確生成
2. 檢查 `api/server.js` 能否載入 backend
3. 驗證環境變數 (SUPABASE\_\*, JWT_SECRET)

---

## 📊 部署監控

### Vercel Dashboard

- **專案**: coach-aaron-test
- **Dashboard**: https://vercel.com/ken158ken/coach-aaron-test

查看：

- ✅ Deployments (部署歷史)
- ✅ Functions (Serverless 函數日誌)
- ✅ Analytics (訪問統計)
- ✅ Settings > Environment Variables

### 效能指標

監控：

- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TTI** (Time to Interactive)
- **CLS** (Cumulative Layout Shift)

---

## ⚙️ 環境變數設定步驟

1. 前往 Vercel Dashboard
2. 選擇 `coach-aaron-test` 專案
3. Settings > Environment Variables
4. 新增以下變數（所有環境: Production, Preview, Development）:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://coach-aaron-test.vercel.app
NODE_ENV=production
```

5. Save
6. Redeploy (如果已部署)

---

## 🎯 部署完成後步驟

1. **測試所有頁面**

   - 首頁、課程、影片、教練寫真、聯絡我們
   - 登入、註冊、會員中心
   - 管理後台（需權限）

2. **檢查 Console**

   - 無 JavaScript 錯誤
   - 無 API 錯誤
   - 無 SSR hydration 警告

3. **效能測試**

   - Google PageSpeed Insights
   - Lighthouse 評分
   - WebPageTest

4. **SEO 檢查**
   - 頁面原始碼有內容 (SSR 成功)
   - Meta tags 正確
   - Open Graph 資訊

---

## ✅ 當前狀態

**準備就緒**: ✅  
**Git 推送**: ✅  
**Vercel 部署**: 🟡 進行中

### 下一步

1. ⏳ 等待 Vercel 建置完成 (約 2-3 分鐘)
2. 🔍 檢查部署狀態: https://vercel.com/ken158ken/coach-aaron-test
3. ⚙️ 設定環境變數（如果還沒設定）
4. ✅ 測試部署的網站

---

**建立時間**: 2026-01-17 08:30:00 UTC+8  
**最後更新**: 自動部署觸發中
