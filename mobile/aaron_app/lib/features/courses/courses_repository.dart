import '../../core/api_client.dart';
import 'models.dart';

class CoursesRepository {
  CoursesRepository(this._api);
  final ApiClient _api;

  Future<List<Course>> list() async {
    final res = await _api.get<dynamic>('/api/courses');
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => Course.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<Course> getById(int id) async {
    final res = await _api.get<Map<String, dynamic>>('/api/courses/$id');
    return Course.fromJson(res.data ?? const {});
  }
}
