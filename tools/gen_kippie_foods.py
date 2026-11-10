#!/usr/bin/env python3
# Generate js/foods-kippie.js for Forged by Grace.
# Official nutrition: Open Food Facts (2 Kippie sauces) + manufacturer drink values.
# All other items: estimates from comparable products / USDA / NEVO, marked in src.

from collections import Counter
from pathlib import Path
import json
import math
import re
import textwrap

EST = "Schatting (vergelijkbaar product, USDA/NEVO)"
OFF_OFF = "Kippie / Open Food Facts (officiële waarde)"
OFF_MFG = "Fabrikant (officiële waarde)"
EST_RECEPT = "Schatting (recept/samenstelling, USDA/NEVO)"
EST_RECEPT_KIPPIE = "Schatting (Kippie-receptsuggestie, USDA/NEVO)"

# per 100 g or 100 ml: kcal, p, c, f, fib
# For estimates, kcal is set from Atwater (4p+4c+9f) after rounding macros.

def atw(p, c, f):
    return round(4 * p + 4 * c + 9 * f, 1)

def M(p, c, f, fib=0, kcal=None):
    p, c, f, fib = round(p, 2), round(c, 2), round(f, 2), round(fib, 2)
    k = kcal if kcal is not None else atw(p, c, f)
    return (round(k, 1), p, c, f, fib)

# Components (per 100 g)
COMP = {
    "pistolet": M(8.5, 50.0, 3.5, 2.5),
    "puntje": M(8.2, 51.0, 3.8, 2.3),
    "stokbrood": M(9.0, 55.0, 1.5, 2.5),
    "turks": M(9.0, 52.0, 4.0, 2.5),
    "pita": M(8.5, 52.0, 1.2, 2.2),
    "wrap": M(8.0, 50.0, 7.0, 2.0),
    "calzone": M(11.0, 28.0, 10.0, 1.6),  # whole calzone kip per 100g (dough+chicken+cheese)
    "sla": M(1.2, 2.0, 0.2, 1.2),
    "kip_gegrild": M(27.0, 0.5, 9.0, 0),
    "kip_poot": M(23.0, 0.8, 13.5, 0),
    "drumstick": M(23.0, 0.5, 13.0, 0),
    "hele_kip": M(24.0, 0.3, 12.0, 0),
    "kluif_nat": M(22.0, 2.0, 14.0, 0),
    "kluif_zoet": M(21.0, 6.0, 13.5, 0),
    "kluif_pittig": M(21.0, 4.0, 13.8, 0),
    "sate": M(24.0, 3.0, 7.5, 0),
    "sate_zoet": M(23.0, 7.0, 7.5, 0),
    "sate_pittig": M(23.0, 5.0, 7.5, 0),
    "sate_pinda": M(20.0, 6.0, 11.0, 0.4),  # meat with clinging peanut sauce
    "kippeling": M(18.0, 14.0, 13.0, 0.8),
    "nuggets": M(15.5, 16.0, 14.0, 1.0),
    "pops": M(17.0, 4.0, 21.0, 0),
    "balletjes_ketjap": M(16.0, 10.0, 10.0, 0.4),
    "balletjes_pinda": M(16.0, 9.0, 13.5, 0.8),
    "mini_sate_ketjap": M(20.0, 8.0, 8.0, 0),
    "mini_sate_kerrie": M(21.0, 4.0, 8.0, 0),
    "mini_sate_zoet": M(20.0, 8.0, 8.0, 0),
    "grillworst": M(14.0, 3.0, 20.5, 0),
    "grillworst_kaas": M(15.0, 3.0, 22.5, 0),
    "gehaktbal": M(16.0, 8.0, 16.5, 0.5),
    "kipbal": M(17.0, 8.0, 14.0, 0.4),
    "braadworst": M(13.0, 3.0, 25.0, 0),
    "spareribs": M(18.0, 6.0, 20.0, 0),
    "spareribs_zoet": M(17.5, 8.0, 19.5, 0),
    "spareribs_pittig": M(18.0, 6.0, 20.0, 0),
    "doner": M(19.0, 5.0, 10.0, 0.3),
    "kip_ketjap": M(16.0, 11.0, 7.0, 0.3),
    "kip_cashew": M(16.0, 8.0, 11.0, 0.5),
    "kip_pangan": M(16.0, 8.0, 10.0, 0.4),
    "kip_peperroom": M(16.0, 5.0, 12.0, 0.2),
    "nasi": M(7.0, 22.0, 4.5, 1.2),
    "bami": M(7.5, 20.0, 4.8, 1.3),
    "mihoen": M(6.5, 19.0, 4.2, 1.2),
    "cnasi": M(6.5, 22.0, 4.2, 1.2),
    "cbami": M(7.0, 20.0, 4.5, 1.3),
    "nasi_vega": M(4.5, 23.0, 3.8, 1.5),
    "bami_vega": M(5.0, 21.0, 4.0, 1.6),
    "mihoen_vega": M(4.2, 20.0, 3.5, 1.5),
    "cbami_vega": M(4.8, 21.0, 3.8, 1.6),
    "sajoer": M(3.0, 8.0, 2.5, 2.5),
    "komkommer": M(1.0, 5.0, 5.8, 0.6),
    "aardappel": M(2.8, 20.0, 8.0, 2.0),
    "kroepoek": M(5.0, 55.0, 30.0, 1.5),
    "loempia": M(8.0, 22.0, 8.5, 1.5),
    "rotirol": M(10.0, 22.0, 9.0, 2.0),
    "tortilla_kip": M(12.0, 18.0, 10.0, 1.5),
    "kroket_kip": M(10.0, 18.0, 13.0, 1.0),
    "frikandel_kip": M(13.0, 8.0, 18.0, 0.5),
    "burger_kip": M(16.0, 8.0, 13.0, 0.8),
    "pinda": M(6.0, 15.0, 14.0, 1.5),
    # Official sauces (Open Food Facts, per 100 g)
    "piripiri": M(0.5, 47.0, 0.5, 0, kcal=194),
    "knoflook": M(0.5, 9.7, 26.0, 0, kcal=268),
    "speciaal": M(1.2, 14.0, 31.0, 0.2),
    "curry": M(0.5, 27.0, 0.4, 0.3),
    "frites": M(0.8, 16.0, 22.0, 0.1),
    "mosterd": M(5.5, 6.0, 10.0, 2.0),
    "saus_mix": M(2.4, 23.9, 13.5, 0.5),  # avg knoflook + piripiri + pinda
}

def blend(parts):
    """parts: list of (grams, key_or_tuple). Returns M per 100 g of the mix."""
    tw = 0
    acc = [0, 0, 0, 0, 0]
    for g, key in parts:
        m = COMP[key] if isinstance(key, str) else key
        tw += g
        for i in range(5):
            acc[i] += m[i] * g / 100.0
    if tw <= 0:
        raise ValueError("empty blend")
    # kcal, p, c, f, fib per 100
    k, p, c, f, fib = (x / tw * 100 for x in acc)
    return (round(k, 1), round(p, 1), round(c, 1), round(f, 1), round(fib, 1))

