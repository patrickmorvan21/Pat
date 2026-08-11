# AUDIT AVANT — chantier de simplification de la boucle

*Réponse au §11.1 et §11.2 du chantier. Aucun code modifié.*
*Mesuré le 11/08/2026 sur le build v1.76.1 (l'outil : `tools/audit_boucle.py`).*

---

## 0. Un avertissement sur les chiffres

La première version de mon outil d'audit a déclaré **8 découvertes « mortes »**.
C'était faux. Six d'entre elles sont bien consommées — non par un
`requiresDecouverte` direct, mais par leur appartenance à `DECOUVERTES_FILLE`,
dont le compteur ouvre la rencontre de la Fille au Moulin. C'est la plus forte
conséquence différée du jeu, et mon détecteur la déclarait inexistante.

Corrigé, vérifié à la main découverte par découverte, et le contrôle de
consommation indirecte est maintenant dans l'outil. **Les chiffres ci-dessous
sont ceux d'après correction.**

---

## 1. L'inventaire des 17 lieux

| lieu | scènes | écrans | choix | POI | « Observer » |
|---|---:|---:|---:|---:|---:|
| **serment-hameau** (Hameau) | 5 | **14** | 10 | **7** | 2 |
| **colline-aux-gibets** | 2 | 6 | 4 | 4 | 1 |
| **campement** (Moulin) | 2 | 6 | 4 | 4 | 1 |
| chapelle-des-cordes | 2 | 6 | 6 | 4 | 1 |
| chemin-creux | 2 | 5 | 4 | 3 | 1 |
| champ-des-fixes | 2 | 5 | 6 | 3 | 0 |
| tour-de-guet | 2 | 5 | 5 | 3 | 1 |
| petit-tribunal | 2 | 5 | 5 | 3 | 0 |
| mare-aux-regards | 2 | 5 | 5 | 3 | 1 |
| palissade-sud | 2 | 5 | 5 | 3 | 1 |
| verger-noir | 2 | 4 | 5 | 2 | 1 |
| marche-muet | 2 | 2 | 8 | 0 | 0 |
| pendu-qui-parle | 2 | 2 | 6 | 0 | 0 |
| meute-grise-1 | 2 | 2 | 6 | 0 | 0 |
| chien-du-bailli | 2 | 2 | 5 | 0 | 0 |
| puits-condamne | 2 | 2 | 4 | 0 | 0 |
| pendu-mal-fixe | 1 | 1 | 3 | 0 | 0 |

**Médiane 5 écrans par visite · maximum 14 (le Hameau).**
**9 lieux sur 17 ouvrent un sous-menu « Observer ».**
**39 points d'intérêt au total.**

### États réellement en jeu (critère E)
La Phase A du 11/08 a déjà démonté cinq états génériques. Il reste :
- **BLESSÉ** (canal `effects`) — l'état physique, celui que le chantier garde ;
- **FIXÉ** — posé par le moteur (Soupçon ≥ 4 à l'arrivée au village), **avec
  une carte d'état à l'écran** ;
- **ACCOMPAGNÉ** — le Gamin, posé par un seul choix.

Autrement dit **le critère E est à 80 % déjà satisfait**, et ce qui reste à
trancher est une seule chose : la **carte** de FIXÉ (voir §5, question 3).

### Utilité des 39 points d'intérêt (critère D)

| | nombre |
|---|---:|
| préparent réellement un futur (le flag est LU) | **11** |
| rendent un objet, une relation ou du lore majeur | 24 |
| **ne rendent rien du tout** | **4** |
| posent un flag que **personne ne lit** | **6** |

Et, à la source : **11 découvertes sur 24 n'ont aucun consommateur**
(`d.bailli_condamne`, `d.barre_usee`, `d.combles_cloues`, `d.linteaux_entailles`,
`d.mare_depistage`, `d.nuit_du_hameau`, `d.on_juge_la_nuit`,
`d.plus_de_defenses`, `d.signe_plume`, `d.sonneur`, `d.temoin_nomme`,
`d.trois_cordes`). Ce sont les candidates naturelles à la coupe ou au Codex.

---

## 2. Le chiffre qui juge le critère F

Mesuré sur **trois vies réelles** enregistrées sur le build publié
(271 écrans, 252 taps) :

| | curieuse | fonceuse | 1re partie |
|---|---:|---:|---:|
| écrans | 88 | 96 | 87 |
| écrans qui offrent une décision | 26 (**30 %**) | 29 (30 %) | 26 (30 %) |
| écrans de pure lecture | 62 | 67 | 61 |
| taps de lecture avant chaque décision | **2,4** | 2,3 | 2,3 |

**Sept écrans sur dix ne demandent rien au joueur.** C'est ça, la boucle que
le chantier veut casser — bien plus que la longueur des textes.

> ⚠️ **Ces trois vies ne mesurent PAS le sous-menu** : mon auto-joueur exclut
> explicitement « Observer les alentours » de ses choix, donc il l'a ouvert
> **0 fois** sur les trois runs. Pour la comparaison AVANT/APRÈS du §11.5, je
> dois ré-instrumenter avec un profil curieux qui ouvre les sous-menus. Je le
> ferai avant de toucher au code, pour que la mesure AVANT soit honnête.

---

## 3. Le plan, lieu par lieu (lot pilote)

### A. LA COLLINE AUX GIBETS — le lieu sauvage

C'est le cas le plus pur du défaut : l'écran d'arrivée offre **un seul choix**
(« Rester au sommet ») et **quatre points d'intérêt** derrière « Observer ».
Le joueur n'a rien à décider ; il a une liste à vider.

**Aujourd'hui** — arrivée : 1 choix + 4 POI + Observer. Puis un 2e écran à 4 choix.

**Cible — 3 actions directes à l'arrivée, plus de sous-menu :**

| nouvelle action | absorbe | rend |
|---|---|---|
| **« Lire le nom gravé »** [INSTINCT] | le POI *pied du grand gibet* | `d.nom_gratte` → ouvre la Fille au Moulin |
| **« Monter au Grand Gibet »** [COURAGE] | le POI *Gibet Vide* (ce qu'on voit d'en haut) + le jet physique existant | jet physique + information de carte |
| **« Redescendre »** | — | la sortie |

- **SUPPRIMÉ** : *Les potences de la crête* — lore seul, aucune monnaie.
  Sa matière part au Codex.
- **DÉPLACÉ EN NARRATION** : *Les corbeaux, sur la traverse*. Ils comptent les
  morts du compte — c'est de la mémoire entre incarnations, que le §9 interdit
  de casser. Ils ne doivent donc pas dépendre d'un clic : **le monde le dit à
  l'arrivée**, sans que le joueur ait à le demander.
- **FUSIONNÉ** : le 2e écran garde *Arracher une écharde* et *Rester et compter*
  seulement si l'un des deux survit au budget ; l'autre est absorbé.

### B. LE MOULIN SANS AILES

**Aujourd'hui** — arrivée : 3 choix + 4 POI + Observer, puis un 2e écran à 3 choix.

**Cible — exactement les trois actions du chantier §3 :**

| nouvelle action | absorbe | rend |
|---|---|---|
| **« Entrer »** | *Pousser la porte* + *La lucarne* | l'objet + la halte (dormir/veiller) |
| **« Suivre les traces sur la crête »** [INSTINCT] | *La crête du toit* | `d.crete_interrompue` → ouvre la Fille |
| **« Passer son chemin »** | — | sortie sans halte (stratégie viable, §9) |

- **DÉPLACÉ EN NARRATION** : *La croix d'ombres*. C'est l'image signature du
  lieu (les ailes absentes qui laissent leur trace) — elle doit être **vue**,
  pas cliquée.
- **ABSORBÉ** : *Fouiller le lit de bruyère* (lore de la Fille) devient une
  conséquence d'« Entrer », pas une décision concurrente.
- **CONSERVÉ INTACT** : *Écouter le moulin*, le jet INSTINCT lié à l'arc.

### C. LE HAMEAU — le gros morceau (14 écrans)

C'est une **séquence scriptée de 5 beats**, verrouillée par toi le 24/07
(« on ne visite pas le Hameau : on y fait halte », le Serment est imposé).
Je ne touche pas à cette structure ; je vide ses sous-menus.

| beat | aujourd'hui | cible |
|---|---|---|
| **1. l'approche** | 2 choix | inchangé (déjà à 2) |
| **2. la ruelle** | 2 choix + **5 POI** + Observer | **3 actions directes** : « Parler à la femme sur le seuil » (relation) · « Lever les yeux vers les combles » [INSTINCT] · « Continuer vers la place » |
| **3. l'accueil du jour** | 4 choix, 0 POI | ramené à **3** |
| **4. le Serment** | 3 serments + **2 POI** + Observer | **3 serments seuls** — les deux questions passent en dialogue dans la narration |
| **5. la sortie** | 2 choix | fusionné dans le beat 4 → **un écran de moins** |

- **SUPPRIMÉ de la boucle** : *Le linteau de la porte* (`d.linteaux_entailles`,
  lue nulle part), *S'approcher de la croix* (aucune fonction), *Demander qui
  juge, ici* (`d.on_juge_la_nuit`, lue nulle part) → Codex.
- **TRANSFORMÉ EN ACTION** : *La femme sur le seuil* et *Les fenêtres des
  combles*, exactement comme le §3 du chantier le demande.
- **⚠️ LE GAMIN DES MURETS** est aujourd'hui un POI de la ruelle. C'est
  l'entrée de tout l'arc du Grand Témoin et le seul compagnon du jeu — le §9
  interdit de le casser. Il ne tient pas dans les 3 actions de la ruelle.
  **Proposition** : il devient une **rencontre de profil** — il t'aborde de
  lui-même si le héros a de l'EMPATHIE (§5), sinon il reste sur son muret et
  te regarde passer. Ce n'est plus une case à cocher, c'est une chose qui
  t'arrive ou non selon qui tu es. **C'est le point que je veux que tu valides
  explicitement**, parce qu'il rend le Gamin non garanti.
- **`d.combles_cloues` reçoit enfin un consommateur** : savoir que les combles
  sont cloués **de l'intérieur** ouvrira une option à la Grange, la nuit.
  C'est « explorer prépare » rendu concret (§6, critère D).

---

## 4. Ce que ça donne en chiffres, si la cible est tenue

| | AVANT | CIBLE |
|---|---:|---:|
| écrans, Hameau | 14 | **≤ 9** |
| écrans, Moulin | 6 | **≤ 4** |
| écrans, Colline | 6 | **≤ 4** |
| sous-menus « Observer » sur le lot | 4 | **0** |
| POI consultables sur le lot | 15 | **0** (devenus des actions) |
| décisions visibles à l'arrivée | 1 à 5 | **2 à 3** |
| part d'écrans qui demandent une décision | 30 % | **≥ 45 %** |

---

## 5. Trois choses que je ne décide pas seul

**1. Le Serment reste-t-il l'exception documentée du critère B ?**
L'écran du Serment porte trois serments — c'est la décision la plus lourde de
la zone, aucun ne peut être caché. En retirant ses deux points d'intérêt il
tombe **exactement à 3**, donc il passe. Mais si un jour il en fallait un
quatrième, ce serait l'exception narrative prévue par ton §B. Je le note ;
rien à trancher aujourd'hui.

**2. Le Gamin des Murets devient-il conditionnel au profil ?**
(voir §3.C ci-dessus). C'est le seul endroit où la cible du chantier et la
consigne « ne pas casser le Grand Témoin » se tendent. Ma proposition rend le
Gamin **non garanti** dans une vie donnée. C'est conforme au critère C
(« le joueur ne peut pas tout voir dans une même run ») mais c'est un vrai
changement d'accès à un arc majeur. **J'attends ton accord.**

**3. FIXÉ garde-t-il sa carte d'état à l'écran ?**
Ton test d'acceptation dit : « les états génériques non indispensables ne se
répètent plus comme composants UI de boucle ». FIXÉ n'est pas générique — il
est le pilier du procès — mais il s'affiche bien comme une **carte d'état
répétée**. Ma proposition : **garder la mécanique et les réactions du village,
retirer la carte**. Le joueur comprend qu'il est fixé parce qu'on le traite
autrement, pas parce qu'un bandeau le lui dit. **J'attends ton accord**, parce
que c'est le seul état encore visible et que tu l'avais conservé le 11/08.

---

## 6. Une conséquence à connaître avant de valider

Transformer les points d'intérêt en actions directes **change leur coût**.
Aujourd'hui un point est gratuit : on l'examine, on revient au même écran, les
autres restent ouverts. Une action contextuelle, elle, **consomme l'écran**.

Donc à la Colline, le joueur aura *le nom gravé* **ou** *la montée*, jamais les
deux. C'est exactement ce que demande le critère C — mais ça réduit
mécaniquement la récolte par visite (savoirs, objets, découvertes). C'est
voulu par le chantier ; je le dis pour que ce ne soit pas une surprise au
playtest.

---

## 7. Ce que je ferai ensuite, dans l'ordre, après ta validation

1. Ré-instrumenter l'auto-joueur pour qu'un profil curieux **ouvre** les
   sous-menus → mesure AVANT honnête sur le lot pilote.
2. Implémenter le lot pilote (Hameau, Moulin, Colline).
3. Deux runs instrumentées : une curieuse, une pressée.
4. Tableau AVANT/APRÈS : taps, écrans, sous-menus, POI, jets, découvertes qui
   servent plus tard.
5. Généraliser **seulement** si les six critères passent réellement, et
   produire le tableau PASS/FAIL lieu par lieu du §11.7.
