import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/app.dart';
import 'core/env.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('zh_TW');

  // Firebase（推播用）— 缺 google-services.json 時不會 crash，只是不能收推播
  try {
    await Firebase.initializeApp();
  } catch (e) {
    if (kDebugMode) debugPrint('Firebase init 失敗（可忽略，等之後配置）: $e');
  }

  // Supabase（聊天 Realtime）— 缺 anon key 時不啟用 realtime
  if (Env.supabaseAnonKey.isNotEmpty) {
    try {
      await Supabase.initialize(
        url: Env.supabaseUrl,
        anonKey: Env.supabaseAnonKey,
      );
    } catch (e) {
      if (kDebugMode) debugPrint('Supabase init 失敗: $e');
    }
  } else if (kDebugMode) {
    debugPrint(
      'SUPABASE_ANON_KEY 未設定，聊天即時推送會 fallback 為純 polling',
    );
  }

  runApp(const ProviderScope(child: AaronApp()));
}
