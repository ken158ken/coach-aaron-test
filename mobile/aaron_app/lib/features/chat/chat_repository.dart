import 'dart:io';

import 'package:dio/dio.dart';

import '../../core/api_client.dart';
import 'models.dart';

class ChatRepository {
  ChatRepository(this._api);
  final ApiClient _api;

  Future<List<ConversationSummary>> conversations() async {
    final res = await _api.get<dynamic>('/api/chat/conversations');
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => ConversationSummary.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<ConversationDetail> conversation(String id) async {
    final res =
        await _api.get<Map<String, dynamic>>('/api/chat/conversations/$id');
    return ConversationDetail.fromJson(res.data ?? const {});
  }

  Future<List<ChatMessage>> messages(
    String conversationId, {
    DateTime? before,
    int limit = 50,
  }) async {
    final res = await _api.get<dynamic>(
      '/api/chat/conversations/$conversationId/messages',
      query: {
        'limit': '$limit',
        if (before != null) 'before': before.toUtc().toIso8601String(),
      },
    );
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => ChatMessage.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<ChatMessage> sendMessage(
    String conversationId, {
    String? content,
    File? image,
  }) async {
    final form = FormData.fromMap({
      if (content != null && content.isNotEmpty) 'content': content,
      if (image != null)
        'image': await MultipartFile.fromFile(
          image.path,
          filename: image.path.split(RegExp(r'[\\/]')).last,
        ),
    });
    final res = await _api.post<Map<String, dynamic>>(
      '/api/chat/conversations/$conversationId/messages',
      body: form,
    );
    return ChatMessage.fromJson(res.data ?? const {});
  }

  Future<void> markRead(String conversationId) async {
    await _api.post<dynamic>('/api/chat/conversations/$conversationId/read');
  }

  Future<List<ChatUser>> admins() async {
    final res = await _api.get<dynamic>('/api/chat/admins');
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => ChatUser.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  Future<List<ChatUser>> searchUsers(String query) async {
    final res = await _api.get<dynamic>(
      '/api/chat/users/search',
      query: {if (query.isNotEmpty) 'q': query},
    );
    final data = res.data;
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => ChatUser.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  /// 建立或取得 1v1 DM；後端會處理重複問題
  Future<ConversationSummary> createOrGetDm(int partnerId) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/api/chat/conversations',
      body: {'partnerId': partnerId},
    );
    final raw = res.data ?? const {};
    // 為了 list shape 一致，補上空 participants 和 unread_count
    return ConversationSummary.fromJson({
      ...raw,
      'participants': <Map<String, dynamic>>[],
      'unread_count': 0,
    });
  }
}
