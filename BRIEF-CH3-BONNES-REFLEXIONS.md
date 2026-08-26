# Brief technique — Chapitre 3 « Les bonnes réflexions — bien choisir son RAG »

> Statut : spécification d’implémentation complète  
> Dossier cible : `projets/rag/ch3-bonnes-reflexions/`  
> Version de cache : `v=19`  
> Langue : français  
> Nombre d’arrêts : 19  
> Durée visée : environ 9 minutes  
> Source éditoriale principale : Rafael Pierre, « RAG Is Simpler Than You Think », Lighthouse AI, 10 juin 2026  
> Date de vérification des liens : 26 août 2026

## 1. Intention du chapitre

Ce chapitre apprend à choisir une architecture de retrieval avant d’apprendre à empiler ses composants. L’apprenant ne doit pas seulement connaître six recettes : il doit savoir poser les cinq questions qui éliminent les mauvaises options, reconnaître les risques cachés des embeddings et repartir avec un chemin d’expérimentation concret.

Le message directeur est : **commence simple, mesure, puis complexifie uniquement si une preuve le justifie**. Les seuils issus de l’article — 10 % de churn par jour, 1 000 ou 10 000 requêtes par jour, 200 à 500 ms, répartition 60/25/10/5 — sont des ordres de grandeur pédagogiques. Le chapitre doit explicitement demander de les remplacer par les mesures, les SLO et les tarifs réels du projet.

### Objectifs d’apprentissage

À la fin de la visite, l’apprenant doit pouvoir :

1. qualifier un besoin selon la fraîcheur, le corpus, les requêtes, l’échelle et l’équipe ;
2. expliquer les six recettes du retrieval, du BM25 seul au pré-embedding complet ;
3. choisir une première baseline et définir ce qui autoriserait l’étape suivante ;
4. anticiper multi-intent, changement de modèle, chunking et latence ;
5. formaliser une décision par des métriques, un jeu de test et un ADR.

## 2. Concept visuel impératif : une mindmap 3D isométrique

### 2.1 Direction artistique

Le parc n’est ni une usine, ni une chaîne de montage, ni un rail. C’est une **carte mentale paysagère** vue en isométrie : une grande rose des vents au centre, cinq branches colorées pour les questions, des feuilles en forme de fiches-recettes et un arc de garde-fous qui protège le parcours.

Le vocabulaire visuel autorisé est celui de la décision :

- rose des vents, boussole, jalons et chemins peints au sol ;
- panneaux directionnels et embranchements ;
- fiches-recettes posées sur des pupitres bas ;
- jauges de churn, de volume, de latence et de maturité ;
- feux tricolores, chronomètres, balances et cartes de score ;
- piles de fiches « chaud/froid », calendrier de modèle, carte découpée en chunks.

À proscrire : hangars, cheminées, convoyeurs, wagons, chariots de document, quais, entrepôts, grues et toute silhouette d’usine. Les formes restent dessinées dans le canvas avec les primitives `Iso.*` et de petites fonctions locales à `park.js` ; aucune image raster n’est nécessaire.

### 2.2 Lecture spatiale

- Le nœud central « Quel RAG pour mon besoin ? » est une place-boussole immédiatement identifiable.
- L’acte 1 forme le premier anneau : cinq questions, chacune avec sa couleur de branche.
- L’acte 2 forme les feuilles extérieures, de la recette la plus simple à la plus engagée.
- L’acte 3 forme un arc de garde-fous autour de la carte ; le nœud « Les preuves d’abord » revient vers le centre.
- Le nœud final « Le chemin recommandé » est proche du centre mais distinct du départ : visuellement, la visite revient avec une décision, pas au même point.

### 2.3 Branches logiques à dessiner

Les connexions sont sémantiques, pas un rail. Une branche principale est pleine ; une influence secondaire est en pointillés fins.

| Question | Feuilles principales | Influences secondaires |
|---|---|---|
| Fraîcheur | Embedding à la volée ; pré-embedding complet | Hot/Cold ; BM25 |
| Corpus | Hot/Cold ; pré-embedding complet | Embedding à la volée |
| Requêtes | BM25 ; rewriting ; hybride | Multi-intent |
| Échelle | BM25 ; Hot/Cold ; pré-embedding complet | Latence |
| Équipe | BM25 ; rewriting ; hybride | Hot/Cold ; pré-embedding complet |

Palette indicative : fraîcheur `#22c55e`, corpus `#a855f7`, requêtes `#3b82f6`, échelle `#f59e0b`, équipe `#ef6461`, garde-fous `#64748b`, synthèse `#f2c14e`. Les branches doivent rester lisibles sur le fond vert et ne jamais masquer les étiquettes.

### 2.4 Déplacement et visite

Le visiteur est représenté par le guide RAGTycoon à pied, avec une petite boussole ou un carnet. Il se déplace de nœud en nœud ; il ne transporte aucune cargaison. La lecture automatique suit l’ordre pédagogique des 19 arrêts. Le clic dans « Tout le parcours » continue d’utiliser `Tour.jumpTo`, le suivi caméra, le HUD, le guide, la progression et le lecteur audio existants.

Le trajet animé et les connexions logiques sont deux couches différentes : le premier peut être un sentier neutre très discret ; les secondes constituent la mindmap colorée. Cette séparation évite de faire croire que les recettes forment un pipeline linéaire.

### 2.5 Coordonnées et emprise

Coordonnées indicatives en unités de grille ; elles peuvent bouger de ±2 unités pour éviter une collision, sans changer la topologie.

| # | id | x | y | rayon de clic | forme 3D dominante |
|---:|---|---:|---:|---:|---|
| 1 | `depart` | 38 | 28 | 6 | grande rose des vents, boussole et cinq flèches |
| 2 | `fraicheur` | 21 | 16 | 5 | sablier, calendrier et feu de fraîcheur |
| 3 | `corpus` | 37 | 10 | 5 | pile de dossiers et double jauge churn/long-tail |
| 4 | `requetes` | 54 | 16 | 5 | panneau à deux directions « exact »/« sens » |
| 5 | `echelle` | 58 | 31 | 5 | compteur de requêtes et cadran de latence |
| 6 | `equipe` | 48 | 43 | 5 | table de décision, trois boîtes à outils et feu de maturité |
| 7 | `bm25` | 73 | 7 | 5 | fiche-recette blanche, loupe et index lexical |
| 8 | `rewriting` | 76 | 19 | 5 | fiche-recette, bulles de dialogue et panneau pivotant |
| 9 | `hybride` | 76 | 33 | 5 | balance bleu/orange, deux piles de candidats et podium top 10 |
| 10 | `volee` | 69 | 48 | 5 | fiche instantanée, éclair et petit chronomètre |
| 11 | `chaud-froid` | 54 | 57 | 5 | casier rouge/bleu et jauge Pareto 20/80 |
| 12 | `preembedding` | 35 | 59 | 5 | atlas de points, carte HNSW et jauge de stockage |
| 13 | `regle-8020` | 17 | 55 | 5 | grand cadran 60/25/10/5 et balance simplicité/complexité |
| 14 | `multi-intent` | 5 | 46 | 5 | panneau qui éclate une question en trois flèches |
| 15 | `depreciation` | 3 | 32 | 5 | calendrier, deux cartes-modèles et aiguillage par alias |
| 16 | `chunking` | 5 | 18 | 5 | carte-document découpée en tuiles avec chevauchement |
| 17 | `latence` | 16 | 6 | 5 | feu tricolore, chronomètre et budget de millisecondes |
| 18 | `preuves` | 24 | 40 | 5 | table A/B, cartes de score et sceau « mesuré » |
| 19 | `synthese` | 24 | 28 | 6 | boussole finale, checklist et chemin lumineux vers la baseline |

