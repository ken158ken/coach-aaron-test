# 📧 聯絡表單 Resend Email 整合報告

> **報告時間**: 2026-02-13T10:00:00+08:00
> **影響範圍**: Contact 頁面、後端 API、環境變數

---

## 📋 任務摘要

在聯絡頁面 (`/contact`) 加入教練真實個人資訊、社群連結，並透過 Resend Email API 完成聯絡表單的寄信功能，含完整輸入消毒與速率限制。

---

## 🔧 技術實作

### 1. 後端路由 — `backend/routes/contact.ts`

#### API 端點

```
POST /api/contact
Content-Type: application/json

{
  "name": "訪客姓名",
  "email": "visitor@example.com",
  "phone": "0912345678",      // 選填
  "subject": "諮詢主題",
  "message": "訊息內容..."
}
```

#### 速率限制

| 設定 | 值 |
| --- | --- |
| 時間窗口 | 15 分鐘 |
| 每 IP 最大請求數 | 5 |
| 超限回應 | 429 Too Many Requests |
| 訊息 | "您已送出太多次聯繫表單，請稍後再試" |

#### 輸入消毒 (`sanitizeInput`)

多層防護函數，依序執行：

1. **HTML 標籤移除**: `/<[^>]*>/g` → 空字串
2. **危險協議阻擋**: `javascript:`, `vbscript:`, `data:` 前綴移除
3. **事件處理器移除**: `on\w+=` 模式匹配移除
4. **前後空白修剪**: `.trim()`
5. **長度截斷**: 依欄位設定最大長度

#### 欄位驗證規則

| 欄位 | 類型 | 長度限制 | 格式驗證 |
| --- | --- | --- | --- |
| `name` | 必填 | 2-100 字元 | — |
| `email` | 必填 | ≤200 字元 | RFC 5322 正則 |
| `phone` | 選填 | ≤20 字元 | 僅數字、+、-、()、空格 |
| `subject` | 必填 | 2-200 字元 | — |
| `message` | 必填 | 10-5000 字元 | — |

#### Resend API 整合

```
POST https://api.resend.com/emails
Authorization: Bearer ${RESEND_API_KEY}

{
  "from": "Coach Aaron 網站 <onboarding@resend.dev>",
  "to": ["s330221@gmail.com"],
  "reply_to": "visitor@example.com",
  "subject": "[Coach Aaron 網站] 諮詢主題",
  "html": "<HTML 模板>"
}
```

- **寄件者**: `onboarding@resend.dev` (Resend 免費方案限制)
- **reply_to**: 訪客 Email，教練可直接回覆
- **HTML 模板**: 金黑 luxe 主題風格，含訪客姓名、信箱、電話、主題、訊息、時間戳記

#### 環境變數

| 變數 | 用途 | 必填 |
| --- | --- | --- |
| `RESEND_API_KEY` | Resend API Key | ✅ |
| `COACH_EMAIL` | 教練收件信箱 | ⚡ (預設 s330221@gmail.com) |

---

### 2. 前端常數 — `frontend/src/constants/app.ts`

#### 新增 `COACH_INFO`

```typescript
export const COACH_INFO = {
  NAME: "阿倫教官",
  TITLE: "威豪健身總教官｜私教變現專家",
  EMAIL: "s330221@gmail.com",
  LINE_ID: "@667nqldx",
  BUSINESS_HOURS: "週一至週六 09:00 - 21:00",
};
```

#### 更新 `SOCIAL_LINKS`

| 平台 | 連結 |
| --- | --- |
| Instagram | https://www.instagram.com/coach.luen/ |
| Facebook | https://www.facebook.com/Coach.Luen |
| LINE Official | https://line.me/R/ti/p/@667nqldx |
| LINE Group | https://line.me/ti/g2/... |
| TikTok | https://www.tiktok.com/@coachluen |
| Podcast | https://podcasts.apple.com/tw/podcast/... |

---

### 3. Contact 頁面 — `frontend/src/pages/Contact.tsx`

#### 頁面結構

1. **教練資訊 Banner** — 照片、名稱、頭銜、認證徽章（NSCA、TQUK、NLP、130+教練）
2. **LINE 官方帳號卡片** — 綠色主題突顯，一鍵加好友
3. **6 大社群連結** — 各附說明文字
4. **聯絡表單** — 5 欄位 + 前端即時驗證
5. **營業時間提示** — 回覆時間說明

#### 表單驗證（前端）

| 欄位 | 驗證規則 |
| --- | --- |
| 姓名 | 2-50 字元，必填 |
| Email | 正則驗證格式，必填 |
| 電話 | 台灣手機/市話格式，選填 |
| 主題 | 2-100 字元，必填 |
| 訊息 | 10-2000 字元，必填 |

#### 表單狀態管理

- `isSubmitting` — 送出中 loading 動畫
- `submitSuccess` — 成功提示（5 秒後自動消失）
- `submitError` — 錯誤提示

#### SEO Meta

- Title: `聯絡我們 - 免費健身諮詢 | Coach Aaron 阿倫教官`
- Keywords: 包含 `私人教練銷售`、`健身教練銷售`、`皮拉提斯銷售` 等

---

### 4. 後端入口 — `backend/index.ts`

```typescript
import contactRoutes from "./routes/contact.js";
app.use("/api/contact", contactRoutes);
```

---

## 🔒 安全性設計

### 防護架構

```
前端驗證 (React) → 速率限制 (express-rate-limit) → 輸入消毒 (sanitizeInput) → 格式驗證 → Resend API
```

### 防護的攻擊類型

| 攻擊類型 | 防護措施 |
| --- | --- |
| XSS | HTML 標籤移除、`javascript:` 協議阻擋 |
| HTML 注入 | 所有 `<tag>` 移除 |
| Email Header 注入 | Email 格式正則驗證 |
| 速率攻擊 (DoS) | 每 IP 每 15 分鐘 5 次限制 |
| 超長輸入 | 每欄位長度截斷 |

---

## 📁 檔案變更清單

| 操作 | 檔案 | 說明 |
| --- | --- | --- |
| ✅ 新增 | `backend/routes/contact.ts` | Resend 寄信路由 + 速率限制 + 消毒 |
| ✏️ 修改 | `backend/index.ts` | 新增 contactRoutes 匯入與註冊 |
| ✏️ 修改 | `frontend/src/constants/app.ts` | SOCIAL_LINKS 更新 + COACH_INFO 新增 |
| ✏️ 修改 | `frontend/src/pages/Contact.tsx` | 完全重寫：教練資訊 + 社群 + 表單 |

---

## ⚠️ 部署注意事項

### Vercel 環境變數設定

部署前需在 Vercel Dashboard 設定：

1. `RESEND_API_KEY` — Resend API Key（必填）
2. `COACH_EMAIL` — 教練收件信箱（選填，有預設值）

### Resend 免費方案限制

- 寄件者固定為 `onboarding@resend.dev`
- 每月 3,000 封免費
- 每日 100 封限制
- 若需自訂網域寄件者，需升級並驗證 DNS

---

## ✅ 驗證結果

- ✅ TypeScript 零編譯錯誤
- ✅ 前端驗證邏輯完整
- ✅ 後端消毒覆蓋所有欄位
- ✅ 速率限制正確配置
- ✅ HTML 郵件模板正確渲染
- ⏳ 實際寄信測試待 Vercel 環境變數設定後進行
