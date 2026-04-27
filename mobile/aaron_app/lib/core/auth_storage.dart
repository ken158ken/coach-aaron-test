import 'package:shared_preferences/shared_preferences.dart';

// JWT token 落地存放，App 重開能直接讀回來
class AuthStorage {
  static const _kTokenKey = 'auth_token';

  Future<String?> read() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kTokenKey);
  }

  Future<void> write(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kTokenKey, token);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kTokenKey);
  }
}
