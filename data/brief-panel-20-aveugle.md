# Consigne — panel de 20 IA sur PACTUM

*(À coller tel quel à ChatGPT, avec le fichier `pactum-playtest.zip` joint.)*

---

Voici **PACTUM**, un livre-jeu mobile dark fantasy en français (build v{VERSION}).
Le zip joint contient une table de jeu jouable hors navigateur, des parties
enregistrées sur le vrai build, et les sources.

Je veux organiser **un panel de 20 agents IA**, tous en **regard neuf** :
aucun ne connaît le jeu, aucun n'a lu de documentation de design. Je cherche
leur **ressenti de joueur**, puis un **débat entre eux**, puis un **diagnostic
final consolidé**.

---

## Mise en place

```
unzip pactum-playtest.zip
cd pack/jouer
python3 pactum.py nouvelle       # lance une vie
python3 pactum.py 2              # prend le choix n°2
python3 pactum.py journal        # relit la partie entière
```

Une commande = un écran. Python seul, aucune dépendance, aucun réseau.

**Chaque agent joue au moins 3 vies complètes** (jusqu'à la mort ou jusqu'à la
sortie de zone), dans son **propre dossier** — copiez `pack/jouer/` par agent,
sinon ils écrasent la partie les uns des autres.

⚠️ **Ne supprimez jamais `compte.json`** entre deux vies d'un même agent. C'est
la mémoire entre les incarnations : une bonne partie de ce qu'il y a à juger ne
se produit qu'à partir de la 2ᵉ vie. Un agent qui l'efface jugera un jeu
amnésique et se trompera.

**Aucun agent n'ouvre `_orchestrateur/`.** Ce dossier m'est réservé pour la
phase de synthèse.

---

## PHASE 1 — les 20 rapports individuels

Chacun rend **cinq sections**, dans cet ordre, en **citant le texte exact** à
chaque fois et en disant d'où il vient (« joué, vie 2, écran 14 », ou le nom
d'un transcript, ou un fichier de `sources/`) :

1. **CE QUE J'ADORE** — le moment précis que je raconterais à quelqu'un.
2. **CE QUE J'AIME** — ce qui marche, sans être marquant.
3. **CE QUE J'AIME MOINS** — tiède, mou, trop long, pas à sa place.
4. **CE QUE JE N'AIME PAS DU TOUT** — ce qui m'a agacé, ennuyé, ou paru raté.
5. **CE QUI BLOQUE L'EXPÉRIENCE** — le plus important. Les moments où je n'ai
   pas compris ce qu'on attendait de moi, où je me suis senti puni sans savoir
   pourquoi, où j'ai eu envie d'arrêter, ou où je me suis retrouvé coincé.
   Pour chacun : **l'écran exact**, ce que j'ai cru, et ce qui m'aurait aidé.

Terminez par **une phrase** : aurais-je relancé une quatrième vie, oui ou non,
et pourquoi ?

### Les 20 profils, à répartir

Deux agents par profil, sans qu'ils le sachent — c'est la duplication qui
révèle ce qui tient du jeu et ce qui tient de la chance de tirage.

1. fonce, prend toujours la première option
2. fouille tout, parle à tout le monde
3. joue trois minutes debout dans le métro, s'interrompt
4. lit chaque mot, juge l'écriture
5. habitué des roguelites (mort permanente, méta-progression)
6. optimisateur, cherche la stratégie dominante
7. joueur prudent qui évite le risque autant qu'il peut
8. n'a jamais joué de livre-jeu, découvre le genre
9. attentif à la cohérence du monde (lieux, personnages, chronologie)
10. attentif à l'interface et au confort de lecture

---

## PHASE 2 — le débat

Chaque agent reçoit les **19 autres rapports** et rend :

- ce qu'il **CONFIRME** (il l'a vécu aussi) ;
- ce qu'il **CONTESTE**, avec sa preuve (« je n'ai pas vécu ça, voici ce que
  j'ai vu à la place ») ;
- ce qu'il **MAINTIENT SEUL**, en assumant d'être le seul ;
- son **top 3** de ce qu'il faudrait régler en premier.

Deux points d'attention pour ce débat :

- **Un grief partagé par deux agents du même profil pèse plus** qu'un grief
  partagé par deux profils opposés : c'est le signe d'un défaut structurel et
  non d'un goût.
- **Un grief qu'un seul agent a vécu n'est pas forcément faux.** Le jeu a du
  contenu conditionnel : certaines choses ne se produisent que si l'on a fait
  un geste précis dans une vie précédente. Cherchez à savoir POURQUOI un seul
  l'a vu avant de le rejeter.

---

## PHASE 3 — le diagnostic final

**Un document unique**, dans cet ordre, et rien d'autre :

1. **Les 5 forces à ne surtout pas casser**, citation à l'appui.
2. **Ce qui BLOQUE**, classé par gravité : l'écran concerné, la citation, le
   nombre d'agents qui l'ont vécu, la cause probable, et **une recommandation
   ferme** (pas trois options — une décision, quitte à la défendre).
3. **Ce qu'ils n'aiment pas du tout**, même classement.
4. **Les désaccords non résolus**, une ligne chacun, avec qui pense quoi.
5. **Une seule phrase** : si vous ne pouviez changer qu'UNE chose à PACTUM,
   laquelle ?

Pas de plan d'implémentation, pas de code, pas de refonte proposée. Des
constats, des ressentis, des décisions. Je m'occupe de la suite.

---

## ⚠️ LE PIÈGE QUI A FAIT DÉRAILLER LES PANELS PRÉCÉDENTS

La table de jeu est une **RÉPLIQUE**. Elle porte le vrai contenu et les vraies
règles de résolution, mais **pas** les illustrations, ni le geste tactile du
dé, ni les écrans de mort, ni les reliques, ni les chapitres, ni les surprises.

**La moitié des griefs des panels précédents visaient la réplique et non le
jeu.** Un agent qui écrit « il n'y a pas d'images » ou « la mort n'est pas mise
en scène » décrit le zip, pas PACTUM.

Donc, avant de signaler un manque : **vérifier dans `sources/` et dans les
transcripts**. Et dans chaque rapport, distinguer toujours :

> **joué** (je l'ai fait) · **lu** (c'était dans un transcript) · **déduit**
> (je l'ai trouvé dans le code sans le vivre)

## Ce qui est VOULU — ne le signalez pas comme un défaut

- Aucune barre de vie, aucun chiffre de stat, aucun seuil montré au joueur.
- La mort permanente, y compris très tôt et sans avertissement.
- Trois options par écran, jamais plus.
- Aucune carte, aucun journal de quêtes, aucun inventaire encombrant.
- Aucune saisie de texte libre, sauf le nom du héros au tout début.
- L'esthétique : trois couleurs, gros pixels, texte tapé lettre à lettre.
- La fin de zone qui annonce que la suite n'est pas encore construite.
- Dans `sources/scene-data.ts`, les préfixes « 20 naturel. » et les suffixes
  « ♦ −2 » sont des marqueurs d'écriture : le jeu les retire à l'affichage.

En revanche, si l'un de ces partis pris **vous a gêné en tant que joueur**,
dites-le en section 3 ou 4 — c'est exactement ce que je veux savoir. La
consigne est de ne pas le rapporter comme un *bug*.
