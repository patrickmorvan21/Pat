# Archive — le moteur d'états et les Besoins (retirés le 11/08/2026)

Phase A du plan d'élagage : le système générique d'états temporaires est
démonté, remplacé par un seul état du corps (BLESSÉ) et des flags narratifs
ciblés. **Rien de ce qui était écrit n'est perdu** : les textes vivent ici,
et le Codex (phase E) est leur destination si on veut les remettre en jeu.

Ce qui reste en jeu, et n'a donc pas besoin d'être archivé : FIXÉ (le regard
du village, pilier du procès) et le compagnon du Gamin — devenus des flags
nommés, avec leur carte à l'écran.

---

## FIÉVREUX (`fievreux`)

**Source** — Plaie non soignée, eau de la Mare, morsure.

**Remède** — Le Rebouteux, ou un objet de soin.

**Manifestation** — Le froid t'a lâché d'un coup, et c'est mauvais signe : ce n'est plus l'air qui te réchauffe. Tes mains tremblent quand tu ne les regardes pas.

**Guérison** — La fièvre lâche prise d'un seul coup, comme une main qui s'ouvre. Le froid revient, et pour la première fois depuis des jours, tu es content de l'avoir.

**Réactions du monde**

- Un homme te croise, voit ta figure, et change de côté de chemin sans même ralentir. Ici, la fièvre et la Fixation se ressemblent trop.
- On te répond de loin, en tenant sa manche devant sa bouche. Personne ne te dit pourquoi — tout le monde le sait.


## BOITEUX (`boiteux`)

**Source** — Chute ou piège.

**Remède** — Une nuit de repos complet au campement.

**Manifestation** — Le genou ne plie plus tout à fait. Tu peux marcher — tu ne peux plus courir, et tu le sais avant d'avoir essayé.

**Guérison** — Au matin, tu poses le pied sans y penser. C'est à ça que tu comprends que c'est passé : tu n'y as pas pensé.

**Réactions du monde**

- Le chemin monte, et tu comptes tes pas comme on compte de la monnaie.
- Quelqu'un ralentit pour rester à ta hauteur. Ce n'est pas de la bonté : c'est qu'on veut voir jusqu'où tu tiens.


## AFFAMÉ (`affame`)

**Source** — Plusieurs jours sans manger.

**Remède** — De la nourriture — troc, fruit, ou don.

**Manifestation** — Ce n'est plus une faim, c'est une distraction. Tu regardes les mains des gens avant leur visage, pour voir ce qu'elles portent.

**Guérison** — Tu manges lentement, exprès, pour te prouver que tu peux. Le monde reprend sa taille normale.

**Réactions du monde**

- Le vieux coupe son quignon en deux sans te demander. Tu prends la moitié plus vite que tu n'aurais voulu.
- Une femme range son panier derrière elle en te voyant approcher. Elle ne dit rien. Elle n'a pas besoin.


## MARQUÉ (`marque`)

**Source** — Vol vu, violence publique, dénonciation.

**Remède** — Quitter la zone, ou un acte de réparation.

**Manifestation** — Quelqu'un a parlé avant toi. Tu le vois à la façon dont les têtes se tournent : pas vers toi — vers celui qui t'a désigné.

**Guérison** — Le geste a été vu par les bonnes personnes. On ne t'absout pas — on cesse simplement de te compter à part.

**Réactions du monde**

- Une croix fraîche à la craie, sur le seuil que tu viens de passer. Elle n'y était pas ce matin.
- La porte ne claque pas : elle se ferme lentement, en te regardant. C'est pire.


## HANTÉ (`hante`)

**Source** — Avoir vu quelque chose : le Gibet Vide, les Corbeaux, la mort d'un proche.

**Remède** — Aucun avant la fin de la run.

**Manifestation** — Ce que tu as vu ne s'est pas rangé. Ça reste posé de travers dans ta tête, et ça bouge quand tu ne le regardes pas.

**Guérison** — Rien ne lève cet état. Il te suivra jusqu'au bout de cette vie-là.

**Réactions du monde**

- Tu t'entends répondre à quelqu'un qui n'a pas parlé. Personne ne relève. C'est le pire.
- Une odeur de corde mouillée, ici, où il n'y a ni corde ni eau.

**Lignes intruses**

- — « Tu comptes, toi aussi. » Personne autour de toi n'a ouvert la bouche.
- Quelque chose grince très haut, très loin, à une hauteur où il n'y a rien.
- Pendant une seconde, le sol sous tes pieds est de la terre retournée de frais.
- Tu portes la main à ton cou. Il n'y a rien. Tu l'y portes quand même.
- Une ombre passe à ta gauche, à la vitesse d'un homme qui marche. Quand tu regardes, rien ne marche nulle part.
- Le vent dit un nom. Ce n'est pas le tien. Tu le retiens quand même.
- Tu comptes ce qui t'entoure — les ombres, les pierres. Il y en a toujours une de plus au deuxième compte.
- L'espace d'un pas, tes pieds ne touchent plus tout à fait le sol.


---

## Les Besoins (`lib/besoins.ts`)

Soigner (2 j) · dormir (3 j) · manger (3 j). Ils ne se manifestaient
que par l'état qu'ils finissaient par poser ; les états partis, ils n'avaient
plus de visage. Le directeur de routes (`routeAForcer`) rendait un remède
accessible dans les deux Croisées suivantes — l'idée est bonne et pourra
revenir sur un autre porteur.

- **soigner** — 2 jours, posait `fievreux`
- **dormir** — 3 jours, posait `boiteux`
- **manger** — 3 jours, posait `affame`