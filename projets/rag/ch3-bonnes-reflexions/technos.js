/* technos.js — Chapitre 3 : outillage et lectures par nœud.
   Format : tools { n, u, d }, refs { t, u, d }.
   URLs vérifiées le 26/08/2026. */
(function (global) {
  'use strict';

  var ARTICLE = 'https://www.lighthousenewsletter.com/p/rag-is-simpler-than-you-think';

  var TECHNOS = {
    depart: {
      tools: [
        { n: 'Ragas', u: 'https://docs.ragas.io/en/stable/', d: 'construire le jeu d’évaluation qui départage les recettes' },
        { n: 'ir-measures', u: 'https://github.com/terrierteam/ir_measures', d: 'calculer Recall@k, MRR et nDCG sur une baseline de retrieval' },
        { n: 'TruLens', u: 'https://www.trulens.org/getting_started/', d: 'instrumenter les expériences et relier retrieval, réponse et feedback' }
      ],
      refs: [
        { t: 'Lighthouse AI — « RAG Is Simpler Than You Think »', u: ARTICLE, d: 'les cinq facteurs, les six recettes et le chemin de décision du chapitre' },
        { t: 'Ragas — introduction', u: 'https://docs.ragas.io/en/stable/', d: 'passer des impressions à une boucle d’évaluation systématique' }
      ]
    },

    fraicheur: {
      tools: [
        { n: 'Debezium', u: 'https://debezium.io/documentation/reference/stable/', d: 'capturer les changements à la source et dater leur propagation' },
        { n: 'OpenTelemetry', u: 'https://opentelemetry.io/docs/', d: 'tracer source, ingestion, indexation et disponibilité à la recherche' },
        { n: 'Prometheus', u: 'https://prometheus.io/docs/practices/histograms/', d: 'mesurer la distribution du délai source-vers-index' }
      ],
      refs: [
        { t: 'Lighthouse AI — facteur « Data Freshness »', u: ARTICLE, d: 'temps réel, mises à jour périodiques et corpus stable' },
        { t: 'Debezium — documentation stable', u: 'https://debezium.io/documentation/reference/stable/', d: 'observer les changements au lieu de repoller tout le corpus' }
      ]
    },

    corpus: {
      tools: [
        { n: 'DuckDB', u: 'https://duckdb.org/docs/stable/guides/overview', d: 'profiler localement volumes, tailles, dates et distributions d’accès' },
        { n: 'datasketch', u: 'https://github.com/ekzhu/datasketch', d: 'détecter doublons et quasi-doublons par MinHash et LSH' },
        { n: 'OpenSearch aggregations', u: 'https://docs.opensearch.org/latest/aggregations/', d: 'calculer churn, longue traîne et concentration des consultations' }
      ],
      refs: [
        { t: 'Lighthouse AI — facteur « Corpus Characteristics »', u: ARTICLE, d: 'churn supérieur à 10 % et longue traîne à 90 %' },
        { t: 'OpenSearch — aggregations', u: 'https://docs.opensearch.org/latest/aggregations/', d: 'extraire les distributions qui pilotent la décision' }
      ]
    },

    requetes: {
      tools: [
        { n: 'OpenSearch Query Insights', u: 'https://docs.opensearch.org/latest/observing-your-data/query-insights/index/', d: 'observer formes, latences et groupes de requêtes réelles' },
        { n: 'OpenTelemetry', u: 'https://opentelemetry.io/docs/', d: 'conserver type de requête, stratégie choisie et résultat sans perdre la trace' },
        { n: 'ir-measures', u: 'https://github.com/terrierteam/ir_measures', d: 'comparer la qualité par segment : exact, conversationnel, mixte' }
      ],
      refs: [
        { t: 'Lighthouse AI — facteur « Query Patterns »', u: ARTICLE, d: 'mots-clés, sémantique et trafic mixte' },
        { t: 'OpenSearch — Query Insights', u: 'https://docs.opensearch.org/latest/observing-your-data/query-insights/index/', d: 'analyser les requêtes au lieu d’imaginer leurs patterns' }
      ]
    },

    echelle: {
      tools: [
        { n: 'Grafana k6', u: 'https://grafana.com/docs/k6/latest/', d: 'tester débit, concurrence, p95 et seuil de saturation' },
        { n: 'Locust', u: 'https://docs.locust.io/en/stable/', d: 'simuler des utilisateurs et des mélanges de requêtes en Python' },
        { n: 'Prometheus', u: 'https://prometheus.io/docs/practices/histograms/', d: 'suivre les distributions de latence plutôt qu’une moyenne' }
      ],
      refs: [
        { t: 'Lighthouse AI — facteur « Scale & Performance »', u: ARTICLE, d: 'repères sous 1K, entre 1K et 10K, puis au-delà de 10K requêtes par jour' },
        { t: 'Grafana k6 — documentation', u: 'https://grafana.com/docs/k6/latest/', d: 'transformer un volume théorique en benchmark reproductible' }
      ]
    },

    equipe: {
      tools: [
        { n: 'adr-tools', u: 'https://github.com/npryce/adr-tools', d: 'consigner propriétaire, compromis, preuve et plan de retour' },
        { n: 'MLflow Model Registry', u: 'https://www.mlflow.org/docs/latest/ml/model-registry/workflow/', d: 'évaluer si l’équipe sait réellement versionner et promouvoir des modèles' },
        { n: 'OpenTelemetry', u: 'https://opentelemetry.io/docs/', d: 'rendre chaque couche observable et donc exploitable par l’équipe' }
      ],
      refs: [
        { t: 'Lighthouse AI — facteur « Team Capabilities »', u: ARTICLE, d: 'faire correspondre l’architecture aux compétences disponibles' },
        { t: 'adr-tools — Architecture Decision Records', u: 'https://github.com/npryce/adr-tools', d: 'garder une décision technique compréhensible et réversible' }
      ]
    },

    bm25: {
      tools: [
        { n: 'rank_bm25', u: 'https://github.com/dorianbrown/rank_bm25', d: 'prototype Python minimal pour établir la baseline BM25' },
        { n: 'Elasticsearch', u: 'https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity', d: 'BM25 par défaut, analyseurs et explication des scores' },
        { n: 'PostgreSQL full-text', u: 'https://www.postgresql.org/docs/current/textsearch.html', d: 'recherche lexicale sans ajouter une base spécialisée' }
      ],
      refs: [
        { t: 'Lighthouse AI — recette 1, Full-Text Search', u: ARTICLE, d: 'pourquoi BM25 doit être la première baseline' },
        { t: 'Elasticsearch — BM25 similarity', u: 'https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity', d: 'paramètres k1, b et comportement du classement' }
      ]
    },

    rewriting: {
      tools: [
        { n: 'Haystack QueryExpander', u: 'https://docs.haystack.deepset.ai/docs/queryexpander', d: 'produire plusieurs reformulations structurées d’une question' },
        { n: 'LangGraph', u: 'https://github.com/langchain-ai/langgraph', d: 'borner une boucle rewrite → search → évaluation → repli' },
        { n: 'rank_bm25', u: 'https://github.com/dorianbrown/rank_bm25', d: 'conserver un retriever lexical simple derrière la reformulation' }
      ],
      refs: [
        { t: 'Lighthouse AI — recette 2, Agentic Query Rewriting', u: ARTICLE, d: 'glossaire, synonymes, décomposition et itération sans réindexation' },
        { t: 'HyDE — papier original', u: 'https://arxiv.org/abs/2212.10496', d: 'une transformation de requête dense à tester, pas à activer par défaut' }
      ]
    },

    hybride: {
      tools: [
        { n: 'OpenSearch hybrid search', u: 'https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/index/', d: 'pipeline sparse + dense avec normalisation et combinaison' },
        { n: 'Elasticsearch RRF', u: 'https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion', d: 'fusionner des rangs sans comparer directement leurs scores' },
        { n: 'sentence-transformers', u: 'https://www.sbert.net/', d: 'embarquer ou reranker localement un petit ensemble de candidats' }
      ],
      refs: [
        { t: 'Lighthouse AI — recette 3, Hybrid Search', u: ARTICLE, d: 'BM25 top 50–100 puis dense top 10' },
        { t: 'Elasticsearch — Reciprocal Rank Fusion', u: 'https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion', d: 'fusion de classements lexicaux et vectoriels' }
      ]
    },

    volee: {
      tools: [
        { n: 'FastEmbed', u: 'https://github.com/qdrant/fastembed', d: 'embeddings locaux légers et rapides sur CPU pour un petit K' },
        { n: 'sentence-transformers', u: 'https://www.sbert.net/', d: 'bi-encodeurs et cross-encodeurs locaux pour scoring à la demande' },
        { n: 'OpenTelemetry', u: 'https://opentelemetry.io/docs/', d: 'séparer latence BM25, embedding candidats et fusion' }
      ],
      refs: [
        { t: 'Lighthouse AI — recette 4, On-The-Fly Embedding', u: ARTICLE, d: 'fraîcheur parfaite contre 200–500 ms de latence' },
        { t: 'FastEmbed — dépôt officiel', u: 'https://github.com/qdrant/fastembed', d: 'réduire le coût CPU de l’embedding en ligne' }
      ]
    },

    'chaud-froid': {
      tools: [
        { n: 'pgvector', u: 'https://github.com/pgvector/pgvector', d: 'stocker le tier chaud dans PostgreSQL avec les compteurs métier' },
        { n: 'Qdrant', u: 'https://qdrant.tech/documentation/overview/', d: 'index vectoriel et filtres payload pour les documents chauds' },
        { n: 'Prometheus', u: 'https://prometheus.io/docs/practices/histograms/', d: 'mesurer hits chauds, hits froids et latence de promotion' }
      ],
      refs: [
        { t: 'Lighthouse AI — recette 5, Hot/Cold Tiers', u: ARTICLE, d: 'pré-calculer le fréquent et traiter la longue traîne à la volée' },
        { t: 'Qdrant — vue d’ensemble', u: 'https://qdrant.tech/documentation/overview/', d: 'collection, payload et index pour construire le tier chaud' }
      ]
    },

    preembedding: {
      tools: [
        { n: 'Milvus', u: 'https://milvus.io/docs/hnsw.md', d: 'index HNSW et paramètres de construction/recherche à grande échelle' },
        { n: 'Qdrant', u: 'https://qdrant.tech/documentation/concepts/indexing/', d: 'index vectoriel et payload, avec réglages de mémoire et de disque' },
        { n: 'pgvector', u: 'https://github.com/pgvector/pgvector', d: 'HNSW ou IVFFlat dans PostgreSQL quand l’échelle le permet' }
      ],
      refs: [
        { t: 'Lighthouse AI — recette 6, Full Pre-Embedding', u: ARTICLE, d: 'trafic élevé, corpus stable, ANN et coût de migration' },
        { t: 'Milvus — HNSW', u: 'https://milvus.io/docs/hnsw.md', d: 'comprendre le compromis rappel, mémoire, construction et latence' }
      ]
    },

    'regle-8020': {
      tools: [
        { n: 'Ragas', u: 'https://docs.ragas.io/en/stable/', d: 'vérifier qu’un palier simple atteint déjà le seuil qualité' },
        { n: 'ir-measures', u: 'https://github.com/terrierteam/ir_measures', d: 'comparer les recettes sur les mêmes qrels' },
        { n: 'adr-tools', u: 'https://github.com/npryce/adr-tools', d: 'écrire la condition d’arrêt et le coût accepté' }
      ],
      refs: [
        { t: 'Lighthouse AI — règle 80/20', u: ARTICLE, d: '60 % simple, 25 % hybride, 10 % pré-embedding, 5 % sur mesure' },
        { t: 'Ragas — expérimentation', u: 'https://docs.ragas.io/en/stable/', d: 'remplacer la mode par une boucle de preuve' }
      ]
    },

    'multi-intent': {
      tools: [
        { n: 'LangGraph', u: 'https://github.com/langchain-ai/langgraph', d: 'décomposer, exécuter en parallèle, agréger et borner les branches' },
        { n: 'Haystack QueryExpander', u: 'https://docs.haystack.deepset.ai/docs/queryexpander', d: 'générer plusieurs sous-requêtes structurées' },
        { n: 'LlamaIndex RouterRetriever', u: 'https://docs.llamaindex.ai/en/stable/api_reference/retrievers/router/', d: 'router une sous-question vers un ou plusieurs retrievers' }
      ],
      refs: [
        { t: 'Lighthouse AI — « The Multi-Intent Query Problem »', u: ARTICLE, d: 'décomposition, traitement adaptatif parallèle et synthèse' },
        { t: 'LlamaIndex — RouterRetriever', u: 'https://docs.llamaindex.ai/en/stable/api_reference/retrievers/router/', d: 'sélectionner le retriever adapté à chaque branche' }
      ]
    },

    depreciation: {
      tools: [
        { n: 'MLflow Model Registry', u: 'https://www.mlflow.org/docs/latest/ml/model-registry/workflow/', d: 'versionner modèle, expériences, statuts et promotion' },
        { n: 'Qdrant collection aliases', u: 'https://qdrant.tech/documentation/manage-data/collections/', d: 'basculer atomiquement entre ancien et nouvel index' },
        { n: 'BEIR', u: 'https://github.com/beir-cellar/beir', d: 'détecter les régressions de retrieval lors d’un changement de modèle' }
      ],
      refs: [
        { t: 'Lighthouse AI — risque de dépréciation', u: ARTICLE, d: 'pourquoi le pré-embedding transforme un changement en migration' },
        { t: 'Qdrant — Collection Aliases', u: 'https://qdrant.tech/documentation/manage-data/collections/', d: 'double index, bascule atomique et retour arrière' }
      ]
    },

    chunking: {
      tools: [
        { n: 'LangChain text splitters', u: 'https://docs.langchain.com/oss/python/integrations/splitters/index', d: 'baseline récursive et découpes par structure' },
        { n: 'Chonkie', u: 'https://github.com/chonkie-inc/chonkie', d: 'comparer rapidement chunking fixe, récursif, sémantique et tardif' },
        { n: 'LlamaIndex Node Parsers', u: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/', d: 'conserver relations, métadonnées et structure des nœuds' }
      ],
      refs: [
        { t: 'Lighthouse AI — « The chunking problem returns »', u: ARTICLE, d: 'les décisions qui réapparaissent dès le premier embedding' },
        { t: 'LangChain — Text splitters', u: 'https://docs.langchain.com/oss/python/integrations/splitters/index', d: 'taille, longueur et structure documentaire' }
      ]
    },

    latence: {
      tools: [
        { n: 'OpenTelemetry', u: 'https://opentelemetry.io/docs/', d: 'un span par réécriture, retrieval, embedding, reranking et génération' },
        { n: 'Prometheus', u: 'https://prometheus.io/docs/practices/histograms/', d: 'calculer p50, p95 et p99 par étape' },
        { n: 'Grafana', u: 'https://grafana.com/oss/grafana/', d: 'visualiser le budget de latence et les régressions' }
      ],
      refs: [
        { t: 'Lighthouse AI — latence du dense reranking', u: ARTICLE, d: 'le compromis réel des 200–500 ms' },
        { t: 'Prometheus — histograms and summaries', u: 'https://prometheus.io/docs/practices/histograms/', d: 'mesurer les quantiles sans se cacher derrière la moyenne' }
      ]
    },

    preuves: {
      tools: [
        { n: 'Ragas', u: 'https://docs.ragas.io/en/stable/', d: 'jeux de test, context precision, context recall et fidélité' },
        { n: 'TruLens', u: 'https://www.trulens.org/getting_started/', d: 'évaluer retrieval et réponse avec traces et vérité terrain' },
        { n: 'DeepEval', u: 'https://deepeval.com/docs/getting-started', d: 'tests de régression et métriques RAG exécutables' },
        { n: 'ir-measures', u: 'https://github.com/terrierteam/ir_measures', d: 'métriques IR classiques sur des qrels explicites' }
      ],
      refs: [
        { t: 'Lighthouse AI — « Measure your baseline »', u: ARTICLE, d: 'deux à quatre semaines de mesure avant la couche suivante' },
        { t: 'Ragas — métriques RAG', u: 'https://docs.ragas.io/en/stable/', d: 'séparer qualité du contexte et qualité de la réponse' }
      ]
    },

    synthese: {
      tools: [
        { n: 'adr-tools', u: 'https://github.com/npryce/adr-tools', d: 'formaliser choix, preuve, seuil, coût et rollback' },
        { n: 'Ragas', u: 'https://docs.ragas.io/en/stable/', d: 'maintenir le jeu de preuve qui autorise chaque palier' },
        { n: 'Grafana k6', u: 'https://grafana.com/docs/k6/latest/', d: 'valider que la recette tient aussi son SLO sous charge' }
      ],
      refs: [
        { t: 'Lighthouse AI — « The Decision Tree »', u: ARTICLE, d: 'BM25, mesure, rewriting, hybride, puis stratégie d’embedding' },
        { t: 'adr-tools — dépôt officiel', u: 'https://github.com/npryce/adr-tools', d: 'laisser une décision réversible et transmissible' }
      ]
    }
  };

  global.TECHNOS = TECHNOS;
})(window);
