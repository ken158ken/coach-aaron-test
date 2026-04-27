// 全域設定 — 用 --dart-define 覆蓋
//
// 範例：
//   flutter run --dart-define=API_URL=https://coach-aaron-redesign.vercel.app
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://coach-aaron-redesign.vercel.app',
  );

  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://nalerberllvvbalfmadf.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
  );
}
