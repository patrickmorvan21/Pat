# BRIEF — Panel de 10 agents sur la démo de PACTUM (v1.97.0)

*À copier-coller tel quel dans une IA capable de piloter un navigateur et de
lancer des sous-agents. Le document est écrit pour elle, pas pour moi.*

---

## 0. Ce qu'on te demande, en une phrase

Faire jouer **dix agents, à l'aveugle**, à une démo de ~20 minutes, puis les
faire **débattre**, puis — et seulement à la fin — vérifier avec eux si ce que
le jeu voulait produire a été **réellement ressenti**.

La question qui prime sur toutes les autres : **est-ce que la partie a une
FORME ?** Un début, un milieu, une fin, qu'on sent sans qu'on nous l'explique.

---

## 1. Le lien, et comment démarrer neuf

```
https://patrickmorvan21.github.io/Pat/aldenhar/?demo=1&testeur=1
```

C'est un jeu narratif mobile en français (livre-dont-vous-êtes-le-héros dark
fantasy, mort permanente). **Cadre 390 × 800 : mets le navigateur en viewport
mobile**, sinon tu juges une mise en page qui n'est pas la vraie.

Les deux paramètres sont indispensables :

- `demo=1` — active la démo (le jeu complet est un autre objet, plus long et
  non scripté). Vérification : en bas de l'écran d'accueil, il doit être écrit
  **`v1.97.0 · démo`**. Si le « · démo » manque, rien de ce qui suit n'est
  valide.
- `testeur=1` — permet à un agent de jouer : le dé se lance d'un simple tap
  (au doigt c'est un vrai geste de lancer), et **trois taps sur l'écran d'un
  mini-jeu le résolvent** (au doigt on frotte, on maintient, on trace).

**Chaque agent doit partir d'un compte VIERGE.** Deux façons :

- le plus sûr — un **contexte de navigateur neuf** par agent (profil isolé,
  aucun stockage partagé), puis ouvrir l'URL ;
- sinon — ouvrir l'URL, puis **OPTIONS → « Effacer la progression » → « Confirmer
  l'effacement ? »**. Ça vide les reliques, le Registre et la mémoire du
  compte, et ça garde le mode démo.

⚠️ **Un agent qui rejoue une deuxième vie DOIT ré-effacer avant.** Le jeu se
souvient des vies précédentes d'un compte (c'est voulu), et une deuxième vie
sur un compte usagé n'est pas une première partie.

**Fin de la démo** : soit la mort (elle est possible et définitive), soit la
sortie de zone (« la Descente »). Compte ~20 minutes. Si un agent dépasse
largement 120 écrans sans fin, qu'il s'arrête et le signale.

---

## 2. Les dix agents

Lance **dix sous-agents indépendants, qui ne se lisent pas entre eux** pendant
la phase 1. Chacun joue **une vie entière** (les agents 9 et 10 en jouent deux,
voir ci-dessous), écran par écran, et prend des notes en jouant — pas après.

| # | Profil | Consigne de jeu |
|---|--------|-----------------|
| 1 | **Le curieux** | Regarde tout ce qu'on te propose de regarder, parle à tout le monde. |
| 2 | **Le pressé** | Tu es dans le métro. Prends toujours l'option la plus directe, ne t'attarde jamais. |
| 3 | **Le joueur de dés** | Choisis systématiquement les options qui engagent un jet (elles portent un nom de stat). |
| 4 | **Le prudent** | Évite le risque autant que possible. Fuis, contourne, refuse. |
| 5 | **Le lecteur** | Tu juges d'abord l'écriture : la voix, les images mentales, ce qui sonne faux. |
| 6 | **Le critique de rythme** | Chronomètre-toi. Note à quelle minute tu prends ta 1re décision, et chaque moment où tu t'ennuies. |
| 7 | **Le systémique** | Cherche à comprendre les règles cachées. Note ce que tu crois avoir compris — et sur quoi tu te trompes. |
| 8 | **Le maladroit** | Rate volontairement les gestes tactiles et les jets quand tu peux. Que se passe-t-il quand on échoue ? |
| 9 | **Le rejoueur** | Joue **deux vies** (efface entre les deux) en faisant des choix opposés. Question : la 2e partie t'a-t-elle paru la même ? |
| 10 | **Le néophyte** | Tu n'as jamais lu une ligne sur ce jeu. Dis à voix haute tout ce que tu ne comprends pas, au moment où tu ne comprends pas. |

