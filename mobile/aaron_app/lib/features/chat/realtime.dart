// Supabase Realtime 訂閱包裝
//
// 跟網頁版同套：每個對話用 channel `conv-{uuid}`，event = 'new_message'。
// Supabase 沒初始化（缺 anon key）時所有 subscribe 都回傳 no-op，畫面就 fallback
// 為純 polling（之後重抓 conversations 才會更新）。

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'models.dart';

bool get _supabaseReady {
  try {
    Supabase.instance;
    return true;
  } catch (_) {
    return false;
  }
}

typedef NewMessageHandler = void Function(ChatMessage msg);

/// 訂閱單一 conversation channel；回傳 unsubscribe function
void Function() subscribeConversation(
  String conversationId, {
  required NewMessageHandler onNewMessage,
}) {
  if (!_supabaseReady) {
    if (kDebugMode) {
      debugPrint('Supabase 未初始化，跳過 realtime 訂閱（fallback polling）');
    }
    return () {};
  }
  final client = Supabase.instance.client;
  final channel = client.channel('conv-$conversationId');
  channel.onBroadcast(
    event: 'new_message',
    callback: (payload) {
      try {
        final raw = payload['payload'];
        if (raw is! Map) return;
        final msg = ChatMessage.fromJson(raw.cast<String, dynamic>());
        onNewMessage(msg);
      } catch (e) {
        if (kDebugMode) debugPrint('Realtime parse 失敗: $e');
      }
    },
  );
  channel.subscribe();
  return () {
    try {
      client.removeChannel(channel);
    } catch (_) {}
  };
}
