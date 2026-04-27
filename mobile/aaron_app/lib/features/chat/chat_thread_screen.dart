import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../theme/colors.dart';
import '../auth/auth_providers.dart';
import '../notifications/notifications_providers.dart';
import 'chat_providers.dart';
import 'models.dart';

class ChatThreadScreen extends ConsumerStatefulWidget {
  const ChatThreadScreen({super.key, required this.conversationId});
  final String conversationId;

  @override
  ConsumerState<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends ConsumerState<ChatThreadScreen> {
  final _scrollCtl = ScrollController();
  final _inputCtl = TextEditingController();
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // 進入時標記已讀（後端會更新 last_read_at）
    Future.microtask(() async {
      try {
        await ref
            .read(chatRepoProvider)
            .markRead(widget.conversationId);
        ref.invalidate(conversationsProvider);
        ref.read(unreadCountProvider.notifier).refresh();
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _scrollCtl.dispose();
    _inputCtl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (!_scrollCtl.hasClients) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtl.hasClients) {
        _scrollCtl.animateTo(
          _scrollCtl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send({File? image}) async {
    final text = _inputCtl.text.trim();
    if (text.isEmpty && image == null) return;
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      final msg = await ref.read(chatRepoProvider).sendMessage(
            widget.conversationId,
            content: text.isEmpty ? null : text,
            image: image,
          );
      _inputCtl.clear();
      ref
          .read(messagesProvider(widget.conversationId).notifier)
          .appendLocal(msg);
      _scrollToBottom();
    } catch (e) {
      if (mounted) setState(() => _error = describeApiError(e));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _pickAndSendImage() async {
    final picker = ImagePicker();
    final f = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1600,
    );
    if (f == null) return;
    await _send(image: File(f.path));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).value;
    final myId = user?.id ?? 0;
    final detailAsync =
        ref.watch(conversationDetailProvider(widget.conversationId));
    final messagesAsync =
        ref.watch(messagesProvider(widget.conversationId));

    // 收到 realtime 新訊息時自動捲到最底
    ref.listen(messagesProvider(widget.conversationId), (prev, next) {
      final p = prev?.value?.length ?? 0;
      final n = next.value?.length ?? 0;
      if (n > p) _scrollToBottom();
    });

    final detail = detailAsync.value;
    final isLeft = detail?.myLeftAt != null;
    final title = _resolveTitle(detail, myId);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (detail?.type == 'group')
              Text(
                '${detail?.participants.length ?? 0} 位成員',
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                ),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('$e', textAlign: TextAlign.center),
                ),
              ),
              data: (messages) => _buildMessageList(messages, myId, detail),
            ),
          ),
          if (_error != null)
            Container(
              width: double.infinity,
              color: AppColors.error.withValues(alpha: 0.15),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Text(
                _error!,
                style: const TextStyle(color: AppColors.error, fontSize: 12),
              ),
            ),
          if (isLeft)
            Container(
              padding: const EdgeInsets.all(16),
              color: AppColors.surface2,
              child: const Text(
                '你已離開此群組，無法繼續發送訊息',
                style: TextStyle(color: AppColors.textMuted),
                textAlign: TextAlign.center,
              ),
            )
          else
            _Composer(
              controller: _inputCtl,
              busy: _sending,
              onSend: _send,
              onPickImage: _pickAndSendImage,
            ),
        ],
      ),
    );
  }

  String _resolveTitle(ConversationDetail? d, int myId) {
    if (d == null) return '對話';
    if (d.type == 'group') return d.title ?? '群組';
    final other = d.participants.firstWhere(
      (p) => p.userId != myId,
      orElse: () => d.participants.isNotEmpty
          ? d.participants.first
          : ParticipantInfo(
              userId: 0,
              role: 'member',
              user: const ChatUser(userId: 0),
            ),
    );
    return other.user.bestName;
  }

  Widget _buildMessageList(
    List<ChatMessage> messages,
    int myId,
    ConversationDetail? detail,
  ) {
    if (messages.isEmpty) {
      return const Center(
        child: Text(
          '說點什麼開始對話吧',
          style: TextStyle(color: AppColors.textMuted),
        ),
      );
    }
    final isGroup = detail?.type == 'group';
    final usersById = {
      for (final p in detail?.participants ?? const <ParticipantInfo>[])
        p.userId: p.user,
    };

    return ListView.builder(
      controller: _scrollCtl,
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
      itemCount: messages.length,
      itemBuilder: (_, i) {
        final m = messages[i];
        if (m.messageType == 'system') {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surface2,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  m.content ?? '',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                  ),
                ),
              ),
            ),
          );
        }
        final isMine = m.senderId == myId;
        final sender = usersById[m.senderId];
        final showSenderName = isGroup && !isMine;

        // 5 分鐘內同一人連續訊息壓縮頭像 / 名稱顯示
        final prev = i > 0 ? messages[i - 1] : null;
        final compact = prev != null &&
            prev.senderId == m.senderId &&
            prev.messageType != 'system' &&
            m.createdAt.difference(prev.createdAt).inMinutes < 5;

        return _MessageBubble(
          message: m,
          isMine: isMine,
          showSenderName: showSenderName && !compact,
          showAvatar: !isMine && !compact,
          senderName: sender?.bestName,
          senderAvatar: sender?.avatarUrl,
        );
      },
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.isMine,
    required this.showSenderName,
    required this.showAvatar,
    required this.senderName,
    required this.senderAvatar,
  });

  final ChatMessage message;
  final bool isMine;
  final bool showSenderName;
  final bool showAvatar;
  final String? senderName;
  final String? senderAvatar;

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('HH:mm').format(message.createdAt.toLocal());
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment:
            isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMine)
            SizedBox(
              width: 32,
              height: 32,
              child: showAvatar
                  ? CircleAvatar(
                      radius: 16,
                      backgroundColor: AppColors.surface2,
                      backgroundImage: senderAvatar != null
                          ? CachedNetworkImageProvider(senderAvatar!)
                          : null,
                      child: senderAvatar == null
                          ? const Icon(
                              Icons.person,
                              size: 14,
                              color: AppColors.textMuted,
                            )
                          : null,
                    )
                  : null,
            )
          else
            const SizedBox.shrink(),
          if (!isMine) const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: isMine
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                if (showSenderName && senderName != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 2),
                    child: Text(
                      senderName!,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ),
                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.7,
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isMine
                        ? AppColors.gold.withValues(alpha: 0.85)
                        : AppColors.surface2,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(14),
                      topRight: const Radius.circular(14),
                      bottomLeft: Radius.circular(isMine ? 14 : 4),
                      bottomRight: Radius.circular(isMine ? 4 : 14),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (message.imageUrl != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxHeight: 240),
                            child: CachedNetworkImage(
                              imageUrl: message.imageUrl!,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      if (message.content?.isNotEmpty == true) ...[
                        if (message.imageUrl != null) const SizedBox(height: 6),
                        Text(
                          message.content!,
                          style: TextStyle(
                            color: isMine
                                ? AppColors.studioBg
                                : AppColors.textMain,
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 2, left: 4, right: 4),
                  child: Text(
                    time,
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.busy,
    required this.onSend,
    required this.onPickImage,
  });

  final TextEditingController controller;
  final bool busy;
  final Future<void> Function({File? image}) onSend;
  final VoidCallback onPickImage;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: Color(0x22C5A059))),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            IconButton(
              icon: const Icon(Icons.image_outlined),
              color: AppColors.gold,
              onPressed: busy ? null : onPickImage,
            ),
            Expanded(
              child: TextField(
                controller: controller,
                maxLines: 4,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                style: const TextStyle(color: AppColors.textMain),
                decoration: const InputDecoration(
                  hintText: '輸入訊息…',
                  border: InputBorder.none,
                  filled: false,
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 4, vertical: 10),
                ),
              ),
            ),
            IconButton(
              icon: busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
              color: AppColors.gold,
              onPressed: busy ? null : () => onSend(),
            ),
          ],
        ),
      ),
    );
  }
}