def est_from_m(m, official=False):
    k, p, c, f, fib = m
    if not official:
        k = atw(p, c, f)
    return (round(k, 1), p, c, f, fib)

items = []  # dicts
used_ids = set()

def slug(s):
    s = s.lower().replace("ë", "e").replace("é", "e").replace("ö", "o").replace("ü", "u")
    s = s.replace("&", "en").replace("/", "-")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

def add(nid, en, nl, al, cat, m, g, portion, src, extra_al=""):
    if nid in used_ids:
        raise SystemExit("duplicate id " + nid)
    used_ids.add(nid)
    k, p, c, f, fib = m
    official = src.startswith("Kippie / Open Food Facts") or src.startswith("Fabrikant")
    if not official:
        k = round(atw(p, c, f), 1)
    aliases = "kippie " + al
    if extra_al:
        aliases += " " + extra_al
    items.append({
        "id": nid,
        "en": en,
        "nl": nl,
        "al": aliases.strip(),
        "cat": cat,
        "kcal": k,
        "p": p,
        "c": c,
        "f": f,
        "fib": fib,
        "g": g,
        "portion": portion,
        "src": src,
        "rg": "kippie",
        "official": official,
    })

def add_comp(nid, en, nl, al, cat, key, g, portion, src=EST, extra_al=""):
    add(nid, en, nl, al, cat, COMP[key], g, portion, src, extra_al)

def add_blend(nid, en, nl, al, cat, parts, g, portion, src=EST_RECEPT, extra_al=""):
    add(nid, en, nl, al, cat, blend(parts), g, portion, src, extra_al)

# ---------------------------------------------------------------------------
# Broodjes / pistolets / stokbrood / wraps
# ---------------------------------------------------------------------------
# Pistolet ~65 g, typical fillings + a little sauce/salad
add_blend("kip-pistolet-kip", "Kippie chicken pistolet", "Pistolet Kip",
          "pistolet kip broodje ketjap knoflook piripiri saus",
          "meal", [(65, "pistolet"), (80, "kip_gegrild"), (15, "sla"), (20, "knoflook")],
          180, "1 pistolet (±180 g)")

add_blend("kip-pistolet-kippeling", "Kippie kippeling pistolet", "Pistolet Kippeling",
          "pistolet kippeling broodje",
          "meal", [(65, "pistolet"), (80, "kippeling"), (15, "knoflook")],
          160, "1 pistolet (±160 g)")

add_blend("kip-pistolet-gehaktbal", "Kippie meatball pistolet", "Pistolet Gehaktbal",
          "pistolet gehaktbal bal rund varken broodje",
          "meal", [(65, "pistolet"), (100, "gehaktbal"), (15, "speciaal")],
          180, "1 pistolet (±180 g)")

add_blend("kip-pistolet-kipbal", "Kippie chicken-ball pistolet", "Pistolet Kipbal",
          "pistolet kipbal broodje",
          "meal", [(65, "pistolet"), (100, "kipbal"), (15, "speciaal")],
          180, "1 pistolet (±180 g)")

add_blend("kip-pistolet-grillworst", "Kippie grilled-sausage pistolet", "Pistolet Grillworst (Naturel)",
          "pistolet grillworst naturel broodje worst",
          "meal", [(65, "pistolet"), (80, "grillworst"), (10, "sla")],
          155, "1 pistolet (±155 g)")

add_blend("kip-pistolet-grillworst-kaas", "Kippie cheese grilled-sausage pistolet", "Pistolet Grillworst (Kaas)",
          "pistolet grillworst kaas broodje worst",
          "meal", [(65, "pistolet"), (80, "grillworst_kaas"), (10, "sla")],
          155, "1 pistolet (±155 g)")

# Snackbroodjes on witte puntjes
add_blend("kip-broodje-kipkroket", "Kippie chicken-croquette roll", "Broodje Kipkroket",
          "broodje kipkroket kroket puntje snackbroodje",
          "meal", [(55, "puntje"), (75, "kroket_kip")],
          130, "1 broodje (±130 g)")

add_blend("kip-broodje-kipfrikandel", "Kippie chicken-frikandel roll", "Broodje Kipfrikandel",
          "broodje kipfrikandel frikandel puntje snackbroodje",
          "meal", [(55, "puntje"), (70, "frikandel_kip")],
          125, "1 broodje (±125 g)")

add_blend("kip-broodje-kipburger", "Kippie chicken-burger roll", "Broodje Kipburger",
          "broodje kipburger burger puntje snackbroodje",
          "meal", [(55, "puntje"), (80, "burger_kip"), (10, "speciaal")],
          145, "1 broodje (±145 g)")

add_blend("kip-broodje-braadworst", "Kippie bratwurst roll", "Zacht broodje braadworst (kip/varken)",
          "zacht broodje braadworst kip varken worst",
          "meal", [(60, "puntje"), (80, "braadworst")],
          140, "1 broodje (±140 g)")

add_blend("kip-stokbrood-kip", "Kippie chicken baguette", "Stokbrood Kip",
          "stokbrood kip baguette broodje stok",
          "meal", [(120, "stokbrood"), (100, "kip_gegrild"), (25, "sla"), (20, "knoflook")],
          265, "1 stokbrood (±265 g)")

add_blend("kip-broodje-kipdoner", "Kippie chicken-doner roll", "Broodje Kipdöner",
          "broodje kipdoner kipdöner doner döner turks brood sla saus",
          "meal", [(120, "turks"), (100, "doner"), (30, "sla"), (20, "knoflook")],
          270, "1 Turks broodje (±270 g)")

add_blend("kip-calzone-kip", "Kippie chicken calzone", "Calzone kip",
          "calzone kip ovenschotel brood",
          "meal", [(250, "calzone")],
          250, "1 calzone (±250 g)")

add_blend("kip-wrap-kippeling", "Kippie kippeling wrap (recipe)", "Wrap met kippeling (receptsuggestie)",
          "wrap kippeling sla knoflooksaus piripiri lunch",
          "meal", [(62, "wrap"), (80, "kippeling"), (30, "sla"), (20, "knoflook")],
          192, "1 wrap (±190 g)", EST_RECEPT_KIPPIE)

add_comp("kip-pitabroodjes", "Kippie pita breads (1 pc)", "Pitabroodje",
         "pitabroodjes pita brood", "carb", "pita", 65, "1 pita (±65 g); zak 5 stuks")

add_comp("kip-witte-puntjes", "Kippie white rolls (1 pc)", "Wit puntje",
         "witte puntjes puntje brood wit", "carb", "puntje", 58, "1 puntje (±58 g); zak 12 stuks")

# ---------------------------------------------------------------------------
# Kip / grill / vlees
# ---------------------------------------------------------------------------
add_comp("kip-hele-kip", "Kippie whole grilled chicken (serving)", "Hele kip (gegrild)",
         "hele kip gegrilde kip grillkip rotisserie", "protein", "hele_kip",
         200, "1 portie vlees zonder bot (±200 g)")

