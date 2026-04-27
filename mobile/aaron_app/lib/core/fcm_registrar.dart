// FCM token 註冊
//
// 流程：
//   1. App 起來時 Firebase 已 init（main.dart）
//   2. 等用戶登入後（authStateProvider.value != null），取 FCM token
//   3. POST /api/notifications/push/subscribe with provider: 'fcm'
//   4. 之後 onTokenRefresh stream 觸發時重 POST（Android 偶爾會 rotate token）
//
// 用 Provider 包成自動生命週期：保持 watch 它就會跑。

import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/auth_providers.dart';

final fcmRegistrarProvider = Provider<void>((ref) {
  final user = ref.watch(authStateProvider).value;
  if (user == null) return;

  final api = ref.watch(apiClientProvider);
  final messaging = FirebaseMessaging.instance;

  StreamSubscription<String>? sub;

  Future<void> registerToken(String token) async {
    if (token.isEmpty) return;
    try {
      await api.post<dynamic>(
        '/api/notifications/push/subscribe',
        body: {
          'provider': 'fcm',
          'token': token,
          'userAgent': _userAgent(),
        },
      );
      if (kDebugMode) {
        debugPrint('[FCM] token 已註冊到後端 (${token.substring(0, 12)}…)');
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[FCM] 註冊 token 失敗: $e');
    }
  }

  Future<void> bootstrap() async {
    try {
      // Android 13+ 需要明確要求通知權限
      await messaging.requestPermission(alert: true, badge: true, sound: true);

      final initial = await messaging.getToken();
      if (initial != null) await registerToken(initial);

      sub = messaging.onTokenRefresh.listen(registerToken);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[FCM] bootstrap 失敗（可能 Firebase 未初始化）: $e');
      }
    }
  }

  bootstrap();
  ref.onDispose(() => sub?.cancel());
});

String _userAgent() {
  try {
    return 'AaronApp/${Platform.operatingSystem}';
  } catch (_) {
    return 'AaronApp/unknown';
  }
}