Emprise recommandée : `BOUNDS = { x0: -2, y0: 2, x1: 82, y1: 64 }`. Tester particulièrement la vue complète sur 390 × 844 px et sur 1366 × 768 px.

## 3. Arbre pédagogique et textes définitifs des arrêts

### Conventions de données

- `tag` est fourni ci-dessous même s’il n’était pas demandé explicitement, car le schéma réel des chapitres l’utilise.
- La valeur stockée dans `tip` **n’inclut pas** le préfixe. `ui.js` affiche déjà `<b>Astuce Tycoon :</b>` ; ne pas produire « Astuce Tycoon : Astuce Tycoon : ».
- `body` contient toujours 3 à 5 phrases. Les chiffres de prix sont attribués à l’exemple de l’article et présentés comme indicatifs.
- `Park.ACT_NAMES` doit valoir :

```js
{
  1: 'Acte 1 · Les questions à se poser',
  2: 'Acte 2 · Les six recettes',
  3: 'Acte 3 · Les réflexes'
}
```

### Arrêt 1 — `depart`

- **name** : `Quel RAG pour mon besoin ?`
- **act / tag** : `1` / `Décision`
- **position** : `(38, 28)`
- **forme** : grande rose des vents sur socle bas, boussole animée et cinq panneaux colorés.
- **short** : `Le bon RAG ne commence pas par une base vectorielle, mais par cinq questions et une baseline mesurable.`
- **body** : `Choisir un RAG, ce n’est pas choisir la pile la plus impressionnante : c’est réduire l’incertitude avec le système le plus simple qui répond au besoin. Commence par une recherche lexicale, mesure-la sur de vraies questions, puis demande ce qui échoue précisément. Fraîcheur, corpus, requêtes, échelle et équipe déterminent ensuite la recette acceptable. Chaque ajout doit acheter un gain observé en échange d’un coût, d’une latence et d’une complexité connus.`
- **tip** : `Écris la baseline, la métrique à améliorer et le seuil de succès avant de comparer le moindre moteur.`

### Arrêt 2 — `fraicheur`

- **name** : `Quelle fraîcheur faut-il ?`
- **act / tag** : `1` / `Question`
- **position** : `(21, 16)`
- **forme** : sablier transparent, calendrier à trois horizons et feu vert/orange/rouge.
- **short** : `Mesure le délai toléré entre une modification source et sa présence dans les résultats.`
- **body** : `La bonne question mesure non pas si les données changent, mais combien de retard une réponse peut tolérer. Du temps réel favorise le lexical ou l’embedding à la volée, car une réindexation complète crée une fenêtre de données périmées. Des mises à jour quotidiennes ou hebdomadaires rendent l’hybride praticable ; un corpus mensuel ou trimestriel rend le pré-embedding crédible. Mesure le délai source-vers-index, le taux de documents périmés et l’impact métier d’une réponse ancienne : ces trois nombres changent l’architecture.`
- **tip** : `Définis un SLO de fraîcheur par source ; « à jour » n’est pas une unité de mesure.`

### Arrêt 3 — `corpus`

- **name** : `À quoi ressemble le corpus ?`
- **act / tag** : `1` / `Question`
- **position** : `(37, 10)`
- **forme** : pile de dossiers, compteur de modifications et histogramme long-tail 90/10.
- **short** : `Churn, stabilité, taille et longue traîne disent quelles données méritent vraiment un vecteur stocké.`
- **body** : `Profile le corpus avant de l’embarquer : combien de documents, quelle taille, quels formats, quels doublons et quel taux de changement ? Au-delà d’environ 10 % de documents modifiés par jour, pré-embarquer tout le corpus oblige à une maintenance permanente. Si 90 % des documents ne sont jamais consultés, calculer et stocker leurs vecteurs à l’avance gaspille du travail ; la volée ou un tiering Hot/Cold devient plus logique. Un corpus stable, largement consulté et bien gouverné supporte beaucoup mieux le pré-embedding complet.`
- **tip** : `Trace une courbe cumulée documents/accès : elle révèle en une minute si ton « tout pré-calculer » sert réellement quelqu’un.`

### Arrêt 4 — `requetes`

- **name** : `Comment les utilisateurs cherchent-ils ?`
- **act / tag** : `1` / `Question`
- **position** : `(54, 16)`
- **forme** : panneau bifurqué « mots exacts » / « sens », bulles de questions et mini nuage de synonymes.
- **short** : `Les requêtes exactes, conversationnelles, mixtes ou multi-intent ne réclament pas le même retrieval.`
- **body** : `Prélève de vraies requêtes et classe-les : identifiants exacts, jargon, questions conversationnelles, synonymes, comparaisons ou demandes à plusieurs intentions. Les mots-clés, références produit et termes propriétaires donnent un avantage au lexical ; les formulations par le sens justifient d’essayer rewriting puis embeddings. Un trafic mixte appelle souvent un pipeline hybride ou un routage par type de requête, pas un unique marteau. Ce que la réponse change : exact dominant mène à BM25, décalage de vocabulaire au rewriting, sémantique prouvée à l’hybride, multi-intent à la décomposition.`
- **tip** : `Étiquette cent requêtes réelles avant de déclarer que tes utilisateurs « cherchent sémantiquement ».`

### Arrêt 5 — `echelle`

- **name** : `Quelle échelle, quelle performance ?`
- **act / tag** : `1` / `Question`
- **position** : `(58, 31)`
- **forme** : compteur à trois zones, cadran p50/p95/p99 et feu de saturation.
- **short** : `Le volume quotidien ne suffit pas : confronte débit, concurrence, p95, coût et fraîcheur.`
- **body** : `L’article propose un repère simple : sous 1 000 requêtes par jour, reste simple ; entre 1 000 et 10 000, optimise sélectivement ; au-delà de 10 000, une optimisation complète peut se justifier. Ce sont des heuristiques, pas des SLO : une pointe de cent requêtes simultanées peut compter davantage que la moyenne quotidienne. Mesure p50, p95, p99, débit, taux d’erreur et coût par requête avec le même top-k et le même corpus. Si la latence domine, pré-calculer aide ; si le trafic reste faible, l’infrastructure économisée vaut souvent plus que quelques millisecondes.`
- **tip** : `Teste le pic réel et le p95 ; une moyenne journalière peut cacher la seule minute qui fait tomber le service.`

### Arrêt 6 — `equipe`

- **name** : `Qui saura l’exploiter ?`
- **act / tag** : `1` / `Question`
- **position** : `(48, 43)`
- **forme** : table ronde, trois boîtes à outils « recherche », « ML », « plateforme » et feu de maturité.
- **short** : `Une architecture n’est viable que si l’équipe sait la tester, la surveiller et la réparer.`
- **body** : `Compte les compétences disponibles après la démo : recherche textuelle, ML, données, SRE, sécurité et évaluation. Sans expertise ML, BM25 plus rewriting reste explicable et réparable ; avec un peu d’expérience, l’hybride devient gérable ; une équipe ML et plateforme peut assumer index ANN, migrations de modèles et tuning. Ajoute aussi le temps d’astreinte, les runbooks et le propriétaire de chaque composant. Si personne ne sait diagnostiquer une baisse de rappel ou reconstruire un index, la recette est trop avancée pour aujourd’hui.`
- **tip** : `Choisis la solution que l’équipe de garde saura expliquer à trois heures du matin, pas seulement celle que le prototype sait lancer.`

