#!/usr/bin/env python3
"""Outil de couverture visuelle PACTUM — rapport + édition.

Journal Notion 25/07 « Outil de couverture visuelle » : voir d'un coup d'œil
quelle image est attachée à quelle scène, repérer les manques et les remplacer.

    python3 tools/coverage.py              # écrit data/couverture_visuelle.html
    python3 tools/coverage.py --serve      # + serveur d'édition sur :8765

Le rapport est GÉNÉRÉ, jamais écrit à la main : il croise

  • aldenhar/lib/scene-data.ts   → l'image RÉELLEMENT affichée en jeu
  • data/zones/*.json           → la matière de production (lieu_attache)
  • data/scene-meta.json        → description + prompt_image par scène
  • aldenhar/public/assets/     → existence des fichiers, et orphelins

⚠️ Pourquoi lire le .ts et pas seulement les JSON de zone : c'est
`lib/scene-data.ts` que le jeu exécute. `data/zones/landes.json` est de la
matière de production qui n'est PAS lue au runtime — s'y fier ferait mentir la
colonne « image affichée en jeu ». Les divergences entre les deux sont
justement une des choses que ce rapport doit montrer.

Le parsing du .ts est volontairement textuel (regex) : pas de dépendance à un
toolchain TypeScript pour un outil de production, et le format des scènes est
stable et régulier.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCENE_TS = ROOT / "aldenhar" / "lib" / "scene-data.ts"
ZONES_DIR = ROOT / "data" / "zones"
META_JSON = ROOT / "data" / "scene-meta.json"
ASSETS = ROOT / "aldenhar" / "public" / "assets"
OUT_HTML = ROOT / "data" / "couverture_visuelle.html"

PORTAL = "assets/dithering-portal.jpg"

# Statuts (4 couleurs, comme la maquette de référence).
DEDIEE, HERITEE, FALLBACK, MANQUANTE = "dediee", "heritee", "fallback", "manquante"
STATUT_LABEL = {
    DEDIEE: "dédiée",
    HERITEE: "héritée",
    FALLBACK: "fallback de zone",
    MANQUANTE: "manquante",
}


@dataclass
class Item:
    """Une carte du rapport : une scène, ou un point d'intérêt."""

    id: str
    kind: str  # "scene" | "poi"
    image: str | None
    statut: str
    parent: str = ""  # scène porteuse (POI) ou source de l'héritage
    description: str = ""
    prompt: str = ""
    categorie: str = "scene"  # scene | monstre | objet | liaison
    notes: list[str] = field(default_factory=list)


# ─────────────────────────────────────────────────────────── parsing scene-data


def read_scenes(src: str) -> list[dict]:
    """Découpe SCENES[] en blocs de scène, chacun avec son id, son illustration
    et ses points d'intérêt."""
    start = src.index("export const SCENES")
    blk = src[start:]
    marks = [(m.start(), m.group(1)) for m in re.finditer(r'\n    id: "([^"]+)",\n', blk)]
    marks.append((len(blk), None))
    scenes = []
    for i in range(len(marks) - 1):
        a, sid = marks[i]
        body = blk[a : marks[i + 1][0]]
        illo = re.search(r'\n    illustration: "([^"]+)"', body)
        pois = []
        if "pointsInteret:" in body:
            ps = body.index("pointsInteret:")
            end = body.index("\n    choices:", ps) if "\n    choices:" in body[ps:] else len(body)
            for pm in re.finditer(r'\n      \{\n(.*?)(?=\n      \},|\n    \])', body[ps:end], re.S):
                pbody = pm.group(1)
                pid = re.search(r'id: "([^"]+)"', pbody)
                if not pid or "approche:" not in pbody:
                    continue  # c'est un choix, pas un point d'intérêt
                pillo = re.search(r'illustration: "([^"]+)"', pbody)
                pois.append({"id": pid.group(1), "illustration": pillo.group(1) if pillo else None})
        scenes.append(
            {"id": sid, "illustration": illo.group(1) if illo else None, "pois": pois}
        )
    return scenes


def pool_images(src: str) -> set[str]:
    """Images des pools de LIAISON (vues de marche) : ce sont des fallbacks de
    zone, jamais des images dédiées à une scène."""
    out: set[str] = set()
    for name in ("LANDES_GENERIC", "LANDES_WALK", "HAMEAU_WALK"):
        m = re.search(name + r"\s*[:=][^=]*?\[(.*?)\]", src, re.S)
        if m:
            out |= set(re.findall(r'"(assets/[^"]+)"', m.group(1)))
    return out


