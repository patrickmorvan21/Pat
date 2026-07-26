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
*{box-sizing:border-box}
body{margin:0;background:var(--charbon);color:var(--blanc);
font:14px/1.5 "Roboto Mono",ui-monospace,monospace}
header{padding:22px 24px 14px;border-bottom:1px solid var(--b20)}
h1{margin:0 0 4px;font:400 26px/1.2 "Instrument Serif",Georgia,serif;letter-spacing:.5px}
.sub{color:var(--b50);font-size:12px}
.counts{display:flex;flex-wrap:wrap;gap:8px;padding:14px 24px}
.pill{border:1px solid var(--b20);padding:5px 11px;font-size:12px;letter-spacing:.6px}
.pill b{font-weight:700}
.pill.dediee{border-color:var(--orange);color:var(--orange)}
.pill.heritee{border-color:var(--b50)}
.pill.fallback{border-color:var(--b20);color:var(--b50)}
.pill.manquante{border-color:var(--blanc);color:var(--blanc);background:rgba(255,255,255,.08)}
.filters{display:flex;flex-wrap:wrap;gap:6px;padding:0 24px 16px;align-items:center}
.filters span{color:var(--b50);font-size:11px;letter-spacing:1px;margin-right:4px}
button.f{background:none;border:1px solid var(--b20);color:var(--b50);
padding:5px 10px;font:inherit;font-size:12px;cursor:pointer}
button.f[aria-pressed=true]{border-color:var(--orange);color:var(--orange)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));
gap:14px;padding:0 24px 40px}
.card{border:1px solid var(--b20);display:flex;flex-direction:column}
.card.manquante{border-color:var(--blanc)}
.card.dediee{border-color:var(--orange)}
.thumb{aspect-ratio:1;background:#000 center/cover no-repeat;position:relative;
image-rendering:pixelated}
.thumb.none{display:flex;align-items:center;justify-content:center;color:var(--b20);
font-size:11px;letter-spacing:1px}
.tag{position:absolute;top:0;left:0;font-size:10px;letter-spacing:1px;
padding:3px 7px;background:var(--charbon);border-right:1px solid var(--b20);
border-bottom:1px solid var(--b20)}
.body{padding:10px 11px;display:flex;flex-direction:column;gap:6px;flex:1}
.sid{font-size:13px;color:var(--blanc);word-break:break-all}
.sid .poi{color:var(--b50)}
.desc{font-size:11.5px;color:var(--b50);line-height:1.45}
.file{font-size:10.5px;color:var(--b20);word-break:break-all;margin-top:auto}
.warn{font-size:10.5px;color:var(--blanc);letter-spacing:.5px}
.act{display:flex;gap:6px;flex-wrap:wrap}
.act button{background:none;border:1px solid var(--b20);color:var(--b50);
font:inherit;font-size:11px;padding:4px 8px;cursor:pointer}
.act button:hover{border-color:var(--orange);color:var(--orange)}
.act .todo{border-style:dashed;cursor:default;color:var(--b20)}
.orphans{padding:0 24px 48px}
.orphans h2{font:400 19px/1.2 "Instrument Serif",Georgia,serif;
border-top:1px solid var(--b20);padding-top:18px;margin:0 0 8px}
.orphans ul{columns:3;column-gap:20px;padding-left:18px;margin:0;
font-size:11.5px;color:var(--b50)}
.log{padding:0 24px 40px;font-size:11.5px;color:var(--b50)}
.log h2{font:400 19px/1.2 "Instrument Serif",Georgia,serif;
border-top:1px solid var(--b20);padding-top:18px;margin:0 0 8px;color:var(--blanc)}
.log ol{padding-left:20px;margin:0}
.log code{color:var(--orange)}
.hidden{display:none!important}
#toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);
background:var(--orange);color:var(--charbon);padding:9px 16px;font-size:12px;
letter-spacing:.5px;opacity:0;transition:opacity .2s;pointer-events:none}
#toast.on{opacity:1}
dialog{background:var(--charbon);color:var(--blanc);border:1px solid var(--orange);
padding:0;max-width:560px;width:92vw;font:inherit}
dialog::backdrop{background:rgba(0,0,0,.72)}
dialog h3{margin:0;padding:14px 18px;border-bottom:1px solid var(--b20);
font:400 20px/1.2 "Instrument Serif",Georgia,serif}
dialog .in{padding:16px 18px;display:flex;flex-direction:column;gap:14px}
dialog fieldset{border:1px solid var(--b20);padding:12px 14px;margin:0}
dialog legend{font-size:11px;letter-spacing:1px;color:var(--orange);padding:0 6px}
dialog select,dialog input[type=text]{width:100%;background:#000;color:var(--blanc);
border:1px solid var(--b20);font:inherit;font-size:12px;padding:6px 8px}
dialog .row{display:flex;gap:8px;align-items:center;margin-top:9px}
dialog button{background:none;border:1px solid var(--b20);color:var(--b50);
font:inherit;font-size:12px;padding:6px 12px;cursor:pointer}
dialog button:hover{border-color:var(--orange);color:var(--orange)}
dialog .hint{font-size:11px;color:var(--b50);line-height:1.45}
#ed-journal{list-style:decimal;padding-left:20px;margin:0;font-size:11.5px;
color:var(--b50)}
#ed-journal:empty{display:none}
dialog footer{padding:12px 18px;border-top:1px solid var(--b20);text-align:right}
"""

JS = """
const cards=[...document.querySelectorAll('.card')];
let fS='all',fC='all';
function apply(){cards.forEach(c=>{
  const ok=(fS==='all'||c.dataset.statut===fS)&&(fC==='all'||c.dataset.cat===fC);
  c.classList.toggle('hidden',!ok);});}