### Arrêt 7 — `bm25`

- **name** : `Recette 1 · Full-text BM25`
- **act / tag** : `2` / `Recette 1`
- **position** : `(73, 7)`
- **forme** : fiche-recette, loupe, petit index alphabétique et voyant vert « baseline ».
- **short** : `Recherche lexicale seule : rapide, explicable et souvent suffisante pour les mots exacts et le jargon.`
- **body** : `BM25 classe les documents selon les termes présents, leur rareté et la longueur du texte, sans modèle d’embedding. Choisis-le pour démarrer, pour les identifiants exacts, les requêtes à mots-clés et le vocabulaire propriétaire. Le coût de modèle est nul et la recherche peut rester sous 10 ms dans l’exemple de l’article ; le résultat s’explique terme par terme et le document entier peut servir de première unité. Le piège est le vocabulaire différent — voiture contre automobile — et l’intention formulée sans les mots du document, pas un manque automatique de vecteurs.`
- **tip** : `Garde BM25 comme témoin permanent : toute recette plus chère doit le battre sur un jeu de questions étiqueté.`

### Arrêt 8 — `rewriting`

- **name** : `Recette 2 · Query rewriting`
- **act / tag** : `2` / `Recette 2`
- **position** : `(76, 19)`
- **forme** : fiche-recette, bulle utilisateur, bulle reformulée et panneau pivotant vers l’index lexical.
- **short** : `Un LLM transforme la question en requêtes lexicales propres, sans ré-embarquer le corpus.`
- **body** : `Le rewriting retire le bavardage, ajoute des synonymes, conserve le jargon métier et peut produire plusieurs sous-requêtes avant un BM25. Utilise-le quand les documents existent mais que les utilisateurs ne les nomment pas comme l’index, ou quand ils parlent de façon conversationnelle. L’article donne environ 0,001 dollar par requête avec GPT-4o-mini comme photographie de prix : revalide toujours modèle, tokens, cache et tarif au moment du projet. La latence d’un appel LLM et le risque de déformer un identifiant sont les pièges ; impose un schéma, un glossaire, un timeout et un repli vers la requête originale.`
- **tip** : `Protège les termes propriétaires dans le prompt et journalise requête originale, réécriture et gain de rappel.`

### Arrêt 9 — `hybride`

- **name** : `Recette 3 · Hybride sparse + dense`
- **act / tag** : `2` / `Recette 3`
- **position** : `(76, 33)`
- **forme** : balance à deux plateaux, pile BM25 de 50–100 cartes et podium sémantique top 10.
- **short** : `BM25 garde les bons candidats ; les embeddings réordonnent un petit top-k par le sens.`
- **body** : `Le pipeline récupère d’abord 50 à 100 candidats avec BM25, puis un modèle dense les réordonne pour conserver environ 10 passages. Essaie-le seulement si BM25 plus rewriting manque encore des résultats sémantiques et si un test A/B confirme le besoin. L’article estime à environ 0,0005 dollar l’embedding en ligne de 50 documents de 500 tokens et situe le compromis autour de 100 à 500 ms ; ces valeurs dépendent du modèle, du matériel et du cache. Les pièges sont le retour du chunking, la comparaison de scores incompatibles, les droits appliqués trop tard et une latence ajoutée qui n’achète pas assez de qualité.`
- **tip** : `Compare le gain de rappel ou de nDCG à la hausse du p95 ; « plus sémantique » n’est pas un résultat de test.`

### Arrêt 10 — `volee`

- **name** : `Recette 4 · Embedding à la volée`
- **act / tag** : `2` / `Recette 4`
- **position** : `(69, 48)`
- **forme** : fiche générée à l’instant, éclair, 20–50 cartes candidates et chronomètre orange.
- **short** : `On embarque seulement les quelques candidats de la requête : fraîcheur parfaite, latence assumée.`
- **body** : `BM25 sélectionne un petit K, puis la requête et 20 à 50 candidats sont embarqués et comparés au moment de la recherche. Cette recette convient à un churn supérieur à environ 10 % par jour, au contenu temps réel et aux phases où le modèle d’embedding change encore. Dans l’exemple de l’article, 1 000 requêtes par jour et 50 documents coûtent environ 15 dollars par mois, sans stockage vectoriel, mais ajoutent 200 à 500 ms par requête. Le piège est de laisser K grossir : la facture, le calcul et le p95 montent ensemble, même si la fraîcheur reste parfaite.`
- **tip** : `Fixe un budget K et un timeout ; au-delà, rends le meilleur lexical au lieu de bloquer toute la réponse.`

### Arrêt 11 — `chaud-froid`

- **name** : `Recette 5 · Tiers Hot/Cold`
- **act / tag** : `2` / `Recette 5`
- **position** : `(54, 57)`
- **forme** : casier rouge pré-embarqué, casier bleu à la volée et jauge Pareto 20/80.
- **short** : `Pré-embarque les documents très consultés et traite la longue traîne à la demande.`
- **body** : `Le tier chaud stocke les vecteurs des documents fréquents ; le tier froid conserve le texte et calcule les embeddings seulement lorsqu’un candidat rare apparaît. Choisis cette recette pour un corpus de plus de 100 000 documents, des accès très inégaux et un mélange de contenus stables et changeants. Si 20 % des documents servent 80 % du trafic, la majorité des requêtes reste rapide et une migration de modèle ne ré-embarque d’abord que le tier chaud. Les pièges sont une promotion mal mesurée, des seuils qui oscillent, un cold start lent et deux chemins de recherche qui fusionnent différemment.`
- **tip** : `Versionne la règle de promotion et mesure séparément le p95 des hits chauds, des hits froids et des recherches mixtes.`

### Arrêt 12 — `preembedding`

- **name** : `Recette 6 · Pré-embedding complet`
- **act / tag** : `2` / `Recette 6`
- **position** : `(35, 59)`
- **forme** : atlas de points reliés façon HNSW, jauge 6 Go et fiche-recette à bord rouge.
- **short** : `Tout le corpus est embarqué et indexé à l’avance pour servir vite un trafic élevé et stable.`
- **body** : `Chaque chunk reçoit un vecteur en amont, stocké dans un index ANN tel que HNSW, puis chaque requête ne calcule que son propre vecteur. Cette recette vise plus de 10 000 requêtes par jour, un besoin proche de 50 ms, un corpus très stable — environ moins de 5 % de churn mensuel dans l’article — et des accès largement répartis. L’ordre de grandeur donné pour un million de documents de 500 tokens est environ 10 dollars d’embedding initial et 6 Go de vecteurs bruts, hors index, réplication, exploitation et migrations. Les pièges sont les données périmées, la reconstruction coûteuse lors d’un changement de modèle, le cutover, le chunking à réévaluer et une infrastructure disproportionnée au trafic réel.`
- **tip** : `N’autorise cette recette qu’avec un benchmark de charge, une procédure de double index et un rollback testé.`

### Arrêt 13 — `regle-8020`

- **name** : `Le réflexe 80/20`
- **act / tag** : `3` / `Réflexe`
- **position** : `(17, 55)`
- **forme** : cadran 60/25/10/5, balance et panneau « stop si suffisant ».
- **short** : `Ne construis pas la solution des 5 % pour un problème qui appartient aux 60 %.`
- **body** : `Le repère de l’article est volontairement brutal : 60 % des systèmes devraient s’arrêter à full-text plus rewriting, 25 % ont besoin d’hybride, 10 % de pré-embedding et 5 % d’une solution sur mesure. Ce n’est pas une statistique universelle, mais un antidote utile à l’architecture par mode. À chaque palier, demande si la qualité mesurée franchit le seuil et si le gain rembourse latence, coût et exploitation. Si oui, arrête-toi : l’élégance d’un système tient aussi aux composants qu’il n’a pas.`
- **tip** : `Inscris une condition d’arrêt dans l’expérience ; sans elle, chaque bon résultat devient seulement la permission d’ajouter une couche.`

