import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../theme/colors.dart';
import 'admin_providers.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(adminStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'ADMIN',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async => ref.refresh(adminStatsProvider.future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          children: [
            const _SectionLabel(text: 'OVERVIEW'),
            const SizedBox(height: 12),
            async.when(
              loading: () => const SizedBox(
                height: 180,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.error.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  '$e',
                  style: const TextStyle(color: AppColors.error),
                ),
              ),
              data: (s) {
                final fmt = NumberFormat('#,##0');
                return GridView(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.45,
                      ),
                  children: [
                    _StatCard(
                      icon: Icons.people_outline,
                      label: '會員',
                      value: fmt.format(s.userCount),
                    ),
                    _StatCard(
                      icon: Icons.menu_book_outlined,
                      label: '課程',
                      value: fmt.format(s.courseCount),
                    ),
                    _StatCard(
                      icon: Icons.receipt_long_outlined,
                      label: '訂單',
                      value: fmt.format(s.orderCount),
                    ),
                    _StatCard(
                      icon: Icons.payments_outlined,
                      label: '本月營收',
                      value: 'NT\$ ${fmt.format(s.monthlyRevenue)}',
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 28),
            const _SectionLabel(text: 'MANAGE'),
            const SizedBox(height: 12),
            _AdminTile(
              icon: Icons.person_outline,
              title: '會員管理',
              subtitle: '搜尋 / 啟用 / 停用',
              onTap: () => context.push('/admin/users'),
            ),
            _AdminTile(
              icon: Icons.shield_outlined,
              title: '白名單',
              subtitle: '管理員白名單 + 顯示名稱',
              onTap: () => context.push('/admin/whitelist'),
            ),
          ],
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

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x33C5A059)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.gold, size: 22),
          const Spacer(),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.bottomLeft,
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.textMain,
                fontSize: 22,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminTile extends StatelessWidget {
  const _AdminTile({
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0x33C5A059)),
              borderRadius: BorderRadius.circular(12),
            ),
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
