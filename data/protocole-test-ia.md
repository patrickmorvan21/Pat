# PACTUM — Protocole de playtest pour une IA externe

*(À copier-coller tel quel dans ChatGPT en mode agent/navigation, Gemini,
ou tout agent capable d'opérer un site web. Rédigé le 8/08/2026, build
v1.51.1.)*

---

Tu es playtesteur d'un jeu narratif mobile en français, **PACTUM** — un
livre-dont-vous-êtes-le-héros dark fantasy à mort permanente. Tu n'as
aucun contexte sur son développement : c'est voulu, ton regard neuf est
exactement ce qu'on te demande.

## Ouvrir le jeu

**https://patrickmorvan21.github.io/Pat/aldenhar/?testeur=1**

Garde le paramètre `?testeur=1` dans l'URL : il te permet de lancer le dé
d'un **simple clic dessus** (normalement il faut un geste de lancer tactile
avec de la vélocité, que les agents ne savent pas produire). Tout le reste
du jeu est strictement identique à la version des joueurs.

## Comment ça se joue

- Le jeu se joue au **tap/clic**. Un clic sur le texte en cours d'écriture
  l'affiche en entier ; un second avance.
- Les choix sont des boutons en bas d'écran. Certains portent un tag de
  stat (COURAGE, RUSE, INSTINCT, EMPATHIE) : les choisir arme un **dé 3D**
  au centre — clique sur le dé pour le lancer. L'anneau d'encoches autour
  du dé montre tes chances (encoches pleines = faces qui réussissent).
- Première partie : une intro en 4 écrans, puis un prologue (« le Seuil »)
  où un démon te pose 4 questions et te demande un nom — « Qu'il choisisse
  pour moi » remplit le champ tout seul.
- Si tu es lent (les agents le sont), va dans le menu (icône en haut à
  droite) → OPTIONS → **Chronomètres : désactivés** — certaines scènes ont
  un compte à rebours.
- **La mort est définitive et voulue.** Si tu meurs, laisse la séquence se
  jouer jusqu'au bout (elle fait partie du jeu), puis recommence une vie.

## Ta mission

Joue **au moins deux vies complètes** (jusqu'à la mort ou jusqu'à la
« Descente », la sortie de zone), avec deux profils différents :
1. Une vie **curieuse** : examine tout ce que le jeu propose de regarder,
   parle à tout le monde.
2. Une vie **pressée et risquée** : va vite, prends les options d'action.

## Ce qu'on te demande de chercher

Classe chaque trouvaille dans une de ces catégories, avec **la citation
exacte du texte à l'écran** et le moment où c'est arrivé :

1. **Rupture de cohérence** — le texte contredit la situation (un
   personnage/décor évoqué qui ne peut pas être là, une conséquence sans
   rapport avec l'action, une blessure sans cause, un lieu qui change sans
   transition).
2. **Rupture d'immersion** — vocabulaire de système qui perce (chiffres de
   mécanique, jargon), répétition mot pour mot d'un texte déjà lu dans la
   même vie, phrase qui « sent le bouton ».
3. **Blocage** — écran d'où tu ne peux plus avancer, bouton qui ne répond
   pas, texte illisible ou coupé, image cassée.
4. **Confusion** — moment où tu n'as pas compris ce que le jeu attendait de
   toi, ou pourquoi une chose venait d'arriver (dis ce que tu as cru, et ce
   qui t'aurait aidé).
5. **Rythme** — passages trop longs, trop courts, trop répétitifs ; moments
   où tu as eu envie d'arrêter.

## Ce qui est VOULU (ne le signale pas comme défaut)

- Aucune barre de vie, aucun chiffre de stat ou de seuil affiché : l'état
  du héros se lit dans l'érosion de l'interface et dans le texte.
- La mort permanente, y compris tôt dans la partie.
- L'esthétique : 3 couleurs, gros pixels, tremblements, texte qui se tape
  lettre à lettre.
- Aucune saisie de texte libre (sauf le nom du héros au prologue).
- Le dé peut échouer souvent : les chances se lisent sur l'anneau.

## Format du rapport

Une liste numérotée, la plus grave d'abord. Pour chaque entrée : la
catégorie, la citation exacte, où/quand, et — si tu en as une — ta
suggestion en une phrase. Termine par un avis global de joueur : ce qui
t'a retenu, ce qui t'a perdu, et si tu aurais relancé une troisième vie.
