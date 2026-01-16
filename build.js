/**
 * Vercel 建置腳本
 * 將 client 和 server 輸出複製到統一目錄
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
  console.log("📦 Starting build output preparation...");
  console.log(`📍 Current directory: ${process.cwd()}`);

  const buildOutput = ".vercel_build_output";
  const clientDir = "frontend/dist/client";
  const serverDir = "frontend/dist/server";

  // 檢查來源目錄是否存在
  if (!fs.existsSync(clientDir)) {
    throw new Error(`Client directory not found: ${clientDir}`);
  }
  if (!fs.existsSync(serverDir)) {
    throw new Error(`Server directory not found: ${serverDir}`);
  }

  console.log(`✓ Client dir found: ${clientDir}`);
  console.log(`✓ Server dir found: ${serverDir}`);

  // 清理舊的建置輸出
  if (fs.existsSync(buildOutput)) {
    console.log(`🗑️ Cleaning old build output: ${buildOutput}`);
    fs.rmSync(buildOutput, { recursive: true, force: true });
  }

  // 複製 client 檔案到根目錄
  console.log("📁 Copying client files...");
  copyDir(clientDir, buildOutput);

  // 複製 server 目錄
  console.log("🔧 Copying server files...");
  const serverOutputDir = path.join(buildOutput, "server");
  copyDir(serverDir, serverOutputDir);

  // 驗證關鍵檔案
  const indexHtmlPath = path.join(buildOutput, "index.html");
  const entryServerPath = path.join(serverOutputDir, "entry-server.js");

  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`index.html not found at: ${indexHtmlPath}`);
  }
  if (!fs.existsSync(entryServerPath)) {
    throw new Error(`entry-server.js not found at: ${entryServerPath}`);
  }

  console.log("✅ Build output prepared successfully!");
  console.log(`📍 Output directory: ${buildOutput}`);
  console.log(`✓ index.html: ${indexHtmlPath}`);
  console.log(`✓ entry-server.js: ${entryServerPath}`);
} catch (error) {
  console.error("❌ Build preparation failed:", error.message);
  console.error(error.stack);
  process.exit(1);
}
