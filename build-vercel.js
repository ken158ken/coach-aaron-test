/**
 * Vercel Build Output API 建置腳本
 * 按照官方標準生成 .vercel/output 目錄結構
 *
 * 參考：https://vercel.com/docs/build-output-api/v3/primitives
 */

const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log("📦 Building Vercel Output API structure...");

  const outputDir = ".vercel/output";
  const clientDir = "frontend/dist/client";
  const serverDir = "frontend/dist/server";
  const backendDir = "backend/dist";

  // 檢查來源目錄
  if (!fs.existsSync(clientDir)) {
    throw new Error(`Client directory not found: ${clientDir}`);
  }
  if (!fs.existsSync(serverDir)) {
    throw new Error(`Server directory not found: ${serverDir}`);
  }
  if (!fs.existsSync(backendDir)) {
    throw new Error(`Backend directory not found: ${backendDir}`);
  }

  console.log(`✓ All source directories found`);

  // 清理舊的輸出（包括可能的 cache 殘留）
  const outputPaths = [
    outputDir,              // .vercel/output
    "/vercel/output",       // Vercel 絕對路徑（如果存在）
  ];
  
  for (const pathToClean of outputPaths) {
    if (fs.existsSync(pathToClean)) {
      console.log(`🗑️  Cleaning: ${pathToClean}`);
      fs.rmSync(pathToClean, { recursive: true, force: true });
    }
  }

  // 建立 .vercel/output 目錄結構
  fs.mkdirSync(outputDir, { recursive: true });

  // 1. Static files: 複製 client build 到 .vercel/output/static
  console.log("📁 Copying static files...");
  const staticDir = path.join(outputDir, "static");
  copyDir(clientDir, staticDir);
  console.log(`✓ Static files: ${staticDir}`);

  // 2. SSR Function: 建立 .vercel/output/functions/ssr.func
  console.log("🔧 Creating SSR function...");
  const ssrFuncDir = path.join(outputDir, "functions/ssr.func");
  fs.mkdirSync(ssrFuncDir, { recursive: true });

  // 複製 SSR handler
  fs.copyFileSync("api/ssr-build-output.js", path.join(ssrFuncDir, "index.js"));

  // 複製 server bundle
  const ssrServerDir = path.join(ssrFuncDir, "server");
  copyDir(serverDir, ssrServerDir);

  // 複製 index.html (SSR template)
  fs.copyFileSync(
    path.join(clientDir, "index.html"),
    path.join(ssrFuncDir, "index.html"),
  );

  // 建立 .vc-config.json for SSR
  const ssrConfig = {
    runtime: "nodejs22.x",
    handler: "index.js",
    launcherType: "Nodejs",
    shouldAddHelpers: true,
  };
  fs.writeFileSync(
    path.join(ssrFuncDir, ".vc-config.json"),
    JSON.stringify(ssrConfig, null, 2),
  );

  console.log(`✓ SSR function: ${ssrFuncDir}`);

  // 3. API Backend Function: 建立 .vercel/output/functions/api/server.func
  console.log("🔧 Creating API backend function...");
  const apiFuncDir = path.join(outputDir, "functions/api/server.func");
  fs.mkdirSync(apiFuncDir, { recursive: true });

  // 複製 API handler
  fs.copyFileSync("api/server.js", path.join(apiFuncDir, "index.js"));

  // 複製 backend dist（只複製必要文件，不包含 node_modules）
  const apiBackendDir = path.join(apiFuncDir, "backend");
  copyDir(backendDir, apiBackendDir);

  // 建立 .vc-config.json for API（不需要 package.json，依賴已在 backend/dist 編譯好）
  const apiConfig = {
    runtime: "nodejs22.x",
    handler: "index.js",
    launcherType: "Nodejs",
    shouldAddHelpers: true,
  };
  fs.writeFileSync(
    path.join(apiFuncDir, ".vc-config.json"),
    JSON.stringify(apiConfig, null, 2),
  );

  console.log(`✓ API function: ${apiFuncDir}`);

  // 4. 建立 config.json
  console.log("⚙️  Creating config.json...");
  const config = {
    version: 3,
    routes: [
      {
        src: "^/api/(.*)$",
        dest: "/api/server",
      },
      {
        src: "^/(.*)",
        dest: "/ssr",
      },
    ],
    overrides: {
      "assets/**": {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      },
    },
  };

  fs.writeFileSync(
    path.join(outputDir, "config.json"),
    JSON.stringify(config, null, 2),
  );

  console.log("✅ Vercel Output API structure created successfully!");
  console.log(`📍 Output directory: ${outputDir}`);
  console.log(`
Directory structure:
.vercel/output/
├── static/              (Client-side assets)
├── functions/
│   ├── ssr.func/        (SSR Function)
│   │   ├── index.js
│   │   ├── index.html
│   │   ├── server/
│   │   └── .vc-config.json
│   └── api/
│       └── server.func/ (Backend API Function)
│           ├── index.js
│           ├── backend/
│           └── .vc-config.json
└── config.json
  `);
} catch (error) {
  console.error("❌ Build failed:", error.message);
  console.error(error.stack);
  process.exit(1);
}
