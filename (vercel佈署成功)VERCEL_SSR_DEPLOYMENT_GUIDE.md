# Vercel SSR 部署成功方法（完整指南）

> **最終成功日期**: 2026-02-12  
> **專案**: coach-aaron-test  
> **架構**: React + Vite SSR + Express API（Monorepo）  
> **部署平台**: Vercel Serverless Functions (Hobby Plan)

---

1

## 📌 最終成功的架構

```
專案根目錄/
├── vercel.json                  # Vercel 部署設定（關鍵！）
├── .vercelignore                # 排除不需部署的檔案
├── .nftignore                   # 阻止 @vercel/nft 追蹤前端依賴
├── .gitattributes               # 確保 .sh 檔案 LF 換行
├── scripts/
│   └── vercel-build.sh          # Build 腳本（避免 buildCommand 256 字元限制）
├── api/
│   ├── server.js                # 後端 API 代理（Serverless Function）
│   ├── ssr.js                   # SSR 渲染處理（Serverless Function）
│   ├── _ssr_bundle.cjs          # [Build 產物] SSR 渲染 bundle（.gitignore）
│   └── _ssr_template.html       # [Build 產物] HTML 模板（.gitignore）
├── frontend/
│   ├── src/entry-server.tsx     # SSR 入口
│   ├── src/entry-client.tsx     # CSR hydration 入口
│   ├── vite.config.ts           # Vite 設定（SSR 為 CJS 格式）
│   └── dist/
│       ├── client/              # 靜態資源（CSS, JS, 圖片）⚠️ 不含 index.html
│       └── server/
│           └── entry-server.cjs # SSR bundle（自包含所有依賴）
└── backend/
    └── dist/                    # 後端編譯輸出
```

---

## 🔑 關鍵設定檔

### 1. `vercel.json`

```json
{
  "buildCommand": "bash scripts/vercel-build.sh",
  "outputDirectory": "frontend/dist/client",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/server" },
    { "source": "/(.*)", "destination": "/api/ssr" }
  ],
  "functions": {
    "api/server.js": {
      "maxDuration": 10,
      "includeFiles": "backend/dist/**"
    },
    "api/ssr.js": {
      "maxDuration": 10,
      "includeFiles": "api/_ssr_template.html"
    }
  },
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**⚠️ 重要注意事項**:

- `buildCommand` 有 **256 字元上限**，超過會直接 schema validation 失敗
- 用 `rewrites`（modern config），**不能用** `routes`（legacy config）
- `routes` 和 `buildCommand`/`outputDirectory` 是**互斥**的兩套系統

### 2. `scripts/vercel-build.sh`

```bash
#!/usr/bin/env bash
set -e

echo "=== 1/4 Building backend ==="
cd backend && npm install && npm run build && cd ..

echo "=== 2/4 Building frontend ==="
cd frontend && npm install && npm run build && cd ..

echo "=== 3/4 Copying SSR assets to api/ ==="
cp frontend/dist/server/entry-server.cjs api/_ssr_bundle.cjs
cp frontend/dist/client/index.html api/_ssr_template.html

echo "=== 4/4 Removing index.html from outputDir ==="
rm frontend/dist/client/index.html

echo "=== Build complete ==="
```

**⚠️ 第 4 步是 SSR 能運作的關鍵**：
刪除 `index.html` 讓 Vercel 的 Filesystem 層找不到檔案，從而觸發 `rewrites` 導向 SSR。

### 3. `api/ssr.js`（SSR 處理器）

```javascript
const fs = require("node:fs");
const path = require("node:path");

// 惰性載入 SSR module（require 同目錄的 CJS bundle）
let _cachedModule = null;
function loadSSRModule() {
  if (_cachedModule) return _cachedModule;
  _cachedModule = require("./_ssr_bundle.cjs");
  return _cachedModule;
}

// 惰性載入 HTML 模板
let _cachedTemplate = null;
function loadTemplate() {
  if (_cachedTemplate) return _cachedTemplate;
  const templatePath = path.resolve(__dirname, "_ssr_template.html");
  _cachedTemplate = fs.readFileSync(templatePath, "utf-8");
  return _cachedTemplate;
}

