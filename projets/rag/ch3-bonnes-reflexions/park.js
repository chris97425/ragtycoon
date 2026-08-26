/* park.js — Chapitre 3 : mindmap de décision (pas une usine).
   19 nœuds : boussole, cinq questions, six recettes, six réflexes. */
(function (global) {
  'use strict';

  var Iso = global.Iso;
  var REDUCE = false;
  try {
    REDUCE = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { REDUCE = false; }

  function wave(t, s) {
    return REDUCE ? 0.35 : (0.5 + 0.5 * Math.sin((t || 0) * (s || 2.2)));
  }

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

  /* Sentier pédagogique (masqué) : 1 → 19, une seule passe. */
  var INTAKE = makeRoute([
    [32, 32], [38, 28], [21, 16], [37, 10], [54, 16], [58, 31], [48, 43]
  ]);
  var LOOP = makeRoute([
    [48, 43], [68, 40], [80, 28], [80, 12], [73, 7],
    [76, 19], [76, 33], [69, 48], [54, 57], [35, 59],
    [48, 52], [48, 43]
  ]);
  var EXIT = makeRoute([
    [35, 59], [17, 55], [5, 46], [3, 32], [5, 18], [16, 6],
    [28, 8], [32, 20], [28, 36], [24, 40]
  ]);
  var DELIVER = makeRoute([[24, 40], [24, 28]]);
  var RETURN = makeRoute([[24, 28], [32, 32]]);

  /* Branches colorées de la mindmap (sans stations). */
  var BR_F = makeRoute([[38, 28], [21, 16]]);
  var BR_C = makeRoute([[38, 28], [37, 10]]);
  var BR_Q = makeRoute([[38, 28], [54, 16]]);
  var BR_E = makeRoute([[38, 28], [58, 31]]);
  var BR_T = makeRoute([[38, 28], [48, 43]]);
  var L_F1 = makeRoute([[21, 16], [69, 48]]);
  var L_F2 = makeRoute([[21, 16], [35, 59]]);
  var L_C1 = makeRoute([[37, 10], [54, 57]]);
  var L_C2 = makeRoute([[37, 10], [35, 59]]);
  var L_Q1 = makeRoute([[54, 16], [73, 7]]);
  var L_Q2 = makeRoute([[54, 16], [76, 19]]);
  var L_Q3 = makeRoute([[54, 16], [76, 33]]);
  var L_E1 = makeRoute([[58, 31], [73, 7]]);
  var L_E2 = makeRoute([[58, 31], [54, 57]]);
  var L_E3 = makeRoute([[58, 31], [35, 59]]);
  var L_T1 = makeRoute([[48, 43], [73, 7]]);
  var L_T2 = makeRoute([[48, 43], [76, 19]]);
  var L_T3 = makeRoute([[48, 43], [76, 33]]);
  var S_F1 = makeRoute([[21, 16], [54, 57]]);
  var S_F2 = makeRoute([[21, 16], [73, 7]]);
  var S_C1 = makeRoute([[37, 10], [69, 48]]);
  var S_Q1 = makeRoute([[54, 16], [5, 46]]);
  var S_E1 = makeRoute([[58, 31], [16, 6]]);
  var S_T1 = makeRoute([[48, 43], [54, 57]]);
  var S_T2 = makeRoute([[48, 43], [35, 59]]);
  var ARC = makeRoute([[17, 55], [5, 46], [3, 32], [5, 18], [16, 6], [24, 40], [24, 28]]);

  var ROUTES = {
    intake: INTAKE, loop: LOOP, exit: EXIT, deliver: DELIVER, ret: RETURN,
    brF: BR_F, brC: BR_C, brQ: BR_Q, brE: BR_E, brT: BR_T,
    lf1: L_F1, lf2: L_F2, lc1: L_C1, lc2: L_C2,
    lq1: L_Q1, lq2: L_Q2, lq3: L_Q3,
    le1: L_E1, le2: L_E2, le3: L_E3,
    lt1: L_T1, lt2: L_T2, lt3: L_T3,
    sf1: S_F1, sf2: S_F2, sc1: S_C1, sq1: S_Q1, se1: S_E1, st1: S_T1, st2: S_T2,
    arc: ARC
  };

  function station(route, idx, id, dwell) {
    return { dist: route.cum[idx], id: id, dwell: dwell == null ? 0.9 : dwell };
  }

  var STATIONS = {
    intake: [
      station(INTAKE, 1, 'depart', 1.6), station(INTAKE, 2, 'fraicheur', 1.4),
      station(INTAKE, 3, 'corpus', 1.4), station(INTAKE, 4, 'requetes', 1.4),
      station(INTAKE, 5, 'echelle', 1.4), station(INTAKE, 6, 'equipe', 1.4)
    ],
    loop: [
      station(LOOP, 4, 'bm25', 1.5), station(LOOP, 5, 'rewriting', 1.5),
      station(LOOP, 6, 'hybride', 1.5), station(LOOP, 7, 'volee', 1.5),
      station(LOOP, 8, 'chaud-froid', 1.5), station(LOOP, 9, 'preembedding', 1.6)
    ],
    exit: [
      station(EXIT, 1, 'regle-8020', 1.5), station(EXIT, 2, 'multi-intent', 1.5),
      station(EXIT, 3, 'depreciation', 1.5), station(EXIT, 4, 'chunking', 1.5),
      station(EXIT, 5, 'latence', 1.5), station(EXIT, 9, 'preuves', 1.6)
    ],
    deliver: [station(DELIVER, 1, 'synthese', 2.2)],
    ret: []
  };

  var COL = {
    frais: '#22c55e', corpus: '#a855f7', req: '#3b82f6',
    ech: '#f59e0b', eq: '#ef6461', garde: '#64748b', gold: '#f2c14e'
  };

  var ROUTE_STYLES = {
    intake: { hidden: true }, loop: { hidden: true }, exit: { hidden: true },
    deliver: { hidden: true }, ret: { hidden: true },
    brF: { edge: '#15803d', fill: COL.frais, dash: 'rgba(20,60,30,0.35)', edgeWidth: 1.7, width: 1.15 },
    brC: { edge: '#6b21a8', fill: COL.corpus, dash: 'rgba(50,20,70,0.35)', edgeWidth: 1.7, width: 1.15 },
    brQ: { edge: '#1d4ed8', fill: COL.req, dash: 'rgba(20,40,80,0.35)', edgeWidth: 1.7, width: 1.15 },
    brE: { edge: '#b45309', fill: COL.ech, dash: 'rgba(80,40,10,0.35)', edgeWidth: 1.7, width: 1.15 },
    brT: { edge: '#b91c1c', fill: COL.eq, dash: 'rgba(80,20,20,0.35)', edgeWidth: 1.7, width: 1.15 },
    lf1: { edge: '#15803d', fill: COL.frais, edgeWidth: 1.2, width: 0.7 },
    lf2: { edge: '#15803d', fill: COL.frais, edgeWidth: 1.2, width: 0.7 },
    lc1: { edge: '#6b21a8', fill: COL.corpus, edgeWidth: 1.2, width: 0.7 },
    lc2: { edge: '#6b21a8', fill: COL.corpus, edgeWidth: 1.2, width: 0.7 },
    lq1: { edge: '#1d4ed8', fill: COL.req, edgeWidth: 1.2, width: 0.7 },
    lq2: { edge: '#1d4ed8', fill: COL.req, edgeWidth: 1.2, width: 0.7 },
    lq3: { edge: '#1d4ed8', fill: COL.req, edgeWidth: 1.2, width: 0.7 },
    le1: { edge: '#b45309', fill: COL.ech, edgeWidth: 1.2, width: 0.7 },
    le2: { edge: '#b45309', fill: COL.ech, edgeWidth: 1.2, width: 0.7 },
    le3: { edge: '#b45309', fill: COL.ech, edgeWidth: 1.2, width: 0.7 },
    lt1: { edge: '#b91c1c', fill: COL.eq, edgeWidth: 1.2, width: 0.7 },
    lt2: { edge: '#b91c1c', fill: COL.eq, edgeWidth: 1.2, width: 0.7 },
    lt3: { edge: '#b91c1c', fill: COL.eq, edgeWidth: 1.2, width: 0.7 },
    sf1: { edge: '#166534', fill: '#86efac', dash: 'rgba(20,80,40,0.45)', edgeWidth: 0.7, width: 0.28, dashed: true },
    sf2: { edge: '#166534', fill: '#86efac', dash: 'rgba(20,80,40,0.45)', edgeWidth: 0.7, width: 0.28, dashed: true },
    sc1: { edge: '#6b21a8', fill: '#d8b4fe', dash: 'rgba(60,20,80,0.45)', edgeWidth: 0.7, width: 0.28, dashed: true },
    sq1: { edge: '#1d4ed8', fill: '#93c5fd', dash: 'rgba(20,40,90,0.45)', edgeWidth: 0.7, width: 0.28, dashed: true },
    se1: { edge: '#b45309', fill: '#fcd34d', dash: 'rgba(90,50,10,0.45)', edgeWidth: 0.7, width: 0.28, dashed: true },
    st1: { edge: '#b91c1c', fill: '#fca5a5', dash: 'rgba(90,20,20,0.45)', edgeWidth: 0.7, width: 0.28, dashed: true },
    st2: { edge: '#b91c1c', fill: '#fca5a5', dash: 'rgba(90,20,20,0.45)', edgeWidth: 0.7, width: 0.28, dashed: true },
    arc: { edge: '#334155', fill: COL.garde, dash: 'rgba(30,40,50,0.4)', edgeWidth: 1.5, width: 0.95 }
  };

  var C = {
    grass: '#5d9c3f', grassAlt: '#569439', path: '#cbb68e', pathEdge: '#b09a72',
    slab: '#9aa4ae', floor: '#d8e2ea', sand: '#dcc487', paper: '#f4f1e8',
    dark: '#5b6470', gold: '#f2c14e', white: '#eef3f7', ink: '#3a4450'
  };

  var ACT_NAMES = {
    1: 'Acte 1 · Les questions à se poser',
    2: 'Acte 2 · Les six recettes',
    3: 'Acte 3 · Les réflexes'
  };

  var STOPS = [
    { id: 'depart', name: 'Quel RAG pour mon besoin ?', act: 1, tag: 'Décision', x: 38, y: 28, r: 6,
      short: 'Le bon RAG ne commence pas par une base vectorielle, mais par cinq questions et une baseline mesurable.',
      body: 'Choisir un RAG, ce n’est pas choisir la pile la plus impressionnante : c’est réduire l’incertitude avec le système le plus simple qui répond au besoin. Commence par une recherche lexicale, mesure-la sur de vraies questions, puis demande ce qui échoue précisément. Fraîcheur, corpus, requêtes, échelle et équipe déterminent ensuite la recette acceptable. Chaque ajout doit acheter un gain observé en échange d’un coût, d’une latence et d’une complexité connus.',
      tip: 'Écris la baseline, la métrique à améliorer et le seuil de succès avant de comparer le moindre moteur.' },
    { id: 'fraicheur', name: 'Quelle fraîcheur faut-il ?', act: 1, tag: 'Question', x: 21, y: 16, r: 5,
      short: 'Mesure le délai toléré entre une modification source et sa présence dans les résultats.',
      body: 'La bonne question mesure non pas si les données changent, mais combien de retard une réponse peut tolérer. Du temps réel favorise le lexical ou l’embedding à la volée, car une réindexation complète crée une fenêtre de données périmées. Des mises à jour quotidiennes ou hebdomadaires rendent l’hybride praticable ; un corpus mensuel ou trimestriel rend le pré-embedding crédible. Mesure le délai source-vers-index, le taux de documents périmés et l’impact métier d’une réponse ancienne : ces trois nombres changent l’architecture.',
      tip: 'Définis un SLO de fraîcheur par source ; « à jour » n’est pas une unité de mesure.' },
    { id: 'corpus', name: 'À quoi ressemble le corpus ?', act: 1, tag: 'Question', x: 37, y: 10, r: 5,
      short: 'Churn, stabilité, taille et longue traîne disent quelles données méritent vraiment un vecteur stocké.',
      body: 'Profile le corpus avant de l’embarquer : combien de documents, quelle taille, quels formats, quels doublons et quel taux de changement ? Au-delà d’environ 10 % de documents modifiés par jour, pré-embarquer tout le corpus oblige à une maintenance permanente. Si 90 % des documents ne sont jamais consultés, calculer et stocker leurs vecteurs à l’avance gaspille du travail ; la volée ou un tiering Hot/Cold devient plus logique. Un corpus stable, largement consulté et bien gouverné supporte beaucoup mieux le pré-embedding complet.',
      tip: 'Trace une courbe cumulée documents/accès : elle révèle en une minute si ton « tout pré-calculer » sert réellement quelqu’un.' },
    { id: 'requetes', name: 'Comment les utilisateurs cherchent-ils ?', act: 1, tag: 'Question', x: 54, y: 16, r: 5,
      short: 'Les requêtes exactes, conversationnelles, mixtes ou multi-intent ne réclament pas le même retrieval.',
      body: 'Prélève de vraies requêtes et classe-les : identifiants exacts, jargon, questions conversationnelles, synonymes, comparaisons ou demandes à plusieurs intentions. Les mots-clés, références produit et termes propriétaires donnent un avantage au lexical ; les formulations par le sens justifient d’essayer rewriting puis embeddings. Un trafic mixte appelle souvent un pipeline hybride ou un routage par type de requête, pas un unique marteau. Ce que la réponse change : exact dominant mène à BM25, décalage de vocabulaire au rewriting, sémantique prouvée à l’hybride, multi-intent à la décomposition.',
      tip: 'Étiquette cent requêtes réelles avant de déclarer que tes utilisateurs « cherchent sémantiquement ».' },
    { id: 'echelle', name: 'Quelle échelle, quelle performance ?', act: 1, tag: 'Question', x: 58, y: 31, r: 5,
      short: 'Le volume quotidien ne suffit pas : confronte débit, concurrence, p95, coût et fraîcheur.',
      body: 'L’article propose un repère simple : sous 1 000 requêtes par jour, reste simple ; entre 1 000 et 10 000, optimise sélectivement ; au-delà de 10 000, une optimisation complète peut se justifier. Ce sont des heuristiques, pas des SLO : une pointe de cent requêtes simultanées peut compter davantage que la moyenne quotidienne. Mesure p50, p95, p99, débit, taux d’erreur et coût par requête avec le même top-k et le même corpus. Si la latence domine, pré-calculer aide ; si le trafic reste faible, l’infrastructure économisée vaut souvent plus que quelques millisecondes.',
      tip: 'Teste le pic réel et le p95 ; une moyenne journalière peut cacher la seule minute qui fait tomber le service.' },
    { id: 'equipe', name: 'Qui saura l’exploiter ?', act: 1, tag: 'Question', x: 48, y: 43, r: 5,
      short: 'Une architecture n’est viable que si l’équipe sait la tester, la surveiller et la réparer.',
      body: 'Compte les compétences disponibles après la démo : recherche textuelle, ML, données, SRE, sécurité et évaluation. Sans expertise ML, BM25 plus rewriting reste explicable et réparable ; avec un peu d’expérience, l’hybride devient gérable ; une équipe ML et plateforme peut assumer index ANN, migrations de modèles et tuning. Ajoute aussi le temps d’astreinte, les runbooks et le propriétaire de chaque composant. Si personne ne sait diagnostiquer une baisse de rappel ou reconstruire un index, la recette est trop avancée pour aujourd’hui.',
      tip: 'Choisis la solution que l’équipe de garde saura expliquer à trois heures du matin, pas seulement celle que le prototype sait lancer.' },
    { id: 'bm25', name: 'Recette 1 · Full-text BM25', act: 2, tag: 'Recette 1', x: 73, y: 7, r: 5,
      short: 'Recherche lexicale seule : rapide, explicable et souvent suffisante pour les mots exacts et le jargon.',
      body: 'BM25 classe les documents selon les termes présents, leur rareté et la longueur du texte, sans modèle d’embedding. Choisis-le pour démarrer, pour les identifiants exacts, les requêtes à mots-clés et le vocabulaire propriétaire. Le coût de modèle est nul et la recherche peut rester sous 10 ms dans l’exemple de l’article ; le résultat s’explique terme par terme et le document entier peut servir de première unité. Le piège est le vocabulaire différent — voiture contre automobile — et l’intention formulée sans les mots du document, pas un manque automatique de vecteurs.',
      tip: 'Garde BM25 comme témoin permanent : toute recette plus chère doit le battre sur un jeu de questions étiqueté.' },
    { id: 'rewriting', name: 'Recette 2 · Query rewriting', act: 2, tag: 'Recette 2', x: 76, y: 19, r: 5,
      short: 'Un LLM transforme la question en requêtes lexicales propres, sans ré-embarquer le corpus.',
      body: 'Le rewriting retire le bavardage, ajoute des synonymes, conserve le jargon métier et peut produire plusieurs sous-requêtes avant un BM25. Utilise-le quand les documents existent mais que les utilisateurs ne les nomment pas comme l’index, ou quand ils parlent de façon conversationnelle. L’article donne environ 0,001 dollar par requête avec GPT-4o-mini comme photographie de prix : revalide toujours modèle, tokens, cache et tarif au moment du projet. La latence d’un appel LLM et le risque de déformer un identifiant sont les pièges ; impose un schéma, un glossaire, un timeout et un repli vers la requête originale.',
      tip: 'Protège les termes propriétaires dans le prompt et journalise requête originale, réécriture et gain de rappel.' },
    { id: 'hybride', name: 'Recette 3 · Hybride sparse + dense', act: 2, tag: 'Recette 3', x: 76, y: 33, r: 5,
      short: 'BM25 garde les bons candidats ; les embeddings réordonnent un petit top-k par le sens.',
      body: 'Le pipeline récupère d’abord 50 à 100 candidats avec BM25, puis un modèle dense les réordonne pour conserver environ 10 passages. Essaie-le seulement si BM25 plus rewriting manque encore des résultats sémantiques et si un test A/B confirme le besoin. L’article estime à environ 0,0005 dollar l’embedding en ligne de 50 documents de 500 tokens et situe le compromis autour de 100 à 500 ms ; ces valeurs dépendent du modèle, du matériel et du cache. Les pièges sont le retour du chunking, la comparaison de scores incompatibles, les droits appliqués trop tard et une latence ajoutée qui n’achète pas assez de qualité.',
      tip: 'Compare le gain de rappel ou de nDCG à la hausse du p95 ; « plus sémantique » n’est pas un résultat de test.' },
    { id: 'volee', name: 'Recette 4 · Embedding à la volée', act: 2, tag: 'Recette 4', x: 69, y: 48, r: 5,
      short: 'On embarque seulement les quelques candidats de la requête : fraîcheur parfaite, latence assumée.',
      body: 'BM25 sélectionne un petit K, puis la requête et 20 à 50 candidats sont embarqués et comparés au moment de la recherche. Cette recette convient à un churn supérieur à environ 10 % par jour, au contenu temps réel et aux phases où le modèle d’embedding change encore. Dans l’exemple de l’article, 1 000 requêtes par jour et 50 documents coûtent environ 15 dollars par mois, sans stockage vectoriel, mais ajoutent 200 à 500 ms par requête. Le piège est de laisser K grossir : la facture, le calcul et le p95 montent ensemble, même si la fraîcheur reste parfaite.',
      tip: 'Fixe un budget K et un timeout ; au-delà, rends le meilleur lexical au lieu de bloquer toute la réponse.' },
    { id: 'chaud-froid', name: 'Recette 5 · Tiers Hot/Cold', act: 2, tag: 'Recette 5', x: 54, y: 57, r: 5,
      short: 'Pré-embarque les documents très consultés et traite la longue traîne à la demande.',
      body: 'Le tier chaud stocke les vecteurs des documents fréquents ; le tier froid conserve le texte et calcule les embeddings seulement lorsqu’un candidat rare apparaît. Choisis cette recette pour un corpus de plus de 100 000 documents, des accès très inégaux et un mélange de contenus stables et changeants. Si 20 % des documents servent 80 % du trafic, la majorité des requêtes reste rapide et une migration de modèle ne ré-embarque d’abord que le tier chaud. Les pièges sont une promotion mal mesurée, des seuils qui oscillent, un cold start lent et deux chemins de recherche qui fusionnent différemment.',
      tip: 'Versionne la règle de promotion et mesure séparément le p95 des hits chauds, des hits froids et des recherches mixtes.' },
    { id: 'preembedding', name: 'Recette 6 · Pré-embedding complet', act: 2, tag: 'Recette 6', x: 35, y: 59, r: 5,
      short: 'Tout le corpus est embarqué et indexé à l’avance pour servir vite un trafic élevé et stable.',
      body: 'Chaque chunk reçoit un vecteur en amont, stocké dans un index ANN tel que HNSW, puis chaque requête ne calcule que son propre vecteur. Cette recette vise plus de 10 000 requêtes par jour, un besoin proche de 50 ms, un corpus très stable — environ moins de 5 % de churn mensuel dans l’article — et des accès largement répartis. L’ordre de grandeur donné pour un million de documents de 500 tokens est environ 10 dollars d’embedding initial et 6 Go de vecteurs bruts, hors index, réplication, exploitation et migrations. Les pièges sont les données périmées, la reconstruction coûteuse lors d’un changement de modèle, le cutover, le chunking à réévaluer et une infrastructure disproportionnée au trafic réel.',
      tip: 'N’autorise cette recette qu’avec un benchmark de charge, une procédure de double index et un rollback testé.' },
    { id: 'regle-8020', name: 'Le réflexe 80/20', act: 3, tag: 'Réflexe', x: 17, y: 55, r: 5,
      short: 'Ne construis pas la solution des 5 % pour un problème qui appartient aux 60 %.',
      body: 'Le repère de l’article est volontairement brutal : 60 % des systèmes devraient s’arrêter à full-text plus rewriting, 25 % ont besoin d’hybride, 10 % de pré-embedding et 5 % d’une solution sur mesure. Ce n’est pas une statistique universelle, mais un antidote utile à l’architecture par mode. À chaque palier, demande si la qualité mesurée franchit le seuil et si le gain rembourse latence, coût et exploitation. Si oui, arrête-toi : l’élégance d’un système tient aussi aux composants qu’il n’a pas.',
      tip: 'Inscris une condition d’arrêt dans l’expérience ; sans elle, chaque bon résultat devient seulement la permission d’ajouter une couche.' },
    { id: 'multi-intent', name: 'Décomposer le multi-intent', act: 3, tag: 'Réflexe', x: 5, y: 46, r: 5,
      short: 'Une question qui demande trois choses doit souvent devenir trois recherches ciblées.',
      body: '« Lire un CSV, nettoyer les valeurs manquantes et tracer le résultat » contient trois intentions et parfois un ordre de dépendance. Un agent de compréhension produit des sous-requêtes focalisées, route chacune vers le retrieval le moins cher, les exécute en parallèle puis synthétise les passages. La latence parallèle suit approximativement la branche la plus lente, pas la somme, et seules les sous-requêtes difficiles paient un LLM ou des embeddings. Les pièges sont l’explosion du nombre de branches, les doublons, la perte des dépendances et une synthèse qui mélange des sources incompatibles.',
      tip: 'Borne le nombre de sous-requêtes, conserve leur dépendance et exige une source identifiable pour chaque morceau de la synthèse.' },
    { id: 'depreciation', name: 'Prévoir la dépréciation des modèles', act: 3, tag: 'Réflexe', x: 3, y: 32, r: 5,
      short: 'Un vecteur n’est comparable qu’aux vecteurs du même espace : changer de modèle est une migration.',
      body: 'Un modèle d’embedding peut être retiré, devenir trop cher ou être dépassé ; les anciens vecteurs ne deviennent pas compatibles avec le nouveau par magie. À la volée, le changement touche surtout l’appel et les tests ; en pré-embedding, il faut reconstruire, comparer, basculer et pouvoir revenir en arrière. Versionne modèle, dimensions, normalisation, chunking et index dans chaque trace, puis prépare un double index derrière un alias. Le piège absolu est de mélanger silencieusement une requête du modèle B avec des documents du modèle A.',
      tip: 'Traite chaque changement d’embedding comme une migration de schéma avec jeu de régression, alias atomique et rollback.' },
    { id: 'chunking', name: 'Le chunking revient avec les embeddings', act: 3, tag: 'Réflexe', x: 5, y: 18, r: 5,
      short: 'BM25 peut démarrer sur des documents entiers ; les embeddings obligent à choisir l’unité de sens.',
      body: 'Dès qu’un passage devient un vecteur, il faut décider où il commence, où il finit et quel contexte il transporte. Taille fixe, chevauchement, titres, sections, tableaux ou découpe sémantique modifient rappel, précision, coût et citations. Commence par une baseline simple et reproductible, puis compare sur les mêmes questions les chunks retrouvés, les doublons du top-k et la capacité à citer. Le piège est d’optimiser une taille moyenne sans regarder les frontières qui coupent la réponse ou les métadonnées qui la rendent inutilisable.',
      tip: 'Inspecte les chunks ratés à côté de la source ; un score global ne montre pas une phrase coupée entre deux tuiles.' },
    { id: 'latence', name: 'La latence est le vrai coût', act: 3, tag: 'Réflexe', x: 16, y: 6, r: 5,
      short: 'Quelques fractions de centime peuvent être acceptables ; 300 ms ajoutées à chaque question restent visibles.',
      body: 'Décompose le temps : réécriture, lexical, embedding de la requête, embedding des candidats, reranking, génération et réseau. L’article situe l’embedding en ligne de 20 à 50 documents autour de 200 à 500 ms, une différence immédiatement perceptible dans une interface. Mesure chaque span et le p95 de bout en bout, puis fixe un budget par étape et un chemin de repli. Le piège est d’admirer le coût token très bas tout en laissant plusieurs appels séquentiels transformer une recherche vive en attente.',
      tip: 'Parallélise les branches indépendantes et coupe proprement une étape coûteuse quand son budget est épuisé.' },
    { id: 'preuves', name: 'Les preuves d’abord', act: 3, tag: 'Réflexe', x: 24, y: 40, r: 5,
      short: 'Évalue la baseline, formule une plainte précise et ne change qu’une variable à la fois.',
      body: 'Fais tourner BM25 pendant deux à quatre semaines si le contexte le permet, collecte les requêtes, les clics, les abstentions et les retours utilisateurs, puis construis un petit jeu de vérité terrain. Mesure d’abord le retrieval — Recall@k, MRR ou nDCG — avant la fidélité et la qualité de la réponse, sinon le générateur masque la cause. Compare rewriting, hybride ou nouvelle découpe sur le même corpus, avec p95 et coût par requête, puis documente l’intervalle et les régressions. Une amélioration moyenne qui dégrade les identifiants exacts, les droits ou un segment critique n’est pas une victoire.',
      tip: 'Écris dans l’ADR la preuve qui autorise l’étape suivante et la preuve qui impose de revenir en arrière.' },
    { id: 'synthese', name: 'Le chemin recommandé', act: 3, tag: 'Synthèse', x: 24, y: 28, r: 6,
      short: 'BM25 d’abord, mesure ensuite, puis rewriting, hybride et pré-calcul seulement si les résultats l’exigent.',
      body: 'Construis BM25, garde-le comme témoin et mesure de vraies requêtes pendant une période définie. Si des documents connus restent introuvables, teste le rewriting ; si le sens manque encore, teste l’hybride et décide si sa latence achète assez de qualité. Pour l’embedding des candidats, choisis la volée avec un churn fort, Hot/Cold avec une longue traîne claire, et le pré-embedding complet seulement avec corpus stable, trafic élevé et équipe prête. Le bon livrable n’est pas « nous avons une base vectorielle » : c’est une décision réversible, chiffrée et compréhensible.',
      tip: 'Ta prochaine étape doit tenir en une expérience : une hypothèse, une métrique, un seuil, un budget et une date de décision.' }
  ];

  var STOP_BY_ID = {};
  STOPS.forEach(function (s) { STOP_BY_ID[s.id] = s; });

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

  var BOUNDS = { x0: -2, y0: 2, x1: 82, y1: 64 };
  var GROUND = { x0: -420, y0: -400, x1: 520, y1: 520 };

  function pad(x, y, s) {
    return { x: x - 2.2, y: y - 2.0, w: 4.4, d: 4.0, c: s || C.floor };
  }
  var LOTS = STOPS.map(function (s) {
    return pad(s.x, s.y, s.act === 1 ? C.sand : s.act === 2 ? C.floor : C.slab);
  });

  var B = [];
  function add(o) { B.push(o); return o; }

  function sign(ctx, x, yFace, z, text, colour) {
    var p = Iso.project(x, yFace, z);
    ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(text).width + 14;
    ctx.fillStyle = 'rgba(20,16,10,0.4)';
    ctx.fillRect(p.x - w / 2 + 1, p.y - 9, w, 20);
    ctx.fillStyle = '#22303f';
    ctx.fillRect(p.x - w / 2, p.y - 10, w, 20);
    ctx.strokeStyle = colour || C.gold; ctx.lineWidth = 2;
    ctx.strokeRect(p.x - w / 2, p.y - 10, w, 20);
    ctx.fillStyle = colour || C.gold;
    ctx.fillText(text, p.x, p.y + 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function plinth(ctx, x, y, w, d, h, c) {
    Iso.box(ctx, { x: x, y: y, w: w, d: d, h: h || 0.28, color: c || C.slab });
  }

  function traffic(ctx, x, y, z, t, mode) {
    Iso.box(ctx, { x: x, y: y, z: z, w: 0.42, d: 0.42, h: 1.15, color: '#2f3945' });
    var cols = ['#c8453a', '#f59e0b', '#22c55e'];
    var on = mode == null ? Math.floor((t || 0) * 0.7) % 3 : mode;
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = i === on ? cols[i] : '#3a4450';
      var p = Iso.project(x + 0.21, y + 0.42, z + 0.95 - i * 0.32);
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, 6.2832); ctx.fill();
    }
  }

  function card(ctx, x, y, z, c, label, accent) {
    Iso.box(ctx, { x: x, y: y, z: z, w: 2.2, d: 0.12, h: 1.55, color: c || C.paper });
    Iso.box(ctx, { x: x + 0.12, y: y, z: z + 1.28, w: 0.7, d: 0.14, h: 0.16, color: accent || C.gold });
    sign(ctx, x + 1.1, y + 0.12, z + 0.7, label, accent || C.gold);
  }

  function gauge(ctx, x, y, z, t, c) {
    Iso.cylinder(ctx, { x: x, y: y, z: z, r: 0.55, h: 0.22, color: '#8a97a5' });
    var a = REDUCE ? 0.8 : (t || 0) * 1.4;
    var p0 = Iso.project(x, y, z + 0.24);
    var p1 = Iso.project(x + Math.cos(a) * 0.4, y + Math.sin(a) * 0.4, z + 0.24);
    ctx.strokeStyle = c || C.gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }

  /* --- 19 nœuds : panneaux, fiches, jauges — jamais une usine ---------- */

  add({ id: 'depart', x: 35.2, y: 25.2, w: 5.6, d: 5.6, draw: function (ctx, b, t) {
    Iso.cylinder(ctx, { x: 38, y: 28, r: 2.15, h: 0.32, color: '#c9d3dd' });
    Iso.cylinder(ctx, { x: 38, y: 28, z: 0.32, r: 1.35, h: 0.18, color: '#22303f' });
    var a = REDUCE ? 0.4 : t * 0.55;
    var p = Iso.project(38, 28, 0.62);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, 6.2832); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(a) * 14, p.y + Math.sin(a) * 8);
    ctx.stroke();
    var dirs = [[-1.8, -1.4, COL.frais], [0, -2.1, COL.corpus], [1.8, -1.4, COL.req], [2.0, 0.6, COL.ech], [0.8, 1.9, COL.eq]];
    for (var i = 0; i < dirs.length; i++) {
      Iso.box(ctx, { x: 38 + dirs[i][0] - 0.15, y: 28 + dirs[i][1] - 0.15, z: 0.4, w: 0.3, d: 0.3, h: 0.55, color: dirs[i][2] });
    }
    sign(ctx, 38, 30.4, 1.15, 'DÉCISION', C.gold);
  }});

  add({ id: 'fraicheur', x: 18.8, y: 13.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 19.2, 14.2, 3.6, 3.2, 0.22, C.sand);
    Iso.cylinder(ctx, { x: 21, y: 15.4, r: 0.38, h: 1.35, color: '#7dd3fc' });
    Iso.cone(ctx, 21, 15.4, 1.35, 0.42, 0.55, '#38bdf8');
    traffic(ctx, 22.4, 16.4, 0.22, t, Math.floor(wave(t, 1.1) * 2.9));
    sign(ctx, 21, 17.4, 0.95, 'FRAÎCHEUR', COL.frais);
  }});

  add({ id: 'corpus', x: 34.8, y: 7.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 35.2, 8.2, 3.6, 3.4, 0.2, C.floor);
    for (var i = 0; i < 4; i++) {
      Iso.box(ctx, { x: 35.6 + i * 0.18, y: 8.8 + i * 0.12, z: 0.2 + i * 0.18, w: 1.5, d: 1.1, h: 0.16, color: i % 2 ? '#e9d5ff' : '#ddd6fe' });
    }
    gauge(ctx, 38.4, 10.6, 0.2, t, COL.corpus);
    sign(ctx, 37, 11.6, 0.9, 'CORPUS', COL.corpus);
  }});

  add({ id: 'requetes', x: 51.8, y: 13.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 52.2, 14.2, 3.6, 3.4, 0.2, C.floor);
    Iso.box(ctx, { x: 52.6, y: 14.8, w: 1.4, d: 0.22, h: 1.15, color: '#93c5fd' });
    Iso.box(ctx, { x: 54.6, y: 14.8, w: 1.4, d: 0.22, h: 1.15, color: '#fde68a' });
    sign(ctx, 53.3, 15.1, 1.4, 'EXACT', COL.req);
    sign(ctx, 55.3, 15.1, 1.4, 'SENS', COL.ech);
    sign(ctx, 54, 17.4, 0.85, 'REQUÊTES', COL.req);
  }});

  add({ id: 'echelle', x: 55.8, y: 28.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 56.2, 29.2, 3.6, 3.4, 0.2, C.sand);
    gauge(ctx, 57.2, 30.4, 0.2, t, COL.ech);
    gauge(ctx, 58.8, 31.2, 0.2, t * 0.7, '#f97316');
    var hgt = 0.4 + 0.5 * wave(t, 2);
    Iso.box(ctx, { x: 56.6, y: 31.6, z: 0.2, w: 0.7, d: 0.7, h: hgt, color: COL.ech });
    sign(ctx, 58, 32.8, 0.9, 'ÉCHELLE', COL.ech);
  }});

  add({ id: 'equipe', x: 45.8, y: 40.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 46.2, 41.2, 3.6, 3.6, 0.2, C.floor);
    Iso.box(ctx, { x: 46.6, y: 41.6, w: 2.8, d: 2.0, h: 0.28, color: '#d6d3d1' });
    Iso.box(ctx, { x: 46.8, y: 42.0, z: 0.28, w: 0.7, d: 0.7, h: 0.45, color: '#93c5fd' });
    Iso.box(ctx, { x: 47.7, y: 42.0, z: 0.28, w: 0.7, d: 0.7, h: 0.45, color: '#d8b4fe' });
    Iso.box(ctx, { x: 48.6, y: 42.0, z: 0.28, w: 0.7, d: 0.7, h: 0.45, color: '#86efac' });
    traffic(ctx, 49.4, 43.4, 0.2, t, 2);
    sign(ctx, 48, 44.8, 0.9, 'ÉQUIPE', COL.eq);
  }});

  add({ id: 'bm25', x: 70.8, y: 4.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 71.2, 5.2, 3.6, 3.4, 0.22, C.white);
    Iso.box(ctx, { x: 71.8, y: 5.8, w: 1.1, d: 1.1, h: 0.7, color: C.dark });
    card(ctx, 73.2, 6.4, 0.22, C.paper, 'BM25', COL.frais);
    sign(ctx, 73, 8.6, 0.85, 'BASELINE', COL.frais);
  }});

  add({ id: 'rewriting', x: 73.8, y: 16.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 74.2, 17.2, 3.6, 3.4, 0.22, C.floor);
    card(ctx, 74.8, 18.0, 0.22, C.paper, 'REWRITE', COL.req);
    Iso.box(ctx, { x: 76.6, y: 18.6, z: 0.22, w: 1.1, d: 0.9, h: 0.55, color: '#93c5fd' });
    Iso.box(ctx, { x: 76.8, y: 19.6, z: 0.22, w: 1.1, d: 0.9, h: 0.55, color: '#fde68a' });
  }});

  add({ id: 'hybride', x: 73.8, y: 30.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 74.2, 31.2, 3.6, 3.4, 0.22, C.floor);
    Iso.box(ctx, { x: 74.6, y: 32.0, w: 1.3, d: 1.1, h: 0.85, color: COL.req });
    Iso.box(ctx, { x: 76.6, y: 32.0, w: 1.3, d: 1.1, h: 0.55 + 0.4 * wave(t, 1.6), color: COL.ech });
    Iso.box(ctx, { x: 75.4, y: 33.4, z: 0.22, w: 1.2, d: 0.7, h: 0.35, color: C.gold });
    sign(ctx, 76, 34.6, 0.85, 'HYBRIDE', COL.req);
  }});

  add({ id: 'volee', x: 66.8, y: 45.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 67.2, 46.2, 3.6, 3.4, 0.22, C.sand);
    card(ctx, 67.8, 47.0, 0.22, '#fff7ed', 'VOLÉE', COL.ech);
    var flash = wave(t, 5);
    ctx.fillStyle = 'rgba(245,158,11,' + (0.25 + 0.45 * flash).toFixed(2) + ')';
    Iso.disc(ctx, 69.6, 48.2, 1.4, 0.55);
    Iso.box(ctx, { x: 70.2, y: 47.6, z: 0.22, w: 0.55, d: 0.55, h: 0.7, color: '#fb923c' });
  }});

  add({ id: 'chaud-froid', x: 51.8, y: 54.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 52.2, 55.2, 3.6, 3.4, 0.22, C.slab);
    Iso.box(ctx, { x: 52.6, y: 55.6, w: 1.5, d: 1.8, h: 1.15, color: '#ef4444' });
    Iso.box(ctx, { x: 54.4, y: 55.6, w: 1.5, d: 1.8, h: 1.15, color: '#3b82f6' });
    sign(ctx, 53.4, 57.4, 1.4, 'HOT', '#fecaca');
    sign(ctx, 55.2, 57.4, 1.4, 'COLD', '#bfdbfe');
  }});

  add({ id: 'preembedding', x: 32.8, y: 56.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 33.2, 57.2, 3.6, 3.4, 0.22, C.floor);
    for (var i = 0; i < 7; i++) {
      var a = i * 0.9 + (REDUCE ? 0 : t * 0.3);
      Iso.box(ctx, { x: 35 + Math.cos(a) * 1.1, y: 59 + Math.sin(a) * 0.9, z: 0.22, w: 0.28, d: 0.28, h: 0.28, color: '#67e8f9' });
    }
    card(ctx, 33.6, 57.8, 0.22, '#fee2e2', 'HNSW', COL.eq);
    sign(ctx, 35, 60.6, 0.85, 'PRÉ-EMB.', COL.eq);
  }});

  add({ id: 'regle-8020', x: 14.8, y: 52.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 15.2, 53.2, 3.6, 3.4, 0.22, C.slab);
    Iso.cylinder(ctx, { x: 17, y: 54.4, r: 0.95, h: 0.28, color: '#94a3b8' });
    var slices = [0.6, 0.25, 0.1, 0.05], cols = [COL.frais, COL.req, COL.ech, COL.eq], acc = 0;
    for (var i = 0; i < 4; i++) {
      var ang = acc * 6.28;
      Iso.box(ctx, { x: 17 + Math.cos(ang) * 0.55, y: 54.4 + Math.sin(ang) * 0.45, z: 0.28, w: 0.28, d: 0.28, h: 0.2 + slices[i], color: cols[i] });
      acc += slices[i];
    }
    sign(ctx, 17, 56.6, 0.9, '60/25/10/5', COL.garde);
  }});

  add({ id: 'multi-intent', x: 2.8, y: 43.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 3.2, 44.2, 3.6, 3.4, 0.22, C.slab);
    Iso.box(ctx, { x: 3.6, y: 45.2, w: 1.4, d: 0.28, h: 0.85, color: '#cbd5e1' });
    Iso.box(ctx, { x: 5.4, y: 44.6, w: 1.0, d: 0.22, h: 0.7, color: '#93c5fd' });
    Iso.box(ctx, { x: 5.4, y: 45.4, w: 1.0, d: 0.22, h: 0.7, color: '#86efac' });
    Iso.box(ctx, { x: 5.4, y: 46.2, w: 1.0, d: 0.22, h: 0.7, color: '#fde68a' });
    sign(ctx, 5, 47.6, 0.85, '×3', COL.req);
  }});

  add({ id: 'depreciation', x: 0.8, y: 29.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 1.2, 30.2, 3.6, 3.4, 0.22, C.slab);
    Iso.box(ctx, { x: 1.6, y: 30.8, w: 1.5, d: 1.2, h: 0.18, color: '#fef3c7' });
    Iso.box(ctx, { x: 1.8, y: 32.2, w: 1.2, d: 0.85, h: 0.7, color: '#93c5fd' });
    Iso.box(ctx, { x: 3.4, y: 32.2, w: 1.2, d: 0.85, h: 0.7, color: '#fca5a5' });
    sign(ctx, 3, 34.0, 0.85, 'A → B', COL.garde);
  }});

  add({ id: 'chunking', x: 2.8, y: 15.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 3.2, 16.2, 3.6, 3.4, 0.22, C.floor);
    for (var i = 0; i < 4; i++) {
      Iso.box(ctx, { x: 3.4 + i * 0.7, y: 16.8 + (i % 2) * 0.15, z: 0.22, w: 0.95, d: 1.4, h: 0.12, color: i % 2 ? '#e2e8f0' : C.paper });
    }
    sign(ctx, 5, 19.6, 0.85, 'CHUNKS', COL.garde);
  }});

  add({ id: 'latence', x: 13.8, y: 3.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 14.2, 4.2, 3.6, 3.4, 0.22, C.slab);
    traffic(ctx, 15.2, 5.0, 0.22, t, wave(t, 1.4) > 0.66 ? 0 : 2);
    Iso.cylinder(ctx, { x: 17.0, y: 5.6, r: 0.5, h: 0.2, color: '#94a3b8' });
    sign(ctx, 16, 7.4, 0.85, 'p95', COL.ech);
  }});

  add({ id: 'preuves', x: 21.8, y: 37.8, w: 4.4, d: 4.4, draw: function (ctx, b, t) {
    plinth(ctx, 22.2, 38.2, 3.6, 3.6, 0.22, C.floor);
    Iso.box(ctx, { x: 22.6, y: 38.6, w: 2.8, d: 1.8, h: 0.22, color: '#e2e8f0' });
    Iso.box(ctx, { x: 22.8, y: 38.8, z: 0.22, w: 0.7, d: 0.9, h: 0.55, color: '#86efac' });
    Iso.box(ctx, { x: 23.7, y: 38.8, z: 0.22, w: 0.7, d: 0.9, h: 0.4, color: '#fde68a' });
    Iso.box(ctx, { x: 24.6, y: 38.8, z: 0.22, w: 0.7, d: 0.9, h: 0.7, color: '#93c5fd' });
    sign(ctx, 24, 41.6, 0.9, 'MESURÉ', C.gold);
  }});

  add({ id: 'synthese', x: 21.4, y: 25.2, w: 5.2, d: 5.6, draw: function (ctx, b, t) {
    Iso.cylinder(ctx, { x: 24, y: 28, r: 1.7, h: 0.28, color: C.gold });
    Iso.cylinder(ctx, { x: 24, y: 28, z: 0.28, r: 1.05, h: 0.16, color: '#22303f' });
    var a = REDUCE ? 0.2 : t * 0.7;
    var p = Iso.project(24, 28, 0.55);
    ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(a) * 11, p.y + Math.sin(a) * 6); ctx.stroke();
    sign(ctx, 24, 30.4, 1.05, 'CHEMIN', C.gold);
  }});

  function tree(ctx, x, y, s) {
    s = s || 1;
    Iso.shadow(ctx, x, y, 0.9 * s, 0.25);
    Iso.cylinder(ctx, { x: x, y: y, r: 0.16 * s, h: 1.0 * s, color: '#6b4a2b', edge: false });
    var p = Iso.project(x, y, 1.0 * s);
    ctx.fillStyle = '#2f7a34';
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 10 * s, 20 * s, 16 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#43a04a';
    ctx.beginPath(); ctx.ellipse(p.x - 5 * s, p.y - 15 * s, 13 * s, 10 * s, 0, 0, 6.2832); ctx.fill();
  }

  function bush(ctx, x, y) {
    Iso.shadow(ctx, x, y, 0.45, 0.22);
    var p = Iso.project(x, y, 0);
    ctx.fillStyle = '#3d8b3d';
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 7, 13, 9, 0, 0, 6.2832); ctx.fill();
  }

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

  function decisionGuide(ctx, p, state, clock) {
    Iso.shadow(ctx, p.x, p.y, 0.85);
    guest(ctx, p.x, p.y, p.z, '#3f7fd4', '#f2c14e', clock * 6);
    var c = Iso.project(p.x + 0.62, p.y - 0.18, (p.z || 0) + 1.55);
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(c.x, c.y, 7, 0, 6.2832); ctx.stroke();
    var a = REDUCE ? 0.6 : clock * 1.15;
    ctx.beginPath(); ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(a) * 6, c.y + Math.sin(a) * 3.5); ctx.stroke();
    Iso.box(ctx, { x: p.x - 0.55, y: p.y + 0.15, z: (p.z || 0) + 0.55, w: 0.42, d: 0.32, h: 0.08, color: C.paper });
  }

  var STROLLS = [BR_F, BR_Q, ARC, BR_T];
  var SHIRTS = ['#d94f3d', '#3f7fd4', '#8a5fd4', '#2f7a34', '#e0a94f'];
  var GUESTS = [];
  for (var gi = 0; gi < 10; gi++) {
    var rt = STROLLS[gi % STROLLS.length];
    GUESTS.push({
      route: rt,
      speed: 0.7 + Iso.hash2(gi, 3, 11) * 0.7,
      offset: Iso.hash2(gi, 7, 5) * rt.total,
      side: (gi % 2 ? 1 : -1) * 0.7,
      shirt: SHIRTS[gi % SHIRTS.length],
      hat: Iso.hash2(gi, 9, 2) > 0.6 ? '#f5c542' : '#ffffff'
    });
  }

  function docBox(ctx, x, y, label, c) {
    ctx.fillStyle = c; ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1;
    ctx.fillRect(x, y, 52, 28); ctx.strokeRect(x, y, 52, 28);
    ctx.fillStyle = '#3a4450'; ctx.font = 'bold 8px sans-serif';
    ctx.fillText(label, x + 4, y + 17);
  }

  var DETAILS = {
    depart: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Cinq questions avant toute pile', 10, 22);
      var qs = ['Fraîcheur', 'Corpus', 'Requêtes', 'Échelle', 'Équipe'];
      for (var i = 0; i < 5; i++) {
        ctx.fillStyle = [COL.frais, COL.corpus, COL.req, COL.ech, COL.eq][i];
        ctx.fillRect(12 + i * 58, 40, 52, 28);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText(qs[i], 16 + i * 58, 58);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = '9px sans-serif';
      ctx.fillText('Baseline mesurable → puis seulement complexifier', 10, h - 12);
    },
    fraicheur: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var labs = ['temps réel', 'quotidien', 'mensuel'];
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = ['#22c55e', '#f59e0b', '#ef4444'][i];
        ctx.fillRect(16 + i * 90, 36, 78, 40);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText(labs[i], 24 + i * 90, 60);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = '9px sans-serif';
      ctx.fillText('SLO de fraîcheur = délai source → index', 10, h - 12);
    },
    corpus: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Churn · taille · longue traîne', 10, 20);
      ctx.fillStyle = '#e9d5ff'; ctx.fillRect(16, 36, 240, 18);
      ctx.fillStyle = COL.corpus; ctx.fillRect(16, 36, 240 * 0.1, 18);
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('> 10 % / jour → éviter le pré-calcul total', 16, 74);
      ctx.fillText('90 % jamais lus → volée ou Hot/Cold', 16, 92);
    },
    requetes: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      docBox(ctx, 16, 28, 'SKU-441', '#dbeafe');
      docBox(ctx, 80, 28, 'comment…', '#fef3c7');
      docBox(ctx, 144, 28, 'et aussi…', '#ffe4e6');
      ctx.fillStyle = '#2f2113'; ctx.font = '9px sans-serif';
      ctx.fillText('exact → BM25   sens → rewrite/hybride   ×n → décomposer', 10, h - 14);
    },
    echelle: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var z = ['< 1k/j', '1–10k/j', '> 10k/j'];
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = '#fde68a'; ctx.fillRect(18 + i * 90, 30, 80, 70);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText(z[i], 28 + i * 90, 70);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('Heuristiques — le p95 et le pic ont le dernier mot', 10, h - 10);
    },
    equipe: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var roles = ['recherche', 'ML', 'SRE'];
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(20 + i * 90, 32, 78, 50);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText(roles[i], 30 + i * 90, 60);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('Viable = expliquable à 3 h du matin', 10, h - 12);
    },
    bm25: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Full-text BM25 — baseline', 10, 22);
      ctx.font = '9px sans-serif';
      ctx.fillText('termes × rareté × longueur   ·   0 modèle   ·   < 10 ms', 10, 48);
      ctx.fillStyle = COL.frais; ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Toute recette plus chère doit le battre.', 10, h - 16);
    },
    rewriting: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px sans-serif';
      ctx.fillText('« le truc pour la base »', 14, 32);
      ctx.fillStyle = COL.req; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('→ procédure de connexion SQL', 14, 58);
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('Protège le jargon · timeout · repli vers l’original', 10, h - 12);
    },
    hybride: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = COL.req; ctx.fillRect(16, 24, 120, 70);
      ctx.fillStyle = COL.ech; ctx.fillRect(150, 40, 90, 40);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('BM25 50–100', 28, 62);
      ctx.fillText('dense top 10', 160, 64);
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('Le p95 doit acheter le gain de rappel', 10, h - 10);
    },
    volee: function (ctx, w, h, t) {
      ctx.fillStyle = '#fff7ed'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 10px sans-serif';
      ctx.fillText('20–50 candidats embarqués maintenant', 10, 24);
      ctx.font = '9px sans-serif';
      ctx.fillText('Fraîcheur parfaite  ·  +200 à 500 ms  ·  K borné', 10, 52);
      ctx.fillText('Idéal si le churn dépasse ~10 % / jour', 10, 74);
    },
    'chaud-froid': function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(16, 28, 120, 70);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(150, 28, 120, 70);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
      ctx.fillText('HOT 20 %', 40, 68);
      ctx.fillText('COLD 80 %', 172, 68);
    },
    preembedding: function (ctx, w, h, t) {
      ctx.fillStyle = '#0e1a24'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#67e8f9';
      for (var i = 0; i < 28; i++) {
        ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t + i));
        ctx.beginPath();
        ctx.arc(20 + ((i * 41) % 260), 20 + ((i * 27) % 100), 3, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('HNSW · trafic élevé · corpus stable · double index', 8, h - 10);
    },
    'regle-8020': function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var row = [['60 %', 'lexical + rewrite'], ['25 %', 'hybride'], ['10 %', 'pré-emb.'], ['5 %', 'sur mesure']];
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(12, 18 + i * 28, 280, 24);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText(row[i][0] + '  ' + row[i][1], 20, 35 + i * 28);
      }
    },
    'multi-intent': function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('lire CSV  +  nettoyer  +  tracer', 12, 24);
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = ['#93c5fd', '#86efac', '#fde68a'][i];
        ctx.fillRect(16 + i * 90, 44, 80, 36);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText('sous-q ' + (i + 1), 28 + i * 90, 66);
      }
    },
    depreciation: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      docBox(ctx, 24, 36, 'modèle A', '#bfdbfe');
      docBox(ctx, 160, 36, 'modèle B', '#fecaca');
      ctx.fillStyle = '#2f2113'; ctx.font = 'bold 10px sans-serif';
      ctx.fillText('espaces incompatibles → migration + alias', 12, h - 14);
    },
    chunking: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#e2e8f0' : '#f8fafc';
        ctx.fillRect(12 + i * 50, 30, 62, 70);
        ctx.strokeStyle = '#94a3b8'; ctx.strokeRect(12 + i * 50, 30, 62, 70);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 8px sans-serif';
        ctx.fillText('c' + (i + 1), 30 + i * 50, 68);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('Inspecte les phrases coupées, pas seulement le score', 10, h - 10);
    },
    latence: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var steps = ['rewrite', 'BM25', 'embed', 'rerank', 'LLM'];
      for (var i = 0; i < 5; i++) {
        var hh = 20 + ((i * 17 + Math.floor(t * 8)) % 50);
        ctx.fillStyle = i === 2 ? COL.ech : '#cbd5e1';
        ctx.fillRect(18 + i * 56, 110 - hh, 46, hh);
        ctx.fillStyle = '#2f2113'; ctx.font = '7px sans-serif';
        ctx.fillText(steps[i], 20 + i * 56, 122);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('Budget par span · coupe au p95, pas à la moyenne', 10, h - 8);
    },
    preuves: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var m = [['Recall@k', 0.78], ['nDCG', 0.71], ['MRR', 0.64]];
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 9px sans-serif';
        ctx.fillText(m[i][0], 12, 28 + i * 32);
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(90, 18 + i * 32, 160, 12);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(90, 18 + i * 32, 160 * m[i][1], 12);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('Une variable à la fois · ADR avec rollback', 10, h - 10);
    },
    synthese: function (ctx, w, h, t) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w, h);
      var path = ['BM25', 'mesure', 'rewrite', 'hybride', 'stratégie'];
      for (var i = 0; i < 5; i++) {
        ctx.fillStyle = i === 0 ? C.gold : '#e2e8f0';
        ctx.fillRect(10 + i * 58, 40, 52, 36);
        ctx.fillStyle = '#2f2113'; ctx.font = 'bold 7px sans-serif';
        ctx.fillText(path[i], 14 + i * 58, 62);
      }
      ctx.fillStyle = '#2f2113'; ctx.font = '8px sans-serif';
      ctx.fillText('Hypothèse · métrique · seuil · budget · date', 10, h - 12);
    }
  };

  function mindmapHud(state) {
    var stop = STOP_BY_ID[state.stage];
    var zone = !stop || stop.act === 1 ? 'Questions' : stop.act === 2 ? 'Recettes' : 'Réflexes';
    return { layer: zone, batch: 'Baseline d’abord' };
  }

  global.Park = {
    C: C, BOUNDS: BOUNDS, GROUND: GROUND, LOTS: LOTS,
    ACT_NAMES: ACT_NAMES,
    laps: 1,
    loopExitStopId: 'preembedding',
    finalStopId: 'synthese',
    hud: mindmapHud,
    detailHeading: function (stop) { return stop.name + ' — sur la mindmap'; },
    skipRoadFurniture: true,
    routeStyles: ROUTE_STYLES,
    cargoLabels: {},
    loopCargo: {},
    routes: ROUTES,
    stations: STATIONS,
    stops: STOPS,
    stopById: STOP_BY_ID,
    buildings: B,
    guests: GUESTS,
    details: DETAILS,
    draw: {
      tree: tree, bush: bush, lamp: lamp, bench: bench, guest: guest,
      mover: decisionGuide
    }
  };
})(window);