def categorie(image: str | None, sid: str) -> str:
    if image:
        base = image.split("/")[-1]
        if base.startswith("monstre_"):
            return "monstre"
        if base.startswith("objet_"):
            return "objet"
    return "scene"


def classify(image: str | None, owners: dict[str, str], sid: str, pools: set[str]) -> tuple[str, str]:
    """Retourne (statut, source de l'héritage)."""
    if not image or image == PORTAL:
        return MANQUANTE, ""
    if image in pools:
        return FALLBACK, "pool de marche"
    owner = owners.get(image)
    if owner and owner != sid:
        return HERITEE, owner
    return DEDIEE, ""


def build_items() -> tuple[list[Item], dict, list[str]]:
    src = SCENE_TS.read_text(encoding="utf-8")
    scenes = read_scenes(src)
    pools = pool_images(src)
    meta = json.loads(META_JSON.read_text(encoding="utf-8"))["scenes"] if META_JSON.exists() else {}

    # Propriétaire d'une image : la scène dont l'id colle au nom du fichier.
    # Les autres qui l'affichent en HÉRITENT (typiquement les beats « -2 »).
    owners: dict[str, str] = {}
    for sc in scenes:
        img = sc["illustration"]
        if not img or img == PORTAL or img in pools:
            continue
        stem = img.split("/")[-1].rsplit(".", 1)[0]
        key = sc["id"].replace("-", "_")
        if key in stem and (img not in owners or len(sc["id"]) > len(owners[img])):
            owners[img] = sc["id"]
    # Une image affichée par une seule scène lui appartient, même sans
    # correspondance de nom (ex. monstre_juge_de_cendre_c sur serment-hameau).
    seen: dict[str, list[str]] = {}
    for sc in scenes:
        img = sc["illustration"]
        if img and img != PORTAL and img not in pools:
            seen.setdefault(img, []).append(sc["id"])
    for img, sids in seen.items():
        if img not in owners and len(sids) == 1:
            owners[img] = sids[0]

    items: list[Item] = []
    for sc in scenes:
        sid, img = sc["id"], sc["illustration"]
        statut, parent = classify(img, owners, sid, pools)
        m = meta.get(sid, {})
        notes = []
        if img and img != PORTAL and not (ASSETS / img.split("/", 1)[1]).exists():
            notes.append("FICHIER ABSENT DU DISQUE")
        items.append(
            Item(
                id=sid,
                kind="scene",
                image=img,
                statut=statut,
                parent=parent,
                description=m.get("description", ""),
                prompt=m.get("prompt_image", ""),
                categorie=categorie(img, sid),
                notes=notes,
            )
        )
        for poi in sc["pois"]:
            pimg = poi["illustration"]
            pstatut = DEDIEE if pimg else FALLBACK
            pnotes = []
            if pimg and not (ASSETS / pimg.split("/", 1)[1]).exists():
                pnotes.append("FICHIER ABSENT DU DISQUE")
            items.append(
                Item(
                    id=poi["id"],
                    kind="poi",
                    image=pimg,
                    statut=pstatut,
                    parent=sid,
                    description="Plan rapproché — " + ("image dédiée" if pimg else "crop CSS de l'image du lieu"),
                    prompt="",
                    categorie=categorie(pimg, poi["id"]),
                    notes=pnotes,
                )
            )

    # Assets orphelins : présents sur disque, référencés NULLE PART.
    # ⚠️ « nulle part » se juge sur tout le code, pas seulement sur les champs
    # `illustration` de scène : une icône d'objet est référencée dans besace.ts,
    # et certaines vues de marche le sont directement dans `pickWalkImage`. Ne
    # regarder que les scènes produisait des orphelins fantômes.
    referenced = {i.image for i in items if i.image} | pools | {PORTAL}
    code_dirs = [SCENE_TS.parent, SCENE_TS.parent.parent / "components"]
    for d in code_dirs:
        for f in sorted(d.rglob("*.ts")) + sorted(d.rglob("*.tsx")):
            referenced |= set(re.findall(r'"(assets/[^"]+)"', f.read_text(encoding="utf-8")))
    for z in sorted(ZONES_DIR.glob("*.json")):
        referenced |= set(re.findall(r'"(assets/[^"]+)"', z.read_text(encoding="utf-8")))
    # Assets d'interface (logo, portrait du Geôlier, franges…) : jamais des
    # illustrations de scène, ils n'ont rien à faire dans les orphelins.
    UI = ("pactum_logo", "geolier_", "accueil_demon", "frange_", "croix_menu",
          "banner-edge", "bande_dissolution", "etat_", "dithering-demon")
    orphans = sorted(
        f"assets/{p.name}"
        for p in ASSETS.iterdir()
        if p.is_file()
        and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".svg")
        and f"assets/{p.name}" not in referenced
        and not any(p.name.startswith(u) for u in UI)
    )

    counts = {
        "statut": {k: sum(1 for i in items if i.statut == k) for k in STATUT_LABEL},
        "categorie": {},
        "prompts_manquants": sum(1 for i in items if i.kind == "scene" and not i.prompt),
        "total": len(items),
        "scenes": sum(1 for i in items if i.kind == "scene"),
        "pois": sum(1 for i in items if i.kind == "poi"),
    }
    for i in items:
        counts["categorie"][i.categorie] = counts["categorie"].get(i.categorie, 0) + 1
    return items, counts, orphans


