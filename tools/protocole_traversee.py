#!/usr/bin/env python3
"""LE PROTOCOLE TRAVERSÉE — la réplique enregistre-t-elle une traversée vivante ?

Né « protocole Sceau » (verdict de playtest du 15/08, point A : la commande
`nouvelle` lancée depuis la Descente n'incrémentait pas le compte). Le Sceau
est retiré le 25/09 (décision Patrick) ; ce qui reste à garder, c'est que le
compte retienne UNE traversée par traversée, par les trois portes de sortie,
et que la vie suivante ne porte plus aucune marque.

Ce garde joue vraiment deux traversées, l'une après l'autre, par les TROIS
portes de sortie possibles, et vérifie à chaque fois que :
  1. le compte porte une traversée de plus ;
  2. la vie suivante s'ouvre SANS marque dans la paume (Sceau retiré) ;
  3. la Borne relit le prédécesseur qui, lui, est revenu vivant — gardé
     à part du Registre (12/09), jamais inscrit comme une tombe ;
  4. une traversée ne se compte jamais deux fois.

    python3 tools/protocole_traversee.py           # les trois portes
    python3 tools/protocole_traversee.py --strict  # code de sortie 1 au moindre écart

⚠️ Il teste la RÉPLIQUE (`tools/pactum.py`), pas le jeu. Le jeu a sa propre
vérification en Playwright — les deux ne se remplacent pas : c'est justement
leur divergence qui a fait juger une mécanique absente le 15/08.
"""
from __future__ import annotations
import json, shutil, subprocess, sys, tempfile
from pathlib import Path

# ⚠️ Deux emplacements possibles, et c'est délibéré : ce fichier vit dans
# `tools/` du dépôt, MAIS il est aussi copié dans `jouer/` du paquet de
# playtest — un relecteur qui doit re-dériver les assertions d'un garde ne le
# vérifie pas, il en écrit un autre (réserve du playtest du 15/08). On cherche
# donc la table À CÔTÉ de soi d'abord, puis dans l'arborescence du dépôt.
ICI = Path(__file__).resolve().parent
RACINE = ICI.parent


def _trouver(nom: str, *candidats: Path) -> Path:
    for c in candidats:
        if c.exists():
            return c
    raise SystemExit(f"{nom} introuvable. Cherché :\n  " + "\n  ".join(map(str, candidats)))


PACTUM = _trouver("pactum.py", ICI / "pactum.py", RACINE / "tools" / "pactum.py")
KIT = _trouver("run-kit.json", ICI / "run-kit.json", RACINE / "data" / "run-kit.json")


class Table:
    """Une table de jeu isolée : `pactum.py` écrit à côté de lui-même."""

    def __init__(self, dossier: Path):
        self.d = dossier
        self.d.mkdir(parents=True, exist_ok=True)
        shutil.copy(PACTUM, self.d / "pactum.py")
        shutil.copy(KIT, self.d / "run-kit.json")

    def jouer(self, *args: str) -> str:
        r = subprocess.run(
            [sys.executable, "pactum.py", *args],
            cwd=self.d, capture_output=True, text=True, timeout=120,
        )
        return r.stdout + r.stderr

    @property
    def compte(self) -> dict:
        f = self.d / "compte.json"
        return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}

    @property
    def partie(self) -> dict:
        f = self.d / "partie.json"
        return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}


def traverser(t: Table, graines: list[int], limite: int = 400) -> tuple[bool, str]:
    """Joue jusqu'à la Descente, en essayant plusieurs graines s'il le faut.

    ⚠️ On ne cherche pas à bien jouer, on cherche à ATTEINDRE la sortie
    vivante — donc on ÉVITE les jets quand une option sans dé existe (un
    libellé à tag de stat arme le dé). Ma première version prenait toujours
    la dernière option : elle mourait au 25e écran et faisait conclure que
    la Descente était injoignable, alors que le défaut était dans le banc.
    Les combats n'offrant que des jets, une vie peut quand même finir mal :
    d'où plusieurs graines.
    """
    STATS = ("[COURAGE]", "[RUSE]", "[INSTINCT]", "[EMPATHIE]")
    for graine in graines:
        ecran = t.jouer("nouvelle", f"--graine={graine}")
        for _ in range(limite):
            d = t.partie
            if d.get("scene") == "la-descente":
                return True, ecran
            if d.get("sortie") or d.get("sante", 1) <= 0:
                break
            opts = [l for l in ecran.splitlines()
                    if l.strip().startswith(("1)", "2)", "3)", "4)"))]
            if not opts:
                break
            sans_de = [i for i, l in enumerate(opts, 1) if not any(s in l for s in STATS)]
            ecran = t.jouer(str(sans_de[-1] if sans_de else len(opts)))
    return False, ecran


