/* technos.js — Chapitre 2 : outillage et lectures par arrêt.
   Format identique au chapitre 1 : tools { n, u, d }, refs { t, u, d }.
   Toutes les URLs ont été vérifiées HTTP 200 (25/08/2026). */
(function (global) {
  'use strict';

  var TECHNOS = {

    warehouse: {
      tools: [
        { n: 'Unstructured', u: 'https://github.com/Unstructured-IO/unstructured', d: 'ingestion : PDF, Word, HTML, e-mails, scans → texte + métadonnées' },
        { n: 'Apache Tika', u: 'https://tika.apache.org/', d: 'détection et extraction de ~1 400 formats (le couteau suisse)' },
        { n: 'Document loaders (LangChain)', u: 'https://python.langchain.com/docs/how_to/document_loader/', d: 'brancher S3, SharePoint, Drive, bases SQL en quelques lignes' },
        { n: 'Paramiko', u: 'https://www.paramiko.org/', d: 'client SFTP Python : récupérer les dépôts de fichiers à la réception' }
      ],
      refs: [
        { t: 'Pinecone — « What is RAG ? »', u: 'https://www.pinecone.io/learn/retrieval-augmented-generation/', d: 'vue d\u2019ensemble du pipeline, pour situer l\u2019arrivée des sources' },
        { t: 'Unstructured — documentation', u: 'https://docs.unstructured.io/open-source/introduction/overview', d: 'parsers open source et empreinte à la réception' }
      ]
    },

    parser: {
      tools: [
        { n: 'PyMuPDF', u: 'https://pymupdf.readthedocs.io/', d: 'extraction PDF : texte, tableaux, positions, pages, métadonnées' },
        { n: 'pdfplumber', u: 'https://github.com/jsvine/pdfplumber', d: 'excellent pour les tableaux et les données chiffrées' },
        { n: 'Tesseract OCR', u: 'https://github.com/tesseract-ocr/tesseract', d: 'OCR open source pour les scans sans couche texte' }
      ],
      refs: [
        { t: 'pdfplumber — exemples', u: 'https://github.com/jsvine/pdfplumber', d: 'extraire tableaux et colonnes de vrais documents' },
        { t: 'Tesseract — dépôt officiel', u: 'https://github.com/tesseract-ocr/tesseract', d: 'l\u2019OCR de référence, 100+ langues, entraînable' }
      ]
    },

    cleaner: {
      tools: [
        { n: 'BeautifulSoup', u: 'https://www.crummy.com/software/BeautifulSoup/', d: 'nettoyer le HTML : balises, scripts, navigation à retirer' },
        { n: 'trafilatura', u: 'https://github.com/adbar/trafilatura', d: 'extraction du contenu principal d\u2019une page (bruit en moins)' },
        { n: 'langdetect', u: 'https://github.com/Mimino666/langdetect', d: 'détecter la langue et écarter les parasites' }
      ],
      refs: [
        { t: 'trafilatura — dépôt', u: 'https://github.com/adbar/trafilatura', d: 'comparé aux autres extracteurs web, avec benchmarks' }
      ]
    },

    enricher: {
      tools: [
        { n: 'LlamaIndex — documents & nodes', u: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/documents_and_nodes/', d: 'métadonnées : source, date, titre, chemin de section' },
        { n: 'pydantic', u: 'https://docs.pydantic.dev/latest/', d: 'schéma strict des métadonnées : auteur, type, droits, date d\u2019effet' }
      ],
      refs: [
        { t: 'LlamaIndex — métadonnées', u: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/documents_and_nodes/', d: 'pourquoi les métadonnées décident du filtrage et de l\u2019audit' }
      ]
    },

    orch: {
      tools: [
        { n: 'LangGraph', u: 'https://www.langchain.com/langgraph', d: 'graphe d\u2019état : ordre des étapes, reprises bornées, cause de relance' },
        { n: 'Prefect', u: 'https://www.prefect.io/', d: 'orchestration de flux : files, retries, observabilité des tâches' },
        { n: 'Apache Airflow', u: 'https://airflow.apache.org/', d: 'DAG d\u2019ingestion : planning, dépendances, reprises' }
      ],
      refs: [
        { t: 'Prefect — documentation', u: 'https://docs.prefect.io/', d: 'flows, retries et idempotence pour un pipeline documentaire' },
        { t: 'Airflow — documentation', u: 'https://airflow.apache.org/docs/', d: 'concevoir un DAG d\u2019ingestion avec quarantaine' }
      ]
    },

    isolate: {
      tools: [
        { n: 'Prefect — retries', u: 'https://docs.prefect.io/', d: 'reprises bornées : même hash, même version de parseur' },
        { n: 'Apache Airflow', u: 'https://airflow.apache.org/', d: 'sensors et branches d\u2019échec : écarter sans avaler' },
        { n: 'pydantic', u: 'https://docs.pydantic.dev/latest/', d: 'refuser un objet incomplet avant qu\u2019il n\u2019entre dans l\u2019index' }
      ],
      refs: [
        { t: 'Prefect — dépôt', u: 'https://github.com/PrefectHQ/prefect', d: 'l\u2019état d\u2019une reprise : tentative, cause, raison d\u2019arrêt' }
      ]
    },

    dedup: {
      tools: [
        { n: 'datasketch (MinHash + LSH)', u: 'https://github.com/ekzhu/datasketch', d: 'empreintes de similarité : quasi-copies à grande échelle' },
        { n: 'simhash', u: 'https://github.com/1e0ng/simhash', d: 'empreinte sensible aux petites variations : copies proches' }
      ],
      refs: [
        { t: 'datasketch — dépôt', u: 'https://github.com/ekzhu/datasketch', d: 'MinHash expliqué, passage à l\u2019échelle' }
      ]
    },

    format: {
      tools: [
        { n: 'Unstructured', u: 'https://github.com/Unstructured-IO/unstructured', d: 'sortie markdown commune : titres, listes, tableaux' },
        { n: 'Pandoc', u: 'https://pandoc.org/', d: 'convertir Word, HTML, wiki vers un markdown stable' },
        { n: 'LlamaIndex — documents', u: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/documents_and_nodes/', d: 'un contrat de nœud unique avant le découpage' }
      ],
      refs: [
        { t: 'Unstructured — aperçu', u: 'https://docs.unstructured.io/open-source/introduction/overview', d: 'uniformiser l\u2019output avant le chunking' }
      ]
    },

    chunker: {
      tools: [
        { n: 'Text splitters (LangChain)', u: 'https://python.langchain.com/docs/how_to/recursive_text_splitter/', d: 'découpe récursive ; la baseline du cours est 90 mots, 15 d\u2019overlap' },
        { n: 'LlamaIndex — node parsers', u: 'https://docs.llamaindex.ai/', d: 'découpage par structure (titres, sections) plutôt que par taille brute' },
        { n: 'Semantic chunking (LangChain)', u: 'https://python.langchain.com/docs/how_to/semantic-chunker/', d: 'couper là où le sens change, pas à la longueur fixe' }
      ],
      refs: [
        { t: 'Pinecone — « Chunking Strategies »', u: 'https://www.pinecone.io/learn/chunking-strategies/', d: 'choisir la taille et la méthode, puis mesurer les doublons du top-k' },
        { t: 'LangChain — recursive splitter', u: 'https://python.langchain.com/docs/how_to/recursive_text_splitter/', d: 'le splitter le plus utilisé, paramètres expliqués' }
      ]
    },

    embed: {
      tools: [
        { n: 'sentence-transformers', u: 'https://www.sbert.net/', d: 'la lib de référence : BGE, E5, multilingues' },
        { n: 'BGE-M3 (BAAI)', u: 'https://huggingface.co/BAAI/bge-m3', d: 'multilingue, dense + sparse + multi-vectoriel en un modèle' },
        { n: 'fastembed (Qdrant)', u: 'https://github.com/qdrant/fastembed', d: 'embeddings légers et rapides, optimisés CPU' }
      ],
      refs: [
        { t: 'MTEB — classement des embeddings', u: 'https://huggingface.co/spaces/mteb/leaderboard', d: 'choisir SON modèle selon la langue et le domaine' },
        { t: 'sentence-transformers — docs', u: 'https://www.sbert.net/', d: 'bi-encodeurs vs cross-encodeurs, même modèle à l\u2019index et à la question' }
      ]
    },

    vector: {
      tools: [
        { n: 'pgvector', u: 'https://github.com/pgvector/pgvector', d: 'vecteurs dans PostgreSQL : ACID, JOINs, index HNSW, RLS' },
        { n: 'Qdrant', u: 'https://qdrant.tech/', d: 'base vectorielle dédiée, filtres riches, HNSW' },
        { n: 'Milvus', u: 'https://github.com/milvus-io/milvus', d: 'passage à l\u2019échelle distribué pour les gros volumes' },
        { n: 'Chroma', u: 'https://www.trychroma.com/', d: 'la plus simple pour prototyper en local' },
        { n: 'Spice.ai', u: 'https://github.com/spiceai/spiceai', d: 'moteur SQL + vecteurs : embeddings et vector_search intégrés' }
      ],
      refs: [
        { t: 'HNSW — article original (arXiv)', u: 'https://arxiv.org/abs/1603.09320', d: 'l\u2019algorithme derrière la plupart des index vectoriels modernes' },
        { t: 'Spice.ai — recherche vectorielle', u: 'https://spiceai.org/docs/features/search/vector-search', d: 'SQL et vecteurs dans le même nœud, collé aux données existantes' }
      ]
    },

    filter: {
      tools: [
        { n: 'PostgreSQL — Row-Level Security', u: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html', d: 'le RLS voyage avec chaque ligne : sensibilité, tenant, public / interne' },
        { n: 'Qdrant — filtering', u: 'https://qdrant.tech/documentation/concepts/filtering/', d: 'filtres par payload combinés à la recherche vectorielle' }
      ],
      refs: [
        { t: 'Qdrant — filtrage par payload', u: 'https://qdrant.tech/documentation/concepts/filtering/', d: 'poser les tags avant toute recherche, sur les deux index' }
      ]
    },

    logs: {
      tools: [
        { n: 'OpenTelemetry', u: 'https://opentelemetry.io/', d: 'le standard de traces : un span par étape du Data Flow' },
        { n: 'Elastic Stack', u: 'https://www.elastic.co/elastic-stack', d: 'collecter et chercher les 14 logs : parsing.entree → stockage.acces' },
        { n: 'Langfuse', u: 'https://langfuse.com/', d: 'traces d\u2019ingestion et de requête, identifiants conservés' }
      ],
      refs: [
        { t: 'OpenTelemetry — documentation', u: 'https://opentelemetry.io/docs/', d: 'nommer les spans avant d\u2019écrire le premier connecteur' },
        { t: 'Elastic — démarrage', u: 'https://www.elastic.co/docs/get-started', d: 'indexer les journaux d\u2019étape pour le debug et l\u2019audit' }
      ]
    },

    dash: {
      tools: [
        { n: 'Prometheus', u: 'https://prometheus.io/', d: 'métriques : TTFT, requêtes/minute, tokens, taux de succès' },
        { n: 'Grafana', u: 'https://grafana.com/oss/grafana/', d: 'tableaux de bord et alertes de seuil sur global.performance / pipeline' },
        { n: 'Langfuse', u: 'https://langfuse.com/', d: 'latence, coûts, modèle le plus exploité, reprises' }
      ],
      refs: [
        { t: 'Prometheus — introduction', u: 'https://prometheus.io/docs/introduction/overview/', d: 'compteurs et histogrammes pour un pipeline d\u2019ingestion' },
        { t: 'Grafana OSS', u: 'https://grafana.com/oss/grafana/', d: 'une alerte sans runbook n\u2019est qu\u2019un voyant allumé' }
      ]
    },

    rights: {
      tools: [
        { n: 'PostgreSQL — RLS', u: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html', d: 'restreindre les lignes dans la base, avant toute recherche' },
        { n: 'SpiceDB', u: 'https://authzed.com/spicedb', d: 'ReBAC : LookupResources en pré-filtre, CheckPermission en post-filtre' },
        { n: 'OpenFGA', u: 'https://openfga.dev/', d: 'autorisations relationnelles à la Zanzibar, document par document' },
        { n: 'OPA (Open Policy Agent)', u: 'https://www.openpolicyagent.org/', d: 'politiques déclaratives appliquées avant la recherche' },
        { n: 'Keycloak', u: 'https://www.keycloak.org/', d: 'authentification : qui pose la question ; les droits viennent ensuite' }
      ],
      refs: [
        { t: 'SpiceDB — sécuriser un pipeline RAG', u: 'https://authzed.com/docs/spicedb/tutorials/secure-rag-pipelines', d: 'pré-filtrer et post-filtrer les chunks, caches partitionnés par tenant' },
        { t: 'OpenFGA — modèle de permissions', u: 'https://openfga.dev/', d: 'penser les droits par document, pas seulement par rôle' }
      ]
    },

    loopct: {
      tools: [
        { n: 'Prefect', u: 'https://www.prefect.io/', d: 'reprises bornées : même fichier, même hash, cause de relance' },
        { n: 'Apache Airflow', u: 'https://airflow.apache.org/', d: 'retries d\u2019un DAG, avec raison d\u2019arrêt' },
        { n: 'LangGraph', u: 'https://www.langchain.com/langgraph', d: 'l\u2019état conserve le nombre d\u2019essais et la cause de transition' }
      ],
      refs: [
        { t: 'Prefect — documentation', u: 'https://docs.prefect.io/', d: 'comparer le gain d\u2019une reprise à son coût' }
      ]
    },

    dock: {
      tools: [
        { n: 'Langfuse', u: 'https://langfuse.com/', d: 'relier hash, parseur, chunks, décision de doublon et accès' },
        { n: 'OpenTelemetry', u: 'https://opentelemetry.io/', d: 'traces masquant les contenus, identifiants conservés' },
        { n: 'MLflow', u: 'https://mlflow.org/', d: 'versions de parseur, de modèle d\u2019embedding, de stratégie de chunk' }
      ],
      refs: [
        { t: 'Langfuse — traces', u: 'https://langfuse.com/', d: 'rejouer une ingestion : pourquoi un passage a été retenu ou écarté' }
      ]
    },

    eval: {
      tools: [
        { n: 'Prometheus', u: 'https://prometheus.io/', d: 'SLO : fraîcheur, échecs de parsing, latence d\u2019embedding, refus d\u2019accès' },
        { n: 'Grafana', u: 'https://grafana.com/oss/grafana/', d: 'alertes et runbooks : le voyant mène à une action' },
        { n: 'Langfuse', u: 'https://langfuse.com/', d: 'hit rate sur un jeu étiqueté, avant d\u2019optimiser le reste' }
      ],
      refs: [
        { t: 'Prometheus — introduction', u: 'https://prometheus.io/docs/introduction/overview/', d: 'mesurer le socle comme on mesure une usine' },
        { t: 'PostgreSQL', u: 'https://www.postgresql.org/', d: 'la date d\u2019effet et le statut dominent souvent le score textuel' }
      ]
    }
  };

  global.TECHNOS = TECHNOS;
})(window);
