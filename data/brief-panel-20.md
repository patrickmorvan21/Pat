# Consigne — deux panels de 10 IA sur PACTUM

*(À coller tel quel à ChatGPT, avec le fichier `pactum-playtest.zip` joint.)*

---

Voici **PACTUM**, un livre-jeu mobile dark fantasy en français (build v1.84.0).
Le zip joint contient une table de jeu jouable hors navigateur, des parties
enregistrées sur le vrai build, et les sources.

Je veux organiser **deux panels de 10 agents IA**, avec un débat dans chacun.
L'objectif est de **sortir une liste de décisions**, pas une liste de
suggestions : nous tournons en allers-retours depuis trop longtemps et j'ai
besoin d'un verdict consolidé sur lequel avancer.

## Mise en place

```
unzip pactum-playtest.zip
cd pack/jouer
python3 pactum.py nouvelle       # lance une vie
python3 pactum.py 2              # prend le choix n°2
python3 pactum.py journal        # relit la partie entière
```

Une commande = un écran. **Chaque agent joue au moins 4 vies complètes**
(jusqu'à la mort ou jusqu'à la Descente), dans son **propre dossier** — copie
`pack/jouer/` par agent, sinon ils écrasent la partie les uns des autres.

**Ne supprimez jamais `compte.json`** entre deux vies d'un même agent : c'est
la mémoire entre les incarnations, et une bonne partie de ce qu'il y a à juger
ne se produit qu'à partir de la 2ᵉ vie.

## PANEL A — le regard neuf (10 agents)

Ils **n'ouvrent PAS** `CONTEXTE-INFORME.md`. Ils ne lisent pas les sources
avant d'avoir joué leurs 4 vies. Ils découvrent le jeu comme un joueur qui
l'installe sans rien savoir.

Chacun rend, en citant **le texte exact** à chaque fois :

- **ce qu'il ADORE** — le moment précis qu'il raconterait à quelqu'un ;
- **ce qu'il aime** ;
- **ce qu'il n'aime pas** ;
- **ce qui BLOQUE l'expérience** — incompréhension, ennui, sensation d'être
  puni sans comprendre, envie d'arrêter. Avec l'écran où ça s'est produit.

Profils à répartir : deux qui foncent, deux qui fouillent tout, deux qui
jouent en trois minutes debout dans le métro, deux qui lisent chaque mot, deux
habitués des roguelites.

## PANEL B — le regard informé (10 agents)

Ils lisent **`CONTEXTE-INFORME.md`** (intentions, règles verrouillées,
systèmes existants, ce qui est délibéré, ce qui a déjà été refusé) **avant**
de jouer leurs 4 vies, et peuvent consulter `sources/`.

Leur question n'est pas « est-ce agréable » mais **« est-ce que le jeu tient
ses promesses »** :

- quel système est **annoncé et invisible** en jeu ?
- quel système est **coûteux pour ce qu'il rend** ?
- où le jeu se contredit-il (une mécanique qui dit l'inverse du texte) ?
- qu'est-ce qui manque pour donner **envie de relancer une partie** ?
- la section 6 de `CONTEXTE-INFORME.md` pose 7 questions ouvertes : qu'ils y
  répondent, chacun, franchement.

## Les débats

Après les rapports individuels, **chaque panel débat** : chaque agent reçoit
les 9 autres rapports et doit dire ce qu'il **confirme**, ce qu'il
**conteste** (avec sa preuve), ce qu'il **maintient seul**, et son **top 3**.

Puis **un débat croisé A × B** sur les points où les deux panels divergent —
c'est là que se trouve l'information la plus utile : ce qu'un joueur neuf
ressent contre ce que le système prétend faire.

## ⚠️ Le piège à éviter (il a fait dérailler les panels précédents)

La table de jeu est une **réplique** : elle porte le vrai contenu et les
vraies règles de résolution, mais pas les images, ni le geste du dé, ni le
Grand Registre, ni les reliques, ni l'écran de mort, ni les chapitres, ni les
surprises. **La moitié des griefs des panels précédents visaient la réplique
et non le jeu.**

Donc : avant de signaler un manque, **vérifier dans `sources/`**. Et dans le
rapport, distinguer toujours **« joué »** de **« lu »** de **« déduit »**.

Ne signalez pas comme défauts les choix délibérés : mort permanente, aucun
chiffre affiché, trois options par écran, pas de carte ni de journal de
quêtes, un lieu qu'on quitte après une seule action, la fin de zone qui
annonce que la suite n'est pas construite.

## Ce que je veux recevoir, et rien d'autre

**Un document unique**, dans cet ordre :

1. **Les 5 forces à ne surtout pas casser**, citation à l'appui.
2. **Les 5 problèmes à régler**, classés par gravité, chacun avec : l'écran
   concerné, la citation, la cause probable, **et la décision recommandée**
   (pas trois options — une recommandation, quitte à la défendre).
3. **Ce qui bloque** : la liste des moments où un joueur arrêterait de jouer.
4. **Les désaccords non résolus** entre les deux panels, en une ligne chacun,
   avec qui pense quoi.
5. **Une seule phrase** : si vous ne pouviez changer qu'UNE chose à PACTUM,
   laquelle ?

Pas de plan d'implémentation, pas de code, pas de refonte proposée : des
constats et des décisions. Je m'occupe de la suite.
