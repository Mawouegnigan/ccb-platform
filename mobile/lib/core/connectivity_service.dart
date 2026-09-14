import 'package:connectivity_plus/connectivity_plus.dart';

/// Expose l'état de connexion réseau sous forme de flux, utilisé pour
/// déclencher la synchronisation automatique dès que le réseau revient
/// (cahier des charges §3.8 — fonctionnement hors connexion).
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();

  Stream<bool> get onConnectivityChanged => _connectivity.onConnectivityChanged
      .map((results) => results.any((r) => r != ConnectivityResult.none));

  Future<bool> get isOnline async {
    final results = await _connectivity.checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }
}
