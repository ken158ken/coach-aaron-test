import '../../core/api_client.dart';
import '../../core/auth_storage.dart';
import 'models.dart';

class AuthRepository {
  AuthRepository(this._api, this._storage);

  final ApiClient _api;
  final AuthStorage _storage;

  Future<AuthResponse> login(String email, String password) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/api/auth/login',
      body: {'email': email, 'password': password},
    );
    final auth = AuthResponse.fromJson(res.data ?? const {});
    if (auth.token != null && auth.token!.isNotEmpty) {
      await _storage.write(auth.token!);
    }
    return auth;
  }

  Future<AuthResponse?> me() async {
    try {
      final res = await _api.get<Map<String, dynamic>>('/api/auth/me');
      return AuthResponse.fromJson(res.data ?? const {});
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post<void>('/api/auth/logout');
    } catch (_) {
      // 後端清不到也沒差，本地一定要清
    }
    await _storage.clear();
  }
}
