// 對齊後端 routes/chat.ts 回傳的物件結構

class ChatUser {
  final int userId;
  final String? username; // 後端用 PostgREST alias 'name:username'，欄位叫 name
  final String? displayName;
  final String? email;
  final String? avatarUrl;
  final String? adminDisplayName;
  final String? adminNote;

  const ChatUser({
    required this.userId,
    this.username,
    this.displayName,
    this.email,
    this.avatarUrl,
    this.adminDisplayName,
    this.adminNote,
  });

  factory ChatUser.fromJson(Map<String, dynamic> json) => ChatUser(
    userId: (json['user_id'] as num?)?.toInt() ?? 0,
    username: json['name'] as String? ?? json['username'] as String?,
    displayName: json['display_name'] as String?,
    email: json['email'] as String?,
    avatarUrl: json['avatar_url'] as String?,
    adminDisplayName: json['admin_display_name'] as String?,
    adminNote: json['admin_note'] as String?,
  );

  /// 顯示給對方看的名稱：admin 顯示名稱 → display_name → username → email → '?'
  String get bestName {
    if (adminDisplayName?.isNotEmpty == true) return adminDisplayName!;
    if (displayName?.isNotEmpty == true) return displayName!;
    if (username?.isNotEmpty == true) return username!;
    if (email?.isNotEmpty == true) return email!;
    return '?';
  }
}

class LastMessagePreview {
  final int id;
  final String? content;
  final bool hasImage;
  final int senderId;
  final DateTime createdAt;
  final String messageType; // 'user' | 'system'

  const LastMessagePreview({
    required this.id,
    this.content,
    required this.hasImage,
    required this.senderId,
    required this.createdAt,
    required this.messageType,
  });

  factory LastMessagePreview.fromJson(Map<String, dynamic> json) =>
      LastMessagePreview(
        id: (json['id'] as num?)?.toInt() ?? 0,
        content: json['content'] as String?,
        hasImage: json['has_image'] as bool? ?? false,
        senderId: (json['sender_id'] as num?)?.toInt() ?? 0,
        createdAt: DateTime.parse(json['created_at'] as String),
        messageType: json['message_type'] as String? ?? 'user',
      );
}

class ConversationSummary {
  final String id;
  final String type; // 'dm' | 'group'
  final String? title;
  final int? createdBy;
  final DateTime? lastMessageAt;
  final DateTime createdAt;
  final List<ChatUser> participants;
  final LastMessagePreview? lastMessage;
  final int unreadCount;
  final DateTime? myLeftAt;

  const ConversationSummary({
    required this.id,
    required this.type,
    this.title,
    this.createdBy,
    this.lastMessageAt,
    required this.createdAt,
    required this.participants,
    this.lastMessage,
    required this.unreadCount,
    this.myLeftAt,
  });

  factory ConversationSummary.fromJson(Map<String, dynamic> json) {
    final parts = (json['participants'] as List?) ?? const [];
    final lm = json['last_message'];
    return ConversationSummary(
      id: '${json['id']}',
      type: json['type'] as String? ?? 'dm',
      title: json['title'] as String?,
      createdBy: (json['created_by'] as num?)?.toInt(),
      lastMessageAt: _maybeDate(json['last_message_at']),
      createdAt: DateTime.parse(json['created_at'] as String),
      participants: parts
          .whereType<Map>()
          .map((e) => ChatUser.fromJson(e.cast<String, dynamic>()))
          .toList(),
      lastMessage: lm is Map<String, dynamic>
          ? LastMessagePreview.fromJson(lm)
          : null,
      unreadCount: (json['unread_count'] as num?)?.toInt() ?? 0,
      myLeftAt: _maybeDate(json['my_left_at']),
    );
  }

  /// 顯示給目前用戶看的標題：
  /// - DM：另一個人的名字
  /// - Group：對話 title
  String displayTitle(int currentUserId) {
    if (type == 'group') return title ?? '群組';
    final other = participants.firstWhere(
      (p) => p.userId != currentUserId,
      orElse: () => participants.isNotEmpty
          ? participants.first
          : const ChatUser(userId: 0),
    );
    return other.bestName;
  }

  /// DM 的對方頭貼，group 不適用（回 null）
  String? dmAvatarFor(int currentUserId) {
    if (type != 'dm') return null;
    final other = participants.firstWhere(
      (p) => p.userId != currentUserId,
      orElse: () => participants.isNotEmpty
          ? participants.first
          : const ChatUser(userId: 0),
    );
    return other.avatarUrl;
  }
}

class ChatMessage {
  final int id;
  final String conversationId;
  final int senderId;
  final String? content;
  final String? imageUrl;
  final String messageType; // 'user' | 'system'
  final DateTime? expiresAt;
  final DateTime createdAt;

  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.content,
    this.imageUrl,
    required this.messageType,
    this.expiresAt,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
    id: (json['id'] as num?)?.toInt() ?? 0,
    conversationId: '${json['conversation_id']}',
    senderId: (json['sender_id'] as num?)?.toInt() ?? 0,
    content: json['content'] as String?,
    imageUrl: json['image_url'] as String?,
    messageType: json['message_type'] as String? ?? 'user',
    expiresAt: _maybeDate(json['expires_at']),
    createdAt: DateTime.parse(json['created_at'] as String),
  );
}

class ConversationDetail {
  final String id;
  final String type;
  final String? title;
  final int? createdBy;
  final DateTime? lastMessageAt;
  final DateTime createdAt;
  final DateTime? myLeftAt;
  final List<ParticipantInfo> participants;

  const ConversationDetail({
    required this.id,
    required this.type,
    this.title,
    this.createdBy,
    this.lastMessageAt,
    required this.createdAt,
    this.myLeftAt,
    required this.participants,
  });

  factory ConversationDetail.fromJson(Map<String, dynamic> json) {
    final parts = (json['participants'] as List?) ?? const [];
    return ConversationDetail(
      id: '${json['id']}',
      type: json['type'] as String? ?? 'dm',
      title: json['title'] as String?,
      createdBy: (json['created_by'] as num?)?.toInt(),
      lastMessageAt: _maybeDate(json['last_message_at']),
      createdAt: DateTime.parse(json['created_at'] as String),
      myLeftAt: _maybeDate(json['my_left_at']),
      participants: parts
          .whereType<Map>()
          .map((e) => ParticipantInfo.fromJson(e.cast<String, dynamic>()))
          .toList(),
    );
  }
}

class ParticipantInfo {
  final int userId;
  final String role; // 'admin' | 'member'
  final DateTime? joinedAt;
  final ChatUser user;

  const ParticipantInfo({
    required this.userId,
    required this.role,
    this.joinedAt,
    required this.user,
  });

  factory ParticipantInfo.fromJson(Map<String, dynamic> json) {
    final u = json['user'];
    final user = u is Map<String, dynamic>
        ? ChatUser.fromJson(u)
        : const ChatUser(userId: 0);
    return ParticipantInfo(
      userId: (json['user_id'] as num?)?.toInt() ?? 0,
      role: json['role'] as String? ?? 'member',
      joinedAt: _maybeDate(json['joined_at']),
      user: user,
    );
  }
}

DateTime? _maybeDate(Object? raw) {
  if (raw is String) return DateTime.tryParse(raw);
  return null;
}