add_comp("kip-kippenpoot-naturel", "Kippie chicken leg, natural", "Kippenpoot (Naturel)",
         "kippenpoot kippenpoten naturel poot gegrild", "protein", "kip_poot",
         150, "1 poot, eetbaar deel (±150 g)")

add("kip-kippenpoot-pittig", "Kippie chicken leg, spicy", "Kippenpoot (Pittig)",
    "kippenpoot kippenpoten pittig poot", "protein",
    M(22.5, 3.0, 13.2, 0), 150, "1 poot, eetbaar deel (±150 g)", EST)

add("kip-kippenpoot-zoet", "Kippie chicken leg, sweet", "Kippenpoot (Zoet)",
    "kippenpoot kippenpoten zoet poot ketjap", "protein",
    M(22.0, 5.0, 13.0, 0), 150, "1 poot, eetbaar deel (±150 g)", EST)

add_comp("kip-drumsticks", "Kippie chicken drumsticks", "Drumsticks",
         "drumsticks drumstick kippenbout bout", "protein", "drumstick",
         90, "1 drumstick, eetbaar deel (±90 g)")

add_comp("kip-kluifjes-naturel", "Kippie chicken nibbles, natural", "Kluifjes (Naturel)",
         "kluifjes kluif naturel kipkluifjes vleugels wings", "protein", "kluif_nat",
         250, "1 portie (±250 g); bak 500 g")

add_comp("kip-kluifjes-pittig", "Kippie chicken nibbles, spicy", "Kluifjes (Pittig)",
         "kluifjes kluif pittig kipkluifjes vleugels", "protein", "kluif_pittig",
         250, "1 portie (±250 g); bak 500 g")

add_comp("kip-kluifjes-zoet", "Kippie chicken nibbles, sweet", "Kluifjes (Zoet)",
         "kluifjes kluif zoet kipkluifjes vleugels ketjap", "protein", "kluif_zoet",
         250, "1 portie (±250 g); bak 500 g")

add_comp("kip-kipsate-knoflook", "Kippie chicken satay, garlic (5 pcs)", "Kipsaté (Knoflook) — 5 stuks",
         "kipsate kipsaté saté sate knoflook french garden", "protein", "sate",
         150, "5 stokjes (±150 g)")

add_comp("kip-kipsate-pindasaus", "Kippie chicken satay, peanut (5 pcs)", "Kipsaté (Pindasaus) — 5 stuks",
         "kipsate kipsaté saté sate pindasaus pinda", "protein", "sate_pinda",
         150, "5 stokjes (±150 g)")

add_comp("kip-kipsate-pikant", "Kippie chicken satay, spicy (5 pcs)", "Kipsaté (Pikant) — 5 stuks",
         "kipsate kipsaté saté sate pikant pittig piripiri", "protein", "sate_pittig",
         150, "5 stokjes (±150 g)")

add_comp("kip-kipsate-zoet", "Kippie chicken satay, sweet (5 pcs)", "Kipsaté (Zoet) — 5 stuks",
         "kipsate kipsaté saté sate zoet ketjap", "protein", "sate_zoet",
         150, "5 stokjes (±150 g)")

add_comp("kip-grillworst-naturel", "Kippie grilled sausage, natural", "Grillworst Naturel",
         "grillworst naturel worst", "protein", "grillworst",
         110, "1 portie (±110 g); worst voor ±3 personen")

add_comp("kip-grillworst-kaas", "Kippie grilled sausage, cheese", "Grillworst Kaas",
         "grillworst kaas worst", "protein", "grillworst_kaas",
         110, "1 portie (±110 g); worst voor ±3 personen")

add_comp("kip-gehaktbal", "Kippie mixed meatball", "Gehaktbal (half-om-half)",
         "gehaktbal half-om-half rund varken bal", "protein", "gehaktbal",
         100, "1 gehaktbal (±100 g)")

add_comp("kip-spareribs-zoet", "Kippie spare ribs, sweet", "Spareribs (Zoet)",
         "spareribs zoet ketjap varken ribben", "protein", "spareribs_zoet",
         250, "1 portie (±250 g); bak 500 g")

add_comp("kip-spareribs-pittig", "Kippie spare ribs, spicy", "Spareribs (Pittig)",
         "spareribs pittig varken ribben", "protein", "spareribs_pittig",
         250, "1 portie (±250 g); bak 500 g")

# gesneden variants: same nutrition, separate searchable names
add_comp("kip-spareribs-zoet-gesneden", "Kippie spare ribs, sweet, sliced", "Spareribs (Zoet) — gesneden",
         "spareribs zoet gesneden ketjap varken", "protein", "spareribs_zoet",
         250, "1 portie (±250 g); bak 500 g")

add_comp("kip-spareribs-pittig-gesneden", "Kippie spare ribs, spicy, sliced", "Spareribs (Pittig) — gesneden",
         "spareribs pittig gesneden varken", "protein", "spareribs_pittig",
         250, "1 portie (±250 g); bak 500 g")

# ---------------------------------------------------------------------------
# Hapjes / snacks
# ---------------------------------------------------------------------------
add_comp("kip-balletjes-ketjap", "Kippie chicken meatballs in ketjap (10 pcs)", "Kip Balletjes (Ketjap) — 10 stuks",
         "kip balletjes ketjap ketjapsaus hapjes", "snack", "balletjes_ketjap",
         200, "10 stuks (±200 g)")

add_comp("kip-balletjes-pindasaus", "Kippie chicken meatballs in peanut sauce (10 pcs)", "Kip Balletjes (Pindasaus) — 10 stuks",
         "kip balletjes pindasaus hapjes", "snack", "balletjes_pinda",
         200, "10 stuks (±200 g)")

add_comp("kip-pops", "Kippie Pops (10 pcs)", "Kippie Pops (10 stuks)",
         "kippie pops pops bacon hapjes", "snack", "pops",
         200, "10 hapjes (±200 g)")

add_comp("kip-mini-sate-kerrie", "Kippie mini satay, curry-garlic (10 pcs)", "Mini Kip Saté (Kerrie-Knoflook) — 10 stuks",
         "mini kip sate saté kerrie knoflook indian mystery french garden hapjes",
         "snack", "mini_sate_kerrie", 120, "10 hapjes (±120 g)")

add_comp("kip-mini-sate-zoet", "Kippie mini satay, sweet (10 pcs)", "Mini Kip Saté (Zoet) — 10 stuks",
         "mini kip sate saté zoet ketjap hapjes", "snack", "mini_sate_zoet",
         120, "10 hapjes (±120 g)")

add_comp("kip-kippeling-300", "Kippie kippeling (300 g)", "Kippeling — 300 gram",
         "kippeling kip stukken gepaneerd", "protein", "kippeling",
         300, "1 bak (300 g)")

add_comp("kip-kippiebox-nuggets", "Kippiebox chicken nuggets", "Kippiebox kipnuggets",
         "kippiebox kipnuggets nuggets kipcorn", "snack", "nuggets",
         140, "7 nuggets (±140 g)")

