#!/usr/bin/env bash
# Dépose les images validées du Drive dans le dépôt, en une commande.
#
# À LANCER SUR LE MAC DE PATRICK (c'est là qu'est le Drive synchronisé).
# Depuis la racine du dépôt :
#
#     ./tools/deposer_assets.sh
#
# Ce que ça fait : copie chaque PNG des trois dossiers « 03_Validé_* » vers
# aldenhar/public/assets/, mais UNIQUEMENT ceux qui sont nouveaux ou dont le
# contenu a changé (comparaison octet pour octet, pas la date). Puis liste ce
# qui a bougé et propose de commiter et pousser.
#
# Pourquoi un script plutôt qu'un cp à la main : le connecteur Drive me renvoie
# chaque image en base64 dans mon contexte (~10 000 tokens par PNG), donc tirer
# vingt images depuis une session coûte une session entière. Passer par ton
# disque, c'est instantané et gratuit — je n'ai plus qu'à câbler.
#
# Options :
#   ./tools/deposer_assets.sh /chemin/vers/Photos   → force le dossier source
#   ./tools/deposer_assets.sh --no-push             → copie et commit sans pousser
set -uo pipefail

CIBLE="aldenhar/public/assets"
PUSH=1
SRC=""

for arg in "$@"; do
  case "$arg" in
    --no-push) PUSH=0 ;;
    *) SRC="$arg" ;;
  esac
done

if [ ! -d "$CIBLE" ]; then
  echo "✗ À lancer depuis la RACINE du dépôt (dossier $CIBLE introuvable)." >&2
  exit 1
fi

# ── Trouver le dossier Photos ────────────────────────────────────────────────
# On cherche plutôt que de coder le chemin en dur : les dossiers de Patrick ont
# déjà été renommés une fois (APP → PACTUM, 17/07), et ça a cassé /leo-import.
if [ -z "$SRC" ]; then
  BASE="$HOME/Library/CloudStorage"
  if [ ! -d "$BASE" ]; then
    echo "✗ $BASE introuvable — Google Drive n'est pas monté sur cette machine." >&2
    echo "  Lance le script sur le Mac où le Drive est synchronisé, ou passe" >&2
    echo "  le chemin du dossier Photos en argument." >&2
    exit 1
  fi
  # -maxdepth borne la recherche : le Drive complet est trop gros à parcourir.
  SRC=$(find "$BASE" -maxdepth 6 -type d -path '*/PACTUM/Photos' -print -quit 2>/dev/null)
fi

if [ -z "$SRC" ] || [ ! -d "$SRC" ]; then
  echo "✗ Dossier « PACTUM/Photos » introuvable." >&2
  echo "  Ouvre-le dans le Finder, fais ⌥⌘C (copier le chemin), puis :" >&2
  echo "    ./tools/deposer_assets.sh \"<le chemin collé>\"" >&2
  exit 1
fi
echo "Source : $SRC"

# ⚠️ Glob « 03_Valid* » et non « 03_Validé_* » : macOS écrit les accents en
# forme décomposée (e + accent), donc un « é » tapé ici ne matche pas toujours.
DOSSIERS=("$SRC"/03_Valid*)
if [ ! -d "${DOSSIERS[0]}" ]; then
  echo "✗ Aucun dossier 03_Validé_* dans $SRC" >&2
  exit 1
fi

# ── Copier ce qui est nouveau ou modifié ─────────────────────────────────────
nouveaux=(); modifies=(); inchanges=0
for dossier in "${DOSSIERS[@]}"; do
  [ -d "$dossier" ] || continue
  echo "  · $(basename "$dossier")"
  while IFS= read -r -d '' f; do
    nom=$(basename "$f")
    dest="$CIBLE/$nom"
    if [ ! -f "$dest" ]; then
      cp "$f" "$dest" && nouveaux+=("$nom")
    elif ! cmp -s "$f" "$dest"; then
      cp "$f" "$dest" && modifies+=("$nom")
    else
      inchanges=$((inchanges + 1))
    fi
  done < <(find "$dossier" -maxdepth 1 -type f -name '*.png' -print0)
done

echo
echo "── Récapitulatif ──"
echo "  nouveaux : ${#nouveaux[@]}"
for n in "${nouveaux[@]}"; do echo "      + $n"; done
echo "  modifiés : ${#modifies[@]}"
for n in "${modifies[@]}"; do echo "      ~ $n"; done
echo "  inchangés : $inchanges"

if [ ${#nouveaux[@]} -eq 0 ] && [ ${#modifies[@]} -eq 0 ]; then
  echo
  echo "Rien à déposer : le dépôt est déjà à jour."
  exit 0
fi

# ── Commiter et pousser ──────────────────────────────────────────────────────
BRANCHE=$(git rev-parse --abbrev-ref HEAD)
echo
read -r -p "Commiter ces ${#nouveaux[@]} nouvelles + ${#modifies[@]} modifiées sur « $BRANCHE » ? [O/n] " rep
case "${rep:-o}" in
  [nN]*) echo "Rien commité. Les fichiers sont copiés, à toi de voir." ; exit 0 ;;
esac

git add "$CIBLE"
git commit -q -m "Assets : ${#nouveaux[@]} nouvelles images, ${#modifies[@]} mises à jour (Drive 03_Validé)"
echo "✓ Commité."

if [ "$PUSH" -eq 1 ]; then
  # Le pull d'abord : la branche bouge aussi depuis mes sessions.
  git pull --rebase --autostash origin "$BRANCHE" >/dev/null 2>&1 || {
    echo "⚠ Le rebase a échoué — pousse à la main après avoir réglé le conflit." >&2
    exit 1
  }
  for essai in 1 2 3 4; do
    if git push -u origin "$BRANCHE"; then
      echo "✓ Poussé sur $BRANCHE. Dis-moi, je câble les scènes."
      exit 0
    fi
    echo "  réseau ? nouvelle tentative dans $((2 ** essai))s…"
    sleep $((2 ** essai))
  done
  echo "✗ Push impossible après 4 tentatives — le commit est en local." >&2
  exit 1
fi
