# Tiptap 編輯器擴展升級報告

**報告時間**: 2026-02-04T23:50:00+08:00  
**報告類型**: 功能升級  
**狀態**: ✅ 完成

---

## 📋 升級概述

本次升級將文章編輯器 (ArticleEditor) 的 Tiptap 編輯器從基本功能擴展至全功能版本，新增 17 個 Tiptap 擴展套件，並實現全寬螢幕編輯與發布前預覽功能。

---

## 📦 新增 Tiptap 擴展套件

### 安裝命令

```bash
npm install @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight \
  @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-code-block \
  @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell \
  @tiptap/extension-table-header @tiptap/extension-task-list @tiptap/extension-task-item \
  @tiptap/extension-character-count @tiptap/extension-typography @tiptap/extension-dropcursor \
  @tiptap/extension-gapcursor
```

### 套件清單

| 套件名稱                            | 功能         | 配置               |
| ----------------------------------- | ------------ | ------------------ |
| `@tiptap/extension-text-style`      | 文字樣式基礎 | -                  |
| `@tiptap/extension-color`           | 文字顏色     | 10 種預設顏色      |
| `@tiptap/extension-highlight`       | 螢光標記     | `multicolor: true` |
| `@tiptap/extension-subscript`       | 下標文字     | -                  |
| `@tiptap/extension-superscript`     | 上標文字     | -                  |
| `@tiptap/extension-table`           | 表格         | `resizable: true`  |
| `@tiptap/extension-table-row`       | 表格列       | -                  |
| `@tiptap/extension-table-cell`      | 表格儲存格   | -                  |
| `@tiptap/extension-table-header`    | 表格標頭     | -                  |
| `@tiptap/extension-task-list`       | 待辦清單     | -                  |
| `@tiptap/extension-task-item`       | 待辦項目     | `nested: true`     |
| `@tiptap/extension-character-count` | 字數統計     | `limit: 50000`     |
| `@tiptap/extension-typography`      | 排版自動修正 | -                  |
| `@tiptap/extension-code-block`      | 程式碼區塊   | StarterKit 內建    |
| `@tiptap/extension-dropcursor`      | 拖放游標     | StarterKit 內建    |
| `@tiptap/extension-gapcursor`       | 間隙游標     | StarterKit 內建    |

---

## 🎨 工具列功能

### 基本格式 (8 個按鈕)

| 按鈕 | 功能     | Title 描述                      |
| ---- | -------- | ------------------------------- |
| B    | 粗體     | 粗體 (Ctrl+B) - 讓文字變粗      |
| I    | 斜體     | 斜體 (Ctrl+I) - 讓文字傾斜      |
| U    | 底線     | 底線 (Ctrl+U) - 在文字下方加線  |
| S    | 刪除線   | 刪除線 - 在文字中間加橫線       |
| X₂   | 下標     | 下標 - 化學式如 H₂O             |
| X²   | 上標     | 上標 - 數學次方如 E=mc²         |
| 🔴A▼ | 文字顏色 | 文字顏色 - 點擊展開顏色選擇器   |
| █H▼  | 螢光標記 | 螢光標記 - 點擊展開螢光色選擇器 |

### 標題 (3 個按鈕)

| 按鈕 | 功能   | Title 描述                             |
| ---- | ------ | -------------------------------------- |
| H1   | 大標題 | 大標題 (H1) - 文章主標題，每篇只用一次 |
| H2   | 中標題 | 中標題 (H2) - 段落標題，劃分主要段落   |
| H3   | 小標題 | 小標題 (H3) - 子段落標題，細分內容     |

### 列表 (3 個按鈕)

| 按鈕 | 功能     | Title 描述                  |
| ---- | -------- | --------------------------- |
| •    | 項目符號 | 項目符號列表 - 無順序的清單 |
| 1.   | 編號列表 | 編號列表 - 有順序的清單     |
| ☑    | 待辦清單 | 待辦清單 - 可勾選的任務清單 |

### 區塊 (3 個按鈕)

| 按鈕 | 功能     | Title 描述                        |
| ---- | -------- | --------------------------------- |
| ❝    | 引用區塊 | 引用區塊 - 引用他人的話或重要內容 |
| </>  | 程式碼塊 | 程式碼區塊 - 顯示程式碼，保留格式 |
| ―    | 水平線   | 水平分隔線 - 在段落之間加入分隔線 |

### 對齊 (3 個按鈕)

| 按鈕 | 功能 | Title 描述   |
| ---- | ---- | ------------ |
| ⬅    | 靠左 | 文字靠左對齊 |
| ⬛   | 置中 | 文字置中對齊 |
| ➡    | 靠右 | 文字靠右對齊 |

### 表格 (1 個下拉選單)

| 功能          | 說明                 |
| ------------- | -------------------- |
| 新增 3x3 表格 | 插入 3 列 3 欄的表格 |
| 新增列 (上方) | 在目前列上方新增一列 |
| 新增列 (下方) | 在目前列下方新增一列 |
| 刪除列        | 刪除目前的列         |
| 新增欄 (左側) | 在目前欄左側新增一欄 |
| 新增欄 (右側) | 在目前欄右側新增一欄 |
| 刪除欄        | 刪除目前的欄         |
| 刪除表格      | 刪除整個表格         |