add_comp("kip-kippiebox-kippeling", "Kippiebox kippeling", "Kippiebox kippeling",
         "kippiebox kippeling", "snack", "kippeling",
         200, "1 box (200 g)")

# Mixed platters — average of boneless / mixed snacks
MIX_HAPJE = blend([
    (20, "balletjes_ketjap"), (20, "kippeling"), (20, "mini_sate_kerrie"),
    (15, "pops"), (15, "nuggets"), (10, "grillworst"),
])
MIX_ANTI = blend([
    (30, "balletjes_ketjap"), (25, "kippeling"), (25, "mini_sate_kerrie"),
    (20, "pops"),
])
MIX_FEEST = blend([
    (20, "balletjes_pinda"), (20, "kluif_zoet"), (15, "kippeling"),
    (15, "mini_sate_zoet"), (15, "pops"), (15, "sate_pinda"),
])

add("kip-kippieplank", "Kippie sharing plank (serving)", "Kippieplank",
    "kippieplank plank hapjes party", "snack", MIX_HAPJE,
    250, "1 portie (±250 g; 10 hapjes); plank 100 hapjes / 10 personen", EST_RECEPT)

add("kip-anti-kluif-partyschotel", "Kippie anti-kluif party platter (serving)", "Anti Kluif Partyschotel",
    "anti kluif partyschotel hapjes party", "snack", MIX_ANTI,
    250, "1 portie (±250 g); schotel ±35 hapjes / 3 personen", EST_RECEPT)

add("kip-partyschotel", "Kippie party platter (serving)", "Partyschotel",
    "partyschotel hapjes party 30", "snack", MIX_HAPJE,
    180, "1 portie (±180 g); schotel 30 hapjes / 4 personen", EST_RECEPT)

# ---------------------------------------------------------------------------
# Maaltijden, kip in saus, overig
# ---------------------------------------------------------------------------
for key, nid, en, nl, al in [
    ("mihoen", "kip-mihoen", "Kippie mihoen", "Mihoen (300 gram)", "mihoen maaltijd noedels"),
    ("nasi", "kip-nasi", "Kippie nasi", "Nasi (300 gram)", "nasi maaltijd rijst"),
    ("cbami", "kip-chinese-bami", "Kippie Chinese bami", "Chinese Bami (300 gram)", "chinese bami maaltijd noedels"),
    ("cnasi", "kip-chinese-nasi", "Kippie Chinese nasi", "Chinese nasi (300 gram)", "chinese nasi maaltijd rijst"),
    ("bami", "kip-bami", "Kippie bami", "Bami (300 gram)", "bami maaltijd noedels"),
    ("doner", "kip-kip-doner-300", "Kippie chicken doner (300 g)", "Kip Döner (300 gram)", "kip doner döner döner maaltijd"),
    ("mihoen_vega", "kip-mihoen-vega", "Kippie vegetarian mihoen", "Mihoen — Vega (300 gram)", "mihoen vega vegetarisch maaltijd"),
    ("nasi_vega", "kip-nasi-vega", "Kippie vegetarian nasi", "Nasi — Vega (300 gram)", "nasi vega vegetarisch maaltijd"),
    ("bami_vega", "kip-bami-vega", "Kippie vegetarian bami", "Bami — Vega (300 gram)", "bami vega vegetarisch maaltijd"),
    ("cbami_vega", "kip-chinese-bami-vega", "Kippie vegetarian Chinese bami", "Chinese Bami — Vega (300 gram)", "chinese bami vega vegetarisch"),
]:
    add_comp(nid, en, nl, al, "meal", key, 300, "1 portie (300 g)")

for key, nid, en, nl, al in [
    ("kip_cashew", "kip-cashewsaus", "Kippie chicken in cashew sauce", "Kip in Cashewsaus (250 gram)", "kip cashewsaus cashew saus"),
    ("kip_pangan", "kip-pangangsaus", "Kippie chicken in pangang sauce", "Kip in Pangangsaus (250 gram)", "kip pangangsaus pangan saus"),
    ("kip_peperroom", "kip-peperroomsaus", "Kippie chicken in pepper-cream sauce", "Kip in Peperroomsaus (250 gram)", "kip peperroomsaus peper room saus"),
    ("kip_ketjap", "kip-ketjapsaus", "Kippie chicken in ketjap sauce", "Kip in Ketjapsaus (250 gram)", "kip ketjapsaus ketjap saus"),
]:
    add_comp(nid, en, nl, al, "meal", key, 250, "1 bak (250 g)")

# Dönerpakket ±2 personen: pita + döner + sauce + salad, per person
add_blend("kip-donerpakket-knoflook", "Kippie doner meal deal, garlic sauce", "Dönerpakket (Knoflooksaus)",
          "donerpakket dönerpakket knoflooksaus pita",
          "meal", [(70, "pita"), (180, "doner"), (30, "sla"), (30, "knoflook")],
          310, "1 portie (±310 g); pakket voor ±2 personen")

add_blend("kip-donerpakket-piripiri", "Kippie doner meal deal, piri piri", "Dönerpakket (Piripiri saus)",
          "donerpakket dönerpakket piripiri pita",
          "meal", [(70, "pita"), (180, "doner"), (30, "sla"), (30, "piripiri")],
          310, "1 portie (±310 g); pakket voor ±2 personen")

# Anti kluif pakket: 250 minisaté + 250 balletjes ketjap + 250 kippeling + grillworst, 2 personen
add_blend("kip-anti-kluif-pakket", "Kippie anti-kluif meal deal", "Anti kluif pakket",
          "anti kluif pakket hapjes",
          "meal", [(250, "mini_sate_kerrie"), (250, "balletjes_ketjap"), (250, "kippeling"), (110, "grillworst")],
          430, "1 portie (±430 g); pakket voor 2 personen")

add_comp("kip-loempia-kip", "Kippie chicken spring roll", "Loempia (Kip)",
         "loempia kip loempias spring roll", "meal", "loempia",
         140, "1 loempia (±140 g)")

add_comp("kip-tortilla-rol", "Kippie chicken tortilla rolls (2 pcs)", "Tortilla Rol (Kip) — 2 stuks",
         "tortilla rol kip wraps burrito", "meal", "tortilla_kip",
         240, "2 tortilla's (±240 g)")

add_comp("kip-rotirol", "Kippie chicken roti roll", "Rotirol",
         "rotirol roti rol kip", "meal", "rotirol",
         250, "1 rol (±250 g)")

# ---------------------------------------------------------------------------
# Bijgerechten
# ---------------------------------------------------------------------------
add_comp("kip-sajoerboontjes", "Kippie sayur beans", "Sajoerboontjes (300 gram)",
         "sajoerboontjes sajoer boontjes sperziebonen bijgerecht", "veg", "sajoer",
         150, "1 portie (±150 g); bak 300 g")

