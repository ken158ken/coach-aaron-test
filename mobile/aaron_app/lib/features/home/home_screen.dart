import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../theme/colors.dart';
import '../auth/auth_providers.dart';
import '../notifications/notification_bell.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AARON',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
        actions: [
          const NotificationBell(),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: '登出',
            onPressed: () => ref.read(authStateProvider.notifier).logout(),
          ),
        ],
      ),
      body: auth.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('錯誤：$e')),
        data: (user) => SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            children: [
              Text(
                '歡迎',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 13,
                  letterSpacing: 4,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                user?.displayName ?? user?.username ?? '訪客',
                style: const TextStyle(
                  fontSize: 28,
                  color: AppColors.textMain,
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 28),

              // ── 已實作 ──
              const _SectionLabel(text: 'EXPLORE'),
              const SizedBox(height: 10),
              _ModuleCard(
                icon: Icons.menu_book_outlined,
                title: '課程',
                subtitle: '探索健身與訓練課程',
                onTap: () => context.push('/courses'),
              ),
              _ModuleCard(
                icon: Icons.article_outlined,
                title: '文章',
                subtitle: '專欄文章 / 訓練筆記',
                onTap: () => context.push('/articles'),
              ),
              _ModuleCard(
                icon: Icons.video_library_outlined,
                title: '影片',
                subtitle: 'YouTube / Instagram 精選',
                onTap: () => context.push('/videos'),
              ),

              const SizedBox(height: 28),
              const _SectionLabel(text: 'BOOKING'),
              const SizedBox(height: 10),
              _ModuleCard(
                icon: Icons.calendar_month_outlined,
                title: '預約諮詢',
                subtitle: '挑時段預約教練',
                onTap: () => context.push('/booking'),
              ),
              _ModuleCard(
                icon: Icons.event_available_outlined,
                title: '我的預約',
                subtitle: '查看 / 取消已送出的預約',
                onTap: () => context.push('/my-bookings'),
              ),

              if (user?.isAdmin == true) ...[
                const SizedBox(height: 28),
                const _SectionLabel(text: 'ADMIN'),
                const SizedBox(height: 10),
                _ModuleCard(
                  icon: Icons.admin_panel_settings_outlined,
                  title: '後台',
                  subtitle: '會員 / 白名單 / 統計',
                  onTap: () => context.push('/admin'),
                ),
              ],

              const SizedBox(height: 28),
              const _SectionLabel(text: 'CONNECT'),
              const SizedBox(height: 10),
              _ModuleCard(
                icon: Icons.chat_outlined,
                title: '聊天',
                subtitle: '與教練 / 群組對話',
                onTap: () => context.push('/chat'),
              ),
              _ModuleCard(
                icon: Icons.notifications_outlined,
                title: '通知中心',
                subtitle: '預約 / 訊息 / 系統通知',
                onTap: () => context.push('/notifications'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        color: AppColors.textMuted,
        letterSpacing: 4,
      ),
    );
  }
}

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0x33C5A059)),
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: AppColors.gold, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          color: AppColors.textMain,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  color: AppColors.textMuted,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

