// Admin 後台用的 models（與後端 /api/admin/* 對齊）

class AdminStats {
  final int userCount;
  final int courseCount;
  final int orderCount;
  final num monthlyRevenue;

  const AdminStats({
    required this.userCount,
    required this.courseCount,
    required this.orderCount,
    required this.monthlyRevenue,
  });

  factory AdminStats.fromJson(Map<String, dynamic> json) => AdminStats(
    userCount: (json['userCount'] as num?)?.toInt() ?? 0,
    courseCount: (json['courseCount'] as num?)?.toInt() ?? 0,
    orderCount: (json['orderCount'] as num?)?.toInt() ?? 0,
    monthlyRevenue: (json['monthlyRevenue'] as num?) ?? 0,
  );
}

class AdminUser {
  final int id;
  final String username;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final String? phoneNumber;
  final bool? sex;
  final bool isActive;
  final bool emailVerified;
  final DateTime? lastLoginAt;
  final DateTime? createdAt;
  final bool isAdmin;

  const AdminUser({
    required this.id,
    required this.username,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.phoneNumber,
    this.sex,
    required this.isActive,
    required this.emailVerified,
    this.lastLoginAt,
    this.createdAt,
    required this.isAdmin,
  });

  factory AdminUser.fromJson(Map<String, dynamic> json) => AdminUser(
    id: (json['user_id'] as num?)?.toInt() ?? 0,
    username: json['username'] as String? ?? '',
    email: json['email'] as String? ?? '',
    displayName: json['display_name'] as String?,
    avatarUrl: json['avatar_url'] as String?,
    phoneNumber: json['phone_number'] as String?,
    sex: json['sex'] as bool?,
    isActive: json['is_active'] as bool? ?? true,
    emailVerified: json['email_verified'] as bool? ?? false,
    lastLoginAt: _date(json['last_login_at']),
    createdAt: _date(json['created_at']),
    isAdmin: json['isAdmin'] as bool? ?? false,
  );

  static DateTime? _date(Object? raw) {
    if (raw is String) return DateTime.tryParse(raw);
    return null;
  }
}

class WhitelistEntry {
  final int id;
  final String? email;
  final String? phoneNumber;
  final String? note;
  final String? displayName;
  final bool isActive;
  final DateTime? createdAt;

  const WhitelistEntry({
    required this.id,
    this.email,
    this.phoneNumber,
    this.note,
    this.displayName,
    required this.isActive,
    this.createdAt,
  });

  factory WhitelistEntry.fromJson(Map<String, dynamic> json) => WhitelistEntry(
    id: (json['whitelist_id'] as num?)?.toInt() ?? 0,
    email: json['email'] as String?,
    phoneNumber: json['phone_number'] as String?,
    note: json['note'] as String?,
    displayName: json['display_name'] as String?,
    isActive: json['is_active'] as bool? ?? true,
    createdAt: AdminUser._date(json['created_at']),
  );
}