add_comp("kip-aardappelpartjes", "Kippie potato wedges", "Aardappelpartjes (300 gram)",
         "aardappelpartjes aardappel partjes wedges bijgerecht", "carb", "aardappel",
         300, "1 bak (300 g)")

add_comp("kip-komkommersalade", "Kippie cucumber salad", "Komkommersalade (300 gram)",
         "komkommersalade komkommer salade bijgerecht", "veg", "komkommer",
         150, "1 portie (±150 g); bak 300 g")

add_comp("kip-kroepoek", "Kippie prawn crackers", "Kroepoek",
         "kroepoek crackers bijgerecht", "snack", "kroepoek",
         33, "1 portie (±33 g); zak 100 g voor ±3 personen")

# ---------------------------------------------------------------------------
# Sauzen
# ---------------------------------------------------------------------------
add("kip-piripirisaus", "Kippie piri piri sauce", "Piripirisaus (bakje)",
    "piripirisaus piripiri piri piri saus bakje", "fat",
    COMP["piripiri"], 50, "½ bakje (50 ml); bakje 100 ml", OFF_OFF)

add("kip-knoflooksaus", "Kippie garlic sauce", "Knoflooksaus (bakje)",
    "knoflooksaus knoflook saus bakje", "fat",
    COMP["knoflook"], 50, "½ bakje (50 ml); bakje 100 ml", OFF_OFF)

add_comp("kip-pindasaus", "Kippie peanut sauce", "Pindasaus (bakje)",
         "pindasaus satésaus satesaus pinda saus bakje", "fat", "pinda",
         50, "1 schep (50 g); bakje 270 g")

add_comp("kip-speciaalsaus", "Kippie special sauce", "Kippie Speciaalsaus",
         "speciaalsaus speciaal saus bakje", "fat", "speciaal",
         50, "½ bakje (50 ml); bakje 100 ml")

add_comp("kip-curry-saus", "Kippie curry sauce", "Curry",
         "curry saus curry-saus", "fat", "curry",
         25, "1 portie (25 g)")

add_comp("kip-fritessaus", "Kippie frite sauce", "Fritessaus",
         "fritessaus frietsaus mayo saus", "fat", "frites",
         25, "1 portie (25 g)")

add_comp("kip-mosterd", "Kippie mustard", "Mosterd",
         "mosterd saus", "fat", "mosterd",
         15, "1 portie (15 g)")

add("kip-dippiebar", "Kippie Dippiebar (3 sauces)", "Dippiebar",
    "dippiebar dip sausjes 3 saus", "fat", COMP["saus_mix"],
    75, "3 sausjes (±75 g)", EST_RECEPT)

# ---------------------------------------------------------------------------
# Dranken — official manufacturer values per 100 ml
# ---------------------------------------------------------------------------
def drink(nid, en, nl, al, kcal, p, c, f, g, portion):
    add(nid, en, nl, al, "drink", (kcal, p, c, f, 0), g, portion, OFF_MFG)

drink("kip-coca-cola-blik", "Coca-Cola (can, at Kippie)", "Coca Cola (blik)",
      "coca cola coke blik frisdrank", 42, 0, 10.6, 0, 330, "1 blik (330 ml)")
drink("kip-coca-cola-flesje", "Coca-Cola (bottle, at Kippie)", "Coca Cola (flesje)",
      "coca cola coke flesje frisdrank", 42, 0, 10.6, 0, 500, "1 flesje (500 ml)")
drink("kip-coca-cola-zero", "Coca-Cola Zero (can, at Kippie)", "Coca Cola Zero (blik)",
      "coca cola zero light blik frisdrank", 0.3, 0, 0, 0, 330, "1 blik (330 ml)")
drink("kip-fanta-blik", "Fanta (can, at Kippie)", "Fanta (blik)",
      "fanta blik frisdrank sinas", 19, 0, 4.6, 0, 250, "1 blik (250 ml)")
drink("kip-fanta-flesje", "Fanta (bottle, at Kippie)", "Fanta (flesje)",
      "fanta flesje frisdrank sinas", 19, 0, 4.6, 0, 500, "1 flesje (500 ml)")
drink("kip-fuze-tea", "Fuze Tea (can, at Kippie)", "Fuze Tea (blik)",
      "fuze tea ice tea icetea blik", 28, 0, 6.7, 0, 330, "1 blik (330 ml)")
drink("kip-fuze-tea-green", "Fuze Tea Green (can, at Kippie)", "Fuze Tea Green (blik)",
      "fuze tea green ice tea icetea blik", 20, 0, 4.8, 0, 330, "1 blik (330 ml)")
drink("kip-fernandes-cherry", "Fernandes Cherry Bouquet (can, at Kippie)", "Fernandes Cherry Bouquet (blik)",
      "fernandes cherry bouquet blik frisdrank", 44, 0, 10.8, 0, 250, "1 blik (250 ml)")
drink("kip-fernandes-green", "Fernandes Green Punch (can, at Kippie)", "Fernandes Green Punch (blik)",
      "fernandes green punch blik frisdrank", 44, 0, 10.8, 0, 330, "1 blik (330 ml)")
drink("kip-fristi", "Fristi (can, at Kippie)", "Fristi (blik)",
      "fristi blik melk drinkyoghurt", 61, 3.1, 10.0, 1.0, 250, "1 blik (250 ml)")
drink("kip-chocomel", "Chocomel (can, at Kippie)", "Chocomel (blik)",
      "chocomel blik chocolademelk", 67, 3.6, 9.6, 1.6, 250, "1 blik (250 ml)")
drink("kip-red-bull", "Red Bull (can, at Kippie)", "Red Bull (blik)",
      "red bull blik energiedrank energy", 46, 0, 11.0, 0, 250, "1 blik (250 ml)")
drink("kip-aa", "AA Drink (bottle, at Kippie)", "AA (fles)",
      "aa drink fles energiedrink high energy", 46, 0, 11.3, 0, 330, "1 fles (330 ml)")
drink("kip-spa-blauw", "Spa Blauw (bottle, at Kippie)", "Spa Blauw (fles)",
      "spa blauw water mineraalwater fles", 0, 0, 0, 0, 330, "1 fles (330 ml)")
drink("kip-7up", "7UP (can, at Kippie)", "7UP (blik)",
      "7up seven up blik frisdrank", 29, 0, 6.9, 0, 330, "1 blik (330 ml)")

# ---------------------------------------------------------------------------
# Pannen — default portion = 1 person's share
# ---------------------------------------------------------------------------
def pan(nid, en, nl, al, m, total_g, persons, hapjes=None, src=EST_RECEPT):
    g = int(round(total_g / persons))
    extra = ""
    if hapjes:
        extra = f"; ±{hapjes} hapjes"
    portion = f"1 portie (±{g} g; pan ±{persons} personen{extra})"
    add(nid, en, nl, al + " pan kippiepan", "meal", m, g, portion, src)

# Aardappelpan
pan("kip-aardappelpan", "Kippie potato pan (serving)", "Aardappelpan",
    "aardappelpan aardappel", COMP["aardappel"], 2000, 8)