module.exports = async function handler(req, res) {
  try {
    const template = loadTemplate();
    const serverModule = loadSSRModule();
    const render = serverModule.render || serverModule.default?.render;

    const { html: appHtml, head: headTags } = render(req.url);

    let html = template;
    html = html.replace("<!--ssr-outlet-->", appHtml);
    html = html.replace("<!--ssr-head-->", headTags);

    res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .setHeader("X-Rendered-By", "ssr")
      .end(html);
  } catch (e) {
    // CSR fallback...
  }
};
```

### 4. `frontend/vite.config.ts`（SSR Build 設定）

```typescript
// SSR build 的關鍵設定
ssr: {
  noExternal: true,  // ⚠️ 所有依賴打包進 bundle，不依賴 node_modules
},
build: {
  ssr: true,
  rollupOptions: {
    output: {
      format: "cjs",              // ⚠️ 必須是 CJS（require() 使用）
      entryFileNames: "[name].cjs",
      inlineDynamicImports: true,  // 單一檔案輸出
    },
  },
},
```

### 5. `.nftignore`

```
frontend/node_modules/**
frontend/src/**
database/**
REPORTS/**
scripts/**
```

阻止 `@vercel/nft`（Node File Tracing）追蹤不必要的依賴。

### 6. `.vercelignore`

```
# ⚠️ 不要排除 scripts/（vercel-build.sh 需要）
# 只排除個別不需要的腳本
scripts/generate-coach-photos.cjs
```

### 7. `.gitattributes`

```
*.sh text eol=lf
```

確保 shell script 在 Git 中保持 LF 換行（Vercel 是 Linux 環境）。

### 8. `frontend/index.html`（SSR 佔位符）

```html
<head>
  <!--ssr-head-->
</head>
<body>
  <div id="root"><!--ssr-outlet--></div>
  <script type="module" src="/src/entry-client.tsx"></script>
</body>
```

### 9. `.gitignore`（Build 產物）

```
api/_ssr_bundle.cjs
api/_ssr_template.html
```

---

## 🧠 踩過的坑（血淚教訓）

### 坑 1：Serverless Function 636MB（上限 300MB）

**原因**: `api/ssr.js` 用 `import()` 載入 `../frontend/dist/server/entry-server.js`，`@vercel/nft` 追蹤到 `frontend/node_modules` 把所有依賴都包進去。

**解法**:

1. SSR bundle 改為 **CJS 格式** + `noExternal: true`（自包含 ~5.5MB）
2. 複製 bundle 到 `api/` 目錄，用 `require("./_ssr_bundle.cjs")`
3. NFT 從 `api/` 目錄追蹤，不會碰到 `frontend/node_modules`
4. `.nftignore` 額外保險

**結果**: 636MB → ~6MB ✅

### 坑 2：SSR 不觸發（靜態 index.html 攔截）

**原因**: Vercel 路由優先順序：

```
redirects → headers → Filesystem → rewrites
```

`index.html` 在 `outputDirectory` 中，Filesystem 層直接返回它，`rewrites` 永遠不執行。

**解法**: Build 完成後 `rm frontend/dist/client/index.html`。

**⚠️ 不能用 `mv`**：之前用 `mv` 可能因 build cache 失效。用 `cp` + `rm` 最穩定。

### 坑 3：buildCommand 超過 256 字元

**原因**: Vercel `vercel.json` schema 驗證 `buildCommand` 不能超過 256 字元。

**解法**: 把指令搬到 `scripts/vercel-build.sh`，`buildCommand` 只寫 `"bash scripts/vercel-build.sh"`。

### 坑 4：.vercelignore 排除了 build script

**原因**: `.vercelignore` 有 `scripts/`，Vercel clone 後直接刪除了 `scripts/` 目錄。

**解法**: 不排除整個 `scripts/`，只排除個別不需要的檔案。

### 坑 5：`routes` 和 `rewrites` 不能混用

**原因**: Vercel 有兩套路由系統：

- **Legacy**: `routes` 陣列 + `handle: filesystem`
- **Modern**: `rewrites` / `redirects` / `headers`（搭配 `buildCommand` / `outputDirectory`）

兩者**互斥**。如果使用 `buildCommand` + `outputDirectory`，必須用 `rewrites`。

### 坑 6：Windows CRLF 換行

**原因**: Windows Git 預設 `core.autocrlf=true` 會把 LF 轉 CRLF。Bash script 在 Linux 上執行會因為 `\r` 報錯。

**解法**: `.gitattributes` 設定 `*.sh text eol=lf`。

---

## ✅ 驗證 SSR 是否正常

```bash
# 1. 檢查 response header
curl -sI https://coach-aaron-test.vercel.app/ | grep X-Rendered-By
# 預期: X-Rendered-By: ssr

# 2. 檢查 HTML 是否有渲染內容（不應有 <!--ssr-outlet-->）
curl -s https://coach-aaron-test.vercel.app/ | grep "ssr-outlet"
# 預期: 無輸出（已被替換為實際 HTML）

# 3. 檢查 SEO meta tags
curl -s https://coach-aaron-test.vercel.app/ | grep "meta name"
# 預期: 包含 description, keywords 等 meta 標籤
```

---

## 📊 部署指標

| 指標              | 數值                                 |
| ----------------- | ------------------------------------ |
| Build 時間        | ~34 秒                               |
| SSR Function 大小 | ~6 MB（上限 300MB）                  |
| SSR Bundle (CJS)  | 5,505 KB                             |
| Client JS         | 1,406 KB（main）+ 667 KB（three.js） |
| Client CSS        | 142 KB                               |
| Build Cache       | 66 MB                                |

---

## 🔄 更新流程

1. 本地修改程式碼
2. `git add` → `git commit` → `git push`
3. Vercel 自動觸發部署
4. Build: `bash scripts/vercel-build.sh` 自動執行
5. 部署完成後驗證 SSR header

**不需要手動做任何事**，push 到 main 即自動部署。