document.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{
  fS=b.dataset.fs;document.querySelectorAll('[data-fs]').forEach(x=>
    x.setAttribute('aria-pressed',x===b));apply();});
document.querySelectorAll('[data-fc]').forEach(b=>b.onclick=()=>{
  fC=b.dataset.fc;document.querySelectorAll('[data-fc]').forEach(x=>
    x.setAttribute('aria-pressed',x===b));apply();});
function toast(m){const t=document.getElementById('toast');t.textContent=m;
  t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800);}
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=async()=>{
  try{await navigator.clipboard.writeText(b.dataset.prompt);toast('Prompt copié');}
  catch{const t=document.createElement('textarea');t.value=b.dataset.prompt;
    document.body.append(t);t.select();document.execCommand('copy');t.remove();
    toast('Prompt copié');}});

/* ——— Édition (mode --serve seulement) ———————————————————————————————
   Deux voies : rattacher un asset DÉJÀ tramé, ou importer un fichier brut qui
   passera par le dithering canonique avant d'atterrir dans assets/. Le serveur
   refuse toute écriture qui court-circuiterait cet ordre. */
const dlg=document.getElementById('editor');
let target=null;
async function assetList(){
  const r=await fetch('/api/assets');return r.json();}
document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=async()=>{
  const card=b.closest('.card');
  target={id:b.dataset.edit,poi:card.dataset.kind==='poi'};
  document.getElementById('ed-id').textContent=target.id+(target.poi?' (point d\\'intérêt)':'');
  const sel=document.getElementById('ed-existing');
  sel.innerHTML='';
  (await assetList()).forEach(a=>{const o=document.createElement('option');
    o.value=a;o.textContent=a.replace('assets/','');sel.append(o);});
  document.getElementById('ed-journal').innerHTML='';
  dlg.showModal();});
document.getElementById('ed-cancel').onclick=()=>dlg.close();
function journal(steps){
  document.getElementById('ed-journal').innerHTML=steps.map(s=>'<li>'+s+'</li>').join('');}
async function post(url,body){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)});
  const j=await r.json();
  if(!j.ok)throw new Error(j.error||'échec');
  return j;}
