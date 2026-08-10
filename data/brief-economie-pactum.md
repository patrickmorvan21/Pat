# PACTUM — l'économie du jeu, et le sens de chaque ressource

Ce document existe à cause d'un accident précis, le 10 août 2026.

Le panel avait mesuré que **ne jamais lancer le dé était la stratégie
gagnante**. Le correctif retenu : quitter un lieu sans rien risquer coûte un
JOUR. Le raisonnement se tenait — l'abstention cessait d'être gratuite, les
Besoins se réveillaient, l'observation restait libre. Le code était juste, les
tests passaient, treize assertions Playwright au vert.

Et c'était exactement à l'envers. **Le Grand Registre classe les héros par
jours survécus.** La « punition » donnait donc des points au joueur le plus
passif. Patrick l'a vu en une phrase ; aucun test ne pouvait l'attraper, parce
qu'il n'y avait rien à attraper dans le code.

**La leçon** : un correctif ne se vérifie pas seulement en exécutant le jeu. Il
se vérifie en le confrontant à ce que le jeu RÉCOMPENSE. C'est le rôle de ce
document, et de la relecture par agents qui l'utilise
(`.claude/commands/verifier-correctifs.md`).

---

## 1. Les cinq ressources, et le SENS de chacune

Pour chaque ressource : ce qu'elle est, **dans quel sens elle est bonne**, et
donc ce qu'une mécanique a le droit d'en faire.

### LE JOUR — un SCORE, et une pression

- **Sens : PLUS est MIEUX.** Le Grand Registre classe par jours survécus ; la
  première place (inatteignable) tient 11 000 jours. Le bilan de mort ouvre sur
  le nombre de jours. C'est la mesure publique d'une vie.
- Il avance **tous les trois lieux où le héros a tenté quelque chose**
  (`RunState.lieuxEngages`) et à chaque nuit de campement.
- **Contre-pression** : les Besoins (soigner 2 j · dormir 3 j · manger 3 j) se
  comptent en jours. Vivre longtemps expose donc à la faim et à la fatigue.
  C'est ce qui empêche le Jour d'être un gain pur — mais **la contre-pression
  ne renverse pas le sens** : rester en vie reste ce qu'on cherche.
- ⛔ **INTERDIT : ajouter un Jour à titre de sanction.** C'est l'accident du
  10/08. Un « coût » qui monte le score n'est pas un coût. Le champ
  `Choice.coutJour` a été supprimé pour cette raison.
- ✅ Autorisé : **refuser** un Jour (ne pas le compter) quand le héros n'a rien
  vécu. Le priver du gain, jamais le lui facturer.

### LA SANTÉ — une réserve, jamais affichée

- **Sens : PLUS est MIEUX**, et elle ne remonte que par le repos et les soins.
- Elle est la SEULE ressource dont l'épuisement tue. Elle ne se lit qu'à
  l'érosion pixel de l'interface.
- Barème par palier, uniquement sur les jets de **nature physique** :
  0,08 (de justesse) · 0,16 (échec) · 0,26 (critique) · 0,30 (malédiction).
- ✅ Un coût en santé est un vrai coût. ⚠️ Mais il est **invisible** : le panel
  a explicitement écarté « re-durcir le barème » comme réponse par défaut,
  parce qu'un prélèvement qu'on ne lit pas n'enseigne rien.

### LE SOUPÇON — une menace, 0 à 6

- **Sens : MOINS est MIEUX.** À 6, le hameau vient chercher le héros et le
  procès peut le tuer quelle que soit sa santé.
- Il monte sur un **ACTE**, jamais sur un regard (arbitrage du 8/08 :
  « récompenser les curieux, pas les pressés »). Observer est gratuit.
- ✅ C'est la monnaie de sanction la plus saine du jeu : lisible (le monde
  réagit, la craie apparaît, les corbeaux se comptent), diégétique, et elle
  pointe dans le bon sens.
- ⚠️ Elle se cumule vite : un acte qui paie DÉJÀ à la sélection ne doit pas
  repayer plein tarif à l'échec (mesuré : un seul geste montait à 3 sur 6).

