/// Configuration Supabase — valeurs injectées au build via --dart-define
/// (voir README.md du dossier mobile). Ne jamais committer de vraies clés en dur.
class SupabaseConfig {
  static const String url = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'http://localhost:54321',
  );

  static const String anonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );
}