# ────────────────────────────────────────────────────────────────────── rapport

CSS = """
:root{--charbon:#1c1a16;--orange:#e0632a;--blanc:#fff;--b50:rgba(255,255,255,.5);
--b20:rgba(255,255,255,.2)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--charbon);color:var(--blanc);
font:13px/1.5 "Roboto Mono",ui-monospace,monospace;padding:26px 24px 36vh}
/* Le panneau #log est fixe en bas à droite (fidèle à la maquette) ; la
   maquette n'a qu'une quinzaine de cartes (jamais de recouvrement), mais ce
   rapport en a des dizaines — sans cette marge basse, les dernières cartes
   passeraient sous le panneau et deviendraient impossibles à cliquer. */
h1{font:400 32px/1 "Instrument Serif",Georgia,serif;letter-spacing:3px}
.sub{font-size:11px;color:var(--b50);margin-top:6px;letter-spacing:1px}
canvas.rule{display:block;width:100%;height:2px;image-rendering:pixelated;margin:14px 0}

/* ---------- compteurs (chiffre Instrument Serif + libellé capitales) ---------- */
.stats{display:flex;flex-wrap:wrap;gap:26px;margin:16px 0 4px}
.stat .n{font:400 30px/1 "Instrument Serif",Georgia,serif}
.stat .l{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--b50);margin-top:4px}
.stat.ok .n{color:var(--orange)}
.stat.ko .n{color:var(--blanc)}
.stat.mid .n{color:var(--b50)}

/* ---------- filtres — une seule rangée, statut + catégorie mélangés ---------- */
.filters{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0 4px}
.filters button{background:none;border:1px solid var(--b20);color:var(--b50);
font-family:inherit;font-size:10px;letter-spacing:1px;text-transform:uppercase;
padding:7px 12px;cursor:pointer}
.filters button.on{background:var(--orange);border-color:var(--orange);color:var(--charbon)}

/* ---------- grille ---------- */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-top:20px}
.card{border:1px solid var(--b20);padding:10px}
.card.drag{border-color:var(--orange)}
.card.hidden{display:none!important}
.thumb{position:relative;width:100%;aspect-ratio:1/1;background:#000 center/cover no-repeat;
overflow:hidden;image-rendering:pixelated}
.thumb.none{display:flex;align-items:center;justify-content:center;
font-size:10px;letter-spacing:2px;color:var(--b20);text-transform:uppercase}
.tag{position:absolute;top:6px;left:6px;font-size:9px;letter-spacing:1.5px;
text-transform:uppercase;padding:3px 6px}
.tag.dediee{background:var(--orange);color:var(--charbon)}
.tag.heritee{background:none;color:var(--orange);box-shadow:inset 0 0 0 1px var(--orange)}
.tag.fallback{background:none;color:var(--b50);box-shadow:inset 0 0 0 1px var(--b20)}
.tag.manquante{background:var(--blanc);color:var(--charbon)}

.cat{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--b50);margin-top:9px}
.id{font-size:12px;margin-top:2px;word-break:break-all}
.id .poi{color:var(--b50)}
.meta{font-size:10px;color:var(--b50);margin-top:3px;min-height:2.4em}
.desc{font-size:10.5px;color:var(--b50);line-height:1.45;margin-top:2px}
.warn{font-size:10px;color:var(--blanc);letter-spacing:.5px;margin-top:4px}
.act{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.act button{background:none;border:1px solid var(--b20);color:var(--b50);
font:inherit;font-size:10.5px;padding:4px 8px;cursor:pointer}
.act button:hover{border-color:var(--orange);color:var(--orange)}
.act .todo{border-style:dashed;cursor:default;color:var(--b20)}

select{width:100%;margin-top:8px;background:var(--charbon);color:var(--blanc);
border:1px solid var(--b20);font-family:inherit;font-size:11px;padding:6px}
.drop{margin-top:6px;border:1px dashed var(--b20);color:var(--b50);
font-size:10px;letter-spacing:1px;text-align:center;padding:8px;cursor:pointer}
.drop.on{border-color:var(--orange);color:var(--orange)}
.detach{background:none;border:none;color:var(--b50);font-family:inherit;font-size:10px;
text-decoration:underline;text-underline-offset:3px;cursor:pointer;margin-top:7px;padding:0}
.detach:hover{color:var(--orange)}

/* ---------- orphelins ---------- */
h2{font:400 20px/1.2 "Instrument Serif",Georgia,serif;letter-spacing:2px;margin-top:34px}
.orph{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.orph div{border:1px solid var(--b20);padding:6px 10px;font-size:11px;color:var(--b50)}

/* ---------- instructions de pipeline ---------- */
.log-static{margin-top:12px;font-size:11.5px;color:var(--b50)}
.log-static ol{padding-left:20px}
.log-static code{color:var(--orange)}

#toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);
background:var(--orange);color:var(--charbon);padding:9px 16px;font-size:12px;
letter-spacing:.5px;opacity:0;transition:opacity .2s;pointer-events:none}
#toast.on{opacity:1}

/* ---------- journal d'écriture — panneau fixe, jamais une popup ---------- */
#log{position:fixed;right:0;bottom:0;width:340px;max-height:34vh;overflow-y:auto;
background:var(--charbon);border-top:1px solid var(--b20);border-left:1px solid var(--b20);
padding:10px 12px;font-size:10px;color:var(--b50)}
#log b{color:var(--orange);font-weight:400}
#log .hd{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--b50);margin-bottom:6px}
"""

