// 對應後端 /api/notifications row（schema: id, type, title, body, link, icon_url, metadata, is_read, read_at, created_at）

class AppNotification {
  final int id;
  final String type;
  final String title;
  final String? body;
  final String? link;
  final String? iconUrl;
  final Map<String, dynamic>? metadata;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    this.body,
    this.link,
    this.iconUrl,
    this.metadata,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: (json['id'] as num?)?.toInt() ?? 0,
      type: json['type'] as String? ?? 'unknown',
      title: json['title'] as String? ?? '',
      body: json['body'] as String?,
      link: json['link'] as String?,
      iconUrl: json['icon_url'] as String?,
      metadata: (json['metadata'] as Map?)?.cast<String, dynamic>(),
      isRead: json['is_read'] as bool? ?? false,
      readAt: _date(json['read_at']),
      createdAt: _date(json['created_at']) ?? DateTime.now(),
    );
  }

  static DateTime? _date(Object? raw) {
    if (raw is String) return DateTime.tryParse(raw);
    return null;
  }
}

extension NotificationTypeIcon on AppNotification {
  String get emojiIcon {
    switch (type) {
      case 'chat_message':
        return '💬';
      case 'chat_added_to_group':
        return '👥';
      case 'chat_removed_from_group':
        return '🚪';
      case 'booking_pending':
        return '🔔';
      case 'booking_approved':
        return '✅';
      case 'booking_rejected':
        return '❌';
      case 'booking_cancelled':
        return '⚠️';
      default:
        return '🔔';
    }
  }
}
