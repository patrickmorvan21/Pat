#!/usr/bin/env bash
# Lance l'outil de couverture visuelle en travaillant proprement sur DEUX POSTES
# (MacBook Air + iMac). Tout ce que l'outil écrit est suivi par git :
#
#   • aldenhar/public/assets/*.png      les illustrations elles-mêmes
#   • aldenhar/lib/scene-data.ts        le câblage lu par le jeu
#   • data/zones/*.json                 la matière de production
#   • data/couverture-verdicts.json     « à remplacer » / « ça marche »
#
# Donc git EST le pont entre les deux machines. Ce script se charge de la partie
# fragile : récupérer le travail de l'autre poste AVANT d'éditer, et proposer de
# le publier APRÈS. Sans ça, deux séances sur deux Macs finissent en conflit sur
# scene-data.ts.
#
#   ./tools/couverture.sh              # pull, lance, puis propose de pousser
#   ./tools/couverture.sh --port 8899  # autre port
#   ./tools/couverture.sh --no-sync    # ne touche pas à git (hors ligne)
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
PORT=8765
SYNC=1
while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --no-sync) SYNC=0; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "argument inconnu : $1"; exit 1 ;;
  esac
done

O="\033[38;5;173m"; W="\033[1m"; D="\033[2m"; R="\033[0m"
say()  { printf "${O}%s${R}\n" "$1"; }
warn() { printf "${W}%s${R}\n" "$1"; }

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || { echo "pas un dépôt git"; exit 1; }

# ── 1. Python + Pillow ────────────────────────────────────────────────────────
command -v python3 >/dev/null || { warn "python3 est introuvable."; exit 1; }
if ! python3 -c "import PIL" 2>/dev/null; then
  say "Pillow manquant (nécessaire au dithering) — installation…"
  python3 -m pip install --quiet --user pillow || {
    warn "Échec. Lance : python3 -m pip install pillow"; exit 1; }
fi

# ── 2. Récupérer le travail de l'autre poste ──────────────────────────────────
# L'ordre compte : on ne démarre JAMAIS sur une base périmée, sinon on réécrit
# scene-data.ts par-dessus les modifs faites sur l'autre Mac.
if [ "$SYNC" = 1 ]; then
  say "── Synchro avec origin/$BRANCH"
  if ! git fetch --quiet origin "$BRANCH" 2>/dev/null; then
    warn "  Pas de réseau (ou branche absente) — je continue en local."
  else
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse "origin/$BRANCH")
    BASE=$(git merge-base @ "origin/$BRANCH")
    DIRTY=$(git status --porcelain)

    if [ "$LOCAL" = "$REMOTE" ]; then
      echo "  À jour."
    elif [ "$LOCAL" = "$BASE" ]; then
      if [ -n "$DIRTY" ]; then
        warn "  Du retard ET des modifs locales non enregistrées :"
        git status --short | sed 's/^/    /'
        warn "  Enregistre-les d'abord (git add + git commit), puis relance."
        exit 1
      fi
      say "  Du retard sur l'autre poste — je récupère."
      git merge --ff-only "origin/$BRANCH" | sed 's/^/    /'
    elif [ "$REMOTE" = "$BASE" ]; then
      warn "  Tu as du travail pas encore publié depuis ce poste."
      echo "  Il partira à la fin de la séance."
    else
      # Le cas dangereux : les deux Macs ont avancé séparément.
      warn "  ⚠️  Les deux postes ont avancé de leur côté (historiques divergents)."
      warn "     Je ne lance pas l'outil : éditer maintenant rendrait le conflit"
      warn "     pire. À faire, dans l'ordre :"
      echo "       git pull --rebase origin $BRANCH"
      echo "       # règle les conflits éventuels, puis relance ce script"
      exit 1
    fi
  fi
  echo
fi

# ── 3. L'outil ────────────────────────────────────────────────────────────────
BEFORE=$(git status --porcelain | sort)

say "── Couverture visuelle"
echo "   Ouvre : http://localhost:$PORT/"
printf "   ${D}Les images affichées sont les PNG d'origine, pleine résolution.${R}\n"
printf "   ${D}Clic sur une vignette pour l'agrandir. Ctrl-C pour finir.${R}\n"
echo
trap '' INT                       # le Ctrl-C arrête python, pas ce script
python3 tools/coverage.py --serve --port "$PORT"
trap - INT
echo

# ── 4. Publier pour l'autre poste ─────────────────────────────────────────────
AFTER=$(git status --porcelain | sort)
if [ "$BEFORE" = "$AFTER" ] && git diff --quiet && git diff --cached --quiet; then
  say "── Rien n'a changé. Rien à publier."
  exit 0
fi

say "── Ce que la séance a changé"
git status --short | sed 's/^/   /'
echo
if [ "$SYNC" = 0 ]; then
  echo "   (--no-sync : à toi de faire le commit et le push.)"
  exit 0
fi

printf "Publier pour l'autre poste ? [O/n] "
read -r ANS </dev/tty || ANS="n"
case "${ANS:-O}" in
  [nN]*)
    echo "   Gardé en local. ⚠️  Pense à pousser avant de passer sur l'autre Mac,"
    echo "   sinon les deux historiques vont diverger."
    ;;
  *)
    git add -A
    N=$(git diff --cached --name-only | wc -l | tr -d ' ')
    git commit -q -m "Couverture visuelle : séance d'édition des illustrations

$N fichier(s) touché(s) depuis l'outil de couverture."
    if git push --quiet -u origin "$BRANCH"; then
      say "   Publié sur origin/$BRANCH — l'autre poste l'aura au prochain lancement."
    else
      warn "   Le commit est fait mais le push a échoué (réseau ?)."
      echo "   Réessaie : git push -u origin $BRANCH"
    fi
    ;;
esac
