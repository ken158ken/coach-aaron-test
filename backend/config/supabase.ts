/**
 * Supabase 客戶端配置
 *
 * 提供兩種客戶端：
 * - supabase: 有 RLS 限制的公開客戶端
 * - supabaseAdmin: 繞過 RLS 的管理員客戶端（僅限後端使用）
 *
 * @module config/supabase
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 環境變數驗證
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error(
    "Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY"
  );
  throw new Error("Missing required Supabase environment variables");
}

/**
 * 公開客戶端 (有 RLS 限制)
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * 管理員客戶端 (繞過 RLS)
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey
);