### Arrêt 14 — `multi-intent`

- **name** : `Décomposer le multi-intent`
- **act / tag** : `3` / `Réflexe`
- **position** : `(5, 46)`
- **forme** : une question longue qui se sépare en trois panneaux numérotés puis se rejoint sur une carte-réponse.
- **short** : `Une question qui demande trois choses doit souvent devenir trois recherches ciblées.`
- **body** : `« Lire un CSV, nettoyer les valeurs manquantes et tracer le résultat » contient trois intentions et parfois un ordre de dépendance. Un agent de compréhension produit des sous-requêtes focalisées, route chacune vers le retrieval le moins cher, les exécute en parallèle puis synthétise les passages. La latence parallèle suit approximativement la branche la plus lente, pas la somme, et seules les sous-requêtes difficiles paient un LLM ou des embeddings. Les pièges sont l’explosion du nombre de branches, les doublons, la perte des dépendances et une synthèse qui mélange des sources incompatibles.`
- **tip** : `Borne le nombre de sous-requêtes, conserve leur dépendance et exige une source identifiable pour chaque morceau de la synthèse.`

### Arrêt 15 — `depreciation`

- **name** : `Prévoir la dépréciation des modèles`
- **act / tag** : `3` / `Réflexe`
- **position** : `(3, 32)`
- **forme** : calendrier, cartes « modèle A/B », deux index et levier d’alias atomique.
- **short** : `Un vecteur n’est comparable qu’aux vecteurs du même espace : changer de modèle est une migration.`
- **body** : `Un modèle d’embedding peut être retiré, devenir trop cher ou être dépassé ; les anciens vecteurs ne deviennent pas compatibles avec le nouveau par magie. À la volée, le changement touche surtout l’appel et les tests ; en pré-embedding, il faut reconstruire, comparer, basculer et pouvoir revenir en arrière. Versionne modèle, dimensions, normalisation, chunking et index dans chaque trace, puis prépare un double index derrière un alias. Le piège absolu est de mélanger silencieusement une requête du modèle B avec des documents du modèle A.`
- **tip** : `Traite chaque changement d’embedding comme une migration de schéma avec jeu de régression, alias atomique et rollback.`

### Arrêt 16 — `chunking`

- **name** : `Le chunking revient avec les embeddings`
- **act / tag** : `3` / `Réflexe`
- **position** : `(5, 18)`
- **forme** : grand document découpé en tuiles, repères de section et chevauchements translucides.
- **short** : `BM25 peut démarrer sur des documents entiers ; les embeddings obligent à choisir l’unité de sens.`
- **body** : `Dès qu’un passage devient un vecteur, il faut décider où il commence, où il finit et quel contexte il transporte. Taille fixe, chevauchement, titres, sections, tableaux ou découpe sémantique modifient rappel, précision, coût et citations. Commence par une baseline simple et reproductible, puis compare sur les mêmes questions les chunks retrouvés, les doublons du top-k et la capacité à citer. Le piège est d’optimiser une taille moyenne sans regarder les frontières qui coupent la réponse ou les métadonnées qui la rendent inutilisable.`
- **tip** : `Inspecte les chunks ratés à côté de la source ; un score global ne montre pas une phrase coupée entre deux tuiles.`

### Arrêt 17 — `latence`

- **name** : `La latence est le vrai coût`
- **act / tag** : `3` / `Réflexe`
- **position** : `(16, 6)`
- **forme** : chronomètre, budget en segments et feu vert/orange/rouge au p95.
- **short** : `Quelques fractions de centime peuvent être acceptables ; 300 ms ajoutées à chaque question restent visibles.`
- **body** : `Décompose le temps : réécriture, lexical, embedding de la requête, embedding des candidats, reranking, génération et réseau. L’article situe l’embedding en ligne de 20 à 50 documents autour de 200 à 500 ms, une différence immédiatement perceptible dans une interface. Mesure chaque span et le p95 de bout en bout, puis fixe un budget par étape et un chemin de repli. Le piège est d’admirer le coût token très bas tout en laissant plusieurs appels séquentiels transformer une recherche vive en attente.`
- **tip** : `Parallélise les branches indépendantes et coupe proprement une étape coûteuse quand son budget est épuisé.`

### Arrêt 18 — `preuves`

- **name** : `Les preuves d’abord`
- **act / tag** : `3` / `Réflexe`
- **position** : `(24, 40)`
- **forme** : table A/B, cartes Recall@k/nDCG/MRR, pouces utilisateur et sceau « décision ».
- **short** : `Évalue la baseline, formule une plainte précise et ne change qu’une variable à la fois.`
- **body** : `Fais tourner BM25 pendant deux à quatre semaines si le contexte le permet, collecte les requêtes, les clics, les abstentions et les retours utilisateurs, puis construis un petit jeu de vérité terrain. Mesure d’abord le retrieval — Recall@k, MRR ou nDCG — avant la fidélité et la qualité de la réponse, sinon le générateur masque la cause. Compare rewriting, hybride ou nouvelle découpe sur le même corpus, avec p95 et coût par requête, puis documente l’intervalle et les régressions. Une amélioration moyenne qui dégrade les identifiants exacts, les droits ou un segment critique n’est pas une victoire.`
- **tip** : `Écris dans l’ADR la preuve qui autorise l’étape suivante et la preuve qui impose de revenir en arrière.`

### Arrêt 19 — `synthese`

- **name** : `Le chemin recommandé`
- **act / tag** : `3` / `Synthèse`
- **position** : `(24, 28)`
- **forme** : boussole finale, checklist lumineuse et quatre jalons BM25 → rewriting → hybride → stratégie d’embedding.
- **short** : `BM25 d’abord, mesure ensuite, puis rewriting, hybride et pré-calcul seulement si les résultats l’exigent.`
- **body** : `Construis BM25, garde-le comme témoin et mesure de vraies requêtes pendant une période définie. Si des documents connus restent introuvables, teste le rewriting ; si le sens manque encore, teste l’hybride et décide si sa latence achète assez de qualité. Pour l’embedding des candidats, choisis la volée avec un churn fort, Hot/Cold avec une longue traîne claire, et le pré-embedding complet seulement avec corpus stable, trafic élevé et équipe prête. Le bon livrable n’est pas « nous avons une base vectorielle » : c’est une décision réversible, chiffrée et compréhensible.`
- **tip** : `Ta prochaine étape doit tenir en une expérience : une hypothèse, une métrique, un seuil, un budget et une date de décision.`

## 4. `technos.js` — contenu définitif

Le fichier doit reprendre exactement l’enveloppe IIFE des chapitres existants. Tous les outils proposés sont open source ; les lectures renvoient en priorité vers l’article source, la documentation officielle ou un papier primaire. Les URLs ci-dessous ont répondu correctement lors de la vérification du 26 août 2026 ; les redirections canoniques de Chonkie, LlamaIndex et Qdrant sont acceptées.

```js
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
```

### Règles d’affichage des ressources

- Les prix de l’article ne doivent jamais être présentés dans `technos.js` comme des tarifs actuels garantis.
- Aucun outil externe n’est chargé ou exécuté par la page : les URLs sont de simples liens du guide, ouverts seulement après action de l’utilisateur.
- Garder `rel="noopener"` et `target="_blank"`, comme dans `ui.js`.
- Si une URL cesse de répondre avant livraison, la remplacer par la documentation officielle canonique du même projet et refaire la vérification.

