import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/auth_storage.dart';
import 'auth_repository.dart';
import 'models.dart';

final authStorageProvider = Provider<AuthStorage>((_) => AuthStorage());

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(authStorageProvider)),
);

final authRepoProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(authStorageProvider),
  ),
);

// App 啟動時跑一次：有 token 就 me()，沒 token 或失敗就回 null
final authStateProvider =
    AsyncNotifierProvider<AuthStateNotifier, AppUser?>(AuthStateNotifier.new);

class AuthStateNotifier extends AsyncNotifier<AppUser?> {
  @override
  Future<AppUser?> build() async {
    final storage = ref.watch(authStorageProvider);
    final token = await storage.read();
    if (token == null || token.isEmpty) return null;
    final res = await ref.read(authRepoProvider).me();
    if (res == null) return null;
    return res.user.copyWith(isAdmin: res.isAdmin);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final res = await ref.read(authRepoProvider).login(email, password);
      return res.user.copyWith(isAdmin: res.isAdmin);
    });
  }

  Future<void> logout() async {
    await ref.read(authRepoProvider).logout();
    state = const AsyncData(null);
  }
}