pan("kip-aardappelpan-xxl", "Kippie potato pan XXL (serving)", "Aardappelpan XXL",
    "aardappelpan xxl aardappel", COMP["aardappel"], 6000, 24)

# Kluifpan 2200 / 8, 6600 / 24 — mix of kluif flavors
KLUIFMIX = blend([(40, "kluif_nat"), (30, "kluif_zoet"), (30, "kluif_pittig")])
pan("kip-kluifpan", "Kippie nibble pan (serving)", "Kluifpan",
    "kluifpan kluifjes", KLUIFMIX, 2200, 8)
pan("kip-kluifpan-xxl", "Kippie nibble pan XXL (serving)", "Kluifpan XXL",
    "kluifpan xxl kluifjes", KLUIFMIX, 6600, 24)

# Dönerpan
pan("kip-donerpan", "Kippie doner pan (serving)", "Dönerpan",
    "donerpan dönerpan doner döner", COMP["doner"], 2000, 12)
pan("kip-donerpan-xxl", "Kippie doner pan XXL (serving)", "Dönerpan XXL",
    "donerpan dönerpan xxl doner", COMP["doner"], 6000, 35)

# Kippelingpan
pan("kip-kippelingpan", "Kippie kippeling pan (serving)", "Kippelingpan",
    "kippelingpan kippeling", COMP["kippeling"], 2000, 8)
pan("kip-kippelingpan-xxl", "Kippie kippeling pan XXL (serving)", "Kippelingpan XXL",
    "kippelingpan xxl kippeling", COMP["kippeling"], 6000, 24)

# Satépannen: 35 stokjes / 12, ~30 g each = 1050 g; XXL 105 stokjes / 35 = 3150 g
pan("kip-satepan-ketjap", "Kippie satay pan, ketjap (serving)", "Satépan Ketjap",
    "satépan satepan ketjap saté", COMP["sate_zoet"], 1050, 12)
pan("kip-satepan-ketjap-xxl", "Kippie satay pan, ketjap XXL (serving)", "Satépan Ketjap XXL",
    "satépan satepan ketjap xxl", COMP["sate_zoet"], 3150, 35)
pan("kip-satepan-pindasaus", "Kippie satay pan, peanut (serving)", "Satépan Pindasaus",
    "satépan satepan pindasaus saté", COMP["sate_pinda"], 1050, 12)
pan("kip-satepan-pindasaus-xxl", "Kippie satay pan, peanut XXL (serving)", "Satépan Pindasaus XXL",
    "satépan satepan pindasaus xxl", COMP["sate_pinda"], 3150, 35)
pan("kip-satepan-piripiri", "Kippie satay pan, piri piri (serving)", "Satépan Piripiri",
    "satépan satepan piripiri saté", COMP["sate_pittig"], 1050, 12)
pan("kip-satepan-piripiri-xxl", "Kippie satay pan, piri piri XXL (serving)", "Satépan Piripiri XXL",
    "satépan satepan piripiri xxl", COMP["sate_pittig"], 3150, 36)

# Spareribpan 2500/6, 7500/18
pan("kip-spareribpan-pittig", "Kippie spare-rib pan, spicy (serving)", "Spareribpan Pittig",
    "spareribpan pittig varken", COMP["spareribs_pittig"], 2500, 6)
pan("kip-spareribpan-pittig-xxl", "Kippie spare-rib pan, spicy XXL (serving)", "Spareribpan Pittig XXL",
    "spareribpan pittig xxl varken", COMP["spareribs_pittig"], 7500, 18)
pan("kip-spareribpan-zoet", "Kippie spare-rib pan, sweet (serving)", "Spareribpan Zoet",
    "spareribpan zoet varken", COMP["spareribs_zoet"], 2500, 6)
pan("kip-spareribpan-zoet-xxl", "Kippie spare-rib pan, sweet XXL (serving)", "Spareribpan Zoet XXL",
    "spareribpan zoet xxl varken", COMP["spareribs_zoet"], 7500, 18)

# Hapjes-pannen: ~22 g per hapje unless better data
def hapjes_pan(nid, en, nl, al, m, n_hapjes, persons, hap_g=22):
    pan(nid, en, nl, al, m, n_hapjes * hap_g, persons, hapjes=n_hapjes)

hapjes_pan("kip-snackpan", "Kippie snack pan (serving)", "Snackpan",
           "snackpan hapjes", MIX_HAPJE, 65, 6)
hapjes_pan("kip-snackpan-xl", "Kippie snack pan XL (serving)", "Snackpan XL",
           "snackpan xl hapjes", MIX_HAPJE, 90, 10)
hapjes_pan("kip-snackpan-xxl", "Kippie snack pan XXL (serving)", "Snackpan XXL",
           "snackpan xxl hapjes", MIX_HAPJE, 270, 30)

hapjes_pan("kip-feestpan", "Kippie party pan (serving)", "Feestpan",
           "feestpan hapjes", MIX_FEEST, 100, 10)
hapjes_pan("kip-feestpan-xxl", "Kippie party pan XXL (serving)", "Feestpan XXL",
           "feestpan xxl hapjes", MIX_FEEST, 300, 30)

hapjes_pan("kip-familiepan", "Kippie family pan (serving)", "Familiepan",
           "familiepan hapjes", MIX_FEEST, 120, 10)
hapjes_pan("kip-familiepan-xxl", "Kippie family pan XXL (serving)", "Familiepan XXL",
           "familiepan xxl hapjes", MIX_FEEST, 360, 30)

hapjes_pan("kip-popspan", "Kippie Pops pan (serving)", "Kippie Popspan",
           "popspan pops hapjes", COMP["pops"], 75, 8, hap_g=25)
hapjes_pan("kip-popspan-xxl", "Kippie Pops pan XXL (serving)", "Kippie Popspan XXL",
           "popspan xxl pops", COMP["pops"], 225, 25, hap_g=25)

hapjes_pan("kip-anti-kluifpan", "Kippie anti-kluif pan (serving)", "Anti-Kluifpan",
           "anti-kluifpan anti kluifpan hapjes", MIX_ANTI, 75, 8)
hapjes_pan("kip-anti-kluifpan-xxl", "Kippie anti-kluif pan XXL (serving)", "Anti-Kluifpan XXL",
           "anti-kluifpan xxl hapjes", MIX_ANTI, 225, 24)
hapjes_pan("kip-anti-kluifpan-deluxe", "Kippie anti-kluif pan deluxe (serving)", "Anti-Kluifpan Deluxe",
           "anti-kluifpan deluxe hapjes", MIX_ANTI, 80, 8)
hapjes_pan("kip-anti-kluifpan-deluxe-xxl", "Kippie anti-kluif pan deluxe XXL (serving)", "Anti-Kluifpan Deluxe XXL",
           "anti-kluifpan deluxe xxl hapjes", MIX_ANTI, 240, 25)

