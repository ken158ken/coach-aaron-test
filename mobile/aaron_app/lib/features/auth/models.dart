// 對齊後端 /api/auth/login 回應 + 用戶結構
class AppUser {
  final int id;
  final String username;
  final String email;
  final String? displayName;
  final String? avatar;
  final String? role;
  /// 從 AuthResponse 帶過來，AppUser.fromJson() 預設 false
  final bool isAdmin;

  const AppUser({
    required this.id,
    required this.username,
    required this.email,
    this.displayName,
    this.avatar,
    this.role,
    this.isAdmin = false,
  });

  AppUser copyWith({bool? isAdmin}) => AppUser(
    id: id,
    username: username,
    email: email,
    displayName: displayName,
    avatar: avatar,
    role: role,
    isAdmin: isAdmin ?? this.isAdmin,
  );

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as int? ?? json['user_id'] as int? ?? 0,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: json['display_name'] as String? ?? json['displayName'] as String?,
      avatar: json['avatar_url'] as String? ?? json['avatar'] as String?,
      role: json['role'] as String?,
    );
  }
}

class AuthResponse {
  final AppUser user;
  final bool isAdmin;
  final String? token;

  const AuthResponse({required this.user, required this.isAdmin, this.token});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      user: AppUser.fromJson(
        (json['user'] as Map?)?.cast<String, dynamic>() ?? const {},
      ),
      isAdmin: json['isAdmin'] as bool? ?? json['is_admin'] as bool? ?? false,
      token: json['token'] as String?,
    );
  }
}
