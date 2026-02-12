# SSR 路由修復 & SEO Meta 標籤整合報告

**報告時間**: 2026-02-12T23:03:00+08:00  
**報告類型**: Bug Fix + Feature Enhancement  
**狀態**: 已提交，待部署驗證

---

## 📋 問題摘要

### 問題 1：SSR 未觸發（持續性問題）

**根本原因分析**：  
Vercel 路由優先順序為：`redirects` → `headers` → **Filesystem** → `rewrites`  
由於 `index.html` 存在於 `outputDirectory`（`frontend/dist/client`）中，所有頁面請求都被 Filesystem 層攔截並直接返回靜態 `index.html`，永遠不會觸發 `rewrites` 中的 SSR 路由。

**之前嘗試的修復方式**：

1. ❌ `mv` index.html → `cp`（buildCommand 中順序問題）
2. ❌ `routes` 替代 `rewrites`（與 `buildCommand`/`outputDirectory` 不相容）

**本次修復方式**：

- 在 `buildCommand` 末尾加入 `rm frontend/dist/client/index.html`
- 先 `cp` index.html 到 `api/_ssr_template.html`（SSR 模板用）
- 再 `rm` 從 outputDirectory 中刪除
- 回退到 `rewrites` 配置（這是與 Project Configuration 相容的正確方式）

### 問題 2：缺少 SEO Meta 標籤

**需求來源**: `SEO_CONTENT_PLAN.md`  
**教練特別強調的關鍵字**: `#私人教練銷售` `#健身教練銷售` `#皮拉提斯銷售`

---

## 🔧 修改檔案清單

### 1. `vercel.json` — SSR 路由修復

| 欄位           | 變更內容                                         |
| -------------- | ------------------------------------------------ |
| `buildCommand` | 末尾增加 `&& rm frontend/dist/client/index.html` |
| 路由策略       | 從 `routes`（legacy）回退到 `rewrites`（modern） |

**路由流程**（修復後）：

```
客戶端請求 /about
  → Filesystem: 無 index.html → 未匹配
  → Rewrites: /(.*) → /api/ssr → SSR 渲染 ✅

客戶端請求 /assets/main.js
  → Filesystem: 找到靜態檔案 → 直接返回 ✅

客戶端請求 /api/auth/login
  → Rewrites: /api/(.*) → /api/server → 後端 API ✅
```

### 2. SEO Meta 標籤 — 公開頁面

| 頁面 | 檔案          | Title                                       | noIndex |
| ---- | ------------- | ------------------------------------------- | ------- |
| 首頁 | `Home.tsx`    | 私教變現專家 \| 銷售心理學助健身教練月入8萬 | ❌      |
| 聯絡 | `Contact.tsx` | 聯絡阿倫教官 - 免費40分鐘1對1諮詢           | ❌      |

**首頁 Keywords**（16個）：

```
阿倫教官, 私人教練變現, 銷售心理學, 健身教練續課, 教練業績提升,
健身房銷售, 學生續約技巧, 健身教練收入, 教練培訓, NLP心理學,
健身教練行銷, 私教經營, 教練職涯發展, 健身產業顧問,
私人教練銷售, 健身教練銷售, 皮拉提斯銷售
```

### 3. SEO Meta 標籤 — 私密/管理頁面（noIndex）

| 頁面     | 檔案               | Title                    | noIndex |
| -------- | ------------------ | ------------------------ | ------- |
| 教練寫真 | `CoachPhotos.tsx`  | 教練寫真相簿 \| 阿倫教官 | ✅      |
| 登入     | `Login.tsx`        | 登入 \| 阿倫教官         | ✅      |
| 註冊     | `Register.tsx`     | 註冊 \| 阿倫教官         | ✅      |
| 會員中心 | `MemberCenter.tsx` | 會員中心 \| 阿倫教官     | ✅      |
| 管理後台 | `Dashboard.tsx`    | 管理後台 \| 阿倫教官     | ✅      |

### 4. 已有 SEOHead 的頁面（無需修改）

- `Courses.tsx` — 已有 SEOHead
- `Articles.tsx` — 已有 SEOHead
- `Videos.tsx` — 已有 SEOHead
- `Checkout.tsx` — 已有 SEOHead
- `CheckoutSuccess.tsx` — 已有 SEOHead

---

## ✅ 驗證清單

部署後需確認：

- [ ] Vercel Build 成功（無報錯）
- [ ] Function size 維持 < 10MB
- [ ] SSR 觸發：`curl -I https://coach-aaron.com/` 回應含 `X-Rendered-By: ssr`
- [ ] SSR 輸出：`curl https://coach-aaron.com/` 不含 `<!--ssr-outlet-->`
- [ ] SEO Meta：首頁 HTML source 包含 `<meta name="description" ...>`
- [ ] SEO Meta：首頁 HTML source 包含 `<meta name="keywords" ...>`
- [ ] 靜態資源正常：CSS/JS/圖片可載入
- [ ] API 正常：`/api/auth/login` 等端點可存取
- [ ] CSR Hydration：頁面可正常互動

---

## 📊 技術決策紀錄

### 為什麼不用 `routes`（legacy）？

Vercel 有兩套路由系統：

1. **Legacy**: `routes` 陣列（與 `handle: filesystem` 搭配）
2. **Modern**: `rewrites`/`redirects`/`headers`（與 `buildCommand`/`outputDirectory` 搭配）

兩者**不能混用**。因為專案使用 `buildCommand` + `outputDirectory`（Modern），必須用 `rewrites`。

### 為什麼用 `rm` 而不是 `mv`？

`mv` 在之前的嘗試中可能因 build cache 導致問題。`cp` + `rm` 更明確：

1. `cp` 確保 SSR 模板被複製到 `api/` 目錄
2. `rm` 確保 `index.html` 從 outputDirectory 中被刪除

---

## 📝 後續優化建議

1. **ArticleDetail / CourseDetail 頁面**：加入動態 SEO meta（依據文章/課程標題）
2. **Sitemap 生成**：建立 `sitemap.xml` 自動生成腳本
3. **Structured Data**：加入 JSON-LD 結構化資料（Person、Course）
4. **OG Image**：為各頁面設計專屬的 Open Graph 圖片
5. **Performance**: 考慮 ISR (Incremental Static Regeneration) 取代純 SSR
