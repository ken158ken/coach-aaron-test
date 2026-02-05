# 編輯器增強與 UX 改進報告

**報告時間：** 2026-02-04T14:00:00Z  
**作者：** GitHub Copilot  
**版本：** 2.0.0

---

## 📋 執行摘要

本次更新針對文章編輯器進行全面的使用者體驗改進，包含：

1. **全域搜尋系統** - 快速搜尋課程、文章、評論
2. **美化對話框元件** - 取代原生 `prompt()` / `alert()` / `confirm()`
3. **嚴格媒體來源驗證** - 強制 Cloudinary 圖片、YouTube 影片
4. **YouTube 即時預覽** - 插入前預覽影片
5. **可調整大小媒體** - 圖片和影片支援拖曳調整尺寸
6. **自動 Slug 生成** - 無需手動輸入網址代稱
7. **改進的 UX 提示** - 更清晰的標籤輸入提示

---

## 🆕 新增功能

### 1. 全域搜尋系統

**檔案：**

- [frontend/src/components/ui/GlobalSearch.tsx](frontend/src/components/ui/GlobalSearch.tsx)
- [backend/routes/search.ts](backend/routes/search.ts)

**功能特點：**

- ⌨️ 快捷鍵 `Ctrl+K` / `Cmd+K` 開啟搜尋
- 🔍 即時搜尋（300ms debounce）
- 📚 搜尋範圍：課程、文章、評論、評價
- ⬆️⬇️ 鍵盤導航結果
- 🎨 美化的搜尋結果卡片

**安全措施：**

```typescript
// 搜尋輸入消毒
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[%_]/g, "") // 移除 SQL 通配符
    .replace(/<[^>]*>/g, "") // 移除 HTML 標籤
    .replace(/['"`;\\]/g, "") // 移除危險字元
    .substring(0, 100); // 長度限制
}
```

---

### 2. 美化對話框元件

**檔案：** [frontend/src/components/ui/Dialog.tsx](frontend/src/components/ui/Dialog.tsx)

**元件列表：**

| 元件             | 用途         | 特點                             |
| ---------------- | ------------ | -------------------------------- |
| `Modal`          | 基礎彈出層   | Portal 渲染、ESC 關閉、背景遮罩  |
| `PromptDialog`   | 輸入對話框   | 即時驗證、預覽支援、自訂驗證函數 |
| `ConfirmDialog`  | 確認對話框   | danger 變體、自訂按鈕文字        |
| `AlertDialog`    | 提示對話框   | info/success/warning/error 類型  |
| `DialogProvider` | 全域 Context | 在任何元件使用 `useDialog()`     |

**使用範例：**

```tsx
const { prompt, confirm, alert } = useDialog();

// 帶驗證的輸入對話框
const url = await prompt({
  title: "插入圖片",
  placeholder: "https://res.cloudinary.com/...",
  validation: (value) => {
    if (!isValidCloudinaryUrl(value)) {
      return "❌ 只能使用 Cloudinary 圖片網址！";
    }
    return null;
  },
  renderPreview: (value) => <img src={value} alt="預覽" />,
});
```

---

### 3. 嚴格媒體來源驗證

**驗證規則：**

| 媒體類型 | 允許來源   | 驗證正則                                                       |
| -------- | ---------- | -------------------------------------------------------------- |
| 圖片     | Cloudinary | `^https?://res\.cloudinary\.com/.+`                            |
| 影片     | YouTube    | `youtube\.com/watch\?v=`, `youtu\.be/`, `youtube\.com/shorts/` |

**雙重驗證機制：**

1. **前端 UI 驗證** - 即時顯示錯誤訊息，按鈕禁用
2. **POST 前二次驗證** - 確認後再次檢查，防止繞過

```tsx
// 二次驗證範例
if (url && editor) {
  // 防護措施：即使通過 Dialog 驗證，仍再次檢查
  if (!isValidCloudinaryUrl(url)) {
    await dialog.alert({
      type: "error",
      title: "無效的圖片網址",
      message: "只能使用 Cloudinary 圖片網址！",
    });
    return;
  }
  // 通過驗證後才插入
  editor
    .chain()
    .focus()
    .insertContent({ type: "resizableImage", attrs: { src: url } })
    .run();
}
```

---

### 4. YouTube 即時預覽

**功能：** 在 PromptDialog 輸入 YouTube 網址時，即時顯示影片 iframe 預覽

```tsx
renderPreview: (value) => {
  const videoId = extractYouTubeId(value);
  return videoId ? (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      className="w-full aspect-video"
      allowFullScreen
    />
  ) : null;
};
```

---

### 5. 可調整大小媒體擴展

**檔案：**

- [frontend/src/components/editor/ResizableImage.tsx](frontend/src/components/editor/ResizableImage.tsx)
- [frontend/src/components/editor/ResizableYoutube.tsx](frontend/src/components/editor/ResizableYoutube.tsx)

