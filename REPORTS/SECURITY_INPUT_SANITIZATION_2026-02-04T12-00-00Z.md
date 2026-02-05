# 安全性增強報告 - 評論系統注入風險管理

**報告時間**: 2026-02-04T12:00:00Z  
**報告版本**: 1.0  
**專案**: Coach Aaron 網站

---

## 執行摘要

本次更新對評論系統（課程評論、文章留言、文章評分）實施了多層防護機制，以防範以下安全威脅：

- **XSS（跨站腳本攻擊）**
- **HTML 注入**
- **SQL 注入**
- **命令注入**
- **模板注入**

---

## 安全架構設計

### 多層防護策略

```
┌─────────────────────────────────────────────────────────────┐
│                      前端防護層                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ useSafeInput Hook                                    │    │
│  │ - 即時輸入驗證                                       │    │
│  │ - 危險模式偵測                                       │    │
│  │ - 字元長度限制                                       │    │
│  │ - 控制字元過濾                                       │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      後端防護層                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ sanitizer.ts 模組                                    │    │
│  │ - ID 驗證 (sanitizeId)                              │    │
│  │ - 評分驗證 (sanitizeRating)                         │    │
│  │ - 內容消毒 (sanitizeComment)                        │    │
│  │   • HTML 標籤移除                                    │    │
│  │   • HTML 實體編碼                                    │    │
│  │   • 危險模式偵測與拒絕                              │    │
│  │   • 長度驗證                                         │    │
│  │ - 安全事件記錄 (logSecurityEvent)                   │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      資料庫層                                │
│  - 使用 Supabase 參數化查詢（自動防 SQL 注入）              │
│  - 儲存經過消毒的內容                                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      輸出防護層                              │
│  - API 回應內容再次消毒 (sanitizeApiResponse)               │
│  - 前端安全渲染 (renderSafeContent)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 新增檔案

### 1. 後端安全模組

**檔案**: `backend/utils/sanitizer.ts`

提供以下功能：

- `sanitizeComment()` - 評論內容消毒
- `sanitizeRating()` - 評分驗證
- `sanitizeId()` - ID 格式驗證
- `escapeHtml()` - HTML 實體編碼
- `stripHtmlTags()` - HTML 標籤移除
- `detectDangerousPatterns()` - 危險模式偵測
- `sanitizeApiResponse()` - API 回應消毒
- `logSecurityEvent()` - 安全事件記錄

### 2. 前端安全 Hook

**檔案**: `frontend/src/hooks/useSafeInput.ts`

提供以下功能：

- `useSafeInput()` - 安全文字輸入 Hook
- `useRatingInput()` - 安全評分輸入 Hook
- `safeDisplayContent()` - 安全顯示內容
- `renderSafeContent()` - 安全渲染內容

---

## 修改檔案

### 後端路由

#### `backend/routes/courses.ts`

- 新增 sanitizer 引入
- `GET /api/courses/:id/reviews` - 增加 ID 驗證與輸出消毒
- `POST /api/courses/:id/reviews` - 增加完整輸入驗證與安全記錄

#### `backend/routes/articles.ts`

- 新增 sanitizer 引入
- `GET /api/articles/:id/comments` - 增加 ID 驗證與輸出消毒
- `POST /api/articles/:id/ratings` - 增加輸入驗證與安全記錄
- `POST /api/articles/:id/comments` - 增加完整輸入驗證與安全記錄

### 前端頁面

#### `frontend/src/pages/CourseDetail.tsx`

- 使用 `useSafeInput` 處理評論輸入
- 使用 `useRatingInput` 處理評分
- 使用 `renderSafeContent` 安全渲染評論
- 增加即時驗證回饋（字數統計、錯誤提示）

#### `frontend/src/pages/ArticleDetail.tsx`

- 使用 `useSafeInput` 處理留言和回覆輸入
- 使用 `useRatingInput` 處理評分
- 使用 `renderSafeContent` 安全渲染留言
- 增加即時驗證回饋

---

## 防護的攻擊類型

### 1. XSS（跨站腳本攻擊）

**偵測模式**:

```javascript
/<script[\s\S]*?>/gi
/javascript:/gi
/on\w+\s*=/gi  // 事件處理器
/expression\s*\(/gi  // CSS expression
```

**防護措施**:

- HTML 標籤移除
- 危險字元 HTML 實體編碼 (`<` → `&lt;`)
- 事件處理器偵測與拒絕

### 2. HTML 注入

**偵測模式**:

```javascript
/<iframe[\s\S]*?>/gi
/<object[\s\S]*?>/gi
/<embed[\s\S]*?>/gi
/<form[\s\S]*?>/gi
```

**防護措施**:

- 所有 HTML 標籤移除
- 內容純文字化

### 3. SQL 注入

**偵測模式**:

```javascript
/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|OR|AND)\b\s+(FROM|INTO|TABLE|DATABASE|WHERE|SET|VALUES|ALL|SELECT))/gi
/;\s*-{2}/g  // SQL 註解
/\bunion\b\s+\bselect\b/gi
```

**防護措施**:

- 危險 SQL 關鍵字組合偵測
- Supabase 參數化查詢（根本防護）

### 4. 命令注入

**偵測模式**:

```javascript
/\|\s*\w+/g  // 管道命令
/;\s*\w+/g  // 分號命令
/`[^`]+`/g  // 反引號命令
/\$\([^)]+\)/g  // Shell 命令替換
```