document.getElementById('ed-wire').onclick=async()=>{
  const asset=document.getElementById('ed-existing').value;
  try{const j=await post('/api/wire',{id:target.id,asset,poi:target.poi});
    journal(['asset déjà tramé — dithering non requis',
      'assets/ : fichier déjà en place',
      'écrit : '+j.touched.join(', ')]);
    toast('Image rattachée — recharge pour voir');}
  catch(e){journal(['<span style="color:#fff">ÉCHEC : '+e.message+'</span>']);}};
document.getElementById('ed-file').onchange=async(ev)=>{
  const f=ev.target.files[0];if(!f)return;
  const name=document.getElementById('ed-name').value.trim()||f.name;
  journal(['lecture du fichier…']);
  const data=await new Promise(res=>{const fr=new FileReader();
    fr.onload=()=>res(fr.result);fr.readAsDataURL(f);});
  try{const j=await post('/api/import',{id:target.id,poi:target.poi,name,data});
    journal(['dithering canonique appliqué (Floyd-Steinberg, seuil 182, 151 %)',
      'déposé : '+j.asset,
      'écrit : '+j.touched.join(', ')]);
    toast('Importé — recharge pour voir');}
  catch(e){journal(['<span style="color:#fff">ÉCHEC : '+e.message+'</span>']);}};
"""


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    )


def render(items: list[Item], counts: dict, orphans: list[str], editable: bool) -> str:
    rel = "../aldenhar/public/"  # data/couverture_visuelle.html → assets

    def card(i: Item) -> str:
        thumb = (
            f'<div class="thumb" style="background-image:url(\'{rel}{i.image}\')">'
            if i.image
            else '<div class="thumb none">AUCUNE IMAGE'
        )
        acts = []
        if i.kind == "scene":
            if i.prompt:
                acts.append(
                    f'<button data-prompt="{esc(i.prompt)}">Copier le prompt Leonardo</button>'
                )
            else:
                acts.append('<button class="todo" disabled>prompt à écrire</button>')
        if editable:
            acts.append(f'<button data-edit="{esc(i.id)}">Remplacer l\'image</button>')
        warn = "".join(f'<div class="warn">⚠ {esc(n)}</div>' for n in i.notes)
        parent = (
            f' <span class="poi">← {esc(i.parent)}</span>'
            if i.kind == "poi"
            else (f' <span class="poi">hérite de {esc(i.parent)}</span>' if i.parent else "")
        )
        return f"""<article class="card {i.statut}" data-statut="{i.statut}" data-cat="{i.categorie}" data-kind="{i.kind}">
  {thumb}<span class="tag">{STATUT_LABEL[i.statut].upper()}</span></div>
  <div class="body">
    <div class="sid">{esc(i.id)}{parent}</div>
    <div class="desc">{esc(i.description)}</div>
    {warn}
    <div class="file">{esc(i.image or "—")}</div>
    <div class="act">{"".join(acts)}</div>
  </div>
