#!/usr/bin/env bash
# Vercel Build Script
# 建構後端 + 前端，準備 SSR bundle，移除 index.html 以觸發 rewrites
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
