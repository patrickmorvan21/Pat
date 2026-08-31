/**
 * LE CODEX — « Ce que tes morts ont compris » (Phase E du plan d'élagage,
 * spec Notion 20/08, maquettes Figma 2491:1236 / 2492:1379 / 2492:1432 /
 * 2492:1561 + entrée d'Arc décrite par la spec).
 *
 * Hiérarchie : Codex → Acte → Zone → Entrée. Le Codex est de la LECTURE
 * PURE — une entrée débloquée ne change RIEN en jeu (test d'acceptation du
 * plan d'élagage : le jeu reste compréhensible sans lui). Il enrichit, il
 * n'explique jamais ce qui est nécessaire.
 *
 * Ce que ce fichier PORTE : les entrées (titre, corps, image) et les tables
 * de déblocage (scène → entrée, découverte → arc). Ce qu'il ne porte PAS :
 * la provenance — « Découvert par Maël — Jour IV » vit dans
 * `PlayerMemory.codex`, écrite au moment du déblocage, parce que c'est elle
 * qui fait du Codex un registre des morts du joueur et pas une encyclopédie.
 *
 * Règle d'illustration (verrouillée par la spec) : un Lieu ou une Rencontre
 * a son image propre (bandeau haut, hauteur pleine) ; un ARC est transverse,
 * il porte l'image de l'ACTE entier, en bandeau court — un Arc n'a JAMAIS
 * d'illustration dédiée, on ne génère pas d'image pour une idée.
 *
 * ⚠️ Les états archivés (`data/archive-etats.md`) N'ENTRENT PAS ici —
 * décision Patrick du 20/08. Ils restent sans destination, à reloger un jour.
 */

export type CodexType = "lieu" | "rencontre" | "arc";

export type CodexEntry = {
  id: string;
  type: CodexType;
  zone: "landes";
  titre: string;
  /** 2-4 phrases. Voix du registre : sobre, sensorielle, jamais une règle. */
  corps: string;
  /** Lieux et rencontres seulement — les arcs prennent IMAGE_ACTE_I. */
  illustration?: string;
};

/** L'image de l'Acte I (la frise des Lisières — celle du carton d'acte). */
export const IMAGE_ACTE_I = "assets/scene_landes_frise_montagnes_pleine_b.png";

