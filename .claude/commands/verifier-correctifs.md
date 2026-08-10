# /verifier-correctifs — faire relire les correctifs par des agents AVANT de conclure

Demande de Patrick, 10/08 : « à partir de maintenant fais vérifier les points à
corriger aux agents IA pour éviter ce genre d'accidents, sinon on tourne en
rond ».

L'accident visé : un correctif dont le CODE est juste, dont les TESTS passent,
et qui contredit pourtant l'économie du jeu (faire payer un Jour alors que le
Jour est le score du Registre). Aucun test ne peut attraper ça. Seule une
relecture qui juge les *intentions* le peut.

## Quand la lancer

- **Systématiquement** après avoir implémenté un lot de correctifs, AVANT
  d'annoncer à Patrick que c'est réglé.
- Aussi en amont, quand un correctif touche une ressource (Jour, santé,
  Soupçon, Besace, mémoire de compte) ou rouvre un arbitrage.

## Ce qu'on donne aux agents

Chaque agent reçoit, sans exception :

1. `data/brief-economie-pactum.md` — le sens de chaque ressource et les
   quatre questions. **C'est le document décisif.**
2. `data/brief-expert-pactum.md` — les piliers, la doctrine, les défauts
   récurrents.
3. **Le diff réel** (`git log`/`git show` sur la plage de commits) et les
   messages de commit, qui portent l'intention déclarée.
4. La consigne de distinguer « lu dans le code » de « joué » — et, s'ils
   jouent, la réplique isolée dans leur propre dossier.

## Les trois angles (un agent chacun, en parallèle)

Ils sont choisis pour se recouvrir le moins possible.

- **A · L'économiste.** Pour CHAQUE correctif, écrire « ce correctif fait
  monter/baisser X », puis confronter au sens de X. Cherche l'inversion
  d'incitation : une sanction qui récompense, une récompense qui punit, un
  gain annoncé qui n'arrive pas. Rend un tableau correctif → ressource →
  sens → verdict.
- **B · Le gardien de doctrine.** Confronte chaque correctif au tableau des
  arbitrages déjà rendus (§3 du brief économie) et aux piliers. Signale tout
  arbitrage rouvert **en silence** — pas pour l'interdire, pour qu'il soit
  déclaré.
- **C · L'optimisateur.** Ne lit pas le code d'abord : joue, et cherche la
  stratégie dégénérée que le lot vient de créer. Sa question unique : « quel
  est maintenant le joueur optimal, et est-il plus ennuyeux qu'avant ? »

## Ce qu'on en fait

- Un signalement de A sur le SENS d'une ressource est bloquant : on ne
  déploie pas sans l'avoir tranché.
- B et C produisent des points à arbitrer, pas des ordres — plusieurs de leurs
  signalements seront des choix assumés.
- Toujours vérifier soi-même un signalement avant d'y toucher : la moitié des
  griefs des panels précédents venaient de l'outil de test, pas du jeu.
- Ce qui survit va dans le message de commit et dans le compte rendu à
  Patrick, avec ce qui a été écarté et pourquoi.
