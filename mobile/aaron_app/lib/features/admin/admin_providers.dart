import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'admin_repository.dart';
import 'models.dart';

final adminRepoProvider = Provider<AdminRepository>(
  (ref) => AdminRepository(ref.watch(apiClientProvider)),
);

final adminStatsProvider = FutureProvider<AdminStats>(
  (ref) => ref.watch(adminRepoProvider).stats(),
);

/// 用 family 帶 search 字串
final adminUsersProvider =
    FutureProvider.family<({List<AdminUser> users, int total}), String>((
  ref,
  search,
) {
  return ref.watch(adminRepoProvider).users(search: search);
});

final whitelistProvider = FutureProvider<List<WhitelistEntry>>(
  (ref) => ref.watch(adminRepoProvider).whitelist(),
);