hapjes_pan("kip-ballenpan", "Kippie meatball pan (serving)", "Ballenpan",
           "ballenpan balletjes hapjes", COMP["balletjes_ketjap"], 80, 8, hap_g=20)
hapjes_pan("kip-ballenpan-xxl", "Kippie meatball pan XXL (serving)", "Ballenpan XXL",
           "ballenpan xxl balletjes", COMP["balletjes_ketjap"], 240, 24, hap_g=20)

MINISATE_BALLEN = blend([(50, "mini_sate_kerrie"), (50, "balletjes_ketjap")])
hapjes_pan("kip-minisate-ballenpan", "Kippie mini-satay/meatball pan (serving)", "Mini Saté/Ballenpan",
           "mini sate ballenpan saté balletjes", MINISATE_BALLEN, 100, 10)
hapjes_pan("kip-minisate-ballenpan-xxl", "Kippie mini-satay/meatball pan XXL (serving)", "Mini Saté/Ballenpan XXL",
           "mini sate ballenpan xxl", MINISATE_BALLEN, 300, 30)

hapjes_pan("kip-mini-satepan", "Kippie mini satay pan (serving)", "Mini Satépan",
           "mini satépan satepan kerrie knoflook", COMP["mini_sate_kerrie"], 100, 10)
hapjes_pan("kip-mini-satepan-xxl", "Kippie mini satay pan XXL (serving)", "Mini Satépan XXL",
           "mini satépan xxl", COMP["mini_sate_kerrie"], 300, 35)

# Glutenvrije pan 80 hapjes / 8 — mostly unbreaded chicken snacks
GFMIX = blend([(40, "sate"), (30, "kip_gegrild"), (30, "kluif_nat")])
hapjes_pan("kip-glutenvrije-pan", "Kippie gluten-free pan (serving)", "Glutenvrije pan",
           "glutenvrije pan glutenvrij hapjes", GFMIX, 80, 8)

# Maaltijdpannen 2400 g / ~7, XXL 7200 / 24
MEALS = {
    "bami": COMP["bami"],
    "nasi": COMP["nasi"],
    "mihoen": COMP["mihoen"],
    "cbami": COMP["cbami"],
    "cnasi": COMP["cnasi"],
}
VEGA = {
    "bami": COMP["bami_vega"],
    "nasi": COMP["nasi_vega"],
    "mihoen": COMP["mihoen_vega"],
    "cbami": COMP["cbami_vega"],
}

def meal_mix(keys, table=MEALS):
    parts = [(1, table[k] if k in table else COMP[k]) for k in keys]
    # equal blend — use grams
    return blend([(100, m) for _, m in parts] if False else [(100, k if isinstance(k, str) and k in COMP else None) or (100, table[k]) for k in keys])

def mix_keys(keys, table):
    parts = []
    for k in keys:
        m = table[k] if k in table else COMP[k]
        parts.append((100, m))
    return blend(parts)

meal_pans = [
    ("kip-maaltijdpan-bami", "Bami", ["bami"]),
    ("kip-maaltijdpan-nasi", "Nasi", ["nasi"]),
    ("kip-maaltijdpan-mihoen", "Mihoen", ["mihoen"]),
    ("kip-maaltijdpan-chinese-bami", "Chinese Bami", ["cbami"]),
    ("kip-maaltijdpan-chinese-nasi", "Chinese Nasi", ["cnasi"]),
    ("kip-maaltijdpan-bami-nasi", "Bami en Nasi", ["bami", "nasi"]),
    ("kip-maaltijdpan-bami-mihoen", "Bami en Mihoen", ["bami", "mihoen"]),
    ("kip-maaltijdpan-bami-cbami", "Bami en Chinese Bami", ["bami", "cbami"]),
    ("kip-maaltijdpan-nasi-cbami", "Nasi en Chinese Bami", ["nasi", "cbami"]),
    ("kip-maaltijdpan-nasi-mihoen", "Nasi en Mihoen", ["nasi", "mihoen"]),
    ("kip-maaltijdpan-cnasi-bami", "Chinese Nasi en Bami", ["cnasi", "bami"]),
    ("kip-maaltijdpan-cnasi-cbami", "Chinese Nasi en Chinese Bami", ["cnasi", "cbami"]),
    ("kip-maaltijdpan-cnasi-mihoen", "Chinese Nasi en Mihoen", ["cnasi", "mihoen"]),
    ("kip-maaltijdpan-cnasi-nasi", "Chinese Nasi en Nasi", ["cnasi", "nasi"]),
    ("kip-maaltijdpan-mihoen-cbami", "Mihoen en Chinese Bami", ["mihoen", "cbami"]),
    ("kip-maaltijdpan-4-soorten", "met 4 soorten maaltijden", ["bami", "nasi", "mihoen", "cbami"]),
]
for nid, title, keys in meal_pans:
    m = mix_keys(keys, MEALS)
    pan(nid, f"Kippie meal pan {title} (serving)", f"Maaltijdpan {title}",
        f"maaltijdpan {title.lower()}", m, 2400, 7)
    pan(nid + "-xxl", f"Kippie meal pan {title} XXL (serving)", f"Maaltijdpan {title} XXL",
        f"maaltijdpan {title.lower()} xxl", m, 7200, 24)

# Combimaaltijdpannen 2200 / 4, XXL 6600 / 12 — half meal, half kip in saus
combis = [
    ("kip-combi-bami-ketjap", "Bami en Kip in Ketjapsaus", "bami", "kip_ketjap"),
    ("kip-combi-bami-pangan", "Bami en Kip in Pangangsaus", "bami", "kip_pangan"),
    ("kip-combi-nasi-ketjap", "Nasi en Kip in Ketjapsaus", "nasi", "kip_ketjap"),
    ("kip-combi-nasi-pangan", "Nasi en Kip in Pangangsaus", "nasi", "kip_pangan"),
    ("kip-combi-cbami-ketjap", "Chinese Bami en Kip in Ketjapsaus", "cbami", "kip_ketjap"),
    ("kip-combi-cbami-pangan", "Chinese Bami en Kip in Pangangsaus", "cbami", "kip_pangan"),
    ("kip-combi-mihoen-ketjap", "Mihoen en Kip in Ketjapsaus", "mihoen", "kip_ketjap"),
    ("kip-combi-mihoen-pangan", "Mihoen en Kip in Pangangsaus", "mihoen", "kip_pangan"),
    ("kip-combi-cnasi-ketjap", "Chinese Nasi en Kip in Ketjapsaus", "cnasi", "kip_ketjap"),
    ("kip-combi-cnasi-pangan", "Chinese Nasi en Kip in Pangangsaus", "cnasi", "kip_pangan"),
]
for nid, title, meal, saus in combis:
    m = blend([(1100, COMP[meal]), (1100, COMP[saus])])
    pan(nid, f"Kippie combo pan {title} (serving)", f"Combimaaltijdpan {title}",
        f"combimaaltijdpan {title.lower()}", m, 2200, 4)
    pan(nid + "-xxl", f"Kippie combo pan {title} XXL (serving)", f"Combimaaltijdpan {title} XXL",
        f"combimaaltijdpan {title.lower()} xxl", m, 6600, 12)