## 5. `narration.json` — texte définitif

Contraintes : voix Inworld TTS v2 « Hélène », génération hors ligne, fichiers commités dans `audio/`, aucune synthèse au runtime. Le texte reste naturel à l’oral, développe les acronymes à leur première apparition utile et contient 2 à 4 phrases par arrêt.

```json
{
  "depart": "Arrêt un, Quel RAG pour mon besoin ? Le bon choix ne commence pas par une base vectorielle, mais par cinq questions et une baseline mesurable. Nous allons partir du plus simple et n’ajouter une couche que lorsqu’une preuve le justifie.",
  "fraicheur": "Arrêt deux, Quelle fraîcheur faut-il ? Mesure le délai toléré entre une modification de la source et sa présence dans les résultats. Le temps réel favorise le lexical ou l’embedding à la volée ; un corpus stable rend le pré-embedding plus raisonnable.",
  "corpus": "Arrêt trois, À quoi ressemble le corpus ? Observe le volume, les formats, les doublons, le churn et la répartition des accès. Si plus de dix pour cent change chaque jour, ou si quatre-vingt-dix pour cent n’est jamais consulté, pré-calculer tous les vecteurs devient difficile à défendre.",
  "requetes": "Arrêt quatre, Comment les utilisateurs cherchent-ils ? Les identifiants exacts et le jargon favorisent le lexical ; les formulations conversationnelles peuvent bénéficier du rewriting, puis des embeddings si le gain est prouvé. Une question qui contient plusieurs intentions doit d’abord être décomposée.",
  "echelle": "Arrêt cinq, Quelle échelle, quelle performance ? Sous mille requêtes par jour, une solution simple suffit souvent ; au-delà, mesure concurrence, débit et latence au percentile quatre-vingt-quinze. Ces seuils sont des repères, et tes objectifs de service doivent avoir le dernier mot.",
  "equipe": "Arrêt six, Qui saura l’exploiter ? Une architecture est viable si l’équipe sait l’évaluer, la surveiller, la migrer et la réparer. Sans expertise machine learning, BM25 plus rewriting est un excellent terrain ; les index avancés demandent des propriétaires, des runbooks et du temps d’exploitation.",
  "bm25": "Arrêt sept, recette un, Full-text BM25. C’est rapide, explicable et sans coût de modèle, idéal pour les mots exacts et le vocabulaire propriétaire. Il manque des synonymes et du sens, mais reste la baseline que toutes les recettes suivantes doivent battre.",
  "rewriting": "Arrêt huit, recette deux, Query rewriting. Un modèle de langage nettoie la question, ajoute des synonymes, protège le jargon et peut produire plusieurs recherches lexicales. Le prix indicatif est faible, mais il faut mesurer la latence et empêcher la reformulation de déformer un identifiant important.",
  "hybride": "Arrêt neuf, recette trois, Hybride sparse plus dense. BM25 récupère cinquante à cent candidats, puis les embeddings réordonnent un top dix par le sens. Le gain peut être réel, mais le chunking revient et cent à cinq cents millisecondes supplémentaires doivent acheter une amélioration mesurée.",
  "volee": "Arrêt dix, recette quatre, Embedding à la volée. On embarque seulement vingt à cinquante candidats au moment de la requête, ce qui garde les données fraîches et facilite le changement de modèle. La contrepartie est une latence de deux cents à cinq cents millisecondes, donc le budget K doit rester borné.",
  "chaud-froid": "Arrêt onze, recette cinq, Tiers Hot et Cold. Les documents fréquents ont déjà leurs vecteurs ; la longue traîne est embarquée à la demande. Cette stratégie exploite le Pareto vingt-quatre-vingts, à condition de mesurer les promotions, les démotions et la latence du tier froid.",
  "preembedding": "Arrêt douze, recette six, Pré-embedding complet. Tout le corpus est vectorisé en amont et recherché dans un index de voisins approchés, pour servir vite un trafic élevé. Cette recette exige un corpus stable, une équipe prête aux migrations et un double index pour changer de modèle sans pari irréversible.",
  "regle-8020": "Arrêt treize, le réflexe quatre-vingts vingt. Le repère de l’article est simple : soixante pour cent des systèmes s’arrêtent au lexical plus rewriting, vingt-cinq pour cent vont vers l’hybride, dix pour cent pré-embarquent tout et cinq pour cent ont besoin de sur-mesure. Ne construis pas la solution des cinq pour cent pour un problème des soixante pour cent.",
  "multi-intent": "Arrêt quatorze, Décomposer le multi-intent. Une question qui demande de lire, nettoyer puis tracer des données contient trois recherches et un ordre de dépendance. Décompose, route chaque sous-question vers la méthode la moins chère, exécute en parallèle, puis synthétise avec une source par partie.",
  "depreciation": "Arrêt quinze, Prévoir la dépréciation des modèles. Les vecteurs de deux modèles différents ne partagent pas le même espace. Versionne le modèle, les dimensions, la normalisation et le chunking, puis migre avec un second index, un alias atomique et un retour arrière testé.",
  "chunking": "Arrêt seize, Le chunking revient avec les embeddings. Dès qu’un passage devient un vecteur, il faut choisir ses frontières, son chevauchement et ses métadonnées. Commence par une découpe reproductible, puis inspecte les phrases coupées, les doublons du top K et la qualité des citations.",
  "latence": "Arrêt dix-sept, La latence est le vrai coût. Décompose le temps entre réécriture, retrieval, embedding, reranking et génération, puis mesure le percentile quatre-vingt-quinze. Un coût token minuscule ne compense pas une interface rendue lente par plusieurs appels séquentiels.",
  "preuves": "Arrêt dix-huit, Les preuves d’abord. Collecte de vraies requêtes, construis un petit jeu de vérité terrain et mesure le rappel, le rang et la qualité de réponse sur le même corpus. Change une variable à la fois et écris la preuve qui autorise l’étape suivante ou impose le retour arrière.",
  "synthese": "Arrêt dix-neuf, Le chemin recommandé. Commence par BM25, teste le rewriting si les documents connus restent introuvables, puis l’hybride si le sens manque encore. Choisis la volée pour le churn, Hot et Cold pour la longue traîne, et le pré-embedding complet seulement pour un corpus stable, un trafic élevé et une équipe prête."
}
```

### Correspondance audio obligatoire

Pour chaque clé ci-dessus, produire exactement un fichier :

```text
audio/stop-depart.mp3
audio/stop-fraicheur.mp3
audio/stop-corpus.mp3
audio/stop-requetes.mp3
audio/stop-echelle.mp3
audio/stop-equipe.mp3
audio/stop-bm25.mp3
audio/stop-rewriting.mp3
audio/stop-hybride.mp3
audio/stop-volee.mp3
audio/stop-chaud-froid.mp3
audio/stop-preembedding.mp3
audio/stop-regle-8020.mp3
audio/stop-multi-intent.mp3
audio/stop-depreciation.mp3
audio/stop-chunking.mp3
audio/stop-latence.mp3
audio/stop-preuves.mp3
audio/stop-synthese.mp3
```

Le lecteur doit prendre le nom depuis `audio/stop-<id>.mp3`, sans table de correspondance manuelle. La durée de première lecture de chaque station est `max(temps_de_lecture_du_texte, durée_audio + 2 s)`, comme au chapitre 2.

## 6. Sommaire `projets/rag/index.html`

### 6.1 Nouvel ordre

