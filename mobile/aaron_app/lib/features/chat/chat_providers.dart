import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'chat_repository.dart';
import 'models.dart';
import 'realtime.dart';

final chatRepoProvider = Provider<ChatRepository>(
  (ref) => ChatRepository(ref.watch(apiClientProvider)),
);

final conversationsProvider = FutureProvider<List<ConversationSummary>>(
  (ref) => ref.watch(chatRepoProvider).conversations(),
);

final conversationDetailProvider =
    FutureProvider.family<ConversationDetail, String>(
  (ref, id) => ref.watch(chatRepoProvider).conversation(id),
);

final adminsProvider = FutureProvider<List<ChatUser>>(
  (ref) => ref.watch(chatRepoProvider).admins(),
);

/// 對話 thread 訊息：第一次 fetch + realtime 增量
final messagesProvider =
    AsyncNotifierProvider.family<MessagesNotifier, List<ChatMessage>, String>(
  MessagesNotifier.new,
);

class MessagesNotifier
    extends FamilyAsyncNotifier<List<ChatMessage>, String> {
  void Function()? _unsubscribe;

  @override
  Future<List<ChatMessage>> build(String conversationId) async {
    final list = await ref.read(chatRepoProvider).messages(conversationId);

    // 訂閱該 conversation 的 realtime
    _unsubscribe = subscribeConversation(
      conversationId,
      onNewMessage: (msg) {
        final current = state.value ?? const <ChatMessage>[];
        // 已存在就跳過（避免送出後 realtime 又補一份）
        if (current.any((m) => m.id == msg.id)) return;
        state = AsyncData([...current, msg]);
      },
    );
    ref.onDispose(() {
      _unsubscribe?.call();
    });

    return list;
  }

  /// 用戶送訊息時的樂觀更新
  void appendLocal(ChatMessage msg) {
    final current = state.value ?? const <ChatMessage>[];
    if (current.any((m) => m.id == msg.id)) return;
    state = AsyncData([...current, msg]);
  }

  Future<void> refresh() async {
    final id = arg;
    final list = await ref.read(chatRepoProvider).messages(id);
    state = AsyncData(list);
  }
}
