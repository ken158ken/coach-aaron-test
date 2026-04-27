import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/fcm_registrar.dart';
import '../theme/app_theme.dart';
import 'router.dart';

class AaronApp extends ConsumerWidget {
  const AaronApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 啟動 FCM 註冊器（內部 watch authStateProvider，登入後才註冊 token）
    ref.watch(fcmRegistrarProvider);

    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Aaron',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      routerConfig: router,
    );
  }
}