---

## 3. LA MÉTHODE — trois temps, dans cet ordre, sans exception

C'est le point le plus important du brief.

### Temps 1 — le test AVEUGLE

Les dix agents jouent **sans savoir ce que le jeu essaie de faire**. Ne leur
donne ni la section 6 de ce document, ni aucune intention de conception. Un
agent à qui l'on dit « ce jeu a une courbe » trouvera une courbe : son rapport
ne vaudra rien.

Chacun rend son rapport (format en section 5).

### Temps 2 — le DÉBAT

Donne à chaque agent **les neuf autres rapports**, et demande-lui :

- sur quoi convergez-vous ? (un point trouvé par sept agents sur dix qui ne se
  sont pas parlé est un fait, pas une opinion) ;
- sur quoi es-tu en désaccord, et pourquoi penses-tu que l'autre s'est trompé ?
- **maintiens-tu ton grief principal après lecture ?** (Le retirer est un
  résultat aussi précieux que le confirmer.)
- quel est LE défaut n°1, si on ne devait en corriger qu'un ?

Fais une synthèse : **consensus / désaccords féconds / signalé par un seul**.
Ce que voit un seul profil n'est pas moins vrai — c'est souvent le plus utile.

### Temps 3 — la GRILLE (à n'ouvrir qu'ici)

Là seulement, montre-leur la section 6 (« ce que le jeu voulait produire ») et
demande à chacun de remplir, ligne par ligne, **une des trois cases** :

- **RESSENTI SEUL** — je l'ai vécu en jouant, sans qu'on me le dise ;
- **VU APRÈS COUP** — c'est bien là dans mes notes, mais je ne l'avais pas
  remarqué avant qu'on me le nomme ;
- **PAS RESSENTI** — je ne l'ai pas vécu, ou j'ai vécu l'inverse.

**La colonne qui nous intéresse est la première.** Une intention qui n'existe
qu'en « vu après coup » a échoué à l'écran, même si elle est dans le code.

---

## 4. Ce qui est VOULU — ne le signale pas comme un défaut

- **La mort est définitive** et peut tomber. Recommencer fait partie du jeu.
- **Aucun chiffre de mécanique n'est affiché** : pas de barre de vie, pas de
  score, pas de pourcentage. C'est un parti pris, pas un oubli. Les seules
  exceptions sont le bilan après la mort et la voix du Geôlier (le narrateur),
  qui est le seul à voir les chiffres.
- **Les choix sont exclusifs** : faire une chose signifie ne pas faire les
  autres. On ne peut pas tout voir en une partie.
- **Un choix grisé** n'est pas un bug : il existe, il n'est pas pour ce
  héros-là. Il répond par une phrase, pas par un refus muet.
- **Le mode testeur remplace les gestes tactiles par des taps.** Tu peux juger
  *qu'un geste a lieu, où, et s'il a du sens à cet endroit* — tu ne peux PAS
  juger sa sensation au doigt. Ne conclus jamais « les mini-jeux sont juste des
  taps » : c'est l'outil de test, pas le jeu.
- **Le dernier lieu (« la Falaise aux Cordes ») a une image provisoire.** Juge
  sa structure et son texte, pas son visuel.
- Le français est volontairement littéraire, au tutoiement, avec des mots
  rares. Les noms propres (le Geôlier, la Besace, le Grand Registre, le Sceau)
  sont voulus.

---

## 5. Format du rapport de chaque agent (temps 1)

Court, factuel, **avec des citations exactes**. Un grief sans citation n'est
pas exploitable.

1. **Ma partie en cinq lignes** — ce que j'ai fait, comment ça s'est fini.
2. **La forme de la partie.** Décris la courbe que TU as vécue, avec des
   repères : à quel écran / quelle minute ça change de comportement. Si tu n'as
   senti aucune forme, dis-le franchement — c'est le résultat le plus utile.
