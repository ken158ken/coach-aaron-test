import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'articles_repository.dart';
import 'models.dart';

final articlesRepoProvider = Provider<ArticlesRepository>(
  (ref) => ArticlesRepository(ref.watch(apiClientProvider)),
);

final articlesListProvider = FutureProvider<List<ArticleSummary>>((ref) {
  return ref.watch(articlesRepoProvider).list();
});

final articleDetailProvider = FutureProvider.family<Article, String>(
  (ref, idOrSlug) {
    return ref.watch(articlesRepoProvider).getByIdOrSlug(idOrSlug);
  },
);
