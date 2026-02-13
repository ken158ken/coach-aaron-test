# TipTap ImageGallery 擴展 + Modal RWD 全面修復報告

> **報告時間**：2026-02-14T20:00:00+08:00
> **Commit**：`656684f`
> **分支**：main

---

## 1. TipTap ImageGallery 自定義 Node 擴展

### 1.1 需求

文章/課程編輯器需要「多張圖片一排」的佈局功能，原生 TipTap 不支援，需客製化 Node 擴展。

### 1.2 技術方案

| 項目       | 說明                                                    |
| ---------- | ------------------------------------------------------- |
| 擴展類型   | Custom TipTap Node (ReactNodeViewRenderer)              |
| 檔案       | `frontend/src/components/editor/ImageGallery.tsx`       |
| 行數       | ~420 行                                                 |
| 圖片來源   | Cloudinary-only (正則驗證)                              |
| 最大圖片數 | 3 張/排                                                 |
| 調整大小   | 拖曳 handle，範圍 80–600px                              |
| 儲存格式   | HTML `<div data-type="image-gallery">` + `<img>` 子元素 |
| 資料庫     | 無需變更，HTML TEXT 欄位直接存儲                        |

### 1.3 架構

```
ImageGallery.tsx
├── GalleryItem          # 單張圖片 + 拖曳 resize handle
├── AddImagePanel        # URL 輸入 + Cloudinary 驗證 + 預覽
├── ImageGalleryComponent # 主容器 (NodeViewWrapper)
└── ImageGallery         # TipTap Node.create() 擴展定義
```

### 1.4 整合路徑

```
useRichTextEditor.ts → import ImageGallery → extensions[]
RichTextEditor.tsx   → 🏞️ toolbar button → onInsertImageGallery
ArticleEditor.tsx    → handleInsertImageGallery → editor.chain().setImageGallery([])
CourseEditor.tsx     → handleInsertImageGallery → editor.chain().setImageGallery([])
```

### 1.5 HTML 輸出範例

```html
<div
  data-type="image-gallery"
  data-images='[{"src":"https://res.cloudinary.com/...","width":300}]'
>
  <img src="https://res.cloudinary.com/..." style="width:300px" />
</div>
```

---

## 2. Modal RWD 全面修復

### 2.1 審計結果

共掃描 **18 個 Modal**，修復 **10 個**存在 RWD 問題的元件。

### 2.2 共通問題與解決方案

| 問題                      | 影響                | 解決方案                                                   |
| ------------------------- | ------------------- | ---------------------------------------------------------- |
| `items-center` 裁切長內容 | 長 Modal 頂部被切掉 | `items-start sm:items-center` + `overflow-y-auto` + `py-6` |
| 無 `mx-4` 手機邊距        | 內容貼邊            | `mx-3 sm:mx-4`                                             |
| 固定 `px-6 py-4` 間距     | 手機空間浪費        | `px-4 sm:px-6` + `py-3 sm:py-4`                            |
| 無 `max-h` / `overflow`   | 長內容溢出          | `max-h-[70vh] overflow-y-auto` 或 `max-h-[80vh]`           |
| `grid-cols-2` 不響應      | 手機欄位擠壓        | `grid-cols-1 sm:grid-cols-2`                               |

### 2.3 修復清單

| 檔案                      | 修復內容                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Dialog.tsx`              | 移除 `max-w-md` 與 `sizeClasses` 衝突、新增 `max-h-[70vh] overflow-y-auto`、overlay `items-start`、responsive padding/margin |
| `ArticlePreviewModal.tsx` | 標題 `text-2xl sm:text-3xl md:text-4xl`、padding `py-6 sm:py-12`、footer `flex-wrap`                                         |
| `ArticleEditor.tsx`       | 分類/Help modal overlay + padding 響應式、Help grid `grid-cols-1 sm:grid-cols-2`                                             |
| `CourseEditor.tsx`        | 同上                                                                                                                         |
| `AdminWhitelist.tsx`      | Add modal overlay + padding + `max-h-[80vh] overflow-y-auto`                                                                 |
| `ConfirmDialog.tsx`       | overlay + padding 響應式                                                                                                     |
| `BlockEditor.tsx`         | Image/Video modal overlay + padding + margin                                                                                 |
| `overlay/Modal.tsx`       | overlay + content `max-h-[70vh] overflow-y-auto` + responsive header                                                         |

### 2.4 Dialog.tsx 核心修復詳解

**修復前** (bug):

```
modalClasses = "...max-w-md w-full mx-4..."  ← max-w-md 寫死
sizeClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", ... }
// Tailwind 衝突：兩個 max-w-* 同時存在，後者不一定勝出
```

**修復後**:

```
modalClasses = "...w-full mx-3 sm:mx-4..."   ← 移除 max-w-md
sizeClasses = { sm: "max-w-sm", md: "max-w-md", ... }  ← 唯一 max-w 來源
contentClasses = "...max-h-[70vh] overflow-y-auto"      ← 新增滾動限制
```

---

## 3. 修改檔案總覽

| 檔案                                         | 狀態    | 類型           |
| -------------------------------------------- | ------- | -------------- |
| `components/editor/ImageGallery.tsx`         | 🆕 新增 | TipTap 擴展    |
| `components/editor/index.ts`                 | ✏️ 修改 | Export         |
| `hooks/useRichTextEditor.ts`                 | ✏️ 修改 | 註冊擴展       |
| `components/editor/RichTextEditor.tsx`       | ✏️ 修改 | Toolbar 按鈕   |
| `pages/admin/ArticleEditor.tsx`              | ✏️ 修改 | Handler + RWD  |
| `pages/admin/CourseEditor.tsx`               | ✏️ 修改 | Handler + RWD  |
| `components/ui/Dialog.tsx`                   | ✏️ 修改 | Core Modal RWD |
| `components/admin/ArticlePreviewModal.tsx`   | ✏️ 修改 | RWD            |
| `pages/admin/AdminWhitelist.tsx`             | ✏️ 修改 | RWD            |
| `components/ui/feedback/ConfirmDialog.tsx`   | ✏️ 修改 | RWD            |
| `components/ui/block-editor/BlockEditor.tsx` | ✏️ 修改 | RWD            |
| `components/ui/overlay/Modal.tsx`            | ✏️ 修改 | RWD            |

---

## 4. 測試建議

1. **ImageGallery 測試**：
   - 新增文章/課程 → 工具列點 🏞️ → 貼上 Cloudinary URL → 確認預覽 → 新增
   - 拖曳 resize handle 調整圖片大小
   - 新增第 2、3 張圖片，確認一排顯示
   - 達到 3 張後，Add 按鈕消失
   - 點 ✕ 移除單張圖片
   - 儲存後重新開啟，確認 gallery 正常渲染

2. **Modal RWD 測試**：
   - Chrome DevTools 375px/414px 寬度檢查所有 Modal
   - 確認長內容可滾動，不被裁切
   - 確認按鈕文字不溢出
   - 確認手機左右有 12px+ 邊距
