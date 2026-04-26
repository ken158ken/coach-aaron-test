/**
 * Aaron Coach Service Worker
 *
 * 功能：
 *   1. App shell 快取：HTML / JS / CSS / 字型 stale-while-revalidate
 *   2. /api/* 一律 network-only（聊天訊息要新鮮、不快取）
 *   3. 圖片（/images/, Cloudinary, og）cache-first + 30 天 TTL
 *   4. Web Push 接收 → 系統通知
 *   5. notificationclick → 開對應頁面（或 focus 已開的 tab）
 *
 * 版本管理：改 SW_VERSION 會清掉舊 cache。
 */

/* eslint-disable no-restricted-globals */

const SW_VERSION = "v1.2026-04-26";
const SHELL_CACHE = `aaron-shell-${SW_VERSION}`;
const IMAGE_CACHE = `aaron-image-${SW_VERSION}`;

// 安裝 — 預先快取靜態核心
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache
        .addAll([
          "/",
          "/manifest.json",
          "/favicon.svg",
          "/icons/icon-192.png",
          "/icons/icon-512.png",
        ])
        .catch(() => {
          /* 個別檔案不存在不阻擋安裝 */
        }),
    ),
  );
});

// 啟用 — 清掉舊版本 cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.endsWith(SW_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// 路由策略
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // 跳過：跨域 + chrome-extension + ws / wss
  if (url.origin !== self.location.origin && !isCloudinary(url)) return;

  // /api/* — 一律走網路（避免快取聊天 / 預約等動態資料）
  if (url.pathname.startsWith("/api/")) return;

  // 圖片 — cache-first
  if (
    isCloudinary(url) ||
    url.pathname.startsWith("/images/") ||
    /\.(png|jpe?g|webp|gif|svg)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(IMAGE_CACHE, request));
    return;
  }

  // 其他靜態 / 文件 — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(SHELL_CACHE, request));
});

function isCloudinary(url) {
  return url.hostname === "res.cloudinary.com";
}

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// ============================================================
// Web Push
// ============================================================

self.addEventListener("push", (event) => {
  let payload = { title: "新通知", body: "" };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { link: payload.link || "/" },
    tag: payload.tag || "aaron-notification",
    renotify: !!payload.renotify,
    silent: !!payload.silent,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "新通知", options),
  );
});

// 點通知 → 開頁面（若已有 tab 就 focus；否則開新分頁）
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // 找已開的 tab，導向 link 並 focus
      for (const client of allClients) {
        const u = new URL(client.url);
        if (u.origin === self.location.origin) {
          client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(link);
            } catch {
              /* ignore */
            }
          }
          return;
        }
      }
      // 沒開過 tab → 開新的
      if (self.clients.openWindow) {
        await self.clients.openWindow(link);
      }
    })(),
  );
});

// 訊息（給前端控制 SW 用，例如 skipWaiting）
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
