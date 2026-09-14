import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Palette et typographie alignées sur le dashboard web (voir web/tailwind.config.ts)
/// pour une identité visuelle cohérente entre les deux plateformes.
class AppColors {
  static const navy = Color(0xFF1B2A4A);
  static const navyLight = Color(0xFF284070);
  static const gold = Color(0xFFB8892B);
  static const goldLight = Color(0xFFD4AD5C);
  static const parchment = Color(0xFFFAF7F0);
  static const ink = Color(0xFF22262F);
  static const line = Color(0xFFE4E0D4);
}

class AppTheme {
  static ThemeData light() {
    final textTheme = GoogleFonts.interTextTheme().copyWith(
      headlineSmall: GoogleFonts.sourceSerif4(
        fontWeight: FontWeight.w600,
        color: AppColors.navy,
        fontSize: 24,
      ),
      titleLarge: GoogleFonts.sourceSerif4(
        fontWeight: FontWeight.w600,
        color: AppColors.navy,
        fontSize: 20,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.parchment,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.navy,
        primary: AppColors.navy,
        secondary: AppColors.gold,
        surface: Colors.white,
      ),
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.navy,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }
}