</article>"""

    pills = "".join(
        f'<div class="pill {k}"><b>{counts["statut"][k]}</b> {STATUT_LABEL[k]}</div>'
        for k in (DEDIEE, HERITEE, FALLBACK, MANQUANTE)
    )
    pills += f'<div class="pill"><b>{counts["prompts_manquants"]}</b> prompts à écrire</div>'
    pills += f'<div class="pill"><b>{len(orphans)}</b> assets orphelins</div>'

    fs = '<span>STATUT</span><button class="f" data-fs="all" aria-pressed="true">tous</button>' + "".join(
        f'<button class="f" data-fs="{k}">{STATUT_LABEL[k]}</button>'
        for k in (DEDIEE, HERITEE, FALLBACK, MANQUANTE)
    )
    cats = sorted(counts["categorie"])
    fc = '<span>CATÉGORIE</span><button class="f" data-fc="all" aria-pressed="true">toutes</button>' + "".join(
        f'<button class="f" data-fc="{c}">{c}</button>' for c in cats
    )

    orph = (
        "<ul>" + "".join(f"<li>{esc(o)}</li>" for o in orphans) + "</ul>"
        if orphans
        else '<p class="desc">Aucun. Tout fichier de assets/ est référencé.</p>'
    )

    mode = (
        "Édition active — le serveur écrit sur le disque."
        if editable
        else "Lecture seule. Relancer avec <code>--serve</code> pour éditer "
        "(une page ouverte en file:// ne peut pas écrire sur le disque)."
    )

    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PACTUM — Couverture visuelle</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<header>
  <h1>Couverture visuelle — PACTUM</h1>
  <div class="sub">{counts["scenes"]} scènes · {counts["pois"]} points d'intérêt ·
  rapport généré par <code>tools/coverage.py</code> · {mode}</div>
</header>
<div class="counts">{pills}</div>
<div class="filters">{fs}</div>
<div class="filters">{fc}</div>
<div class="grid">{"".join(card(i) for i in items)}</div>
<section class="orphans"><h2>Assets orphelins</h2>{orph}</section>
<section class="log"><h2>Ordre d'écriture obligatoire</h2>
<ol>
  <li><code>dither_batch.py</code> — l'image brute passe par le dithering canonique
      (Floyd-Steinberg, seuil 182, contraste 151 %, Charbon/Orange). Jamais d'image
      brute en jeu.</li>
  <li><code>aldenhar/public/assets/</code> — le PNG tramé y est déposé sous son nom
      <code>{{categorie}}_{{sujet}}.png</code>.</li>
  <li><code>lib/scene-data.ts</code> puis <code>data/zones/*.json</code> — le champ
      <code>illustration</code> est mis à jour. Le .ts fait foi pour le jeu ; le JSON
      suit pour la production.</li>
</ol></section>
<dialog id="editor">
  <h3>Remplacer l'image — <span id="ed-id"></span></h3>
  <div class="in">
    <fieldset><legend>Asset déjà tramé</legend>
      <select id="ed-existing" size="1"></select>
      <div class="row"><button id="ed-wire">Rattacher cet asset</button>
        <span class="hint">Le fichier est déjà dans <code>assets/</code> : seuls les
        champs <code>illustration</code> sont réécrits.</span></div>
    </fieldset>
    <fieldset><legend>Importer un fichier brut</legend>
      <input type="text" id="ed-name" placeholder="nom cible, ex. scene_tour_de_guet_a.png">
      <div class="row"><input type="file" id="ed-file" accept="image/*">
      </div>
      <div class="hint">L'image passe par <code>dither_batch.py</code> (dithering
      canonique) AVANT d'atterrir dans <code>assets/</code>. Jamais d'image brute
      en jeu.</div>
    </fieldset>
    <ol id="ed-journal"></ol>
  </div>
  <footer><button id="ed-cancel">Fermer</button></footer>
</dialog>
<div id="toast"></div>
<script>{JS}</script>
</body></html>
"""


# ─────────────────────────────────────────────────────────── serveur d'édition


def wire_image(scene_id: str, asset: str, is_poi: bool) -> list[str]:
    """Écrit `illustration: "assets/…"` sur une scène ou un point d'intérêt,
    dans scene-data.ts ET dans les JSON de zone qui le mentionnent."""
    touched = []
    src = SCENE_TS.read_text(encoding="utf-8")
    indent = "      " if is_poi else "    "
    pat = re.compile(r'(\n' + indent + r'id: "' + re.escape(scene_id) + r'",\n)'
                     r'(' + indent + r'illustration: "[^"]+",\n)?')
    m = pat.search(src)
    if not m:
        raise KeyError(f"id introuvable dans scene-data.ts : {scene_id}")
    repl = m.group(1) + f'{indent}illustration: "{asset}",\n'
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
                    node["illustration"] = asset
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
