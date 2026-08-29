# 🎨 Coach Aaron 網站重構開發規格書

> **專案名稱**: Coach Aaron 前端視覺重構  
> **建立日期**: 2026-01-24  
> **狀態**: 開發中

---

## 📋 目錄

1. [專案概述](#專案概述)
2. [設計規範](#設計規範)
3. [技術棧](#技術棧)
4. [專案結構](#專案結構)
5. [頁面規格](#頁面規格)
6. [元件規格](#元件規格)
7. [色彩系統](#色彩系統)
8. [動畫規格](#動畫規格)
9. [開發規則](#開發規則)

---

## 專案概述

### 目標

將現有 `coach-aaron-test` 專案進行大幅度視覺重構，保留所有頁面元素和功能，套用三個設計參考檔案的視覺風格：

- `design_preview_v3.html` - **THE ABYSS** 深海主題
- `design_preview_v7.html` - **VOID PRISM** 水晶主題
- `layout_03_agency.html` - **LUXE** 高端代理商主題

### 核心原則

| 原則             | 說明                           |
| ---------------- | ------------------------------ |
| 🚫 禁止漸層      | 背景、按鈕、卡片皆不可使用漸層 |
| ✅ 保留 Three.js | 完整移植原設計的 3D 動畫效果   |
| ✅ 保留 GSAP     | 所有 DOM 互動動畫必須套用      |
| 🚫 禁止自創顏色  | 只能使用三個設計檔定義的色彩   |
| ✅ 元件複用      | 相同樣式的元件必須共用         |

---

## 設計規範

### 三大設計主題

#### 1. THE ABYSS (深海主題) - `design_preview_v3.html`

```css
--abyss-black: #000205; /* 背景 */
--abyss-cyan: #00ffff; /* 生物光主色 */
--abyss-purple: #7b00ff; /* 輔助色 */
--abyss-glass: rgba(0, 5, 10, 0.6);
--abyss-text: #e0f7fa; /* 文字色 */
--abyss-text-dim: #80deea; /* 次要文字 */
```

**特色**:

- 圓角卡片 (20px)
- 氣泡式側邊導航 (border-radius: 50px)
- 光暈 box-shadow
- Three.js 水母球體 + 浮游生物粒子

#### 2. VOID PRISM (水晶主題) - `design_preview_v7.html`

```css
--prism-void: #0b001a; /* 背景 */
--prism-purple: #b388ff; /* 主色 */
--prism-blue: #82b1ff; /* 輔助色 */
--prism-glass: rgba(255, 255, 255, 0.05);
--prism-text: #ffffff;
--prism-text-dim: #aaaaaa;
```

**特色**:

- 切角卡片 (clip-path: polygon)
- 頂部篩選藥丸
- 彩虹光澤 hover 效果
- Three.js 物理材質水晶 + 飄浮碎片

#### 3. LUXE (高端主題) - `layout_03_agency.html`

```css
--luxe-black: #0a0a0a; /* 背景 */
--luxe-gold: #d4af37; /* 金色主色 */
--luxe-gold-dim: #8a7020; /* 暗金色 */
--luxe-text: #e0e0e0; /* 文字色 */
--luxe-text-dim: #888888; /* 次要文字 */
```

**特色**:

- 大標題排版 (6vw)
- 項目卡片交錯佈局
- 底線動畫按鈕
- CSS fadeUp 動畫 + IntersectionObserver

---

## 技術棧

| 類別  | 技術            | 版本  |
| ----- | --------------- | ----- |
| 框架  | React           | 18.x  |
| 語言  | TypeScript      | 5.x   |
| 建構  | Vite            | 5.x   |
| 樣式  | TailwindCSS     | 3.x   |
| UI 庫 | DaisyUI         | 4.x   |
| 3D    | Three.js        | r128+ |
| 動畫  | GSAP            | 3.x   |
| 路由  | React Router    | 6.x   |
| HTTP  | Axios           | 1.x   |
| 表單  | React Hook Form | 7.x   |

---

## 專案結構

```
前端新設計參考 (react)1/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
│
├── public/
│   └── photos/
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    │
    ├── styles/
    │   ├── themes/
    │   │   ├── _variables.css
    │   │   ├── abyss.css
    │   │   ├── prism.css
    │   │   └── luxe.css
    │   └── animations.css
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── MobileMenu.tsx
    │   │   └── Footer.tsx
    │   │
    │   ├── three/
    │   │   ├── ThreeCanvas.tsx
    │   │   ├── AbyssScene.tsx
    │   │   └── PrismScene.tsx
    │   │
    │   ├── ui/
    │   │   ├── cards/
    │   │   ├── buttons/
    │   │   ├── navigation/
    │   │   ├── feedback/
    │   │   ├── form/
    │   │   ├── data/
    │   │   └── overlay/
    │   │
    │   ├── sections/
    │   │   ├── HeroSection.tsx
    │   │   ├── CoachIntroSection.tsx
    │   │   ├── PodcastSection.tsx
    │   │   └── ...
    │   │
    │   └── admin/
    │       ├── AdminLayout.tsx
    │       └── AdminSidebar.tsx
    │
    ├── pages/
    │   ├── Home.tsx
    │   ├── Courses.tsx
    │   ├── Videos.tsx
    │   ├── CoachPhotos.tsx
    │   ├── Contact.tsx
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   ├── MemberCenter.tsx
    │   └── admin/
    │
    ├── hooks/
    ├── context/
    ├── services/
    ├── lib/
    ├── types/
    ├── constants/
    └── data/
```

---

## 頁面規格

### 頁面風格分配

| 頁面           | 風格     | Three.js   | 說明                |
| -------------- | -------- | ---------- | ------------------- |
| Home           | LUXE     | 選用       | 大標題、fadeUp 動畫 |
| Courses        | PRISM    | PrismScene | 切角卡片、水晶背景  |
| Videos         | ABYSS    | AbyssScene | 氣泡導航、深海背景  |
| CoachPhotos    | ABYSS    | AbyssScene | 瀑布流、Lightbox    |
| Contact        | LUXE     | 無         | 表單、底線動畫      |
| Login/Register | PRISM    | 輕量       | 玻璃卡片居中        |
| MemberCenter   | PRISM    | 無         | 資訊卡片            |
| Admin 全部     | 混合深色 | 無         | 效能優先            |

---

## 元件規格

### 卡片元件

#### AbyssCard (深海卡片)

```tsx
// 特徵: 圓角 20px、hover 上浮 + 縮放、青色光暈
<div className="
  bg-[rgba(5,10,20,0.7)]
  backdrop-blur-[10px]
  border border-[rgba(0,255,255,0.1)]
  rounded-[20px]
  hover:translate-y-[-10px] hover:scale-[1.02]
  hover:border-[#00ffff]
  hover:shadow-[0_0_30px_rgba(0,255,255,0.15)]
  transition-all duration-500
">
```

#### PrismCard (水晶卡片)

```tsx
// 特徵: 切角、hover 彩虹光澤
<div className="
  bg-[rgba(255,255,255,0.05)]
  border border-[rgba(255,255,255,0.1)]
  backdrop-blur-[10px]
  [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]
  hover:bg-[rgba(255,255,255,0.1)]
  hover:translate-y-[-5px]
  hover:border-[#82b1ff]
">
```

#### LuxeProjectCard (高端項目卡片)

```tsx
// 特徵: 大圖 + 資訊、底線動畫連結
<div className="
  grid grid-cols-[1.5fr_1fr] gap-[60px]
  opacity-0 translate-y-[20px]
  transition-all duration-800
">
```

### 按鈕元件

#### GlowButton (光暈按鈕)

```tsx
<button className="
  bg-transparent
  border border-[rgba(0,255,255,0.3)]
  text-[#00ffff]
  shadow-[0_0_15px_rgba(0,255,255,0.2)]
  hover:bg-[rgba(0,255,255,0.1)]
  hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]
">
```

#### TextButton (底線動畫按鈕)

```tsx
<a className="
  text-[#d4af37]
  relative
  after:content-['']
  after:absolute after:bottom-0 after:left-0
  after:w-0 after:h-[1px]
  after:bg-[#d4af37]
  after:transition-all after:duration-300
  hover:after:w-full
">
```

---

## 色彩系統

### CSS 變數定義

```css
:root {
  /* ABYSS Theme */
  --abyss-black: #000205;
  --abyss-cyan: #00ffff;
  --abyss-purple: #7b00ff;
  --abyss-glass: rgba(0, 5, 10, 0.6);
  --abyss-text: #e0f7fa;
  --abyss-text-dim: #80deea;

  /* PRISM Theme */
  --prism-void: #0b001a;
  --prism-purple: #b388ff;
  --prism-blue: #82b1ff;
  --prism-glass: rgba(255, 255, 255, 0.05);
  --prism-text: #ffffff;
  --prism-text-dim: #aaaaaa;

  /* LUXE Theme */
  --luxe-black: #0a0a0a;
  --luxe-gold: #d4af37;
  --luxe-gold-dim: #8a7020;
  --luxe-text: #e0e0e0;
  --luxe-text-dim: #888888;
}
```

### Tailwind 擴展

```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      abyss: {
        black: '#000205',
        cyan: '#00ffff',
        purple: '#7b00ff',
      },
      prism: {
        void: '#0b001a',
        purple: '#b388ff',
        blue: '#82b1ff',
      },
      luxe: {
        black: '#0a0a0a',
        gold: '#d4af37',
        'gold-dim': '#8a7020',
      }
    }
  }
}
```

---

## 動畫規格

### GSAP 動畫

#### 導航列進場

```ts
gsap.fromTo(
  navRef,
  { y: -100, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
);
```

#### Hero 文字進場

```ts
gsap.fromTo(
  textElements,
  { y: 50, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" },
);
```

#### 滾動顯示

```ts
gsap.to(element, {
  opacity: 1,
  y: 0,
  duration: 0.6,
  ease: "power3.out",
});
```

### CSS 動畫

#### fadeUp

```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### drift (海洋漂浮)

```css
@keyframes drift {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 0 100px;
  }
}
```

---

## 開發規則

### 命名規範

- **元件**: PascalCase (`AbyssCard.tsx`)
- **Hooks**: camelCase + use 前綴 (`useGSAP.ts`)
- **樣式**: kebab-case (`abyss-card.css`)
- **常數**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)

### 檔案組織

- 每個元件資料夾包含 `index.ts` 統一導出
- 相關元件放在同一資料夾
- 共用型別放在 `types/`

### 程式碼風格

- 使用 Google Style docstring
- 適當加入 Logging
- 完整的錯誤處理 (try-catch)
- 遵循單一職責原則
- 遵循開放封閉原則

### Git Commit 規範

```
feat: 新增功能
fix: 修復錯誤
style: 樣式調整
refactor: 重構
docs: 文件更新
```

---

## 待辦事項

- [x] 專案初始化
- [x] 樣式系統建立
- [x] Three.js 場景元件
- [x] UI 元件庫
- [x] 頁面開發
- [x] 後台頁面
- [ ] 新增圖片資源
- [ ] API 整合
- [ ] 測試

---

> 📝 最後更新：2026-01-24T16:00:00+08:00
