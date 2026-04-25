/**
 * Supabase 前端 client（單例）
 * @module services/supabase.client
 *
 * 主要用途：訂閱 Realtime broadcast channel（聊天訊息）
 * 不會做 DB 寫入或 storage 上傳 — 那些都走後端 REST。
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://nalerberllvvbalfmadf.supabase.co";

const ANON =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  // 容錯：.env.local 有個 typo (KE 缺 Y)
  (import.meta.env.VITE_SUPABASE_ANON_KE as string) ||
  "";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
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
}