JS = """
"use strict";

/* ---------- séparateur tramé (jamais un filet net — règle DA) ---------- */
function rule(cv){
  const w=cv.clientWidth; cv.width=w; cv.height=2;
  const x=cv.getContext("2d");
  for(let i=0;i<w;i++){
    if(Math.random()<.7){x.fillStyle="rgba(255,255,255,.26)";x.fillRect(i,0,1,1);}
    if(Math.random()<.13){x.fillStyle="rgba(255,255,255,.14)";x.fillRect(i,1,1,1);}
  }
}
addEventListener("load",()=>document.querySelectorAll("canvas.rule").forEach(rule));

/* ---------- filtres — une rangée unique, statut + catégorie ---------- */
let filter="tous";
function applyFilter(){
  document.querySelectorAll(".card").forEach(c=>{
    const ok=filter==="tous"||c.dataset.statut===filter||c.dataset.cat===filter;
    c.classList.toggle("hidden",!ok);
  });
}
document.getElementById("filters").onclick=e=>{
  const b=e.target.closest("button"); if(!b)return;
  document.querySelectorAll("#filters button").forEach(x=>x.classList.remove("on"));
  b.classList.add("on"); filter=b.dataset.f; applyFilter();
};

function toast(m){const t=document.getElementById('toast');t.textContent=m;
  t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800);}
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=async()=>{
  try{await navigator.clipboard.writeText(b.dataset.prompt);toast('Prompt copié');}
  catch{const t=document.createElement('textarea');t.value=b.dataset.prompt;
    document.body.append(t);t.select();document.execCommand('copy');t.remove();
    toast('Prompt copié');}});

/* ---------- journal d'écriture — persistant (localStorage), jamais une popup.
   Une action écrit sur le disque puis recharge la page (les statuts d'AUTRES
   cartes peuvent changer — une image détachée peut redonner une carte à
   "manquante" ailleurs — donc seul un recalcul serveur complet est fiable).
   Le journal survit au reload en passant par localStorage. */
const LOG_KEY="pactum-coverage-log";
function loadLog(){try{return JSON.parse(localStorage.getItem(LOG_KEY)||"[]");}catch{return [];}}
function renderLog(){
  const body=document.getElementById("logbody");
  const entries=loadLog();
  body.innerHTML=entries.length
    ? entries.map(e=>`<div>${e.t} — ${e.msg}</div>`).join("")
    : "En attente d'une action…";
}
function log(msg){
  const entries=loadLog();
  entries.unshift({t:new Date().toLocaleTimeString("fr-FR"),msg});
  localStorage.setItem(LOG_KEY,JSON.stringify(entries.slice(0,60)));
  renderLog();
}
renderLog();

/* ——— Édition inline (mode --serve seulement) ————————————————————————
   Trois voies directement sur la carte, comme la maquette : un <select> pour
   rattacher un asset déjà tramé, une zone de glisser-déposer pour importer un
   fichier brut (passe par le dithering canonique avant assets/), et un lien
   « détacher » (dédiées uniquement) qui retire l'image dédiée. */
if(window.__COVERAGE_EDITABLE__){
  async function post(url,body){
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body)});
    const j=await r.json();
    if(!j.ok)throw new Error(j.error||"échec");
    return j;
  }
  async function afterWrite(msg){
    log(msg);
    await new Promise(res=>setTimeout(res,400));
    location.reload();
  }

  fetch("/api/assets").then(r=>r.json()).then(assets=>{
    document.querySelectorAll("[data-select]").forEach(sel=>{
      const cur=sel.dataset.current||"";
      let opts='<option value="">— aucune (hérite / fallback) —</option>';
      for(const a of assets) opts+=`<option${a===cur?" selected":""}>${a}</option>`;
      sel.innerHTML=opts;
    });
  });

  document.querySelectorAll("[data-select]").forEach(sel=>{
    sel.addEventListener("change",async()=>{
      const id=sel.dataset.select, poi=sel.dataset.poi==="1", asset=sel.value;
      try{
        const j=await post("/api/wire",{id,asset,poi});
        await afterWrite(`<b>${poi?"point d'intérêt":"scène"}</b> · ${id} → `+
          (asset?asset:"détaché")+` (écrit : ${j.touched.join(", ")})`);
      }catch(e){log(`<span style="color:#fff">ÉCHEC</span> · ${id} · ${e.message}`);}
    });
  });

  document.querySelectorAll("[data-drop]").forEach(dz=>{
    const card=dz.closest(".card");
    dz.ondragover=e=>{e.preventDefault();dz.classList.add("on");card.classList.add("drag");};
    dz.ondragleave=()=>{dz.classList.remove("on");card.classList.remove("drag");};
    dz.ondrop=async e=>{
      e.preventDefault();dz.classList.remove("on");card.classList.remove("drag");
      const f=e.dataTransfer.files[0]; if(!f)return;
      const id=dz.dataset.drop, poi=dz.dataset.poi==="1";
      const name=prompt("Nom du fichier dans assets/ :",dz.dataset.defaultName);
      if(!name)return;
      const data=await new Promise(res=>{const fr=new FileReader();
        fr.onload=()=>res(fr.result);fr.readAsDataURL(f);});
      try{
        const j=await post("/api/import",{id,poi,name,data});
        await afterWrite(`<b>dithering</b> → <b>${j.asset}</b> · ${id} `+
          `(Floyd-Steinberg 182 / 151%, écrit : ${j.touched.join(", ")})`);
      }catch(e){log(`<span style="color:#fff">ÉCHEC import</span> · ${id} · ${e.message}`);}
    };
  });

  document.querySelectorAll("[data-detach]").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const id=btn.dataset.detach, poi=btn.dataset.poi==="1";
      try{
        const j=await post("/api/wire",{id,asset:"",poi});
        await afterWrite(`<b>détaché</b> · ${id} (écrit : ${j.touched.join(", ")})`);
      }catch(e){log(`<span style="color:#fff">ÉCHEC</span> · ${id} · ${e.message}`);}
    });
  });
}
"""


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    )


