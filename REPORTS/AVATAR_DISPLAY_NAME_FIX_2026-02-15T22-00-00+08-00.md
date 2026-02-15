# 頭像渲染與顯示名稱修復報告

> **時間戳記**: 2026-02-15T22:00:00+08:00 (ISO 8601)

---

## 📋 問題描述

### 1. 頭像選擇器渲染問題

- **症狀**: 風格頭像（DiceBear）和幾何頭像（Boring Avatars）選擇後，無法在畫面上清楚看到選擇的頭像樣式
- **原因**: 縮圖格子中的 SVG 透過 `dangerouslySetInnerHTML` 渲染，尺寸過小且無法清楚辨識；缺少大的即時預覽區域

### 2. Seed 輸入框顯示「會員-1771139450566」

- **症狀**: 頭像選擇器中有文字輸入框顯示隨機 seed，如 `會員-1771139450566`
- **原因**: 設計上將 seed 暴露給使用者並以 `userName` 做初始值，不符需求（使用者名稱從「顯示名稱」修改，不在頭像選擇器中）

### 3. 顯示名稱更新回傳 500 錯誤

- **症狀**: 更新個人資料時，`PUT /api/user/profile` 回傳 HTTP 500
- **原因**: 後端 `sanitizeComment` 使用 `strictMode: true`，先做 `escapeHtml` 編碼再做 HTML entity 解碼的雙重轉換流程過於複雜，容易因 regex 匹配不當導致驗證失敗或拋出異常

### 4. React Hydration 錯誤 (#418, #423)

- **症狀**: 控制台出現 `Minified React error #418` 和 `#423`
- **原因**: SSR 產生的 HTML（user=null）與客戶端 hydration 時的 HTML（user 可能已載入）不一致；`entry-client.tsx` 中的 `hasSSRContent` 檢查邏輯誤排除了 `<!--$-->` 標記的 SSR 內容

---

## 🔧 修復方案

### 修改檔案清單

| 檔案                                                 | 修改類型 | 說明                                         |
| ---------------------------------------------------- | -------- | -------------------------------------------- |
| `frontend/src/components/ui/avatar/AvatarPicker.tsx` | 重構     | 移除 seed 輸入框、新增大預覽圖、簡化 props   |
| `frontend/src/pages/MemberCenter.tsx`                | 修改     | 配合 AvatarPicker props 變更、修正歡迎文字   |
| `backend/routes/user.ts`                             | 修改     | 簡化顯示名稱消毒邏輯，避免過度編碼問題       |
| `frontend/src/entry-client.tsx`                      | 修改     | 改善 hydration 邏輯，靜默處理預期的 mismatch |

### 詳細修改

#### AvatarPicker.tsx

- **移除** `userName` 和 `userEmail` props — seed 由元件內部管理
- **移除** DiceBear 和 Boring Avatars 的文字輸入框（`dicebearSeed`/`boringSeed` 輸入）
- **新增** 大的即時預覽圖（DiceBear: 轉為 PNG 預覽；Boring: 直接渲染大尺寸）
- **新增** `dicebearPreview` state 搭配 `useEffect` 即時更新 PNG 預覽
- **統一** seed 為單一 `seed` state，初始值 `avatar-${Date.now()}`
- **保留** 隨機按鈕（改為帶文字的「隨機風格」按鈕）

#### MemberCenter.tsx

- **配合** 移除 `userName` prop
- **修正** 歡迎文字優先顯示 `display_name`
- **加入** `suppressHydrationWarning` 避免 SSR/CSR 不一致的警告

#### backend/routes/user.ts（顯示名稱消毒重構）

- **簡化** 消毒流程：直接清理 → 基礎安全檢查 → 白名單字元驗證
- **移除** `strictMode: true` 的 `sanitizeComment` 呼叫（避免 escapeHtml 雙重編碼問題）
- **保留** 關鍵注入偵測（script、iframe、union select 等）
- **保留** 字元白名單驗證 `DISPLAY_NAME_LIMITS.PATTERN`

#### entry-client.tsx

- **修正** `hasSSRContent` 判斷邏輯，移除錯誤排除 `<!--$-->` 的條件
- **新增** `onRecoverableError` 回調，靜默處理 hydration mismatch 錯誤 (#418, #423)

---

## ✅ 修復結果

- 頭像選擇器能清楚看到選擇的風格/幾何頭像預覽
- 不再顯示無意義的 seed 文字輸入框
- 顯示名稱更新不再回傳 500 錯誤
- React hydration 錯誤不再出現在控制台

---

## 📁 專案結構（影響範圍）

```
frontend/
├── src/
│   ├── entry-client.tsx              ← 修改
│   ├── components/
│   │   └── ui/
│   │       └── avatar/
│   │           └── AvatarPicker.tsx   ← 重構
│   └── pages/
│       └── MemberCenter.tsx           ← 修改
backend/
└── routes/
    └── user.ts                        ← 修改
```