1. Chapitre 1 — Le pipeline RAG — disponible, inchangé.
2. Chapitre 2 — Socle technique — ingestion & monitoring — disponible, inchangé.
3. Chapitre 3 — Les bonnes réflexions — bien choisir son RAG — disponible.
4. Chapitre 4 — Embeddings & base vectorielle — bientôt.
5. Chapitre 5 — Recherche avancée & RAG agentique — bientôt.
6. Chapitre 6 — Production, évaluation & architecture Orange — bientôt.

Ne modifier aucun texte, lien ou comportement des chapitres 1 et 2. Renuméroter les classes de tags des anciennes cartes si elles codent le numéro (`tag-ch3`, etc.) et ajouter `tag-ch6` en conservant un contraste accessible.

### 6.2 Texte exact des cartes ch3 à ch6

#### Carte chapitre 3 — disponible

- Icône : `🧭`
- Barre de titre : `Chapitre 3`
- Tag : `Chapitre 3 · Disponible`
- Titre : `Les bonnes réflexions — bien choisir son RAG`
- Description : `Cinq questions, six recettes et six garde-fous pour choisir entre BM25, rewriting, hybride, embedding à la volée, Hot/Cold et pré-embedding complet — sans sur-construire.`
- Meta : `19 arrêts · ~9 min`
- Lien : `ch3-bonnes-reflexions/index.html`
- Libellé d’action si la carte reçoit un bouton : `▶ Explorer la mindmap`

#### Carte chapitre 4 — bientôt

- Icône : `🧬`
- Barre de titre : `Chapitre 4`
- Tag : `Chapitre 4`
- Titre : `Embeddings & base vectorielle`
- Description : `Modèles d’embedding, espaces sémantiques, chunking, distances, index HNSW, choix entre pgvector, Qdrant et Milvus, filtrage et droits.`
- Meta : `18 arrêts · ~8 min`
- État : carte `disabled` avec badge `Bientôt`, sans lien actif.

#### Carte chapitre 5 — bientôt

- Icône : `🔍`
- Barre de titre : `Chapitre 5`
- Tag : `Chapitre 5`
- Titre : `Recherche avancée & RAG agentique`
- Description : `Query rewriting, multi-query, recherche hybride BM25 + dense, RRF, reranking, GraphRAG, décomposition et agents multi-sauts.`
- Meta : `20 arrêts · ~9 min`
- État : carte `disabled` avec badge `Bientôt`, sans lien actif.

#### Carte chapitre 6 — bientôt

- Icône : `📊`
- Barre de titre : `Chapitre 6`
- Tag : `Chapitre 6`
- Titre : `Production, évaluation & architecture Orange`
- Description : `Observabilité, RAGAS, jeux de test, sécurité et RGPD, choix d’hébergement — puis le livrable final : le document d’architecture Orange.`
- Meta : `18 arrêts · ~8 min`
- État : carte `disabled` avec badge `Bientôt`, sans lien actif.

### 6.3 Hero du chapitre 3 dans le sommaire

Ajouter un hero disponible après celui du chapitre 2.

- Barre : `Chapitre 3 · Les bonnes réflexions — bien choisir son RAG`
- Titre : `La mindmap qui évite de sur-construire son RAG`
- Texte : `Pars de cinq questions — fraîcheur, corpus, requêtes, échelle et équipe — puis compare six recettes du BM25 au pré-embedding complet. Les garde-fous te ramènent toujours aux preuves : 19 arrêts, environ 9 minutes, dans un arbre de décision isométrique.`
- Bouton : `▶ Explorer la mindmap`
- Lien : `ch3-bonnes-reflexions/index.html`
- Aide contrôles : `Espace = pause · S = nœud suivant · R = recommencer · clic sur un nœud = son explication · molette = zoom · double-clic = vue complète.`

## 7. `index.html` du chapitre 3 — textes et structure

### Métadonnées

```html
<title>Chapitre 3 · Les bonnes réflexions — bien choisir son RAG — RAGTycoon</title>
<meta name="description" content="Une mindmap 3D isométrique pour choisir son RAG : cinq questions, six recettes du BM25 au pré-embedding complet, puis six garde-fous. Dix-neuf arrêts, en français." />
```

### En-tête et HUD

- Sous-titre de marque : `Chapitre 3 · Les bonnes réflexions — bien choisir son RAG`
- HUD 1 : libellé `Nœuds vus`, valeur initiale `0 / 19`
- HUD 2 : libellé `Zone`, valeur initiale `Questions`
- HUD 3 : libellé `Boussole`, valeur initiale `Baseline d’abord`
- Guide : `Guide de la mindmap`
- Première puce : `Arrêt 1 sur 19`
- Premier titre : `Quel RAG pour mon besoin ?`
- Libellé du bouton step : titre `Passer au nœud suivant (S)` ; le glyph `⇥` peut rester.
- Toggle labels : remplacer le libellé visible `Panneaux` par `Nœuds`.
- Liste : titre `Toute la mindmap` ; aide `clique sur un nœud pour t’y rendre`.

### Bloc « Ce que tu regardes »

Texte exact :

> La boussole centrale pose la décision. Les cinq branches colorées qualifient la fraîcheur, le corpus, les requêtes, l’échelle et l’équipe. Les fiches extérieures sont six recettes, du BM25 au pré-embedding complet. L’arc de garde-fous rappelle le multi-intent, les migrations de modèles, le chunking, la latence et l’évaluation. Le guide marche de nœud en nœud : il ne transporte pas un document et la carte ne représente pas un pipeline.

### Modal « À propos »

Utiliser les sections et textes exacts suivants :

#### Ce que c’est

> Ce chapitre est une mindmap de décision. Il ne montre pas comment un document traverse un pipeline : il apprend à choisir le retrieval adapté avant de construire. Le centre pose la question, cinq branches qualifient le besoin, six fiches proposent des recettes et six garde-fous empêchent la sur-ingénierie.

#### Pourquoi une mindmap

> Un choix de RAG n’est pas une chaîne unique. Une même recette peut être influencée par la fraîcheur, la forme du corpus, les requêtes, l’échelle et les compétences disponibles. Les connexions colorées rendent ces influences visibles ; le sentier du guide donne seulement un ordre pédagogique.

#### Rythme

> La première visite compte dix-neuf arrêts et dure environ neuf minutes. Le guide attend à chaque nouveau nœud assez longtemps pour lire l’explication ou écouter la narration. Espace maintient l’arrêt, S passe au suivant et le curseur de vitesse met le déplacement et le temps de lecture à l’échelle.

#### Contrôles

> Espace : lecture ou pause. S : nœud suivant. R : recommencer. F : caméra suiveuse. L : étiquettes. Glisser déplace la carte, la molette zoome et le double-clic cadre toute la mindmap. La liste du guide permet de rejoindre directement un nœud.

#### À quel point c’est exact

> Les cinq facteurs, les six recettes, les ordres de grandeur et la règle 60/25/10/5 viennent de l’article « RAG Is Simpler Than You Think » de Rafael Pierre. Les seuils sont des repères pédagogiques, pas des garanties : un projet doit revalider ses tarifs, son corpus, ses SLO et ses mesures. La méthode RAGTycoon reste constante : baseline simple, jeu de test, changement isolé, décision documentée.

#### Technique

> Aucune dépendance, aucun build et aucune API au runtime. Le parc, ses branches, ses panneaux, ses jauges et son guide sont dessinés avec des primitives dans un canvas. La narration et les données du chapitre sont des fichiers statiques servis avec la page.

## 8. Spécification technique

### 8.1 Arborescence attendue