# Étiquettes de catégorie pour le filtre (accord/majuscule) — la maquette de
# référence catégorise par rôle narratif (lieu/rencontre/creature/liaison),
# mais ce rôle n'existe pas proprement dans les données parsées : une liaison
# n'est jamais une entrée statique de SCENES[], elle est générée à l'exécution
# par `makeLiaison()` — il n'y a donc rien à lister sous ce nom. On garde la
# catégorisation par TYPE D'IMAGE (scene/monstre/objet) déjà en place : c'est
# elle qui pilote la recette de prompt Leonardo (portrait vs paysage) dans
# data/scene-meta.json, donc ce qui compte réellement pour le pipeline.
CAT_LABEL = {"scene": "Scènes", "monstre": "Monstres", "objet": "Objets"}


def render(items: list[Item], counts: dict, orphans: list[str], editable: bool) -> str:
    rel = "../aldenhar/public/"  # data/couverture_visuelle.html → assets

    def card(i: Item) -> str:
        basename = i.image.split("/", 1)[1] if i.image else ""
        if i.image:
            thumb_open = f'<div class="thumb" style="background-image:url(\'{rel}{i.image}\')">'
            thumb_inner = ""
        else:
            thumb_open = '<div class="thumb none">'
            thumb_inner = "AUCUNE IMAGE"
        tag = f'<span class="tag {i.statut}">{STATUT_LABEL[i.statut]}</span>'

        parent_html = f' <span class="poi">← {esc(i.parent)}</span>' if i.kind == "poi" else ""
        if i.statut == HERITEE:
            meta = f'hérite de <b>{esc(i.parent)}</b>'
        elif i.statut == FALLBACK:
            meta = "ambiance générique de zone"
        elif i.statut == MANQUANTE:
            meta = "aucune image ni héritage"
        else:
            meta = esc(basename)

        desc = f'<div class="desc">{esc(i.description)}</div>' if i.description else ""
        warn = "".join(f'<div class="warn">⚠ {esc(n)}</div>' for n in i.notes)

        acts = []
        if i.kind == "scene":
            if i.prompt:
                acts.append(f'<button data-prompt="{esc(i.prompt)}">Copier le prompt Leonardo</button>')
            else:
                acts.append('<button class="todo" disabled>prompt à écrire</button>')
        act_html = f'<div class="act">{"".join(acts)}</div>' if acts else ""

        edit_html = ""
        if editable:
            poi_flag = "1" if i.kind == "poi" else "0"
            default_name = basename or f"{i.categorie}_{i.id.replace('-', '_')}.png"
            detach_html = (
                f'<button class="detach" data-detach="{esc(i.id)}" data-poi="{poi_flag}">détacher</button>'
                if i.statut == DEDIEE
                else ""
            )
            edit_html = (
                f'<select data-select="{esc(i.id)}" data-poi="{poi_flag}" '
                f'data-current="{esc(i.image or "")}"></select>'
                f'<div class="drop" data-drop="{esc(i.id)}" data-poi="{poi_flag}" '
                f'data-default-name="{esc(default_name)}">glisser une image ici</div>'
                f"{detach_html}"
            )

        return f"""<article class="card" data-statut="{i.statut}" data-cat="{i.categorie}" data-kind="{i.kind}">
  {thumb_open}{thumb_inner}{tag}</div>
  <div class="cat">{i.categorie}</div>
  <div class="id">{esc(i.id)}{parent_html}</div>
  <div class="meta">{meta}</div>
  {desc}
  {warn}
  {act_html}
  {edit_html}
</article>"""

    stats = f"""
<div class="stat ok"><div class="n">{counts["statut"][DEDIEE]}</div><div class="l">dédiées</div></div>
<div class="stat"><div class="n" style="color:var(--orange)">{counts["statut"][HERITEE]}</div><div class="l">héritées</div></div>
<div class="stat mid"><div class="n">{counts["statut"][FALLBACK]}</div><div class="l">fallback</div></div>
<div class="stat ko"><div class="n">{counts["statut"][MANQUANTE]}</div><div class="l">manquantes</div></div>
<div class="stat mid"><div class="n">{len(orphans)}</div><div class="l">orphelins</div></div>
<div class="stat mid"><div class="n">{counts["prompts_manquants"]}</div><div class="l">prompts à écrire</div></div>
"""

    cats = sorted(counts["categorie"])
    filter_defs = [("tous", "Tous"), (DEDIEE, "Dédiées"), (HERITEE, "Héritées"),
                   (FALLBACK, "Fallback"), (MANQUANTE, "Manquantes")]
    filter_defs += [(c, CAT_LABEL.get(c, c.capitalize())) for c in cats]
    filters_html = "".join(
        f'<button class="{"on" if f == "tous" else ""}" data-f="{f}">{label}</button>'
        for f, label in filter_defs
    )

    orph = (
        "".join(f"<div>{esc(o)}</div>" for o in orphans)
        if orphans
        else '<div>Aucun. Tout fichier de assets/ est référencé.</div>'
    )

    mode = (
        "édition active — le serveur écrit sur le disque"
        if editable
        else "lecture seule — relancer avec --serve pour éditer (file:// ne peut pas écrire sur le disque)"
    )

    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PACTUM — Couverture visuelle</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<h1>COUVERTURE VISUELLE</h1>
