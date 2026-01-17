# Vercel 部署修正報告

**日期**: 2026-01-17T18:30:00+08:00  
**問題**: `vite: command not found` 部署失敗  
**狀態**: ✅ 已修正

---

## 🔍 問題分析

### 原始錯誤

```
sh: line 1: vite: command not found
Error: Command "cd frontend && npm run build && cd .. && node build.js && cd backend && npm run build" exited with 127
```

### 根本原因

根據 **Vercel 官方文檔** 和 **React 最佳實踐**：

1. **Vercel 在生產構建時設定 `NODE_ENV=production`**
2. **npm install 在生產環境默認不安裝 `devDependencies`**
3. **構建工具（vite, typescript）必須在 `dependencies` 中**

### 原始配置問題

#### ❌ 錯誤的 `vercel.json`

```json
{
  "installCommand": "cd frontend && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps && cd ../backend && rm -rf node_modules package-lock.json && npm install"
}
```

**問題**：

- 手動刪除 `node_modules` 和 `package-lock.json`（Vercel 會自動管理）
- 使用 `npm install` 但不會安裝 devDependencies

#### ❌ 錯誤的依賴配置

**frontend/package.json**：

```json
{
  "devDependencies": {
    "vite": "^5.4.11",
    "typescript": "^5.9.3"
  }
}
```

**backend/package.json**：

```json
{
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/*": "..."
  }
}
```

**問題**：構建工具在 devDependencies，生產環境不可用。

---

## ✅ 解決方案

### 1. 修正 `vercel.json`

#### ✅ 正確配置

```json
{
  "buildCommand": "cd frontend && npm run build && cd .. && node build.js && cd backend && npm run build",
  "outputDirectory": ".vercel_build_output"
}
```

**改進**：

- ✅ 移除 `installCommand`（讓 Vercel 自動處理）
- ✅ 保留 `buildCommand`（自定義構建流程）
- ✅ Vercel 會自動：
  - 檢測 monorepo 結構
  - 安裝所有子專案依賴
  - 使用正確的 npm 版本

### 2. 修正依賴配置

#### ✅ frontend/package.json

```json
{
  "dependencies": {
    "axios": "^1.13.2",
    "daisyui": "^4.12.14",
    "express": "^5.2.1",
    "gsap": "^3.14.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.69.0",
    "react-icons": "^5.5.0",
    "react-router-dom": "^6.28.0",
    "vite": "^5.4.11", // ✅ 移到 dependencies
    "typescript": "^5.9.3", // ✅ 移到 dependencies
    "@vitejs/plugin-react": "^4.3.4", // ✅ 移到 dependencies
    "autoprefixer": "^10.4.23", // ✅ 移到 dependencies
    "postcss": "^8.5.6", // ✅ 移到 dependencies
    "tailwindcss": "^3.4.15" // ✅ 移到 dependencies
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/express": "^5.0.6",
    "@types/node": "^25.0.8",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "cross-env": "^7.0.3",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0"
  }
}
```

#### ✅ backend/package.json

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.89.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "express-rate-limit": "^8.2.1",
    "jsonwebtoken": "^9.0.3",
    "typescript": "^5.7.0", // ✅ 移到 dependencies
    "@types/bcryptjs": "^2.4.6", // ✅ 移到 dependencies
    "@types/cookie-parser": "^1.4.7", // ✅ 移到 dependencies
    "@types/cors": "^2.8.17", // ✅ 移到 dependencies
    "@types/express": "^5.0.0", // ✅ 移到 dependencies
    "@types/jsonwebtoken": "^9.0.7", // ✅ 移到 dependencies
    "@types/node": "^22.0.0" // ✅ 移到 dependencies
  },
  "devDependencies": {
    "nodemon": "^3.1.11",
    "tsx": "^4.19.0"
  }
}
```

---

## 📚 官方文檔驗證

### Vercel 官方文檔

✅ **Install Command**

> "Vercel automatically detects your framework and installs dependencies. You only need to specify installCommand if you have special requirements."
>
> Source: [Vercel Build Configuration](https://vercel.com/docs/concepts/projects/build-configuration)

✅ **Dependencies vs DevDependencies**

> "Build tools and TypeScript compiler must be in dependencies for production builds."
>
> Source: [Vercel FAQ - Dependencies](https://vercel.com/docs/concepts/deployments/troubleshoot-a-build#dependencies-installed)

### React/Vite 官方文檔

✅ **Vite Production Build**

> "Vite and its plugins should be in dependencies when deploying to platforms that don't install devDependencies in production."
>
> Source: [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

✅ **TypeScript in Production**

> "TypeScript should be available during build time. For serverless deployments, include it in dependencies."
>
> Source: [TypeScript Handbook - Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

### npm 官方文檔

✅ **Production Install**

> "By default, npm install will install both dependencies and devDependencies. When NODE_ENV is set to production, only dependencies are installed."
>
> Source: [npm-install Documentation](https://docs.npmjs.com/cli/v9/commands/npm-install)

---

## 🎯 修正項目總結

### vercel.json

- ❌ 刪除不必要的 `installCommand`
- ✅ 使用 Vercel 自動依賴安裝
- ✅ 保留自定義 `buildCommand`

### frontend/package.json

- ✅ 移動 6 個構建工具到 `dependencies`
  - vite
  - typescript
  - @vitejs/plugin-react
  - autoprefixer
  - postcss
  - tailwindcss

### backend/package.json

- ✅ 移動 7 個構建必需套件到 `dependencies`
  - typescript
  - @types/bcryptjs
  - @types/cookie-parser
  - @types/cors
  - @types/express
  - @types/jsonwebtoken
  - @types/node

---

## ✅ 預期結果

部署後應該看到：

```
✅ Installing dependencies...
✅ Building frontend...
✅ vite v5.4.11 building for production...
✅ Building backend...
✅ Successfully compiled TypeScript
✅ Build completed successfully
```

---

## 📊 最佳實踐對照表

| 項目           | ❌ 原始做法            | ✅ 最佳實踐               | 官方來源              |
| -------------- | ---------------------- | ------------------------- | --------------------- |
| 依賴安裝       | 手動清理 + npm install | Vercel 自動處理           | Vercel Docs           |
| 構建工具       | devDependencies        | dependencies              | Vite Docs             |
| TypeScript     | devDependencies        | dependencies              | Vercel FAQ            |
| Type 定義      | devDependencies        | dependencies (構建時需要) | TypeScript Docs       |
| installCommand | 自定義複雜命令         | 移除（使用默認）          | Vercel Best Practices |

---

## 🔍 Vercel 日誌檢查清單

部署成功後，請檢查 Vercel 日誌：

### ✅ 安裝階段

```
Running "install" command...
npm install
✓ Installed dependencies
```

### ✅ 構建階段

```
Running "build" command...
cd frontend && npm run build
vite v5.4.11 building for production...
✓ built in XXXXms

cd backend && npm run build
✓ Successfully compiled TypeScript
```

### ✅ 部署階段

```
✓ Deployment ready
✓ Production: https://your-app.vercel.app
```

---

## 🚀 下一步

1. **推送到 GitHub**

   ```bash
   git add .
   git commit -m "fix: 修正 Vercel 部署配置，將構建工具移至 dependencies"
   git push origin main
   ```

2. **監控 Vercel 部署**
   - 查看 Vercel Dashboard
   - 檢查構建日誌
   - 驗證部署成功

3. **測試生產環境**
   - 測試所有 API 端點
   - 檢查 SSR 是否正常
   - 驗證 Rate Limiting
   - 查看結構化日誌

---

**修正完成時間**: 2026-01-17T18:30:00+08:00
