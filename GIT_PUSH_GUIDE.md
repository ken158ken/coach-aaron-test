# Git 推送指令指南

## 📋 初始設定

您的 Git Remote 已經設定為：

```
https://github.com/ken158ken/coach-aaron-test.git
```

## 🚀 推送到 GitHub 步驟

### 方法一：使用 PowerShell（推薦）

```powershell
# 1. 檢查 Git 狀態
git status

# 2. 將所有檔案加入暫存區
git add .

# 3. 提交變更
git commit -m "feat: initial commit with Supabase integration and admin dashboard"

# 4. 切換到 main 分支（與 GitHub 預設分支一致）
git branch -M main

# 5. 推送到 GitHub
git push -u origin main
```

### 方法二：分步執行（確保每步成功）

```powershell
# Step 1: 檢查當前狀態
git status

# Step 2: 加入檔案
git add .

# Step 3: 確認暫存檔案
git status

# Step 4: 提交
git commit -m "feat: initial commit with Supabase integration and admin dashboard

- Database schema with 9 core tables
- Backend API with Express.js
- Frontend React SPA with Vite
- Admin dashboard with user/course/video management
- JWT authentication system
- Row Level Security policies
- Vercel deployment configuration"

# Step 5: 切換分支
git branch -M main

# Step 6: 推送
git push -u origin main
```

## ⚠️ 可能遇到的問題

### 問題 1: 遠端已有內容

如果遠端 repository 已經有 README 或其他檔案：

```powershell
# 拉取遠端變更並合併
git pull origin main --rebase

# 解決衝突（如果有）後繼續
git rebase --continue

# 推送
git push -u origin main
```

### 問題 2: 需要強制推送（謹慎使用）

```powershell
# ⚠️ 警告：這會覆蓋遠端內容
git push -u origin main --force
```

### 問題 3: 認證問題

如果需要輸入帳號密碼：

- GitHub 已不支援密碼登入
- 請使用 Personal Access Token (PAT)

生成 Token：

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. 勾選 `repo` 權限
4. 複製 Token（只顯示一次）
5. 使用 Token 作為密碼

## 📊 推送後檢查

```powershell
# 查看遠端分支
git branch -r

# 查看提交記錄
git log --oneline

# 查看遠端 URL
git remote -v
```

## 🔄 後續推送

第一次推送後，之後只需：

```powershell
git add .
git commit -m "your commit message"
git push
```

## 📝 建議的 Commit 訊息

```powershell
# 新功能
git commit -m "feat: add user authentication system"

# 修復 Bug
git commit -m "fix: resolve CORS issue in backend"

# 文件更新
git commit -m "docs: update README with deployment guide"

# 重構
git commit -m "refactor: reorganize backend routes structure"

# 樣式調整
git commit -m "style: format code with ESLint"
```

## 🎯 完整推送流程（複製貼上即可）

```powershell
# 完整流程 - 適用於首次推送
cd "X:\其他\小實用網頁\Aaron教練網頁\coach-aaron-test"; git add .; git commit -m "feat: initial commit with Supabase integration and admin dashboard"; git branch -M main; git push -u origin main
```

## ✅ 推送成功後

1. 前往 https://github.com/ken158ken/coach-aaron-test
2. 確認檔案已上傳
3. 檢查 README.md 是否正確顯示
4. 準備 Vercel 部署

## 🚢 Vercel 部署步驟

推送成功後：

1. **前往 Vercel Dashboard**: https://vercel.com/dashboard
2. **Import Project** → 選擇 GitHub
3. **選擇 Repository**: ken158ken/coach-aaron-test
4. **Framework Preset**: Other
5. **設定環境變數**（重要！）：
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_KEY=eyJxxx...
   JWT_SECRET=your-secret-key-min-32-chars
   VITE_API_URL=https://your-domain.vercel.app
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx...
   ```
6. **Deploy**

## 📞 如遇問題

1. 檢查 Git 版本：`git --version`
2. 檢查 Remote：`git remote -v`
3. 查看詳細日誌：`git push -u origin main --verbose`
