#!/usr/bin/env python3
"""Génère les narrations audio des 22 arrêts avec Inworld TTS 1.5 Max.
Sortie : <repo>/projets/rag/ch1-pipeline-rag/audio/stop-<id>.mp3
"""
import base64, json, os, sys, time, urllib.request

KEY = os.environ.get("INWORLD_API_KEY")
if not KEY:
    sys.exit("INWORLD_API_KEY manquante")

OUT = os.path.expanduser("~/Desktop/ragtycoon/projets/rag/ch1-pipeline-rag/audio")
os.makedirs(OUT, exist_ok=True)

VOICE = "Hélène"
MODEL = "inworld-tts-1.5-max"

# (id, texte) — narration parlée des 22 arrêts
TEXTS = [
("warehouse", "Arrêt un, l'Entrepôt. Un document d'entreprise commence comme un tas de fichiers hétérogènes. Les documents arrivent : PDF, Word, feuilles de calcul, pages de wiki, exports de bases SQL, mails. Chacun a son format, sa mise en page, parfois c'est un scan sans texte. Un LLM ne peut rien en faire directement : il faut d'abord transformer ce fouillis en texte propre, découpé et rangé. Astuce : en entreprise, l'ingestion doit se brancher sur les vrais systèmes, comme SharePoint, l'ERP, les bases métier. C'est souvent quatre-vingts pour cent du travail d'un projet RAG, et pourtant la partie la moins visible."),
("parser", "Arrêt deux, le Parseur. Extraire le texte de chaque fichier, en gardant la structure. Le parseur lit chaque format : le PDF devient du texte, le scan passe par de l'OCR, la reconnaissance de caractères, le tableur devient des lignes, le wiki devient du texte simple. Les titres, sections et pages sont conservés : ils serviront au découpage et au repérage des citations. Astuce : un PDF bien formé s'extrait en une seconde. Un scan de 1985 demande de l'OCR et peut produire n'importe quoi. Toujours échantillonner l'extraction avant de lancer toute la collection."),
("cleaner", "Arrêt trois, le Nettoyeur. Enlever le bruit : en-têtes, pieds de page, artefacts. Les en-têtes et pieds de page se répètent à chaque page, les numéros de page polluent, l'OCR laisse des coquilles, les tableaux cassent en colonnes incohérentes. Le nettoyeur supprime ce bruit et normalise : encodage UTF-8, espaces réguliers, langue détectée. Astuce : le bruit empoisonne les embeddings. Un chunk qui contient Page douze, Rapport annuel, en plein milieu perd une partie de son sens et rapproche des documents qui n'ont rien à voir."),
("chunker", "Arrêt quatre, la Découpeuse. Découper le texte en chunks, des unités de connaissance. Le texte est découpé en morceaux de deux cent cinquante-six à mille vingt-quatre tokens, avec dix à vingt pour cent de chevauchement pour ne pas couper une idée en deux. Le découpage suit la structure, sections et paragraphes, quand c'est possible. Chaque chunk devient une unité de connaissance que la recherche pourra retrouver. Astuce : c'est le réglage le plus important du RAG. De mauvais chunks garantissent de mauvaises réponses, même avec les meilleurs embeddings. Les chunks plus petits gagnent en précision sur les faits précis, les plus gros gardent le contexte."),
("enricher", "Arrêt cinq, l'Enrichisseur. Chaque chunk reçoit ses métadonnées : source, date, titre, section. Les métadonnées voyagent avec chaque chunk : document d'origine, date, auteur, titre, chemin de section, type. Le titre de la section peut être préfixé au chunk pour lui donner son contexte. C'est ce qui permettra de filtrer, de citer et d'auditer. Astuce : les métadonnées sont la clé du filtrage avant recherche, par date, source ou droits, et des citations honnêtes. Un chunk sans métadonnées est une réponse sans source."),
("dedup", "Arrêt six, le Dédoublonneur. Supprimer les copies, donner un identifiant stable à chaque chunk. Le même document existe souvent en double : importé deux fois, exporté sous deux noms, version brouillon et version finale. Le dédoublonneur repère les copies et quasi-copies par empreinte du contenu, et attribue à chaque chunk un identifiant stable. Astuce : un identifiant de chunk stable permet de suivre un chunk à travers les mises à jour. Indispensable pour l'audit, les comparaisons d'évaluation et les corrections ciblées."),
("embed", "Arrêt sept, le Studio d'embedding. Chaque chunk devient un vecteur : sa position dans l'espace du sens. Un modèle d'embedding convertit chaque chunk en une liste de nombres, typiquement mille cinq cent trente-six dimensions, qui est sa position dans l'espace sémantique. Deux chunks proches dans cet espace veulent dire proches par le sens, même sans partager un seul mot. Astuce : le modèle d'embedding doit être adapté à la langue et au domaine. Pour des documents en français et en anglais, un modèle multilingue est indispensable."),
("vector", "Arrêt huit, la Base vectorielle. Ranger les vecteurs avec un index HNSW : retrouver en moins de cent millisecondes. Les vecteurs sont stockés dans une base vectorielle, comme pgvector, Qdrant, Pinecone ou Weaviate, avec un index HNSW, un graphe hiérarchique. Retrouver les vecteurs les plus proches prend moins de cent millisecondes, même sur des millions de chunks. Astuce : déjà sur PostgreSQL ? pgvector suffit souvent. Filtres complexes et montée en charge ? Qdrant ou Pinecone. Le choix dépend de l'existant plus que du battage médiatique."),
("filter", "Arrêt neuf, la Salle des filtres. Les droits d'accès s'appliquent dès la recherche. Avant même de chercher, les métadonnées servent de verrous : chaque utilisateur ne peut voir que les chunks que ses permissions autorisent, par source, service ou niveau de confidentialité. La recherche n'atteint jamais ce qui est interdit. Astuce : c'est ici que se joue la sécurité. Un RAG qui ignore les droits d'accès fuit des documents confidentiels. Le filtrage par métadonnées avant le reranking améliore aussi la précision."),
("query", "Arrêt dix, la Porte des questions. Une question arrive, elle entre dans le même espace sémantique. Un utilisateur pose une question, en langage naturel. La question est convertie en vecteur avec le même modèle d'embedding que les chunks : elle entre dans le même espace sémantique, prête à être comparée à tous les chunks de la base. Astuce : la question brute est souvent imprécise, remplie de sous-entendus. C'est le travail du prochain bâtiment de la nettoyer pour la recherche."),
("rewrite", "Arrêt onze, le Reformulateur. La question est reformulée, élargie, décomposée. Le reformulateur transforme la question pour mieux chercher : correction des fautes, ajout de synonymes, découpage d'une question double, génération de variantes. Une question devient parfois trois ou quatre recherches. Astuce : le truc pour connecter la base, devient, procédure de connexion à la base de données. La qualité de la recherche commence ici."),
("hybrid", "Arrêt douze, le Chercheur hybride. Deux recherches en parallèle : les mots exacts et le sens. Deux moteurs tournent en même temps. BM25 cherche les mots-clés exacts : parfait pour les noms propres, codes, acronymes, numéros de référence. Le vectoriel cherche le sens : parfait pour les synonymes et les formulations différentes. Chacun renvoie ses candidats. Astuce : le vectoriel seul rate les codes et acronymes ; le BM25 seul rate les synonymes. Ensemble ils couvrent les deux cas. C'est la recherche hybride, standard en production."),
("rrf", "Arrêt treize, le Fusionneur RRF. Fusionner les deux listes de rangs en une seule. La fusion par rangs réciproques combine les deux classements : un chunk bien classé dans les deux listes remonte en tête, un chunk classé par un seul moteur reste honorable. Pas besoin de comparer des scores qui n'ont pas la même échelle. Astuce : fusionner par rangs plutôt que par scores est robuste. Les scores BM25 et les distances vectorielles ne sont pas comparables, mais les positions, si."),
("rerank", "Arrêt quatorze, le Reranker. Un cross-encoder relit la question et chaque candidat ensemble. Les embeddings comparent question et chunk séparément, rapide mais approximatif. Un reranker évalue chaque paire question-candidat ensemble, comme un juge qui lit les deux textes. Il reclasse les candidats et on ne garde que le top trois à cinq. Astuce : le reranking coûte cher par candidat, on ne le lance que sur le top vingt à cinquante. Gain typique de précision : vingt à quarante pour cent par rapport à la recherche vectorielle seule."),
("rights", "Arrêt quinze, le Contrôle des droits. Vérifier que chaque chunk retenu est autorisé pour cet utilisateur. Avant de remonter les résultats, une dernière passe vérifie les permissions : les chunks du top sont comparés aux droits de l'utilisateur et de son service. Ce qui est interdit est écarté, ce qui reste est garanti lisible par la personne. Astuce : la sécurité ne se corrige pas après coup. Un chunk confidentiel dans le prompt d'un LLM est déjà une fuite, même si la réponse finale ne le répète pas."),
("loopct", "Arrêt seize, le Compteur de boucle. Ceci était une passe de recherche. Une vraie question en demande plusieurs. La boucle que le chariot vient de parcourir est une passe de recherche : reformulation, recherche hybride, fusion, reranking. Une question d'entreprise réelle itère souvent : variantes de la question, filtres ajustés, compléments d'information. Le parc fait trois passes pour le montrer. Astuce : dans un RAG agentique, chaque boucle peut déclencher une action : chercher dans une autre source, reformuler, poser une question de clarification. La boucle devient un raisonnement."),
("context", "Arrêt dix-sept, l'Assembleur de contexte. Les chunks retenus et la question sont assemblés dans le prompt. Les chunks du top, trois à cinq, sont placés dans le prompt avec la question, chacun avec sa source. Le LLM n'a que cela sous les yeux pour répondre. L'ordre compte : le chunk le plus pertinent en premier, et une consigne claire : ne répondre qu'à partir du contexte. Astuce : un bon prompt de RAG dit explicitement, répons uniquement avec les informations ci-dessous. Si la réponse n'y est pas, dis-le. C'est la première ligne de défense contre l'hallucination."),
("llm", "Arrêt dix-huit, le Réacteur LLM. Le LLM rédige la réponse uniquement à partir du contexte fourni. Le modèle de langage génère la réponse en s'appuyant sur les chunks fournis. Si la recherche a bien fonctionné, l'hallucination n'a plus de place : tout ce dont le modèle a besoin est dans le prompt. Le réacteur peut être un modèle hébergé ou local. Astuce : en entreprise, le choix d'hébergement, cloud ou local, est souvent dicté par la souveraineté des données. Le RAG fonctionne avec un modèle plus petit et plus rapide qu'un modèle généraliste géant."),
("cite", "Arrêt dix-neuf, l'Atelier citations. Chaque affirmation est reliée à sa source. La réponse est passée au crible : chaque affirmation est reliée au chunk qui la soutient, donc au document et à la page d'origine. Si le contexte ne contient pas la réponse, le modèle doit le dire au lieu d'inventer. La réponse sort avec ses références. Astuce : les citations sont la différence entre un prototype et un outil d'entreprise : elles permettent la vérification humaine. Page douze du rapport deux mille vingt-quatre, vaut mieux que, selon nos sources."),
("guard", "Arrêt vingt, la Salle des garde-fous. La réponse est vérifiée avant de sortir : données personnelles, ton, pertinence. Avant l'envoi, la réponse passe des garde-fous : détection et masquage des données personnelles, refus des réponses hors-sujet ou trop vagues, contrôle de la langue et du ton. Une réponse qui n'a pas de source est bloquée et reformulée en aveu d'ignorance. Astuce : en Europe, le RGPD impose de traiter les données personnelles. La détection des données personnelles est un garde-fou obligatoire pour toute entreprise comme Orange."),
("dock", "Arrêt vingt et un, le Quai d'audit. Chaque question, chaque chunk retrouvé, chaque réponse : tout est journalisé. La réponse et son voyage complet sont écrits dans le journal : question originale, reformulations, chunks retrouvés avec leurs scores, réponse générée, latence, garde-fous déclenchés. On peut rejouer n'importe quelle requête des semaines plus tard. Astuce : sans journal, impossible de diagnostiquer une mauvaise réponse. Le journal est la mémoire de l'usine, et la base de l'amélioration continue."),
("eval", "Arrêt vingt-deux, le Centre d'évaluation. La réponse est notée sur un jeu de test, puis livrée à l'utilisateur. Le centre évalue la réponse sur un jeu de questions de référence : fidélité, la réponse est-elle bien soutenue par le contexte, pertinence, complétude. Les scores guident les réglages du parc : chunks, embeddings, top-k, prompts. Une fois validée, la réponse part à l'utilisateur. Astuce : RAGAS est le standard open source pour noter un RAG : fidélité, pertinence de la réponse, précision et rappel du contexte. C'est la boucle finale du voyage : un document brut à l'entrée, une réponse vérifiée, citée et tracée à la sortie."),
]

def synth(text, out_path):
    body = json.dumps({
        "text": text,
        "voiceId": VOICE,
        "modelId": MODEL,
    }).encode()
    req = urllib.request.Request(
        "https://api.inworld.ai/tts/v1/voice",
        data=body,
        headers={"Authorization": "Basic " + KEY, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read())
    audio = base64.b64decode(data["audioContent"])
    with open(out_path, "wb") as f:
        f.write(audio)
    return len(audio)

for i, (sid, text) in enumerate(TEXTS, 1):
    out = os.path.join(OUT, f"stop-{sid}.mp3")
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        print(f"[{i}/22] {sid}: déjà présent, skip")
        continue
    for attempt in range(3):
        try:
            n = synth(text, out)
            print(f"[{i}/22] {sid}: {n} octets")
            break
        except Exception as e:
            print(f"[{i}/22] {sid}: erreur {e} — tentative {attempt+1}/3")
            time.sleep(3)
    time.sleep(1)

print("TERMINÉ")
