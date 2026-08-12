# AUDIT FEEDBACK + FLUIDITÉ — les six relevés du §12

*Aucun code de jeu modifié. Outil : `tools/audit_fluidite.py` (+ vérifications
en jeu). Build v1.77.0, après le lot pilote.*

---

## 2. Taps de lecture avant décision

**Sur la narration ÉCRITE : 0 scène sur 80 dépasse un tap.** Ce chiffre est
vrai et il est trompeur — il ne mesure pas ce que le joueur vit.

À l'exécution, l'arrivée dans un lieu **empile des blocs que la scène n'écrit
pas** : phrase d'approche, franchissement du village, puce Jour, carte d'état,
rumeur, manifestation du Soupçon, ligne de mémoire d'un PNJ. C'est cet
assemblage qui produit les 4-5 taps ressentis, pas la longueur des textes.

Mesure en jeu (campagne en cours, 8 lieux sur 17 à l'heure de ce relevé) :

| lieu | curieux | pressé |
|---|---:|---:|
| serment-hameau | 1,2 | **2,7** |
| marche-muet | 1,3 | **1,8** |
| tour-de-guet | 0,4 | **1,5** |
| pendu-mal-fixe | 1,0 | 1,0 |
| campement · colline | 0,7 · 0,5 | 1,5 · 1,0 |

**Le levier n'est donc pas l'écriture, c'est l'ASSEMBLAGE d'arrivée.** Aucune
de ces lignes n'est corrigeable en raccourcissant un paragraphe.

## 3. Reliquats du sous-menu « Observer »

**11 scènes portent encore des points d'intérêt — 29 au total.** Le lot pilote
en a supprimé 15 ; il en reste 29 sur le reste des Landes.

| scène | points |
|---|---:|
| chapelle-des-cordes | 4 |
| tour-de-guet · petit-tribunal · palissade-sud · mare-aux-regards · chemin-creux · champ-des-fixes · borne-frontiere | 3 chacune |
| verger-noir | 2 |
| troupeau-sans-berger · hameau-halte-2 | 1 chacune |

Le libellé générique n'existe plus que comme conséquence : il n'apparaît que
si une scène a des points. **Supprimer les points supprime le bouton.**

## 4. CTA tronqués

**Un seul CTA est réellement tronqué en jeu** (vérifié au DOM, pas à la
longueur) : *« Pourquoi les pointes vers l'intérieur ? »* au Veilleur, qui
déborde de 38 px.

**Et la cause n'est pas sa longueur.** Il déborde **à 14 px**, c'est-à-dire
sans que `FitLabel` ait réduit quoi que ce soit. La raison est dans le
composant : il ajuste la police dans un `useLayoutEffect`, or la barre de
choix est en `display: none` pendant la frappe — `clientWidth` vaut alors
**0**, la condition `scrollWidth > clientWidth` est fausse, et la boucle de
réduction ne s'exécute jamais.

**Donc le rétrécisseur ne fonctionne sur aucun bouton du jeu.** Ça ne se voit
que sur les libellés assez longs pour déborder à 14 px — un seul aujourd'hui,
mais le défaut est général et il reviendra à chaque libellé un peu long.

*(3 autres libellés dépassent 34 caractères sans être tronqués : « Je ne sais
pas de qui vous parlez. », « Soutenir le regard des trois hommes », « Demander
le nom sur l'écriteau ».)*

## 5. Lieux uniques — entrée, sortie, revisite

Les quatre garde-fous existent : le pool exclut un lieu déjà visité, la
séquence d'arrivée disparaît une fois entré, il y a un beat de franchissement,
un drapeau marque la halte.

**Et pourtant le défaut signalé est réel — il vient d'ailleurs.**

Sur les 17 destinations tirables, **cinq sont à l'INTÉRIEUR du village** :
Marché Muet, Tour de Guet, Chapelle des Cordes, Puits Condamné, Petit
Tribunal. Une fois entré au Hameau, `pickLiaisonOptions` ne retire que la
**porte** (`serment-hameau`) : ces cinq lieux restent des destinations
**ordinaires**, mélangées aux lieux de lande.

Conséquence : on sort du village, on marche dans la bruyère, et la Croisée
suivante propose la Chapelle — qui est dans le village. **On y rentre et on
en ressort plusieurs fois par vie, sans qu'aucune entrée ne soit racontée.**

Ce n'est pas « deux entrées », c'est une **absence de frontière**.

## 6. Action → Feedback → Effet → Consommateur

**Aucune action importante n'est muette** : les 100+ choix qui posent un effet
ont tous une conséquence écrite ou les quatre issues d'un jet. Le §7 du
chantier (« feedback immédiat ») est donc **déjà tenu sur le texte** — ce qui
manque est ailleurs (voir la proposition 4).

**Huit actions posent un effet que personne ne lit :**

| action | scène | effet orphelin |
|---|---|---|
| Lui demander combien il en a signé | pendu-qui-parle-2 | `d.bailli_condamne` |
| Écouter ce qu'on te dit maintenant | champ-des-fixes-2 | `savoir_rangs` |
| Lever les yeux vers les combles | hameau-entree-2 | `d.combles_cloues` |
| Lire jusqu'au bout | hameau-accueil-mur | `savoir_mur_ecrit` |
| Parler à l'homme sans étal | marche-muet-2 | `d.sonneur` |
| *(+3 autres)* | | |

⚠️ `d.combles_cloues` est **de moi**, posé hier dans le lot pilote avec la
promesse écrite qu'il ouvrirait une option à la Grange. Il ne l'ouvre pas
encore. C'est exactement ce que le §12 appelle « un flag stocké pris pour une
fonctionnalité terminée » — et je l'ai fait.

---

# CE QUE JE PROPOSE (§12.7) — avant de coder

## Correctifs, par ordre de valeur

**1. Réparer `FitLabel`.** Un composant qui ne s'exécute jamais est pire
qu'un libellé long : il rendra tronqué n'importe quel futur CTA. L'ajustement
doit se refaire quand la barre redevient visible. C'est petit, c'est
systémique, et ça referme le critère « 0 CTA tronqué » pour de bon — plutôt
que de raccourcir un libellé et laisser le piège armé.

**2. Le village devient une enclave.** Tant qu'on est dedans, la Croisée ne
propose que des lieux du village ; en sortir demande une décision explicite,
et la sortie est racontée (« La dernière maison disparaît derrière la butte.
Le vent reprend immédiatement. »). Une fois sorti, le village n'est plus
tirable de la vie. C'est le §3 du chantier, et ça résout aussi la moitié des
taps d'arrivée du Hameau.

**3. Alléger l'ASSEMBLAGE d'arrivée, pas les textes.** C'est là qu'est le
vrai gain sur les taps. Trois règles : au plus **une** injection contextuelle
par arrivée (aujourd'hui approche + franchissement + Jour + état + rumeur
peuvent tomber ensemble) ; la phrase d'approche fusionne avec le premier
paragraphe du lieu au lieu d'être un bloc ; les injections de rappel cèdent
le pas aux injections d'événement.

**4. Les objets modifient la scène courante** (§2 du chantier). Aujourd'hui
utiliser un objet enchaîne l'écran suivant. Cible : une ligne de conséquence
sur place, **puis** une option qui n'existait pas. Je propose de commencer par
**deux objets** — la corde et le baume — pour éprouver le modèle avant de le
généraliser aux dix.

**5. Les huit effets orphelins.** Trois voies par effet : lui donner un
lecteur, le fusionner avec un effet voisin, ou le supprimer. Ma proposition
par défaut : **donner un lecteur aux trois qui touchent le Bailli et la
Fille** (ils ont déjà un arc qui les attend), **supprimer les cinq autres**.
Et d'abord tenir ma promesse d'hier sur `d.combles_cloues` à la Grange.

## Ce que je ne propose PAS

**Raccourcir les scènes à 25-45 mots.** La médiane est déjà à 55 et le tap
ressenti ne vient pas de là — il vient de l'assemblage. Couper les textes
ferait perdre de la prose sans gagner un seul tap. Si tu veux quand même cette
cible, dis-le et je la traite comme une consigne d'écriture séparée.

**Supprimer les 29 points d'intérêt restants dans la foulée.** Le §12.8 dit
« implémenter sur un lot contrôlé, puis mesurer ». Je propose de traiter
d'abord les correctifs 1 à 3, de re-mesurer, et de ne généraliser la
suppression des points qu'ensuite — c'est le même garde-fou qui a marché hier.

## Ordre proposé

1. `FitLabel` (petit, systémique) · 2. l'enclave du village · 3. l'assemblage
d'arrivée → **re-mesure** · 4. les deux objets pilotes · 5. les orphelins →
**re-mesure et playtest** → généralisation seulement après.
