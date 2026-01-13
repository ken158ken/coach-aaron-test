# 🚀 Vercel 部署完整指南

**更新時間**: 2026-01-13T00:00:00Z

---

## 📋 部署前檢查清單

在部署前請確認：

- [x] ✅ 資料庫已建立（Supabase）
- [x] ✅ Schema 已執行（`schema.sql`）
- [x] ✅ 種子資料已插入（`force_insert_data.sql`）
- [x] ✅ 程式碼已推送到 GitHub
- [ ] ⏳ 設定環境變數（部署時設定）

---

## 🎯 步驟一：推送到 GitHub

### 1.1 確認 Git 狀態

```powershell
cd "X:\其他\小實用網頁\Aaron教練網頁\coach-aaron-test"
git status
```

### 1.2 加入所有檔案

```powershell
git add .
```

### 1.3 提交變更

```powershell
git commit -m "feat: complete project setup with Supabase integration

- Add database schema and seed data
- Add environment variable templates
- Add comprehensive documentation
- Fix password_hash field
- Add database check and reset scripts
- Update README and guides"
```

### 1.4 切換到 main 分支

```powershell
git branch -M main
```

### 1.5 推送到 GitHub

```powershell
git push -u origin main
```

**如果遇到認證問題**：

- GitHub 不再支援密碼登入
- 需要使用 Personal Access Token (PAT)
- 生成位置：GitHub → Settings → Developer settings → Personal access tokens

---

## 🌐 步驟二：連結 Vercel

### 2.1 註冊/登入 Vercel

