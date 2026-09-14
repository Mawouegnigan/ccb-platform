import 'dart:convert';

import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

/// Cache local + file d'attente de synchronisation (cahier des charges §3.8).
///
/// Portée volontairement réaliste : la création de compte (Supabase Auth)
/// exige une connexion réseau au moins une fois. Le mode hors-ligne couvre
/// donc la CONSULTATION de sa propre fiche déjà synchronisée, et la
/// MODIFICATION de cette fiche (mise en file d'attente, envoyée dès que
/// le réseau revient) — pas la création initiale du compte.
class LocalDb {
  LocalDb._();
  static final LocalDb instance = LocalDb._();
  Database? _db;

  Future<Database> get database async {
    _db ??= await _init();
    return _db!;
  }

  Future<Database> _init() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'ccb_platform.db');

    return openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE ma_fiche (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            nom TEXT NOT NULL,
            prenoms TEXT NOT NULL,
            statut TEXT NOT NULL,
            poste TEXT,
            contact TEXT NOT NULL,
            paroisse_id TEXT,
            sous_region_id TEXT NOT NULL,
            region_id TEXT,
            photo_url TEXT,
            role TEXT NOT NULL,
            statut_validation TEXT NOT NULL,
            date_inscription TEXT,
            charte_acceptee INTEGER NOT NULL DEFAULT 0,
            reglement_interieur_accepte INTEGER NOT NULL DEFAULT 0,
            derniere_synchro TEXT
          )
        ''');

        await db.execute('''
          CREATE TABLE modifications_en_attente (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            membre_id TEXT NOT NULL,
            champs_json TEXT NOT NULL,
            cree_le TEXT NOT NULL,
            tentatives INTEGER NOT NULL DEFAULT 0
          )
        ''');
      },
    );
  }

  // ---------------------------------------------------------------------
  // Cache de la fiche personnelle
  // ---------------------------------------------------------------------

  Future<void> saveMaFiche(Map<String, dynamic> fiche) async {
    final db = await database;
    await db.insert(
      'ma_fiche',
      {...fiche, 'derniere_synchro': DateTime.now().toIso8601String()},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<Map<String, dynamic>?> getMaFiche() async {
    final db = await database;
    final rows = await db.query('ma_fiche', limit: 1);
    return rows.isEmpty ? null : rows.first;
  }

  Future<void> clear() async {
    final db = await database;
    await db.delete('ma_fiche');
    await db.delete('modifications_en_attente');
  }

  // ---------------------------------------------------------------------
  // File d'attente de modifications (mode hors-ligne)
  // ---------------------------------------------------------------------

  Future<void> enqueueModification(String membreId, Map<String, dynamic> champs) async {
    final db = await database;
    await db.insert('modifications_en_attente', {
      'membre_id': membreId,
      'champs_json': jsonEncode(champs),
      'cree_le': DateTime.now().toIso8601String(),
      'tentatives': 0,
    });
  }

  Map<String, dynamic> decodeChamps(String champsJson) =>
      jsonDecode(champsJson) as Map<String, dynamic>;

  Future<List<Map<String, dynamic>>> getModificationsEnAttente() async {
    final db = await database;
    return db.query('modifications_en_attente', orderBy: 'cree_le ASC');
  }

  Future<void> removeModification(int id) async {
    final db = await database;
    await db.delete('modifications_en_attente', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> incrementTentative(int id) async {
    final db = await database;
    await db.rawUpdate(
      'UPDATE modifications_en_attente SET tentatives = tentatives + 1 WHERE id = ?',
      [id],
    );
  }
}
