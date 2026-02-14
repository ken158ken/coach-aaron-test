# 頭像系統升級報告

> **時間戳記**: 2026-02-18T18:00:00+08:00
> **Commit**: `a3fe2f4`
> **分支**: main

## 1. 問題修復

### 1.1 頭像上傳 500 錯誤

- **現象**: `POST /api/user/avatar` 回傳 500 Internal Server Error
- **根因**: `backend/middleware/sanitize.ts` 中的 `sanitizeString()` 函式將所有字串截斷至 10,000 字元上限，base64 圖片資料（通常 50,000~300,000 字元）被截斷後無法被 `sharp` 解析
- **修復措施**:
  1. `POST /api/user/avatar` 路由直接跳過 sanitize middleware（base64 非使用者輸入的文字型態）
  2. 一般字串截斷限制提升至 500,000 字元

### 1.2 DataTable Tooltip 不可見

- **現象**: AdminWhitelist「可進入後台管理權限」與 AdminUsers「私密相簿」的 `?` icon hover 時 tooltip 不顯示
- **根因**: `DataTable.tsx` 外層 wrapper 設有 `overflow-hidden`，導致 `position: absolute` 的 tooltip 元素被裁切
- **修復措施**: 移除 `overflow-hidden`，改用 `overflow-x-auto overflow-y-visible`，`<thead>` 加上 `relative`

## 2. 新功能

### 2.1 AvatarCropper 裁切元件

| 項目     | 說明                                                  |
| -------- | ----------------------------------------------------- |
| 套件     | `react-easy-crop`                                     |
| 裁切形狀 | 圓形 (`cropShape="round"`)                            |
| 互動方式 | 拖曳平移 + 滾輪/滑桿縮放 (1x ~ 3x)                    |
| 輸出     | 400×400 PNG base64 (後端再縮至 200×200)               |
| 路徑     | `frontend/src/components/ui/avatar/AvatarCropper.tsx` |

### 2.2 AvatarPicker 多方案選擇器

三 Tab 頁籤設計：

#### Tab 1: 上傳裁切

- 選擇圖片 → 進入 AvatarCropper → 裁切確認 → 上傳

#### Tab 2: DiceBear 風格頭像

11 種風格：Avataaars、探險家、機器人、趣味表情、Lorelei、Micah、Mini、Notion 風、Open Peeps、像素風、讚

- 可輸入自訂 seed 文字改變生成結果
- 隨機按鈕一鍵換新
- 格子預覽即時生成

#### Tab 3: Boring Avatars 幾何頭像

6 種變體：光束、大理石、像素、日落、圓環、包浩斯

- 同樣支援自訂 seed + 隨機
- 使用 `renderToStaticMarkup` 取得 SVG → Canvas → PNG base64

### 2.3 後端 type 參數

`POST /api/user/avatar` 新增 `type` body 參數：

| type              | 處理                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `"upload"` (預設) | sharp 中央裁剪正方形 → resize 200×200 → SVG 圓形遮罩 composite → PNG 壓縮 |
| `"generated"`     | sharp resize 200×200 + PNG 壓縮（跳過中央裁剪，前端已處理）               |

## 3. 使用者流程

```
會員中心 → hover 頭像 → 📷 更換頭貼
→ 開啟 AvatarPicker Modal
→ 方案一: 選擇圖片 → 裁切 → 確認
   方案二: 選擇 DiceBear 風格 → 使用此頭像
   方案三: 選擇 Boring Avatars 變體 → 使用此頭像
→ SVG/裁切圖 → PNG base64
→ POST /api/user/avatar (type=generated)
→ sharp resize + 壓縮 → data URI → DB
→ updateUser({ avatar_url }) → Navbar 即時更新
```

## 4. 檔案變更清單

| 檔案                                                  | 類型 | 說明                              |
| ----------------------------------------------------- | ---- | --------------------------------- |
| `backend/middleware/sanitize.ts`                      | 修改 | 跳過 avatar 路由 + 限制提升       |
| `backend/routes/user.ts`                              | 修改 | 新增 type 參數支援 generated 模式 |
| `frontend/src/components/ui/avatar/AvatarCropper.tsx` | 新建 | react-easy-crop 裁切元件          |
| `frontend/src/components/ui/avatar/AvatarPicker.tsx`  | 新建 | 多方案頭像選擇器                  |
| `frontend/src/components/ui/avatar/index.ts`          | 新建 | 模組匯出                          |
| `frontend/src/components/ui/index.ts`                 | 修改 | 新增 avatar 模組                  |
| `frontend/src/components/ui/data/DataTable.tsx`       | 修改 | 修復 overflow-hidden tooltip 裁切 |
| `frontend/src/pages/MemberCenter.tsx`                 | 修改 | 改用 Modal + AvatarPicker         |
| `frontend/src/services/user.service.ts`               | 修改 | 新增 AvatarType 參數              |
| `frontend/package.json`                               | 修改 | 新增 4 個依賴套件                 |

## 5. 新增依賴

| 套件                   | 用途                      |
| ---------------------- | ------------------------- |
| `react-easy-crop`      | 圖片裁切 UI               |
| `@dicebear/core`       | DiceBear 頭像生成核心     |
| `@dicebear/collection` | DiceBear 風格集合 (11 種) |
| `boring-avatars`       | 幾何風格頭像 (6 種變體)   |
