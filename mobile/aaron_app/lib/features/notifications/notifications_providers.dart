import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'models.dart';
import 'notifications_repository.dart';

final notificationsRepoProvider = Provider<NotificationsRepository>(
  (ref) => NotificationsRepository(ref.watch(apiClientProvider)),
);

final notificationsListProvider = FutureProvider<List<AppNotification>>(
  (ref) => ref.watch(notificationsRepoProvider).list(),
);

/// 未讀數：每 30 秒重抓一次（沒登入時關掉），收 FCM 時也會 invalidate
final unreadCountProvider =
    AsyncNotifierProvider<UnreadCountNotifier, int>(UnreadCountNotifier.new);

class UnreadCountNotifier extends AsyncNotifier<int> {
  Timer? _timer;

  @override
  Future<int> build() async {
    final user = ref.watch(authStateProvider).value;
    _timer?.cancel();
    if (user == null) return 0;

    // 第一次讀
    final initial = await _fetch();

    // 開始輪詢
    _timer = Timer.periodic(const Duration(seconds: 30), (_) async {
      try {
        final n = await _fetch();
        if (state.value != n) state = AsyncData(n);
      } catch (_) {
        // 忽略單次失敗
      }
    });

    ref.onDispose(() => _timer?.cancel());
    return initial;
  }

  Future<int> _fetch() {
    return ref.read(notificationsRepoProvider).unreadCount();
  }

  /// 提供給聊天訊息送出 / 用戶讀完通知後手動更新
  Future<void> refresh() async {
    state = AsyncData(await _fetch());
  }
}
