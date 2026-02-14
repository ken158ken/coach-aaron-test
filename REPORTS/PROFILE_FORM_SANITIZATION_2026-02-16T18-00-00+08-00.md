# 個人資料表單輸入消毒報告

> **時間戳記**: 2026-02-16T18:00:00+08:00 (ISO 8601)
> **提交**: `93ae2b2`
> **範圍**: 前後端雙層輸入消毒防注入

## 📋 變更概述

針對會員中心的個人資料更新表單，實施完整的前後端雙層輸入消毒與驗證機制，防止 XSS、HTML 注入、SQL 注入等攻擊。

## 🔧 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `backend/routes/user.ts` | 重寫 | `PUT /api/user/profile` 全面消毒重寫 |
| `frontend/src/pages/MemberCenter.tsx` | 增強 | 受控表單 + 前端驗證 + 提交功能 |

## 🔐 後端安全措施 (backend/routes/user.ts)

### 欄位白名單機制

```typescript
const allowedFields = ["displayName", "phoneNumber", "gender"];
// 未知欄位靜默忽略 + logSecurityEvent 記錄
```

- 僅接受 `displayName`、`phoneNumber`、`gender` 三個欄位
- `avatarUrl` 已移除（需透過專屬 `POST /api/user/avatar` endpoint）
- `email` 不可更新

### 顯示名稱消毒流程

```
輸入 → 型別檢查 → sanitizeComment(strictMode) → HTML entity 解碼 → Unicode 模式驗證 → 存入 DB
```

1. **型別檢查**: 必須是字串
2. **sanitizeComment 嚴格模式**: 偵測 XSS、HTML 標籤、SQL 關鍵字、命令注入、模板注入
3. **HTML entity 解碼**: 將 `&amp;` `&lt;` 等還原，避免存入不可讀的實體編碼
4. **Unicode 字元模式**: `/^[\p{L}\p{N}\p{Emoji_Presentation}\p{Emoji}\s._\-]+$/u`
   - 允許：中文、英文、數字、emoji、空格、句點、底線、連字號
   - 拒絕：HTML 標籤、括號、引號、分號等危險字元
5. **長度限制**: 1-30 字元

### 電話號碼驗證

- 允許清空（設為 `null`）
- 格式：台灣手機 `09xxxxxxxx`（去除空格與連字號後驗證）

### 性別值驗證

- 嚴格白名單：`male` / `female` / `other` / `prefer_not_to_say`
- 不合法值觸發 `logSecurityEvent`

### 安全日誌

所有可疑操作均觸發 `logSecurityEvent`：
- `unknown_profile_fields` — 提交了不允許的欄位
- `display_name_injection_attempt` — 顯示名稱包含注入模式
- `invalid_gender_value` — 性別值不在白名單

## 🛡️ 前端安全措施 (frontend/src/pages/MemberCenter.tsx)

### 受控輸入

- 從 `defaultValue`（不受控）改為 `value` + `onChange`（受控）
- `maxLength={30}` 硬限制
- Email 欄位 `disabled readOnly tabIndex={-1}` 三重防篡改

### 客戶端消毒函式

```typescript
const sanitizeInput = (input: string): string =>
  input
    .replace(/<[^>]*>/g, "")          // 移除 HTML 標籤
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // 移除控制字元
```

### 危險模式偵測

```typescript
const DANGEROUS_INPUT_PATTERN =
  /<script|<iframe|javascript:|on\w+=|<\/?\w+[^>]*>|\{\{|\$\{|union\s+select/i;
```

偵測模式：
- `<script>` / `<iframe>` — XSS 向量
- `javascript:` — 協議注入
- `onXxx=` — 事件處理器注入
- `<tag>` — HTML 標籤注入
- `{{` / `${` — 模板注入
- `UNION SELECT` — SQL 注入

### 提交流程

1. 前端 `sanitizeInput` 消毒
2. 危險模式偵測 → 拒絕
3. Unicode 字元模式驗證 → 拒絕
4. 長度驗證 (1-30) → 拒絕
5. `PUT /api/user/profile` 發送
6. 後端再次完整驗證
7. 成功 → 更新 UserContext + toast
8. 失敗 → 顯示後端錯誤訊息

### 使用者體驗

- 字元計數器 `X/30 字元` 即時顯示
- 按鈕狀態連動 `profileChanged` memo
- 未修改時按鈕 disabled
- 儲存中按鈕顯示 "儲存中..."

## ✅ 品質驗證

| 項目 | 結果 |
|------|------|
| 後端 `npx tsc --noEmit` | ✅ 零錯誤 |
| 前端 `npx tsc --noEmit` | ✅ 零錯誤 |
| Git 推送 | ✅ `93ae2b2` |

## 🏗️ 防護架構總覽

```
┌─────────────────────────────────────────────┐
│              前端 (MemberCenter)             │
│  sanitizeInput → 危險模式 → Unicode 驗證    │
│  → maxLength → disabled email → 計數器      │
└──────────────────┬──────────────────────────┘
                   │ PUT /api/user/profile
                   ▼
┌─────────────────────────────────────────────┐
│           後端 (user.ts route)               │
│  欄位白名單 → sanitizeComment(strict)       │
│  → entity 解碼 → Unicode 驗證 → 格式驗證   │
│  → logSecurityEvent → updated_at → DB       │
└─────────────────────────────────────────────┘
```
