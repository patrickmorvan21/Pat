Tu découvres PACTUM, un livre-dont-vous-êtes-le-héros mobile, dark fantasy, en
français. Tu n'as JAMAIS joué et tu n'as AUCUN contexte de design : on te
demande ce que TU COMPRENDS, pas ce qui est bien ou mal fait.

Tout est dans /tmp/panel3/paquet/. Lis d'abord /tmp/panel3/paquet/LISEZMOI.md.
⚠️ INTERDIT : ne lis PAS /tmp/panel3/paquet/sources/ AVANT d'avoir joué (tu
peux y vérifier une intuition APRÈS, en le disant). Un joueur n'a pas le code.

LA QUESTION UNIQUE DE CE PANEL : EST-CE QU'ON COMPREND ?
À six moments précis — l'écran 1 · l'écran 10 · l'écran 25 · l'arrivée au
village (ou l'écran 45 s'il n'y a pas de village) · l'écran 70 · le dernier
écran — tu t'arrêtes et tu écris, en UNE ligne chacune, ce que tu CROIS à cet
instant (pas ce que tu sauras plus tard) :
  OÙ      — dans quel monde, quel lieu, quelle époque suis-je ?
  QUI     — qui suis-je, pourquoi je suis là, qu'est-ce que je veux ?
  QUOI    — qu'est-ce qui se passe, quelle est l'histoire, l'enjeu ?
  EUX     — qui sont les autres (la voix qui commente, le village, le pendu,
            les gens croisés) et que me veulent-ils ?
  RÈGLES  — que fait le dé, que coûte un échec, à quoi sert le Jour, comment
            on meurt, comment on gagne ?
  RYTHME  — est-ce que je lis ou est-ce que je joue, là ? où ça traîne, où ça
            va trop vite, où j'ai envie de continuer ?
Chaque ligne se termine par « (sûr) », « (je crois) » ou « (aucune idée) ».

CE QUE TU FAIS, dans l'ordre :
1. Lis ton transcript de PREMIÈRE RUN, écran par écran, comme un joueur (pas
   en diagonale) — le chemin est donné dans ta consigne. Remplis la grille aux
   six moments. Note au passage TOUS les mots, noms et lieux que tu ne
   comprends pas (« Fixation », « Renonçants », « Sceau », « Soupçon »…),
   avec l'écran où tu les rencontres la première fois.
2. Joue UNE vie sur ta table Python, choix par choix, comme toi-même :
     cd /tmp/panel3/tableN && python3 pactum.py nouvelle
     puis python3 pactum.py <numéro> à chaque écran, jusqu'à la mort, la
     sortie ou le renoncement (60-160 écrans). Refais la grille à la fin de
     cette vie : qu'est-ce que la 2e partie a éclairci, ou embrouillé ?
   Si la table plante ou boucle : BUG D'OUTIL, commande exacte, et
   « python3 pactum.py nouvelle ».
3. (facultatif) /tmp/panel3/paquet/sources/IMAGES.md apparie écran ↔ fichier
   dans /tmp/panel3/paquet/assets/ ; tu peux ouvrir un PNG (outil Read) si
   une image t'a aidé — ou empêché — de comprendre où tu étais.

TON RAPPORT — /tmp/panel3/rapports/LN.md (N = ton numéro), en français,
700 à 1 500 mots, dans cet ordre :
  A. LA GRILLE — six moments × six lignes, telle quelle, transcript.
  B. LA GRILLE après ta vie jouée (une seule fois, à la fin).
  C. L'HISTOIRE TELLE QUE TU LA RACONTERAIS à un ami en 6-8 phrases, après
     tout ça — c'est le test : ce que tu as reconstitué, avec tes erreurs.
  D. LES MOTS QUE TU N'AS PAS COMPRIS — liste, écran de 1re rencontre, et si
     le jeu a fini par l'expliquer (où) ou jamais.
  E. LES MOMENTS OÙ TU T'ES SENTI PERDU — écran exact, citation exacte, ce
     que tu as cru, ce qui t'aurait aidé (une phrase, pas une refonte).
  F. LE RYTHME — combien d'écrans avant ta première vraie décision, les
     passages où tu as lu sans jouer, ceux où tu as joué sans comprendre.
  G. NOTE DE COMPRÉHENSION /10 sur chacun des six axes, avec un mot.
  H. UNE phrase : as-tu envie de savoir la suite, et de quoi exactement ?
Un constat sans citation exacte (« transcript, écran 41 » / « ma vie, écran
17 ») ne vaut rien. Ne juge pas la qualité : dis ce que tu as compris.
