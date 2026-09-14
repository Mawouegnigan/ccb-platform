import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'features/auth/login_screen.dart';
import 'features/fiche/fiche_screen.dart';
import 'theme/app_theme.dart';

class CcbApp extends StatelessWidget {
  const CcbApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CCB Platform',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      home: const _AuthGate(),
    );
  }
}

/// Redirige vers la fiche si une session existe déjà (y compris hors-ligne,
/// grâce à la persistance de session de supabase_flutter), sinon vers la
/// connexion.
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final session = Supabase.instance.client.auth.currentSession;
    return session != null ? const FicheScreen() : const LoginScreen();
  }
}
