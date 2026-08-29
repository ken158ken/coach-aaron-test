/**
 * Three.js 元件統一導出（SSR 安全版）
 * @module components/three
 *
 * @description
 * 使用 React.lazy + ClientOnly 包裝器確保：
 * 1. SSR 構建時 PrismScene/AbyssScene 被 code-split 為獨立 chunk
 * 2. entry-server.js 不包含 import("three") 參照
 * 3. Vercel 函式不會追蹤 three 套件的 node_modules
 * 4. 客戶端正常 lazy-load 並渲染 Three.js 場景
 */

import React, { lazy, Suspense, useEffect, useState } from "react";

export { default as ThreeCanvas } from "./ThreeCanvas";

/**
 * 客戶端專用包裝器
 * SSR 時 (mounted=false) 返回 fallback，客戶端 hydration 後載入真實元件
 */
function ClientOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return <>{mounted ? children : fallback}</>;
}

/** 佔位 div - 與場景元件相同結構，避免 hydration 跳動 */
const ScenePlaceholder = ({ className = "" }: { className?: string }) => (
  <div className={`fixed inset-0 -z-10 ${className}`} />
);

// React.lazy 延遲載入 - 產生獨立 chunk，不進入 entry-server.js
const LazyAbyssScene = lazy(() => import("./AbyssScene"));
const LazyPrismScene = lazy(() => import("./PrismScene"));

/**
 * AbyssScene SSR 安全包裝器
 * SSR: 渲染佔位 div | Client: lazy-load 真實深海場景
 */
export function AbyssScene({ className }: { className?: string }) {
  return (
    <ClientOnly fallback={<ScenePlaceholder className={className} />}>
      <Suspense fallback={<ScenePlaceholder className={className} />}>
        <LazyAbyssScene className={className} />
      </Suspense>
    </ClientOnly>
  );
}

/**
 * PrismScene SSR 安全包裝器
 * SSR: 渲染佔位 div | Client: lazy-load 真實水晶場景
 */
export function PrismScene({ className }: { className?: string }) {
  return (
    <ClientOnly fallback={<ScenePlaceholder className={className} />}>
      <Suspense fallback={<ScenePlaceholder className={className} />}>
        <LazyPrismScene className={className} />
      </Suspense>
    </ClientOnly>
  );
}
