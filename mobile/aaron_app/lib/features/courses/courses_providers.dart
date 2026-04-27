import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'courses_repository.dart';
import 'models.dart';

final coursesRepoProvider = Provider<CoursesRepository>(
  (ref) => CoursesRepository(ref.watch(apiClientProvider)),
);

final coursesListProvider = FutureProvider<List<Course>>((ref) {
  return ref.watch(coursesRepoProvider).list();
});

final courseDetailProvider = FutureProvider.family<Course, int>((ref, id) {
  return ref.watch(coursesRepoProvider).getById(id);
});
