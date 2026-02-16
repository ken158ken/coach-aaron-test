# Landing Page Builder (GrapesJS) — Demo 版實作報告

> **時間戳記**: 2026-02-19T02:00:00+08:00
> **類型**: 新功能
> **狀態**: ✅ Demo 版完成

---

## 📋 需求概述

建立一個 Landing Page 自訂頁面管理系統，讓管理員可以透過 **GrapesJS** 拖放式視覺化編輯器自由建立客製化的行銷/活動頁面。

**本次為 Demo 版本**：功能完整但資料僅存於本地 state，不寫入資料庫。

---

## 🏗️ 實作架構

### 新增檔案

| 檔案                                              | 用途                                  |
| ------------------------------------------------- | ------------------------------------- |
| `frontend/src/pages/admin/LandingPageManager.tsx` | 卡片式管理頁面（列表/搜尋/篩選/CRUD） |
| `frontend/src/pages/admin/LandingPageEditor.tsx`  | GrapesJS 全螢幕視覺化編輯器           |

### 修改檔案

| 檔案                                             | 變更                                                  |
| ------------------------------------------------ | ----------------------------------------------------- |
| `frontend/src/App.tsx`                           | 新增 `/admin/landing-pages`、`/new`、`/:id/edit` 路由 |
| `frontend/src/components/layout/Navbar.tsx`      | 桌面版 + 手機版 dropdown 新增「自訂頁面」按鈕         |
| `frontend/src/components/admin/AdminSidebar.tsx` | 側邊欄新增「自訂頁面」導航項                          |
| `frontend/src/context/LanguageContext.tsx`       | 新增 `landingPages` 中英文翻譯                        |

### 新增套件

| 套件                      | 版本   | 用途                             |
| ------------------------- | ------ | -------------------------------- |
| `grapesjs`                | latest | 視覺化網頁建構核心               |
| `grapesjs-preset-webpage` | latest | 網頁預設元件集                   |
| `grapesjs-blocks-basic`   | latest | 基本區塊元件（欄位/文字/圖片等） |

---

## 🎨 功能特色

### LandingPageManager 管理頁

- **三種檢視模式**：小卡片 / 中卡片 / 大卡片
- **狀態標籤**：草稿（灰）/ 已發布（綠）/ 已封存（黃）
- **搜尋與篩選**：關鍵字搜尋 + 狀態篩選
- **Demo 資料**：4 筆範例頁面，完整展示 UI
- **操作**：編輯 / 刪除（含確認彈窗）

### LandingPageEditor 編輯器

- **全螢幕模式**：獨立頁面（不套 AdminLayout），最大化編輯空間
- **GrapesJS 整合**：拖放式設計，支援文字/圖片/欄位/按鈕等元件
- **裝置預覽**：桌面 / 平板 / 手機三種裝置切換
- **深色 LUXE 主題**：完整覆寫 GrapesJS 預設樣式，金色 (#C9A96E) 主色調
- **預設範本**：新增時自帶 Hero + 特色區塊模板
- **預覽功能**：開啟新視窗即時預覽完整 HTML/CSS
- **儲存（Demo）**：輸出 HTML/CSS 到 Console

### 導航整合

- **Navbar Dropdown**：管理員 dropdown 中新增「自訂頁面」按鈕（桌面+手機）
- **AdminSidebar**：後台側邊欄新增導航項目
- **i18n**：中文「自訂頁面」/ 英文「Landing Pages」

---

## 🔒 權限控制

- Navbar 按鈕：`{isAdmin && ...}` 管理員才顯示
- 路由守衛：`<RequireAdmin>` 包裹所有 landing-pages 路由
- 與現有後台權限機制完全一致

---

## 🛤️ 路由結構

```
/admin/landing-pages          → LandingPageManager（AdminLayout 內）
/admin/landing-pages/new      → LandingPageEditor（獨立全螢幕）
/admin/landing-pages/:id/edit → LandingPageEditor（獨立全螢幕）
```

---

## 🔮 後續擴展（正式版）

1. **資料庫持久化**：建立 `landing_pages` 資料表，存 HTML/CSS/metadata
2. **前台路由**：`/pages/:slug` 動態渲染已發布頁面
3. **版本控制**：儲存每次編輯歷史
4. **SEO 設定**：meta title / description / og:image
5. **自訂網域**：子域名對應特定 Landing Page

---

## ✅ 驗證

- TypeScript 編譯：`tsc --noEmit` 零錯誤
- 路由配置：完整、符合現有 pattern
- i18n：Translations 介面 + 中/英翻譯同步更新
- LUXE 主題：GrapesJS 深色主題完全覆寫
