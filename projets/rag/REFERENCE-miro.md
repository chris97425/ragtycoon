# Référence — Board Miro « RAG High-level » (socle technique)

Source : https://miro.com/app/board/uXjVHvW3bbo=/ — board en cours d'édition, utilisé comme matière première du Chapitre 2 « Socle technique — Ingestion & monitoring ».

## Frame 1 — DATA FLOW (l'ingestion)

**Sources de documents** (entrée du flux) :
- Source + hash (empreinte du fichier à la réception)
- Database (bases SQL)
- Scraping/API (collecte automatique)
- SFTP (dépôt de fichiers)

**Étapes du flux (avec les pastilles numérotées du board)** :

1. **Parsing** — « Le PDF devient du texte, le scan passe par de l'OCR (reconnaissance de caractères), le tableur devient des lignes, le wiki devient du texte simple. Les titres, sections et pages sont conservés : ils serviront au découpage et au repérage des citations. » → objectif : **uniformiser l'output**.
2. **Cleaning** — « Les en-têtes et pieds de page se répètent à chaque page, les numéros de page polluent, l'OCR laisse des coquilles, les tableaux cassent en colonnes incohérentes. Le nettoyeur supprime ce bruit et normalise : encodage UTF-8, espaces réguliers, langue détectée. »
3. **Enrichisseur** — « document d'origine, date, auteur, titre, chemin de section, type. Le titre de la section peut être préfixé au chunk pour lui donner son contexte. C'est ce qui permettra de filtrer, de citer et d'auditer. »
   - Entre les étapes : **Orchestration** (le board la mentionne comme brique transversale).
4. **Dédoublonner** — « Le même document existe souvent en double : importé deux fois, exporté sous deux noms, version brouillon et version finale. Le dédoublonneur repère les copies et quasi-copies par empreinte du contenu, et attribue à chaque chunk un identifiant stable. »
5. **Data Chunking** — passage au **Common Format (md)** ; note du board : « Chunking Size / Chunking Strategy à définir » (le réglage à faire).
6. **Data Embedding** — « Embedding Chunks into Vectors ».
7. **Data Storage** — « Store in Vector DB(s) » avec les tags : **TAG: Sensitivity**, **Internal Data**, **User Access Levels**, **Public Data**, **RLS**, **TAG: Technicality**.

## Frame 2 — Authentification & Autorisation

- **Authentification & Authorization**, **ReBAC** (autorisation relationnelle, à la Zanzibar).
- **Retrieval** (rappel du reste du pipeline) : Question Utilisateur → User Query → Embedded User Query → Similarity Search in Vector DB → User Query + Top K Matching Vector Results → **Augmentation** (Trace back Top K Vectors to Chunk-level Data → User Query + Top K Chunked Data with Metadata → Augmented Prompt) → **Generation** (Generate the Final Formatted Response with Source Citations) → Answer to the User.

## Frame 3 — Sécuriser le flux

- **Pre-filter Authorization** (filtrer avant la recherche)
- **Post-Filter Method** (vérifier après la recherche)
- Sticky note rouge : « Authentification RLS etc in db — HOW to secure all the flow ».

## Tableau « Logs monitorés — Data Flow » (monitoring de l'ingestion)

Créé sur le board le 24/08/2026. 4 colonnes : Log | Étape | Événements loggés | Usage (Monitoring / Audit / Sécurité / Debug).

| # | Log | Étape | Événements loggés | Usage |
|---|---|---|---|---|
| 1 | `parsing.entree` | 1 · Parsing | Fichier reçu : source, hash (empreinte), taille, format, timestamp de réception | Monitoring, Audit |
| 2 | `parsing.resultat` | 1 · Parsing | Succès / échec par fichier, volume extrait (pages, lignes, cellules), durée, erreurs OCR | Monitoring, Debug |
| 3 | `cleaning.normalisation` | 2 · Cleaning | Bruit supprimé (en-têtes, pieds de page, numéros de page), normalisations appliquées (UTF-8, espaces), langue détectée | Monitoring |
| 4 | `cleaning.anomalies` | 2 · Cleaning | Coquilles OCR non résolues, tableaux cassés, encodages anormaux détectés | Debug |
| 5 | `enrichissement.metadonnees` | 3 · Enrichissement | Métadonnées ajoutées à chaque chunk : document d'origine, date, auteur, titre, chemin de section, type | Audit |
| 6 | `enrichissement.echecs` | 3 · Enrichissement | Mappings manquants, métadonnées incomplètes, sections non rattachées | Debug |
| 7 | `dedoublonnage.doublons` | 4 · Dédoublonnage | Doublons et quasi-copies détectés (empreinte du contenu), décision fusion / écart, identifiant stable attribué | Audit |
| 8 | `chunking.generation` | 5 · Chunking | Nombre de chunks créés, taille min / max / moyenne, stratégie appliquée, contexte de section préfixé | Monitoring |
| 9 | `chunking.qualite` | 5 · Chunking | Chunks hors norme (trop courts / trop longs), découpes anormales signalées | Debug |
| 10 | `embedding.generation` | 6 · Embedding | Nombre de vecteurs générés, modèle utilisé, dimensions, latence, échecs, volume | Monitoring |
| 11 | `stockage.ecriture` | 7 · Stockage | Écritures en base vectorielle : volume indexé, mises à jour, erreurs d'écriture | Monitoring |
| 12 | `stockage.acces` | 7 · Stockage | Accès aux données : utilisateur, ressource, autorisation (RLS / ReBAC), tentatives non autorisées (comptage par tenant, alertes de seuil) | Sécurité, Audit |
| 13 | `global.performance` | 8 · Global | TTFT moyen par requête, requêtes / minute, tokens consommés, modèle le plus exploité | Monitoring |
| 14 | `global.pipeline` | 8 · Global | Exécutions du pipeline : début / fin, durée totale, taux de succès, reprises | Monitoring |