1. 前往 [Vercel](https://vercel.com/)
2. 點選 **Sign Up** 或 **Log In**
3. 選擇 **Continue with GitHub** 登入

### 2.2 Import 專案

1. 登入後進入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點選 **Add New...** → **Project**
3. 在 **Import Git Repository** 區塊找到 `coach-aaron-test`
4. 點選 **Import**

### 2.3 設定專案

#### Framework Preset

- 選擇：**Other** 或 **Vite**

#### Root Directory

- 保持預設（根目錄）

#### Build and Output Settings

Vercel 會自動偵測 `vercel.json`，無需手動設定。

---

## 🔐 步驟三：設定環境變數

### 3.1 取得 Supabase 金鑰

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇您的專案
3. 點選左側 **Settings** → **API**
4. 複製以下資訊：
   - **Project URL** (例如：`https://xxx.supabase.co`)
   - **anon public** key
   - **service_role** key（⚠️ 請勿外洩）

### 3.2 生成 JWT Secret

使用線上工具或指令生成：

```powershell
# PowerShell 生成 32 字元隨機字串
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

或使用線上生成器：https://generate-secret.vercel.app/32

### 3.3 在 Vercel 加入環境變數

在 Vercel Import 頁面（或稍後在 Settings）加入：

| Key                      | Value                            | Environment |
| ------------------------ | -------------------------------- | ----------- |
| `SUPABASE_URL`           | `https://xxx.supabase.co`        | Production  |
| `SUPABASE_ANON_KEY`      | `eyJhbGciOiJI...`                | Production  |
| `SUPABASE_SERVICE_KEY`   | `eyJhbGciOiJI...` ⚠️             | Production  |
| `JWT_SECRET`             | `your-random-32-chars`           | Production  |
| `VITE_API_URL`           | `https://your-domain.vercel.app` | Production  |
| `VITE_SUPABASE_URL`      | `https://xxx.supabase.co`        | Production  |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJI...`                | Production  |

**⚠️ 注意事項**：

- `VITE_API_URL` 先填寫 `https://your-project.vercel.app`
- 部署完成後會得到實際網址，再回來更新此變數
- `SUPABASE_SERVICE_KEY` 是機密，只能在後端使用

### 3.4 點選 Deploy

加入環境變數後，點選 **Deploy** 開始部署。

---

## ⚡ 步驟四：等待部署完成

### 部署過程

1. **Building**（約 1-3 分鐘）

   - 安裝依賴
   - 執行 Build 腳本
   - 編譯前端

2. **Deploying**（約 30 秒）

   - 上傳到 Vercel CDN
   - 配置路由

3. **Ready** ✅
   - 部署完成！

### 取得網址

部署成功後會顯示網址，例如：

```
https://coach-aaron-test.vercel.app
```

---

## 🔧 步驟五：更新環境變數

### 5.1 更新 VITE_API_URL

1. 在 Vercel Dashboard 點選專案
2. 前往 **Settings** → **Environment Variables**
3. 找到 `VITE_API_URL`
4. 更新為實際網址（例如 `https://coach-aaron-test.vercel.app`）
5. 點選 **Save**

### 5.2 重新部署

1. 前往 **Deployments** 頁籤
2. 點選最新的部署
3. 點選右上角 **...** → **Redeploy**
4. 確認 **Redeploy**

---

## ✅ 步驟六：測試部署

### 6.1 檢查健康狀態

前往：`https://your-domain.vercel.app/api/health`

應該看到：

```json
{
  "status": "ok",
  "timestamp": "2026-01-13T..."
}
```

### 6.2 測試註冊

1. 前往 `https://your-domain.vercel.app/register`
2. 填寫資料註冊
3. 檢查 Supabase Dashboard → Table Editor → users
4. 應該看到新使用者

### 6.3 測試管理員登入

1. 使用 `ken158ken@gmail.com` 註冊/登入
2. 進入會員中心
3. 應該看到「管理員入口」
4. 點選進入後台

### 6.4 檢查短影音

1. 前往 `https://your-domain.vercel.app/videos`
2. 應該看到 72 筆影片

---

## 🐛 常見問題排查

### 問題 1: 部署失敗 - Build Error

**錯誤訊息**：`Error: Command "npm run build" exited with 1`

**解決方案**：

1. 檢查 `package.json` 的 `build` 腳本
2. 確認所有依賴都已安裝
3. 本地執行 `npm run build` 測試

### 問題 2: API 無法連接

**錯誤訊息**：`Network Error` 或 `CORS Error`

**解決方案**：

1. 檢查 `VITE_API_URL` 是否正確
2. 確認後端 `FRONTEND_URL` 包含 Vercel 網址
3. 檢查 `vercel.json` 的路由設定

### 問題 3: 環境變數未生效

**症狀**：程式碼中讀不到環境變數

**解決方案**：

1. 前端變數必須以 `VITE_` 開頭
2. 修改環境變數後需要 **Redeploy**
3. 清除瀏覽器快取

### 問題 4: 資料庫連接失敗

**錯誤訊息**：`Missing Supabase environment variables`

**解決方案**：

1. 檢查 Vercel 環境變數是否都已設定
2. 確認 Supabase Keys 正確
3. 檢查 Supabase 專案狀態（未暫停）

---

## 📊 部署後檢查清單

- [ ] 網站可正常訪問
- [ ] `/api/health` 回傳正常
- [ ] 註冊功能正常
- [ ] 登入功能正常
- [ ] 短影音顯示正常（72 筆）
- [ ] 管理員可進入後台
- [ ] Supabase Dashboard 有 REST Requests 統計

---

## 🔄 後續更新流程

### 本地開發

```powershell
# 修改程式碼
git add .
git commit -m "feat: add new feature"
git push
```

### 自動部署

Vercel 會自動偵測 GitHub 推送並重新部署！

### 手動部署

1. 前往 Vercel Dashboard
2. 選擇專案 → **Deployments**
3. 點選 **Redeploy**

---

## 🎯 自訂網域（選用）

### 加入自訂網域

1. 前往 Vercel Dashboard → 專案 → **Settings** → **Domains**
2. 點選 **Add**
3. 輸入您的網域（例如 `coach-aaron.com`）
4. 按照指示設定 DNS（A Record 或 CNAME）
5. 等待 DNS 生效（最多 48 小時）

### DNS 設定範例

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 📞 需要協助？

### Vercel 文件

- [官方文件](https://vercel.com/docs)
- [環境變數設定](https://vercel.com/docs/environment-variables)
- [自訂網域](https://vercel.com/docs/custom-domains)

### Supabase 文件

- [官方文件](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 完成！

恭喜您完成部署！您的網站現在已經上線了 🚀

**下一步**：

- 測試所有功能
- 分享您的網站
- 持續開發新功能
- 監控 Vercel Analytics

---

**最後更新**: 2026-01-13 (ISO 8601: 2026-01-13T00:00:00Z)
