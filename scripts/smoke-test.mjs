/**
 * 部署後煙霧測試（GitHub Actions 用，也可本機手動跑）
 *
 * 用法：SITE_URL=https://... CRON_SECRET=... [WAIT_SHA=<commit sha>] node scripts/smoke-test.mjs
 *
 * 1. WAIT_SHA 有給時：輪詢 /sw.js 直到內含該 commit（vercel-build.sh 會把
 *    __SW_BUILD_ID__ 蓋成 SHA），確認打到的是「這次」的部署，最多等 15 分鐘
 * 2. 公開端點存活檢查（首頁 / 課程 API / 認證路由 / PWA 資產）
 * 3. GET /api/cron/smoke：後端真實跑「註冊 INSERT→回讀→硬刪」關鍵路徑
 */

const SITE = (process.env.SITE_URL || "https://coach-aaron-test.vercel.app").replace(/\/$/, "");
const SECRET = process.env.CRON_SECRET;
const WAIT_SHA = (process.env.WAIT_SHA || "").slice(0, 7);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
const report = (name, ok, detail = "") => {
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed = true;
};

// ── 1. 等待目標部署上線 ──
if (WAIT_SHA) {
  const deadline = Date.now() + 15 * 60 * 1000;
  process.stdout.write(`等待部署 ${WAIT_SHA} 上線`);
  for (;;) {
    try {
      const sw = await (await fetch(`${SITE}/sw.js`, { cache: "no-store" })).text();
      if (sw.includes(WAIT_SHA)) break;
    } catch {
      /* 網路抖動，重試 */
    }
    if (Date.now() > deadline) {
      console.log("");
      report("deploy_live", false, `15 分鐘內未看到 ${WAIT_SHA}（Vercel 部署失敗或未觸發？）`);
      process.exit(1);
    }
    process.stdout.write(".");
    await sleep(20_000);
  }
  console.log("");
  report("deploy_live", true, WAIT_SHA);
}

// ── 2. 公開端點存活 ──
const expect = async (name, path, wantStatus, checkBody) => {
  try {
    const res = await fetch(`${SITE}${path}`, { cache: "no-store" });
    if (res.status !== wantStatus) {
      report(name, false, `HTTP ${res.status}（預期 ${wantStatus}）`);
      return;
    }
    if (checkBody) {
      const body = await res.text();
      const problem = checkBody(body);
      if (problem) {
        report(name, false, problem);
        return;
      }
    }
    report(name, true);
  } catch (err) {
    report(name, false, String(err));
  }
};

await expect("home_ssr", "/", 200, (b) => (b.includes("</html>") ? null : "非完整 HTML"));
await expect("login_ssr", "/login", 200);
await expect("api_courses", "/api/courses", 200, (b) => {
  try {
    return Array.isArray(JSON.parse(b)) ? null : "非陣列";
  } catch {
    return "非 JSON";
  }
});
await expect("api_auth_alive", "/api/auth/me", 401); // 未帶 token 應回 401（代表認證路由活著）
await expect("favicon", "/favicon.svg", 200);
await expect("manifest", "/manifest.json", 200);

// ── 3. 後端關鍵路徑（註冊層級） ──
if (!SECRET) {
  report("backend_smoke", false, "缺 CRON_SECRET，無法執行後端煙霧測試");
} else {
  try {
    const res = await fetch(`${SITE}/api/cron/smoke`, {
      headers: { Authorization: `Bearer ${SECRET}` },
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.ok) {
      report("backend_smoke", true, Object.keys(body.checks).join(", "));
    } else {
      report("backend_smoke", false, JSON.stringify(body?.checks ?? body).slice(0, 300));
    }
  } catch (err) {
    report("backend_smoke", false, String(err));
  }
}

process.exit(failed ? 1 : 0);