vega_pans = [
    ("kip-vega-pan-bami", "Bami", ["bami"]),
    ("kip-vega-pan-nasi", "Nasi", ["nasi"]),
    ("kip-vega-pan-mihoen", "Mihoen", ["mihoen"]),
    ("kip-vega-pan-cbami", "Chinese Bami", ["cbami"]),
    ("kip-vega-pan-bami-nasi", "Bami en Nasi", ["bami", "nasi"]),
    ("kip-vega-pan-bami-mihoen", "Bami en Mihoen", ["bami", "mihoen"]),
    ("kip-vega-pan-bami-cbami", "Bami en Chinese Bami", ["bami", "cbami"]),
    ("kip-vega-pan-nasi-mihoen", "Nasi en Mihoen", ["nasi", "mihoen"]),
    ("kip-vega-pan-nasi-cbami", "Nasi en Chinese Bami", ["nasi", "cbami"]),
    ("kip-vega-pan-mihoen-cbami", "Mihoen en Chinese Bami", ["mihoen", "cbami"]),
    ("kip-vega-pan-4-soorten", "met 4 Soorten Maaltijden", ["bami", "nasi", "mihoen", "cbami"]),
]
for nid, title, keys in vega_pans:
    m = mix_keys(keys, VEGA)
    persons = 8
    pan(nid, f"Kippie vegetarian meal pan {title} (serving)", f"Vega Maaltijdpan {title}",
        f"vega maaltijdpan {title.lower()} vegetarisch", m, 2400, persons)
    pan(nid + "-xxl", f"Kippie vegetarian meal pan {title} XXL (serving)", f"Vega Maaltijdpan {title} XXL",
        f"vega maaltijdpan {title.lower()} xxl vegetarisch", m, 7200, 24)

# ---------------------------------------------------------------------------
# Emit JS
# ---------------------------------------------------------------------------
def js_str(s):
    return json.dumps(s, ensure_ascii=False)

lines = []
for it in items:
    # id, en, nl, al, cat, kcal, p, c, f, fib, g, portion, src, rg
    row = [
        js_str(it["id"]),
        js_str(it["en"]),
        js_str(it["nl"]),
        js_str(it["al"]),
        js_str(it["cat"]),
        it["kcal"] if it["kcal"] != int(it["kcal"]) else int(it["kcal"]) if it["src"].startswith("Fabrikant") or it["src"].startswith("Kippie / Open") else (int(it["kcal"]) if float(it["kcal"]).is_integer() else it["kcal"]),
        it["p"] if it["p"] != int(it["p"]) else int(it["p"]),
        it["c"] if it["c"] != int(it["c"]) else int(it["c"]),
        it["f"] if it["f"] != int(it["f"]) else int(it["f"]),
        it["fib"] if it["fib"] != int(it["fib"]) else int(it["fib"]),
        it["g"] if it["g"] != int(it["g"]) else int(it["g"]),
        js_str(it["portion"]),
        js_str(it["src"]),
        js_str(it["rg"]),
    ]
    # normalize numbers: keep one decimal max
    def num(x):
        if isinstance(x, (int, float)):
            if abs(x - round(x)) < 1e-9:
                return str(int(round(x)))
            return str(round(x, 1) if abs(x * 10 - round(x * 10)) < 1e-9 else round(x, 2))
        return str(x)
    row = [num(x) if not str(x).startswith('"') else x for x in [
        it["id"], it["en"], it["nl"], it["al"], it["cat"],
        it["kcal"], it["p"], it["c"], it["f"], it["fib"], it["g"],
        it["portion"], it["src"], it["rg"],
    ]]
    # quote strings
    out = []
    for i, v in enumerate(row):
        if i in (0, 1, 2, 3, 4, 11, 12, 13):
            out.append(js_str(v) if not (isinstance(v, str) and v.startswith('"')) else v)
        else:
            out.append(num(v) if not isinstance(v, str) else v)
    lines.append("    [" + ",".join(out) + "]")

off_n = sum(1 for it in items if it["official"])
est_n = len(items) - off_n
cats = Counter(it["cat"] for it in items)

header = f'''/* Forged by Grace — Kippie (kippie.nl) menu, november 2026.
   Officiële voedingswaarden: Open Food Facts voor Kippie piripiri- en knoflooksaus,
   en fabrikantwaarden voor de verkochte frisdranken. Overige items zijn schattingen
   op basis van vergelijkbare producten en USDA/NEVO, gemarkeerd in src.
   Geen soepen of desserts in het huidige assortiment. Merchandise en cadeaubonnen weggelaten.
   {len(items)} items ({off_n} officieel, {est_n} schatting). */
(function (FD) {{
  if (!FD || !FD.FOODS || !FD.BY_ID) return;
  var K = ["id","en","nl","al","cat","kcal","p","c","f","fib","g","portion","src","rg"];
  var R = [
'''

footer = '''
  ];
  FD.REGIONS = FD.REGIONS || {};
  FD.REGIONS.kippie = "Kippie";
  var filters = FD.REGION_FILTERS || [];
  if (!filters.some(function (r) { return r[0] === "kippie"; })) {
    FD.REGION_FILTERS = [["kippie", "Kippie", ["kippie"]]].concat(filters);
  }
  R.forEach(function (r) {
    var o = { x: 1, brand: "Kippie" };
    K.forEach(function (k, i) { o[k] = r[i]; });
    if (!o.nl) o.nl = o.en;
    o.rgName = (FD.REGIONS && FD.REGIONS[o.rg]) || "Kippie";
    if (FD.BY_ID[o.id]) return;
    FD.FOODS.push(o);
    FD.BY_ID[o.id] = o;
  });
})(typeof window !== "undefined" ? window.FBG_FOODS : (typeof FBG_FOODS !== "undefined" ? FBG_FOODS : null));
'''

# Fix lines join - last item no trailing issues; JS allows trailing comma
body = ",\n".join(lines)
out = header + body + "\n" + footer

ROOT = Path(__file__).resolve().parents[1]
dest = ROOT / "js" / "foods-kippie.js"
dest.write_text(out, encoding="utf-8")

# stats
print("Wrote", dest, "bytes", dest.stat().st_size)
print("ITEMS", len(items))
print("OFFICIAL", off_n)
print("ESTIMATE", est_n)
print("CATS", dict(cats))
print("sample ids:", [it["id"] for it in items[:8]])

# atwater self-check
bad = []
for it in items:
    at = 4 * it["p"] + 4 * it["c"] + 9 * it["f"]
    if it["src"].find("alcohol") == -1 and it["kcal"] > 8 and at > 0:
        dev = abs(it["kcal"] - at) / max(it["kcal"], at)
        if dev > 0.25:
            bad.append((it["id"], it["kcal"], round(at, 1), round(dev, 3), it["src"][:40]))
print("ATWATER_FAILS", len(bad))
for b in bad:
    print(" ", b)
