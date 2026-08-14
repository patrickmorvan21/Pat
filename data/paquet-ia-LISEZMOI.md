# PACTUM — paquet de playtest (build v{VERSION})

Tu es playtesteur d'un jeu narratif mobile en français, **PACTUM** — un
livre-dont-vous-êtes-le-héros dark fantasy à mort permanente. Tu n'as pas de
navigateur, donc tu ne peux pas ouvrir le jeu (c'est une application qui a
besoin de JavaScript). Ce paquet te donne deux choses à la place : de quoi
**jouer toi-même**, et des **parties réelles enregistrées**.

---

## 1. Lance une partie (c'est le cœur du paquet)

Une commande = un écran. La partie se garde toute seule entre deux commandes.

```bash
cd jouer
python3 pactum.py nouvelle      # ouvre une vie neuve
python3 pactum.py 2             # prend le choix n° 2
python3 pactum.py               # réaffiche l'écran courant
python3 pactum.py etat          # les rouages cachés — pour ton rapport
python3 pactum.py journal       # toute la partie depuis le début
```

Python seul, aucune dépendance, aucun réseau. `nouvelle --graine=42` rejoue
exactement la même vie (utile pour comparer deux façons de jouer), et
`--nom=Cendre` impose le nom du héros.

**Joue au moins deux vies entières**, jusqu'à la mort ou jusqu'à la
« Descente » (la sortie de zone) :

1. une vie **curieuse** — regarde tout ce que le jeu propose de regarder,
   parle à tout le monde ;
2. une vie **pressée** — va droit au but, prends les options d'action.

À la fin de chaque vie, `python3 pactum.py journal` te rend la partie
complète : c'est ce texte-là qu'il faut juger.

### Ce qui est vrai ici, et ce qui ne l'est pas

- Le **contenu est celui du jeu, mot pour mot** : scènes, narrations,
  libellés de choix, les quatre issues écrites de chaque jet de dé, points
  d'intérêt, phrases de marche, citations du Geôlier. Tout est extrait des
  sources du build publié.
- Le **moteur est une réplique simplifiée** de la vraie boucle de jeu :
  dé à vingt faces contre un seuil caché, cinq paliers de résolution, santé
  invisible, traversée par liaisons, points d'intérêt, mort permanente.
- **Une mémoire de compte existe** (`jouer/compte.json`, créé tout seul) :
  elle retient combien de fois tu es passé par chaque lieu et combien de
  héros y sont morts. C'est ce qui fait qu'un lieu **ne se lit pas pareil à
  ta deuxième vie**. Joue donc **plusieurs vies d'affilée sans effacer ce
  fichier** : l'effacer remet le monde à neuf et tu jugeras un jeu amnésique.
- **Le Sceau des Landes est répliqué** (nouveau en v1.83.0) : la marque que
  laisse une traversée réussie, ce qu'elle change à la vie suivante, et la
  réponse qu'elle donne au côté sud de la Borne. Voir le protocole ci-dessous.
- **L'échelle sociale du Soupçon est répliquée** (nouveau en v1.87.0) : les
  textes de marche changent selon ce que le village a décidé à ton sujet, et
  ils MONTENT — le monde sert le barreau que tu as atteint, pas un barreau au
  hasard. C'est le système à juger en priorité dans cette version.
- **Les scènes-variantes sont répliquées** (nouveau en v1.87.0) : sept scènes
  se jouent À LA PLACE d'une autre selon ce que tu as compris ou ce que le
  village pense de toi. Le Veilleur de la Palissade, par exemple, ne te parle
  pas de la même façon selon qu'on t'a dénoncé ou non.
- **Ne sont pas répliqués** : les illustrations, le geste tactile du dé, les
  scènes chronométrées, le Grand Registre, les reliques, l'humeur du Geôlier,
  les témoins, les chapitres du Bailli, les surprises. Ne les signale pas
  comme manquants — regarde plutôt les transcripts, où tout cela joue.

Dans ton rapport, distingue toujours **ce que tu as joué** de **ce que tu as
lu** dans un transcript ou déduit du code.

### Le protocole du SCEAU (à faire dans cet ordre, sans effacer `compte.json`)

Le Sceau est ce qu'on **rapporte** d'une traversée réussie — l'inverse d'une
relique, qui est ce qu'on **laisse** en mourant. Il n'ajoute aucun bonus de
jet : il ouvre des conversations et fait réagir le monde.

1. **Traverse.** Il faut atteindre la Palissade Sud puis franchir la
   Descente ; compte sept ou huit lieux. Si tu meurs, recommence — mais
   n'efface pas `compte.json`.
2. **Au moment de passer la ligne**, une ligne t'annonce ce que tu emportes.
3. **`python3 pactum.py nouvelle`** — nouvelle incarnation. Regarde le tout
   premier écran : le héros porte quelque chose qu'il n'a pas gagné.
