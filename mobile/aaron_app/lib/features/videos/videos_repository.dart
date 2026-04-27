import '../../core/api_client.dart';
import 'models.dart';

class VideosRepository {
  VideosRepository(this._api);
  final ApiClient _api;

  Future<List<VideoItem>> list() async {
    final res = await _api.get<Map<String, dynamic>>('/api/videos');
    final data = res.data?['data'];
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => VideoItem.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }
}
