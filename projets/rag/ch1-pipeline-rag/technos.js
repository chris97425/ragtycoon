/* technos.js — pour chaque arrêt : l'outillage open source réellement utilisable
   pour construire ce bloc, et des articles/ressources pour comprendre le bloc.
   Toutes les URLs ont été vérifiées (HTTP 200, 10/08/2026).
   Données factuelles : chunking 256-1024 tokens / overlap 10-20 %, HNSW,
   RRF, cross-encoder (+20-40 % précision), 1536 dims — chiffres typiques. */
(function (global) {
  'use strict';

  var TECHNOS = {
    /* 1 · Entrepôt — ingestion hétérogène */
    warehouse: {
      tools: [
        { n: 'Unstructured', u: 'https://github.com/Unstructured-IO/unstructured', d: 'ingestion : PDF, Word, HTML, e-mails, scans → texte propre + métadonnées' },
        { n: 'Apache Tika', u: 'https://tika.apache.org/', d: 'détection et extraction de ~1 400 formats de fichiers (le couteau suisse)' },
        { n: 'Document loaders (LangChain)', u: 'https://python.langchain.com/docs/how_to/document_loader/', d: 'brancher SharePoint, S3, Google Drive, bases SQL en quelques lignes' }
      ],
      refs: [
        { t: 'Pinecone — « What is RAG ? »', u: 'https://www.pinecone.io/learn/retrieval-augmented-generation/', d: 'la vue d\u2019ensemble du pipeline, parfaite pour situer l\u2019ingestion' },
        { t: 'Unstructured — documentation', u: 'https://github.com/Unstructured-IO/unstructured', d: 'exemples concrets de parsing de documents d\u2019entreprise' }
      ]
    },

    /* 2 · Parseur — extraction du texte */
    parser: {
      tools: [
        { n: 'PyMuPDF', u: 'https://pymupdf.readthedocs.io/', d: 'extraction PDF haute fidélité : texte, tableaux, positions, métadonnées' },
        { n: 'pdfplumber', u: 'https://github.com/jsvine/pdfplumber', d: 'excellent pour les tableaux et les données chiffrées dans les PDF' },
        { n: 'Tesseract OCR', u: 'https://github.com/tesseract-ocr/tesseract', d: 'OCR open source (moteur Google) pour les scans sans couche texte' }
      ],
      refs: [
        { t: 'pdfplumber — exemples', u: 'https://github.com/jsvine/pdfplumber', d: 'extraire tableaux et colonnes de vrais documents' },
        { t: 'Tesseract — dépôt officiel', u: 'https://github.com/tesseract-ocr/tesseract', d: 'l\u2019OCR de référence, 100+ langues, entraînable' }
      ]
    },

    /* 3 · Nettoyeur — assainir le texte */
    cleaner: {
      tools: [
        { n: 'BeautifulSoup', u: 'https://www.crummy.com/software/BeautifulSoup/', d: 'nettoyer le HTML : balises, scripts, navigation à retirer' },
        { n: 'trafilatura', u: 'https://github.com/adbar/trafilatura', d: 'extraction du contenu principal d\u2019une page web (bruit en moins)' },
        { n: 'langdetect', u: 'https://github.com/Mimino666/langdetect', d: 'détecter la langue des textes et écarter les parasites' }
      ],
      refs: [
        { t: 'trafilatura — dépôt', u: 'https://github.com/adbar/trafilatura', d: 'comparé aux autres extracteurs web, avec benchmarks' }
      ]
    },

    /* 4 · Découpeuse — chunking */
    chunker: {
      tools: [
        { n: 'Text splitters (LangChain)', u: 'https://python.langchain.com/docs/how_to/recursive_text_splitter/', d: 'découpe récursive 256-1024 tokens, chevauchement 10-20 %' },
        { n: 'LlamaIndex — node parsers', u: 'https://docs.llamaindex.ai/', d: 'découpage par structure (titres, sections, phrases) plutôt que par taille brute' },
        { n: 'Semantic chunking (LangChain)', u: 'https://python.langchain.com/docs/how_to/semantic-chunker/', d: 'couper là où le sens change, pas à la longueur fixe' }
      ],
      refs: [
        { t: 'Pinecone — « Chunking Strategies »', u: 'https://www.pinecone.io/learn/chunking-strategies/', d: 'la référence pour choisir la taille et la méthode de découpe' },
        { t: 'LangChain — recursive splitter', u: 'https://python.langchain.com/docs/how_to/recursive_text_splitter/', d: 'le splitter le plus utilisé, paramètres expliqués' }
      ]
    },

    /* 5 · Enrichisseur — métadonnées */
    enricher: {
      tools: [
        { n: 'LlamaIndex — documents & nodes', u: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/documents_and_nodes/', d: 'métadonnées automatiques : source, date, titre, chemin' },
        { n: 'pydantic + LLM (extraction)', u: 'https://docs.llamaindex.ai/en/stable/understanding/', d: 'faire extraire par le LLM : auteur, client, contrat, SIRET…' }
      ],
      refs: [
        { t: 'LlamaIndex — métadonnées', u: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/documents_and_nodes/', d: 'pourquoi les métadonnées décident du filtrage et des droits' }
      ]
    },

    /* 6 · Dédoublonneur */
    dedup: {
      tools: [
        { n: 'datasketch (MinHash + LSH)', u: 'https://github.com/ekzhu/datasketch', d: 'empreintes de similarité : trouver les doublons quasi identiques à grande échelle' },
        { n: 'simhash', u: 'https://github.com/1e0ng/simhash', d: 'empreinte sensible aux petites variations : détection de copies proches' }
      ],
      refs: [
        { t: 'datasketch — dépôt', u: 'https://github.com/ekzhu/datasketch', d: 'MinHash expliqué avec exemples, passage à l\u2019échelle' }
      ]
    },

    /* 7 · Studio d'embedding */
    embed: {
      tools: [
        { n: 'sentence-transformers', u: 'https://www.sbert.net/', d: 'la lib de référence : BGE, E5, multilingues, 1536 dims typiques' },
        { n: 'BGE-M3 (BAAI)', u: 'https://huggingface.co/BAAI/bge-m3', d: 'multilingue, dense + sparse + multi-vectoriel en un modèle' },
        { n: 'fastembed (Qdrant)', u: 'https://github.com/qdrant/fastembed', d: 'embeddings légers et rapides, optimisés CPU' }
      ],
      refs: [
        { t: 'MTEB — classement des embeddings', u: 'https://huggingface.co/spaces/mteb/leaderboard', d: 'le leaderboard pour choisir SON modèle selon la langue et le domaine' },
        { t: 'sentence-transformers — docs', u: 'https://www.sbert.net/', d: 'bi-encodeurs vs cross-encodeurs, entraînement, usage' }
      ]
    },

    /* 8 · Base vectorielle */
    vector: {
      tools: [
        { n: 'pgvector', u: 'https://github.com/pgvector/pgvector', d: 'vecteurs dans PostgreSQL : ACID, JOINs, index HNSW/IVFFlat' },
        { n: 'Qdrant', u: 'https://qdrant.tech/', d: 'base vectorielle dédiée, filtres riches, HNSW < 100 ms' },
        { n: 'Milvus', u: 'https://milvus.io/', d: 'passage à l\u2019échelle distribué pour les gros volumes' },
        { n: 'Chroma', u: 'https://www.trychroma.com/', d: 'la plus simple pour prototyper en local' },
        { n: 'Spice.ai', u: 'https://github.com/spiceai/spiceai', d: 'moteur SQL + vecteurs + RAG (DataFusion) : embeddings et vector_search intégrés' }
      ],
      refs: [
        { t: 'HNSW — article original (arXiv)', u: 'https://arxiv.org/abs/1603.09320', d: 'l\u2019algorithme derrière la plupart des index vectoriels modernes' },
        { t: 'pgvector — dépôt', u: 'https://github.com/pgvector/pgvector', d: 'rester dans Postgres quand on a déjà tout dedans' },
        { t: 'Spice.ai — recherche vectorielle', u: 'https://spiceai.org/docs/features/search/vector-search', d: 'embeddings et vector_search SQL pour un RAG collé aux données existantes' }
      ]
    },

    /* 9 · Salle des filtres */
    filter: {
      tools: [
        { n: 'PostgreSQL (filtres SQL)', u: 'https://www.postgresql.org/', d: 'filtres par métadonnées + Row-Level Security pour les droits' },
        { n: 'Qdrant — filtering', u: 'https://qdrant.tech/documentation/concepts/filtering/', d: 'filtres par payload combinés à la recherche vectorielle' }
      ],
      refs: [
        { t: 'Qdrant — filtrage par payload', u: 'https://qdrant.tech/documentation/concepts/filtering/', d: 'combiner les filtres métier avec la similarité' }
      ]
    },

    /* 10 · Porte des questions */
    query: {
      tools: [
        { n: 'Prompt engineering (OpenAI guide)', u: 'https://platform.openai.com/docs/guides/prompt-engineering', d: 'formuler la question : précision, contexte, contraintes' }
      ],
      refs: [
        { t: 'OpenAI — prompt engineering', u: 'https://platform.openai.com/docs/guides/prompt-engineering', d: 'six stratégies qui s\u2019appliquent aussi à la reformulation RAG' }
      ]
    },

    /* 11 · Reformulateur */
    rewrite: {
      tools: [
        { n: 'MultiQueryRetriever (LangChain)', u: 'https://python.langchain.com/docs/how_to/multi_query/', d: 'générer plusieurs variantes de la question et fusionner les résultats' },
        { n: 'HyDE', u: 'https://arxiv.org/abs/2212.10496', d: 'générer une réponse hypothétique puis chercher avec : +15 % de rappel typique' }
      ],
      refs: [
        { t: 'HyDE — article (arXiv)', u: 'https://arxiv.org/abs/2212.10496', d: '« Precise Zero-Shot Dense Retrieval without Relevance Labels »' },
        { t: 'LangChain — MultiQuery', u: 'https://python.langchain.com/docs/how_to/multi_query/', d: 'implémentation prête à l\u2019emploi' }
      ]
    },

    /* 12 · Chercheur hybride */
    hybrid: {
      tools: [
        { n: 'rank_bm25', u: 'https://github.com/dorianbrown/rank_bm25', d: 'BM25 en pur Python : la moitié lexicale de la recherche hybride' },
        { n: 'Elasticsearch', u: 'https://www.elastic.co/', d: 'BM25 natif + knn, hybride intégré dans le même index' },
        { n: 'OpenSearch', u: 'https://opensearch.org/', d: 'alternative open source complète avec recherche hybride' }
      ],
      refs: [
        { t: 'rank_bm25 — dépôt', u: 'https://github.com/dorianbrown/rank_bm25', d: 'BM25 expliqué, paramètres k1/b' }
      ]
    },

    /* 13 · Fusionneur RRF */
    rrf: {
      tools: [
        { n: 'OpenSearch / Elasticsearch (RRF intégré)', u: 'https://opensearch.org/', d: 'fusion RRF native des classements BM25 + vectoriel' },
        { n: 'implémentation maison (50-100 lignes)', u: 'https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking', d: 'RRF est trivial à coder : score = Σ 1/(k + rang)' }
      ],
      refs: [
        { t: 'RRF — article original (Cormack)', u: 'https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf', d: 'le papier fondateur : pourquoi fusionner par rang plutôt que par score' },
        { t: 'Azure — hybrid search ranking', u: 'https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking', d: 'RRF expliqué simplement, avec la formule et un exemple' }
      ]
    },

    /* 14 · Reranker */
    rerank: {
      tools: [
        { n: 'Cross-encodeurs (sentence-transformers)', u: 'https://www.sbert.net/examples/applications/cross-encoder/README.html', d: '+20-40 % de précision : re-trier les top-k par pertinence réelle' },
        { n: 'bge-reranker-v2-m3', u: 'https://huggingface.co/BAAI/bge-reranker-v2-m3', d: 'reranker multilingue, très bon en français' }
      ],
      refs: [
        { t: 'SBERT — cross-encodeurs', u: 'https://www.sbert.net/examples/applications/cross-encoder/README.html', d: 'la différence bi-encodeur vs cross-encodeur, pourquoi le rerank gagne' }
      ]
    },

    /* 15 · Contrôle des droits */
    rights: {
      tools: [
        { n: 'Keycloak', u: 'https://www.keycloak.org/', d: 'SSO + rôles : qui a le droit de poser quelle question' },
        { n: 'OPA (Open Policy Agent)', u: 'https://www.openpolicyagent.org/', d: 'politiques d\u2019autorisation déclaratives, appliquées avant la recherche' },
        { n: 'OpenFGA', u: 'https://openfga.dev/', d: 'autorisations fines à la Zanzibar (relationnelles, par document)' },
        { n: 'SpiceDB', u: 'https://authzed.com/spicedb', d: 'moteur Zanzibar : tuples de relations, CheckPermission et LookupResources par document' }
      ],
      refs: [
        { t: 'OpenFGA — modèle de permissions', u: 'https://openfga.dev/', d: 'penser les droits par document, pas seulement par rôle' },
        { t: 'SpiceDB — sécuriser un pipeline RAG', u: 'https://authzed.com/docs/spicedb/tutorials/secure-rag-pipelines', d: 'pré-filtrer (LookupResources) et post-filtrer (CheckPermission) les chunks' }
      ]
    },

    /* 16 · Compteur de boucle */
    loopct: {
      tools: [
        { n: 'LangGraph', u: 'https://www.langchain.com/langgraph', d: 'orchestrer les passes de recherche : boucle, état, conditions de sortie' }
      ],
      refs: [
        { t: 'LangGraph — site officiel', u: 'https://www.langchain.com/langgraph', d: 'construire l\u2019agent RAG en graphe d\u2019état' }
      ]
    },

    /* 17 · Assembleur de contexte */
    context: {
      tools: [
        { n: 'LlamaIndex — synthèse', u: 'https://docs.llamaindex.ai/en/stable/understanding/', d: 'assembler les chunks gagnants et construire le prompt final' },
        { n: 'LangChain — prompt templates', u: 'https://python.langchain.com/docs/how_to/document_loader/', d: 'structure du contexte : instructions + sources + question' }
      ],
      refs: [
        { t: 'LlamaIndex — comprendre le pipeline', u: 'https://docs.llamaindex.ai/en/stable/understanding/', d: 'la place exacte de l\u2019assemblage dans le flux' }
      ]
    },

    /* 18 · Réacteur LLM */
    llm: {
      tools: [
        { n: 'Ollama', u: 'https://ollama.com/', d: 'LLM locaux en une commande (Llama, Mistral, Qwen…)' },
        { n: 'vLLM', u: 'https://docs.vllm.ai/', d: 'inférence haute performance en production (PagedAttention)' },
        { n: 'llama.cpp', u: 'https://github.com/ggml-org/llama.cpp', d: 'léger, quantifié, tourne même sur CPU/Mac' },
        { n: 'Hugging Face TGI', u: 'https://huggingface.co/docs/text-generation-inference', d: 'serveur d\u2019inférence optimisé pour les LLM open source' }
      ],
      refs: [
        { t: 'vLLM — documentation', u: 'https://docs.vllm.ai/', d: 'déployer un LLM open source avec un vrai débit' }
      ]
    },

    /* 19 · Atelier citations */
    cite: {
      tools: [
        { n: 'RAGAS — faithfulness', u: 'https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/', d: 'vérifier automatiquement que chaque affirmation est soutenue par les sources' },
        { n: 'Retour des chunks gagnants', u: 'https://docs.ragas.io/en/stable/', d: 'citer = renvoyer les numéros des chunks utilisés, pas inventer' }
      ],
      refs: [
        { t: 'RAGAS — métrique de fidélité', u: 'https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/', d: 'comment mesurer la fidélité aux sources' }
      ]
    },

    /* 20 · Salle des garde-fous */
    guard: {
      tools: [
        { n: 'NeMo Guardrails (NVIDIA)', u: 'https://github.com/NVIDIA/NeMo-Guardrails', d: 'garde-fous programmables : entrée, sortie, rails métier' },
        { n: 'Presidio (Microsoft)', u: 'https://github.com/microsoft/presidio', d: 'détection et masquage PII (RGPD) : noms, IBAN, SIRET…' },
        { n: 'Guardrails AI', u: 'https://www.guardrailsai.com/', d: 'validation structurée des réponses avant envoi' }
      ],
      refs: [
        { t: 'Presidio — dépôt', u: 'https://github.com/microsoft/presidio', d: 'la détection PII open source la plus utilisée' }
      ]
    },

    /* 21 · Quai d'audit */
    dock: {
      tools: [
        { n: 'Langfuse', u: 'https://langfuse.com/', d: 'traces LLM : coûts, latence, versions, retours utilisateurs' },
        { n: 'OpenTelemetry', u: 'https://opentelemetry.io/', d: 'le standard de traces, y compris pour l\u2019IA générative' },
        { n: 'MLflow', u: 'https://mlflow.org/', d: 'suivi d\u2019expériences et registre de modèles' }
      ],
      refs: [
        { t: 'Langfuse — traces RAG', u: 'https://langfuse.com/', d: 'voir chaque question, chaque chunk retourné, chaque token dépensé' }
      ]
    },

    /* 22 · Centre d'évaluation */
    eval: {
      tools: [
        { n: 'RAGAS', u: 'https://docs.ragas.io/', d: 'le standard d\u2019évaluation RAG : fidélité, pertinence, rappel' },
        { n: 'TruLens', u: 'https://www.trulens.org/', d: 'évaluation + suivi des feedbacks dans le temps' },
        { n: 'DeepEval', u: 'https://github.com/confident-ai/deepeval', d: 'tests unitaires RAG, branchables en CI' }
      ],
      refs: [
        { t: 'RAGAS — documentation', u: 'https://docs.ragas.io/', d: 'les métriques et comment construire son jeu de test' }
      ]
    }
  };

  global.TECHNOS = TECHNOS;
})(window);
