# PACTUM — protocole de playtest pour une IA externe

*Deux versions selon ce que l'IA sait faire. Rédigé le 8/08/2026, mis à jour
le 11/08 pour le build v1.76.1.*

---

## A. L'IA a un vrai navigateur (agent, mode navigation, Playwright…)

Elle joue le jeu réel. Copier-coller le bloc de la page suivante, qui pointe
vers **https://patrickmorvan21.github.io/Pat/aldenhar/?testeur=1**

Le paramètre `?testeur=1` permet de lancer le dé d'un simple clic (le geste
tactile avec vélocité est hors de portée d'un agent). Tout le reste est
identique à la version des joueurs.

## B. L'IA n'a pas de navigateur (ChatGPT en conversation, par exemple)

C'est le cas le plus fréquent : PACTUM est une application qui a besoin de
JavaScript, une simple récupération d'URL ne rend qu'une coquille vide. Lui
donner le **paquet** :

**https://patrickmorvan21.github.io/Pat/aldenhar/pactum-playtest.zip**

Il contient une **table de jeu jouable en Python** (`jouer/pactum.py`) : l'IA
lance une vie neuve et la joue écran par écran, une commande à la fois. Le
contenu est celui du jeu, mot pour mot ; le moteur est une réplique
simplifiée, et le paquet le dit clairement pour qu'elle ne confonde pas ce
qu'elle a joué avec ce qu'elle a lu. Il contient aussi des parties réelles
enregistrées (référence sans dérive) et les sources.

Tout est expliqué dans le `LISEZMOI.md` du paquet : il suffit de le
téléverser et de dire « lis le LISEZMOI et joue deux vies ».

---

## Le texte à copier-coller (version navigateur)

Tu es playtesteur d'un jeu narratif mobile en français, **PACTUM** — un
livre-dont-vous-êtes-le-héros dark fantasy à mort permanente. Tu n'as aucun
contexte sur son développement : c'est voulu, ton regard neuf est exactement
ce qu'on te demande.

### Ouvrir le jeu

**https://patrickmorvan21.github.io/Pat/aldenhar/?testeur=1**

Garde le paramètre `?testeur=1` : il te permet de lancer le dé d'un simple
clic dessus.

### Comment ça se joue

- Le jeu se joue au **tap/clic**. Un clic sur le texte en cours d'écriture
  l'affiche en entier ; un second avance.
- Les choix sont des boutons en bas d'écran. Certains portent un tag de stat
  (COURAGE, RUSE, INSTINCT, EMPATHIE) : les choisir arme un **dé** au centre
  — clique dessus pour le lancer. L'anneau d'encoches autour du dé montre tes
  chances (encoches pleines = faces qui réussissent).
- Un choix **grisé** est verrouillé : ton héros n'a pas ce qu'il faut pour
  le tenter. Le cliquer n'est pas un bug — le jeu répond par une phrase qui
  dit pourquoi, puis rien d'autre. C'est voulu : tu dois voir la porte que
  cette incarnation-là ne peut pas ouvrir.
- Première partie : une intro en 4 écrans, puis un prologue (« le Seuil ») où
  un démon te pose 4 questions et te demande un nom — « Qu'il choisisse pour
  moi » remplit le champ tout seul.
- Si tu es lent (les agents le sont), va dans le menu (icône en haut à droite)
  → OPTIONS → **Chronomètres : désactivés**.
- **La mort est définitive et voulue.** Si tu meurs, laisse la séquence se
  jouer jusqu'au bout, puis recommence une vie.

### Ta mission

Joue **au moins deux vies complètes** (jusqu'à la mort ou jusqu'à la
« Descente », la sortie de zone), avec deux profils :
1. une vie **curieuse** : examine tout, parle à tout le monde ;
2. une vie **pressée et risquée** : va vite, prends les options d'action.

### Ce qu'on te demande de chercher

Classe chaque trouvaille, avec **la citation exacte** et le moment :

1. **Rupture de cohérence** — le texte contredit la situation (personnage ou
   décor qui ne peut pas être là, conséquence sans rapport avec l'action,
   blessure sans cause, lieu qui change sans transition).
2. **Rupture d'immersion** — vocabulaire de système qui perce, répétition mot
   pour mot dans une même vie, phrase qui « sent le bouton ».
3. **Blocage** — écran d'où tu ne peux plus avancer, bouton qui ne répond pas,
   texte coupé, image cassée.
4. **Confusion** — moment où tu n'as pas compris ce qu'on attendait de toi, ou
   pourquoi une chose venait d'arriver.
5. **Rythme** — trop long, trop court, trop répétitif.

### Ce qui est VOULU (ne le signale pas comme défaut)

- Aucune barre de vie, aucun chiffre de stat ou de seuil : l'état du héros se
  lit dans l'érosion de l'interface et dans le texte.
- La mort permanente, y compris tôt.
- L'esthétique : 3 couleurs, gros pixels, tremblements, texte lettre à lettre.
- Aucune saisie de texte libre (sauf le nom du héros au prologue).
- Le dé échoue souvent : les chances se lisent sur l'anneau.

### Format du rapport

Une liste numérotée, la plus grave d'abord : catégorie, citation exacte,
où/quand, et ta suggestion en une phrase. Termine par un avis global de
joueur : ce qui t'a retenu, ce qui t'a perdu, et si tu aurais relancé une
troisième vie.
