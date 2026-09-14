import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/connectivity_service.dart';
import '../../data/repository/membre_repository.dart';
import '../../theme/app_theme.dart';

/// Bandeau affiché en haut des écrans principaux : indique le mode
/// hors-ligne et déclenche la synchronisation automatique dès que le
/// réseau revient (cahier des charges §3.8).
class SyncBanner extends StatefulWidget {
  const SyncBanner({super.key});

  @override
  State<SyncBanner> createState() => _SyncBannerState();
}

class _SyncBannerState extends State<SyncBanner> {
  final _connectivity = ConnectivityService();
  final _repository = MembreRepository();
  StreamSubscription<bool>? _subscription;

  bool _isOnline = true;
  int _enAttente = 0;

  @override
  void initState() {
    super.initState();
    _refreshEtat();
    _subscription = _connectivity.onConnectivityChanged.listen((online) async {
      setState(() => _isOnline = online);
      if (online) {
        await _repository.synchroniserModificationsEnAttente();
        await _refreshEtat();
      }
    });
  }

  Future<void> _refreshEtat() async {
    final online = await _connectivity.isOnline;
    final enAttente = await _repository.nombreModificationsEnAttente();
    if (!mounted) return;
    setState(() {
      _isOnline = online;
      _enAttente = enAttente;
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isOnline && _enAttente == 0) return const SizedBox.shrink();

    final message = !_isOnline
        ? 'Mode hors-ligne — vos modifications seront envoyées à la reconnexion.'
        : 'Synchronisation en cours ($_enAttente modification(s) en attente)…';

    return Container(
      width: double.infinity,
      color: _isOnline ? AppColors.gold.withOpacity(0.15) : AppColors.navy.withOpacity(0.08),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Icon(
            _isOnline ? Icons.sync : Icons.cloud_off,
            size: 16,
            color: AppColors.navy,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(fontSize: 12, color: AppColors.ink),
            ),
          ),
        ],
      ),
    );
  }
}
