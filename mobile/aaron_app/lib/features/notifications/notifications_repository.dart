import '../../core/api_client.dart';
import 'models.dart';

class NotificationsRepository {
  NotificationsRepository(this._api);
  final ApiClient _api;

  Future<List<AppNotification>> list({String status = '', int limit = 50}) async {
    final res = await _api.get<dynamic>(
      '/api/notifications',
      query: {if (status.isNotEmpty) 'status': status, 'limit': '$limit'},
    );
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => AppNotification.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<int> unreadCount() async {
    final res = await _api.get<Map<String, dynamic>>(
      '/api/notifications/unread-count',
    );
    return (res.data?['count'] as num?)?.toInt() ?? 0;
  }

  Future<void> markRead(int id) async {
    await _api.post<dynamic>('/api/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _api.post<dynamic>('/api/notifications/read-all');
  }

  Future<void> delete(int id) async {
    await _api.delete<dynamic>('/api/notifications/$id');
  }
}
