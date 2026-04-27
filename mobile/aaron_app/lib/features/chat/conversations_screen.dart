import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../theme/colors.dart';
import '../auth/auth_providers.dart';
import 'chat_providers.dart';
import 'models.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).value;
    final convsAsync = ref.watch(conversationsProvider);
    final myId = user?.id ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'CHAT',
          style: TextStyle(letterSpacing: 4, fontWeight: FontWeight.w300),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.studioBg,
        onPressed: () => _showNewChat(context, ref),
        child: const Icon(Icons.add_comment_outlined),
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: () async => ref.refresh(conversationsProvider.future),
        child: convsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
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
          data: (convs) {
            if (convs.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 100),
                  Icon(
                    Icons.chat_bubble_outline,
                    size: 56,
                    color: AppColors.textMuted,
                  ),
                  SizedBox(height: 12),
                  Center(
                    child: Text(
                      '還沒有任何對話',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                  SizedBox(height: 4),
                  Center(
                    child: Text(
                      '點右下角 + 開始新對話',
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: convs.length,
              separatorBuilder: (_, _) => const Divider(
                height: 1,
                color: Color(0x18C5A059),
                indent: 76,
              ),
              itemBuilder: (_, i) => _ConversationTile(
                conversation: convs[i],
                myId: myId,
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _showNewChat(BuildContext ctx, WidgetRef ref) async {
    await showModalBottomSheet<void>(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const _NewChatSheet(),
    );
    // 不論成功失敗都重抓對話列表
    ref.invalidate(conversationsProvider);
  }
}

class _ConversationTile extends StatelessWidget {
  const _ConversationTile({required this.conversation, required this.myId});
  final ConversationSummary conversation;
  final int myId;

  String _previewText() {
    final lm = conversation.lastMessage;
    if (lm == null) return '';
    if (lm.messageType == 'system') return lm.content ?? '系統訊息';
    final isMine = lm.senderId == myId;
    final prefix = isMine ? '你: ' : '';
    if (lm.content?.isNotEmpty == true) return '$prefix${lm.content}';
    if (lm.hasImage) return '$prefix📷 圖片';
    return '';
  }

  String _timeText() {
    final t = conversation.lastMessageAt ?? conversation.createdAt;
    final local = t.toLocal();
    final now = DateTime.now();
    if (local.year == now.year &&
        local.month == now.month &&
        local.day == now.day) {
      return DateFormat('HH:mm').format(local);
    }
    final yesterday = DateTime(now.year, now.month, now.day)
        .subtract(const Duration(days: 1));
    if (local.year == yesterday.year &&
        local.month == yesterday.month &&
        local.day == yesterday.day) {
      return '昨天';
    }
    return DateFormat('MM/dd').format(local);
  }

  @override
  Widget build(BuildContext context) {
    final isLeft = conversation.myLeftAt != null;
    final title = conversation.displayTitle(myId);
    final avatar = conversation.dmAvatarFor(myId);
    final isGroup = conversation.type == 'group';

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: _Avatar(
        avatarUrl: avatar,
        isGroup: isGroup,
        title: title,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: isLeft ? AppColors.textMuted : AppColors.textMain,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (isLeft)
            const Padding(
              padding: EdgeInsets.only(left: 6),
              child: Text(
                '已離開',
                style: TextStyle(color: AppColors.error, fontSize: 11),
              ),
            ),
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: Text(
              _timeText(),
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Row(
          children: [
            Expanded(
              child: Text(
                _previewText(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 13,
                ),
              ),
            ),
            if (conversation.unreadCount > 0)
              Container(
                margin: const EdgeInsets.only(left: 6),
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.gold,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  conversation.unreadCount > 99
                      ? '99+'
                      : '${conversation.unreadCount}',
                  style: const TextStyle(
                    color: AppColors.studioBg,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
      ),
      onTap: () => context.push('/chat/${conversation.id}'),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({
    required this.avatarUrl,
    required this.isGroup,
    required this.title,
  });

  final String? avatarUrl;
  final bool isGroup;
  final String title;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 24,
      backgroundColor: AppColors.surface2,
      backgroundImage:
          avatarUrl != null ? CachedNetworkImageProvider(avatarUrl!) : null,
      child: avatarUrl == null
          ? Icon(
              isGroup ? Icons.group_outlined : Icons.person_outline,
              color: AppColors.textMuted,
              size: 22,
            )
          : null,
    );
  }
}

class _NewChatSheet extends ConsumerWidget {
  const _NewChatSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adminsAsync = ref.watch(adminsProvider);

    return SafeArea(
      top: false,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.6,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.textMuted.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 6),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '聯絡管理員',
                  style: TextStyle(
                    color: AppColors.textMain,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '點選下方任一管理員開啟對話',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Flexible(
              child: adminsAsync.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('$e', style: const TextStyle(color: AppColors.error)),
                ),
                data: (admins) {
                  if (admins.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                        '目前沒有可聯絡的管理員',
                        style: TextStyle(color: AppColors.textMuted),
                      ),
                    );
                  }
                  return ListView.separated(
                    shrinkWrap: true,
                    itemCount: admins.length,
                    separatorBuilder: (_, _) => const Divider(
                      height: 1,
                      color: Color(0x18C5A059),
                      indent: 64,
                    ),
                    itemBuilder: (_, i) {
                      final a = admins[i];
                      return ListTile(
                        leading: CircleAvatar(
                          radius: 20,
                          backgroundColor: AppColors.surface2,
                          backgroundImage: a.avatarUrl != null
                              ? CachedNetworkImageProvider(a.avatarUrl!)
                              : null,
                          child: a.avatarUrl == null
                              ? const Icon(
                                  Icons.person_outline,
                                  color: AppColors.textMuted,
                                  size: 20,
                                )
                              : null,
                        ),
                        title: Text(
                          a.bestName,
                          style:
                              const TextStyle(color: AppColors.textMain),
                        ),
                        subtitle: a.adminNote?.isNotEmpty == true
                            ? Text(
                                a.adminNote!,
                                style: const TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 12,
                                ),
                              )
                            : null,
                        onTap: () async {
                          try {
                            final conv = await ref
                                .read(chatRepoProvider)
                                .createOrGetDm(a.userId);
                            if (context.mounted) {
                              Navigator.of(context).pop();
                              context.push('/chat/${conv.id}');
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('無法建立對話：$e')),
                              );
                            }
                          }
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