4. **À la Borne, prends « Faire le tour de la pierre »** : l'examen pose une
   question, et deux lignes y répondent (l'une nomme ton héros précédent).
5. **Traverse une deuxième fois** si tu en as le courage : l'annonce de
   sortie et la marque d'ouverture ne sont pas les mêmes qu'au premier
   passage.

Ce qu'on cherche à savoir : est-ce que ça produit « qu'est-ce que c'est que
ça ? » ou « j'ai débloqué mon bonus » ? Est-ce qu'un porteur du Sceau se sent
**reconnu par le monde**, ou **récompensé par le jeu** ? Et la deuxième
traversée se distingue-t-elle vraiment de la première, ou n'est-ce qu'un
compteur invisible qui s'incrémente ?

---

## 2. Les parties enregistrées — `transcripts/`

{NTRANS} parties réelles, jouées sur le build publié, dés lancés par la vraie
physique du jeu. Chaque fichier est un script écran par écran : exactement ce
que le joueur a vu, les images affichées, les choix offerts, l'action prise.
C'est la **référence sans dérive** — tout y est citable mot pour mot, et c'est
là que se jugent la mise en scène et le rythme réel.

Les parties : une **curieuse** (elle regarde tout et lance peu) et une
**pressée** (elle prend le premier bouton). Toutes deux sont jouées sur un
compte qui a déjà vécu — trois morts, deux reliques, des lieux déjà traversés
— parce que c'est la seule façon de voir la mémoire du monde : la trace du
héros précédent sur la Borne, les personnages qui te reconnaissent sans te
reconnaître, le décor qui ne se lit plus pareil.

⚠️ **Ces transcripts n'exercent presque pas l'échelle du Soupçon**, et il faut
le savoir avant de les lire : ce sont des parties jouées par un automate, qui
ne commet pas les actes qui font monter le Soupçon (mentir, voler, trancher
une corde, questionner les gens). Elles finissent donc en bas de l'échelle.
Pour juger ce système, **joue** — il ne se lit pas dans ces enregistrements.

### Pour atteindre le procès (Soupçon au comble)

Le procès ne se déclenche qu'au SIXIÈME cran, et il vient te chercher : la
traversée est déroutée, on ne te demande pas ton avis. Vingt-neuf actes le
font monter. Les plus rapides, **en jouant normalement** :

| Où | Ce qu'il faut faire | Ce que ça coûte |
|---|---|---|
| Au muret du Hameau | **Refuser de jurer** | ++ |
| Au muret du Hameau | **Jurer du bout des lèvres** | + (et une dette) |
| En sortant du Hameau | **Parler de la femme de l'ouest** | ++ |
| Le Pendu qui parle | **Trancher sa corde** · **Répondre à son jugement** | + chacun |
| La Chapelle | **Tirer la dalle de l'autel** · **Écrire un nom à la craie** | + chacun |
| L'Hésitant, à la Borne | **Mentir : « Je n'entends rien. »** | + |
| Le Champ des Fixés | **Demander le nom sur l'écriteau** | + |

⚠️ **Regarder ne coûte rien** — c'est une règle du jeu, pas un oubli : seuls
les ACTES font monter le Soupçon. Un joueur qui examine tout sans rien commettre
n'ira jamais au procès, et c'est voulu.

Elles sont enregistrées sur **la version que tu peux lire dans `sources/`**,
pas sur une version antérieure : ce que tu y vois est ce que le jeu fait
aujourd'hui.

## 3. `CONTEXTE-INFORME.md` — à n'ouvrir que si on te l'a dit

Ce que le jeu VEUT être : intentions, règles verrouillées, systèmes existants,
ce qui est délibéré, ce qui a déjà été refusé. **Si l'on t'a demandé un regard
NEUF, ne l'ouvre pas** — il te dirait quoi penser avant que tu aies joué.

## 4. Les sources — `sources/`

`lib/` : le contenu et les règles (`scene-data.ts` = toutes les scènes, choix
et issues ; `etats.ts`, `temoins.ts`, `reliques.ts`,
`chapters-data.ts`, `prologue-data.ts`…).
`components/` : le moteur d'affichage (`Scene.tsx` = la boucle de jeu,
`Die3D.tsx` = le dé, `DeathScreen.tsx` = la mort…).

À consulter quand un passage t'intrigue : tu y trouveras les variantes que ta
partie n'a pas tirées.

---

## Ce qu'on te demande de chercher

Classe chaque trouvaille, avec la **citation exacte** et sa provenance
(« joué, écran N », ou nom du transcript, ou fichier) :

1. **Rupture de cohérence** — le texte contredit la situation : un personnage
   ou un décor qui ne peut pas être là, une conséquence sans rapport avec
   l'action, une blessure sans cause, un lieu qui change sans transition.
2. **Rupture d'immersion** — vocabulaire de système qui perce, répétition mot
   pour mot dans une même vie, phrase qui « sent le bouton ».
3. **Blocage ou incohérence mécanique** — un écran d'où rien n'avance ; une
   règle qui en contredit une autre ; un choix qui ne peut jamais s'ouvrir.
4. **Confusion** — un moment où un joueur ne comprendrait pas ce qu'on attend
   de lui, ou pourquoi une chose vient d'arriver. Dis ce que tu as cru, et ce
   qui t'aurait aidé.
5. **Rythme** — trop long, trop court, trop répétitif ; les moments où tu as
   eu envie d'arrêter.

## Ce qui est VOULU (ne le signale pas comme défaut)

- Aucune barre de vie, aucun chiffre de stat ou de seuil montré au joueur.
  Les seuils existent dans le code et dans `pactum.py etat`, c'est normal —
  seul leur **affichage au joueur** serait un défaut.
- La mort permanente, y compris très tôt.
- L'esthétique : trois couleurs, gros pixels, texte tapé lettre à lettre.
- Aucune saisie de texte libre, sauf le nom du héros au prologue.
- Le Soupçon, les états, le Geôlier : des mécaniques cachées, lisibles
  seulement dans le monde. C'est le cœur du design.
- Dans `scene-data.ts`, les préfixes « 20 naturel. » et suffixes « ♦ −2 » sont
  des marqueurs d'écriture : le jeu les retire à l'affichage.

## Format du rapport

Une liste numérotée, la plus grave d'abord. Pour chaque entrée : la catégorie,
la citation exacte, sa provenance, et — si tu en as une — ta suggestion en une
phrase. Termine par un avis global de joueur : ce qui t'a retenu, ce qui t'a
perdu, et si tu aurais relancé une troisième vie.