**功能特點：**

- 🖱️ 右下角拖曳手柄調整大小
- 📐 YouTube 維持 16:9 比例
- 📏 顯示當前尺寸
- 🎯 選中狀態金色外框
- 🏷️ YouTube 影片左上角紅色標籤

**尺寸限制：**
| 媒體類型 | 最小寬度 | 最大寬度 |
|---------|---------|---------|
| 圖片 | 100px | 800px |
| YouTube | 280px | 960px |

---

### 6. 自動 Slug 生成

**變更：**

- ❌ 移除手動輸入 slug 欄位
- ✅ 標題變更時自動生成 slug
- ✅ 顯示為唯讀預覽：`/articles/{auto-generated-slug}`

**生成規則：**

```typescript
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // 移除特殊字元
    .replace(/\s+/g, "-") // 空格轉連字號
    .slice(0, 50); // 限制長度
};
```

---

### 7. 改進的 UX 提示

**標籤輸入：**

- 之前：`placeholder="輸入標籤..."`
- 現在：`placeholder="輸入標籤按 enter 新增"`

---

## 📁 檔案變更清單

### 新增檔案

| 檔案路徑                                              | 說明                         |
| ----------------------------------------------------- | ---------------------------- |
| `frontend/src/components/ui/Dialog.tsx`               | 美化對話框元件               |
| `frontend/src/components/ui/GlobalSearch.tsx`         | 全域搜尋元件                 |
| `frontend/src/components/editor/ResizableImage.tsx`   | 可調大小圖片 Tiptap 擴展     |
| `frontend/src/components/editor/ResizableYoutube.tsx` | 可調大小 YouTube Tiptap 擴展 |
| `frontend/src/components/editor/index.ts`             | 編輯器擴展導出               |
| `backend/routes/search.ts`                            | 搜尋 API 路由                |

### 修改檔案

| 檔案路徑                                     | 變更內容                               |
| -------------------------------------------- | -------------------------------------- |
| `frontend/src/App.tsx`                       | 加入 DialogProvider                    |
| `frontend/src/components/layout/Navbar.tsx`  | 加入搜尋按鈕和 GlobalSearch            |
| `frontend/src/components/ui/index.ts`        | 導出 Dialog 和 GlobalSearch            |
| `frontend/src/pages/admin/ArticleEditor.tsx` | 使用新 Dialog、可調大小擴展、自動 slug |
| `backend/index.ts`                           | 加入搜尋路由                           |
| `backend/utils/sanitizer.ts`                 | 加入 sanitizeSearchQuery               |

---

## 🔐 安全考量

1. **輸入消毒** - 所有搜尋輸入經過 sanitizeSearchQuery 處理
2. **媒體來源白名單** - 只允許 Cloudinary 和 YouTube
3. **雙重驗證** - UI 驗證 + POST 前再次驗證
4. **Rate Limiting** - 搜尋 API 受全域速率限制保護
5. **日誌記錄** - 搜尋行為記錄到安全日誌

---

## 📊 使用者體驗改進

| 面向      | 之前          | 之後                    |
| --------- | ------------- | ----------------------- |
| 搜尋      | 無            | Ctrl+K 快速搜尋         |
| 對話框    | 原生 prompt() | 美化 PromptDialog       |
| 圖片插入  | 無來源限制    | 強制 Cloudinary         |
| 影片插入  | 無預覽        | 即時 iframe 預覽        |
| 媒體大小  | 固定          | 可拖曳調整              |
| Slug 輸入 | 手動          | 自動生成                |
| 標籤提示  | 不明確        | "輸入標籤按 enter 新增" |

---

## 🧪 測試建議

1. **搜尋功能測試**
   - 測試 Ctrl+K 快捷鍵
   - 測試空搜尋、特殊字元搜尋
   - 測試鍵盤導航

2. **對話框測試**
   - 測試 ESC 關閉
   - 測試驗證錯誤顯示
   - 測試預覽渲染

3. **媒體驗證測試**
   - 測試非 Cloudinary 圖片網址
   - 測試非 YouTube 影片網址
   - 測試二次驗證阻擋

4. **調整大小測試**
   - 測試圖片拖曳調整
   - 測試 YouTube 維持比例
   - 測試尺寸限制

---

## 📈 後續優化建議

1. **搜尋功能增強**
   - 新增搜尋歷史記錄
   - 新增熱門搜尋推薦
   - 支援進階篩選（按類型、日期）

2. **媒體功能增強**
   - 支援圖片裁剪
   - 支援影片開始時間
   - 支援更多影片平台（Vimeo）

3. **編輯器改進**
   - 支援拖放上傳到 Cloudinary
   - 支援圖片 alt 文字編輯
   - 支援表格插入

---

_報告由 GitHub Copilot 自動生成_
