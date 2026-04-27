import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/admin/admin_dashboard_screen.dart';
import '../features/admin/admin_users_screen.dart';
import '../features/admin/admin_whitelist_screen.dart';
import '../features/articles/article_detail_screen.dart';
import '../features/articles/articles_screen.dart';
import '../features/auth/auth_providers.dart';
import '../features/auth/login_screen.dart';
import '../features/booking/booking_screen.dart';
import '../features/booking/my_bookings_screen.dart';
import '../features/chat/chat_thread_screen.dart';
import '../features/chat/conversations_screen.dart';
import '../features/courses/course_detail_screen.dart';
import '../features/courses/courses_screen.dart';
import '../features/home/home_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/videos/videos_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (ctx, state) {
      if (auth.isLoading) return null;
      final user = auth.value;
      final loggedIn = user != null;
      final goingToLogin = state.matchedLocation == '/login';
      final goingToAdmin = state.matchedLocation.startsWith('/admin');

      if (!loggedIn && !goingToLogin) return '/login';
      if (loggedIn && goingToLogin) return '/';
      // 非 admin 想進 /admin 強制踢回首頁
      if (goingToAdmin && (user == null || !user.isAdmin)) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(
        path: '/courses',
        builder: (_, _) => const CoursesScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (_, state) {
              final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
              return CourseDetailScreen(courseId: id);
            },
          ),
        ],
      ),
      GoRoute(
        path: '/articles',
        builder: (_, _) => const ArticlesScreen(),
        routes: [
          GoRoute(
            path: ':idOrSlug',
            builder: (_, state) => ArticleDetailScreen(
              idOrSlug: state.pathParameters['idOrSlug'] ?? '',
            ),
          ),
        ],
      ),
      GoRoute(path: '/videos', builder: (_, _) => const VideosScreen()),
      GoRoute(path: '/booking', builder: (_, _) => const BookingScreen()),
      GoRoute(
        path: '/my-bookings',
        builder: (_, _) => const MyBookingsScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, _) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/chat',
        builder: (_, _) => const ConversationsScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (_, state) => ChatThreadScreen(
              conversationId: state.pathParameters['id'] ?? '',
            ),
          ),
        ],
      ),

      // ── Admin ──
      GoRoute(
        path: '/admin',
        builder: (_, _) => const AdminDashboardScreen(),
        routes: [
          GoRoute(
            path: 'users',
            builder: (_, _) => const AdminUsersScreen(),
          ),
          GoRoute(
            path: 'whitelist',
            builder: (_, _) => const AdminWhitelistScreen(),
          ),
        ],
      ),
    ],
  );
});