export const CODEX_LANDES: CodexEntry[] = [
  // ─── LIEUX ────────────────────────────────────────────────────────────
  {
    id: "lieu:borne-frontiere",
    type: "lieu",
    zone: "landes",
    titre: "La Borne Frontière",
    corps:
      "Plus haute qu'un homme, plantée avant le premier chemin. Le côté nord porte les marques de ceux qui entrent ; le côté sud, trois marques que personne n'explique — on ne grave pas au retour quand personne ne revient. Les offrandes à son pied ne sont pas pour elle.",
    illustration: "assets/scene_borne_frontiere_v2_a.png",
  },
  {
    id: "lieu:chemin-creux",
    type: "lieu",
    zone: "landes",
    titre: "Le Chemin Creux",
    corps:
      "Deux talus plus hauts que la tête, et une charrette qui penche au premier coude depuis assez longtemps pour que la bruyère l'ait prise. On y marche plus vite qu'ailleurs, sans se le dire. Le coude aveugle mange la vue — et ce qu'il y a derrière compte les pas.",
    illustration: "assets/scene_chemin_creux_d_a.png",
  },
  {
    id: "lieu:colline-aux-gibets",
    type: "lieu",
    zone: "landes",
    titre: "La Colline aux Gibets",
    corps:
      "Une file de potences le long de la crête, lisible de bas en haut comme une chronologie. La dernière est la plus haute, et son nom a été gratté. Les corbeaux qui s'y posent ne se posent jamais au hasard : ils sont toujours exactement le bon nombre.",
    illustration: "assets/scene_colline_aux_gibets_d_d.png",
  },
  {
    id: "lieu:champ-des-fixes",
    type: "lieu",
    zone: "landes",
    titre: "Le Champ des Fixés",
    corps:
      "Un cimetière était là avant — la Fixation a planté ses poteaux entre les stèles penchées. Chaque poteau porte un nom et une date, sauf les vierges, taillés d'avance. Le Fossoyeur y creuse des trous qu'on ne lui a pas commandés.",
    illustration: "assets/scene_champ_des_fixes_c_a.png",
  },
  {
    id: "lieu:serment-hameau",
    type: "lieu",
    zone: "landes",
    titre: "Le Seuil du Hameau",
    corps:
      "La barrière se franchit sans un garde — le village n'a pas besoin de gardes. Au bout de la rue, un muret bas où l'on jure trois clauses pour trois aubes. Aucun chien n'aboie, et ce silence-là a été décidé.",
    illustration: "assets/scene_hameau_dense2_c_e.png",
  },
  {
    id: "lieu:hameau-halte",
    type: "lieu",
    zone: "landes",
    titre: "La Grange des Renonçants",
    corps:
      "La seule porte du village qui s'ouvre à qui a juré. La barre se pose DEHORS — elle n'enferme pas, elle signale une grange occupée. Les combles sont cloués de l'intérieur, et personne ne dort sous le toit.",
    illustration: "assets/scene_landes_hameau_grange_b_d.png",
  },
  {
    id: "lieu:marche-muet",
    type: "lieu",
    zone: "landes",
    titre: "Le Marché Muet",
    corps:
      "On y négocie par gestes, sous des bâches tendues, et le premier mot dit à voix haute fait tourner toutes les têtes. Le Colporteur y revend ce qu'on ne lui demande pas d'où il vient. C'est le seul endroit des Landes où l'on échange encore quelque chose.",
    illustration: "assets/scene_marche_muet_d_f.png",
  },
  {
    id: "lieu:tour-de-guet",
    type: "lieu",
    zone: "landes",
    titre: "La Tour de Guet effondrée",
    corps:
      "Elle s'est couchée d'un bloc, dans l'axe du grand gibet — on le voit à la lunette, pas à l'œil nu. Les pierres du pied arrivent aux chevilles. Un homme la garde encore, debout, comme si la tour allait se relever.",
    illustration: "assets/scene_tour_de_guet_a.png",
  },
  {
    id: "lieu:campement",
    type: "lieu",
    zone: "landes",
    titre: "Le Moulin Arrêté",
    corps:
      "Quatre ailes ouvertes en croix sur le couchant — et aucun vent ne les fait tourner. Jamais. C'est le seul endroit des Landes où l'on dort d'un vrai sommeil, et personne au village ne dira pourquoi. Quelqu'un y vit, que le village a décidé de ne pas voir.",
    illustration: "assets/scene_moulin_campement_a.png",
  },
  {
    id: "lieu:chapelle-des-cordes",
    type: "lieu",
    zone: "landes",
    titre: "La Chapelle des Cordes",
    corps:
      "Les cordes pendent du plafond le long des deux parois, chacune tressée pour un nom. Au fond, l'autel est debout, sa dalle de base tirée en avant sur un creux vide. La Veuve refait depuis trente ans une corde que quelqu'un défait.",
    illustration: "assets/scene_chapelle_des_cordes_e_d.png",
  },
  {
    id: "lieu:puits-condamne",
    type: "lieu",
    zone: "landes",
    titre: "Le Puits Condamné",
    corps:
      "Les planches sont clouées du dessus, mais l'eau, en bas, bouge quand personne ne la touche. Ceux qui ont collé l'oreille aux planches parlent de mains. Le hameau n'y puise plus — il y descend des choses.",
    illustration: "assets/scene_puits_condamne_v2_b_f.png",
  },
  {
    id: "lieu:chien-du-bailli",
    type: "lieu",
    zone: "landes",
    titre: "La Maison du Bailli",
    corps:
      "Seule à l'ouest du hameau, haute toiture au-dessus de la bruyère, fenêtres murées de l'intérieur. Le maître pend à la colline depuis des années — mais l'ordre de garder la porte n'a jamais été levé, et quelque chose le garde encore.",
    illustration: "assets/scene_maison_du_bailli_c.png",
  },
  {
    id: "lieu:petit-tribunal",
    type: "lieu",
    zone: "landes",
    titre: "Le Petit Tribunal",
    corps:
      "Une salle basse de pierre, plantée de travers par rapport à la rue, trois bancs face à une chaire. L'Ordonnance de la Fixation est clouée au mur, et l'Écrivain public tient un registre qui n'est pas de sa main. On y juge vite, et toujours à l'unanimité.",
    illustration: "assets/scene_petit_tribunal_b_g.png",
  },
  {
    id: "lieu:mare-aux-regards",
    type: "lieu",
    zone: "landes",
    titre: "La Mare aux Regards",
    corps:
      "Une eau noire où les roseaux ne bougent pas. Le reflet y est en retard d'une demi-seconde — il finit toujours par rattraper. La berge est usée à UN endroit précis, par des gens qui viennent vérifier quelque chose, toujours au même.",
    illustration: "assets/scene_mare_aux_regards_b_a.png",
  },
  {
    id: "lieu:verger-noir",
    type: "lieu",
    zone: "landes",
    titre: "Le Verger Noir",
    corps:
      "Onze rangs plantés un par an, et les fruits mûrissent en cendre. Les arbres poussent — c'est pire que s'ils étaient morts. Deux silhouettes y travaillent encore, redressées entre les rangs, et récitent des prénoms au lieu de compter.",
    illustration: "assets/scene_verger_noir_e_f.png",
  },
  {
    id: "lieu:palissade-sud",
    type: "lieu",
    zone: "landes",
    titre: "La Palissade Sud",
    corps:
      "Des rondins pointés vers l'INTÉRIEUR : ce mur ne défend pas les Landes — il retient ce qui voudrait descendre. Derrière le portillon, des marches balayées de frais s'enfoncent. Le Veilleur note les départs dans une colonne, et les retours dans une autre, vide depuis trente ans.",
    illustration: "assets/scene_palissade_sud_a_b_a.png",
  },
  {
    id: "lieu:la-descente",
    type: "lieu",
    zone: "landes",
    titre: "La Descente",
    corps:
      "L'escalier au-delà du portillon, balayé par personne qu'on ait vu. C'est la seule sortie des Landes qui ne passe pas par un poteau. Ceux qui la franchissent ne reviennent pas — sauf que la Borne, côté sud, porte trois marques.",
    illustration: "assets/scene_landes_liaison_sud_d_h.png",
  },

  // ─── RENCONTRES ───────────────────────────────────────────────────────
  {
    id: "renc:marcheur",
    type: "rencontre",
    zone: "landes",
    titre: "Le Marcheur à rebours",
    corps:
      "Il parcourt le Chemin Creux à reculons, d'un pas sûr, le visage tourné vers ce qu'il laisse. Il compte ses pas par multiples de onze et sait où la Bête n'est pas — « c'est déjà la moitié d'une carte ». Personne ne l'a jamais vu faire demi-tour.",
    illustration: "assets/monstre_marcheur_1_c_b.png",
  },
  {
    id: "renc:hesitant",
    type: "rencontre",
    zone: "landes",
    titre: "L'Hésitant",
    corps:
      "Immobile près de la Borne, ni entrant ni sortant, depuis plus longtemps qu'il ne veut le dire. Il ne fixe pas le sud. Ce qu'il attend n'a pas de nom — et quand on essaie de le ramener, c'est lui qui sait le chemin.",
    illustration: "assets/monstre_hesitant_c_b.png",
  },
  {
    id: "renc:femme-seuil",
    type: "rencontre",
    zone: "landes",
    titre: "La Femme au Seuil",
    corps:
      "Quarante ans sur le pas de sa porte à attendre qu'on la croie. Sa croix de craie est la plus ancienne du village, et la seule qu'on ne renouvelle plus. Elle ne dénoncera jamais personne — c'est ce qui la rend seule.",
    illustration: "assets/monstre_femme_seuil_1_v3_a.png",
  },
  {
    id: "renc:gamin-murets",
    type: "rencontre",
    zone: "landes",
    titre: "Le Gamin des Murets",
    corps:
      "Il court les murets qui ne mènent nulle part, un caillou de rivière en poche — dans un pays sans rivière. Il connaît les raccourcis et compte les corbeaux mieux que personne. Il suit qui il a décidé de suivre, jusqu'où il l'a décidé.",
    illustration: "assets/monstre_gamin_murets_b_b.png",
  },
  {
    id: "renc:epoux",
    type: "rencontre",
    zone: "landes",
    titre: "Les Époux du Verger",
    corps:
      "Ils ont planté un rang par an, onze ans, et un douzième commencé. Lui récite des prénoms en travaillant — onze prénoms. Elle essuie une bêche qui n'est pas la sienne. Ils offrent leurs fruits à qui passe, et leurs fruits sont de la cendre.",
    illustration: "assets/monstre_epoux_verger_b_b.png",
  },
  {
    id: "renc:veilleur",
    type: "rencontre",
    zone: "landes",
    titre: "Le Veilleur",
    corps:
      "Trente ans de guérite à la Palissade, à tenir le registre des départs. Il te parle avant que tu aies décidé de lui parler. En haut de la colonne des retours — vide — une marque d'une autre main, qu'il ne regarde jamais.",
    illustration: "assets/monstre_veilleur_palissade_v2_b.png",
  },
  {
    id: "renc:guetteur",
    type: "rencontre",
    zone: "landes",
    titre: "Le Guetteur sans tour",
    corps:
      "Sa tour s'est couchée, et lui est resté debout à côté, à guetter ce qu'elle guettait. Il retourne les pierres du pied comme si l'une d'elles allait rendre la vue d'en haut. Ce qu'il surveillait n'a pas cessé d'exister parce que la tour est tombée.",
    illustration: "assets/monstre_guetteur_tour_d_a.png",
  },
  {
    id: "renc:colporteur",
    type: "rencontre",
    zone: "landes",
    titre: "Le Colporteur",
    corps:
      "Le seul étal du Marché qui parle. Il revend ce qui vient d'ailleurs et ne demande pas d'où — « moi je revends ». Il reconnaît les visages qu'il ne devrait pas reconnaître : en vingt ans, dit-il, il en a vu trois comme ça. Et les trois, deux fois.",
    illustration: "assets/monstre_colporteur_c_c.png",
  },
  {
    id: "renc:rebouteux",
    type: "rencontre",
    zone: "landes",
    titre: "Le Rebouteux",
    corps:
      "Il soigne le soir, à l'écart des bâches, et recule d'un pas devant certaines fièvres. Ce qu'il ne peut pas refermer, il l'envoie à la Mare — « ça se soigne pas ici ». Ses mains savent avant lui ce qu'elles refusent de toucher.",
    illustration: "assets/monstre_rebouteux_b_b.png",
  },
  {
    id: "renc:fossoyeur",
    type: "rencontre",
    zone: "landes",
    titre: "Le Fossoyeur",
    corps:
      "Il taille les poteaux du Champ et grave un écriteau dont il ne connaît pas le sens. Une fois, une seule, il a retiré un poteau sans savoir pourquoi — la seule chose de sa vie dont il ne sait pas la raison. Il creuse d'avance, parce qu'on a prévu large.",
    illustration: "assets/monstre_fossoyeur_poteaux_b_a.png",
  },
  {
    id: "renc:veuve",
    type: "rencontre",
    zone: "landes",
    titre: "La Veuve des Cordes",
    corps:
      "C'est elle qui a tressé la première corde de la Chapelle, et elle refait depuis trente ans celle que quelqu'un défait. Elle connaît chaque nom par le poids de son chanvre. Elle ne demande jamais pourquoi on regarde le mur — elle sait lequel on cherche.",
    illustration: "assets/monstre_veuve_cordes_v2_b_d.png",
  },
  {
    id: "renc:ecrivain",
    type: "rencontre",
    zone: "landes",
    titre: "L'Écrivain public",
    corps:
      "Il tient le Registre des Pendaisons au Petit Tribunal, les deux mains à plat dessus quand on s'approche trop. En face de chaque nom rayé, un nom du hameau — « le registre ne juge pas, il équilibre ». Le petit signe en marge n'est pas de sa main.",
    illustration: "assets/monstre_ecrivain_public_e_a.png",
  },
  {
    id: "renc:bailli",
    type: "rencontre",
    zone: "landes",
    titre: "Le Pendu qui parle",
    corps:
      "Le Bailli pend à la plus haute potence de la colline, à hauteur de regard, et il parle encore. Il a signé trois cents noms ; le trois cent unième était le sien, de sa propre main. Le village ne prononce plus son nom — mais il applique toujours sa loi.",
    illustration: "assets/monstre_pendu_qui_parle_2_b_a.png",
  },
  {
    id: "renc:chien",
    type: "rencontre",
    zone: "landes",
    titre: "Le Chien du Bailli",
    corps:
      "Gris, trop grand, le poil usé aux endroits d'un harnais qu'il ne porte plus. Son maître pend à la colline — mais l'ordre n'a jamais été levé, alors personne n'entre. Il ne mord pas par colère. Il mord par consigne.",
    illustration: "assets/monstre_chien_du_bailli_b.png",
  },
  {
    id: "renc:bete",
    type: "rencontre",
    zone: "landes",
    titre: "La Bête des Chemins Creux",
    corps:
      "Elle ne creuse pas ses couloirs : elle les choisit — et parfois elle les creuse sur ta route, dans la nuit. Elle travaille dans l'axe, jamais sur les bords, et ne suit que ce qui fuit. On ne la sème pas. On ne sème pas ce qui compte les pas.",
    illustration: "assets/monstre_bete_chemins_creux_a.png",
  },
  {
    id: "renc:meute",
    type: "rencontre",
    zone: "landes",
    titre: "La Meute Grise",
    corps:
      "Cinq de front, couleur de bruyère morte — le cercle est ce qu'on ne voit pas, derrière. Ce sont les chiens des premières expéditions, restés à attendre un ordre que personne ne viendra donner. On ne traque pas ce qui porte la clochette d'une meneuse.",
    illustration: "assets/monstre_meute_grise_c.png",
  },
  {
    id: "renc:pendu-mal-fixe",
    type: "rencontre",
    zone: "landes",
    titre: "Le Pendu Mal Fixé",
    corps:
      "Une Fixation bâclée : les signes de l'Ordonnance mal tracés, et ce qui devait tenir ne tient pas. Il erre autour du Champ avec sa corde, et il cherche quelqu'un pour finir le travail — dans un sens ou dans l'autre.",
    illustration: "assets/monstre_pendu_mal_fixe_v2_d_b.png",
  },
  {
    id: "renc:troupeau",
    type: "rencontre",
    zone: "landes",
    titre: "Le Troupeau sans Berger",
    corps:
      "Des bêtes qui paissent en ordre, sans personne pour les tenir — et leur nombre grossit d'une saison à l'autre, exactement du mauvais compte. La meneuse porte une clochette. Une brebis, parfois, se détache et RETOURNE au Champ des Fixés.",
    illustration: "assets/monstre_troupeau_sans_berger_a.png",
  },
  {
    id: "renc:fille",
    type: "rencontre",
    zone: "landes",
    titre: "La Petite Fixée",
    corps:
      "Ni morte, ni partie, pas grandie — sa Fixation a raté, et la reconnaître serait admettre que trois cents noms sont morts pour rien. Alors le village la voit, et refuse de la voir. Le hameau lui donne un nom d'écriteau plutôt que le sien. Elle a huit ans. Elle les a depuis quarante ans.",
    illustration: "assets/monstre_la_fille_moulin_v2_c_b.png",
  },

  // ─── ARCS ─────────────────────────────────────────────────────────────
  {
    id: "arc:serment",
    type: "arc",
    zone: "landes",
    titre: "Le Serment des trois aubes",
    corps:
      "Trois clauses au muret, valables trois aubes : ne pas parler aux pendus, ne pas les toucher, ne pas regarder le sud. Le hameau ne vérifie pas — il n'en a pas besoin. Un serment tenu ouvre la grange ; un serment menti se raconte plus loin que la vie de celui qui l'a prêté.",
  },
  {
    id: "arc:fixation",
    type: "arc",
    zone: "landes",
    titre: "La Fixation",
    corps:
      "Des gens ordinaires pendent leurs voisins, à l'unanimité, selon une Ordonnance qu'ils n'ont pas écrite pour eux. Personne ne les y force — c'est ce qui la rend impossible à regarder en face. On ne fixe pas pour punir. On fixe pour que quelque chose reste en place.",
  },
  {
    id: "arc:bailli",
    type: "arc",
    zone: "landes",
    titre: "Les trois cents noms",
    corps:
      "Le Bailli a appliqué l'Ordonnance trois cents fois. Le trois cent unième nom était celui qu'il a refusé d'inscrire — alors il a inscrit le sien en dessous, et le village l'a pendu selon sa propre loi. Sa maison reste gardée, sa chaîne de fonction reste au cou de son cadavre, et sa procédure reste en vigueur.",
  },
  {
    id: "arc:fille",
    type: "arc",
    zone: "landes",
    titre: "Celle que le village ne voit pas",
    corps:
      "Un seul échec en trois cents Fixations — et il habite le Moulin. On ne condamne pas quelqu'un qu'on a décidé de ne pas voir : c'est ce qui fait du Moulin le seul lieu sûr des Landes. Plus on va à l'ouest, plus on risque de la croiser. Plus on va à l'est, plus on risque de croiser l'autre.",
  },
  {
    id: "arc:temoin",
    type: "arc",
    zone: "landes",
    titre: "Ce qui regarde depuis les toits",
    corps:
      "Il n'a pas inventé la Fixation — il est venu parce qu'elle existait. Un poids sur le toit de la grange, une silhouette au bout d'une ruelle, une place debout aux procès. Personne ne ment à son sujet : le village a oublié ensemble, et chacun garde un fragment en croyant que c'est tout.",
  },
  {
    id: "arc:sceau",
    type: "arc",
    zone: "landes",
    titre: "La marque de la paume",
    corps:
      "Ceux qui franchissent la Descente vivants reviennent avec une entaille en creux dans la paume — et personne ne se fait ça tout seul. Le monde la reconnaît avant celui qui la porte. Au troisième passage, les marques se rejoignent et cessent de compter : ça ne ressemble plus à une blessure. Ça ressemble à un mot.",
  },
];