```text
projets/rag/ch3-bonnes-reflexions/
├── index.html
├── park.js
├── technos.js
├── narration.json
└── audio/
    ├── stop-depart.mp3
    ├── ...
    └── stop-synthese.mp3
```

Aucune bibliothèque, police, image, CDN ou module npm n’est ajouté. Le chapitre fonctionne en fichiers statiques sur GitHub Pages.

### 8.2 Ordre des scripts et cache-busting

Tous les assets locaux chargés par la page, y compris les CSS partagées, utilisent `?v=19`. Ordre impératif :

```html
<link rel="stylesheet" href="../../../css/xp.css?v=19" />
<link rel="stylesheet" href="../../../css/styles.css?v=19" />

<script src="../../../js/iso.js?v=19"></script>
<script src="park.js?v=19"></script>
<script src="technos.js?v=19"></script>
<script src="../../../js/tour.js?v=19"></script>
<script src="../../../js/render.js?v=19"></script>
<script src="../../../js/ui.js?v=19"></script>
<script src="../../../js/main.js?v=19"></script>
<script src="../../../js/pixel-guy.js?v=19"></script>
```

Le favicon `data:` reste embarqué et ne nécessite pas de version.

### 8.3 Réutilisation du moteur et adaptations minimales

Le moteur partagé doit rester la base. Le chapitre ne doit pas copier `tour.js`, `render.js`, `ui.js` ou `main.js` dans son dossier. Le comportement actuel contient toutefois trois hypothèses propres à l’usine : trois tours de boucle, un arrêt final nommé `eval` et un chariot dessiné en dur. Les adaptations suivantes sont donc nécessaires et doivent être **optionnelles avec fallback**, afin que ch1 et ch2 gardent exactement leur comportement.

#### `tour.js` — trois options `Park`

1. Initialiser `state.laps` avec `Park.laps || 3`.
2. Remplacer le test en dur `st.id === 'loopct'` par `st.id === (Park.loopExitStopId || 'loopct')`.
3. Remplacer le test en dur `st.id === 'eval'` par `st.id === (Park.finalStopId || 'eval')`.

Dans le chapitre 3 :

```js
Park.laps = 1;
Park.loopExitStopId = 'preembedding';
Park.finalStopId = 'synthese';
```

Ce changement suffit à réutiliser la machine d’état actuelle :

- route `intake` : `depart` puis les cinq questions ;
- route `loop` : les six recettes, avec sortie après `preembedding` et une seule passe ;
- route `exit` : les six réflexes, de `regle-8020` à `preuves` ;
- route `deliver` : `synthese` ;
- route `ret` : retour discret vers le centre avant une nouvelle visite.

Il n’y a aucun arrêt technique caché : les 19 stations sont exactement les 19 entrées de `Park.stops`.

#### `render.js` — marcheur et styles de branches optionnels

Ajouter un hook optionnel au début du rendu du véhicule : si `Park.draw.mover` existe, appeler `Park.draw.mover(ctx, p, state, clock)` puis retourner ; sinon dessiner le chariot/camion actuel. Le chapitre 3 fournit `Park.draw.mover` en réutilisant le dessin du personnage et en ajoutant une boussole/carnet. Il ne fournit aucune cargaison et `cargoLabels` reste vide.

Ajouter `Park.routeStyles`, dictionnaire optionnel par nom de route, avec les clés suivantes :

```js
{
  hidden: false,
  edge: '#b09a72',
  fill: '#cbb68e',
  dash: 'rgba(120,96,60,0.35)',
  edgeWidth: 2.6,
  width: 2.2,
  dashed: true
}
```

Les valeurs actuelles sont les fallbacks exacts. Le chapitre 3 masque seulement les polylignes techniques de visite et expose comme routes décoratives les connexions colorées de la mindmap, sans stations. Ainsi, `render.js` continue à dessiner et échantillonner des objets `makeRoute` standards.

#### `ui.js` — HUD optionnel

Ajouter un hook `Park.hud(state)` optionnel. S’il existe, il renvoie `{ layer, batch }` et remplace uniquement les deux valeurs `ui-hudLayer` et `ui-hudBatch`. Sinon, conserver `lap + ' sur ' + laps + ' passes'` et `'#' + batch`.

Le chapitre 3 renvoie :

```js
function mindmapHud(state) {
  var stop = Park.stopById[state.stage];
  var zone = !stop || stop.act === 1 ? 'Questions' : stop.act === 2 ? 'Recettes' : 'Réflexes';
  return { layer: zone, batch: 'Baseline d’abord' };
}
```

Aucune autre modification du moteur partagé n’est autorisée sans constat de blocage documenté. Après ces hooks, lancer les chapitres 1 et 2 pour confirmer leur stricte rétrocompatibilité visuelle et fonctionnelle.

### 8.4 Contrat `park.js`

`park.js` doit exposer au minimum :

```js
global.Park = {
  C: C,
  BOUNDS: BOUNDS,
  GROUND: GROUND,
  LOTS: LOTS,
  ACT_NAMES: ACT_NAMES,
  laps: 1,
  loopExitStopId: 'preembedding',
  finalStopId: 'synthese',
  hud: mindmapHud,
  routeStyles: ROUTE_STYLES,
  cargoLabels: {},
  loopCargo: {},
  routes: ROUTES,
  stations: STATIONS,
  stops: STOPS,
  stopById: STOP_BY_ID,
  buildings: NODES,
  guests: GUESTS,
  details: DETAILS,
  draw: {
    tree: tree,
    bush: bush,
    lamp: lamp,
    bench: bench,
    guest: guest,
    mover: decisionGuide
  }
};
```

`LOTS` représente de petites plateformes de décision, jamais des fondations de bâtiments. `buildings` peut garder ce nom contractuel pour `render.js`, mais ses entrées dessinent des nœuds, panneaux, fiches et jauges. Chaque entrée conserve `{ x, y, w, d, draw }` pour le painter’s algorithm.

### 8.5 Routes et stations

- La route automatique suit l’ordre 1 → 19 sans répétition pendant la première visite.
- Les routes décoratives de branche ont `stations: []` et ne sont jamais choisies par `Tour`.
- Toute station possède `read`, calculé comme au chapitre 2 à partir de `short + body + tip`, puis relevé à `durée audio + 2 s` si nécessaire.
- `Tour.jumpTo(id)` doit trouver exactement une station pour chaque id de `Park.stops`.
- Une route ne doit jamais traverser le rayon cliquable d’un nœud qui n’est pas sa destination.
- La caméra suiveuse vise le marcheur ; « vue complète » cadre l’emprise entière avec le panneau latéral ouvert.

### 8.6 Détails visuels et accessibilité

- Une forme ne doit pas dépendre uniquement de sa couleur : ajouter symbole, texte court ou silhouette distincte.
- Tous les labels de nœuds restent en français et reprennent `stop.name`.
- Contraste WCAG AA pour les textes DOM ; sur canvas, viser au moins un contraste équivalent et un contour sombre autour des libellés clairs.
- Le focus actif utilise l’anneau animé existant ; le nœud central a une pulsation plus lente, non stroboscopique.
- Respecter `prefers-reduced-motion` si déjà géré ; sinon, réduire rotations et pulsations sans supprimer la progression.
- Ne pas dessiner plus d’objets décoratifs que nécessaire : la mindmap doit rester lisible au zoom « voir tout ».

### 8.7 Runtime statique