<div class="sub">{counts["scenes"]} scènes · {counts["pois"]} points d'intérêt · lib/scene-data.ts × assets/ · {mode}</div>
<canvas class="rule"></canvas>

<div class="stats">{stats}</div>

<div class="filters" id="filters">{filters_html}</div>

<div class="grid">{"".join(card(i) for i in items)}</div>

<h2>Assets orphelins</h2>
<div class="sub">Présents dans assets/, référencés par aucune scène — à rattacher ou à supprimer.</div>
<div class="orph">{orph}</div>

<h2>Ordre d'écriture obligatoire</h2>
<div class="log-static"><ol>
  <li><code>dither_batch.py</code> — l'image brute passe par le dithering canonique
      (Floyd-Steinberg, seuil 182, contraste 151 %, Charbon/Orange). Jamais d'image
      brute en jeu.</li>
  <li><code>aldenhar/public/assets/</code> — le PNG tramé y est déposé sous son nom
      <code>{{categorie}}_{{sujet}}.png</code>.</li>
  <li><code>lib/scene-data.ts</code> puis <code>data/zones/*.json</code> — le champ
      <code>illustration</code> est mis à jour. Le .ts fait foi pour le jeu ; le JSON
      suit pour la production.</li>
</ol></div>

<div id="log"><div class="hd">Journal d'écriture</div><div id="logbody">En attente d'une action…</div></div>
<div id="toast"></div>
<script>window.__COVERAGE_EDITABLE__={str(editable).lower()};</script>
<script>{JS}</script>
</body></html>
"""


# ─────────────────────────────────────────────────────────── serveur d'édition


def wire_image(scene_id: str, asset: str | None, is_poi: bool) -> list[str]:
    """Écrit `illustration: "assets/…"` sur une scène ou un point d'intérêt,
    dans scene-data.ts ET dans les JSON de zone qui le mentionnent.

    Détachement (bouton « détacher » de la maquette) : `asset` vide/None. Le
    champ `illustration?: string` du .ts n'accepte pas `null` — la ligne est
    donc RETIRÉE entièrement (la scène retombe sur l'héritage/fallback existant
    du jeu). Le JSON de zone, lui, garde la convention déjà en place dans
    `landes.json` (beaucoup d'entrées y valent explicitement `null` en attente
    d'écriture) : on y écrit `null` plutôt que de supprimer la clé."""
    touched = []
    src = SCENE_TS.read_text(encoding="utf-8")
    indent = "      " if is_poi else "    "
    pat = re.compile(r'(\n' + indent + r'id: "' + re.escape(scene_id) + r'",\n)'
                     r'(' + indent + r'illustration: "[^"]+",\n)?')
    m = pat.search(src)
    if not m:
        raise KeyError(f"id introuvable dans scene-data.ts : {scene_id}")
    repl = m.group(1) + (f'{indent}illustration: "{asset}",\n' if asset else "")
    src = src[: m.start()] + repl + src[m.end() :]
    SCENE_TS.write_text(src, encoding="utf-8")
    touched.append(str(SCENE_TS.relative_to(ROOT)))

    for z in sorted(ZONES_DIR.glob("*.json")):
        data = json.loads(z.read_text(encoding="utf-8"))
        changed = False

        def walk(node):
            nonlocal changed
            if isinstance(node, dict):
                if node.get("id") == scene_id and "illustration" in node:
                    node["illustration"] = asset or None
                    changed = True
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)

        walk(data)
        if changed:
            z.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            touched.append(str(z.relative_to(ROOT)))
    return touched


def dither_into_assets(raw: bytes, target_name: str) -> str:
    """Passe une image brute par le dithering canonique puis la dépose dans
    assets/. JAMAIS d'image brute en jeu (§ pipeline verrouillé)."""
    if not target_name.endswith(".png"):
        target_name += ".png"
    with tempfile.TemporaryDirectory() as tmp:
        tmpd = Path(tmp)
        src = tmpd / target_name
        src.write_bytes(raw)
        outdir = tmpd / "out"
        outdir.mkdir()
        cmd = [
            sys.executable,
            str(ROOT / "tools" / "dither_batch.py"),
            str(src),
            "--dest",
            str(outdir),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        produced = list(outdir.rglob("*.png"))
        if not produced:
            raise RuntimeError(
                "dither_batch.py n'a rien produit.\n"
                + (res.stdout or "")
                + (res.stderr or "")
            )
        dest = ASSETS / target_name
        shutil.copy2(produced[0], dest)
        return f"assets/{dest.name}"


def serve(port: int = 8765) -> None:
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    import base64

    class Handler(BaseHTTPRequestHandler):
        def _send(self, code, body, ctype="application/json; charset=utf-8"):
            data = body if isinstance(body, bytes) else body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, *a):  # silence
            pass

        def do_GET(self):
            path = self.path.split("?")[0]
            if path in ("/", "/index.html"):
                items, counts, orphans = build_items()
                html = render(items, counts, orphans, editable=True)
                # servi depuis la racine : les assets sont sous /assets/…
                html = html.replace("../aldenhar/public/assets/", "assets/")
                return self._send(200, html, "text/html; charset=utf-8")
            if path.startswith("/assets/"):
                f = ASSETS / path[len("/assets/") :]
                if f.is_file():
                    ext = f.suffix.lower()
                    ctype = {
                        ".png": "image/png",
                        ".jpg": "image/jpeg",
                        ".jpeg": "image/jpeg",
                        ".svg": "image/svg+xml",
                    }.get(ext, "application/octet-stream")
                    return self._send(200, f.read_bytes(), ctype)
            if path == "/api/assets":
                names = sorted(
                    f"assets/{p.name}"
                    for p in ASSETS.iterdir()
                    if p.is_file() and p.suffix.lower() in (".png", ".jpg", ".jpeg")
                )
                return self._send(200, json.dumps(names))
            self._send(404, json.dumps({"error": "not found"}))

        def do_POST(self):
            n = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(n) or b"{}")
            try:
                if self.path == "/api/wire":
                    touched = wire_image(
                        payload["id"], payload["asset"], bool(payload.get("poi"))
                    )
                    return self._send(200, json.dumps({"ok": True, "touched": touched}))
                if self.path == "/api/import":
                    raw = base64.b64decode(payload["data"].split(",")[-1])
                    asset = dither_into_assets(raw, payload["name"])
                    touched = wire_image(
                        payload["id"], asset, bool(payload.get("poi"))
                    )
                    return self._send(
                        200, json.dumps({"ok": True, "asset": asset, "touched": touched})
                    )
            except Exception as exc:  # renvoyé tel quel à la page
                return self._send(500, json.dumps({"ok": False, "error": str(exc)}))
            self._send(404, json.dumps({"error": "not found"}))

    print(f"Couverture visuelle — édition active : http://localhost:{port}/")
    print("Ordre d'écriture : dithering → assets/ → scene-data.ts + zones/*.json")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


def main() -> None:
    items, counts, orphans = build_items()
    if "--serve" in sys.argv:
        OUT_HTML.write_text(render(items, counts, orphans, editable=False), encoding="utf-8")
        port = 8765
        if "--port" in sys.argv:
            port = int(sys.argv[sys.argv.index("--port") + 1])
        serve(port)
        return
    OUT_HTML.write_text(render(items, counts, orphans, editable=False), encoding="utf-8")
    st = counts["statut"]
    print(f"{OUT_HTML.relative_to(ROOT)} écrit")
    print(
        f"  {counts['scenes']} scènes · {counts['pois']} points d'intérêt\n"
        f"  dédiée {st[DEDIEE]} · héritée {st[HERITEE]} · fallback {st[FALLBACK]} "
        f"· manquante {st[MANQUANTE]}\n"
        f"  {counts['prompts_manquants']} prompts à écrire · {len(orphans)} assets orphelins"
    )
    for i in items:
        for n in i.notes:
            print(f"  ⚠ {i.id} : {n}")


if __name__ == "__main__":
    main()
