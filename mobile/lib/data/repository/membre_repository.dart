import 'package:supabase_flutter/supabase_flutter.dart';

import '../local/local_db.dart';
import '../models/membre.dart';
import '../../core/connectivity_service.dart';

/// Point d'entrée unique pour lire/écrire une fiche membre, en tenant compte
/// du réseau : lecture depuis Supabase si en ligne (avec mise à jour du
/// cache), sinon depuis le cache local ; écriture directe si en ligne,
/// sinon mise en file d'attente pour synchronisation automatique.
class MembreRepository {
  MembreRepository({
    SupabaseClient? client,
    ConnectivityService? connectivity,
    LocalDb? localDb,
  })  : _client = client ?? Supabase.instance.client,
        _connectivity = connectivity ?? ConnectivityService(),
        _localDb = localDb ?? LocalDb.instance;

  final SupabaseClient _client;
  final ConnectivityService _connectivity;
  final LocalDb _localDb;

  /// Récupère la fiche du membre connecté : en ligne si possible, avec
  /// rafraîchissement du cache ; en secours, la dernière version connue.
  Future<Membre?> getMaFiche() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;

    final online = await _connectivity.isOnline;

    if (online) {
      try {
        final data = await _client
            .from('membres')
            .select()
            .eq('user_id', userId)
            .maybeSingle();

        if (data != null) {
          await _localDb.saveMaFiche(Membre.fromJson(data).toLocalMap());
          return Membre.fromJson(data);
        }
      } catch (_) {
        // Réseau instable malgré la détection positive : on retombe sur le cache.
      }
    }

    final cached = await _localDb.getMaFiche();
    return cached == null ? null : Membre.fromLocalMap(cached);
  }

  /// Met à jour la fiche du membre connecté. En ligne : écriture immédiate.
  /// Hors-ligne : mise en file d'attente + mise à jour optimiste du cache.
  Future<void> updateMaFiche(String membreId, Map<String, dynamic> champs) async {
    final online = await _connectivity.isOnline;

    if (online) {
      await _client.from('membres').update(champs).eq('id', membreId);
      final refreshed =
          await _client.from('membres').select().eq('id', membreId).single();
      await _localDb.saveMaFiche(Membre.fromJson(refreshed).toLocalMap());
      return;
    }

    await _localDb.enqueueModification(membreId, champs);
    final cached = await _localDb.getMaFiche();
    if (cached != null) {
      await _localDb.saveMaFiche({...cached, ...champs});
    }
  }

  /// Rejoue la file d'attente dès que le réseau est disponible.
  /// À appeler au démarrage de l'app et sur chaque retour de connexion
  /// (voir SyncBanner / ConnectivityService.onConnectivityChanged).
  Future<int> synchroniserModificationsEnAttente() async {
    final online = await _connectivity.isOnline;
    if (!online) return 0;

    final enAttente = await _localDb.getModificationsEnAttente();
    var reussies = 0;

    for (final modif in enAttente) {
      try {
        final champs = _localDb.decodeChamps(modif['champs_json'] as String);
        await _client
            .from('membres')
            .update(champs)
            .eq('id', modif['membre_id'] as String);
        await _localDb.removeModification(modif['id'] as int);
        reussies++;
      } catch (_) {
        await _localDb.incrementTentative(modif['id'] as int);
      }
    }

    return reussies;
  }

  Future<int> nombreModificationsEnAttente() async {
    final enAttente = await _localDb.getModificationsEnAttente();
    return enAttente.length;
  }
}