### LA BESACE — 2 actifs + 2 passifs, et c'est tout

- **Sens : PLUS est MIEUX**, mais **la place est le vrai arbitrage**. Un slot
  plein oblige à renoncer.
- ⛔ Ne jamais annoncer un gain qui n'entre pas (défaut du Destin, corrigé le
  10/08 : 54 tirages sur 200 promettaient un objet fantôme).

### LA MÉMOIRE DE COMPTE — ce qui survit à la mort

- Reliques, Registre, découvertes, visites de lieux, dettes de sang.
- **Sens : PLUS est MIEUX**, et c'est le seul axe de progression du jeu.
- ⛔ Une mécanique ne doit jamais rendre la mort *préférable* à la survie. Si
  mourir rapporte une relique et survivre ne rapporte rien, le joueur optimal
  se suicide. (C'est pourquoi la sortie de zone inscrit désormais au Registre.)

---

## 2. Les quatre questions à poser à tout correctif

Dans cet ordre. La première suffit à écarter l'accident du 10/08.

1. **Le coût pointe-t-il dans le bon sens ?** Écrire la phrase :
   « ce correctif fait *baisser* X / fait *monter* X ». Puis relire la
   section 1 : X est-il une ressource qu'on cherche à maximiser ? Si oui, on
   vient d'écrire une récompense en croyant écrire une sanction.
2. **Le joueur peut-il le LIRE ?** Un coût qu'on ne comprend pas est un bug
   aux yeux du joueur. Il doit être dit dans la fiction, ou visible dans le
   monde. Sans chiffre.
3. **La prose dit-elle la même chose que la mécanique ?** Une issue qui
   raconte qu'on t'a vu doit coûter du Soupçon, pas de la santé. Une issue qui
   ne raconte aucune heure perdue ne doit pas coûter de temps. (Doctrine du
   9/08 : le coût suit la nature du jet, et la prose fait foi.)
4. **Quelle stratégie ce correctif rend-il optimale ?** Décrire le joueur qui
   l'exploite au maximum. Si ce joueur est plus ennuyeux que celui d'avant, le
   correctif aggrave le problème qu'il prétend résoudre.

---

## 3. Les arbitrages déjà rendus — ne pas les rouvrir sans le dire

Un correctif qui contredit l'un d'eux n'est pas forcément mauvais, mais il
doit l'ANNONCER, jamais le faire en silence.

| Décision | Date | Ce qu'elle interdit |
|---|---|---|
| Le Soupçon vient d'un acte, jamais du regard | 8/08 | Faire payer l'observation |
| Le coût d'un échec suit la NATURE du jet | 9/08 | Un barème uniforme, ou un coût que la prose ne raconte pas |
| Renoncer à un jet armé : refusé | 8/08 | Rendre le dé annulable |
| Pas de noms de routes ; les gens citent les lieux | 8/08 | Une carte nommée |
| Examiner ne coûte jamais rien | 8/08 | Un POI payant |
| Aucun chiffre de mécanique affiché | verrouillé | Seuils, jauges, pourcentages, PV |
| Le Figma fait foi sur un écran maquetté | verrouillé | « Améliorer » une maquette |
| La mort ne vient que de la fiction | pilier | Toute mort technique |
| Le Serment du Hameau est imposé | 24/07 | Toute façon de le contourner |
| La Palissade est la seule sortie de zone | 9/08 | Une fin qui la saute |

---

## 4. Comment lire un rapport d'agent sur ce sujet

- Un agent qui n'a pas ce document signalera des choix assumés comme des
  défauts. Toujours lui donner **ce fichier + `brief-expert-pactum.md`**.
- Un agent qui joue la réplique (`tools/pactum.py`) ne voit pas tout le jeu :
  le LISEZMOI du paquet liste ce qu'elle ne simule pas. Distinguer « joué » de
  « déduit du code » est exigé dans son rapport.
- **Le meilleur signalement possible n'est pas « c'est cassé »** — c'est
  « voici la stratégie que ce correctif rend optimale, et elle est ennuyeuse ».