### 媒體 (3 個按鈕)

| 按鈕 | 功能 | Title 描述                       |
| ---- | ---- | -------------------------------- |
| 🖼️   | 圖片 | 插入圖片 - 僅限 Cloudinary URL   |
| 🎬   | 影片 | 插入 YouTube - 嵌入 YouTube 影片 |
| 🔗   | 連結 | 插入連結 / 移除連結              |

---

## 🖥️ 全寬螢幕編輯

### 側邊欄收合功能

- **新增狀態**: `sidebarCollapsed` (boolean)
- **預設寬度**: 80px (固定定位在右側)
- **收合後**: 側邊欄隱藏，編輯區域佔滿全寬
- **切換按鈕**: 位於編輯器右側，點擊展開/收合

### 佈局設計

```
┌─────────────────────────────────────────────────────────┐
│ Header (固定頂部)                                        │
├─────────────────────────────────────────────────────────┤
│ Toolbar (編輯器工具列)                                   │
├───────────────────────────────────┬─────────────────────┤
│                                   │                     │
│     編輯區域                       │   側邊欄            │
│     (flex-1)                      │   (80px fixed)      │
│                                   │   [可收合]          │
│                                   │                     │
└───────────────────────────────────┴─────────────────────┘
```

---

## 📋 發布前預覽功能

### ArticlePreviewModal 元件

**檔案位置**: `frontend/src/components/admin/ArticlePreviewModal.tsx`

**Props 介面**:

```typescript
interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  article: {
    title: string;
    category: string;
    excerpt: string;
    coverImage: string;
    content: string;
  };
  isSubmitting: boolean;
}
```

**特色**:

- 使用 `createPortal` 渲染到 document.body
- 使用 `dangerouslySetInnerHTML` 預覽 HTML 內容
- 與 ArticleDetail 頁面使用相同的樣式類別
- 支援捲動與 ESC 鍵關閉

---

## 🔧 SSR 相容性修正

### 問題描述

Tiptap 在 SSR 環境下會觸發 hydration 錯誤：

```
Error: Tiptap Error: SSR has been detected, please set `immediatelyRender`
explicitly to `false` to avoid hydration mismatches.
```

### 解決方案

1. **immediatelyRender: false**

   ```typescript
   const editor = useEditor({
     immediatelyRender: false,  // 解決 SSR hydration 問題
     extensions: [...],
   });
   ```

2. **具名匯入 (Named Import)**

   ```typescript
   // ❌ 錯誤 - Default Import
   import TextStyle from "@tiptap/extension-text-style";

   // ✅ 正確 - Named Import
   import { TextStyle } from "@tiptap/extension-text-style";
   ```

3. **使用 StarterKit 內建擴展**
   - Strike, Blockquote, CodeBlock, HorizontalRule
   - Dropcursor, Gapcursor
   - 這些不需要額外匯入，由 StarterKit 提供

---

## 📄 CSS 樣式更新

**檔案**: `frontend/src/index.css`

### 新增樣式

```css
/* 表格樣式 */
.ProseMirror table {
  border-collapse: collapse;
  width: 100%;
}
.ProseMirror th,
.ProseMirror td {
  border: 1px solid #d4af37;
  padding: 0.5rem;
}

/* 待辦清單樣式 */
ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}
ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

/* 螢光標記樣式 */
.ProseMirror mark {
  border-radius: 0.25em;
  padding: 0.1em 0.25em;
}

/* 上下標樣式 */
.ProseMirror sub,
.ProseMirror sup {
  font-size: 0.75em;
}
```

---

## ✅ 測試檢查項目

- [x] TypeScript 編譯通過 (無錯誤)
- [x] SSR 伺服器啟動正常
- [x] 無 Tiptap SSR hydration 錯誤
- [x] 所有工具列按鈕有 title 屬性
- [x] 顏色選擇器正常顯示
- [x] 螢光標記選擇器正常顯示
- [x] 表格下拉選單正常顯示
- [x] 側邊欄收合功能正常
- [x] 預覽 Modal 元件建立完成

---

## 📝 檔案變更清單

| 檔案                                                    | 類型 | 說明                           |
| ------------------------------------------------------- | ---- | ------------------------------ |
| `frontend/package.json`                                 | 修改 | 新增 16 個 Tiptap 擴展依賴     |
| `frontend/src/pages/admin/ArticleEditor.tsx`            | 重構 | 完整重寫工具列、擴展配置、佈局 |
| `frontend/src/components/admin/ArticlePreviewModal.tsx` | 新增 | 發布前預覽 Modal 元件          |
| `frontend/src/index.css`                                | 修改 | 新增表格、待辦、螢光標記樣式   |
| `README.md`                                             | 更新 | 更新編輯器功能文檔             |

---

## 🔄 後續建議

1. **效能優化**: 考慮對大型文章啟用虛擬化渲染
2. **鍵盤快捷鍵**: 為常用功能新增快捷鍵 (已有 Ctrl+B/I/U)
3. **圖片上傳整合**: 整合 Cloudinary 直接上傳功能
4. **協作編輯**: 評估 Yjs 或 Hocuspocus 即時協作功能
5. **程式碼高亮**: 整合 CodeBlockLowlight 做語法高亮

---

**報告完成**
