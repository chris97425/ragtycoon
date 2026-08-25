/* park.js — Chapitre 2 : le socle technique (ingestion & monitoring).
   Nouveau parcours isométrique. Les primitives de dessin (hall, sign, glow…)
   sont celles du chapitre 1 ; les bâtiments et le texte sont propres à ce parc. */
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

  /* Acte 1 : le quai des sources jusqu'aux étiquettes, puis la cour de monitoring. */
  var INTAKE = makeRoute([
    [-1, 10],      //  0 gate
    [ 6, 10],      //  1 warehouse
    [15, 10],      //  2 parser
    [24, 10],      //  3 cleaner
    [33, 10],      //  4 enricher
    [42, 10],      //  5 orch
    [51, 10],      //  6 isolate
    [57, 10],      //  7 corner
    [57, 15],      //  8
    [51, 17.5],    //  9 dedup
    [42, 17.5],    // 10 format
    [33, 17.5],    // 11 chunker
    [24, 17.5],    // 12 embed
    [15, 17.5],    // 13 vector
    [ 8, 17.5],    // 14 filter
    [ 8, 21],      // 15
    [16, 21]       // 16 into the monitoring ring
  ]);

  /* Cour de monitoring. Chaque tour est une passe de reprise / supervision. */
  var LOOP = makeRoute([
    [16, 21],      //  0 entry
    [20, 22.5],    //  1 logs
    [30, 22.5],    //  2 dash
    [40, 22.5],    //  3 rights
    [45, 23],      //  4
    [48, 26],      //  5
    [47, 30],      //  6
    [43, 33],      //  7
    [36, 33],      //  8
    [28, 33],      //  9
    [21, 33],      // 10
    [16, 32],      // 11
    [13, 29],      // 12
    [13, 25],      // 13 loopct (reprises)
    [16, 21]       // 14 back
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
      station(INTAKE, 3, 'cleaner', 1.5), station(INTAKE, 4, 'enricher', 1.5),
      station(INTAKE, 5, 'orch', 1.5), station(INTAKE, 6, 'isolate', 1.4),
      station(INTAKE, 9, 'dedup', 1.4), station(INTAKE, 10, 'format', 1.4),
      station(INTAKE, 11, 'chunker', 1.6), station(INTAKE, 12, 'embed', 1.5),
      station(INTAKE, 13, 'vector', 1.6), station(INTAKE, 14, 'filter', 1.4)
    ],
    loop: [
      station(LOOP, 1, 'logs', 1.5), station(LOOP, 2, 'dash', 1.6),
      station(LOOP, 3, 'rights', 1.5), station(LOOP, 13, 'loopct', 1.5)
    ],
    exit: [
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

  /* ---- the eighteen stops -------------------------------------------------- */

  var STOPS = [
    { id: 'warehouse', name: 'Quai des sources', act: 1, tag: 'Ingestion', x: 6, y: 10, r: 5,
      short: 'Les documents arrivent par SFTP, bases SQL, API ou scraping, avec une empreinte dès la réception.',
      body: 'Le socle commence par les sources de vérité, pas par le modèle. Les fichiers débarquent par SFTP, export SQL, API ou scraping. Chaque fichier reçoit une empreinte hash, une taille, un format et un horodatage : c\u2019est le log parsing.entree. L\u2019identifiant vient du chemin, de la version et du propriétaire. Une mise à jour remplace la version correspondante ; une ingestion seulement additive crée des fantômes documentaires.',
      tip: 'Décidez d\u2019abord qui publie le document, quelle version est en vigueur, comment une suppression se propage, et qui peut le lire. Un répertoire non gouverné contient souvent deux politiques contradictoires.' },

    { id: 'parser', name: 'Parseur', act: 1, tag: 'Ingestion', x: 15, y: 10, r: 5,
      short: 'Chaque format devient du texte, sans perdre titres, sections ni pages.',
      body: 'Le parseur uniformise la sortie : le PDF devient du texte, le scan passe par l\u2019OCR, le tableur devient des lignes, le wiki devient du texte simple. Les titres, sections et pages restent reliés à la source pour citer et vérifier. Le log parsing.resultat note succès ou échec, pages extraites, durée et erreurs OCR.',
      tip: 'Un PDF est un format de mise en page, pas une suite sémantique. Distinguez titres, listes, tableaux et notes. Versionnez le parseur : un changement silencieux casse les citations.' },

    { id: 'cleaner', name: 'Nettoyeur', act: 1, tag: 'Ingestion', x: 24, y: 10, r: 5,
      short: 'Enlever le bruit : en-têtes, pieds de page, coquilles OCR, tableaux cassés.',
      body: 'Les en-têtes et pieds de page se répètent, les numéros polluent, l\u2019OCR laisse des coquilles, les tableaux cassent. Le nettoyeur supprime ce bruit et normalise UTF-8, espaces et langue. cleaning.normalisation compte le bruit retiré ; cleaning.anomalies signale les tableaux cassés et les encodages aberrants.',
      tip: 'Le bruit empoisonne les embeddings : un chunk qui contient Page 12 — Rapport annuel rapproche des documents qui n\u2019ont rien à voir. Isolez les anomalies au lieu de les fondre dans le corpus.' },

    { id: 'enricher', name: 'Enrichisseur', act: 1, tag: 'Ingestion', x: 33, y: 10, r: 5,
      short: 'Chaque unité reçoit ses métadonnées : source, date, titre, section, type.',
      body: 'Les métadonnées voyagent avec le texte : document d\u2019origine, date, auteur, titre, chemin de section, type. Le titre de section peut être préfixé pour donner le contexte. enrichissement.metadonnees journalise ces ajouts ; enrichissement.echecs signale les mappings manquants et les sections orphelines.',
      tip: 'Un chunk sans métadonnées est une réponse sans source. Date d\u2019effet et statut dominent souvent le score textuel : une procédure obsolète peut être dangereuse même si elle est très pertinente.' },

    { id: 'orch', name: 'Orchestrateur', act: 1, tag: 'Ingestion', x: 42, y: 10, r: 5,
      short: 'Le flux a un chef d\u2019orchestre : files, ordre des étapes, reprises, quarantaine.',
      body: 'L\u2019orchestration est transversale : elle enchaîne parsing, nettoyage, enrichissement, dédoublonnage, puis le reste. Elle gère les files, l\u2019idempotence, les timeouts et les reprises. Une frontière de production exige aussi la suppression et la fraîcheur : retirer un document doit retirer chunks et vecteurs dérivés.',
      tip: 'Une durée totale sans spans ne dit pas si la régression vient du parseur, de l\u2019embedding ou de l\u2019index. Tracez chaque étape. Quarantainez un fichier plutôt que d\u2019avaler un échec silencieux.' },

    { id: 'isolate', name: 'Quarantaine', act: 1, tag: 'Ingestion', x: 51, y: 10, r: 5,
      short: 'Les fichiers illisibles, incomplets ou suspects sont écartés, pas indexés.',
      body: 'Un parseur qui échoue, un OCR illisible, des métadonnées incomplètes : ces objets ne doivent pas entrer dans l\u2019index. La quarantaine les retient avec la cause, la version du parseur et le hash d\u2019origine. On peut relancer après correction, sans recréer des fantômes.',
      tip: 'Mesurez le taux d\u2019échec par format et par source. Un connecteur SFTP qui dérive se voit d\u2019abord ici, pas dans les réponses du modèle.' },

    { id: 'dedup', name: 'Dédoublonneur', act: 1, tag: 'Ingestion', x: 51, y: 17.5, r: 5,
      short: 'Repérer copies et quasi-copies, décider fusion ou écart, garder un ID stable.',
      body: 'Le même document existe souvent en double : importé deux fois, exporté sous deux noms, brouillon et finale. L\u2019empreinte du contenu détecte copies et quasi-copies. Le log dedoublonnage.doublons enregistre la décision et l\u2019identifiant stable attribué. Sans cet ID, l\u2019audit et les mises à jour deviennent impossibles.',
      tip: 'Mesurez aussi les doublons dans le top-k après découpe : le chevauchement crée des jumeaux presque identiques. Un ID stable permet de remplacer une version sans laisser de fantômes.' },

    { id: 'format', name: 'Format commun', act: 1, tag: 'Ingestion', x: 42, y: 17.5, r: 5,
      short: 'Tout le flux converge vers un markdown commun, avant le découpage.',
      body: 'Le board impose un common format markdown : une fois parsés et nettoyés, PDF, tableurs et wikis deviennent la même matière. Titres, listes et coordonnées de section restent visibles. C\u2019est ce contrat qui rend le chunking comparable d\u2019une source à l\u2019autre — documents, exports SQL ou pages scrapées.',
      tip: 'Si chaque connecteur invente son propre format, le découpage et les filtres deviennent incomparables. Uniformisez d\u2019abord, découpez ensuite.' },

    { id: 'chunker', name: 'Découpeuse', act: 1, tag: 'Ingestion', x: 33, y: 17.5, r: 5,
      short: 'Découper en unités récupérables, en conservant les coordonnées.',
      body: 'Le texte est découpé en fenêtres de 90 mots avec 15 mots de chevauchement — une baseline reproductible, sans dépendre du tokenizer. Chaque chunk conserve document_id, uri, position, début et fin. chunking.generation note le nombre, la taille et la stratégie ; chunking.qualite signale les hors-norme trop courts ou trop longs.',
      tip: 'Une taille fixe est une baseline. Une stratégie par titre ou section conserve davantage de sens. Ne choisissez pas un pourcentage d\u2019overlap par habitude : mesurez les doublons dans le top-k.' },

    { id: 'embed', name: 'Studio d\u2019embedding', act: 1, tag: 'Ingestion', x: 24, y: 17.5, r: 5,
      short: 'Chaque chunk devient un vecteur, avec le même modèle qu\u2019à la requête.',
      body: 'Un modèle convertit chaque chunk en un vecteur — typiquement 1536 dimensions. Deux chunks proches veulent dire proches par le sens. embedding.generation journalise le nombre de vecteurs, le modèle, les dimensions, la latence et les échecs. Un chunk trop long doit échouer clairement : une troncature silencieuse peut supprimer la phrase à retrouver.',
      tip: 'Invariant : le même modèle à l\u2019indexation et à la question. Changer de modèle sans réindexer place les anciens chunks et les nouvelles questions dans des espaces incompatibles.' },

    { id: 'vector', name: 'Base vectorielle', act: 1, tag: 'Ingestion', x: 15, y: 17.5, r: 5,
      short: 'Stocker les vecteurs : tags de sensibilité, données internes ou publiques, RLS.',
      body: 'Les vecteurs sont indexés (HNSW) dans pgvector, Qdrant, Milvus ou un moteur SQL plus vecteurs. stockage.ecriture compte le volume indexé et les erreurs. Le board exige dès le stockage les tags Sensitivity, Internal ou Public Data, User Access Levels, Technicality, et le RLS. Une reconstruction se fait hors ligne, derrière un alias de version.',
      tip: 'Déjà sur PostgreSQL ? pgvector suffit souvent. Filtres riches ? Qdrant. SQL et vecteurs dans le même nœud ? Spice.ai. Analysez les capacités d\u2019ACL du moteur, ne les supposez pas.' },

    { id: 'filter', name: 'Étiquettes et RLS', act: 1, tag: 'Ingestion', x: 8, y: 17.5, r: 5,
      short: 'Les tags et le RLS sont posés avant toute recherche, dans les deux index.',
      body: 'Sensitivity, technicality, tenant, date d\u2019effet : ces étiquettes voyagent avec chaque chunk. Elles s\u2019appliquent au lexical ET au vectoriel avant la fusion. Un document interne ne doit jamais apparaître, même une milliseconde, dans une liste de candidats publics.',
      tip: 'Un filtrage seulement après la recherche vectorielle peut faire fuiter l\u2019existence d\u2019un document. Les capacités du moteur de stockage doivent être analysées, pas supposées.' },

    { id: 'logs', name: 'Salle des logs', act: 2, tag: 'Monitoring', x: 20, y: 22.5, r: 4.5,
      short: 'Quatorze journaux couvrent chaque étape, de parsing.entree à stockage.acces.',
      body: 'Le registre du Data Flow compte 14 logs. parsing.entree et parsing.resultat pour l\u2019arrivée et l\u2019extraction. cleaning.normalisation et cleaning.anomalies pour le bruit. enrichissement.metadonnees et enrichissement.echecs pour les tags. dedoublonnage.doublons, chunking.generation, chunking.qualite, embedding.generation, stockage.ecriture et stockage.acces. Chaque log a un usage : monitoring, audit, sécurité ou debug.',
      tip: 'Sans ces journaux, on ne sait pas si une mauvaise réponse vient d\u2019un OCR raté, d\u2019un doublon ou d\u2019un droit mal posé. Nommez-les avant d\u2019écrire le premier connecteur.' },

    { id: 'dash', name: 'Tableau de bord', act: 2, tag: 'Monitoring', x: 30, y: 22.5, r: 4.5,
      short: 'TTFT, débit, tokens, succès du pipeline, alertes de seuil.',
      body: 'global.performance suit le TTFT moyen, les requêtes par minute, les tokens consommés et le modèle le plus exploité. global.pipeline suit début, fin, durée, taux de succès et reprises de chaque exécution d\u2019ingestion. Les seuils déclenchent une alerte avant que le corpus ne pourrisse en silence.',
      tip: 'Évaluez avant d\u2019optimiser : un hit rate sur un petit jeu étiqueté vaut mieux qu\u2019un nouveau reranker improvisé. Une alerte sans runbook n\u2019est qu\u2019un voyant allumé.' },

    { id: 'rights', name: 'Contrôle des accès', act: 2, tag: 'Monitoring', x: 40, y: 22.5, r: 4.5,
      short: 'Authentification, RLS, ReBAC : pré-filtrer avant la recherche, post-filtrer le top.',
      body: 'L\u2019identité authentifie ; le RLS et le ReBAC autorisent. Le pré-filtre demande LookupResources puis restreint les deux index. Le post-filtre appelle CheckPermission sur le top-k. stockage.acces journalise utilisateur, ressource, décision et tentatives refusées, avec alerte de seuil par tenant.',
      tip: 'Un chunk confidentiel dans le prompt est déjà une fuite, même si la réponse ne le répète pas. Les caches doivent être partitionnés par tenant. Keycloak identifie ; SpiceDB ou OpenFGA décident document par document.' },

    { id: 'loopct', name: 'Atelier des reprises', act: 2, tag: 'Monitoring', x: 13, y: 25, r: 4.5,
      short: 'Chaque exécution du pipeline se compte : succès, échec, relance bornée.',
      body: 'Le chariot refait trois passes de la cour de monitoring pour montrer les reprises. global.pipeline enregistre début, fin, durée et cause de relance. Une reprise est bornée : même fichier, même hash, même version de parseur. Sans cette borne, un connecteur malade relance à l\u2019infini.',
      tip: 'L\u2019état d\u2019une reprise doit contenir la tentative, la cause et la raison d\u2019arrêt. Comparez le gain au coût : une boucle sans mesure n\u2019ajoute que de la variance.' },

    { id: 'dock', name: 'Quai d\u2019audit', act: 2, tag: 'Monitoring', x: 56.6, y: 42.2, r: 5,
      short: 'Tout est rejouable : document, chunk, décision de dédoublonnage, accès.',
      body: 'L\u2019audit relie hash d\u2019entrée, version du parseur, métadonnées, décision de doublon, identifiants de chunks et accès. Les traces masquent les contenus tout en gardant les identifiants. On rejoue une ingestion des semaines plus tard pour savoir pourquoi un passage a été retenu ou écarté.',
      tip: 'Sans journal, impossible de diagnostiquer. Conservez score, rang, identifiant de chunk et version source. C\u2019est la mémoire du socle, pas un luxe.' },

    { id: 'eval', name: 'Centre de supervision', act: 2, tag: 'Monitoring', x: 56, y: 24, r: 6,
      short: 'SLO, alertes et amélioration continue : la boucle qui pilote le socle.',
      body: 'La tour lit les 14 logs et les SLO : fraîcheur du corpus, taux d\u2019échec de parsing, latence d\u2019embedding, refus d\u2019accès, hit rate sur un jeu étiqueté. Les scores guident les réglages : taille de chunk, modèle, seuils, runbooks. C\u2019est ici que le socle s\u2019améliore, avant d\u2019optimiser la recherche.',
      tip: 'Un assistant d\u2019exploitation et un service multi-tenant n\u2019ont pas le même risque. Les runbooks de plateforme exigent date d\u2019effet et confirmation avant toute action. Supervisez le socle comme on supervise une usine, pas comme on admire un démo.' }
  ];

  var STOP_BY_ID = {};
  STOPS.forEach(function (s) { STOP_BY_ID[s.id] = s; });

  /* Reading stops are scaled to how much there is to read. When a narration
     exists for the stop, the first visit also covers the audio duration. */
  var AUDIO_DUR = {};
  function readSeconds(id) {
    var s = STOP_BY_ID[id];
    var base = s ? Math.min(22, Math.max(10, (s.short + ' ' + s.body + ' ' + s.tip).split(/\s+/).length / 4.4 + 3)) : 8;
    var audio = AUDIO_DUR[id] || 0;
    return Math.max(base, Math.ceil(audio) + 2);
  }
  Object.keys(STATIONS).forEach(function (r) {
    STATIONS[r].forEach(function (st) { st.read = readSeconds(st.id); });
  });

  /* ---- ground ------------------------------------------------------------ */

  var BOUNDS = { x0: -4, y0: 2, x1: 69, y1: 49 };
  var GROUND = { x0: -420, y0: -400, x1: 470, y1: 460 };

  /* Paved lots under each cluster of buildings. */
  var LOTS = [
    { x: 2.0, y: 3.4, w: 8.0, d: 6.2, c: C.sand },
    { x: 11.0, y: 3.4, w: 8.0, d: 6.2, c: C.slab },
    { x: 20.0, y: 3.4, w: 8.0, d: 6.2, c: C.slab },
    { x: 29.0, y: 3.4, w: 8.0, d: 6.2, c: C.floor },
    { x: 38.0, y: 3.4, w: 8.0, d: 6.2, c: C.floor },
    { x: 47.0, y: 3.4, w: 8.0, d: 6.2, c: C.floor },
    { x: 2.0, y: 11.6, w: 8.4, d: 5.2, c: C.slab },
    { x: 11.0, y: 11.6, w: 8.4, d: 5.2, c: C.floor },
    { x: 20.0, y: 11.6, w: 8.4, d: 5.2, c: C.floor },
    { x: 29.0, y: 11.6, w: 8.4, d: 5.2, c: C.floor },
    { x: 38.0, y: 11.6, w: 8.4, d: 5.2, c: C.floor },
    { x: 47.0, y: 11.6, w: 8.4, d: 5.2, c: C.floor },
    { x: 15.6, y: 17.6, w: 8.8, d: 4.2, c: C.floor },
    { x: 25.8, y: 17.6, w: 8.8, d: 4.2, c: C.floor },
    { x: 35.4, y: 16.8, w: 9.0, d: 4.8, c: C.floor },
    { x: 6.2, y: 21.6, w: 6.8, d: 6.8, c: C.slab },
    { x: 50.2, y: 18.2, w: 10.4, d: 7.4, c: C.floor },
    { x: 50.6, y: 25.6, w: 11.4, d: 4.4, c: C.slab },
    { x: 12.0, y: 38.6, w: 48.0, d: 6.4, c: C.slab },
    { x: 53.4, y: 39.8, w: 6.4, d: 5.2, c: C.sand },
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

  /* --- bâtiments du socle : chaque arrêt a un hall identifiable ---------- */

  function racks(ctx, x, y, n, t, c) {
    for (var i = 0; i < n; i++) {
      Iso.box(ctx, { x: x + i * 1.15, y: y, w: 0.95, d: 2.1, h: 1.7, color: c || '#5b6470' });
      for (var r = 0; r < 4; r++) {
        ctx.fillStyle = (Math.sin((t || 0) * 5 + i * 2 + r) > -0.2) ? '#34d399' : '#1f5c4a';
        faceRect(ctx, y + 2.1, x + i * 1.15 + 0.12, 0.3 + r * 0.34, x + i * 1.15 + 0.82, 0.5 + r * 0.34);
      }
    }
  }

  add({ id: 'warehouse', x: 2.2, y: 3.6, w: 7.6, d: 5.6, draw: function (ctx, b, t) {
    /* Hangar du quai : toiture brique, rampe et conteneurs SFTP / API / SQL. */
    Iso.box(ctx, { x: b.x + 0.3, y: b.y + 0.3, w: 7.0, d: 3.4, h: 2.1, color: '#aeb8c4' });
    Iso.gable(ctx, { x: b.x + 0.3, y: b.y + 0.3, z: 2.1, w: 7.0, d: 3.4, h: 1.05, color: C.brick });
    Iso.box(ctx, { x: b.x + 0.4, y: b.y + 3.7, w: 2.6, d: 1.6, h: 0.16, color: C.slab });
    Iso.box(ctx, { x: b.x + 0.6, y: b.y + 3.85, z: 0.16, w: 2.2, d: 1.3, h: 0.14, color: '#8a97a5' });
    Iso.box(ctx, { x: b.x + 3.2, y: b.y + 3.7, w: 1.4, d: 1.5, h: 1.15, color: '#c9793f' });
    Iso.box(ctx, { x: b.x + 4.7, y: b.y + 3.7, w: 1.4, d: 1.5, h: 1.15, color: '#3f7fd4' });
    Iso.box(ctx, { x: b.x + 6.1, y: b.y + 3.75, z: 0, w: 1.2, d: 1.4, h: 0.95, color: '#3fb5a0' });
    paperStack(ctx, b.x + 1.1, b.y + 5.2, 0, 5, '#e3dcc8');
    sign(ctx, b.x + 3.8, b.y + 3.7, 2.25, 'SFTP', C.gold);
    chimney(ctx, b.x + 6.4, b.y + 0.55, 2.1, 1.0, t);
  }});

  add({ id: 'parser', x: 11.4, y: 3.8, w: 7.2, d: 5.4, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.4, b.y + 0.4, 6.2, 4.2, 1.6, C.steel, '#5b6470', { windows: 4, winT: t, sign: 'OCR' });
    var k = (t * 0.4) % 1;
    Iso.box(ctx, { x: b.x + 1.2 + k * 3.2, y: b.y + 2.2, z: 1.6, w: 1.4, d: 1.0, h: 0.1, color: C.paper });
    machine(ctx, b.x + 5.0, b.y + 3.4, 1.5, 1.5, 1.1, '#7fb3d4', t, 1);
  }});

  add({ id: 'cleaner', x: 20.2, y: 3.8, w: 7.6, d: 5.4, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.4, b.y + 0.4, 6.6, 4.4, 1.8, '#dfe7ee', C.blue, { windows: 5, winT: t, sign: 'PROPRE' });
    machine(ctx, b.x + 1.0, b.y + 3.8, 2.0, 1.5, 1.1, '#7fb3d4', t, 2);
  }});

  add({ id: 'enricher', x: 29.2, y: 3.8, w: 7.6, d: 5.4, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.4, b.y + 0.4, 6.6, 4.4, 1.6, '#a8b4c0', '#8a97a5', { windows: 4, winT: t, sign: 'META' });
    Iso.box(ctx, { x: b.x + 0.8, y: b.y + 2.2, w: 5.8, d: 1.2, h: 0.25, color: '#39424e' });
    var k = (t * 0.45) % 1;
    for (var i = 0; i < 3; i++) {
      var ck = ((k + i * 0.25) % 1);
      Iso.box(ctx, { x: b.x + 1.2 + ck * 4.2, y: b.y + 2.4, z: 1.6, w: 0.5, d: 0.4, h: 0.28, color: C.gold });
    }
  }});

  add({ id: 'orch', x: 38.2, y: 3.8, w: 7.6, d: 5.4, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.3, b.y + 0.3, 7.0, 4.6, 2.0, '#c4ccd4', C.dark, { windows: 5, winT: t, sign: 'ORCH' });
    racks(ctx, b.x + 1.0, b.y + 1.2, 4, t, '#5b6470');
  }});

  add({ id: 'isolate', x: 47.2, y: 3.8, w: 7.6, d: 5.4, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.3, b.y + 0.3, 7.0, 4.6, 1.8, '#f4e0d8', C.red, { windows: 4, winT: t, sign: 'STOP' });
    Iso.box(ctx, { x: b.x + 2.4, y: b.y + 2.0, w: 2.6, d: 2.2, h: 1.4, color: '#c8453a' });
    glow(ctx, b.x + 3.7, b.y + 3.1, 1.5, 0.8, t, 'rgba(200,69,58,0.45)', 'rgba(255,180,160,0.2)');
  }});

  add({ id: 'dedup', x: 47.2, y: 11.8, w: 7.6, d: 4.8, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.3, b.y + 0.3, 7.0, 4.0, 1.5, C.steel, '#8a97a5', { sign: 'ID' });
    var fp = Iso.project(b.x + 4.0, b.y + 1.6, 1.6);
    ctx.strokeStyle = '#4fd0c0'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(fp.x, fp.y, 8, 0, 6.2832); ctx.stroke();
    glow(ctx, b.x + 4.0, b.y + 1.6, 1.62, 0.6, t, 'rgba(79,208,192,0.45)', 'rgba(79,208,192,0.15)');
  }});

  add({ id: 'format', x: 38.2, y: 11.8, w: 7.6, d: 4.8, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.3, b.y + 0.3, 7.0, 4.0, 1.6, '#f0ead8', '#a8563f', { windows: 4, winT: t, sign: 'MD' });
    sheet(ctx, b.x + 2.2, b.y + 2.2, 0.2, 1.2, 1.1, C.paper);
    sheet(ctx, b.x + 3.8, b.y + 2.4, 0.2, 1.2, 1.1, '#e8e2d2');
  }});

  add({ id: 'chunker', x: 29.2, y: 11.8, w: 7.6, d: 4.8, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: b.x + 0.3, y: b.y + 0.3, w: 7.0, d: 4.0, h: 0.9, color: C.dark });
    Iso.box(ctx, { x: b.x + 2.4, y: b.y + 0.8, w: 1.2, d: 2.8, h: 1.5, color: '#5b6470' });
    var cols = ['#3f7fd4', '#9a5fd0', '#c9793f', '#3fb5a0'];
    var k = (t * 0.5) % 1;
    for (var i = 0; i < 4; i++) {
      Iso.box(ctx, { x: b.x + 4.0 + ((k + i * 0.2) % 1) * 2.2, y: b.y + 2.2, z: 0.9, w: 0.45, d: 0.4, h: 0.28, color: cols[i] });
    }
    sign(ctx, b.x + 5.6, b.y + 4.3, 1.0, '90 MOTS', C.gold);
  }});

  add({ id: 'embed', x: 20.2, y: 11.8, w: 7.6, d: 4.8, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.2, b.y + 0.2, 7.2, 4.2, 2.0, '#e5eaf0', '#4d7fb5', { windows: 5, winT: t });
    for (var i = 0; i < 3; i++) Iso.cylinder(ctx, { x: b.x + 1.8 + i * 1.8, y: b.y + 2.4, r: 0.5, h: 1.3, color: '#7fb3d4' });
    docScreen(ctx, b.x + 5.6, b.y + 1.0, 1.6, 36, 22, t, 3, '#22d3ee');
  }});

  add({ id: 'vector', x: 11.4, y: 11.8, w: 7.6, d: 4.8, draw: function (ctx, b, t) {
    Iso.box(ctx, { x: b.x + 0.2, y: b.y + 0.2, w: 7.2, d: 4.2, h: 2.2, color: '#dfe6ec', top: '#c3ccd6' });
    racks(ctx, b.x + 1.0, b.y + 1.0, 5, t);
    sign(ctx, b.x + 5.8, b.y + 4.4, 2.3, 'HNSW', '#34d399');
  }});

  add({ id: 'filter', x: 2.4, y: 11.8, w: 7.6, d: 4.8, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.2, b.y + 0.2, 7.2, 4.2, 1.8, '#eef4f9', '#7a6ba8', { windows: 4, winT: t, sign: 'TAGS' });
    for (var i = 0; i < 3; i++) {
      var open = Math.sin(t * 2 + i * 2) > 0;
      Iso.box(ctx, { x: b.x + 1.4 + i * 1.8, y: b.y + 3.4, w: 0.4, d: 0.4, h: 1.2, color: '#5f6b78' });
      Iso.box(ctx, { x: b.x + 1.7 + i * 1.8, y: b.y + 3.4, w: open ? 0.8 : 0.1, d: 0.25, h: 0.8, z: 0.3, color: C.gold });
    }
  }});

  add({ id: 'logs', x: 16.0, y: 17.9, w: 8.0, d: 3.7, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.2, b.y + 0.15, 7.6, 3.3, 1.8, '#16324a', C.dark, { sign: '14 LOGS', signC: C.cyan });
    for (var i = 0; i < 4; i++) {
      docScreen(ctx, b.x + 1.2 + i * 1.7, b.y + 1.2, 1.15, 28, 16, t + i * 0.4, 4, '#4fd0c0');
    }
  }});

  add({ id: 'dash', x: 26.4, y: 17.9, w: 8.0, d: 3.7, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.2, b.y + 0.15, 7.6, 3.3, 1.8, '#e8eef4', C.blue, { sign: 'TTFT' });
    for (var i = 0; i < 4; i++) {
      var hgt = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.1));
      Iso.box(ctx, { x: b.x + 1.3 + i * 1.5, y: b.y + 1.5, z: 0.2, w: 1.05, d: 1.15, h: hgt,
                     color: i === 0 ? C.gold : (i === 3 ? C.teal : '#7fb3d4') });
    }
    Iso.cylinder(ctx, { x: b.x + 6.6, y: b.y + 2.4, r: 0.42, h: 0.35, color: C.gold });
  }});

  add({ id: 'rights', x: 36.0, y: 17.0, w: 8.0, d: 4.2, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.2, b.y + 0.2, 7.6, 3.6, 1.7, '#eef4f9', '#c6d3de', { sign: 'ReBAC' });
    var lp = Iso.project(b.x + 4.0, b.y + 2.2, 1.9);
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(lp.x, lp.y, 7, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#22303f'; ctx.fillRect(lp.x - 2, lp.y - 2, 4, 6);
  }});

  add({ id: 'loopct', x: 6.4, y: 21.8, w: 6.4, d: 6.4, draw: function (ctx, b, t, W) {
    Iso.box(ctx, { x: b.x + 0.6, y: b.y + 0.6, w: 3.4, d: 3.0, h: 2.0, color: '#c4ccd4' });
    Iso.gable(ctx, { x: b.x + 0.6, y: b.y + 0.6, z: 2.0, w: 3.4, d: 3.0, h: 1.1, color: C.gold });
    var p = Iso.project(b.x + 2.3, b.y + 3.6, 2.2);
    ctx.fillStyle = '#2a1e12'; ctx.fillRect(p.x - 34, p.y - 26, 68, 26);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(p.x - 34, p.y - 26, 68, 26);
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('RUN ' + ((W && W.lap) || 1), p.x, p.y - 13);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }});

  add({ id: 'dock', x: 53.6, y: 40.0, w: 5.8, d: 4.8, draw: function (ctx, b, t) {
    hall(ctx, b.x + 0.3, b.y + 0.4, 2.6, 2.4, 1.5, '#e8eef4', C.brick);
    docScreen(ctx, b.x + 1.6, b.y + 1.6, 1.3, 32, 20, t, 4, '#4fd0c0');
    truck(ctx, b.x + 0.5, b.y + 3.3, C.red);
  }});

  add({ id: 'eval', x: 50.6, y: 18.6, w: 9.6, d: 6.6, draw: function (ctx, b, t, W) {
    Iso.box(ctx, { x: b.x + 0.4, y: b.y + 0.4, w: 8.8, d: 5.6, h: 3.4, color: '#dfe6ec', top: '#c3ccd6' });
    Iso.box(ctx, { x: b.x + 3.5, y: b.y + 1.9, z: 3.4, w: 1.8, d: 1.8, h: 1.8, color: '#4d7fb5' });
    Iso.box(ctx, { x: b.x + 3.9, y: b.y + 2.3, z: 5.2, w: 1.0, d: 1.0, h: 0.7, color: C.gold });
    glow(ctx, b.x + 4.4, b.y + 2.8, 6.0, 1.15, t, '#7fd4e8', '#ffffff');
    var full = Math.min(6, ((W && W.racks) || 0) * 2);
    sign(ctx, b.x + 8.0, b.y + 6.0, 3.3, full > 0 ? 'SLO OK' : 'EN VEILLE', full > 0 ? '#4fe0b8' : '#6b7784');
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

  /* lamp halo is a baked sprite: a radial gradient per lamp per frame was
     pure waste, dozens of lamps line the roads */
  var lampHalo = null;
  function lamp(ctx, x, y) {
    Iso.cylinder(ctx, { x: x, y: y, r: 0.1, h: 2.4, color: '#4a5568', edge: false });
    var p = Iso.project(x, y, 2.4);
    if (!lampHalo) {
      lampHalo = document.createElement('canvas');
      lampHalo.width = 40; lampHalo.height = 40;
      var hc = lampHalo.getContext('2d');
      var g = hc.createRadialGradient(20, 20, 1, 20, 20, 19);
      g.addColorStop(0, 'rgba(255,233,168,0.55)');
      g.addColorStop(1, 'rgba(255,233,168,0)');
      hc.fillStyle = g;
      hc.beginPath(); hc.arc(20, 20, 19, 0, 6.2832); hc.fill();
    }
    ctx.drawImage(lampHalo, p.x - 20, p.y - 23);
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

  /* ---- document detail animations ----------------------------------------
     Each stop gets a small looping animation shown in the "inside the
     document" panel: exactly what happens to the document at that stop.
     Functions draw in a 2D viewport (w x h px) with t looping over 6 s. */

  function docBox(ctx, x, y, label, c) {
    ctx.fillStyle = c; ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1;
    ctx.fillRect(x, y, 44, 30); ctx.strokeRect(x, y, 44, 30);
    ctx.fillStyle = '#3a4450'; ctx.font = 'bold 8px sans-serif';
    ctx.fillText(label, x + 4, y + 11);
    ctx.strokeStyle = '#b0a48e';
    for (var i = 0; i < 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + 4, y + 17 + i * 5); ctx.lineTo(x + 40, y + 17 + i * 5); ctx.stroke();
    }
  }

  var DETAILS = {

    /* 1 — Entrepôt : les fichiers arrivent, formats hétérogènes. */
    warehouse: function (ctx, w, h, t) {
      ctx.fillStyle = '#e8e2d2'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b9a888'; ctx.fillRect(8, h - 26, w - 16, 7);
      var labels = ['PDF', 'WORD', 'SQL', 'DOC', 'XLS'];
      for (var i = 0; i < 3; i++) docBox(ctx, 14 + i * 14, h - 62 + i * 8, labels[i], '#e3dcc8');
      var k = (t / 1.5) % 1;
      docBox(ctx, w / 2 - 22, 6 + (h - 76) * k, labels[Math.floor(t) % labels.length], '#ffffff');
      ctx.fillStyle = '#6a5c3a'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('fichiers bruts non structurés', 8, 14);
    },

    /* 2 — Parseur : scan → OCR → texte extrait. */
    parser: function (ctx, w, h, t) {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      var k = (t / 2.4) % 1;
      if (k < 0.5) {
        var p = k * 2;
        ctx.fillStyle = '#d8d8d8'; ctx.fillRect(14, 12, 96, 112);
        ctx.fillStyle = 'rgba(90,80,60,0.25)';
        for (var i = 0; i < 24; i++) {
          ctx.fillRect(14 + ((i * 37) % 84), 12 + ((i * 53) % 98), 3, 2);
        }
        ctx.fillStyle = 'rgba(79,208,192,0.7)';
        ctx.fillRect(14, 12 + p * 110, 96, 3);
        ctx.fillStyle = '#3a4450'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('OCR en cours…', 24, 40);
      } else {
        var p2 = (k - 0.5) * 2;
        ctx.fillStyle = '#f4f1e8'; ctx.fillRect(120, 12, w - 132, 112);
        ctx.strokeStyle = '#8a7a5a'; ctx.strokeRect(120, 12, w - 132, 112);
        ctx.fillStyle = '#3a4450'; ctx.font = '8px sans-serif';
        var lines = Math.floor(p2 * 9);
        for (var i2 = 0; i2 < lines; i2++) {
          ctx.fillText('texte extrait — ligne ' + (i2 + 1), 126, 26 + i2 * 11);
        }
        ctx.fillStyle = '#34d399'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('✓ texte + structure (titres, pages)', 126, 28 + lines * 11);
      }
      ctx.fillStyle = '#8a7a5a'; ctx.font = '7px sans-serif';
      ctx.fillText('PDF / scan / tableur → texte propre', 8, h - 6);
    },

    /* 3 — Nettoyeur : les parasites sont barrés. */
    cleaner: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var k = (t / 2.2) % 1;
      ctx.font = '8px sans-serif';
      for (var i = 0; i < 8; i++) {
        var y = 16 + i * 13;
        if (i === 2 || i === 5) {
          ctx.fillStyle = '#c0b8a8';
          ctx.fillText('Page 12 — Rapport annuel', 14, y);
          if (k > 0.55) {
            ctx.strokeStyle = '#c8453a'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(14, y - 4); ctx.lineTo(118, y + 3); ctx.stroke();
          }
        } else {
          ctx.fillStyle = '#3a4450';
          ctx.fillText('contenu utile du document…', 14, y);
        }
      }
      if (k > 0.55) {
        ctx.fillStyle = '#34d399'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText('✓ en-têtes / pieds de page / bruit supprimés', 14, h - 10);
      }
    },

    /* 4 — Découpeuse : le texte se coupe en chunks avec overlap visible. */
    chunker: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var k = (t / 2.4) % 1;
      if (k < 0.35) {
        ctx.fillStyle = '#3a4450'; ctx.font = '8px sans-serif';
        for (var i = 0; i < 8; i++) ctx.fillText('paragraphe du document…', 14, 18 + i * 13);
        var cy = 18 + Math.floor((k / 0.35) * 8) * 13;
        ctx.fillStyle = '#c8453a'; ctx.fillRect(10, cy - 1, 130, 2.5);
      } else {
        var cols = ['#3f7fd4', '#9a5fd0', '#c9793f', '#3fb5a0'];
        var cw = w / 4;
        for (var i2 = 0; i2 < 4; i2++) {
          ctx.fillStyle = cols[i2];
          ctx.fillRect(i2 * cw - 4, 16, cw + 8, 82);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
          ctx.fillText('chunk ' + (i2 + 1), i2 * cw + 6, 34);
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '7px sans-serif';
          ctx.fillText('90 mots · 15 overlap', i2 * cw + 6, 48);
        }
        ctx.strokeStyle = '#2f2113'; ctx.setLineDash([3, 3]);
        for (var i3 = 1; i3 < 4; i3++) {
          ctx.beginPath(); ctx.moveTo(i3 * cw - 4, 16); ctx.lineTo(i3 * cw - 4, 98); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('chevauchement 15 mots — baseline du cours', 6, h - 8);
      }
    },

    /* 5 — Enrichisseur : les métadonnées s'attachent. */
    enricher: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var cols = ['#3f7fd4', '#9a5fd0', '#c9793f'];
      for (var i = 0; i < 3; i++) {
        var x = 16 + i * 88, y = 30;
        ctx.fillStyle = cols[i]; ctx.fillRect(x, y, 66, 40);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('chunk ' + (i + 1), x + 6, y + 15);
        var fall = (t * 1.1 + i * 0.33) % 1;
        ctx.fillStyle = '#f2c14e';
        ctx.fillRect(x - 24, y + fall * 30, 24, 13);
        ctx.fillStyle = '#5c4a10'; ctx.font = 'bold 7px sans-serif';
        ctx.fillText(['SRC', 'DAT', 'SEC'][i], x - 20, y + fall * 30 + 9);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('source · date · section · type · droits', 8, h - 10);
    },

    /* 6 — Dédoublonneur : empreinte → doublon supprimé, ID stable. */
    dedup: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var k = (t / 2.4) % 1;
      if (k < 0.45) {
        docBox(ctx, 16, 22, 'v1', '#d5cdb6');
        docBox(ctx, 96, 22, 'copie', '#d5cdb6');
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('même empreinte ?', 36, 76);
        ctx.strokeStyle = '#4fd0c0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(74, 98, 12, 0, 6.2832); ctx.stroke();
        ctx.beginPath(); ctx.arc(74, 98, 7, 0, 6.2832); ctx.stroke();
        ctx.beginPath(); ctx.arc(74, 98, 3, 0, 6.2832); ctx.stroke();
      } else {
        docBox(ctx, 48, 22, 'unique', '#e3dcc8');
        ctx.fillStyle = '#34d399'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText('✓ doublon supprimé', 22, 74);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText('ID stable : chunk_0001', 14, 98);
        ctx.fillStyle = '#8a7a5a'; ctx.font = '7px sans-serif';
        ctx.fillText('traçable à chaque mise à jour', 14, 112);
      }
    },

    /* 7 — Embedding : le chunk devient un point dans l'espace du sens. */
    embed: function (ctx, w, h, t) {
      ctx.fillStyle = '#0e1a24'; ctx.fillRect(0, 0, w, h);
      var k = (t / 2.4) % 1;
      if (k < 0.45) {
        ctx.fillStyle = '#f4f1e8'; ctx.fillRect(12, 16, 96, 56);
        ctx.strokeStyle = '#8a7a5a'; ctx.strokeRect(12, 16, 96, 56);
        ctx.fillStyle = '#3a4450'; ctx.font = '8px sans-serif';
        ctx.fillText('chunk texte…', 18, 34);
        ctx.fillText('…à convertir', 18, 50);
        var p = k / 0.45;
        ctx.fillStyle = '#22d3ee';
        for (var i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(30 + ((i * 31) % 60), 80 + p * 40 + ((i * 7) % 18), 3.5, 0, 6.2832);
          ctx.fill();
        }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('→ espace vectoriel', 120, 40);
      } else {
        ctx.fillStyle = 'rgba(34,211,238,0.6)';
        for (var i2 = 0; i2 < 44; i2++) {
          ctx.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.5 + i2 * 1.7));
          ctx.beginPath();
          ctx.arc(18 + ((i2 * 37) % 150), 16 + ((i2 * 53) % 100), 2.2, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#f2c14e';
        ctx.beginPath(); ctx.arc(86, 58, 6, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText('le chunk = un point proche des idées voisines', 8, h - 14);
        ctx.fillStyle = '#8fa2b5'; ctx.font = '7px sans-serif';
        ctx.fillText('[0.12, 0.87, …] — typ. 1536 dimensions', 8, h - 3);
      }
    },

    /* 8 — Base vectorielle : insertion dans l'index, recherche < 100 ms. */
    vector: function (ctx, w, h, t) {
      ctx.fillStyle = '#0e1a24'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 3; j++) {
          ctx.fillStyle = (i + j) % 2 ? '#1f5c4a' : '#12312a';
          ctx.fillRect(18 + i * 34, 14 + j * 28, 28, 22);
        }
      }
      var k = (t % 1.2) / 1.2;
      ctx.fillStyle = '#34d399';
      ctx.beginPath(); ctx.arc(18 + k * 170, 14 + ((t * 7) % 60), 4.5, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(52,211,153,0.5)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(52, 40); ctx.lineTo(86, 14);
      ctx.lineTo(120, 40); ctx.lineTo(154, 14); ctx.lineTo(188, 40); ctx.stroke();
      ctx.fillStyle = '#f2c14e'; ctx.font = 'bold 10px sans-serif';
      ctx.fillText('index HNSW — recherche < 100 ms', 14, h - 8);
      ctx.fillStyle = '#8fa2b5'; ctx.font = '7px sans-serif';
      ctx.fillText('millions de chunks', 14, h - 18);
    },

    /* 9 — Filtres : seuls les chunks autorisés passent. */
    filter: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 4; i++) {
        var x = 14 + i * 68;
        var allowed = (i % 2 === 0);
        ctx.fillStyle = allowed ? '#e8f4e8' : '#f4e0d8';
        ctx.fillRect(x, 18, 58, 84);
        ctx.strokeStyle = allowed ? '#2f7a34' : '#a2402f'; ctx.lineWidth = 1;
        ctx.strokeRect(x, 18, 58, 84);
        ctx.fillStyle = '#3a4450'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText('chunk ' + (i + 1), x + 6, 34);
        ctx.fillStyle = allowed ? '#34d399' : '#c8453a';
        ctx.beginPath(); ctx.arc(x + 29, 70, 8, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 26, 62, 6, 6);
        if (!allowed) {
          ctx.strokeStyle = '#8a2f26'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x + 12, 38); ctx.lineTo(x + 46, 92); ctx.stroke();
        }
      }
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('droits : service A ✓ · service B ✗', 8, h - 8);
    },

    /* 10 — Orchestrateur : files, ordre, reprises. */
    orch: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var steps = ['parse', 'clean', 'enrich', 'dedup', 'chunk'];
      var k = Math.floor((t * 0.9) % steps.length);
      for (var i = 0; i < steps.length; i++) {
        ctx.fillStyle = i === k ? '#9a5fd0' : '#d8d0c0';
        ctx.fillRect(10 + i * 60, 28, 52, 36);
        ctx.fillStyle = i === k ? '#fff' : '#3a4450';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(steps[i], 16 + i * 60, 50);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('file · ordre · timeout · reprise bornée', 10, 88);
      ctx.fillStyle = '#8a7a5a'; ctx.font = '8px sans-serif';
      ctx.fillText('une étape échoue → quarantaine, pas un silence', 10, 108);
    },

    /* 11 — Quarantaine : le fichier suspect est écarté. */
    isolate: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      docBox(ctx, 18, 22, 'PDF', '#e3dcc8');
      var k = (t / 2.2) % 1;
      ctx.strokeStyle = '#c8453a'; ctx.lineWidth = 2;
      ctx.strokeRect(14, 16, 54, 44);
      if (k > 0.4) {
        ctx.fillStyle = '#c8453a'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText('STOP — OCR illisible', 80, 36);
        ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
        ctx.fillText('cause · hash · version parseur', 80, 54);
        ctx.fillText('relance possible, sans fantôme', 80, 70);
      }
      ctx.fillStyle = '#8a7a5a'; ctx.font = '8px sans-serif';
      ctx.fillText('taux d\u2019échec par format et par source', 10, h - 10);
    },

    /* 12 — Format commun markdown. */
    format: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var src = ['PDF', 'XLS', 'WIKI', 'SQL'];
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = '#c9d3dd';
        ctx.fillRect(10, 16 + i * 22, 70, 18);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText(src[i], 18, 29 + i * 22);
      }
      var k = Math.min(1, (t % 2.4) / 1.6);
      ctx.fillStyle = '#f0ead8';
      ctx.fillRect(120, 16, 170, 88);
      ctx.strokeStyle = '#a8563f'; ctx.strokeRect(120, 16, 170, 88);
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      if (k > 0.2) ctx.fillText('# titre de section', 128, 36);
      if (k > 0.45) ctx.fillText('- liste conservée', 128, 54);
      if (k > 0.7) ctx.fillText('coordonnées de page', 128, 72);
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('✓ common format markdown', 10, h - 10);
    },

    /* 13 — Salle des logs : les 14 journaux. */
    logs: function (ctx, w, h, t) {
      ctx.fillStyle = '#0e1a24'; ctx.fillRect(0, 0, w, h);
      var names = [
        'parsing.entree', 'parsing.resultat', 'cleaning.normalisation',
        'cleaning.anomalies', 'enrichissement.metadonnees', 'dedoublonnage.doublons',
        'chunking.generation', 'embedding.generation', 'stockage.ecriture',
        'stockage.acces', 'global.performance', 'global.pipeline'
      ];
      ctx.font = '7px monospace';
      for (var i = 0; i < names.length; i++) {
        var off = ((t * 1.4 + i / names.length) % 1);
        ctx.globalAlpha = 0.25 + 0.75 * off;
        ctx.fillStyle = i % 2 ? '#4fd0c0' : '#93c5fd';
        ctx.fillText(names[i], 10, 16 + i * 12);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 8px sans-serif';
      ctx.fillText('14 logs — monitoring · audit · sécurité · debug', 8, h - 8);
    },

    /* 14 — Tableau de bord : TTFT, débit, succès. */
    dash: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var metrics = [['TTFT', 0.72], ['req/min', 0.58], ['succès', 0.91], ['reprises', 0.22]];
      for (var i = 0; i < 4; i++) {
        var x = 12 + i * 76;
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText(metrics[i][0], x, 22);
        ctx.fillStyle = '#e0dcc8'; ctx.fillRect(x, 30, 64, 70);
        var v = Math.min(1, (t / 1.8) * 1.1) * metrics[i][1];
        ctx.fillStyle = i === 3 ? '#c9793f' : '#34d399';
        ctx.fillRect(x, 100 - 70 * v, 64, 70 * v);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 8px sans-serif';
      ctx.fillText('global.performance + global.pipeline — alerte de seuil', 8, h - 8);
    },

    /* 15 — Contrôle des droits : badges et vérification finale. */
    rights: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var k = (t / 2.4) % 1;
      for (var i = 0; i < 3; i++) {
        var x = 14 + i * 86;
        var ok = i < 2;
        ctx.fillStyle = ok ? '#e8f4e8' : '#f4e0d8';
        ctx.fillRect(x, 18, 76, 76);
        ctx.strokeStyle = ok ? '#2f7a34' : '#a2402f'; ctx.lineWidth = 1;
        ctx.strokeRect(x, 18, 76, 76);
        ctx.fillStyle = '#3a4450'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText('chunk ' + (i + 1), x + 6, 34);
        ctx.fillStyle = '#2f2113'; ctx.font = '7px sans-serif';
        ctx.fillText('équipe A', x + 6, 48);
        ctx.fillStyle = ok ? '#34d399' : '#c8453a';
        ctx.fillRect(x + 22, 58, 32, 18);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText(ok ? 'OK' : 'NON', x + 26, 71);
      }
      if (k > 0.55) {
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('chunk 3 exclu — non autorisé pour cet utilisateur', 8, h - 8);
      }
    },

    /* 16 — Compteur de boucle : la passe en cours. */
    loopct: function (ctx, w, h, t) {
      ctx.fillStyle = '#2a1e12'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, w, h);
      ctx.fillStyle = '#f2c14e'; ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RUN ' + (Math.floor(t / 2) % 3 + 1), w / 2, h / 2 - 8);
      ctx.font = '10px sans-serif';
      ctx.fillText('reprise bornée du pipeline…', w / 2, h / 2 + 14);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#22d3ee';
      for (var i = 0; i < 3; i++) {
        var a = t * 2 + i * 2.1;
        ctx.beginPath();
        ctx.arc(w / 2 + Math.cos(a) * 46, h / 2 + 30 + Math.sin(a) * 12, 4, 0, 6.2832);
        ctx.fill();
      }
    },

    /* 17 — Quai d'audit : le dossier est rejouable. */
    dock: function (ctx, w, h, t) {
      ctx.fillStyle = '#0e1a24'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#4fd0c0'; ctx.font = '7px monospace';
      var logs = [
        'hash a3f2…  parsing.entree ok',
        'parseur v12  14 pages extraites',
        'doublon : fusion → id stable',
        'chunk retours#c0  0–90 mots',
        'embedding bge-m3  1024 dim',
        'stockage.ecriture  indexé',
        'stockage.acces  RLS allow',
        'rejeu possible dans 30 jours'
      ];
      for (var i = 0; i < logs.length; i++) {
        var off = ((t * 1.6 + i / logs.length) % 1);
        ctx.globalAlpha = 0.2 + 0.8 * off;
        ctx.fillText(logs[i], 8, 14 + i * 13);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('audit — document, chunk, décision, accès', 8, h - 6);
    },

    /* 18 — Centre de supervision : SLO et alertes. */
    eval: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var metrics = [['Fraîcheur', 0.94], ['Parse OK', 0.97], ['Refus', 0.02]];
      for (var i = 0; i < 3; i++) {
        var y = 22 + i * 32;
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText(metrics[i][0], 10, y);
        ctx.fillStyle = '#e0dcc8'; ctx.fillRect(96, y - 9, 124, 11);
        ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1;
        ctx.strokeRect(96, y - 9, 124, 11);
        var v = Math.min(1, (t / 1.6) * 1.2);
        ctx.fillStyle = i === 2 ? '#c9793f' : '#34d399';
        ctx.fillRect(96, y - 9, 124 * Math.min(metrics[i][1], v), 11);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText(Math.round(metrics[i][1] * 100) + '%', 228, y);
      }
      ctx.fillStyle = '#8a7a5a'; ctx.font = '7px sans-serif';
      ctx.fillText('SLO · alertes · runbooks — évaluer avant d\u2019optimiser', 10, h - 22);
      if (t > 1.4) {
        ctx.fillStyle = '#34d399'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('✓ SOCLE PILOTÉ', 10, h - 6);
      }
    }
  };

  /* ---- exports ----------------------------------------------------------- */

  /* What the cart is carrying, named on a tag above it so the change at each
     stop is legible without reading the panel. */
  var CARGO_LABELS = {
    empty:     'chariot vide',
    raw:       'fichier + hash',
    parsed:    'texte extrait',
    clean:     'texte nettoyé',
    chunks:    'chunks + coordonnées',
    meta:      'métadonnées posées',
    unique:    'uniques, ID stable',
    vectors:   'vecteurs sémantiques',
    indexed:   'indexé + tags',
    filtered:  'RLS / étiquettes',
    question:  'journal d\u2019étape',
    rewritten: 'métriques pipeline',
    candidates:'candidats filtrés',
    fused:     'rangs fusionnés',
    topk:      'top autorisé',
    rights:    'accès vérifiés',
    prompt:    'contexte assemblé',
    answer:    'réponse générée',
    cited:     'réponse citée',
    safe:      'réponse vérifiée',
    logged:    'dossier d\u2019audit',
    delivered: 'SLO tenus'
  };

  /* Cargo kinds that live inside the retrieval ring, so the tag can add the
     pass number to them and only them. */
  var LOOP_CARGO = {
    filtered: 1, rights: 1
  };

  global.Park = {
    C: C, BOUNDS: BOUNDS, GROUND: GROUND, LOTS: LOTS,
    cargoLabels: CARGO_LABELS, loopCargo: LOOP_CARGO,
    routes: ROUTES, stations: STATIONS,
    stops: STOPS, stopById: STOP_BY_ID,
    buildings: B,
    guests: GUESTS,
    lorryBed: LORRY_BED, lorryLoad: LORRY_LOAD,
    details: DETAILS,
    draw: { tree: tree, bush: bush, lamp: lamp, bench: bench, guest: guest,
            truck: truck, lorry: lorry, paperStack: paperStack }
  };
})(window);
