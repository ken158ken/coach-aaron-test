/**
 * Vercel 建置腳本
 * 將 client 和 server 輸出複製到統一目錄
 */

const fs = require('fs');
const path = require('path');

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
  console.log('📦 Starting build output preparation...');
  
  const buildOutput = '.vercel_build_output';
  const clientDir = 'frontend/dist/client';
  const serverDir = 'frontend/dist/server';

  // 清理舊的建置輸出
  if (fs.existsSync(buildOutput)) {
    fs.rmSync(buildOutput, { recursive: true, force: true });
  }

  // 複製 client 檔案到根目錄
  console.log('📁 Copying client files...');
  copyDir(clientDir, buildOutput);

  // 複製 server 目錄
  console.log('🔧 Copying server files...');
  copyDir(serverDir, path.join(buildOutput, 'server'));

  console.log('✅ Build output prepared successfully!');
  console.log(`📍 Output directory: ${buildOutput}`);
} catch (error) {
  console.error('❌ Build preparation failed:', error);
  process.exit(1);
}