### 5. 模板注入

**偵測模式**:

```javascript
/\{\{[\s\S]*?\}\}/g  // Mustache/Angular 模板
/\$\{[\s\S]*?\}/g    // JavaScript 模板字串
```

---

## 安全事件記錄

當偵測到潛在攻擊時，系統會記錄以下資訊：

```typescript
logSecurityEvent("COMMENT_THREAT_DETECTED", {
  userId, // 使用者 ID
  ip: userIp, // IP 地址
  courseId, // 課程/文章 ID
  threatType, // 威脅類型
  inputPreview, // 輸入預覽（前 100 字元）
});
```

---

## 使用者體驗改進

### 即時回饋

- 字數統計顯示（如 `150 / 2000`）
- 剩餘字數警告（< 100 字元時變色）
- 錯誤訊息即時顯示

### 輸入限制

- 評論最大 2000 字元
- 回覆最大 1000 字元
- 自動移除危險控制字元
- 自動標準化換行符號

---

## 測試建議

### 手動測試案例

1. **XSS 測試**:

   ```
   <script>alert('XSS')</script>
   <img src=x onerror=alert('XSS')>
   javascript:alert('XSS')
   ```

2. **HTML 注入測試**:

   ```
   <iframe src="https://evil.com"></iframe>
   <form action="https://evil.com"><input type="submit"></form>
   ```

3. **SQL 注入測試**:

   ```
   '; DROP TABLE users; --
   ' OR '1'='1
   ```

4. **正常輸入測試**:
   ```
   這是一個正常的評論！
   包含特殊符號 < > & " '
   多行
   內容
   ```

---

## 限制與未來改進

### 當前限制

1. 嚴格模式可能誤判部分合法內容（如程式碼討論）
2. 未實施 Rate Limiting（建議後續加入）
3. 未實施 CAPTCHA（建議高風險操作加入）

### 建議改進

1. 加入 Rate Limiting 防止暴力攻擊
2. 對於重複違規者實施暫時封鎖
3. 加入內容審核佇列功能
4. 實施 CSP (Content Security Policy) 標頭

---

## 結論

本次安全增強實施了業界標準的多層防護策略，有效降低了評論系統的注入風險。建議定期審查安全日誌，並持續更新危險模式偵測規則以應對新型攻擊。

---

**報告撰寫**: GitHub Copilot  
**審核狀態**: 待審核