const PAR_ID = new Map(CODEX_LANDES.map((e) => [e.id, e]));

export function codexEntry(id: string): CodexEntry | null {
  return PAR_ID.get(id) ?? null;
}

/* ── TABLES DE DÉBLOCAGE ─────────────────────────────────────────────────
   Un déblocage s'enregistre AU MOMENT où la chose est vécue (Scene.tsx),
   avec le nom du héros et le jour — c'est la provenance. */

/** Nom de lieu (lieuNom) → entrée de lieu. */
export const CODEX_PAR_LIEU: Record<string, string> = {
  "La Borne Frontière": "lieu:borne-frontiere",
  "Le Chemin Creux": "lieu:chemin-creux",
  "La Colline aux Gibets": "lieu:colline-aux-gibets",
  "Le Champ des Fixés": "lieu:champ-des-fixes",
  "Le Seuil du Hameau": "lieu:serment-hameau",
  "La Grange des Renonçants": "lieu:hameau-halte",
  "Le Marché Muet": "lieu:marche-muet",
  "La Tour de Guet effondrée": "lieu:tour-de-guet",
  "Le Moulin Arrêté": "lieu:campement",
  "La Chapelle des Cordes": "lieu:chapelle-des-cordes",
  "Le Puits Condamné": "lieu:puits-condamne",
  "La Maison du Bailli": "lieu:chien-du-bailli",
  "Le Petit Tribunal": "lieu:petit-tribunal",
  "La Mare aux Regards": "lieu:mare-aux-regards",
  "Le Verger Noir": "lieu:verger-noir",
  "La Palissade Sud": "lieu:palissade-sud",
  "La Descente": "lieu:la-descente",
};

