import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../theme/colors.dart';
import 'models.dart';
import 'notifications_providers.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _onlyUnread = false;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(notificationsListProvider);
    final unreadAsync = ref.watch(unreadCountProvider);
    final unread = unreadAsync.value ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'NOTIFICATIONS',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
        actions: [
          if (unread > 0)
            TextButton(
              onPressed: () async {
                await ref
                    .read(notificationsRepoProvider)
                    .markAllRead();
                ref.invalidate(notificationsListProvider);
                ref.read(unreadCountProvider.notifier).refresh();
              },
              child: const Text('全部已讀'),
            ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async {
          ref.invalidate(notificationsListProvider);
          await ref.read(unreadCountProvider.notifier).refresh();
        },
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Row(
                children: [
                  ChoiceChip(
                    label: const Text('全部'),
                    selected: !_onlyUnread,
                    onSelected: (_) => setState(() => _onlyUnread = false),
                    selectedColor: AppColors.gold.withValues(alpha: 0.2),
                    backgroundColor: AppColors.surface2,
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: Text('未讀${unread > 0 ? ' ($unread)' : ''}'),
                    selected: _onlyUnread,
                    onSelected: (_) => setState(() => _onlyUnread = true),
                    selectedColor: AppColors.gold.withValues(alpha: 0.2),
                    backgroundColor: AppColors.surface2,
                  ),
                ],
              ),
            ),
            Expanded(
              child: async.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(24),
                  children: [
                    const SizedBox(height: 60),
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: AppColors.error,
                    ),
                    const SizedBox(height: 12),
                    Center(child: Text('$e', textAlign: TextAlign.center)),
                  ],
                ),
                data: (items) {
                  final shown = _onlyUnread
                      ? items.where((n) => !n.isRead).toList()
                      : items;
                  if (shown.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 100),
                        Icon(
                          Icons.notifications_off_outlined,
                          size: 48,
                          color: AppColors.textMuted,
                        ),
                        SizedBox(height: 12),
                        Center(
                          child: Text(
                            '沒有通知',
                            style: TextStyle(color: AppColors.textMuted),
                          ),
                        ),
                      ],
                    );
                  }
                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: shown.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _NotificationTile(
                      notification: shown[i],
                      onTap: () => _onTap(shown[i]),
                      onDelete: () => _onDelete(shown[i]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onTap(AppNotification n) async {
    if (!n.isRead) {
      await ref.read(notificationsRepoProvider).markRead(n.id);
      ref.invalidate(notificationsListProvider);
      ref.read(unreadCountProvider.notifier).refresh();
    }
    if (!mounted) return;
    final link = n.link;
    if (link != null && link.isNotEmpty) {
      context.push(link);
    }
  }

  Future<void> _onDelete(AppNotification n) async {
    await ref.read(notificationsRepoProvider).delete(n.id);
    ref.invalidate(notificationsListProvider);
    ref.read(unreadCountProvider.notifier).refresh();
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
    required this.onDelete,
  });

  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  String _timeText() {
    final d = notification.createdAt.toLocal();
    final today = DateTime.now();
    if (d.year == today.year && d.month == today.month && d.day == today.day) {
      return '今天 ${DateFormat('HH:mm').format(d)}';
    }
    return DateFormat('MM/dd HH:mm').format(d);
  }

  @override
  Widget build(BuildContext context) {
    final unreadStyle = !notification.isRead;
    return Material(
      color: unreadStyle
          ? AppColors.gold.withValues(alpha: 0.06)
          : AppColors.surface,
      borderRadius: BorderRadius.circular(10),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            border: Border.all(
              color: unreadStyle
                  ? AppColors.gold.withValues(alpha: 0.4)
                  : const Color(0x18C5A059),
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Text(
                notification.emojiIcon,
                style: const TextStyle(fontSize: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: TextStyle(
                              color: AppColors.textMain,
                              fontSize: 14,
                              fontWeight: unreadStyle
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          _timeText(),
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    if (notification.body != null &&
                        notification.body!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        notification.body!,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                          height: 1.5,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 16),
                color: AppColors.textMuted,
                onPressed: onDelete,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(
                  minWidth: 28,
                  minHeight: 28,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
