#!/usr/bin/env bash
# Vercel Build Script
# 建構後端 + 前端，準備 SSR bundle，移除 index.html 以觸發 rewrites
set -e

# ============================================================
# 0/5 解析網站正式網址（SEO canonical / og:url / sitemap 的唯一真相來源）
# ------------------------------------------------------------
# 背景：SEOHead.tsx 在 VITE_SITE_URL 未設定時會 fallback 到一個寫死的
#       測試網域。若正式站忘了設這個建置變數，全站 canonical、og:url、
#       JSON-LD 的 url 都會指向測試站，等同自我封殺索引。
#
# 解法：在建置期依下列優先序推導並 export VITE_SITE_URL，
#       讓「忘了設定」的預設行為變成「指向自己」而非「指向測試站」。
#
#   1. VITE_SITE_URL                          — 明確設定（Vercel 專案環境變數），最高優先
#   2. https://$VERCEL_PROJECT_PRODUCTION_URL — production 部署的正式網域
#   3. https://$VERCEL_URL                    — preview 部署的本次部署網址
#   4. http://localhost:5173                  — 本機
#
# 上正式站的正確做法仍是明確設定 VITE_SITE_URL（尤其是使用自訂網域時）；
# 詳見 frontend/.env.example。
# ============================================================
if [ -z "$VITE_SITE_URL" ]; then
  if [ "$VERCEL_ENV" = "production" ] && [ -n "$VERCEL_PROJECT_PRODUCTION_URL" ]; then
    export VITE_SITE_URL="https://$VERCEL_PROJECT_PRODUCTION_URL"
  elif [ -n "$VERCEL_URL" ]; then
    export VITE_SITE_URL="https://$VERCEL_URL"
  else
    export VITE_SITE_URL="http://localhost:5173"
  fi
  echo "⚠️  VITE_SITE_URL 未設定，已自動推導為: $VITE_SITE_URL"
else
  # 去除結尾斜線，避免產生 https://example.com//articles 這類雙斜線 URL
  export VITE_SITE_URL="${VITE_SITE_URL%/}"
  echo "✅ VITE_SITE_URL = $VITE_SITE_URL"
fi

# 註：build 階段的 export 不會傳遞到 runtime，因此 api/sitemap.js 內含
#     相同的推導邏輯作為 fallback；若要在 runtime 覆寫，請在 Vercel
#     專案設定中加入 SITE_URL 環境變數。

echo "=== 1/6 Building backend ==="
cd backend && npm install && npm run build && cd ..

echo "=== 2/6 Building frontend ==="
cd frontend && npm install && npm run build && cd ..

echo "=== 3/6 Copying SSR assets to api/ ==="
cp frontend/dist/server/entry-server.cjs api/_ssr_bundle.cjs
cp frontend/dist/client/index.html api/_ssr_template.html

echo "=== 4/6 Stamping service worker cache version ==="
# sw.js 的 SW_VERSION 決定快取版本；SW 啟用時會刪除「非本版本」的所有舊快取。
# 這裡把佔位符 __SW_BUILD_ID__ 換成本次 commit SHA（無則用時間戳），
# 使每次部署都是新版本字串 → 每次部署自動清除使用者端舊快取。
SW="frontend/dist/client/sw.js"
SW_ID="${VERCEL_GIT_COMMIT_SHA:-$(date +%Y%m%d%H%M%S)}"
if [ -f "$SW" ]; then
  sed -i.bak "s|__SW_BUILD_ID__|${SW_ID}|g" "$SW"
  rm -f "${SW}.bak"
  echo "    SW_VERSION = ${SW_ID}"
else
  echo "    ⚠️  找不到 $SW，略過"
fi

echo "=== 5/6 Rewriting robots.txt Sitemap host ==="
# frontend/public/robots.txt 內的 Sitemap 行是 localhost 佔位值，
# 這裡改寫為本次部署真正的網域，確保 robots 宣告的 sitemap 位置永遠正確。
ROBOTS="frontend/dist/client/robots.txt"
if [ -f "$ROBOTS" ]; then
  # 用 | 當分隔符，避免 URL 內的 / 需要逸出
  sed -i.bak "s|^Sitemap: .*|Sitemap: ${VITE_SITE_URL}/sitemap.xml|" "$ROBOTS"
  rm -f "${ROBOTS}.bak"
  echo "    Sitemap: ${VITE_SITE_URL}/sitemap.xml"
else
  echo "    ⚠️  找不到 $ROBOTS，略過"
fi

echo "=== 6/6 Removing index.html from outputDir ==="
rm frontend/dist/client/index.html

echo "=== Build complete ==="