/** Radical de scène → entrée de RENCONTRE (le lieu, lui, passe par lieuNom).
    La rencontre se débloque quand on se tient DEVANT — l'écran où elle est
    mise en scène, pas celui où on en entend parler. */
export const CODEX_PAR_SCENE: Record<string, string> = {
  // La Descente vit hors du pool (nœud terminal) — lieuNom ne la résout pas,
  // on la débloque par son id de scène.
  "la-descente": "lieu:la-descente",
  marcheur: "renc:marcheur",
  hesitant: "renc:hesitant",
  "femme-seuil": "renc:femme-seuil",
  "gamin-murets": "renc:gamin-murets",
  epoux: "renc:epoux",
  veilleur: "renc:veilleur",
  "tour-de-guet-2": "renc:guetteur",
  "marche-muet-2": "renc:colporteur",
  "champ-des-fixes-2": "renc:fossoyeur",
  "chapelle-des-cordes-2": "renc:veuve",
  "petit-tribunal-2": "renc:ecrivain",
  "pendu-qui-parle-2": "renc:bailli",
  "chien-du-bailli-2": "renc:chien",
  "bete-chemins-creux": "renc:bete",
  "menace-retour-bete": "renc:bete",
  "meute-grise": "renc:meute",
  "menace-retour-meute": "renc:meute",
  "pendu-mal-fixe": "renc:pendu-mal-fixe",
  "troupeau-sans-berger": "renc:troupeau",
  "fille-moulin": "renc:fille",
};

