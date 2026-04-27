import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'auth_storage.dart';
import 'env.dart';

// HTTP client wrapper：
//   - 自動帶 Bearer token
//   - 401 → 清掉 token（讓上層導回登入）
//   - 統一錯誤訊息
class ApiClient {
  ApiClient(this._storage)
    : _dio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 30),
          contentType: 'application/json',
          responseType: ResponseType.json,
          headers: {'Accept': 'application/json'},
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (e, handler) async {
          if (e.response?.statusCode == 401) {
            await _storage.clear();
          }
          if (kDebugMode) {
            debugPrint('[API ${e.response?.statusCode}] ${e.requestOptions.path}'
                ' → ${e.response?.data ?? e.message}');
          }
          handler.next(e);
        },
      ),
    );
  }

  final Dio _dio;
  final AuthStorage _storage;

  Dio get raw => _dio;

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? query}) =>
      _dio.get<T>(path, queryParameters: query);

  Future<Response<T>> post<T>(String path, {Object? body}) =>
      _dio.post<T>(path, data: body);

  Future<Response<T>> put<T>(String path, {Object? body}) =>
      _dio.put<T>(path, data: body);

  Future<Response<T>> delete<T>(String path) => _dio.delete<T>(path);
}

// 把 Dio 的 error 轉成可讀訊息
String describeApiError(Object e) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map && data['message'] is String) return data['message'] as String;
    if (data is Map && data['error'] is String) return data['error'] as String;
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return '連線逾時，檢查網路後再試一次';
    }
    if (e.type == DioExceptionType.connectionError) {
      return '無法連線到伺服器';
    }
    return e.message ?? '發生未知錯誤';
  }
  return e.toString();
}