def controle(nom: str, ok: bool, detail: str = "") -> bool:
    print(("  ✓ " if ok else "  ✗ ") + nom + (f"  — {detail}" if detail else ""))
    return ok


def main(argv: list[str]) -> int:
    strict = "--strict" in argv
    verts = True

    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)

        # ── PORTE 1 : `nouvelle` lancée depuis l'écran de la Descente.
        # C'est le geste du testeur, et c'est celui qui ne comptait pas.
        print("\nPORTE 1 — ouvrir une vie neuve depuis la Descente")
        t = Table(base / "porte1")
        arrive, _ = traverser(t, [4242, 17, 555, 8081, 1234])
        if not controle("la traversée atteint la Descente", arrive):
            print("     (impossible de juger la traversée sans sortie vivante)")
            return 1 if strict else 0
        # ⚠️ La traversée se compte à l'ARRIVÉE (c'est là qu'elle est
        # acquise) : mesurer juste avant
        # le geste de sortie donnerait toujours « 1 → 1 » et ferait passer le
        # correctif pour un échec. On mesure donc l'ACQUIS de la traversée,
        # puis on vérifie que le geste de sortie ne rajoute rien.
        arrivee = t.compte.get("traversees", 0)
        verts &= controle("la traversée est enregistrée à l'arrivée", arrivee == 1,
                          f"traversées {arrivee}")
        ouverture = t.jouer("nouvelle", "--graine=99")
        apres = t.compte.get("traversees", 0)
        verts &= controle("ouvrir une vie neuve ne recompte pas", apres == arrivee,
                          f"traversées {arrivee} → {apres}")
        verts &= controle(
            "la vie suivante s'ouvre SANS marque dans la paume (Sceau retiré)",
            "paume" not in ouverture.lower() and "entaille en creux" not in ouverture.lower(),
        )

        # ── PORTE 2 : le bouton « Repartir de la Borne ».
        print("\nPORTE 2 — le choix terminal de la Descente")
        t2 = Table(base / "porte2")
        arrive, ecran = traverser(t2, [777, 2026, 909, 4242, 33])
        if controle("la traversée atteint la Descente", arrive):
            arrivee = t2.compte.get("traversees", 0)
            verts &= controle("la traversée est enregistrée", arrivee == 1, f"traversées {arrivee}")
            t2.jouer("1")  # « Repartir de la Borne »
            apres = t2.compte.get("traversees", 0)
            verts &= controle("le bouton terminal ne recompte pas", apres == arrivee,
                              f"traversées {arrivee} → {apres}")
        else:
            verts = False

        # ── PORTE 3 : la double clôture. Une traversée ne compte qu'une fois.
        print("\nPORTE 3 — appuyer PUIS relancer ne compte pas deux fois")
        t3 = Table(base / "porte3")
        arrive, _ = traverser(t3, [31337, 88, 640, 777, 12])
        if controle("la traversée atteint la Descente", arrive):
            t3.jouer("1")
            t3.jouer("nouvelle", "--graine=1")
            apres = t3.compte.get("traversees", 0)
            verts &= controle("une traversée = un compte", apres == 1, f"traversées {apres}")
            # La Borne doit relire un prédécesseur REVENU, pas un mort — et
            # depuis le 12/09 il n'est PLUS au livre (le Registre est celui
            # des morts) : il est gardé à part, sans une seule tombe de plus.
            tombes = t3.compte.get("tombes", [])
            verts &= controle(
                "le survivant est gardé à part, hors du Registre",
                bool(t3.compte.get("dernierSurvivant"))
                and not any("franchi" in (t.get("cause") or "") for t in tombes),
                f"survivant={t3.compte.get('dernierSurvivant')!r} · tombes franchi="
                f"{sum(1 for t in tombes if 'franchi' in (t.get('cause') or ''))}",
            )
        else:
            verts = False

    print("\n" + ("PROTOCOLE TRAVERSÉE — vert." if verts
                  else "PROTOCOLE TRAVERSÉE — au moins un écart."))
    return 0 if verts or not strict else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
