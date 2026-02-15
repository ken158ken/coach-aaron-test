# 頭像渲染與顯示名稱修復報告（第三輪）

> **時間戳記**: 2026-02-19T10:00:00+08:00 (ISO 8601)  
> **延續**: `AVATAR_DISPLAY_NAME_FIX_2026-02-15T22-00-00+08-00.md`

---

## 📋 本次修復範圍

### 1. Sanitize Middleware — Regex `lastIndex` Bug

- **問題**: `detectSuspiciousRequest` 使用帶 `g` flag 的全域 `DANGEROUS_PATTERNS.sql` regex。JavaScript 中帶 `g` flag 的 regex 在連續 `.test()` 呼叫間會保留 `lastIndex`，導致跨請求的匹配結果**不穩定**（一次匹配、一次不匹配交替出現）
- **影響**: `sanitizeString` 中的 `DANGEROUS_PATTERNS.xss` 也使用同一全域物件，`.replace()` 可能因 `lastIndex` 問題而漏掉清理
- **修復**: 將 `DANGEROUS_PATTERNS` 常數改為 `createDangerousPatterns()` 工廠函式，每次呼叫回傳全新 RegExp 實例

### 2. AvatarPicker — 縮圖渲染優化

- **問題**: DiceBear 風格格子使用 `dangerouslySetInnerHTML` 直接注入 SVG 字串。SVG 內部的 `<svg>` 元素尺寸（`size=200`）可能超出容器的 `w-10 h-10`（40px），導致渲染溢出或變形
- **修復**:
  - 加入 `useMemo` 快取所有 DiceBear 縮圖，將 SVG 字串轉為 Blob URL
  - 將 `dangerouslySetInnerHTML` 改為 `<img>` 標籤呈現，瀏覽器自動縮放 SVG
  - 加入 `useEffect` cleanup 釋放 Blob URL，避免記憶體洩漏

### 3. 500 錯誤 — 持續追蹤修復

延續前兩輪的防禦性修復：

- ✅ 移除 `sanitizeComment` 呼叫（第一輪）
- ✅ `.single()` → `.maybeSingle()`（第二輪）
- ✅ `parseInt(rawUserId, 10)` 型別轉換（第二輪）
- ✅ Regex try-catch + CJK fallback（第二輪）
- ✅ 詳細錯誤回傳（`detail`, `code`, `hint`）（第二輪）
- ✅ **本輪**: 修正 middleware regex `lastIndex` bug — 可能導致 `sanitizeString` 清理行為不一致

---

## 🔧 修改檔案

| 檔案                                                 | 修改類型 | 說明                                                                 |
| ---------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| `backend/middleware/sanitize.ts`                     | 修改     | regex 全域物件改為工廠函式；`detectSuspiciousRequest` 加入 try-catch |
| `frontend/src/components/ui/avatar/AvatarPicker.tsx` | 優化     | DiceBear 縮圖改用 Blob URL + `<img>`；加入 `useMemo` 快取            |

### `backend/middleware/sanitize.ts` 詳細變更

```diff
- const DANGEROUS_PATTERNS = {
-   xss: /<script[^>]*>[\s\S]*?<\/script>|<iframe[^>]*>|javascript:/gi,
-   sql: /(\b(SELECT|INSERT|...)\b)/gi,
-   htmlTags: /..../gi,
- };
+ const createDangerousPatterns = () => ({
+   xss: /<script[^>]*>[\s\S]*?<\/script>|<iframe[^>]*>|javascript:/gi,
+   sql: /(\b(SELECT|INSERT|...)\b)/gi,
+   htmlTags: /..../gi,
+ });
```

- `sanitizeString`: `DANGEROUS_PATTERNS.xss` → `createDangerousPatterns().xss`
- `detectSuspiciousRequest`: 每次建立新 `sqlPattern`，外層加 try-catch

### `frontend/src/components/ui/avatar/AvatarPicker.tsx` 詳細變更

- 加入 `useMemo` import
- 新增 `dicebearThumbnails` — `useMemo` 快取 SVG→Blob URL 轉換結果
- 新增 `useEffect` cleanup — 組件卸載時 `revokeObjectURL`
- DiceBear 格子: `dangerouslySetInnerHTML={{ __html: svgStr }}` → `<img src={thumbSrc} />`

---

## ✅ 驗證結果

- [x] `backend/middleware/sanitize.ts` — 零 TypeScript 錯誤
- [x] `frontend/src/components/ui/avatar/AvatarPicker.tsx` — 零 TypeScript 錯誤
- [x] `backend/routes/user.ts` — 零 TypeScript 錯誤
- [x] `frontend/src/pages/MemberCenter.tsx` — 零 TypeScript 錯誤
- [x] 後端 `npx tsc --noEmit` — 通過
- [x] 前端 `npx tsc --noEmit` — 通過

---

## 📁 專案結構（影響範圍）

```
backend/
├── middleware/
│   └── sanitize.ts              ← 修改（regex 工廠函式）
├── routes/
│   └── user.ts                  ← 前輪修改（保持不變）
frontend/
├── src/
│   ├── entry-client.tsx          ← 前輪修改（保持不變）
│   ├── components/
│   │   └── ui/
│   │       └── avatar/
│   │           └── AvatarPicker.tsx  ← 本輪優化
│   └── pages/
│       └── MemberCenter.tsx       ← 前輪修改（保持不變）
```

---

## 🔮 後續建議

1. **部署後驗證**: 在 Vercel 上測試顯示名稱更新，觀察瀏覽器 console 的 `detail`/`code`/`hint` 欄位以確認 500 錯誤是否已解決
2. **清理 debug 日誌**: 確認 500 問題解決後，移除 `user.ts` 中的 `console.log` debug 輸出
3. **Supabase Dashboard**: 確認 `users` 表是否有 `updated_at` 自動更新觸發器（若有，移除 `updateData.updated_at` 手動賦值以避免衝突）
