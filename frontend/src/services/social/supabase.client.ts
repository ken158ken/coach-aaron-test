/**
 * Supabase 前端 client（單例，動態載入）
 * @module services/supabase.client
 *
 * 主要用途：訂閱 Realtime broadcast channel（聊天訊息 / 站內通知）
 * 不會做 DB 寫入或 storage 上傳 — 那些都走後端 REST。
 *
 * ⚠️ `@supabase/supabase-js` 刻意用「動態 import」：
 *   NotificationProvider / ChatNotificationProvider 掛在 <App> 最頂層，
 *   一旦這裡用靜態 import，supabase-js（gzip ≈ 50KB）就會被打進首頁的
 *   初始 chunk（PageSpeed「減少無用的 JavaScript」實測 96% 未使用，
 *   而未登入訪客根本不會訂閱任何 channel）。
 *   改成動態 import 後 vendor-supabase 變成 async chunk，只有真的要訂閱
 *   （已登入、或進聊天室）時才下載。
 *   → 因此本函式回傳 Promise；呼叫端要 await。型別用 `import type`
 *     （編譯期擦除，不會把 runtime 模組拉回初始 chunk）。
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://nalerberllvvbalfmadf.supabase.co";

const ANON =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  // 容錯：.env.local 有個 typo (KE 缺 Y)
  (import.meta.env.VITE_SUPABASE_ANON_KE as string) ||
  "";

let _client: SupabaseClient | null = null;
let _pending: Promise<SupabaseClient> | null = null;

/**
 * 取得（必要時先動態載入）Supabase client 單例。
 * 多次並行呼叫共用同一個 in-flight promise，不會重複下載或重複建立 client。
 */
export function getSupabaseClient(): Promise<SupabaseClient> {
  if (_client) return Promise.resolve(_client);
  if (_pending) return _pending;

  _pending = import("@supabase/supabase-js")
    .then(({ createClient }) => {
      if (!ANON) {
        console.warn(
          "[supabase] VITE_SUPABASE_ANON_KEY 未設定 — Realtime 訂閱將失敗",
        );
      }
      _client = createClient(URL, ANON, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
      return _client;
    })
    .catch((err) => {
      // 失敗不要卡住後續重試（例如網路瞬斷造成 chunk 載入失敗）
      _pending = null;
      throw err;
    });

  return _pending;
}
