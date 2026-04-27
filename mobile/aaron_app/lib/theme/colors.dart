import 'package:flutter/material.dart';

// 對齊 frontend/src/index.css 的 @theme block
class AppColors {
  AppColors._();

  // 暗色（預設）
  static const studioBg = Color(0xFF0A0A0A);
  static const surface = Color(0xFF141414);
  static const surface2 = Color(0xFF1E1E1E);
  static const textMain = Color(0xFFF0F0F0);
  static const textMuted = Color(0xFF888888);

  // 金色（品牌色）
  static const gold = Color(0xFFC5A059);
  static const goldDim = Color(0xFF8A6030);

  // 淺色模式
  static const lightBg = Color(0xFFF8F6F1);
  static const lightSurface = Color(0xFFF5F3EF);
  static const lightSurface2 = Color(0xFFECE9E4);
  static const lightText = Color(0xFF24201E);
  static const lightMuted = Color(0x9424201E); // 約 0.58 透明

  // 狀態色
  static const success = Color(0xFF34D399);
  static const warning = Color(0xFFFBBF24);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF60A5FA);
}