La formule « aucun appel réseau au runtime » signifie ici : aucune API, aucun CDN, aucun modèle distant, aucune télémétrie et aucun contenu externe requis pour fonctionner. Les seules requêtes HTTP autorisées sont les chargements statiques same-origin de la page, des JS/CSS, de `narration.json` et des MP3 déjà commités — contrainte inhérente à GitHub Pages et identique au chapitre 2. Les liens de `technos.js` ne sont ouverts qu’après un clic explicite de l’utilisateur.

Le TTS Inworld v2 est un outil de production hors ligne : sa clé, son script et ses réponses ne sont jamais livrés au navigateur.

### 8.8 Stockage local

- Clé de checklist : `ragtycoon.ch3.ok`.
- Une case « j’ai compris » par nœud, 19 au total.
- Aucun partage de progression avec ch1 ou ch2.
- Une erreur de parsing du `localStorage` retombe sur `{}` sans erreur console, comme au chapitre 2.

## 9. Règles éditoriales

- Français strict dans l’interface et les explications. Les noms consacrés d’outils et de recettes (`BM25`, `Query rewriting`, `Hot/Cold`, `full-text`) peuvent rester en anglais, mais sont expliqués en français.
- Tutoiement cohérent avec les astuces et ton direct, jamais culpabilisant.
- Pas de promesse absolue : écrire « peut », « ordre de grandeur », « dans l’exemple de l’article ».
- Ne jamais transformer les seuils de l’article en exigences universelles.
- Séparer explicitement coût d’API, coût d’infrastructure, coût humain et latence.
- Ne pas dire que BM25 « n’a pas besoin d’évaluation » : il est simple à évaluer, mais il reste une baseline à mesurer.
- Ne pas dire que changer de modèle à la volée ne demande « qu’une ligne » : le chapitre ajoute correctement tests de régression et validation.
- Les droits et filtres restent un invariant : toute recette de retrieval doit filtrer avant qu’un passage interdit atteigne le prompt, même si ce chapitre ne redéveloppe pas le sujet du chapitre 2.

## 10. Definition of Done

### Contenu et données

- [ ] `Park.stops.length === 19`.
- [ ] Les ids, noms, actes, positions, `short`, `body` et `tip` correspondent exactement à la section 3.
- [ ] Chaque `body` contient 3 à 5 phrases et chaque astuce une phrase.
- [ ] `Park.ACT_NAMES` contient exactement les trois actes spécifiés.
- [ ] `TECHNOS` possède exactement les 19 clés de `Park.stopById`, sans clé orpheline.
- [ ] Tous les objets outils utilisent seulement `{ n, u, d }` et toutes les références seulement `{ t, u, d }`.
- [ ] `narration.json` possède exactement les 19 mêmes clés, sans clé manquante ou supplémentaire.
- [ ] Chaque narration commence par « Arrêt <nombre en lettres> » et contient 2 à 4 phrases.
- [ ] Les 19 MP3 existent, se chargent et correspondent au bon nœud.
- [ ] Le titre et la description du sommaire ch3 à ch6 sont exactement ceux de la section 6.

### Validation syntaxique

- [ ] `node --check projets/rag/ch3-bonnes-reflexions/park.js` réussit.
- [ ] `node --check projets/rag/ch3-bonnes-reflexions/technos.js` réussit.
- [ ] `node -e "JSON.parse(require('fs').readFileSync('projets/rag/ch3-bonnes-reflexions/narration.json','utf8'))"` réussit.
- [ ] Un script de contrôle compare les trois ensembles d’ids `Park.stops`, `TECHNOS` et `narration.json` et obtient une égalité stricte.
- [ ] Aucun id n’apparaît deux fois dans `STOPS` ou `STATIONS`.
- [ ] Chaque id de stop est joignable par `Tour.jumpTo`.

### Validation des liens

- [ ] Refaire un contrôle HTTP avec suivi des redirections sur chaque URL unique de `technos.js` juste avant livraison.
- [ ] Accepter un statut final 200 ; refuser 4xx, 5xx, boucle de redirection, page de parking ou documentation sans rapport.
- [ ] Noter la date de vérification dans le commentaire d’en-tête de `technos.js`.
- [ ] Vérifier manuellement au moins l’article Lighthouse, BM25 Elasticsearch, PostgreSQL full-text, Haystack QueryExpander, OpenSearch hybride, FastEmbed, pgvector, Milvus HNSW, Ragas et TruLens.

### Validation visuelle et fonctionnelle ch3

- [ ] Aucun rail, chariot, camion, hangar ou bâtiment d’usine n’est visible.
- [ ] Le marcheur, la boussole, les cinq questions, les six fiches-recettes et les six garde-fous se distinguent en vue complète.
- [ ] Les branches principales et secondaires sont compréhensibles sans dépendre uniquement de leur couleur.
- [ ] La visite automatique atteint les 19 arrêts une fois, dans l’ordre, puis revient au départ.
- [ ] Pause, step, restart, vitesse, follow, labels, zoom, drag, double-clic et `Tour.jumpTo` fonctionnent.
- [ ] Le HUD affiche `Nœuds vus`, la bonne zone et `Baseline d’abord`.
- [ ] Le guide, les outils, les références, la checklist et le lecteur de narration s’actualisent à chaque nœud.
- [ ] Les labels ne se chevauchent pas avec le guide, le marcheur ou le panneau de détail aux largeurs 390, 768, 1024 et 1366 px.
- [ ] Le chapitre est utilisable au clavier et les boutons ont des intitulés français explicites.
- [ ] Zéro erreur et zéro promesse rejetée dans la console pendant une visite complète.

### Régression ch1/ch2

- [ ] Ouvrir ch1 et faire au minimum restart, step, jump, un tour de boucle et arrivée à `eval`.
- [ ] Ouvrir ch2 et faire au minimum restart, step, jump, les trois passes et arrivée à `eval`.
- [ ] Confirmer que les fallbacks `laps = 3`, `loopExitStopId = 'loopct'`, `finalStopId = 'eval'`, chariot et styles de route actuels s’appliquent sans configuration.
- [ ] Confirmer que le HUD ch1/ch2, leurs cargaisons, leurs camions, leurs routes et leurs timings n’ont pas changé.
- [ ] Aucun fichier de contenu ou audio de ch1/ch2 n’est modifié.

### GitHub Pages et propreté

- [ ] Tester via un serveur statique local, pas en ouvrant `file://`, afin de valider le `fetch` local de `narration.json`.
- [ ] Aucune requête vers une API, un CDN, une police ou une image externe au chargement et pendant la visite.
- [ ] Tous les assets du chapitre répondent 200 avec une casse de chemin compatible Linux/GitHub Pages.
- [ ] Tous les CSS et scripts du chapitre utilisent `?v=19`.
- [ ] Aucun secret Inworld, fichier temporaire, script de génération avec clé, `.DS_Store` ou audio intermédiaire n’est commité.
- [ ] `git diff --check` ne signale ni espace final ni conflit.
- [ ] Le sommaire lie ch3, affiche ch4/ch5/ch6 comme « Bientôt », et ch1/ch2 restent intacts.

## 11. Critère de réussite pédagogique

Le chapitre est réussi si, après la synthèse, un apprenant peut compléter cette phrase sans aide :

> « Je commence par **[baseline]**, je mesure **[métrique]** sur **[jeu de questions]** pendant **[durée]**. Je n’ajoute **[recette suivante]** que si **[seuil]** n’est pas atteint, avec un budget de **[latence/coût]** et un retour arrière vers **[fallback]**. »

Si la visite donne seulement envie d’installer une base vectorielle, elle a manqué son objectif. Si elle permet de défendre une baseline simple, une expérience suivante et une condition d’arrêt, elle remplit la philosophie RAGTycoon.
