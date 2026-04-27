import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    final textTheme = GoogleFonts.notoSansTcTextTheme(base.textTheme).apply(
      bodyColor: AppColors.textMain,
      displayColor: AppColors.textMain,
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.studioBg,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.gold,
        onPrimary: AppColors.studioBg,
        secondary: AppColors.goldDim,
        surface: AppColors.surface,
        onSurface: AppColors.textMain,
        error: AppColors.error,
      ),
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.studioBg,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: AppColors.textMain),
      ),
      cardTheme: const CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: Color(0x33C5A059), width: 0.5),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface2,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        hintStyle: const TextStyle(color: AppColors.textMuted),
        border: _outline(const Color(0x33C5A059)),
        enabledBorder: _outline(const Color(0x22C5A059)),
        focusedBorder: _outline(AppColors.gold),
        errorBorder: _outline(AppColors.error),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.gold,
          foregroundColor: AppColors.studioBg,
          textStyle: const TextStyle(
            letterSpacing: 1.2,
            fontWeight: FontWeight.w500,
          ),
          minimumSize: const Size.fromHeight(48),
          shape: const StadiumBorder(),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.gold,
          side: const BorderSide(color: AppColors.gold),
          minimumSize: const Size.fromHeight(48),
          shape: const StadiumBorder(),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: AppColors.gold),
      ),
      dividerColor: const Color(0x22C5A059),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.gold,
      ),
    );
  }

  static OutlineInputBorder _outline(Color color) => OutlineInputBorder(
    borderRadius: const BorderRadius.all(Radius.circular(10)),
    borderSide: BorderSide(color: color),
  );
}
