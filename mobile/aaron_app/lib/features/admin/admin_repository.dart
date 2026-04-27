import '../../core/api_client.dart';
import 'models.dart';

class AdminRepository {
  AdminRepository(this._api);
  final ApiClient _api;

  Future<AdminStats> stats() async {
    final res = await _api.get<Map<String, dynamic>>('/api/admin/stats');
    return AdminStats.fromJson(res.data ?? const {});
  }

  Future<({List<AdminUser> users, int total})> users({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/api/admin/users',
      query: {
        'page': '$page',
        'limit': '$limit',
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    final list = res.data?['users'];
    final total = (res.data?['total'] as num?)?.toInt() ?? 0;
    if (list is List) {
      return (
        users: list
            .whereType<Map>()
            .map((e) => AdminUser.fromJson(e.cast<String, dynamic>()))
            .toList(),
        total: total,
      );
    }
    return (users: const <AdminUser>[], total: 0);
  }

  Future<void> updateUser(
    int id, {
    String? displayName,
    bool? isActive,
  }) async {
    await _api.put<dynamic>(
      '/api/admin/users/$id',
      body: {
        if (displayName != null) 'displayName': displayName,
        if (isActive != null) 'isActive': isActive,
      },
    );
  }

  Future<List<WhitelistEntry>> whitelist() async {
    final res = await _api.get<dynamic>('/api/admin/whitelist');
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => WhitelistEntry.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<void> addWhitelist({
    String? email,
    String? phoneNumber,
    String? note,
  }) async {
    await _api.post<dynamic>(
      '/api/admin/whitelist',
      body: {
        if (email != null && email.isNotEmpty) 'email': email,
        if (phoneNumber != null && phoneNumber.isNotEmpty)
          'phoneNumber': phoneNumber,
        if (note != null && note.isNotEmpty) 'note': note,
      },
    );
  }

  Future<void> updateWhitelist(
    int id, {
    String? note,
    String? displayName,
    bool? isActive,
  }) async {
    await _api.put<dynamic>(
      '/api/admin/whitelist/$id',
      body: {
        if (note != null) 'note': note,
        if (displayName != null) 'displayName': displayName,
        if (isActive != null) 'isActive': isActive,
      },
    );
  }

  Future<void> deleteWhitelist(int id) async {
    await _api.delete<dynamic>('/api/admin/whitelist/$id');
  }
}
