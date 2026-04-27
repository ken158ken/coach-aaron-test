import '../../core/api_client.dart';
import 'models.dart';

class ArticlesRepository {
  ArticlesRepository(this._api);
  final ApiClient _api;

  Future<List<ArticleSummary>> list({int limit = 30}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/api/articles',
      query: {'page': '1', 'limit': '$limit'},
    );
    final list = res.data?['articles'];
    if (list is List) {
      return list
          .whereType<Map>()
          .map((e) => ArticleSummary.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<Article> getByIdOrSlug(String identifier) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/api/articles/$identifier',
    );
    return Article.fromJson(res.data ?? const {});
  }
}