3. **Le moment où j'ai eu envie de continuer** (le premier), et **le moment où
   j'ai eu envie d'arrêter** (s'il y en a eu). Cite l'écran.
4. **Ce que j'ai voulu, de moi-même.** Y a-t-il eu un endroit où tu voulais
   aller, une chose que tu voulais comprendre ? Laquelle, et à partir de quand ?
5. **Ai-je senti une conséquence de mes propres choix ?** Laquelle, où, et
   est-ce que j'ai fait le lien tout seul ?
6. **Ce que j'ai lu de trop.** Les écrans où j'ai tapé pour avancer sans rien
   décider — combien, et lesquels étaient inutiles.
7. **Incohérences** — texte qui contredit un autre texte, personnage qui me
   connaît sans raison, décor qui change, faute de langue. Citation exacte.
8. **Verdict en une phrase**, puis une note sur 10 : *est-ce que j'aurais
   relancé une partie si personne ne me le demandait ?*

---

## 6. ⚠️ SCELLÉ — à n'ouvrir qu'au temps 3

> **Ne pas lire avant que les dix rapports du temps 1 soient rendus.**

Voici ce que cette version voulait produire. Pour chacune, chaque agent répond
**RESSENTI SEUL / VU APRÈS COUP / PAS RESSENTI**, avec une citation de sa
propre partie quand c'est possible.

**A. La forme générale.** La partie devait avoir quatre mouvements, jamais
nommés à l'écran : ça démarre vite → j'explore librement → ce que j'ai fait
plus tôt me revient dessus et ça se resserre → un vrai dernier moment, puis la
sortie ou la mort.

**B. Le démarrage.** Première vraie décision dès le 2e écran, et un moment
tactile dans les toutes premières minutes.

**C. Le désir.** Une phrase, très tôt, devait donner envie de comprendre
quelque chose — sans jamais afficher d'objectif ni de quête. Et cette chose
devait trouver une réponse plus tard dans la partie.

**D. Le retour du passé.** Au moins une décision de la première moitié devait
revenir de façon reconnaissable dans la seconde. Question précise : as-tu pensé
« ah, ça revient à cause de ce que j'ai fait tout à l'heure » ?

**E. Le resserrement.** À partir d'un certain moment, le jeu devait se
comporter autrement : moins confortable, plus court, plus tendu. Sans que rien
ne l'annonce.

**F. Le dernier moment.** Le lieu final devait être un vrai climax — pas un
simple « écran de fin de zone » — et devait tenir compte de ce que tu avais
fait pendant la traversée.

**G. Le geste.** Les moments tactiles devaient arriver à des endroits qui ont
du sens (et non « parce qu'il fallait un mini-jeu »), et échouer devait coûter
quelque chose sans jamais bloquer la partie.

**H. La lecture.** Le texte devait être assez court pour qu'on décide souvent,
et assez dense pour qu'on ait envie de le lire.

**I. La rejouabilité.** Deux parties devaient suivre la même courbe sans être
la même suite de scènes. *(Question réservée à l'agent 9.)*

**Puis, en synthèse finale, réponds à ces trois questions :**

1. Combien d'intentions sur neuf sont en **RESSENTI SEUL** chez au moins sept
   agents sur dix ?
2. Y a-t-il une intention en **PAS RESSENTI** chez une majorité ? Laquelle, et
   qu'est-ce qui l'a empêchée d'exister à l'écran ?
3. **La question qui décide de la suite** : cette démo donne-t-elle envie de
   jouer le jeu complet ? Si non — est-ce un problème de rythme, d'écriture, de
   clarté, ou d'enjeu ?

---

## 7. Ce que je veux recevoir, à la fin

Un seul document :

- la synthèse du débat (consensus / désaccords / vu par un seul) ;
- la grille du temps 3, remplie, avec le compte des trois colonnes ;
- **les trois choses à corriger en priorité**, classées, chacune avec la
  citation exacte qui la prouve ;
- et une phrase franche : est-ce que ce jeu est amusant à jouer, oui ou non.

Sois direct. Un rapport poli qui ménage le jeu ne sert à rien.