/** Découverte (`d.*` / DECOUVERTES_FILLE) → entrée d'ARC. */
export const CODEX_PAR_DECOUVERTE: Record<string, string> = {
  "d.bailli_condamne": "arc:bailli",
  "d.ordonnance_lue": "arc:fixation",
  "d.temoin_vu": "arc:temoin",
  "d.temoin_nomme": "arc:temoin",
  "d.signe_plume": "arc:temoin",
  "d.temoin_entendu": "arc:temoin",
  "d.temoin_entrevu": "arc:temoin",
  "d.combles_cloues": "arc:temoin",
  "d.fille_vivante": "arc:fille",
  "d.fille_vue": "arc:fille",
  "d.emplacement_vide": "arc:fille",
  "d.fille_apercue": "arc:fille",
  "d.fixation_ratee": "arc:fille",
  "d.poteau_retire": "arc:fille",
  "d.temoin_oculaire": "arc:fille",
  "d.nom_gratte": "arc:fille",
  "d.crete_interrompue": "arc:fille",
  "d.troupeau_compte": "arc:fixation",
};

/** Les totaux par type, pour les compteurs `n/total` de l'écran de zone. */
export function totauxCodex(zone: "landes"): Record<CodexType, number> {
  const t: Record<CodexType, number> = { lieu: 0, rencontre: 0, arc: 0 };
  for (const e of CODEX_LANDES) if (e.zone === zone) t[e.type] += 1;
  return t;
}
