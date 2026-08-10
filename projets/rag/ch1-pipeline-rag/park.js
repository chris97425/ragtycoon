/* park.js: the layout of the RAG park — a document factory laid out as a theme park.
   Routes the document cart drives, the stops it halts at, the buildings, and the
   scenery. Everything here is static data plus one painter per building.
   Buildings are drawn with real depth: layered boxes, lit windows, chimneys,
   roof ridges and glowing signs. */
(function (global) {
  'use strict';

  var Iso = global.Iso;

  /* ---- routes ------------------------------------------------------------ */

  function makeRoute(raw) {
    var pts = raw.map(function (p) { return { x: p[0], y: p[1], z: p[2] || 0 }; });
    var segs = [], total = 0, cum = [0];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var len = Math.hypot(b.x - a.x, b.y - a.y) || 0.001;
      segs.push({ a: a, b: b, len: len, cum: total });
      total += len;
      cum.push(total);
    }
    return {
      pts: pts, segs: segs, total: total, cum: cum,
      at: function (d) {
        var s;
        if (d <= 0) {
          s = segs[0];
          return { x: s.a.x, y: s.a.y, z: s.a.z, dx: (s.b.x - s.a.x) / s.len, dy: (s.b.y - s.a.y) / s.len };
        }
        if (d >= total) {
          s = segs[segs.length - 1];
          return { x: s.b.x, y: s.b.y, z: s.b.z, dx: (s.b.x - s.a.x) / s.len, dy: (s.b.y - s.a.y) / s.len };
        }
        for (var i = 0; i < segs.length; i++) {
          s = segs[i];
          if (d <= s.cum + s.len) {
            var t = (d - s.cum) / s.len;
            return {
              x: s.a.x + (s.b.x - s.a.x) * t,
              y: s.a.y + (s.b.y - s.a.y) * t,
              z: s.a.z + (s.b.z - s.a.z) * t,
              dx: (s.b.x - s.a.x) / s.len, dy: (s.b.y - s.a.y) / s.len
            };
          }
        }
      }
    };
  }

  /* Act 1 along the top, then Act 2 back along the second row. */
  var INTAKE = makeRoute([
    [-1, 10],      //  0 the park gate
    [ 6, 10],      //  1 warehouse
    [15, 10],      //  2 parser
    [24, 10],      //  3 cleaner
    [33, 10],      //  4 chunker
    [42, 10],      //  5 enricher
    [51, 10],      //  6 dedup
    [57, 10],      //  7 corner
    [57, 15],      //  8
    [53, 17.5],    //  9
    [46, 17.5],    // 10 embed studio
    [36, 17.5],    // 11 vector store
    [26, 17.5],    // 12 filter hall
    [20, 17.5],    // 13
    [16, 21]       // 14 into the loop
  ]);

  /* The retrieval ring. Every lap is one more search pass: the query is
     rewritten, matched, fused and reranked again with fresh candidates. */
  var LOOP = makeRoute([
    [16, 21],      //  0 entry
    [23, 22.5],    //  1 query gate
    [31, 22.5],    //  2 rewriter
    [39, 22.5],    //  3 hybrid searcher
    [45, 23],      //  4
    [48, 26],      //  5
    [47, 30],      //  6
    [43, 33],      //  7
    [36, 33],      //  8 RRF fusion
    [28, 33],      //  9 reranker
    [21, 33],      // 10 rights filter
    [16, 32],      // 11
    [13, 29],      // 12
    [13, 25],      // 13 the loop counter
    [16, 21]       // 14 back to the entry
  ]);

  var EXIT = makeRoute([
    [13, 25],      //  0 off the counter
    [ 9, 29],
    [ 9, 35],
    [13, 39],
    [22, 39],      //  4 context assembler
    [31, 39],      //  5 LLM reactor
    [40, 39],      //  6 citation workshop
    [49, 39],      //  7 guardrail hall
    [56, 39]       //  8 audit dock
  ]);

  /* The delivery run. The answer leaves the factory on a lorry and is driven to
     the evaluation centre off the east side of the park, where it goes to work. */
  var DELIVER = makeRoute([
    [56, 39],      //  0 out of the audit dock
    [62, 38.5],
    [66, 35.5],
    [66.5, 31],
    [64.5, 28.5],
    [59.2, 27.6]   //  5 the evaluation centre bay
  ]);

  /* The empty lorry drives back round the outside of the park for the next document. */
  var RETURN = makeRoute([
    [59.2, 27.6], [64.5, 28.5], [66.5, 31], [66, 35.5], [64, 42], [59, 47],
    [6, 47], [1, 42], [1, 14], [-1, 11.5], [-1, 10]
  ]);

  var ROUTES = { intake: INTAKE, loop: LOOP, exit: EXIT, deliver: DELIVER, ret: RETURN };

  /* `dwell` is the pause once you have already read a stop. The much longer
     first visit is derived from how much there is to read; see readSeconds. */
  function station(route, idx, id, dwell) {
    return { dist: route.cum[idx], id: id, dwell: dwell == null ? 0.9 : dwell };
  }

  var STATIONS = {
    intake: [
      station(INTAKE, 1, 'warehouse', 1.5), station(INTAKE, 2, 'parser', 1.5),
      station(INTAKE, 3, 'cleaner', 1.5), station(INTAKE, 4, 'chunker', 1.6),
      station(INTAKE, 5, 'enricher', 1.5), station(INTAKE, 6, 'dedup', 1.4),
      station(INTAKE, 10, 'embed', 1.5), station(INTAKE, 11, 'vector', 1.6),
      station(INTAKE, 12, 'filter', 1.4)
    ],
    loop: [
      station(LOOP, 1, 'query', 1.4), station(LOOP, 2, 'rewrite', 1.4),
      station(LOOP, 3, 'hybrid', 1.7), station(LOOP, 8, 'rrf', 1.4),
      station(LOOP, 9, 'rerank', 1.6), station(LOOP, 10, 'rights', 1.3),
      station(LOOP, 13, 'loopct', 1.5)
    ],
    exit: [
      station(EXIT, 4, 'context', 1.6), station(EXIT, 5, 'llm', 1.7),
      station(EXIT, 6, 'cite', 1.6), station(EXIT, 7, 'guard', 1.5),
      station(EXIT, 8, 'dock', 1.6)
    ],
    deliver: [ station(DELIVER, 5, 'eval', 2.6) ],
    ret: [ station(RETURN, 7, 'newbatch', 1.0) ]
  };

  /* ---- palette ----------------------------------------------------------- */

  var C = {
    grass:    '#5d9c3f',
    grassAlt: '#569439',
    path:     '#cbb68e',
    pathEdge: '#b09a72',
    slab:     '#9aa4ae',
    floor:    '#d8e2ea',
    sand:     '#dcc487',
    steel:    '#b9c3cd',
    steelDk:  '#7f8b98',
    dark:     '#5b6470',
    white:    '#eef3f7',
    teal:     '#3fb5a0',
    copper:   '#c9793f',
    gold:     '#f2c14e',
    red:      '#c8453a',
    blue:     '#3f7fd4',
    violet:   '#9a5fd0',
    brick:    '#a2402f',
    wood:     '#6b4a2b',
    hot:      '#ff9a3c',
    paper:    '#f4f1e8',
    paperDk:  '#d9d3c2',
    ink:      '#3a4450',
    cyan:     '#22d3ee',
    green:    '#34d399'
  };

  /* ---- the twenty two stops -------------------------------------------------- */

  var STOPS = [
    { id: 'warehouse', name: 'Entrepôt', act: 1, tag: 'Ingestion', x: 6, y: 10, r: 5,
      short: 'Un document d\u2019entreprise commence comme un tas de fichiers hétérogènes.',
      body: 'Les documents arrivent : PDF, Word, feuilles de calcul, pages de wiki, exports de bases SQL, mails. Chacun a son format, sa mise en page, parfois c\u2019est un scan sans texte. Un LLM ne peut rien en faire directement : il faut d\u2019abord transformer ce fouillis en texte propre, découpé et rangé.',
      tip: 'En entreprise, l\u2019ingestion doit se brancher sur les vrais systèmes : SharePoint, ERP, bases métier. C\u2019est souvent 80 % du travail d\u2019un projet RAG, et pourtant la partie la moins visible.' },

    { id: 'parser', name: 'Parseur', act: 1, tag: 'Ingestion', x: 15, y: 10, r: 5,
      short: 'Extraire le texte de chaque fichier, en gardant la structure.',
      body: 'Le parseur lit chaque format : le PDF devient du texte, le scan passe par de l\u2019OCR (reconnaissance de caractères), le tableur devient des lignes, le wiki devient du texte simple. Les titres, sections et pages sont conservés : ils serviront au découpage et au repérage des citations.',
      tip: 'Un PDF bien formé s\u2019extrait en une seconde. Un scan de 1985 demande de l\u2019OCR et peut produire n\u2019importe quoi. Toujours échantillonner l\u2019extraction avant de lancer toute la collection.' },

    { id: 'cleaner', name: 'Nettoyeur', act: 1, tag: 'Ingestion', x: 24, y: 10, r: 5,
      short: 'Enlever le bruit : en-têtes, pieds de page, artefacts.',
      body: 'Les en-têtes et pieds de page se répètent à chaque page, les numéros de page polluent, l\u2019OCR laisse des coquilles, les tableaux cassent en colonnes incohérentes. Le nettoyeur supprime ce bruit et normalise : encodage UTF-8, espaces réguliers, langue détectée.',
      tip: 'Le bruit empoisonne les embeddings : un chunk qui contient « Page 12 — Rapport annuel » en plein milieu perd une partie de son sens et rapproche des documents qui n\u2019ont rien à voir.' },

    { id: 'chunker', name: 'Découpeuse', act: 1, tag: 'Ingestion', x: 33, y: 10, r: 5,
      short: 'Découper le texte en chunks : des unités de connaissance.',
      body: 'Le texte est découpé en morceaux de 256 à 1024 tokens, avec 10 à 20 % de chevauchement pour ne pas couper une idée en deux. Le découpage suit la structure (sections, paragraphes) quand c\u2019est possible. Chaque chunk devient une unité de connaissance que la recherche pourra retrouver.',
      tip: 'C\u2019est le réglage le plus important du RAG : de mauvais chunks garantissent de mauvaises réponses, même avec les meilleurs embeddings. Les chunks plus petits (256 tokens) gagnent en précision sur les faits précis ; les plus gros gardent le contexte.' },

    { id: 'enricher', name: 'Enrichisseur', act: 1, tag: 'Ingestion', x: 42, y: 10, r: 5,
      short: 'Chaque chunk reçoit ses métadonnées : source, date, titre, section.',
      body: 'Les métadonnées voyagent avec chaque chunk : document d\u2019origine, date, auteur, titre, chemin de section, type. Le titre de la section peut être préfixé au chunk pour lui donner son contexte. C\u2019est ce qui permettra de filtrer, de citer et d\u2019auditer.',
      tip: 'Les métadonnées sont la clé du filtrage avant recherche (date, source, droits) et des citations honnêtes. Un chunk sans métadonnées est une réponse sans source.' },

    { id: 'dedup', name: 'Dédoublonneur', act: 1, tag: 'Ingestion', x: 51, y: 10, r: 5,
      short: 'Supprimer les copies, donner un ID stable à chaque chunk.',
      body: 'Le même document existe souvent en double : importé deux fois, exporté sous deux noms, version brouillon et version finale. Le dédoublonneur repère les copies et quasi-copies par empreinte du contenu, et attribue à chaque chunk un identifiant stable.',
      tip: 'Un ID de chunk stable permet de suivre un chunk à travers les mises à jour : indispensable pour l\u2019audit, les comparaisons d\u2019évaluation et les corrections ciblées.' },

    { id: 'embed', name: 'Studio d\u2019embedding', act: 2, tag: 'Indexation', x: 46, y: 17.5, r: 5,
      short: 'Chaque chunk devient un vecteur : sa position dans l\u2019espace du sens.',
      body: 'Un modèle d\u2019embedding convertit chaque chunk en une liste de nombres — typiquement 1536 dimensions — qui est sa position dans l\u2019espace sémantique. Deux chunks proches dans cet espace veulent dire proches par le sens, même sans partager un seul mot.',
      tip: 'Le modèle d\u2019embedding doit être adapté à la langue et au domaine. Pour des documents en français et en anglais, un modèle multilingue est indispensable.' },

    { id: 'vector', name: 'Base vectorielle', act: 2, tag: 'Indexation', x: 36, y: 17.5, r: 5,
      short: 'Ranger les vecteurs avec un index HNSW : retrouver en moins de 100 ms.',
      body: 'Les vecteurs sont stockés dans une base vectorielle — pgvector, Qdrant, Pinecone, Weaviate — avec un index HNSW (graphe hiérarchique). Retrouver les vecteurs les plus proches prend moins de 100 ms, même sur des millions de chunks.',
      tip: 'Déjà sur PostgreSQL ? pgvector suffit souvent. Filtres complexes et scale-out ? Qdrant ou Pinecone. Le choix dépend de l\u2019existant plus que du battage médiatique.' },

    { id: 'filter', name: 'Salle des filtres', act: 2, tag: 'Indexation', x: 26, y: 17.5, r: 5,
      short: 'Les droits d\u2019accès s\u2019appliquent dès la recherche.',
      body: 'Avant même de chercher, les métadonnées servent de verrous : chaque utilisateur ne peut voir que les chunks que ses permissions autorisent — source, service, niveau de confidentialité. La recherche n\u2019atteint jamais ce qui est interdit.',
      tip: 'C\u2019est ici que se joue la sécurité. Un RAG qui ignore les droits d\u2019accès fuit des documents confidentiels. Le filtrage par métadonnées avant le reranking améliore aussi la précision.' },

    { id: 'query', name: 'Porte des questions', act: 3, tag: 'La boucle de recherche', x: 23, y: 22.5, r: 4.5,
      short: 'Une question arrive. Elle entre dans le même espace sémantique.',
      body: 'Un utilisateur pose une question, en langage naturel. La question est convertie en vecteur avec le même modèle d\u2019embedding que les chunks : elle entre dans le même espace sémantique, prête à être comparée à tous les chunks de la base.',
      tip: 'La question brute est souvent imprécise, remplie de sous-entendus. C\u2019est le travail du prochain bâtiment de la nettoyer pour la recherche.' },

    { id: 'rewrite', name: 'Reformulateur', act: 3, tag: 'La boucle de recherche', x: 31, y: 22.5, r: 4.5,
      short: 'La question est reformulée, élargie, décomposée.',
      body: 'Le reformulateur transforme la question pour mieux chercher : correction des fautes, ajout de synonymes, découpage d\u2019une question double, génération de variantes (query rewriting, multi-query). Une question devient parfois trois ou quatre recherches.',
      tip: '« Le truc pour connecter la base » devient « procédure de connexion à la base de données ». La qualité de la recherche commence ici.' },

    { id: 'hybrid', name: 'Chercheur hybride', act: 3, tag: 'La boucle de recherche', x: 39, y: 22.5, r: 5.5,
      short: 'Deux recherches en parallèle : les mots exacts et le sens.',
      body: 'Deux moteurs tournent en même temps. BM25 cherche les mots-clés exacts : parfait pour les noms propres, codes, acronymes, numéros de référence. Le vectoriel cherche le sens : parfait pour les synonymes et les formulations différentes. Chacun renvoie ses candidats.',
      tip: 'Le vectoriel seul rate les codes et acronymes ; le BM25 seul rate les synonymes. Ensemble ils couvrent les deux cas — c\u2019est la recherche hybride, standard en production.' },

    { id: 'rrf', name: 'Fusionneur RRF', act: 3, tag: 'La boucle de recherche', x: 36, y: 33, r: 4.5,
      short: 'Fusionner les deux listes de rangs en une seule.',
      body: 'La fusion par rangs réciproques (Reciprocal Rank Fusion) combine les deux classements : un chunk bien classé dans les deux listes remonte en tête, un chunk classé par un seul moteur reste honorable. Pas besoin de comparer des scores qui n\u2019ont pas la même échelle.',
      tip: 'Fusionner par rangs plutôt que par scores est robuste : les scores BM25 et les distances vectorielles ne sont pas comparables, mais les positions, si.' },

    { id: 'rerank', name: 'Reranker', act: 3, tag: 'La boucle de recherche', x: 28, y: 33, r: 4.5,
      short: 'Un cross-encoder relit la question et chaque candidat ensemble.',
      body: 'Les embeddings comparent question et chunk séparément — rapide mais approximatif. Un reranker (cross-encoder) évalue chaque paire question-candidat ensemble, comme un juge qui lit les deux textes. Il re-classe les candidats et on ne garde que le top 3 à 5.',
      tip: 'Le reranking coûte cher par candidat : on ne le lance que sur le top 20 à 50. Gain typique de précision : 20 à 40 % par rapport à la recherche vectorielle seule.' },

    { id: 'rights', name: 'Contrôle des droits', act: 3, tag: 'La boucle de recherche', x: 21, y: 33, r: 4.5,
      short: 'Vérifier que chaque chunk retenu est autorisé pour cet utilisateur.',
      body: 'Avant de remonter les résultats, une dernière passe vérifie les permissions : les chunks du top sont comparés aux droits de l\u2019utilisateur et de son service. Ce qui est interdit est écarté, ce qui reste est garanti lisible par la personne.',
      tip: 'La sécurité ne se corrige pas après coup : un chunk confidentiel dans le prompt d\u2019un LLM est déjà une fuite, même si la réponse finale ne le répète pas.' },

    { id: 'loopct', name: 'Le Compteur de boucle', act: 3, tag: 'La boucle de recherche', x: 13, y: 25, r: 4.5,
      short: 'Ceci était une passe de recherche. Une vraie question en demande plusieurs.',
      body: 'La boucle que le chariot vient de parcourir est une passe de recherche : reformulation, recherche hybride, fusion, reranking. Une question d\u2019entreprise réelle itère souvent : variantes de la question, filtres ajustés, compléments d\u2019information. Le parc fait trois passes pour le montrer.',
      tip: 'Dans un RAG agentique, chaque boucle peut déclencher une action : chercher dans une autre source, reformuler, poser une question de clarification. La boucle devient un raisonnement.' },

    { id: 'context', name: 'Assembleur de contexte', act: 4, tag: 'Génération', x: 22, y: 39, r: 5,
      short: 'Les chunks retenus et la question sont assemblés dans le prompt.',
      body: 'Les chunks du top (3 à 5) sont placés dans le prompt avec la question, chacun avec sa source. Le LLM n\u2019a que cela sous les yeux pour répondre. L\u2019ordre compte : le chunk le plus pertinent en premier, et une consigne claire : ne répondre qu\u2019à partir du contexte.',
      tip: 'Un bon prompt de RAG dit explicitement : « Réponds uniquement avec les informations ci-dessous. Si la réponse n\u2019y est pas, dis-le. » C\u2019est la première ligne de défense contre l\u2019hallucination.' },

    { id: 'llm', name: 'Réacteur LLM', act: 4, tag: 'Génération', x: 31, y: 39, r: 5,
      short: 'Le LLM rédige la réponse uniquement à partir du contexte fourni.',
      body: 'Le modèle de langage génère la réponse en s\u2019appuyant sur les chunks fournis. Si la recherche a bien fonctionné, l\u2019hallucination n\u2019a plus de place : tout ce dont le modèle a besoin est dans le prompt. Le réacteur peut être un modèle hébergé ou local.',
      tip: 'En entreprise, le choix d\u2019hébergement — cloud ou local — est souvent dicté par la souveraineté des données. Le RAG fonctionne avec un modèle plus petit et plus rapide qu\u2019un modèle généraliste géant.' },

    { id: 'cite', name: 'Atelier citations', act: 4, tag: 'Génération', x: 40, y: 39, r: 5,
      short: 'Chaque affirmation est reliée à sa source.',
      body: 'La réponse est passée au crible : chaque affirmation est reliée au chunk qui la soutient, donc au document et à la page d\u2019origine. Si le contexte ne contient pas la réponse, le modèle doit le dire au lieu d\u2019inventer. La réponse sort avec ses références.',
      tip: 'Les citations sont la différence entre un prototype et un outil d\u2019entreprise : elles permettent la vérification humaine. « Page 12 du rapport 2024 » vaut mieux que « selon nos sources ». ' },

    { id: 'guard', name: 'Salle des garde-fous', act: 4, tag: 'Génération', x: 49, y: 39, r: 5,
      short: 'La réponse est vérifiée avant de sortir : PII, ton, pertinence.',
      body: 'Avant l\u2019envoi, la réponse passe des garde-fous : détection et masquage des données personnelles (PII), refus des réponses hors-sujet ou trop vagues, contrôle de la langue et du ton. Une réponse qui n\u2019a pas de source est bloquée et reformulée en aveu d\u2019ignorance.',
      tip: 'En Europe, le RGPD impose de traiter les données personnelles : la détection PII est un garde-fou obligatoire pour toute entreprise comme Orange. ' },

    { id: 'dock', name: 'Quai d\u2019audit', act: 5, tag: 'Livraison', x: 56.6, y: 42.2, r: 5,
      short: 'Chaque question, chaque chunk retrouvé, chaque réponse : tout est journalisé.',
      body: 'La réponse et son voyage complet sont écrits dans le journal : question originale, reformulations, chunks retrouvés avec leurs scores, réponse générée, latence, garde-fous déclenchés. On peut rejouer n\u2019importe quelle requête des semaines plus tard.',
      tip: 'Sans journal, impossible de diagnostiquer une mauvaise réponse. Le journal est la mémoire de l\u2019usine — et la base de l\u2019amélioration continue.' },

    { id: 'eval', name: 'Centre d\u2019évaluation', act: 5, tag: 'Livraison', x: 56, y: 24, r: 6,
      short: 'La réponse est notée sur un jeu de test, puis livrée à l\u2019utilisateur.',
      body: 'Le centre évalue la réponse sur un jeu de questions de référence (golden set) : fidélité — la réponse est-elle bien soutenue par le contexte ? —, pertinence, complétude. Les scores guident les réglages du parc : chunks, embeddings, top-k, prompts. Une fois validée, la réponse part à l\u2019utilisateur.',
      tip: 'RAGAS est le standard open source pour noter un RAG : fidélité, pertinence de la réponse, précision et rappel du contexte. C\u2019est la boucle finale du voyage : un document brut à l\u2019entrée, une réponse vérifiée, citée et tracée à la sortie.' }
  ];

  var STOP_BY_ID = {};
  STOPS.forEach(function (s) { STOP_BY_ID[s.id] = s; });

  /* Reading stops are scaled to how much there is to read. */
  function readSeconds(id) {
    var s = STOP_BY_ID[id];
    if (!s) return 8;
    var words = (s.short + ' ' + s.body + ' ' + s.tip).split(/\s+/).length;
    return Math.min(22, Math.max(10, words / 4.4 + 3));
  }
  Object.keys(STATIONS).forEach(function (r) {
    STATIONS[r].forEach(function (st) { st.read = readSeconds(st.id); });
  });

  /* ---- ground ------------------------------------------------------------ */

  var BOUNDS = { x0: -4, y0: 2, x1: 69, y1: 49 };
  var GROUND = { x0: -420, y0: -400, x1: 470, y1: 460 };

  /* Paved lots under each cluster of buildings. */
  var LOTS = [
    { x: 2, y: 3.4, w: 8, d: 6.2, c: C.sand },
    { x: 11, y: 3.4, w: 8, d: 6.2, c: C.slab },
    { x: 20, y: 3.4, w: 8, d: 6.2, c: C.slab },
    { x: 29, y: 3.4, w: 8, d: 6.2, c: C.floor },
    { x: 38, y: 3.4, w: 8, d: 6.2, c: C.floor },
    { x: 47, y: 3.4, w: 8, d: 6.2, c: C.floor },
    { x: 41.5, y: 11.6, w: 9, d: 5.1, c: C.floor },
    { x: 31.5, y: 11.6, w: 9, d: 5.1, c: C.floor },
    { x: 21.5, y: 11.6, w: 9, d: 5.1, c: C.floor },
    { x: 18.6, y: 17.8, w: 8.4, d: 3.9, c: C.floor },
    { x: 27.4, y: 17.8, w: 7.6, d: 3.9, c: C.floor },
    { x: 35.4, y: 17.0, w: 9.0, d: 4.7, c: C.floor },
    { x: 31.6, y: 34.2, w: 8.6, d: 4.2, c: C.floor },
    { x: 23.6, y: 34.2, w: 7.6, d: 4.2, c: C.floor },
    { x: 15.6, y: 34.2, w: 7.6, d: 4.2, c: C.floor },
    { x: 6.4, y: 22.0, w: 6.2, d: 6.0, c: C.slab },
    { x: 17.6, y: 40.4, w: 8.6, d: 4.4, c: C.floor },
    { x: 26.6, y: 40.4, w: 8.6, d: 4.4, c: C.floor },
    { x: 35.6, y: 40.4, w: 8.6, d: 4.4, c: C.floor },
    { x: 44.6, y: 40.4, w: 9.0, d: 4.4, c: C.slab },
    { x: 53.6, y: 40.4, w: 5.8, d: 4.4, c: C.slab },
    { x: 50.2, y: 18.2, w: 10.4, d: 7.4, c: C.floor },
    { x: 50.6, y: 25.6, w: 11.4, d: 4.4, c: C.slab },
    { x: 20, y: 25, w: 24, d: 6.4, c: C.path }
  ];

  /* ---- building painters -------------------------------------------------- */

  var B = [];

  function add(o) { B.push(o); return o; }

  /* shared bits ---------------------------------------------------------- */

  /* Factory hall: body box + gabled roof with a ridge cap + optional lit
     windows on the front wall and a sign. */
  function hall(ctx, x, y, w, d, h, body, roofC, opts, t) {
    opts = opts || {};
    Iso.box(ctx, { x: x, y: y, w: w, d: d, h: h, color: body });
    Iso.gable(ctx, { x: x, y: y, z: h, w: w, d: d, h: Math.min(1.6, d * 0.34), color: roofC });
    /* ridge cap along the roof peak */
    var my = y + d / 2;
    Iso.box(ctx, { x: x, y: my - 0.12, z: h + Math.min(1.6, d * 0.34) - 0.1, w: w, d: 0.24, h: 0.16,
                   color: Iso.mix(roofC, '#000000', 0.25) });
    if (opts.windows) windowRow(ctx, x + 0.4, y + d, h * 0.45, h * 0.78, opts.windows, opts.winT);
    if (opts.sign) sign(ctx, x + w / 2, y + d, h + 0.1, opts.sign, opts.signC || C.gold);
    if (opts.chimney) chimney(ctx, x + w * 0.7, y + d * 0.25, h, opts.chimney, t);
  }

  /* A row of lit windows on the wall facing the camera at y = yFace. */
  function windowRow(ctx, x0, yFace, z0, z1, n, t) {
    var step = 0.62;
    for (var i = 0; i < n; i++) {
      var wx = x0 + i * step;
      var lit = t ? (Math.sin(t * 2 + i * 1.7) > -0.4) : (i % 3 !== 1);
      ctx.fillStyle = lit ? 'rgba(255,214,120,0.85)' : 'rgba(30,42,54,0.75)';
      faceRect(ctx, yFace, wx, z0, wx + 0.34, z1);
      ctx.strokeStyle = 'rgba(60,42,20,0.55)';
      ctx.lineWidth = 0.8;
      Iso.stroke(ctx, [Iso.project(wx, yFace, z1), Iso.project(wx + 0.34, yFace, z1),
                       Iso.project(wx + 0.34, yFace, z0), Iso.project(wx, yFace, z0)], true);
    }
  }

  function faceRect(ctx, yFace, x0, z0, x1, z1) {
    Iso.poly(ctx, [Iso.project(x0, yFace, z1), Iso.project(x1, yFace, z1),
                   Iso.project(x1, yFace, z0), Iso.project(x0, yFace, z0)]);
  }

  /* A chimney with a wisp of smoke. */
  function chimney(ctx, x, y, z, h, t) {
    Iso.box(ctx, { x: x, y: y, w: 0.42, d: 0.42, h: h, color: '#7a4a32' });
    Iso.box(ctx, { x: x - 0.06, y: y - 0.06, z: z + h - 0.08, w: 0.54, d: 0.54, h: 0.1, color: '#5e3a26' });
    if (t != null) {
      for (var i = 0; i < 2; i++) {
        var k = ((t * 0.4) + i / 2) % 1;
        var p = Iso.project(x + 0.2, y + 0.2, z + h + k * 2.2);
        ctx.fillStyle = 'rgba(235,235,235,' + (0.4 * (1 - k)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(k * 3 + i * 2) * 5, p.y, 3 + k * 6, 0, 6.2832);
        ctx.fill();
      }
    }
  }

  /* A glowing sign plate on a wall. */
  function sign(ctx, x, yFace, z, text, colour) {
    var p = Iso.project(x, yFace, z);
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(text).width + 16;
    ctx.fillStyle = 'rgba(20,16,10,0.45)';
    ctx.fillRect(p.x - w / 2 + 1, p.y - 10, w, 22);
    ctx.fillStyle = '#22303f';
    ctx.fillRect(p.x - w / 2, p.y - 11, w, 22);
    ctx.strokeStyle = colour; ctx.lineWidth = 2;
    ctx.strokeRect(p.x - w / 2, p.y - 11, w, 22);
    ctx.fillStyle = colour;
    ctx.fillText(text, p.x, p.y + 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  /* A control machine: base, body, screen and a blinking lamp. */
  function machine(ctx, x, y, w, d, h, c, t, blinkSeed) {
    Iso.box(ctx, { x: x, y: y, w: w, d: d, h: 0.22, color: C.dark });
    Iso.box(ctx, { x: x + 0.1, y: y + 0.1, z: 0.22, w: w - 0.2, d: d - 0.2, h: h, color: c });
    /* console screen on the front */
    var p = Iso.project(x + w * 0.5, y + d, 0.22 + h * 0.62);
    ctx.fillStyle = '#22303f';
    ctx.fillRect(p.x - 9, p.y - 8, 18, 12);
    ctx.fillStyle = '#4fd0c0';
    ctx.fillRect(p.x - 7, p.y - 6, 8, 8);
    /* status lamp */
    ctx.fillStyle = (Math.sin(t * 4 + (blinkSeed || 0)) > 0) ? '#ff5f4d' : '#5c2b26';
    ctx.beginPath(); ctx.arc(p.x + 5, p.y - 2, 2.4, 0, 6.2832); ctx.fill();
    /* feet */
    Iso.box(ctx, { x: x + 0.12, y: y + 0.12, w: 0.18, d: d - 0.24, h: 0.08, color: '#39424e', edge: false });
    Iso.box(ctx, { x: x + w - 0.3, y: y + 0.12, w: 0.18, d: d - 0.24, h: 0.08, color: '#39424e', edge: false });
  }

  /* A pulsing ground glow under a machine. */
  function glow(ctx, x, y, z, r, t, c1, c2) {
    var k = 0.82 + 0.18 * Math.sin(t * 2.4);
    ctx.globalAlpha = k;
    ctx.fillStyle = c1 || C.hot;
    Iso.disc(ctx, x, y, z, r);
    ctx.fillStyle = c2 || '#fff0b8';
    Iso.disc(ctx, x, y, z + 0.01, r * 0.5);
    ctx.globalAlpha = 1;
  }

  /* A puff of steam/thought rising from a point. */
  function smoke(ctx, x, y, z, t, colour) {
    for (var i = 0; i < 3; i++) {
      var k = ((t * 0.34) + i / 3) % 1;
      var p = Iso.project(x, y, z + k * 3.4);
      ctx.fillStyle = (colour || 'rgba(255,255,255,') + (0.5 * (1 - k)).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(k * 4 + i) * 7, p.y, 5 + k * 11, 0, 6.2832);
      ctx.fill();
    }
  }

  function pipes(ctx, x, y, n, z, c) {
    for (var i = 0; i < n; i++) {
      Iso.box(ctx, { x: x + i, y: y, z: z, w: 1, d: 0.3, h: 0.3, color: c || '#8ea0b3' });
    }
  }

  /* a sheet of paper standing on edge, the unit everything ships in */
  function sheet(ctx, x, y, z, w, h, c) {
    Iso.box(ctx, { x: x, y: y, z: z, w: w, d: 0.08, h: h, color: c || C.paper });
  }

  function paperStack(ctx, x, y, z, n, c) {
    for (var i = 0; i < n; i++) {
      Iso.box(ctx, { x: x - 0.46 + (i % 2) * 0.4, y: y - 0.38 + ((i / 2) | 0) * 0.4,
                     z: z + Math.floor(i / 4) * 0.22, w: 0.4, d: 0.34, h: 0.1,
                     color: c || (i % 2 ? '#e8e2d2' : C.paper) });
    }
  }

  /* A screen on the front wall with crawling lines of text. */
  function docScreen(ctx, x, y, z, w, h, t, lines, c) {
    var p = Iso.project(x, y, z);
    ctx.fillStyle = '#16324a';
    ctx.fillRect(p.x - w / 2, p.y - h / 2, w, h);
    ctx.strokeStyle = c || '#4fd0c0';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(p.x - w / 2, p.y - h / 2, w, h);
    for (var k = 0; k < lines; k++) {
      var off = ((t * 8 + k * 9) % (w - 12));
      ctx.beginPath();
      ctx.moveTo(p.x - w / 2 + 6, p.y - h / 2 + 6 + k * (h - 12) / lines);
      ctx.lineTo(p.x - w / 2 + 6 + off, p.y - h / 2 + 6 + k * (h - 12) / lines);
      ctx.stroke();
    }
  }

  /* --- act 1: ingestion --------------------------------------------------- */

  add({ id: 'warehouse', x: 2.2, y: 3.6, w: 7.6, d: 5.6, draw: function (ctx, b, t) {
    /* big storage hall with a saw-tooth roof line */
    Iso.box(ctx, { x: 2.6, y: 4.0, w: 7.0, d: 4.8, h: 2.0, color: '#aeb8c4' });
    Iso.gable(ctx, { x: 2.6, y: 4.0, z: 2.0, w: 7.0, d: 4.8, h: 1.2, color: C.brick });
    var my = 4.0 + 4.8 / 2;
    Iso.box(ctx, { x: 2.6, y: my - 0.12, z: 3.1, w: 7.0, d: 0.24, h: 0.18, color: '#7a2e1f' });
    /* loading door, tall and dark */
    faceRect(ctx, 8.8, 4.4, 0, 5.6, 1.9);
    ctx.fillStyle = '#2b343d';
    faceRect(ctx, 8.8, 4.4, 0, 5.6, 1.9);
    ctx.strokeStyle = 'rgba(60,42,20,0.6)'; ctx.lineWidth = 1;
    Iso.stroke(ctx, [Iso.project(4.4, 8.8, 1.9), Iso.project(5.6, 8.8, 1.9),
                     Iso.project(5.6, 8.8, 0), Iso.project(4.4, 8.8, 0)], true);
    windowRow(ctx, 2.9, 8.8, 0.5, 0.85, 6, t);
    /* stacks of raw documents outside the door */
    paperStack(ctx, 3.4, 8.6, 0, 6, '#e3dcc8');
    paperStack(ctx, 5.0, 8.6, 0, 5, '#d5cdb6');
    paperStack(ctx, 6.4, 8.4, 0, 4, '#efe9d8');
    /* a forklift trolley carrying a sheet */
    var k = Math.sin(t * 0.5) * 0.5 + 0.5;
    Iso.box(ctx, { x: 4.0 + k * 2.2, y: 6.8, w: 1.0, d: 0.8, h: 0.3, color: C.gold });
    Iso.box(ctx, { x: 4.0 + k * 2.2, y: 6.8, z: 0.3, w: 0.9, d: 0.7, h: 0.14, color: '#b98a2a' });
    sheet(ctx, 4.15 + k * 2.2, 6.9, 0.44, 0.7, 0.9, C.paper);
    chimney(ctx, 8.2, 4.6, 2.0, 1.1, t);
  }});

  add({ id: 'parser', x: 11.4, y: 3.8, w: 7.2, d: 5.4, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 11.8, y: 4.2, w: 6.2, d: 4.4, h: 1.2, color: C.steel });
    /* scanner bed with a sheet sliding through */
    var k = (t * 0.4) % 1;
    Iso.box(ctx, { x: 12.4 + k * 3.4, y: 6.0, z: 1.2, w: 1.6, d: 1.1, h: 0.1, color: C.paper });
    ctx.fillStyle = 'rgba(79,208,192,0.45)';
    Iso.quad(ctx, 12.2, 5.4, 5.4, 2.2, 1.22);
    /* the scan beam sweeping */
    var b1 = Iso.project(13.6, 5.6, 2.4), b2 = Iso.project(13.6 + 3.2, 5.6, 2.4);
    ctx.strokeStyle = '#4fd0c0'; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 5);
    ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
    ctx.globalAlpha = 1;
    /* the OCR tower with a blinking eye */
    Iso.box(ctx, { x: 16.2, y: 4.2, w: 1.6, d: 1.6, h: 2.6, color: '#5b6470' });
    var ep = Iso.project(17.0, 4.9, 2.6);
    ctx.fillStyle = (Math.sin(t * 3) > 0) ? '#7fd4e8' : '#1f3a4a';
    ctx.beginPath(); ctx.arc(ep.x, ep.y, 4, 0, 6.2832); ctx.fill();
    machine(ctx, 16.6, 7.2, 1.5, 1.6, 1.1, '#7fb3d4', t, 1);
  }});

  add({ id: 'cleaner', x: 20.2, y: 3.8, w: 7.6, d: 5.4, draw: function (ctx, b, t) {
    hall(ctx, 20.6, 4.2, 6.6, 4.4, 1.8, '#dfe7ee', C.blue, { windows: 5, winT: t, sign: 'PROPRE' });
    /* dust particles being blown off a sheet */
    var p = Iso.project(23.6, 6.4, 1.1);
    ctx.fillStyle = C.paper;
    ctx.fillRect(p.x - 24, p.y - 8, 48, 16);
    ctx.strokeStyle = 'rgba(70,60,45,0.5)'; ctx.lineWidth = 1.2;
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(p.x - 18, p.y - 4 + i * 4);
      ctx.lineTo(p.x + 12, p.y - 4 + i * 4);
      ctx.stroke();
    }
    for (var d2 = 0; d2 < 5; d2++) {
      var k = ((t * 0.8) + d2 / 5) % 1;
      var dp = Iso.project(24.4 + Math.sin(k * 6 + d2) * 1.6, 6.2 - k * 1.2, 1.15 + k * 0.8);
      ctx.fillStyle = 'rgba(90,80,60,' + (0.8 * (1 - k)).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(dp.x, dp.y, 2.5, 0, 6.2832); ctx.fill();
    }
    machine(ctx, 21.2, 7.6, 2.0, 1.5, 1.1, '#7fb3d4', t, 2);
  }});

  add({ id: 'chunker', x: 29.2, y: 3.8, w: 7.6, d: 5.6, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 29.6, y: 4.2, w: 6.8, d: 4.8, h: 0.9, color: C.dark });
    /* the sheet going in one side, coloured chunks coming out the other */
    sheet(ctx, 30.2, 5.6, 0.9, 1.3, 1.0, C.paper);
    var k = (t * 0.5) % 1;
    var cols = ['#3f7fd4', '#9a5fd0', '#c9793f', '#3fb5a0', '#c8453a'];
    for (var i = 0; i < 5; i++) {
      var ck = ((k + i * 0.18) % 1);
      Iso.box(ctx, { x: 33.2 + ck * 2.6, y: 7.0 + Math.sin(ck * 6 + i) * 0.3, z: 0.92,
                     w: 0.5, d: 0.42, h: 0.3, color: cols[i] });
    }
    /* the cutter tower: vertical blades with a light bar */
    Iso.box(ctx, { x: 31.6, y: 4.6, w: 1.2, d: 3.4, h: 1.6, color: '#5b6470' });
    ctx.strokeStyle = '#8d99a6'; ctx.lineWidth = 3;
    for (var c2 = 0; c2 < 3; c2++) {
      var cp = Iso.project(32.0 + c2 * 0.5, 5.2, 0.9);
      ctx.beginPath(); ctx.moveTo(cp.x, cp.y - 18); ctx.lineTo(cp.x, cp.y + 18); ctx.stroke();
    }
    var lb = Iso.project(32.2, 7.6, 1.7);
    ctx.fillStyle = (Math.sin(t * 4) > 0) ? '#ff9a3c' : '#5c2b26';
    ctx.beginPath(); ctx.arc(lb.x, lb.y, 3, 0, 6.2832); ctx.fill();
    /* out-tray of fresh chunks */
    chunkPile2(ctx, 36.6, 8.2, 0, 3);
  }});

  function chunkPile2(ctx, x, y, z, n) {
    var cols = ['#3f7fd4', '#9a5fd0', '#c9793f', '#3fb5a0'];
    for (var i = 0; i < n; i++) {
      Iso.box(ctx, { x: x - 0.4 + (i % 2) * 0.36, y: y - 0.34 + Math.floor(i / 2) * 0.36,
                     z: z, w: 0.32, d: 0.3, h: 0.22, color: cols[i % 4] });
    }
  }

  add({ id: 'enricher', x: 38.2, y: 3.8, w: 7.6, d: 5.4, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 38.6, y: 4.2, w: 6.6, d: 4.6, h: 1.4, color: '#a8b4c0' });
    /* conveyor of chunks under a tag stamper */
    Iso.box(ctx, { x: 38.8, y: 5.9, w: 6.2, d: 1.3, h: 0.25, color: '#39424e' });
    var k = (t * 0.45) % 1;
    for (var i = 0; i < 4; i++) {
      var ck = ((k + i * 0.22) % 1);
      Iso.box(ctx, { x: 39.6 + ck * 4.4, y: 6.2, z: 1.4, w: 0.5, d: 0.42, h: 0.3,
                     color: i % 2 ? '#3f7fd4' : '#9a5fd0' });
      Iso.box(ctx, { x: 39.6 + ck * 4.4, y: 6.2, z: 1.7, w: 0.3, d: 0.2, h: 0.12, color: C.gold });
    }
    /* the stamper arm with a golden tag */
    var dip = Math.abs(Math.sin(t * 2)) * 0.4;
    var sp = Iso.project(42.6, 5.0, 2.6 - dip);
    ctx.fillStyle = '#5f6b78'; ctx.fillRect(sp.x - 14, sp.y - 20, 28, 20);
    ctx.fillStyle = C.gold; ctx.fillRect(sp.x - 10, sp.y - 8, 20, 6);
    /* metadata cabinet */
    Iso.box(ctx, { x: 43.8, y: 7.6, w: 1.6, d: 1.0, h: 0.9, color: '#c4ccd4' });
    for (var m = 0; m < 3; m++) {
      ctx.fillStyle = C.gold;
      faceRect(ctx, 8.6, 44.0, 0.25 + m * 0.28, 44.5, 0.4 + m * 0.28);
    }
  }});

  add({ id: 'dedup', x: 47.2, y: 3.8, w: 7.6, d: 5.4, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 47.6, y: 4.2, w: 6.8, d: 4.6, h: 1.1, color: C.steel });
    Iso.box(ctx, { x: 47.6, y: 4.2, z: 1.1, w: 6.8, d: 4.6, h: 0.5, color: '#8a97a5' });
    /* two stacks in, one clean stack out */
    paperStack(ctx, 48.4, 5.8, 1.12, 4, '#d5cdb6');
    paperStack(ctx, 51.2, 5.8, 1.12, 3, '#d5cdb6');
    var k = (t * 0.5) % 1;
    Iso.box(ctx, { x: 49.6 + k * 2.4, y: 8.0, z: 1.12, w: 0.7, d: 0.6, h: 0.26, color: C.paper });
    /* fingerprint scanner glowing */
    var fp = Iso.project(52.6, 5.0, 1.5);
    ctx.fillStyle = '#22303f'; ctx.beginPath(); ctx.arc(fp.x, fp.y, 9, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = '#4fd0c0'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(fp.x, fp.y, 5, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.arc(fp.x, fp.y, 3, 0, 6.2832); ctx.stroke();
    glow(ctx, 52.6, 5.0, 1.62, 0.7, t, 'rgba(79,208,192,0.5)', 'rgba(79,208,192,0.2)');
  }});

  /* --- act 2: indexing ---------------------------------------------------- */

  add({ id: 'embed', x: 41.8, y: 11.8, w: 8.4, d: 4.8, draw: function (ctx, b, t) {
    hall(ctx, 42.0, 12.0, 8.0, 4.2, 2.0, '#e5eaf0', '#4d7fb5', { windows: 6, winT: t });
    /* the encoder: three columns of light */
    for (var i = 0; i < 3; i++) Iso.cylinder(ctx, { x: 44.6 + i * 2.2, y: 14.6, r: 0.55, h: 1.4, color: '#7fb3d4' });
    for (var j = 0; j < 4; j++) {
      var p = Iso.project(44.3 + j * 1.5, 16.4, 1.0);
      ctx.fillStyle = 'rgba(34,211,238,' + (0.5 + 0.5 * Math.sin(t * 3 + j)) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, 6.2832); ctx.fill();
    }
    docScreen(ctx, 48.0, 12.6, 44, 26, t, 4, '#22d3ee');
    /* orbiting vectors on the roof */
    for (var v = 0; v < 5; v++) {
      var a = t * 0.8 + v * 1.26;
      var vp = Iso.project(46.0 + Math.cos(a) * 3.2, 14.1 + Math.sin(a) * 1.4, 2.4);
      ctx.fillStyle = 'rgba(34,211,238,0.8)';
      ctx.beginPath(); ctx.arc(vp.x, vp.y, 3, 0, 6.2832); ctx.fill();
    }
  }});

  add({ id: 'vector', x: 31.8, y: 11.8, w: 8.4, d: 4.8, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 32.0, y: 12.0, w: 8.0, d: 4.2, h: 2.4, color: '#dfe6ec', top: '#c3ccd6' });
    Iso.box(ctx, { x: 32.0, y: 12.0, z: 2.4, w: 8.0, d: 4.2, h: 0.22, color: '#aeb8c2' });
    /* the rack halls, seen through the long window on the front wall */
    for (var i = 0; i < 7; i++) {
      var x0 = 32.5 + i * 0.92, x1 = x0 + 0.7;
      ctx.fillStyle = '#1b2733';
      faceRect(ctx, 16.2, x0, 0.7, x1, 2.2);
      for (var r = 0; r < 4; r++) {
        var z0 = 0.82 + r * 0.36;
        ctx.fillStyle = (Math.sin(t * 5 + i * 2 + r) > -0.2) ? '#34d399' : '#1f5c4a';
        faceRect(ctx, 16.2, x0 + 0.06, z0, x1 - 0.06, z0 + 0.14);
      }
    }
    ctx.strokeStyle = 'rgba(30,42,54,0.5)'; ctx.lineWidth = 1;
    Iso.stroke(ctx, [Iso.project(32.5, 16.2, 2.3), Iso.project(39.6, 16.2, 2.3),
                     Iso.project(39.6, 16.2, 0.6), Iso.project(32.5, 16.2, 0.6)], true);
    sign(ctx, 38.4, 16.2, 2.5, 'HNSW', '#34d399');
    /* chillers on the roof */
    for (var f = 0; f < 3; f++) fan(ctx, 33.6 + f * 2.4, 13.6, 2.62, t * (2.2 + f * 0.4));
  }});

  add({ id: 'filter', x: 21.8, y: 11.8, w: 8.4, d: 4.8, draw: function (ctx, b, t) {
    hall(ctx, 22.0, 12.0, 8.0, 4.2, 2.0, '#eef4f9', '#7a6ba8', { windows: 6, winT: t, sign: 'ACCÈS' });
    /* turnstiles with locks */
    for (var i = 0; i < 3; i++) {
      var x = 23.2 + i * 2.6;
      Iso.box(ctx, { x: x, y: 15.8, w: 0.5, d: 0.5, h: 1.4, color: '#5f6b78' });
      var open = Math.sin(t * 2 + i * 2) > 0;
      Iso.box(ctx, { x: x + 0.3, y: 15.8, w: open ? 0.9 : 0.1, d: 0.3, h: 0.9, z: 0.4, color: C.gold });
      var lp = Iso.project(x + 0.25, 15.7, 1.5);
      ctx.fillStyle = open ? '#34d399' : '#c8453a';
      ctx.fillRect(lp.x - 4, lp.y - 4, 8, 8);
    }
    /* a badge reader on a post */
    Iso.box(ctx, { x: 26.2, y: 15.9, w: 0.3, d: 0.3, h: 1.2, color: '#5f6b78' });
    var bp = Iso.project(26.35, 15.95, 1.2);
    ctx.fillStyle = '#22303f'; ctx.fillRect(bp.x - 8, bp.y - 8, 16, 16);
    ctx.fillStyle = '#4fd0c0'; ctx.fillRect(bp.x - 5, bp.y - 5, 10, 10);
  }});

  /* --- act 3, the retrieval ring ------------------------------------------ */

  add({ id: 'query', x: 18.8, y: 17.9, w: 8.0, d: 3.7, draw: function (ctx, b, t) {
    /* a gate arch with a giant glowing question mark */
    Iso.box(ctx, { x: 19.6, y: 18.4, w: 0.9, d: 0.9, h: 2.8, color: C.steelDk });
    Iso.box(ctx, { x: 24.2, y: 18.4, w: 0.9, d: 0.9, h: 2.8, color: C.steelDk });
    Iso.box(ctx, { x: 19.6, y: 18.4, z: 2.8, w: 5.5, d: 0.9, h: 0.5, color: C.steel });
    /* the question bubble hovering in the arch */
    var q = Iso.project(22.35, 19.0, 3.4);
    var pulse = 1 + 0.05 * Math.sin(t * 3);
    ctx.save();
    ctx.translate(q.x, q.y); ctx.scale(pulse, pulse); ctx.translate(-q.x, -q.y);
    ctx.fillStyle = '#22303f';
    ctx.beginPath(); ctx.arc(q.x, q.y, 12, 0, 6.2832); ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', q.x, q.y + 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.restore();
    glow(ctx, 22.35, 19.0, 3.7, 0.9, t, C.cyan, '#ffffff');
    /* small letters falling into the gate: user questions */
    for (var i = 0; i < 3; i++) {
      var k = ((t * 0.6) + i / 3) % 1;
      var lp = Iso.project(22.35 + Math.sin(k * 5 + i) * 1.2, 19.6 - k * 0.8, 2.9 + k * 0.5);
      ctx.fillStyle = 'rgba(255,233,168,' + (0.8 * (1 - k)).toFixed(2) + ')';
      ctx.font = 'bold 10px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', lp.x, lp.y);
    }
    ctx.textAlign = 'left';
  }});

  add({ id: 'rewrite', x: 27.6, y: 17.9, w: 7.2, d: 3.7, draw: function (ctx, b, t) {
    machine(ctx, 28.4, 18.4, 2.6, 2.4, 1.5, '#7fb3d4', t, 0);
    /* one question in, three variants out on little tracks */
    var k = (t * 0.4) % 1;
    Iso.box(ctx, { x: 31.8 + k * 0.6, y: 18.8, z: 0.5, w: 0.5, d: 0.4, h: 0.3, color: C.gold });
    for (var i = 0; i < 3; i++) {
      var vp = Iso.project(33.2, 20.2 + (i - 1) * 0.55, 0.6);
      ctx.fillStyle = 'rgba(34,211,238,' + (0.5 + 0.5 * Math.sin(t * 3 + i * 2)) + ')';
      ctx.beginPath(); ctx.arc(vp.x, vp.y, 3.4, 0, 6.2832); ctx.fill();
      /* little track lines */
      ctx.strokeStyle = 'rgba(34,211,238,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(vp.x - 12, vp.y); ctx.lineTo(vp.x - 4, vp.y); ctx.stroke();
    }
  }});

  add({ id: 'hybrid', x: 35.4, y: 17.0, w: 9.0, d: 4.6, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 35.8, y: 17.4, w: 8.0, d: 4.0, h: 0.5, color: '#5b6470' });
    /* twin engines: BM25 (left, letters) and dense (right, glow) */
    Iso.box(ctx, { x: 36.2, y: 17.8, w: 3.0, d: 2.6, h: 1.9, color: '#b9c3cd' });
    Iso.box(ctx, { x: 36.2, y: 17.8, z: 1.9, w: 3.0, d: 2.6, h: 0.3, color: '#8a97a5' });
    var lp = Iso.project(37.7, 20.4, 1.3);
    ctx.fillStyle = '#22303f'; ctx.fillRect(lp.x - 20, lp.y - 14, 40, 28);
    ctx.fillStyle = '#f2c14e'; ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BM25', lp.x, lp.y - 5);
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(242,193,78,0.7)';
      ctx.fillRect(lp.x - 16, lp.y + i * 7 - 1, 26 - i * 4, 2.4);
    }
    Iso.box(ctx, { x: 40.0, y: 17.8, w: 3.0, d: 2.6, h: 1.9, color: '#4d7fb5' });
    var dp = Iso.project(41.5, 20.4, 1.3);
    ctx.fillStyle = '#16324a'; ctx.beginPath(); ctx.arc(dp.x, dp.y, 13, 0, 6.2832); ctx.fill();
    for (var j = 0; j < 4; j++) {
      var a = t * 2 + j * 1.7;
      ctx.fillStyle = 'rgba(34,211,238,0.8)';
      ctx.beginPath(); ctx.arc(dp.x + Math.cos(a) * 7, dp.y + Math.sin(a) * 5, 3, 0, 6.2832); ctx.fill();
    }
    /* connector beams between the twins */
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lp.x + 22, lp.y - 6); ctx.lineTo(dp.x - 16, dp.y - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lp.x + 22, lp.y + 8); ctx.lineTo(dp.x - 16, dp.y + 10); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    glow(ctx, 41.5, 20.4, 1.35, 0.9, t, 'rgba(34,211,238,0.35)', 'rgba(34,211,238,0.15)');
  }});

  add({ id: 'rrf', x: 31.6, y: 34.0, w: 8.6, d: 4.2, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 32.2, y: 34.4, w: 7.4, d: 3.4, h: 0.6, color: C.dark });
    /* two streams of candidates merging into one ranked list */
    var k = (t * 0.4) % 1;
    for (var i = 0; i < 3; i++) {
      var c1 = ((k + i * 0.2) % 1);
      Iso.box(ctx, { x: 33.2 + c1 * 1.4, y: 35.0 + i * 0.8, z: 0.6, w: 0.45, d: 0.4, h: 0.26,
                     color: i % 2 ? C.gold : C.cyan });
    }
    for (var j = 0; j < 3; j++) {
      var c2 = ((k + j * 0.2) % 1);
      Iso.box(ctx, { x: 38.4 + c2 * 1.2, y: 35.2 - j * 0.6, z: 0.6, w: 0.45, d: 0.4, h: 0.26,
                     color: j % 2 ? C.violet : C.teal });
    }
    /* the fusion funnel with a glow */
    var fp = Iso.project(36.0, 36.8, 0.7);
    ctx.fillStyle = 'rgba(242,193,78,0.55)';
    ctx.beginPath(); ctx.moveTo(fp.x - 16, fp.y - 10); ctx.lineTo(fp.x + 16, fp.y - 10);
    ctx.lineTo(fp.x + 5, fp.y + 6); ctx.lineTo(fp.x - 5, fp.y + 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(140,100,20,0.7)'; ctx.lineWidth = 1.4;
    ctx.stroke();
    /* ranked output stepping down */
    for (var r2 = 0; r2 < 4; r2++) {
      Iso.box(ctx, { x: 34.4 + r2 * 0.8, y: 37.6, z: 0.62, w: 0.66, d: 0.5, h: 0.34 - r2 * 0.05,
                     color: r2 < 2 ? C.gold : '#c9d3dd' });
    }
    sign(ctx, 38.4, 38.2, 0.8, 'RRF', C.gold);
  }});

  add({ id: 'rerank', x: 23.6, y: 34.0, w: 7.6, d: 4.2, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 24.0, y: 34.4, w: 6.8, d: 3.4, h: 1.3, color: '#a8b4c0' });
    Iso.box(ctx, { x: 24.0, y: 34.4, z: 1.3, w: 6.8, d: 3.4, h: 0.35, color: '#8a97a5' });
    /* a judge: cross-encoder head with a thought bubble */
    var jp = Iso.project(26.2, 36.6, 1.45);
    ctx.fillStyle = '#22303f'; ctx.beginPath(); ctx.arc(jp.x, jp.y, 10, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u2696', jp.x, jp.y);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    /* candidates stacking into a top-k podium */
    for (var i = 0; i < 3; i++) {
      var hgt = 0.3 + (2 - i) * 0.22;
      Iso.box(ctx, { x: 28.6 + i * 0.9, y: 35.4, z: 1.3, w: 0.7, d: 0.6, h: hgt,
                     color: i === 0 ? C.gold : (i === 1 ? '#c9d3dd' : '#a8763f') });
      /* scores floating above */
      var sc = Iso.project(29.0 + i * 0.9, 35.5, 1.3 + hgt + 0.3);
      ctx.fillStyle = i === 0 ? C.gold : 'rgba(242,193,78,0.55)';
      ctx.font = 'bold 9px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('' + (98 - i * 12), sc.x, sc.y);
    }
    ctx.textAlign = 'left';
    /* the question card held up beside the judge */
    sheet(ctx, 29.8, 33.9, 0, 0.9, 1.1, C.paper);
  }});

  add({ id: 'rights', x: 15.6, y: 34.0, w: 7.6, d: 4.2, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: 16.0, y: 34.4, w: 6.8, d: 3.4, h: 1.6, color: '#eef4f9' });
    Iso.box(ctx, { x: 16.0, y: 34.4, z: 1.6, w: 6.8, d: 3.4, h: 0.3, color: '#c6d3de' });
    /* a big golden padlock over the doorway, bobbing */
    var k = Math.abs(Math.sin(t * 1.4));
    var lp = Iso.project(19.4, 36.4, 1.7 + k * 0.25);
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(lp.x, lp.y, 7, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#8a6a20';
    ctx.fillRect(lp.x - 2.6, lp.y - 8, 5.2, 5);
    ctx.fillStyle = '#22303f';
    ctx.fillRect(lp.x - 2, lp.y - 2, 4, 6);
    /* a badge scanner on the wall */
    var bp = Iso.project(16.8, 36.0, 1.2);
    ctx.fillStyle = '#22303f'; ctx.fillRect(bp.x - 8, bp.y - 8, 16, 16);
    ctx.fillStyle = '#4fd0c0'; ctx.fillRect(bp.x - 5, bp.y - 5, 10, 10);
    /* checkmark row on the roof */
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = (Math.sin(t * 2 + i) > 0) ? '#34d399' : '#1f5c4a';
      faceRect(ctx, 37.8, 16.6 + i * 1.5, 1.65, 17.4 + i * 1.5, 1.8);
    }
  }});

  /* --- the loop counter, the arch the cart drives under ------------------- */

  add({ id: 'loopct', x: 6.4, y: 21.8, w: 6.4, d: 6.4, draw: function (ctx, b, t, W) {
    Iso.box(ctx, { x: 7.0, y: 22.4, w: 3.4, d: 3.0, h: 2.0, color: '#c4ccd4' });
    Iso.gable(ctx, { x: 7.0, y: 22.4, z: 2.0, w: 3.4, d: 3.0, h: 1.1, color: C.gold });
    /* the pass board, showing which search pass the query is on */
    var p = Iso.project(8.7, 25.4, 2.2);
    ctx.fillStyle = 'rgba(20,16,10,0.45)';
    ctx.fillRect(p.x - 33, p.y - 25, 68, 26);
    ctx.fillStyle = '#2a1e12';
    ctx.fillRect(p.x - 34, p.y - 26, 68, 26);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 34, p.y - 26, 68, 26);
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PASSE ' + ((W && W.lap) || 1), p.x, p.y - 13);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    /* a rotating arrow above the arch */
    var ap = Iso.project(8.7, 23.9, 3.4);
    var ang = t * 1.2;
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ap.x + Math.cos(ang) * 8, ap.y + Math.sin(ang) * 4);
    ctx.lineTo(ap.x + Math.cos(ang + 2.6) * 8, ap.y + Math.sin(ang + 2.6) * 4);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }});

  /* --- act 4: generation -------------------------------------------------- */

  add({ id: 'context', x: 17.6, y: 40.2, w: 8.6, d: 4.4, draw: function (ctx, b, t) {
    hall(ctx, 18.0, 40.6, 7.8, 3.6, 1.8, '#e8eef4', '#4d7fb5', { windows: 5, winT: t });
    /* chunks sliding together into a prompt frame */
    var k = (t * 0.35) % 1;
    var cols = ['#3f7fd4', '#9a5fd0', '#c9793f', '#3fb5a0'];
    for (var i = 0; i < 4; i++) {
      var ck = ((k + i * 0.2) % 1);
      Iso.box(ctx, { x: 18.8 + ck * 5.4, y: 42.2, z: 0.4, w: 0.55, d: 0.5, h: 0.32, color: cols[i] });
    }
    /* the prompt frame at the end of the line, glowing */
    var pp = Iso.project(25.0, 41.6, 1.2);
    ctx.fillStyle = '#16324a'; ctx.fillRect(pp.x - 22, pp.y - 26, 44, 30);
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.6; ctx.strokeRect(pp.x - 22, pp.y - 26, 44, 30);
    ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 10px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PROMPT', pp.x, pp.y - 16);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    glow(ctx, 25.0, 41.6, 1.25, 0.8, t, 'rgba(34,211,238,0.3)', 'rgba(34,211,238,0.12)');
  }});

  add({ id: 'llm', x: 26.6, y: 40.2, w: 8.6, d: 4.4, draw: function (ctx, b, t) {
    /* the reactor: a glowing core with a chimney of "thought" */
    Iso.box(ctx, { x: 27.2, y: 40.6, w: 7.4, d: 3.6, h: 0.8, color: C.dark });
    Iso.cylinder(ctx, { x: 31.0, y: 42.4, r: 1.5, h: 2.4, z: 0.8, color: '#4d7fb5' });
    /* cooling fins around the core */
    for (var f = 0; f < 4; f++) {
      var fa = f * 1.57 + 0.4;
      Iso.box(ctx, { x: 31.0 + Math.cos(fa) * 1.62 - 0.14, y: 42.4 + Math.sin(fa) * 1.5 - 0.14,
                     z: 0.8, w: 0.28, d: 0.28, h: 2.8, color: '#8a97a5', edge: false });
    }
    glow(ctx, 31.0, 42.4, 3.25, 1.35, t, '#7fd4e8', '#ffffff');
    smoke(ctx, 31.0, 42.4, 3.4, t);
    /* the answer sheet sliding out */
    var k = (t * 0.3) % 1;
    sheet(ctx, 33.2 + k * 0.8, 41.4, 0.8, 1.4, 1.0, C.paper);
    docScreen(ctx, 28.0, 41.2, 40, 24, t, 4, '#4fd0c0');
  }});

  add({ id: 'cite', x: 35.6, y: 40.2, w: 8.6, d: 4.4, draw: function (ctx, b, t) {
    hall(ctx, 36.0, 40.6, 7.8, 3.6, 1.8, '#f0ead8', '#a8563f', { windows: 4, winT: t });
    /* a giant quotation mark on the wall */
    var qp = Iso.project(39.9, 43.8, 1.6);
    ctx.fillStyle = '#a8563f';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u201C', qp.x, qp.y - 6);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    /* the answer sheet with numbered footnotes */
    var sp = Iso.project(38.4, 41.6, 1.1);
    ctx.fillStyle = C.paper; ctx.fillRect(sp.x - 24, sp.y - 30, 48, 36);
    ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1; ctx.strokeRect(sp.x - 24, sp.y - 30, 48, 36);
    ctx.fillStyle = '#3a4450'; ctx.font = 'bold 9px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('[1]', sp.x - 18, sp.y - 16);
    ctx.fillText('[2]', sp.x + 4, sp.y - 2);
    ctx.fillText('[3]', sp.x - 12, sp.y + 12);
    /* a little link chain to the source shelf */
    Iso.box(ctx, { x: 41.2, y: 43.4, w: 3.4, d: 0.7, h: 0.3, color: '#8a7a5a' });
    for (var i = 0; i < 4; i++) {
      Iso.box(ctx, { x: 41.4 + i * 0.8, y: 43.5, z: 0.3, w: 0.55, d: 0.5, h: 0.2, color: C.paper });
    }
  }});

  add({ id: 'guard', x: 44.6, y: 40.2, w: 9.0, d: 4.4, draw: function (ctx, b, t) {
    hall(ctx, 45.0, 40.6, 8.0, 3.6, 1.9, '#e8eef4', C.blue, { sign: 'RGPD' });
    /* a shield over the gate */
    var k = 0.5 + 0.5 * Math.sin(t * 2);
    var sp = Iso.project(49.0, 43.9, 2.0);
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y - 14); ctx.lineTo(sp.x + 10, sp.y - 8);
    ctx.lineTo(sp.x + 10, sp.y + 2); ctx.lineTo(sp.x, sp.y + 12);
    ctx.lineTo(sp.x - 10, sp.y + 2); ctx.lineTo(sp.x - 10, sp.y - 8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = k > 0.7 ? '#4fe0b8' : '#1f7f6a';
    ctx.beginPath(); ctx.arc(sp.x, sp.y - 1, 4, 0, 6.2832); ctx.fill();
    /* PII detector panels */
    for (var i = 0; i < 2; i++) {
      var pp = Iso.project(46.0 + i * 4.6, 41.4, 1.6);
      ctx.fillStyle = '#16324a'; ctx.fillRect(pp.x - 16, pp.y - 12, 32, 24);
      ctx.strokeStyle = '#4fd0c0'; ctx.lineWidth = 1;
      ctx.strokeRect(pp.x - 16, pp.y - 12, 32, 24);
      ctx.fillStyle = (Math.sin(t * 3 + i * 2) > 0) ? '#c8453a' : '#2b3a48';
      ctx.fillRect(pp.x - 12, pp.y - 8, 24, 16);
    }
  }});

  /* --- act 5: delivery ------------------------------------------------------ */

  add({ id: 'dock', x: 53.6, y: 40.0, w: 5.8, d: 4.8, draw: function (ctx, b, t) {
    hall(ctx, 53.9, 40.4, 2.4, 2.2, 1.4, '#e8eef4', C.brick);
    /* log screens: every query scrolling by */
    for (var i = 0; i < 2; i++) {
      var p = Iso.project(55.2 + i * 1.6, 42.0, 1.2);
      ctx.fillStyle = '#0e1a24';
      ctx.fillRect(p.x - 16, p.y - 22, 32, 28);
      ctx.strokeStyle = '#4fd0c0'; ctx.lineWidth = 1.2;
      ctx.strokeRect(p.x - 16, p.y - 22, 32, 28);
      ctx.fillStyle = 'rgba(79,208,192,0.8)'; ctx.font = 'bold 8px monospace';
      for (var k2 = 0; k2 < 4; k2++) {
        var off = ((t * 10 + k2 * 5 + i * 3) % 26);
        ctx.fillRect(p.x - 13 + off * 0.3, p.y - 17 + k2 * 6, 14, 3);
      }
    }
    /* the lorry waiting, headlights on */
    truck(ctx, 54.1, 43.3, C.red);
    var hl = Iso.project(57.6, 43.4, 1.2);
    ctx.fillStyle = 'rgba(255,240,180,0.5)';
    ctx.beginPath(); ctx.arc(hl.x, hl.y, 4, 0, 6.2832); ctx.fill();
  }});

  add({ id: 'eval', x: 50.6, y: 18.6, w: 9.6, d: 6.6, draw: function (ctx, b, t, W) {
    var X = 51, Y = 19, Wd = 8.8, D = 5.6, H = 3.4;
    var face = Y + D;
    var racks = (W && W.racks) || 0;
    var full = Math.min(6, racks * 2);
    var arriving = W && W.stage === 'eval';

    Iso.box(ctx, { x: X, y: Y, w: Wd, d: D, h: H, color: '#dfe6ec', top: '#c3ccd6' });
    Iso.box(ctx, { x: X, y: Y, z: H, w: Wd, d: D, h: 0.22, color: '#aeb8c2' });
    for (var f = 0; f < 3; f++) fan(ctx, X + 1.6 + f * 2.6, Y + 2.0, H + 0.24, t * (2.2 + f * 0.4));
    Iso.box(ctx, { x: X + 0.5, y: Y + 4.2, z: H + 0.22, w: 1.4, d: 0.9, h: 0.7, color: '#9fb0c0' });

    /* the golden-set scoreboard on the front wall */
    for (var i = 0; i < 6; i++) {
      var x0 = X + 0.55 + i * 1.0, x1 = x0 + 0.78;
      ctx.fillStyle = '#1b2733';
      faceRect(ctx, face, x0, 0.7, x1, 2.5);
      var on = i < full;
      if (on && arriving && i >= full - 2) on = W.stageT > 0.9 + (i - (full - 2)) * 0.9;
      for (var r = 0; r < 5; r++) {
        var z0 = 0.82 + r * 0.34;
        ctx.fillStyle = on ? (Math.sin(t * 6 + i * 2 + r) > -0.3 ? '#4fe0b8' : '#1f7f6a') : '#2b3a48';
        faceRect(ctx, face, x0 + 0.08, z0, x1 - 0.08, z0 + 0.16);
      }
    }
    ctx.strokeStyle = 'rgba(30,42,54,0.5)'; ctx.lineWidth = 1;
    Iso.stroke(ctx, [Iso.project(X + 0.5, face, 2.6), Iso.project(X + 6.4, face, 2.6),
                     Iso.project(X + 6.4, face, 0.6), Iso.project(X + 0.5, face, 0.6)], true);

    ctx.fillStyle = '#2f3945';
    faceRect(ctx, face, X + 7.0, 0, X + 8.4, 2.2);
    ctx.fillStyle = '#7f8b98';
    faceRect(ctx, face, X + 7.0, 1.7, X + 8.4, 2.2);
    ctx.fillStyle = '#f2c14e';
    faceRect(ctx, face, X + 7.0, 0, X + 8.4, 0.08);

    for (var g = 0; g < 3; g++) {
      Iso.box(ctx, { x: 51.2 + g * 1.5, y: 26.6, w: 1.1, d: 1.3, h: 0.9, color: '#8e9aa8' });
      Iso.box(ctx, { x: 51.3 + g * 1.5, y: 26.7, z: 0.9, w: 0.9, d: 1.1, h: 0.16, color: '#6b7784' });
      Iso.cylinder(ctx, { x: 51.45 + g * 1.5, y: 26.5, r: 0.13, h: 1.5, color: '#5f6b78', edge: false });
    }

    if (arriving) {
      for (var c = 0; c < 3; c++) {
        var k = (W.stageT * 0.55 - c * 0.3) % 1.6;
        if (k < 0 || k > 1) continue;
        paperStack(ctx, 59.0 - k * 0.5, 27.3 - k * 2.5, 0.32, 2);
      }
    }

    sign(ctx, X + 7.7, face, H - 0.1, full > 0 ? 'SCORES OK' : 'EN TEST',
         full > 0 ? '#4fe0b8' : '#6b7784');
  }});

  /* --- shared small painters --------------------------------------------- */

  function fan(ctx, x, y, z, a) {
    Iso.box(ctx, { x: x - 0.7, y: y - 0.7, z: z, w: 1.4, d: 1.4, h: 0.34, color: '#8e9aa8' });
    var p = Iso.project(x, y, z + 0.34);
    ctx.fillStyle = '#2f3945';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 17, 9, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = '#cfd7de'; ctx.lineWidth = 2.4;
    for (var i = 0; i < 3; i++) {
      var th = a + i * 2.094;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(th) * 15, p.y + Math.sin(th) * 8);
      ctx.stroke();
    }
  }

  function truck(ctx, x, y, c) {
    Iso.box(ctx, { x: x, y: y, w: 3.4, d: 1.5, h: 0.2, color: '#2b3038' });
    Iso.box(ctx, { x: x + 0.1, y: y + 0.2, z: 0.2, w: 2.2, d: 1.1, h: 0.85, color: c });
    Iso.box(ctx, { x: x + 2.35, y: y + 0.2, z: 0.2, w: 1.0, d: 1.1, h: 1.15, color: Iso.mix(c, '#ffffff', 0.18) });
  }

  var LORRY_BED = 0.66;
  var LORRY_LOAD = 0.62;

  function lorry(ctx, x, y, z, hx, hy, c) {
    var bx = x - hx * LORRY_LOAD, by = y - hy * LORRY_LOAD;
    Iso.orientedBox(ctx, { x: x, y: y, hx: hx, hy: hy, len: 3.8, wid: 1.6,
                           z: z, h: 0.2, color: '#2b3038' });
    Iso.orientedBox(ctx, { x: bx, y: by, hx: hx, hy: hy, len: 2.3, wid: 1.42,
                           z: z + 0.2, h: 0.46, color: '#9fb0c0' });
    Iso.orientedBox(ctx, { x: x + hx * 0.62, y: y + hy * 0.62, hx: hx, hy: hy,
                           len: 0.16, wid: 1.42, z: z + LORRY_BED, h: 0.6, color: '#7f8b98' });
    Iso.orientedBox(ctx, { x: x + hx * 1.25, y: y + hy * 1.25, hx: hx, hy: hy,
                           len: 1.15, wid: 1.45, z: z + 0.2, h: 1.15, color: c });
    Iso.orientedBox(ctx, { x: x + hx * 1.25, y: y + hy * 1.25, hx: hx, hy: hy,
                           len: 1.18, wid: 1.48, z: z + 1.05, h: 0.3,
                           color: Iso.mix(c, '#ffffff', 0.55) });
  }

  /* ---- scenery ----------------------------------------------------------- */

  /* Layered trees: a trunk, three foliage lobes and a soft shadow, so they
     read as rounded volumes rather than flat blobs. */
  function tree(ctx, x, y, s) {
    s = s || 1;
    Iso.shadow(ctx, x, y, 0.9 * s, 0.25);
    Iso.cylinder(ctx, { x: x, y: y, r: 0.16 * s, h: 1.0 * s, color: '#6b4a2b', edge: false });
    var p = Iso.project(x, y, 1.0 * s);
    ctx.fillStyle = '#2f7a34';
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 10 * s, 20 * s, 16 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#43a04a';
    ctx.beginPath(); ctx.ellipse(p.x - 5 * s, p.y - 15 * s, 13 * s, 10 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#5fbf62';
    ctx.beginPath(); ctx.ellipse(p.x - 8 * s, p.y - 19 * s, 7 * s, 5 * s, 0, 0, 6.2832); ctx.fill();
  }

  function bush(ctx, x, y) {
    Iso.shadow(ctx, x, y, 0.45, 0.22);
    var p = Iso.project(x, y, 0);
    ctx.fillStyle = '#3d8b3d';
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 7, 13, 9, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#54a852';
    ctx.beginPath(); ctx.ellipse(p.x - 4, p.y - 11, 7, 5, 0, 0, 6.2832); ctx.fill();
  }

  function lamp(ctx, x, y) {
    Iso.cylinder(ctx, { x: x, y: y, r: 0.1, h: 2.4, color: '#4a5568', edge: false });
    var p = Iso.project(x, y, 2.4);
    /* halo */
    var g = ctx.createRadialGradient(p.x, p.y - 3, 1, p.x, p.y - 3, 16);
    g.addColorStop(0, 'rgba(255,233,168,0.55)');
    g.addColorStop(1, 'rgba(255,233,168,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y - 3, 16, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(p.x, p.y - 3, 5, 0, 6.2832); ctx.fill();
  }

  function bench(ctx, x, y) {
    Iso.box(ctx, { x: x, y: y, w: 1.4, d: 0.5, h: 0.28, color: '#a8763f' });
    Iso.box(ctx, { x: x, y: y, w: 1.4, d: 0.14, h: 0.5, z: 0.28, color: '#b9854a' });
  }

  /* Park visitors — analysts, following the same roads the document cart drives. */
  var PLAZA = makeRoute([[22, 26.6], [42, 26.6], [42, 30.2], [22, 30.2], [22, 26.6]]);
  var STROLLS = [INTAKE, LOOP, EXIT, PLAZA, PLAZA];
  var SHIRTS = ['#d94f3d', '#3f7fd4', '#8a5fd4', '#2f7a34', '#e0a94f', '#c8453a', '#3fb5a0'];
  var GUESTS = [];
  for (var gi = 0; gi < 24; gi++) {
    var rt = STROLLS[gi % STROLLS.length];
    var side = Iso.hash2(gi, 11, 4) > 0.5 ? 1 : -1;
    GUESTS.push({
      route: rt,
      speed: 0.8 + Iso.hash2(gi, 3, 11) * 0.9,
      offset: Iso.hash2(gi, 7, 5) * rt.total,
      side: side * (0.75 + Iso.hash2(gi, 13, 6) * 0.5),
      shirt: SHIRTS[gi % SHIRTS.length],
      hat: Iso.hash2(gi, 9, 2) > 0.6 ? '#f5c542' : '#ffffff'
    });
  }

  function guest(ctx, x, y, z, shirt, hat, bob) {
    var p = Iso.project(x, y, z || 0);
    ctx.fillStyle = 'rgba(30,50,20,0.22)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 6, 3, 0, 0, 6.2832); ctx.fill();
    var yo = p.y - (bob ? Math.abs(Math.sin(bob)) * 2 : 0);
    ctx.fillStyle = '#33415c'; ctx.fillRect(p.x - 2.5, yo - 9, 5, 7);
    ctx.fillStyle = shirt;
    ctx.strokeStyle = 'rgba(20,14,8,0.5)'; ctx.lineWidth = 1;
    ctx.fillRect(p.x - 4.5, yo - 18, 9, 10);
    ctx.strokeRect(p.x - 4.5, yo - 18, 9, 10);
    ctx.fillStyle = '#f0c49b';
    ctx.beginPath(); ctx.arc(p.x, yo - 21, 4.2, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hat;
    ctx.beginPath(); ctx.arc(p.x, yo - 22.5, 4.4, Math.PI, 0); ctx.fill();
  }

  /* ---- exports ----------------------------------------------------------- */

  /* What the cart is carrying, named on a tag above it so the change at each
     stop is legible without reading the panel. */
  var CARGO_LABELS = {
    empty:     'chariot vide',
    raw:       'document brut',
    parsed:    'texte extrait',
    clean:     'texte nettoyé',
    chunks:    'chunks découpés',
    meta:      'chunks + métadonnées',
    unique:    'chunks uniques',
    vectors:   'vecteurs sémantiques',
    indexed:   'indexé (HNSW)',
    filtered:  'filtré par droits',
    question:  'question entrante',
    rewritten: 'question reformulée',
    candidates:'candidats BM25 + dense',
    fused:     'rangs fusionnés (RRF)',
    topk:      'top-k reranké',
    rights:    'droits vérifiés',
    prompt:    'contexte assemblé',
    answer:    'réponse générée',
    cited:     'réponse citée',
    safe:      'réponse vérifiée',
    logged:    'réponse tracée',
    delivered: 'réponse livrée'
  };

  /* Cargo kinds that live inside the retrieval ring, so the tag can add the
     pass number to them and only them. */
  var LOOP_CARGO = {
    rewritten: 1, candidates: 1, fused: 1, topk: 1, rights: 1
  };

  global.Park = {
    C: C, BOUNDS: BOUNDS, GROUND: GROUND, LOTS: LOTS,
    cargoLabels: CARGO_LABELS, loopCargo: LOOP_CARGO,
    routes: ROUTES, stations: STATIONS,
    stops: STOPS, stopById: STOP_BY_ID,
    buildings: B,
    guests: GUESTS,
    lorryBed: LORRY_BED, lorryLoad: LORRY_LOAD,
    draw: { tree: tree, bush: bush, lamp: lamp, bench: bench, guest: guest,
            truck: truck, lorry: lorry, paperStack: paperStack }
  };
})(window);
