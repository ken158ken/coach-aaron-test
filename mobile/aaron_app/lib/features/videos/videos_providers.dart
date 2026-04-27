import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'models.dart';
import 'videos_repository.dart';

final videosRepoProvider = Provider<VideosRepository>(
  (ref) => VideosRepository(ref.watch(apiClientProvider)),
);

final videosListProvider = FutureProvider<List<VideoItem>>((ref) {
  return ref.watch(videosRepoProvider).list();
});
