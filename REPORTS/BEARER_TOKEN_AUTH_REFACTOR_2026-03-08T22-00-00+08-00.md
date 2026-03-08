# Bearer Token 認證重構報告

**報告時間**: 2026-03-08T22:00:00+08:00  
**報告類型**: 重大認證架構重構  
**影響範圍**: 前後端全棧  

---

## 📋 問題描述

### 現象

1. **OAuth 登入 (Google/LINE) 返回 401**：Exchange code 報「code 已過期或無效」
2. **一般 Email/Password 登入也壞**：登入後 `/api/auth/me` 返回 401
3. **白名單管理壞掉**：根因為 auth hook 認證失敗

### 根因分析

| 問題                         | 根因                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| OAuth exchange code 失效     | 使用 in-memory `Map` 存儲 exchange code，Vercel Serverless 每次請求可能在不同 instance，Map 不共享 |
| Cookie 認證失敗              | `Set-Cookie` 由 Vercel Serverless 回應設定，但後續請求 cookie 未被可靠傳遞 |
| Bearer Token 過大 (56KB)     | JWT payload 包含 `avatarUrl: user.avatar_base64 \|\| user.avatar_url`，base64 編碼的頭像圖片可達 50KB+ |
| Vercel REQUEST_HEADER_TOO_LARGE | 56KB 的 Authorization header 超過 Vercel HTTP header 大小限制 |

---

## 🔧 修復方案

### 1. 雙重認證模式 (Cookie + Bearer Token)

**後端 `extractToken()` helper**（`backend/middleware/auth.ts`）：
- 優先讀取 `Authorization: Bearer <token>` header
- Fallback 讀取 `req.cookies.token`（cookie 模式）
- `authenticateToken` 和 `optionalAuth` 中介軟體統一使用此 helper

**前端 token 管理**（`frontend/src/services/api.ts`）：
- `_authToken` 變數存儲 token 在記憶體
- `setAuthToken(token)` / `getAuthToken()` 管理生命週期
- Axios request interceptor 自動附帶 `Authorization: Bearer` header

### 2. OAuth 無狀態 JWT Exchange

移除 in-memory `Map`（`codeStore`），改用短效 JWT：

```
generateExchangeCode(userId)
  → jwt.sign({ sub: userId, p: "ox" }, secret, { expiresIn: "60s" })
  → 回傳 ~150 字元的 JWT string

verifyExchangeToken(token)
  → jwt.verify(token, secret) → 檢查 p === "ox"
  → 回傳 userId 或 null
```

### 3. Login/Register 回傳 Token

所有認證端點 (`login`, `register`, `oauth-exchange`) 在 JSON response body 中包含 `token` 欄位：

```json
{
  "user": { ... },
  "isAdmin": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 4. AuthContext 直接使用 Response 資料

- `login()` 不再呼叫 `checkAuth()`，直接用 response 中的 user 資料設定狀態
- `register()` 同上
- 避免 race condition（cookie 尚未設定就發起 checkAuth 請求）

### 5. JWT Payload 瘦身

移除 `avatarUrl` 欄位（可包含 50KB+ base64 圖片）：

**修改前** (3 處 jwt.sign)：
```typescript
jwt.sign({
  userId, email, username, displayName, sex, isAdmin,
  avatarUrl: user.avatar_base64 || user.avatar_url  // ← 50KB+
})
```

**修改後**：
```typescript
jwt.sign({
  userId, email, username, displayName, sex, isAdmin
  // avatarUrl 不再包含，改由 /api/auth/me 從 DB 取得
})
```

Token 大小：**56KB → 271 chars**

---

## 📁 修改檔案清單

| 檔案 | 改動 |
| --- | --- |
| `backend/middleware/auth.ts` | 新增 `extractToken()` helper，`authenticateToken` + `optionalAuth` 使用 |
| `backend/routes/auth.ts` | 移除 `consumeExchangeCode` stale import、OAuth exchange 改用 `verifyExchangeToken` + DB lookup、login/register/exchange 回傳 `token`、移除 jwt.sign 中的 `avatarUrl` |
| `backend/utils/oauth.ts` | 移除 `crypto` import + `codeStore` Map、新增 `generateExchangeCode()` + `verifyExchangeToken()`、`setAuthCookie` JWT 移除 `avatarUrl` |
| `frontend/src/services/api.ts` | 新增 `_authToken` + `setAuthToken()` + `getAuthToken()`、Axios interceptor 附帶 Bearer header、`getBaseURL()` 生產環境回傳 `""` (same-origin) |
| `frontend/src/services/auth.service.ts` | 新增 `AuthResponseWithToken` interface + `storeToken()` helper、login/register/exchange 存 token、logout 清除 token |
| `frontend/src/context/AuthContext.tsx` | import `setAuthToken`、login/register 直接用 response 設定 state (不呼叫 checkAuth)、logout 清除 token |

---

## ✅ 驗證結果

### API 測試（Vercel 生產環境）

```
1. POST /api/auth/login → 200
   Token 長度: 271 chars ✓

2. GET /api/auth/me (Authorization: Bearer <token>) → 200
   回傳完整用戶資料 ✓
   - userId: 1
   - email: ken158ken@gmail.com
   - isAdmin: true
   - avatarUrl: (從 DB 取得，非 JWT)
```

### Git 提交記錄

```
975b140 fix: JWT payload 移除 avatarUrl 避免 base64 圖片造成 header 過大
ff6d64b fix: 改用 Bearer token 認證解決 Vercel cookie 問題 + OAuth 無狀態 JWT
403037a fix: API baseURL 在 production 使用 same-origin 確保 cookie 正確設定
7d4a55f fix: OAuth 登入直接設定 auth state 避免 race condition 與重複 API 呼叫
342a6a6 fix: OAuth 改用短 code 取代 JWT-in-URL 避免 414 URI Too Long
a996431 fix: OAuth 改用 token exchange 模式解決 cookie 問題
564ea06 fix: OAuth 登入 cookie 修正 — 使用 HTML 跳轉替代 redirect
```

---

## ⚠️ 已知限制

| 項目 | 說明 |
| --- | --- |
| **頁面重新整理** | Token 存在記憶體中，重新整理會清除。依賴 cookie fallback 或需重新登入 |
| **Token 過期** | JWT 有效期 7 天 (`7d`)，過期後需重新登入 |
| **OAuth 社交帳號表** | `user_social_accounts` 表需先跑 migration `002_social_accounts.sql` |

---

## 🏗️ 架構圖

```
┌─────────────────┐     ┌──────────────────────┐
│   前端 (React)  │     │  Vercel Serverless   │
│                 │     │                      │
│  Login Page     │────→│  POST /api/auth/login│
│  ← { token }   │←────│  → JWT + Set-Cookie  │
│                 │     │                      │
│  setAuthToken() │     │  extractToken(req)   │
│  ↓ 存入記憶體   │     │  ├─ Authorization    │
│                 │     │  │  Bearer header     │
│  Axios          │────→│  └─ cookie fallback  │
│  interceptor    │     │                      │
│  Authorization: │     │  authenticateToken() │
│  Bearer <token> │     │  → req.user = {...}  │
│                 │     │                      │
│  OAuth Flow:    │     │  OAuth callback:     │
│  /login?auth_   │←────│  generateExchangeCode│
│  code=<jwt>     │     │  → minimal JWT 60s   │
│  ↓              │     │                      │
│  exchangeOAuth  │────→│  POST /oauth-exchange│
│  Code(code)     │     │  verifyExchangeToken │
│  ← { token }   │←────│  → full JWT          │
└─────────────────┘     └──────────────────────┘
```
