# Google OAuth & LINE Login 開發者註冊指南

> **最後更新**: 2026-03-05T23:30:00+08:00  
> **適用對象**: 專案管理員 / 開發者

---

## 目錄

1. [Google Cloud Console 設定](#1-google-cloud-console-設定)
2. [LINE Developers 設定](#2-line-developers-設定)
3. [環境變數設定](#3-環境變數設定)
4. [部署注意事項](#4-部署注意事項)

---

## 1. Google Cloud Console 設定

### 1.1 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用 Google 帳號登入（建議用專案用的帳號）
3. 點擊左上角專案選擇器 → 「**新增專案**」
4. 填寫：
   - **專案名稱**: `Coach Aaron` （或任何名稱）
   - **機構**: 選擇你的機構或「無機構」
5. 點擊「**建立**」

### 1.2 啟用 API

1. 在 Google Cloud Console 中，前往左側選單 → 「**API 和服務**」 → 「**程式庫**」
2. 搜尋並啟用以下 API：
   - ✅ **Google+ API**（可能已停用，但 OAuth 不一定需要）
   - ✅ **Google People API**（建議啟用）

> **注意**: 基本 OAuth 登入（openid + email + profile scope）不需要額外啟用 API。

### 1.3 設定 OAuth 同意畫面

1. 前往「**API 和服務**」→「**OAuth 同意畫面**」
2. 選擇使用者類型：
   - **外部** ← 選這個（讓所有 Google 帳號都能登入）
3. 填寫應用程式資訊：
   - **應用程式名稱**: `Coach Aaron 教練平台`
   - **使用者支援電子郵件**: 你的 Email
   - **開發者聯絡資訊**: 你的 Email
4. 範圍（Scopes）設定：
   - 點「新增或移除範圍」
   - 勾選：
     - `email` — 查看使用者 Email
     - `profile` — 查看基本個人資料
     - `openid` — OpenID Connect 驗證
5. 點「**儲存並繼續**」
6. 測試使用者：在開發階段可以新增測試帳號（正式上線後不需要）

### 1.4 建立 OAuth 2.0 憑證

1. 前往「**API 和服務**」→「**憑證**」
2. 點「**建立憑證**」→「**OAuth 用戶端 ID**」
3. 選擇應用程式類型：「**網路應用程式**」
4. 填寫：
   - **名稱**: `Coach Aaron Web`
   - **已授權的 JavaScript 來源** (Authorized JavaScript origins)：
     ```
     http://localhost:5173
     http://localhost:5000
     https://coach-aaron-test.vercel.app
     ```
   - **已授權的重新導向 URI** (Authorized redirect URIs)：
     ```
     http://localhost:5000/api/auth/google/callback
     https://coach-aaron-test.vercel.app/api/auth/google/callback
     ```
5. 點「**建立**」
6. 複製產生的：
   - **用戶端 ID** → 填入 `.env` 的 `GOOGLE_CLIENT_ID`
   - **用戶端密鑰** → 填入 `.env` 的 `GOOGLE_CLIENT_SECRET`

### 1.5 Google 提供的資料

當使用者透過 Google 登入時，我們可以取得以下資料：

| 欄位             | 說明                         | 範例                                      |
| ---------------- | ---------------------------- | ----------------------------------------- |
| `sub`            | Google 唯一 ID               | `"102340561024567890"`                    |
| `email`          | 電子郵件                     | `"user@gmail.com"`                        |
| `email_verified` | Email 是否已驗證             | `true`                                    |
| `name`           | 完整姓名                     | `"王小明"`                                |
| `given_name`     | 名字                         | `"小明"`                                  |
| `family_name`    | 姓氏                         | `"王"`                                    |
| `picture`        | 大頭照 URL                   | `"https://lh3.googleusercontent.com/..."` |
| `locale`         | 語言設定                     | `"zh-TW"`                                 |
| `hd`             | 公司網域（Google Workspace） | `"company.com"`                           |

### 1.6 發布狀態

- **測試中**（Testing）: 只有你加入「測試使用者」的 Google 帳號才能登入
- **正式上線**（In production）: 所有 Google 帳號都能登入
- 要正式上線，需要：
  - 準備隱私權政策 URL
  - 準備服務條款 URL
  - 可能需要 Google 審核（如使用敏感/受限範圍）

---

## 2. LINE Developers 設定

### 2.1 建立 LINE Developers 帳號

1. 前往 [LINE Developers](https://developers.line.biz/zh-hant/)
2. 使用 **LINE 帳號** 登入（手機上的 LINE 帳號）
3. 如果是第一次，需要建立「**開發者帳號**」
4. 填寫：
   - **姓名**: 你的名字
   - **電子郵件**: 你的 Email
5. 同意使用條款

### 2.2 建立 Provider

1. 在 LINE Developers Console 中，點「**Create a new provider**」
2. 填寫 **Provider 名稱**: `Coach Aaron` （這是開發者/公司名稱）
3. 點「**Create**」

### 2.3 建立 LINE Login Channel

1. 在 Provider 頁面，點「**Create a LINE Login channel**」
2. 填寫：
   - **Channel type**: `LINE Login`
   - **Provider**: 剛才建立的 Provider
   - **Region**: `Taiwan`（或你所在的地區）
   - **Channel icon**: 上傳一個 LOGO（建議 200x200 px）
   - **Channel name**: `Coach Aaron 教練平台`
   - **Channel description**: `私人教練商業培訓平台登入`
   - **App types**: 勾選 `Web app`
   - **Email address**: 你的 Email
   - **Privacy policy URL**: `https://coach-aaron-test.vercel.app/privacy`（可稍後補）
   - **Terms of use URL**: `https://coach-aaron-test.vercel.app/terms`（可稍後補）
3. 同意 LINE 使用條款
4. 點「**Create**」

### 2.4 設定 Callback URL

1. 進入新建的 Channel 頁面
2. 切換到「**LINE Login**」分頁
3. 在 **Callback URL** 欄位填入：
   ```
   http://localhost:5000/api/auth/line/callback
   https://coach-aaron-test.vercel.app/api/auth/line/callback
   ```
   > 每行一個 URL

### 2.5 申請 Email 權限

1. 在 Channel 頁面，切換到「**LINE Login**」分頁
2. 找到「**OpenID Connect**」區塊
3. 展開「**Email address permission**」
4. 點「**Apply**」
5. 填寫申請理由（例如：`Used for user account identification and login`）
6. 等待審核（通常很快，幾分鐘到幾小時）

> **重要**: 如果不申請 Email 權限，LINE 登入時將無法取得使用者 Email，帳號綁定功能會受限。

### 2.6 取得 Channel 資訊

1. 在 Channel 頁面的「**Basic settings**」分頁：
   - **Channel ID** → 填入 `.env` 的 `LINE_CHANNEL_ID`
   - **Channel secret** → 填入 `.env` 的 `LINE_CHANNEL_SECRET`

### 2.7 LINE 提供的資料

當使用者透過 LINE 登入時，我們可以取得以下資料：

| 來源        | 欄位            | 說明               | 範例                                  |
| ----------- | --------------- | ------------------ | ------------------------------------- |
| Profile API | `userId`        | LINE 唯一 ID       | `"U1234567890abcdef"`                 |
| Profile API | `displayName`   | LINE 顯示名稱      | `"王小明"`                            |
| Profile API | `pictureUrl`    | LINE 大頭照 URL    | `"https://profile.line-scdn.net/..."` |
| Profile API | `statusMessage` | LINE 個人狀態      | `"努力訓練中💪"`                      |
| ID Token    | `email`         | 電子郵件（需申請） | `"user@example.com"`                  |

### 2.8 發布狀態

1. 在 Channel 頁面上方，有 **Published / Developing** 切換
2. 開發中（Developing）: 只有你自己可以測試
3. 已發布（Published）: 所有 LINE 使用者都能登入
4. 點「**Publish**」→ 確認即可

---

## 3. 環境變數設定

取得所有憑證後，更新後端 `.env` 檔案：

```env
# =====================================================
# Google OAuth 設定
# =====================================================
GOOGLE_CLIENT_ID=你的_Google_Client_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-你的密鑰

# =====================================================
# LINE Login 設定
# =====================================================
LINE_CHANNEL_ID=你的_LINE_Channel_ID
LINE_CHANNEL_SECRET=你的_LINE_Channel_Secret

# =====================================================
# OAuth 回呼基礎 URL
# =====================================================
# 本地開發
OAUTH_CALLBACK_BASE_URL=http://localhost:5000

# 生產環境（Vercel 部署時改為）
# OAUTH_CALLBACK_BASE_URL=https://coach-aaron-test.vercel.app
```

### 驗證設定

啟動後端後，存取以下端點驗證：

```bash
# 檢查 OAuth 啟用狀態
GET http://localhost:5000/api/auth/providers

# 預期回應：
{
  "local": true,
  "google": true,   # false = GOOGLE_CLIENT_ID 未設定
  "line": true       # false = LINE_CHANNEL_ID 未設定
}
```

---

## 4. 部署注意事項

### Vercel 環境變數

在 Vercel Dashboard 中設定：

1. 前往 https://vercel.com → 選擇專案 → Settings → Environment Variables
2. 新增以下變數：
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `LINE_CHANNEL_ID`
   - `LINE_CHANNEL_SECRET`
   - `OAUTH_CALLBACK_BASE_URL` = `https://coach-aaron-test.vercel.app`

### Redirect URI 清單

確保以下 URI 都已在各平台設定：

| 平台          | Redirect URI                                                   |
| ------------- | -------------------------------------------------------------- |
| Google (本地) | `http://localhost:5000/api/auth/google/callback`               |
| Google (生產) | `https://coach-aaron-test.vercel.app/api/auth/google/callback` |
| LINE (本地)   | `http://localhost:5000/api/auth/line/callback`                 |
| LINE (生產)   | `https://coach-aaron-test.vercel.app/api/auth/line/callback`   |

### 重要提醒

- Google OAuth 建議先在「測試模式」開發完成，再申請正式上線
- LINE Login 在「Developing」模式下只有 Channel 管理員能登入
- 兩個平台都需要 HTTPS（除了 localhost）
- 正式上線前需準備：隱私權政策頁面、服務條款頁面

### API 端點總覽

| 方法     | 路徑                                  | 說明                         |
| -------- | ------------------------------------- | ---------------------------- |
| `GET`    | `/api/auth/providers`                 | 查詢 OAuth 啟用狀態          |
| `GET`    | `/api/auth/google`                    | 發起 Google 登入             |
| `GET`    | `/api/auth/google/callback`           | Google 回呼                  |
| `POST`   | `/api/auth/google/bind`               | 綁定 Google（需登入）        |
| `GET`    | `/api/auth/line`                      | 發起 LINE 登入               |
| `GET`    | `/api/auth/line/callback`             | LINE 回呼                    |
| `POST`   | `/api/auth/line/bind`                 | 綁定 LINE（需登入）          |
| `GET`    | `/api/auth/social-accounts`           | 查詢已綁定社交帳號（需登入） |
| `DELETE` | `/api/auth/social-accounts/:provider` | 解除綁定（需登入）           |
