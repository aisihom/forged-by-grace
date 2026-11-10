#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate js/foods-caribbean.js — Caribbean & Latin American dishes for FBG.

Macros per 100 g are recipe-based estimates from typical home recipes and
USDA FoodData Central / NEVO-style ingredient values. Marked as estimates.
"""
from __future__ import annotations
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'js' / 'foods-caribbean.js'

# kcal, protein, carbs, fat, fiber — per 100 g
ING = {
    'fish_white': (105, 23.0, 0.0, 0.9, 0.0),
    'snapper': (128, 26.0, 0.0, 1.7, 0.0),
    'fish_fatty': (180, 20.0, 0.0, 11.0, 0.0),
    'shrimp': (99, 24.0, 0.2, 0.3, 0.0),
    'conch': (130, 26.3, 1.7, 1.2, 0.0),
    'chicken': (165, 31.0, 0.0, 3.6, 0.0),
    'chicken_stew': (185, 25.0, 0.0, 9.5, 0.0),
    'chicken_fried': (246, 25.0, 7.0, 13.0, 0.2),
    'beef_stew': (210, 26.0, 0.0, 12.0, 0.0),
    'beef_shredded': (190, 28.0, 0.0, 8.0, 0.0),
    'goat': (143, 27.1, 0.0, 3.0, 0.0),
    'pork': (231, 26.0, 0.0, 14.0, 0.0),
    'pork_fatty': (300, 20.0, 0.0, 24.0, 0.0),
    'pernil': (240, 24.0, 0.0, 16.0, 0.0),
    'tripe': (94, 11.7, 0.0, 4.1, 0.0),
    'oxtail': (250, 22.0, 0.0, 18.0, 0.0),
    'cowheel': (220, 20.0, 0.0, 15.0, 0.0),
    'saltfish': (140, 25.0, 0.0, 4.0, 0.0),
    'tuna': (132, 28.0, 0.0, 1.3, 0.0),
    'crab': (97, 19.0, 0.0, 1.5, 0.0),
    'iguana': (110, 22.0, 0.0, 2.5, 0.0),
    'lobster': (119, 25.0, 0.0, 1.2, 0.0),
    'rabbit': (173, 33.0, 0.0, 3.5, 0.0),
    'egg': (143, 12.6, 0.7, 9.5, 0.0),
    'bacon': (468, 33.0, 1.4, 37.0, 0.0),
    'sausage': (300, 14.0, 2.0, 26.0, 0.0),
    'salami': (336, 22.0, 1.0, 27.0, 0.0),
    'ham': (145, 18.0, 1.5, 7.0, 0.0),
    'chicharron': (568, 28.0, 0.0, 50.0, 0.0),
    'turkey': (135, 30.0, 0.0, 1.0, 0.0),
    'ground_beef': (240, 23.0, 0.0, 16.0, 0.0),
    'jerk_chicken': (190, 26.0, 4.0, 7.5, 0.3),
    'rice': (130, 2.7, 28.0, 0.3, 0.4),
    'rice_coconut': (165, 2.5, 28.0, 5.0, 0.5),
    'funchi': (82, 1.8, 17.1, 0.8, 1.6),
    'pasta': (158, 5.8, 31.0, 0.9, 1.8),
    'potato': (86, 1.7, 18.0, 0.1, 1.8),
    'sweet_potato': (90, 2.0, 20.7, 0.2, 3.0),
    'sweet_potato_fried': (220, 2.0, 30.0, 10.0, 3.0),
    'yuca': (160, 1.4, 38.0, 0.3, 1.8),
    'yuca_fried': (280, 1.5, 40.0, 13.0, 1.8),
    'yam': (116, 1.5, 27.6, 0.1, 4.0),
    'taro': (142, 0.5, 35.0, 0.1, 5.0),
    'breadfruit': (108, 1.1, 27.0, 0.2, 4.9),
    'plantain': (122, 1.3, 32.0, 0.4, 2.3),
    'plantain_boiled': (116, 0.8, 31.0, 0.2, 2.3),
    'plantain_fried': (236, 1.4, 40.8, 7.5, 3.2),  # USDA FDC 168200
    'tostones': (250, 1.5, 38.0, 11.0, 3.0),
    'mangu': (141, 1.3, 30.9, 2.9, 2.2),  # USDA FDC 2709561 style
    'arepa': (218, 5.5, 40.0, 4.5, 4.0),
    'flour': (364, 10.0, 76.0, 1.0, 2.7),
    'bread': (265, 9.0, 49.0, 3.2, 2.7),
    'white_roll': (270, 9.0, 50.0, 3.5, 2.5),
    'corn_tortilla': (218, 5.7, 45.0, 2.9, 6.3),
    'wheat_tortilla': (300, 8.0, 50.0, 8.0, 3.0),
    'corn': (96, 3.4, 21.0, 1.5, 2.4),
    'hominy': (72, 1.5, 14.0, 0.9, 2.5),
    'cornmeal_dry': (362, 8.1, 76.9, 3.6, 7.3),
    'dumpling': (220, 5.0, 42.0, 4.0, 1.5),
    'johnny_cake': (310, 6.0, 42.0, 13.0, 1.8),
    'pastry_fried': (420, 6.0, 40.0, 26.0, 1.5),
    'pastry_baked': (330, 7.0, 40.0, 16.0, 1.5),
    'bami': (165, 5.5, 25.0, 5.0, 1.5),
    'beans_black': (132, 8.9, 23.7, 0.5, 8.7),
    'beans_kidney': (127, 8.7, 22.8, 0.5, 6.4),
    'beans_red': (127, 8.7, 22.8, 0.5, 6.4),
    'beans_pigeon': (121, 6.8, 23.0, 0.4, 6.5),
    'lentils': (116, 9.0, 20.0, 0.4, 7.9),
    'chickpeas': (164, 8.9, 27.0, 2.6, 7.6),
    'split_peas': (118, 8.3, 21.0, 0.4, 8.3),
    'blackeyed': (116, 7.7, 20.8, 0.5, 6.5),
    'peanuts': (567, 25.8, 16.1, 49.2, 8.5),
    'peanut_sauce': (280, 10.0, 12.0, 22.0, 3.0),
    'onion': (40, 1.1, 9.3, 0.1, 1.7),
    'tomato': (18, 0.9, 3.9, 0.2, 1.2),
    'pepper': (31, 1.0, 6.0, 0.3, 2.1),
    'carrot': (41, 0.9, 9.6, 0.2, 2.8),
    'celery': (16, 0.7, 3.0, 0.2, 1.6),
    'cabbage': (25, 1.3, 6.0, 0.1, 2.5),
    'spinach': (23, 2.9, 3.6, 0.4, 2.2),
    'callaloo': (32, 3.2, 5.3, 0.5, 3.5),
    'okra': (33, 1.9, 7.5, 0.2, 3.2),
    'pumpkin': (26, 1.0, 6.5, 0.1, 0.5),
    'kadushi': (16, 1.3, 3.3, 0.1, 2.2),
    'avocado': (160, 2.0, 8.5, 14.7, 6.7),
    'mixed_veg': (35, 1.5, 7.0, 0.3, 2.0),
    'garlic': (149, 6.4, 33.0, 0.5, 2.1),
    'lettuce': (15, 1.4, 2.9, 0.2, 1.3),
    'cucumber': (15, 0.7, 3.6, 0.1, 0.5),
    'chayote': (19, 0.8, 4.5, 0.1, 1.7),
    'olives': (115, 0.8, 6.0, 10.7, 3.2),
    'raisins': (299, 3.1, 79.0, 0.5, 3.7),
    'pickle': (32, 0.4, 7.0, 0.2, 1.2),
    'oil': (884, 0.0, 0.0, 100.0, 0.0),
    'butter': (717, 0.9, 0.1, 81.0, 0.0),
    'coconut_milk': (197, 2.0, 6.0, 21.0, 2.2),
    'coconut_water': (19, 0.7, 3.7, 0.2, 1.1),
    'coconut_grated': (354, 3.3, 15.0, 33.0, 9.0),
    'edam': (357, 25.0, 1.4, 28.0, 0.0),
    'cheese': (356, 25.0, 0.0, 28.0, 0.0),
    'queso_fresco': (264, 18.0, 3.0, 20.0, 0.0),
    'milk': (61, 3.2, 4.8, 3.3, 0.0),
    'evaporated_milk': (134, 6.8, 10.0, 7.5, 0.0),
    'condensed_milk': (321, 8.0, 54.0, 8.7, 0.0),
    'cream': (340, 2.0, 3.0, 36.0, 0.0),
    'yogurt': (61, 3.5, 4.7, 3.3, 0.0),
    'sour_cream': (193, 2.1, 4.6, 19.0, 0.0),
    'sugar': (387, 0.0, 100.0, 0.0, 0.0),
    'honey': (304, 0.3, 82.0, 0.0, 0.0),
    'stock': (8, 1.0, 0.5, 0.3, 0.0),
    'water': (0, 0.0, 0.0, 0.0, 0.0),
    'sofrito': (80, 1.5, 6.0, 6.0, 1.5),
    'tomato_sauce': (29, 1.3, 6.0, 0.2, 1.5),
    'lime_juice': (25, 0.4, 8.4, 0.1, 0.4),
    'rum': (231, 0.0, 0.0, 0.0, 0.0),
    'beer': (43, 0.5, 3.6, 0.0, 0.0),
    'orange_juice': (45, 0.7, 10.4, 0.2, 0.2),
    'coffee': (2, 0.1, 0.0, 0.0, 0.0),
    'masa': (194, 4.5, 41.0, 1.5, 3.5),
    'ackee': (151, 2.9, 0.8, 15.2, 0.0),
    'cassareep': (120, 0.5, 28.0, 0.1, 0.5),
    'macaroni_salad': (200, 5.0, 22.0, 10.0, 1.0),
    'coleslaw': (110, 1.0, 10.0, 8.0, 2.0),
    'mango': (60, 0.8, 15.0, 0.4, 1.6),
    'papaya': (43, 0.5, 11.0, 0.3, 1.7),
    'pineapple': (50, 0.5, 13.0, 0.1, 1.4),
    'banana': (89, 1.1, 22.8, 0.3, 2.6),
    'soursop': (66, 1.0, 16.8, 0.3, 3.3),
    'passionfruit': (97, 2.2, 23.4, 0.7, 10.4),
    'tamarind': (239, 2.8, 62.5, 0.6, 5.1),
    'sorrel': (49, 0.4, 12.0, 0.1, 0.5),  # sweetened drink base estimate later
    'ice': (0, 0.0, 0.0, 0.0, 0.0),
    'mayo': (680, 1.0, 1.5, 75.0, 0.0),
    'ketchup': (112, 1.0, 25.0, 0.2, 0.3),
}

REGIONS = {
    'cw': 'Curaçao',
    'aw': 'Aruba',
    'bq': 'Bonaire',
    'sx': 'Bovenwindse eilanden',
    'cu': 'Cuba',
    'do': 'Dominicaanse Republiek',
    'pr': 'Puerto Rico',
    'ht': 'Haïti',
    'jm': 'Jamaica',
    'tt': 'Trinidad en Tobago',
    'bb': 'Barbados en Oost-Caribisch',
    'gp': 'Franse Antillen',
    'bs': "Bahama's, Cayman en Turks",
    'sr': 'Suriname',
    'gy': 'Guyana',
    'bz': 'Belize',
    've': 'Venezuela',
    'co': 'Colombia',
    'br': 'Brazilië',
    'pe': 'Peru',
    'ec': 'Ecuador',
    'bo': 'Bolivia',
    'ar': 'Argentinië',
    'cl': 'Chili',
    'uy': 'Uruguay',
    'py': 'Paraguay',
    'mx': 'Mexico',
    'gt': 'Guatemala',
    'sv': 'El Salvador',
    'hn': 'Honduras',
    'ni': 'Nicaragua',
    'cr': 'Costa Rica',
    'pa': 'Panama',
    'car': 'Caribisch gebied',
}

# Filter dropdown: key -> list of region codes (or '*' for all latam/caribbean items)
FILTERS = [
    ('latam', 'Caribisch & Latijns-Amerika', '*'),
    ('car', 'Heel het Caribisch gebied', 'CAR'),
    ('cw', 'Curaçao', ['cw']),
    ('aw', 'Aruba', ['aw']),
    ('bq', 'Bonaire', ['bq']),
    ('abc', 'ABC-eilanden', ['cw', 'aw', 'bq']),
    ('sx', 'Bovenwindse eilanden', ['sx']),
    ('cu', 'Cuba', ['cu']),
    ('do', 'Dominicaanse Republiek', ['do']),
    ('pr', 'Puerto Rico', ['pr']),
    ('ht', 'Haïti', ['ht']),
    ('jm', 'Jamaica', ['jm']),
    ('tt', 'Trinidad en Tobago', ['tt']),
    ('bb', 'Barbados & Oost-Caribisch', ['bb']),
    ('gp', 'Franse Antillen', ['gp']),
    ('bs', "Bahama's, Cayman & Turks", ['bs']),
    ('sr', 'Suriname', ['sr']),
    ('gy', 'Guyana & Belize', ['gy', 'bz']),
    ('ve', 'Venezuela', ['ve']),
    ('co', 'Colombia', ['co']),
    ('br', 'Brazilië', ['br']),
    ('pe', 'Peru & Andes', ['pe', 'ec', 'bo']),
    ('ar', 'Argentinië, Chili & Zuidkegel', ['ar', 'cl', 'uy', 'py']),
    ('mx', 'Mexico', ['mx']),
    ('ca', 'Centraal-Amerika', ['gt', 'sv', 'hn', 'ni', 'cr', 'pa', 'bz']),
]

CARIBBEAN_RG = {
    'cw', 'aw', 'bq', 'sx', 'cu', 'do', 'pr', 'ht', 'jm', 'tt',
    'bb', 'gp', 'bs', 'sr', 'gy', 'bz', 'car',
}

SRC = 'Schatting (typisch recept, USDA/NEVO-basisingrediënten)'
SRC_USDA = 'USDA FoodData Central (per 100 g, typische waarde)'
SRC_ALC = 'Schatting (typisch recept; kcal deels uit alcohol)'

ITEMS = {}  # id -> dict
ORDER = []


def r1(x):
    return round(float(x) + 1e-9, 1)


def r0(x):
    return int(round(float(x) + 1e-9))


def macros_of(parts):
    """parts: list of (name, grams) where name is ING key or existing item id."""
    tot_g = 0.0
    acc = [0.0, 0.0, 0.0, 0.0, 0.0]  # kcal p c f fib
    for name, g in parts:
        g = float(g)
        if g <= 0:
            raise ValueError('bad grams for %s' % name)
        if name in ITEMS:
            m = ITEMS[name]
            row = (m['kcal'], m['p'], m['c'], m['f'], m['fib'])
        elif name in ING:
            row = ING[name]
        else:
            raise KeyError('Unknown ingredient or dish: %s' % name)
        tot_g += g
        for i in range(5):
            acc[i] += row[i] * g / 100.0
    if tot_g <= 0:
        raise ValueError('empty recipe')
    per = [acc[i] * 100.0 / tot_g for i in range(5)]
    return {
        'kcal': r0(per[0]),
        'p': r1(per[1]),
        'c': r1(per[2]),
        'f': r1(per[3]),
        'fib': r1(per[4]),
        'yield': r0(tot_g),
    }


def add(id, nl, en, al, cat, rg, g, portion, parts, src=SRC):
    if id in ITEMS:
        raise ValueError('duplicate id %s' % id)
    if rg not in REGIONS:
        raise ValueError('unknown region %s for %s' % (rg, id))
    m = macros_of(parts)
    rec = {
        'id': id,
        'en': en,
        'nl': nl,
        'al': al.strip(),
        'cat': cat,
        'kcal': m['kcal'],
        'p': m['p'],
        'c': m['c'],
        'f': m['f'],
        'fib': m['fib'],
        'g': int(g),
        'portion': portion,
        'src': src,
        'rg': rg,
    }
    ITEMS[id] = rec
    ORDER.append(id)
    return rec


def simple(id, nl, en, al, cat, rg, g, portion, ing_key, src=SRC_USDA):
    return add(id, nl, en, al, cat, rg, g, portion, [(ing_key, 100)], src=src)


# ---------------------------------------------------------------------------
# ABC islands — staples first (referenced by plates)
# ---------------------------------------------------------------------------

simple('lat-funchi', 'Funchi', 'Funchi (cornmeal mush)',
       'funchi funchi polenta maismeel maishi curacao curaçao korsou korçao bonaire aruba abc',
       'carb', 'cw', 180, '1 portie', 'funchi', src=SRC)

add('lat-funchi-botter', 'Funchi ku botter (funchi met boter)', 'Funchi with butter',
    'funchi ku botter funchi met boter butter funchi',
    'carb', 'cw', 180, '1 portie',
    [('funchi', 170), ('butter', 10)])

simple('lat-aros', 'Aros (witte rijst)', 'White rice',
       'aros rijst witte rijst aros blanco rice curacao curaçao',
       'carb', 'cw', 180, '1 portie', 'rice', src=SRC_USDA)

add('lat-aros-moro', 'Aros moro (rijst met bonen)', 'Aros moro (rice and beans)',
    'aros moro moro rijst met bonen moro di bonchi rice and beans moros curacao curaçao aruba bonaire',
    'carb', 'cw', 200, '1 portie',
    [('rice', 130), ('beans_kidney', 60), ('sofrito', 8), ('oil', 2)])

add('lat-aros-koko', 'Aros di koko (kokosrijst)', 'Coconut rice',
    'aros di koko aros ku koko kokosrijst coconut rice aros coco curacao curaçao',
    'carb', 'cw', 180, '1 portie',
    [('rice', 140), ('coconut_milk', 40)])

simple('lat-banana-hasi', 'Banana hasá (gebakken bakbanaan)', 'Fried ripe plantain',
       'banana hasa banana hasá banana hasi gebakken bakbanaan bakbanaan hasa platano maduro maduros curacao curaçao',
       'carb', 'cw', 120, '1 portie', 'plantain_fried', src=SRC_USDA)

simple('lat-batata-dushi-hasi', 'Batata dushi hasá (gebakken zoete aardappel)', 'Fried sweet potato',
       'batata dushi hasa batata dushi hasí batata dushi hasi zoete aardappel gebakken bataat fried sweet potato curacao curaçao',
       'carb', 'cw', 120, '1 portie', 'sweet_potato_fried', src=SRC)

simple('lat-yuca', 'Yuca (gekookte cassave)', 'Boiled yuca / cassava',
       'yuca cassave kasava yuca wea yuca hinki gekookte yuca curacao curaçao',
       'carb', 'cw', 150, '1 portie', 'yuca', src=SRC_USDA)

simple('lat-yuca-hasi', 'Yuca hasá (gebakken cassave)', 'Fried yuca',
       'yuca hasa yuca hasí yuca frita gebakken cassave curacao curaçao',
       'snack', 'cw', 120, '1 portie', 'yuca_fried', src=SRC)

add('lat-tutu', 'Tutu (puree van black-eyed peas)', 'Tutu (mashed black-eyed peas)',
    'tutu tutu di bonchi tutu di beju black eyed peas doperwt puree curacao curaçao bonaire',
    'carb', 'cw', 180, '1 portie',
    [('blackeyed', 150), ('butter', 12), ('sugar', 8), ('onion', 10)])

add('lat-pega-pega', 'Pega-pega (aangebakken rijstkorst)', 'Pega-pega (crispy rice crust)',
    'pega pega pegapega rijstkorst crispy rice curacao curaçao',
    'carb', 'cw', 80, '1 portie',
    [('rice', 70), ('oil', 10)])

add('lat-pan-bati', 'Pan bati (sorghum/mais pannenkoek)', 'Pan bati',
    'pan bati pambati pannenkoek sorghum arepa di maishi aruba curacao curaçao bonaire',
    'carb', 'aw', 70, '1 stuk',
    [('cornmeal_dry', 28), ('flour', 8), ('milk', 25), ('oil', 6), ('sugar', 3)])

add('lat-arepa-pampuna', 'Arepa di pampuna (pompoenarepa)', 'Pumpkin arepa',
    'arepa di pampuna arepa pampuna pompoenarepa pumpkin arepa curacao curaçao aruba bonaire',
    'carb', 'cw', 80, '1 stuk',
    [('flour', 25), ('pumpkin', 30), ('sugar', 6), ('oil', 8), ('egg', 11)])

simple('lat-pan', 'Pan (brood, punt of snee)', 'Bread (roll or slice)',
       'pan brood puntje bolletje sandwich curacao curaçao',
       'carb', 'cw', 60, '1 stuk', 'white_roll', src=SRC_USDA)

add('lat-pan-seku', 'Pan seku (johnnycake / droog brood)', 'Pan seku (johnnycake)',
    'pan seku pan seco johnnycake johnny cake johnnycakes curacao curaçao aruba sint maarten',
    'carb', 'cw', 70, '1 stuk',
    [('flour', 40), ('oil', 10), ('water', 18), ('sugar', 2)])

add('lat-papa-maishi', 'Papa di maishi (mais pap)', 'Cornmeal porridge',
    'papa di maishi mais pap cornmeal porridge ontbijt funchi zacht curacao curaçao',
    'meal', 'cw', 250, '1 kom',
    [('cornmeal_dry', 40), ('milk', 150), ('water', 50), ('sugar', 10)])

# sauces / condiments
add('lat-pika', 'Pika (pittige ui-pepersaus)', 'Pika (hot pepper relish)',
    'pika piká pika korsou pika curacao peper saus sambal ui paprika hot sauce curacao curaçao aruba bonaire',
    'fat', 'cw', 20, '1 lepel',
    [('onion', 40), ('pepper', 30), ('lime_juice', 15), ('oil', 10), ('tomato', 5)])

add('lat-salsa-pinda', 'Salsa di pinda (pindasaus)', 'Peanut sauce',
    'salsa di pinda pindasaus pinda saus satésaus satay saus curacao curaçao aruba',
    'fat', 'cw', 40, '2 eetlepels',
    [('peanut_sauce', 100)], src=SRC)

add('lat-salsa-krioyo', 'Salsa krioyo (creoolse saus)', 'Creole salsa',
    'salsa krioyo salsa criollo creoolse saus ui tomaat paprika curacao curaçao',
    'veg', 'cw', 40, '2 eetlepels',
    [('tomato', 40), ('onion', 25), ('pepper', 20), ('oil', 8), ('lime_juice', 7)])

# stews / proteins
add('lat-karni-stoba', 'Karni stoba (stoofvlees)', 'Karni stoba (beef stew)',
    'karni stoba carni stoba stoofvlees rundvlees stoba beef stew curacao curaçao aruba bonaire abc',
    'meal', 'cw', 250, '1 portie',
    [('beef_stew', 130), ('potato', 50), ('onion', 25), ('pepper', 15), ('tomato', 15), ('carrot', 10), ('oil', 5)])

add('lat-galina-stoba', 'Galiña stoba (gestoofde kip)', 'Galiña stoba (chicken stew)',
    'galina stoba galiña stoba gallina stoba kippenstoofpot gestoofde kip chicken stew curacao curaçao aruba bonaire',
    'meal', 'cw', 250, '1 portie',
    [('chicken_stew', 130), ('potato', 50), ('onion', 25), ('pepper', 15), ('tomato', 15), ('carrot', 10), ('oil', 5)])

add('lat-kabritu-stoba', 'Kabritu stoba (gestoofde geit)', 'Kabritu stoba (goat stew)',
    'kabritu stoba cabrito stoba geitenstoofpot gestoofde geit goat stew curacao curaçao aruba bonaire',
    'meal', 'cw', 250, '1 portie',
    [('goat', 130), ('potato', 45), ('onion', 25), ('pepper', 15), ('tomato', 15), ('carrot', 10), ('sofrito', 5), ('oil', 5)])

add('lat-bestia-chiki-stoba', 'Bestia chikí stoba (stoofpot van klein vee)', 'Bestia chikí stoba (small livestock stew)',
    'bestia chiki stoba bestia chikí bestia chiki stoofpot klein vee geit konijn konehu konèhu rabbit goat curacao curaçao',
    'meal', 'cw', 250, '1 portie',
    [('goat', 70), ('rabbit', 60), ('potato', 45), ('onion', 25), ('pepper', 15), ('tomato', 15), ('oil', 5), ('sofrito', 15)])

add('lat-piska-stoba', 'Piska stoba (visstoofpot)', 'Piska stoba (fish stew)',
    'piska stoba visstoofpot fish stew curacao curaçao',
    'meal', 'cw', 250, '1 portie',
    [('fish_white', 130), ('potato', 50), ('onion', 25), ('tomato', 20), ('pepper', 15), ('oil', 5), ('lime_juice', 5)])

add('lat-piska-kora-hasi', 'Piska kora hasá (gebakken rode snapper)', 'Fried red snapper',
    'piska kora hasa piska kora hasí piska kora hasi piska kora gebakken snapper red snapper paru fried fish curacao curaçao bonaire aruba',
    'protein', 'cw', 180, '1 filet',
    [('snapper', 160), ('oil', 15), ('lime_juice', 5)])

add('lat-piska-hasi', 'Piska hasá (gebakken vis)', 'Fried fish',
    'piska hasa piska hasí piska hasi gebakken vis fried fish vis hasa curacao curaçao aruba bonaire',
    'protein', 'cw', 180, '1 stuk',
    [('fish_white', 160), ('oil', 15), ('lime_juice', 5)])

add('lat-karko-stoba', 'Karko stoba (gestoofde karko / conch)', 'Conch stew',
    'karko stoba kòkòlò kokolo conch stew karko curacao curaçao aruba bonaire',
    'meal', 'cw', 250, '1 portie',
    [('conch', 130), ('onion', 30), ('pepper', 20), ('tomato', 30), ('potato', 30), ('oil', 10)])

add('lat-karko-hasi', 'Karko hasá (gebakken karko)', 'Fried conch',
    'karko hasa karko hasí gebakken karko fried conch curacao curaçao aruba',
    'protein', 'cw', 120, '1 portie',
    [('conch', 100), ('flour', 8), ('oil', 12)])

add('lat-bakiou-stoba', 'Bakiou stoba (gestoofde bakkeljauw)', 'Saltfish stew',
    'bakiou stoba bakalou bakkeljauw bacalao bakalaw bakiou gestoofde bakkeljauw saltfish stew curacao curaçao aruba',
    'meal', 'cw', 220, '1 portie',
    [('saltfish', 110), ('onion', 30), ('pepper', 25), ('tomato', 30), ('oil', 15), ('potato', 10)])

add('lat-sata-bakiou', 'Satá di bakiou (bakkeljauwsalade)', 'Saltfish salad',
    'sata di bakiou satá di bakiou bakalou salade bakkeljauwsalade saltfish salad bacalao curacao curaçao',
    'meal', 'cw', 180, '1 portie',
    [('saltfish', 80), ('onion', 30), ('pepper', 25), ('tomato', 25), ('oil', 15), ('lime_juice', 5)])

add('lat-keshi-yena', 'Keshi yena (gevulde kaas)', 'Keshi yena (stuffed cheese)',
    'keshi yena keshi yená kechi yena gevulde kaas stuffed edam edammer kip rozijnen curacao curaçao aruba bonaire abc',
    'meal', 'cw', 200, '1 portie',
    [('edam', 80), ('chicken_stew', 70), ('onion', 12), ('raisins', 8), ('olives', 8), ('tomato', 10), ('oil', 5), ('pickle', 7)])

add('lat-yuana-stoba', 'Yuana stoba (gestoofde leguaan)', 'Iguana stew',
    'yuana stoba leguaan iguana iuana gestoofde yuana curacao curaçao bonaire aruba',
    'meal', 'cw', 250, '1 portie',
    [('iguana', 130), ('potato', 45), ('onion', 25), ('pepper', 15), ('tomato', 20), ('oil', 8), ('sofrito', 7)])

add('lat-rabo-stoba', 'Rabo stoba (gestoofde ossenstaart)', 'Oxtail stew',
    'rabo stoba ossenstaart oxtail stoba rabo di baka curacao curaçao',
    'meal', 'cw', 250, '1 portie',
    [('oxtail', 140), ('potato', 40), ('onion', 25), ('pepper', 15), ('tomato', 20), ('oil', 5), ('carrot', 5)])

add('lat-bonchi-stoba', 'Stoba di bonchi (bonenstoofpot)', 'Bean stew',
    'stoba di bonchi bonchi stoba bonenstoofpot bean stew curacao curaçao',
    'meal', 'cw', 250, '1 portie',
    [('beans_kidney', 150), ('onion', 25), ('tomato', 25), ('pepper', 15), ('sofrito', 15), ('oil', 10), ('pumpkin', 10)])

add('lat-kabritu-hasi', 'Kabritu hasá (gebakken geit)', 'Fried goat',
    'kabritu hasa kabritu hasí gebakken geit fried goat curacao curaçao',
    'protein', 'cw', 150, '1 portie',
    [('goat', 135), ('oil', 15)])

add('lat-spareribs-krioyo', 'Spareribs krioyo (creoolse spareribs)', 'Creole spareribs',
    'spareribs krioyo spareribs criollo ribs curacao curaçao',
    'protein', 'cw', 200, '1 portie',
    [('pork_fatty', 170), ('sofrito', 15), ('sugar', 5), ('oil', 10)])

# soups ABC
add('lat-sopi-piska', 'Sopi di piska (vissoep)', 'Sopi di piska (fish soup)',
    'sopi di piska sòpi di piska vissoep fish soup sopi piska curacao curaçao aruba bonaire abc',
    'soup', 'cw', 350, '1 kom',
    [('fish_white', 90), ('potato', 60), ('onion', 25), ('tomato', 25), ('pepper', 15), ('carrot', 15), ('stock', 110), ('oil', 5), ('celery', 5)])

add('lat-sopi-mondongo', 'Sopi mondongo (penssoep)', 'Sopi mondongo (tripe soup)',
    'sopi mondongo sòpi mondongo penssoep tripe soup mondongo curacao curaçao aruba bonaire abc',
    'soup', 'cw', 350, '1 kom',
    [('tripe', 90), ('potato', 50), ('onion', 25), ('tomato', 25), ('pepper', 15), ('carrot', 20), ('stock', 115), ('oil', 5), ('celery', 5)])

add('lat-sopi-yuana', 'Sopi di yuana (leguaansoep)', 'Iguana soup',
    'sopi di yuana sòpi di yuana leguanensoep iguana soup curacao curaçao bonaire',
    'soup', 'cw', 350, '1 kom',
    [('iguana', 90), ('potato', 50), ('onion', 25), ('pepper', 15), ('tomato', 20), ('carrot', 15), ('stock', 125), ('oil', 5), ('celery', 5)])

add('lat-sopi-kadushi', 'Sopi di kadushi (cactussoep)', 'Kadushi (cactus soup)',
    'sopi di kadushi sòpi di kadushi kadushi cadushi cactussoep cactus soup kadushi soep bonaire curacao curaçao abc',
    'soup', 'cw', 350, '1 kom',
    [('kadushi', 120), ('goat', 50), ('onion', 25), ('pepper', 15), ('stock', 125), ('oil', 8), ('fish_white', 7)])

add('lat-sopi-kadushi-funchi', 'Sopi di kadushi ku funchi', 'Cactus soup with funchi',
    'sopi di kadushi ku funchi kadushi ku funchi cadushi funchi curacao curaçao bonaire',
    'soup', 'cw', 450, '1 kom',
    [('lat-sopi-kadushi', 320), ('lat-funchi', 130)])

add('lat-sopi-pampuna', 'Sòpi di pampuna (pompoensoep)', 'Pumpkin soup',
    'sopi di pampuna sòpi di pampuna sopi pampuna pompoensoep pumpkin soup curacao curaçao aruba bonaire',
    'soup', 'cw', 350, '1 kom',
    [('pumpkin', 180), ('onion', 25), ('potato', 40), ('coconut_milk', 40), ('stock', 55), ('oil', 5), ('milk', 5)])

add('lat-sopi-bonchi', 'Sopi di bonchi (bonensoep)', 'Bean soup',
    'sopi di bonchi sòpi di bonchi bonensoep bean soup curacao curaçao',
    'soup', 'cw', 350, '1 kom',
    [('beans_kidney', 140), ('onion', 25), ('tomato', 25), ('carrot', 20), ('potato', 30), ('stock', 100), ('oil', 5), ('sofrito', 5)])

add('lat-sopi-galina', 'Sopi di galiña (kippensoep)', 'Chicken soup',
    'sopi di galina sopi di galiña sòpi di galiña kippensoep chicken soup curacao curaçao',
    'soup', 'cw', 350, '1 kom',
    [('chicken_stew', 90), ('potato', 50), ('carrot', 25), ('onion', 25), ('celery', 15), ('stock', 130), ('oil', 5), ('pepper', 10)])

add('lat-sopi-karni', 'Sopi di karni (vlees soep)', 'Beef soup',
    'sopi di karni sòpi di karni vlees soep rundensoep beef soup curacao curaçao',
    'soup', 'cw', 350, '1 kom',
    [('beef_stew', 90), ('potato', 50), ('carrot', 25), ('onion', 25), ('celery', 15), ('stock', 130), ('oil', 5), ('pepper', 10)])

add('lat-sopi-kabritu', 'Sopi di kabritu (geitensoep)', 'Goat soup',
    'sopi di kabritu sòpi di kabritu geitensoep goat soup curacao curaçao aruba bonaire',
    'soup', 'cw', 350, '1 kom',
    [('goat', 90), ('potato', 50), ('carrot', 20), ('onion', 25), ('celery', 15), ('stock', 135), ('oil', 5), ('pepper', 10)])

add('lat-sopi-karko', 'Sopi di karko (karkosoep)', 'Conch soup',
    'sopi di karko sòpi di karko karkosoep conch soup curacao curaçao aruba bonaire',
    'soup', 'cw', 350, '1 kom',
    [('conch', 90), ('potato', 50), ('onion', 25), ('pepper', 15), ('tomato', 25), ('stock', 130), ('oil', 8), ('carrot', 7)])

add('lat-sopi-bakiou', 'Sopi di bakiou (bakkeljauwsoep)', 'Saltfish soup',
    'sopi di bakiou sopi di bakalou bakkeljauwsoep saltfish soup bacalao soep curacao curaçao',
    'soup', 'cw', 350, '1 kom',
    [('saltfish', 80), ('potato', 60), ('onion', 30), ('pepper', 20), ('tomato', 25), ('stock', 125), ('oil', 10)])

add('lat-yambo', 'Yambo / giambo (okrasoep)', 'Yambo / giambo (okra soup)',
    'yambo giambo guiambo jambo okra soep okrasoep gumbo curacao curaçao aruba bonaire abc',
    'soup', 'cw', 300, '1 kom',
    [('okra', 100), ('fish_white', 50), ('shrimp', 20), ('onion', 20), ('tomato', 25), ('stock', 70), ('oil', 8), ('pepper', 7)])

add('lat-sopi-rabo', 'Sopi di rabo (ossenstaartsoep)', 'Oxtail soup',
    'sopi di rabo sòpi di rabo ossenstaartsoep oxtail soup curacao curaçao',
    'soup', 'cw', 350, '1 kom',
    [('oxtail', 90), ('potato', 50), ('carrot', 25), ('onion', 25), ('celery', 15), ('stock', 130), ('oil', 5), ('pepper', 10)])

add('lat-sopi-banana', 'Sopi di banana (bakbanaansoep)', 'Plantain soup',
    'sopi di banana sòpi di banana bakbanaansoep plantain soup curacao curaçao',
    'soup', 'cw', 350, '1 kom',
    [('plantain_boiled', 120), ('chicken_stew', 50), ('onion', 25), ('stock', 140), ('oil', 5), ('pepper', 10)])

add('lat-sopi-yuca', 'Sopi di yuca (cassavesoep)', 'Yuca soup',
    'sopi di yuca sòpi di yuca cassavesoep yuca soup curacao curaçao',
    'soup', 'cw', 350, '1 kom',
    [('yuca', 120), ('chicken_stew', 50), ('onion', 25), ('stock', 140), ('oil', 5), ('pepper', 10)])

add('lat-sopi-krioyo', 'Sopi krioyo (creoolse soep)', 'Creole soup',
    'sopi krioyo sòpi krioyo creoolse soep sopi criollo curacao curaçao',
    'soup', 'cw', 350, '1 kom',
    [('beef_stew', 50), ('chicken_stew', 40), ('potato', 40), ('pumpkin', 30), ('plantain_boiled', 30), ('yuca', 25), ('onion', 20), ('stock', 100), ('oil', 5), ('carrot', 10)])

# complete ABC plates
add('lat-karni-stoba-aros', 'Karni stoba ku aros (stoofvlees met rijst)', 'Beef stew with rice',
    'karni stoba ku aros karni stoba ku arroz stoofvlees met rijst carni stoba ku aros curacao curaçao aruba bonaire',
    'meal', 'cw', 380, '1 bord',
    [('lat-karni-stoba', 200), ('lat-aros', 180)])

add('lat-karni-stoba-funchi', 'Karni stoba ku funchi', 'Beef stew with funchi',
    'karni stoba ku funchi stoofvlees met funchi curacao curaçao bonaire',
    'meal', 'cw', 400, '1 bord',
    [('lat-karni-stoba', 220), ('lat-funchi', 180)])

add('lat-karni-stoba-moro', 'Karni stoba ku aros moro', 'Beef stew with rice and beans',
    'karni stoba ku aros moro stoofvlees met moro curacao curaçao',
    'meal', 'cw', 420, '1 bord',
    [('lat-karni-stoba', 200), ('lat-aros-moro', 180), ('lat-banana-hasi', 40)])

add('lat-galina-stoba-funchi', 'Galiña stoba ku funchi', 'Chicken stew with funchi',
    'galina stoba ku funchi galiña stoba ku funchi kip stoofpot met funchi curacao curaçao bonaire aruba',
    'meal', 'cw', 430, '1 bord',
    [('lat-galina-stoba', 250), ('lat-funchi', 180)])

add('lat-galina-stoba-aros', 'Galiña stoba ku aros', 'Chicken stew with rice',
    'galina stoba ku aros galiña stoba ku aros kip met rijst curacao curaçao',
    'meal', 'cw', 430, '1 bord',
    [('lat-galina-stoba', 250), ('lat-aros', 180)])

add('lat-kabritu-stoba-moro', 'Kabritu stoba ku aros moro', 'Goat stew with rice and beans',
    'kabritu stoba ku aros moro cabrito stoba ku aros moro geit met moro curacao curaçao aruba bonaire',
    'meal', 'cw', 430, '1 bord',
    [('lat-kabritu-stoba', 230), ('lat-aros-moro', 200)])

add('lat-kabritu-stoba-funchi', 'Kabritu stoba ku funchi', 'Goat stew with funchi',
    'kabritu stoba ku funchi geit met funchi curacao curaçao bonaire',
    'meal', 'cw', 430, '1 bord',
    [('lat-kabritu-stoba', 250), ('lat-funchi', 180)])

add('lat-kabritu-stoba-aros', 'Kabritu stoba ku aros', 'Goat stew with rice',
    'kabritu stoba ku aros geit met rijst curacao curaçao aruba',
    'meal', 'cw', 430, '1 bord',
    [('lat-kabritu-stoba', 250), ('lat-aros', 180)])

add('lat-bestia-chiki-aros', 'Bestia chikí stoba ku aros', 'Small livestock stew with rice',
    'bestia chiki stoba ku aros bestia chikí ku aros curacao curaçao',
    'meal', 'cw', 430, '1 bord',
    [('lat-bestia-chiki-stoba', 250), ('lat-aros', 180)])

add('lat-piska-kora-funchi', 'Piska kora hasá ku funchi', 'Fried red snapper with funchi',
    'piska kora hasi ku funchi piska kora hasá ku funchi piska kora hasí ku funchi gebakken snapper met funchi curacao curaçao bonaire',
    'meal', 'cw', 360, '1 bord',
    [('lat-piska-kora-hasi', 180), ('lat-funchi', 180)])

add('lat-piska-kora-tutu', 'Piska kora hasá ku tutu', 'Fried red snapper with tutu',
    'piska kora hasi ku tutu piska kora hasá ku tutu piska kora hasí ku tutu gebakken snapper met tutu curacao curaçao',
    'meal', 'cw', 360, '1 bord',
    [('lat-piska-kora-hasi', 180), ('lat-tutu', 180)])

add('lat-piska-funchi-tutu', 'Piska hasá ku funchi i tutu', 'Fried fish with funchi and tutu',
    'piska hasa ku funchi tutu piska hasí ku funchi ku tutu gebakken vis funchi tutu curacao curaçao',
    'meal', 'cw', 480, '1 bord',
    [('lat-piska-hasi', 160), ('lat-funchi', 160), ('lat-tutu', 160)])

add('lat-piska-hasi-aros', 'Piska hasá ku aros', 'Fried fish with rice',
    'piska hasa ku aros piska hasí ku aros gebakken vis met rijst curacao curaçao',
    'meal', 'cw', 360, '1 bord',
    [('lat-piska-hasi', 180), ('lat-aros', 180)])

add('lat-piska-banana', 'Piska hasá ku banana hasá', 'Fried fish with fried plantain',
    'piska hasa ku banana hasa gebakken vis met bakbanaan curacao curaçao',
    'meal', 'cw', 300, '1 bord',
    [('lat-piska-hasi', 180), ('lat-banana-hasi', 120)])

add('lat-keshi-yena-aros', 'Keshi yena ku aros', 'Keshi yena with rice',
    'keshi yena ku aros keshi yena met rijst gevulde kaas met rijst curacao curaçao aruba',
    'meal', 'cw', 380, '1 bord',
    [('lat-keshi-yena', 200), ('lat-aros', 180)])

add('lat-keshi-yena-funchi', 'Keshi yena ku funchi', 'Keshi yena with funchi',
    'keshi yena ku funchi gevulde kaas met funchi curacao curaçao',
    'meal', 'cw', 380, '1 bord',
    [('lat-keshi-yena', 200), ('lat-funchi', 180)])

add('lat-sopi-mondongo-pan', 'Sopi mondongo ku pan', 'Tripe soup with bread',
    'sopi mondongo ku pan sòpi mondongo ku pan penssoep met brood curacao curaçao aruba bonaire',
    'soup', 'cw', 410, '1 kom + brood',
    [('lat-sopi-mondongo', 350), ('lat-pan', 60)])

add('lat-sopi-piska-pan', 'Sopi di piska ku pan', 'Fish soup with bread',
    'sopi di piska ku pan vissoep met brood curacao curaçao',
    'soup', 'cw', 410, '1 kom + brood',
    [('lat-sopi-piska', 350), ('lat-pan', 60)])

add('lat-funchi-yambo', 'Funchi ku yambo (funchi met okrasoep)', 'Funchi with okra soup',
    'funchi ku yambo funchi ku giambo funchi ku guiambo funchi met yambo funchi met giambo curacao curaçao bonaire aruba',
    'meal', 'cw', 430, '1 bord',
    [('lat-funchi', 180), ('lat-yambo', 250)])

add('lat-yambo-aros', 'Yambo ku aros', 'Okra soup with rice',
    'yambo ku aros giambo ku aros okrasoep met rijst curacao curaçao',
    'meal', 'cw', 430, '1 bord',
    [('lat-yambo', 250), ('lat-aros', 180)])

add('lat-tutu-piska', 'Tutu ku piska hasá', 'Tutu with fried fish',
    'tutu ku piska hasa tutu ku piska hasí tutu met gebakken vis curacao curaçao',
    'meal', 'cw', 360, '1 bord',
    [('lat-tutu', 180), ('lat-piska-hasi', 180)])

add('lat-tutu-funchi', 'Tutu ku funchi', 'Tutu with funchi',
    'tutu ku funchi funchi ku tutu curacao curaçao',
    'meal', 'cw', 360, '1 bord',
    [('lat-tutu', 180), ('lat-funchi', 180)])

add('lat-karko-funchi', 'Karko stoba ku funchi', 'Conch stew with funchi',
    'karko stoba ku funchi karko ku funchi curacao curaçao bonaire',
    'meal', 'cw', 430, '1 bord',
    [('lat-karko-stoba', 250), ('lat-funchi', 180)])

add('lat-bakiou-aros', 'Bakiou stoba ku aros', 'Saltfish stew with rice',
    'bakiou stoba ku aros bakalou ku aros bakkeljauw met rijst curacao curaçao',
    'meal', 'cw', 400, '1 bord',
    [('lat-bakiou-stoba', 220), ('lat-aros', 180)])

add('lat-yuana-funchi', 'Yuana stoba ku funchi', 'Iguana stew with funchi',
    'yuana stoba ku funchi leguaan met funchi curacao curaçao bonaire',
    'meal', 'cw', 430, '1 bord',
    [('lat-yuana-stoba', 250), ('lat-funchi', 180)])

add('lat-rabo-aros', 'Rabo stoba ku aros', 'Oxtail stew with rice',
    'rabo stoba ku aros ossenstaart met rijst curacao curaçao',
    'meal', 'cw', 430, '1 bord',
    [('lat-rabo-stoba', 250), ('lat-aros', 180)])

add('lat-karni-stoba-batata', 'Karni stoba ku batata dushi hasá', 'Beef stew with fried sweet potato',
    'karni stoba ku batata dushi stoofvlees met zoete aardappel curacao curaçao',
    'meal', 'cw', 370, '1 bord',
    [('lat-karni-stoba', 250), ('lat-batata-dushi-hasi', 120)])

add('lat-bord-krioyo', 'Bord krioyo (vis hasá, funchi, banana i pika)', 'Creole plate: fried fish, funchi, plantain and pika',
    'bord krioyo plato krioyo creools bord fried fish funchi banana pika curacao curaçao',
    'meal', 'cw', 500, '1 bord',
    [('lat-piska-hasi', 160), ('lat-funchi', 160), ('lat-banana-hasi', 100), ('lat-pika', 20), ('lat-salsa-krioyo', 60)])

add('lat-pan-bati-keshi', 'Pan bati ku keshi', 'Pan bati with cheese',
    'pan bati ku keshi pan bati met kaas aruba curacao curaçao',
    'meal', 'aw', 100, '1 stuk',
    [('lat-pan-bati', 70), ('cheese', 30)])

add('lat-pan-bati-wea', 'Pan bati ku wea (pan bati met ei)', 'Pan bati with egg',
    'pan bati ku wea pan bati met ei aruba ontbijt',
    'meal', 'aw', 125, '1 portie',
    [('lat-pan-bati', 70), ('egg', 55)])

add('lat-pan-bati-piska', 'Pan bati ku piska hasá', 'Pan bati with fried fish',
    'pan bati ku piska pan bati met vis aruba curacao curaçao',
    'meal', 'aw', 250, '1 bord',
    [('lat-pan-bati', 70), ('lat-piska-hasi', 180)])

add('lat-arepa-pampuna-keshi', 'Arepa di pampuna ku keshi', 'Pumpkin arepa with cheese',
    'arepa di pampuna ku keshi arepa pampuna met kaas curacao curaçao',
    'meal', 'cw', 110, '1 stuk',
    [('lat-arepa-pampuna', 80), ('cheese', 30)])

# snacks ABC
add('lat-pastechi-karni', 'Pastechi di karni (vleespastechi)', 'Beef pastechi',
    'pastechi di karni pastechi karni pastechi vlees beef pastechi empanada curacao curaçao aruba bonaire abc',
    'snack', 'cw', 85, '1 stuk',
    [('pastry_fried', 50), ('beef_stew', 25), ('onion', 5), ('oil', 5)])

add('lat-pastechi-keshi', 'Pastechi di keshi (kaaspastechi)', 'Cheese pastechi',
    'pastechi di keshi pastechi keshi pastechi kaas cheese pastechi curacao curaçao aruba bonaire',
    'snack', 'cw', 80, '1 stuk',
    [('pastry_fried', 50), ('cheese', 25), ('oil', 5)])

add('lat-pastechi-piska', 'Pastechi di piska (vispastechi)', 'Fish pastechi',
    'pastechi di piska pastechi vis fish pastechi curacao curaçao aruba',
    'snack', 'cw', 85, '1 stuk',
    [('pastry_fried', 50), ('fish_white', 25), ('onion', 5), ('oil', 5)])

add('lat-pastechi-karko', 'Pastechi di karko', 'Conch pastechi',
    'pastechi di karko pastechi karko conch pastechi aruba curacao curaçao',
    'snack', 'aw', 85, '1 stuk',
    [('pastry_fried', 50), ('conch', 25), ('onion', 5), ('oil', 5)])

add('lat-pastechi-atun', 'Pastechi di atún (tonijnpastechi)', 'Tuna pastechi',
    'pastechi di atun pastechi atún pastechi tonijn tuna pastechi curacao curaçao aruba',
    'snack', 'cw', 85, '1 stuk',
    [('pastry_fried', 50), ('tuna', 25), ('onion', 5), ('oil', 5)])

add('lat-pastechi-galina', 'Pastechi di galiña (kippastechi)', 'Chicken pastechi',
    'pastechi di galina pastechi galiña pastechi kip chicken pastechi curacao curaçao aruba',
    'snack', 'cw', 85, '1 stuk',
    [('pastry_fried', 50), ('chicken_stew', 25), ('onion', 5), ('oil', 5)])

add('lat-bitterbal', 'Bitterbal (lokaal, vlees)', 'Bitterbal (local, beef)',
    'bitterbal bitterballen curacao curaçao aruba lokaal',
    'snack', 'cw', 25, '1 stuk',
    [('pastry_fried', 8), ('beef_stew', 12), ('oil', 3), ('flour', 2)])

add('lat-kroket-karni', 'Kroket di karni', 'Beef kroket',
    'kroket di karni kroket karni rundvleeskroket curacao curaçao aruba',
    'snack', 'cw', 70, '1 stuk',
    [('pastry_fried', 25), ('beef_stew', 35), ('oil', 6), ('flour', 4)])

add('lat-kroket-keshi', 'Kroket di keshi (kaaskroket)', 'Cheese kroket',
    'kroket di keshi kaaskroket cheese kroket curacao curaçao',
    'snack', 'cw', 70, '1 stuk',
    [('pastry_fried', 25), ('cheese', 30), ('oil', 8), ('flour', 7)])

add('lat-kroket-bakiou', 'Kroket di bakiou (bakkeljauwkroket)', 'Saltfish kroket',
    'kroket di bakiou kroket bakkeljauw bacalao kroket curacao curaçao',
    'snack', 'cw', 70, '1 stuk',
    [('pastry_fried', 25), ('saltfish', 30), ('oil', 8), ('onion', 7)])

add('lat-kala', 'Kalá (bonenkoekjes)', 'Kalá (black-eyed pea fritters)',
    'kala kalá kalabari accra bean fritters black eyed pea fritters curacao curaçao',
    'snack', 'cw', 40, '2 stuks',
    [('blackeyed', 25), ('onion', 4), ('flour', 4), ('oil', 7)])

add('lat-ayaca', 'Ayaca (feesttamale)', 'Ayaca / hallaca',
    'ayaca hayaca ayaka hallaca tamale kerst curacao curaçao aruba bonaire',
    'meal', 'cw', 250, '1 stuk',
    [('masa', 80), ('chicken_stew', 40), ('beef_stew', 30), ('raisins', 8), ('olives', 8), ('plantain', 20), ('oil', 15), ('onion', 15), ('pepper', 14), ('rice', 20)])

add('lat-sata-macaroni', 'Satá di macaroni (macaronisalade)', 'Macaroni salad',
    'sata di macaroni satá di macaroni macaronisalade macaroni salad feest curacao curaçao aruba',
    'carb', 'cw', 150, '1 portie',
    [('pasta', 85), ('mayo', 25), ('egg', 20), ('pepper', 8), ('onion', 7), ('ham', 5)])


add('lat-sata-potato', 'Satá di potato (aardappelsalade)', 'Potato salad',
    'sata di potato satá di potato aardappelsalade potato salad curacao curaçao aruba',
    'carb', 'cw', 150, '1 portie',
    [('potato', 100), ('mayo', 25), ('egg', 15), ('onion', 5), ('pepper', 5)])

add('lat-sla-kool', 'Slá di kool (koolsalade)', 'Coleslaw',
    'sla di kool slá di kool koolsalade coleslaw curacao curaçao',
    'veg', 'cw', 80, '1 portie',
    [('coleslaw', 100)], src=SRC)

add('lat-arepa-keshi', 'Arepa ku keshi (arepa met kaas)', 'Arepa with cheese',
    'arepa ku keshi arepa met kaas arepa queso curacao curaçao aruba venezuela straateten',
    'meal', 'cw', 150, '1 stuk',
    [('arepa', 120), ('cheese', 30)])

add('lat-arepa-karni', 'Arepa ku karni (arepa met vlees)', 'Arepa with beef',
    'arepa ku karni arepa met vlees arepa carne curacao curaçao aruba',
    'meal', 'cw', 200, '1 stuk',
    [('arepa', 120), ('beef_shredded', 70), ('avocado', 10)])

add('lat-tequenos', 'Tequeños (kaasstengels)', 'Tequeños',
    'tequenos tequeños kaasstengels cheese sticks curacao curaçao aruba venezuela',
    'snack', 'cw', 80, '3 stuks',
    [('pastry_fried', 45), ('cheese', 25), ('oil', 10)])

add('lat-bami-karni', 'Bami ku karni', 'Bami with beef',
    'bami ku karni bami goreng bami vlees curacao curaçao suriname',
    'meal', 'cw', 350, '1 bord',
    [('bami', 220), ('beef_stew', 80), ('mixed_veg', 40), ('oil', 10)])

add('lat-nasi-galina', 'Nasi ku galiña', 'Nasi with chicken',
    'nasi ku galina nasi ku galiña nasi goreng kip curacao curaçao suriname',
    'meal', 'cw', 350, '1 bord',
    [('rice', 200), ('chicken_stew', 80), ('mixed_veg', 50), ('oil', 15), ('onion', 5)])

# sweets & drinks ABC
add('lat-bolo-pretu', 'Bolo pretu (donkere vruchtentaart)', 'Bolo pretu (black cake)',
    'bolo pretu bolo preto black cake donkere cake kerst curacao curaçao aruba bonaire',
    'snack', 'cw', 80, '1 punt',
    [('flour', 20), ('sugar', 15), ('butter', 12), ('raisins', 20), ('egg', 10), ('rum', 8), ('oil', 5)],
    src=SRC_ALC)

add('lat-kokada', 'Kokada (kokossnoep)', 'Kokada (coconut sweet)',
    'kokada cocada kokos koek coconut sweet curacao curaçao aruba',
    'snack', 'cw', 40, '1 stuk',
    [('coconut_grated', 60), ('sugar', 35), ('water', 5)])

add('lat-tenten', 'Tenten (pindakoek)', 'Tenten (peanut brittle)',
    'tenten pindakoek peanut brittle pinda koek curacao curaçao',
    'snack', 'cw', 30, '1 stuk',
    [('peanuts', 55), ('sugar', 45)])

add('lat-kesio', 'Kesio (quelho / flan)', 'Kesio (flan / condensed-milk custard)',
    'kesio quesillo quelho flan caramel pudding curacao curaçao aruba',
    'snack', 'cw', 120, '1 punt',
    [('condensed_milk', 40), ('evaporated_milk', 25), ('egg', 25), ('sugar', 10)])

add('lat-tentalaria', 'Tentalaria (kokossnoep)', 'Tentalaria (coconut fudge)',
    'tentalaria tentalarya kokos fudge curacao curaçao',
    'snack', 'cw', 35, '1 stuk',
    [('coconut_grated', 50), ('sugar', 40), ('milk', 10)])

add('lat-pan-dushi', 'Pan dushi (zoet brood)', 'Sweet bread',
    'pan dushi zoet brood sweet bread curacao curaçao aruba',
    'carb', 'cw', 70, '1 snee',
    [('flour', 45), ('sugar', 12), ('butter', 8), ('milk', 20), ('egg', 15)])

add('lat-awa-lamunchi', 'Awa di lamunchi (limoenwater, licht gezoet)', 'Lime water, lightly sweetened',
    'awa di lamunchi awa lamunchi limoenwater lime water limonada curacao curaçao aruba bonaire',
    'drink', 'cw', 300, '1 glas',
    [('lime_juice', 30), ('sugar', 15), ('water', 255)])

add('lat-awa-lamunchi-suku', 'Awa di lamunchi ku suku (zoete limoenlimonade)', 'Sweet limeade',
    'awa di lamunchi ku suku zoete limonade curacao curaçao',
    'drink', 'cw', 300, '1 glas',
    [('lime_juice', 30), ('sugar', 30), ('water', 240)])

add('lat-batido-lechi', 'Batido di lechi (milkshake)', 'Milkshake (batido di lechi)',
    'batido di lechi batido lechi milkshake melkshake curacao curaçao aruba',
    'drink', 'cw', 300, '1 glas',
    [('milk', 220), ('sugar', 20), ('evaporated_milk', 40), ('ice', 20)])

add('lat-batido-banana', 'Batido di banana', 'Banana smoothie',
    'batido di banana banaan shake banana smoothie curacao curaçao',
    'drink', 'cw', 300, '1 glas',
    [('banana', 120), ('milk', 150), ('sugar', 15), ('ice', 15)])

add('lat-batido-mango', 'Batido di mango', 'Mango smoothie',
    'batido di mango mango shake curacao curaçao aruba',
    'drink', 'cw', 300, '1 glas',
    [('mango', 140), ('milk', 120), ('sugar', 15), ('ice', 25)])

add('lat-batido-sorsaka', 'Batido di sorsaka (zuurzakshake)', 'Soursop smoothie',
    'batido di sorsaka sorsaka zuurzak guanabana soursop shake curacao curaçao aruba bonaire',
    'drink', 'cw', 300, '1 glas',
    [('soursop', 140), ('milk', 120), ('sugar', 15), ('ice', 25)])

add('lat-awa-koko', 'Awa di koko (kokoswater)', 'Coconut water',
    'awa di koko kokoswater coconut water coco fresco curacao curaçao aruba bonaire',
    'drink', 'cw', 300, '1 glas',
    [('coconut_water', 100)], src=SRC_USDA)

add('lat-ponche-crema', 'Ponche crema', 'Ponche crema',
    'ponche crema ponche de crema advocaat rum punch ei curacao curaçao venezuela aruba',
    'drink', 'cw', 120, '1 glas',
    [('condensed_milk', 40), ('evaporated_milk', 25), ('rum', 25), ('egg', 10)],
    src=SRC_ALC)

add('lat-awa-markoesa', 'Awa di markoesa (passievruchtensap)', 'Passion fruit juice',
    'awa di markoesa markoesa poms passievrucht passion fruit curacao curaçao aruba',
    'drink', 'cw', 250, '1 glas',
    [('passionfruit', 50), ('sugar', 18), ('water', 182)])

add('lat-awa-tamarinde', 'Awa di tamarinde', 'Tamarind drink',
    'awa di tamarinde tamarinde drank tamarind juice curacao curaçao aruba',
    'drink', 'cw', 250, '1 glas',
    [('tamarind', 20), ('sugar', 18), ('water', 212)])

# Aruba / Bonaire extras
add('lat-aw-cabrito-panbati', 'Cabrito stoba ku pan bati (Aruba)', 'Aruban goat stew with pan bati',
    'cabrito stoba ku pan bati kabritu ku pan bati aruba geit pan bati',
    'meal', 'aw', 390, '1 bord',
    [('lat-kabritu-stoba', 250), ('lat-pan-bati', 140)])

add('lat-aw-piska-panbati-banana', 'Piska hasá ku pan bati i banana (Aruba)', 'Fried fish with pan bati and plantain',
    'piska hasa ku pan bati banana aruba gebakken vis pan bati',
    'meal', 'aw', 370, '1 bord',
    [('lat-piska-hasi', 180), ('lat-pan-bati', 70), ('lat-banana-hasi', 120)])

add('lat-bq-kadushi-kabritu', 'Kadushi ku kabritu (Bonaire)', 'Bonaire cactus soup with goat',
    'kadushi ku kabritu cadushi cabrito bonaire cactussoep geit',
    'soup', 'bq', 400, '1 kom',
    [('lat-sopi-kadushi', 300), ('lat-kabritu-stoba', 100)])

add('lat-bq-piska-funchi-banana', 'Piska hasá ku funchi i banana (Bonaire)', 'Fried fish with funchi and plantain',
    'piska hasa ku funchi banana bonaire curacao curaçao',
    'meal', 'bq', 460, '1 bord',
    [('lat-piska-hasi', 160), ('lat-funchi', 180), ('lat-banana-hasi', 120)])

# ---------------------------------------------------------------------------
# Bovenwindse eilanden (Sint Maarten, Saba, Sint Eustatius + nabije eilanden)
# ---------------------------------------------------------------------------
add('lat-johnny-cake', 'Johnny cake (Bovenwindse eilanden)', 'Johnny cake',
    'johnny cake johnnycake johnnycakes johnny cakes pan seku sint maarten saba statia st eustatius angilla st kitts',
    'carb', 'sx', 70, '1 stuk',
    [('johnny_cake', 100)], src=SRC)

add('lat-saltfish-sx', 'Saltfish (gestoofde bakkeljauw, SXM)', 'Stewed saltfish (Sint Maarten)',
    'saltfish bakkeljauw sxm sint maarten saba statia salt fish',
    'meal', 'sx', 180, '1 portie',
    [('saltfish', 90), ('onion', 30), ('pepper', 25), ('tomato', 20), ('oil', 15)])

add('lat-johnny-saltfish', 'Johnny cakes ku saltfish (Sint Maarten)', 'Johnny cakes and saltfish',
    'johnny cakes and saltfish johnny cake saltfish johnnycakes bakkeljauw sint maarten sxm saba statia bovenwindse',
    'meal', 'sx', 320, '1 bord',
    [('lat-johnny-cake', 140), ('lat-saltfish-sx', 180)])

add('lat-conch-fritters-sx', 'Conch fritters (Sint Maarten)', 'Conch fritters',
    'conch fritters karko fritters sint maarten sxm virgin islands bahamas',
    'snack', 'sx', 90, '3 stuks',
    [('conch', 40), ('flour', 25), ('onion', 8), ('pepper', 7), ('oil', 20)])

add('lat-callaloo-soup-sx', 'Callaloo soep (Bovenwindse eilanden)', 'Callaloo soup',
    'callaloo soep callaloo soup sint maarten saba st kitts antigua bovenwindse',
    'soup', 'sx', 350, '1 kom',
    [('callaloo', 100), ('okra', 40), ('crab', 40), ('coconut_milk', 60), ('onion', 20), ('stock', 80), ('oil', 10)])

add('lat-goat-stew-sx', 'Goat stew (Sint Maarten / Saba)', 'Goat stew',
    'goat stew geitenstoofpot sint maarten saba statia bovenwindse',
    'meal', 'sx', 250, '1 portie',
    [('goat', 130), ('potato', 40), ('onion', 25), ('pepper', 15), ('tomato', 20), ('dumpling', 15), ('oil', 5)])

add('lat-goat-stew-rice-sx', 'Goat stew ku rice (SXM)', 'Goat stew with rice',
    'goat stew with rice geit met rijst sint maarten saba',
    'meal', 'sx', 430, '1 bord',
    [('lat-goat-stew-sx', 250), ('rice', 180)])

add('lat-bullfoot-soup', 'Bull foot soup (Bovenwindse eilanden)', 'Bull foot soup',
    'bull foot soup cow foot soup runderpoot soep sint maarten st kitts antigua',
    'soup', 'sx', 350, '1 kom',
    [('cowheel', 80), ('yam', 40), ('dumpling', 30), ('potato', 30), ('carrot', 20), ('onion', 20), ('stock', 120), ('oil', 5), ('pepper', 5)])

add('lat-cowheel-soup-sx', 'Cow heel soup (Bovenwindse eilanden)', 'Cow heel soup',
    'cow heel soup cowheel koeienpoot soep sint maarten barbados trinidad',
    'soup', 'sx', 350, '1 kom',
    [('cowheel', 90), ('yam', 40), ('dumpling', 30), ('potato', 30), ('carrot', 20), ('onion', 20), ('stock', 110), ('oil', 5), ('pepper', 5)])

add('lat-fish-broth-sx', 'Fish broth (Bovenwindse eilanden)', 'Fish broth',
    'fish broth visbouillon fish soup sint maarten saba angilla',
    'soup', 'sx', 350, '1 kom',
    [('fish_white', 90), ('green' if False else 'potato', 40), ('dumpling', 30), ('onion', 25), ('carrot', 20), ('stock', 130), ('lime_juice', 5), ('oil', 5), ('pepper', 5)])

add('lat-pumpkin-soup-sx', 'Pumpkin soup (Bovenwindse eilanden)', 'Pumpkin soup',
    'pumpkin soup pompoensoep sint maarten saba st lucia',
    'soup', 'sx', 350, '1 kom',
    [('pumpkin', 180), ('onion', 25), ('potato', 40), ('coconut_milk', 40), ('stock', 55), ('oil', 5), ('milk', 5)])

add('lat-lobster-rice-sx', 'Grilled lobster ku rice (Sint Maarten)', 'Grilled lobster with rice',
    'grilled lobster lobster with rice kreeft met rijst sint maarten sxm saba',
    'meal', 'sx', 400, '1 bord',
    [('lobster', 180), ('oil', 10), ('lime_juice', 10), ('rice', 160), ('coleslaw', 40)])

add('lat-sxm-chicken-plate', 'Roast chicken plate (SXM: kip, macaroni salad, coleslaw)', 'Sint Maarten roast chicken lunch plate',
    'roast chicken plate sxm lunch kip macaroni salad coleslaw sint maarten',
    'meal', 'sx', 500, '1 bord',
    [('chicken_fried' if False else 'chicken', 180), ('macaroni_salad', 150), ('coleslaw', 80), ('rice', 90)])

add('lat-conch-dumplings-sx', 'Conch and dumplings (SXM / Anguilla)', 'Conch and dumplings',
    'conch and dumplings karko dumplings sint maarten anguilla',
    'meal', 'sx', 350, '1 bord',
    [('conch', 130), ('dumpling', 100), ('onion', 30), ('pepper', 20), ('tomato', 40), ('oil', 15), ('stock', 15)])

add('lat-saltfish-dumplings-sx', 'Saltfish and dumplings', 'Saltfish and dumplings',
    'saltfish and dumplings bakkeljauw dumplings sint maarten st kitts statia',
    'meal', 'sx', 350, '1 bord',
    [('saltfish', 120), ('dumpling', 120), ('onion', 30), ('pepper', 25), ('tomato', 30), ('oil', 25)])

add('lat-johnnycake-ham-cheese', 'Johnny cake ku ham i keshi', 'Johnny cake with ham and cheese',
    'johnny cake ham cheese johnnycake sandwich sint maarten',
    'meal', 'sx', 150, '1 stuk',
    [('johnny_cake', 80), ('ham', 35), ('cheese', 35)])

add('lat-guavaberry', 'Guavaberry drank (Sint Maarten)', 'Guavaberry liqueur drink',
    'guavaberry guava berry sint maarten drank likeur',
    'drink', 'sx', 80, '1 glas',
    [('rum', 40), ('sugar', 20), ('orange_juice', 20)],
    src=SRC_ALC)

add('lat-goat-water-ms', 'Goat water (Montserrat / St Kitts)', 'Goat water',
    'goat water geitensoep montserrat st kitts nevis st eustatius bovenwindse',
    'soup', 'sx', 350, '1 kom',
    [('goat', 100), ('dumpling', 40), ('breadfruit', 30), ('onion', 25), ('pepper', 15), ('stock', 125), ('oil', 5), ('potato', 10)])

add('lat-fungi-fish-sx', 'Fungi and fish (SXM / Virgin Islands / Antigua)', 'Fungi and boiled fish',
    'fungi and fish fungee fungi vis antigua virgin islands sint maarten st martin',
    'meal', 'sx', 400, '1 bord',
    [('funchi', 180), ('fish_white', 160), ('onion', 20), ('oil', 15), ('lime_juice', 10), ('pepper', 15)])

add('lat-ducana-saltfish', 'Ducana and saltfish (Antigua)', 'Ducana and saltfish',
    'ducana saltfish antiguá ducana bakkeljauw sweet potato dumpling',
    'meal', 'bb', 350, '1 bord',
    [('sweet_potato', 80), ('coconut_grated', 40), ('flour', 30), ('sugar', 10), ('saltfish', 100), ('onion', 25), ('oil', 20), ('pepper', 15), ('tomato', 30)])

add('lat-pepperpot-ag', 'Pepperpot (Antigua)', 'Antiguan pepperpot',
    'pepperpot antigua antiguea callaloo eggplant',
    'soup', 'bb', 350, '1 kom',
    [('callaloo', 80), ('okra', 40), ('eggplant' if False else 'mixed_veg', 40), ('beef_stew', 50), ('pork', 30), ('onion', 20), ('stock', 80), ('oil', 10)])

add('lat-peas-soup-sx', 'Peas soup (Bovenwindse eilanden)', 'Peas soup',
    'peas soup erwten soep st kitts sint maarten',
    'soup', 'sx', 350, '1 kom',
    [('beans_pigeon', 80), ('saltfish', 30), ('dumpling', 40), ('yam', 30), ('pumpkin', 30), ('coconut_milk', 40), ('stock', 85), ('onion', 15)])

# ---------------------------------------------------------------------------
# Cuba, DR, PR, Haiti
# ---------------------------------------------------------------------------
add('lat-ropa-vieja', 'Ropa vieja (gescheurd stoofvlees)', 'Ropa vieja',
    'ropa vieja gescheurd vlees cubaanse stoofvlees cuba',
    'meal', 'cu', 250, '1 portie',
    [('beef_shredded', 150), ('tomato_sauce', 40), ('pepper', 25), ('onion', 20), ('sofrito', 10), ('oil', 5)])

add('lat-moros', 'Moros y cristianos (rijst met zwarte bonen)', 'Moros y cristianos',
    'moros y cristianos moros cristianos rijst zwarte bonen cuba congri',
    'carb', 'cu', 200, '1 portie',
    [('rice', 130), ('beans_black', 60), ('sofrito', 8), ('oil', 2)])

add('lat-frijoles-negros', 'Frijoles negros (zwarte bonen, Cuba)', 'Cuban black beans',
    'frijoles negros zwarte bonen cuba potaje',
    'carb', 'cu', 180, '1 portie',
    [('beans_black', 150), ('sofrito', 15), ('onion', 10), ('oil', 5)])

add('lat-ropa-vieja-plato', 'Ropa vieja con arroz y frijoles negros', 'Ropa vieja with rice and black beans',
    'ropa vieja con arroz y frijoles negros ropa vieja rijst bonen cuba bord',
    'meal', 'cu', 500, '1 bord',
    [('lat-ropa-vieja', 200), ('rice', 180), ('lat-frijoles-negros', 80), ('plantain_fried', 40)])

add('lat-congri', 'Congrí (rijst met bonen, Cuba/Oriente)', 'Congrí',
    'congri congrí rijst bonen cuba',
    'carb', 'cu', 200, '1 portie',
    [('rice', 130), ('beans_kidney', 60), ('sofrito', 8), ('oil', 2)])

add('lat-lechon-cu', 'Lechón asado (geroosterd speenvarken)', 'Lechón asado',
    'lechon asado lechón roast pork cuba kerst',
    'protein', 'cu', 180, '1 portie',
    [('pernil', 170), ('sofrito', 10)])

add('lat-ajiaco-cu', 'Ajiaco criollo (Cuba)', 'Cuban ajiaco',
    'ajiaco criollo ajiaco cuba stoofsoep',
    'soup', 'cu', 400, '1 kom',
    [('beef_stew', 50), ('pork', 30), ('chicken_stew', 30), ('plantain_boiled', 40), ('yuca', 35), ('taro', 30), ('pumpkin', 30), ('corn', 30), ('onion', 20), ('stock', 90), ('oil', 5), ('tomato', 10)])

add('lat-sopa-frijoles-cu', 'Sopa de frijoles negros (Cuba)', 'Cuban black bean soup',
    'sopa de frijoles negros zwarte bonensoep cuba',
    'soup', 'cu', 350, '1 kom',
    [('beans_black', 160), ('onion', 25), ('pepper', 15), ('sofrito', 15), ('stock', 125), ('oil', 10)])

add('lat-potaje-lentejas-cu', 'Potaje de lentejas (Cuba)', 'Cuban lentil stew',
    'potaje de lentejas linzen stoof cuba',
    'soup', 'cu', 350, '1 kom',
    [('lentils', 160), ('potato', 40), ('carrot', 25), ('onion', 25), ('chorizo' if False else 'sausage', 20), ('stock', 70), ('oil', 5), ('tomato', 5)])

add('lat-sopa-pollo-cu', 'Sopa de pollo (Cuba)', 'Cuban chicken soup',
    'sopa de pollo kippensoep cuba',
    'soup', 'cu', 350, '1 kom',
    [('chicken_stew', 90), ('potato', 40), ('noodle' if False else 'pasta', 30), ('carrot', 25), ('onion', 25), ('stock', 130), ('oil', 5), ('celery', 5)])

add('lat-sopa-pescado-cu', 'Sopa de pescado (Cuba)', 'Cuban fish soup',
    'sopa de pescado vissoep cuba',
    'soup', 'cu', 350, '1 kom',
    [('fish_white', 90), ('potato', 50), ('onion', 25), ('tomato', 30), ('stock', 140), ('oil', 8), ('pepper', 7)])

add('lat-caldosa', 'Caldosa (Cubaanse feestsoep)', 'Caldosa',
    'caldosa cuba feestsoep',
    'soup', 'cu', 400, '1 kom',
    [('chicken_stew', 80), ('pork', 40), ('yuca', 40), ('plantain_boiled', 40), ('taro', 30), ('corn', 30), ('onion', 20), ('stock', 110), ('oil', 5), ('pepper', 5)])

add('lat-picadillo-cu', 'Picadillo (Cuba)', 'Cuban picadillo',
    'picadillo cuba gehakt rozijnen olijven',
    'meal', 'cu', 220, '1 portie',
    [('ground_beef', 140), ('tomato_sauce', 30), ('raisins', 10), ('olives', 10), ('onion', 20), ('oil', 10)])

add('lat-tostones-cu', 'Tostones (gebakken groene bakbanaan)', 'Tostones',
    'tostones patacones groene bakbanaan twice fried plantain cuba caribe',
    'carb', 'cu', 120, '1 portie',
    [('tostones', 100)], src=SRC)

add('lat-medianoche', 'Medianoche (Cubaanse sandwich)', 'Medianoche sandwich',
    'medianoche cubaanse sandwich cubano nacht cuba',
    'meal', 'cu', 220, '1 stuk',
    [('bread', 80), ('pernil', 60), ('ham', 30), ('cheese', 30), ('pickle', 10), ('oil', 10)])

# DR
add('lat-la-bandera', 'La bandera dominicana (rijst, habichuelas i vlees)', 'La bandera dominicana',
    'la bandera dominicana la bandera rijst habichuelas stoofvlees dominicaanse republiek santo domingo st domingo',
    'meal', 'do', 500, '1 bord',
    [('rice', 180), ('beans_kidney', 120), ('chicken_stew', 120), ('plantain_fried', 50), ('coleslaw', 30)])

add('lat-sancocho-do', 'Sancocho dominicano', 'Dominican sancocho',
    'sancocho dominicano sancocho dominicaanse republiek santo domingo',
    'soup', 'do', 400, '1 kom',
    [('chicken_stew', 50), ('beef_stew', 40), ('pork', 30), ('plantain_boiled', 40), ('yuca', 35), ('yam', 30), ('potato', 30), ('corn', 30), ('onion', 20), ('stock', 85), ('oil', 5), ('cilantro' if False else 'pepper', 5)])

add('lat-mangu', 'Mangú (puree van groene bakbanaan)', 'Mangú',
    'mangu mangú puree groene bakbanaan dominicaanse republiek ontbijt',
    'carb', 'do', 200, '1 portie',
    [('mangu', 100)], src=SRC_USDA)

add('lat-mangu-los-tres', 'Mangú con los tres golpes (ei, kaas, salami)', 'Mangú with the three hits',
    'mangu los tres golpes mangu ei kaas salami ontbijt dominicaanse republiek',
    'meal', 'do', 400, '1 bord',
    [('mangu', 200), ('egg', 55), ('queso_fresco', 40), ('salami', 50), ('onion', 30), ('oil', 25)])

add('lat-asopao-pollo-do', 'Asopao de pollo (Dominicaanse Republiek)', 'Dominican asopao de pollo',
    'asopao de pollo rijstsoep kip dominicaanse republiek',
    'soup', 'do', 400, '1 kom',
    [('rice', 80), ('chicken_stew', 90), ('pepper', 20), ('onion', 20), ('tomato', 20), ('stock', 150), ('oil', 10), ('peas' if False else 'beans_pigeon', 10)])

add('lat-asopao-camarones', 'Asopao de camarones', 'Shrimp asopao',
    'asopao de camarones garnalen rijstsoep dominicaanse republiek puerto rico',
    'soup', 'do', 400, '1 kom',
    [('rice', 80), ('shrimp', 90), ('pepper', 20), ('onion', 20), ('tomato', 20), ('stock', 150), ('oil', 10), ('coconut_milk', 10)])

add('lat-mondongo-do', 'Mondongo dominicano', 'Dominican mondongo',
    'mondongo dominicano penssoep dominicaanse republiek',
    'soup', 'do', 350, '1 kom',
    [('tripe', 90), ('potato', 40), ('yuca', 30), ('onion', 25), ('tomato', 25), ('pepper', 15), ('stock', 115), ('oil', 10)])

add('lat-sopa-habichuelas', 'Sopa de habichuelas (DR)', 'Dominican bean soup',
    'sopa de habichuelas bonensoep dominicaanse republiek',
    'soup', 'do', 350, '1 kom',
    [('beans_kidney', 150), ('pumpkin', 30), ('onion', 25), ('pasta', 20), ('stock', 110), ('oil', 8), ('sofrito', 7)])

add('lat-chicharron-do', 'Chicharrón (Dominicaanse Republiek)', 'Dominican pork crackling',
    'chicharron chicharrón dominicaanse republiek',
    'snack', 'do', 80, '1 portie',
    [('chicharron', 100)], src=SRC)

add('lat-tostones-do', 'Tostones (Dominicaanse Republiek)', 'Dominican tostones',
    'tostones dominicaanse republiek fritos',
    'carb', 'do', 120, '1 portie',
    [('tostones', 100)], src=SRC)

add('lat-yaniqueque', 'Yaniqueque (DR-friturbrood)', 'Yaniqueque',
    'yaniqueque johnnycake dominicaanse republiek',
    'snack', 'do', 70, '1 stuk',
    [('johnny_cake', 100)], src=SRC)

# PR
add('lat-arroz-gandules', 'Arroz con gandules', 'Arroz con gandules',
    'arroz con gandules rijst pigeon peas gandules puerto rico',
    'carb', 'pr', 200, '1 portie',
    [('rice', 130), ('beans_pigeon', 50), ('sofrito', 10), ('oil', 5), ('pork', 5)])

add('lat-pernil-pr', 'Pernil (geroosterd varkensvlees, PR)', 'Puerto Rican pernil',
    'pernil puerto rico geroosterd varken roast pork',
    'protein', 'pr', 180, '1 portie',
    [('pernil', 170), ('sofrito', 10)])

add('lat-arroz-gandules-pernil', 'Arroz con gandules con pernil', 'Arroz con gandules with pernil',
    'arroz con gandules con pernil puerto rico bord kerst',
    'meal', 'pr', 450, '1 bord',
    [('lat-arroz-gandules', 220), ('lat-pernil-pr', 180), ('tostones', 50)])

add('lat-mofongo', 'Mofongo (gestampte bakbanaan met chicharrón)', 'Mofongo',
    'mofongo puerto rico gestampte bakbanaan chicharron',
    'meal', 'pr', 250, '1 portie',
    [('plantain_fried', 160), ('chicharron', 40), ('garlic', 8), ('oil', 22), ('stock', 20)])

add('lat-mofongo-camarones', 'Mofongo con camarones', 'Mofongo with shrimp',
    'mofongo con camarones mofongo garnalen puerto rico',
    'meal', 'pr', 400, '1 bord',
    [('lat-mofongo', 220), ('shrimp', 120), ('tomato_sauce', 40), ('oil', 10), ('pepper', 10)])

add('lat-sancocho-pr', 'Sancocho puertorriqueño', 'Puerto Rican sancocho',
    'sancocho puertorriqueno puerto rico',
    'soup', 'pr', 400, '1 kom',
    [('chicken_stew', 60), ('pork', 40), ('plantain_boiled', 40), ('yuca', 40), ('yam', 30), ('taro', 30), ('corn', 30), ('onion', 20), ('stock', 100), ('oil', 5), ('sofrito', 5)])

add('lat-asopao-gandules', 'Asopao de gandules', 'Asopao de gandules',
    'asopao de gandules puerto rico rijstsoep',
    'soup', 'pr', 400, '1 kom',
    [('rice', 80), ('beans_pigeon', 60), ('pork', 40), ('sofrito', 20), ('stock', 180), ('oil', 10), ('pepper', 10)])

add('lat-asopao-pollo-pr', 'Asopao de pollo (Puerto Rico)', 'Puerto Rican asopao de pollo',
    'asopao de pollo puerto rico',
    'soup', 'pr', 400, '1 kom',
    [('rice', 80), ('chicken_stew', 90), ('sofrito', 20), ('pepper', 20), ('stock', 170), ('oil', 10), ('tomato', 10)])

add('lat-mondongo-pr', 'Mondongo puertorriqueño', 'Puerto Rican mondongo',
    'mondongo puerto rico penssoep',
    'soup', 'pr', 350, '1 kom',
    [('tripe', 90), ('potato', 40), ('yuca', 30), ('onion', 25), ('tomato', 25), ('stock', 125), ('oil', 10), ('sofrito', 5)])

add('lat-caldo-santo', 'Caldo santo (PR, Stille Week)', 'Caldo santo',
    'caldo santo puerto rico vissoep stille week',
    'soup', 'pr', 350, '1 kom',
    [('fish_white', 70), ('coconut_milk', 60), ('taro', 40), ('yam', 30), ('plantain_boiled', 30), ('onion', 20), ('stock', 90), ('oil', 5), ('pepper', 5)])

add('lat-arroz-habichuelas-pr', 'Arroz con habichuelas', 'Rice with beans (PR)',
    'arroz con habichuelas puerto rico rijst bonen',
    'carb', 'pr', 200, '1 portie',
    [('rice', 130), ('beans_kidney', 60), ('sofrito', 8), ('oil', 2)])

add('lat-pionono-pr', 'Pionono (PR, bakbanaanrol)', 'Pionono',
    'pionono puerto rico bakbanaan gehakt',
    'meal', 'pr', 200, '1 stuk',
    [('plantain_fried', 100), ('ground_beef', 70), ('cheese', 15), ('oil', 15)])

# Haiti
add('lat-griot', 'Griot (gebakken marget stukjes, Haïti)', 'Griot (fried pork)',
    'griot griyo gebakken varken haiti haïti',
    'protein', 'ht', 150, '1 portie',
    [('pork', 130), ('oil', 12), ('lime_juice', 5), ('onion', 3)])

add('lat-diri-pwa', 'Diri ak pwa (rijst met bonen, Haïti)', 'Diri ak pwa (rice and beans)',
    'diri ak pwa diri kole diri ak pwa wouj rijst bonen haiti haïti',
    'carb', 'ht', 200, '1 portie',
    [('rice', 130), ('beans_kidney', 55), ('coconut_milk', 10), ('oil', 5)])

add('lat-griot-diri', 'Griot ak diri ak pwa (Haïti)', 'Griot with rice and beans',
    'griot ak diri ak pwa griot with rice and beans haiti haïti bord pikliz',
    'meal', 'ht', 450, '1 bord',
    [('lat-griot', 150), ('lat-diri-pwa', 200), ('plantain_fried', 60), ('cabbage', 40)])

add('lat-soup-joumou', 'Soup joumou (pompoensoep, Haïti)', 'Soup joumou',
    'soup joumou soupe joumou pompoensoep haiti haïti onafhankelijkheid 1 januari',
    'soup', 'ht', 400, '1 kom',
    [('pumpkin', 140), ('beef_stew', 60), ('potato', 30), ('pasta', 20), ('carrot', 20), ('cabbage', 20), ('onion', 20), ('stock', 80), ('oil', 5), ('pepper', 5)])

add('lat-tchaka', 'Tchaka (mais-bonenstoof, Haïti)', 'Tchaka',
    'tchaka chaka haiti haïti mais bonen',
    'soup', 'ht', 350, '1 kom',
    [('hominy', 120), ('beans_kidney', 80), ('pork', 50), ('onion', 20), ('stock', 70), ('oil', 10)])

add('lat-bouyon-ht', 'Bouyon (Haïtiaanse bouillon)', 'Haitian bouyon',
    'bouyon bouillon haiti haïti soep',
    'soup', 'ht', 400, '1 kom',
    [('beef_stew', 50), ('chicken_stew', 40), ('plantain_boiled', 40), ('yuca', 30), ('yam', 30), ('malanga' if False else 'taro', 30), ('onion', 20), ('stock', 145), ('oil', 5), ('carrot', 10)])

add('lat-soup-pwason', 'Soup pwason (vissoep, Haïti)', 'Haitian fish soup',
    'soup pwason vissoep haiti haïti',
    'soup', 'ht', 350, '1 kom',
    [('fish_white', 90), ('potato', 40), ('plantain_boiled', 30), ('onion', 25), ('stock', 145), ('oil', 10), ('lime_juice', 5), ('pepper', 5)])

add('lat-calalou-ht', 'Kalalou (okra-stoof, Haïti)', 'Haitian kalalou',
    'kalalou calalou haiti haïti okra',
    'soup', 'ht', 300, '1 kom',
    [('okra', 100), ('crab', 40), ('spinach', 40), ('onion', 20), ('stock', 80), ('oil', 10), ('pepper', 10)])

add('lat-diri-djon', 'Diri ak djon djon (zwarte paddenstoelenrijst)', 'Diri ak djon djon',
    'diri djon djon haiti haïti zwarte rijst mushrooms',
    'carb', 'ht', 180, '1 portie',
    [('rice', 150), ('oil', 8), ('onion', 15), ('stock', 7)])

add('lat-pikliz', 'Pikliz (pittige koolrelish, Haïti)', 'Pikliz',
    'pikliz pickliz haiti haïti kool relish',
    'veg', 'ht', 40, '2 eetlepels',
    [('cabbage', 60), ('carrot', 15), ('pepper', 15), ('lime_juice', 10)])

add('lat-banane-peze', 'Banane peze (Haïtiaanse tostones)', 'Banane peze',
    'banane peze haiti haïti tostones',
    'carb', 'ht', 120, '1 portie',
    [('tostones', 100)], src=SRC)


# ---------------------------------------------------------------------------
# Jamaica
# ---------------------------------------------------------------------------
add('lat-ackee-saltfish', 'Ackee and saltfish', 'Ackee and saltfish',
    'ackee and saltfish ackee saltfish jamaica nationaal gerecht ontbijt',
    'meal', 'jm', 250, '1 portie',
    [('ackee', 120), ('saltfish', 70), ('onion', 20), ('pepper', 15), ('tomato', 15), ('oil', 10)])

add('lat-rice-peas-jm', 'Rice and peas (Jamaica)', 'Rice and peas',
    'rice and peas rijst erwten gungo coconut jamaica rice & peas',
    'carb', 'jm', 200, '1 portie',
    [('rice', 130), ('beans_pigeon', 40), ('coconut_milk', 25), ('oil', 5)])

add('lat-jerk-chicken', 'Jerk chicken', 'Jerk chicken',
    'jerk chicken jerk kip jamaica',
    'protein', 'jm', 180, '1 portie',
    [('jerk_chicken', 100)], src=SRC)

add('lat-jerk-chicken-plate', 'Jerk chicken with rice and peas', 'Jerk chicken with rice & peas',
    'jerk chicken with rice and peas jerk chicken rice peas jamaica bord',
    'meal', 'jm', 450, '1 bord',
    [('lat-jerk-chicken', 180), ('lat-rice-peas-jm', 200), ('plantain_fried', 70)])

add('lat-ackee-plate', 'Ackee and saltfish with fried dumplings', 'Ackee and saltfish with dumplings',
    'ackee saltfish dumplings festival jamaica ontbijt bord',
    'meal', 'jm', 400, '1 bord',
    [('lat-ackee-saltfish', 250), ('dumpling', 80), ('plantain_fried', 50), ('callaloo', 20)])

add('lat-curry-goat-jm', 'Curry goat (Jamaica)', 'Curry goat',
    'curry goat kerry geit jamaica',
    'meal', 'jm', 250, '1 portie',
    [('goat', 140), ('onion', 25), ('pepper', 15), ('potato', 40), ('oil', 15), ('tomato', 15)])

add('lat-curry-goat-rice', 'Curry goat with rice', 'Curry goat with rice',
    'curry goat with rice jamaica bord',
    'meal', 'jm', 430, '1 bord',
    [('lat-curry-goat-jm', 250), ('rice', 180)])

add('lat-oxtail-jm', 'Oxtail stew (Jamaica)', 'Jamaican oxtail',
    'oxtail jamaica ossenstaart butter beans',
    'meal', 'jm', 250, '1 portie',
    [('oxtail', 140), ('beans_kidney', 40), ('onion', 25), ('oil', 10), ('tomato', 20), ('pepper', 15)])

add('lat-oxtail-rice-peas', 'Oxtail with rice and peas', 'Oxtail with rice and peas',
    'oxtail rice and peas jamaica bord',
    'meal', 'jm', 450, '1 bord',
    [('lat-oxtail-jm', 250), ('lat-rice-peas-jm', 200)])

add('lat-jerk-pork', 'Jerk pork', 'Jerk pork',
    'jerk pork jamaica varkensvlees',
    'protein', 'jm', 180, '1 portie',
    [('pork', 160), ('oil', 10), ('sofrito', 10)])

add('lat-festival', 'Festival (zoete koek, Jamaica)', 'Festival',
    'festival jamaica zoete dumpling',
    'snack', 'jm', 70, '1 stuk',
    [('flour', 40), ('cornmeal_dry', 10), ('sugar', 10), ('oil', 15), ('water', 25)])

add('lat-patty-jm', 'Jamaican beef patty', 'Jamaican beef patty',
    'jamaican patty beef patty meat patty jamaica pastei',
    'snack', 'jm', 140, '1 stuk',
    [('pastry_baked', 80), ('ground_beef', 45), ('onion', 10), ('oil', 5)])

add('lat-callaloo-jm', 'Callaloo (gestoofd, Jamaica)', 'Steamed callaloo',
    'callaloo jamaica gestoofd',
    'veg', 'jm', 150, '1 portie',
    [('callaloo', 120), ('onion', 15), ('oil', 10), ('pepper', 5)])

add('lat-mannish-water', 'Mannish water (geitensoep, Jamaica)', 'Mannish water',
    'mannish water goat soup geitensoep jamaica',
    'soup', 'jm', 350, '1 kom',
    [('goat', 90), ('dumpling', 40), ('yam', 30), ('potato', 30), ('onion', 20), ('stock', 125), ('oil', 5), ('pepper', 10)])

add('lat-cowfoot-soup-jm', 'Cow foot soup (Jamaica)', 'Cow foot soup',
    'cow foot soup jamaica koeienpoot',
    'soup', 'jm', 350, '1 kom',
    [('cowheel', 90), ('yam', 40), ('dumpling', 30), ('potato', 30), ('carrot', 20), ('onion', 20), ('stock', 110), ('oil', 5), ('pepper', 5)])

add('lat-red-peas-soup', 'Red peas soup (Jamaica)', 'Red peas soup',
    'red peas soup jamaica bonensoep kidney',
    'soup', 'jm', 350, '1 kom',
    [('beans_kidney', 100), ('saltfish', 20), ('dumpling', 40), ('yam', 30), ('potato', 30), ('coconut_milk', 40), ('stock', 80), ('onion', 10)])

add('lat-gungo-peas-soup', 'Gungo peas soup (Jamaica)', 'Gungo peas soup',
    'gungo peas soup pigeon peas jamaica',
    'soup', 'jm', 350, '1 kom',
    [('beans_pigeon', 100), ('chicken_stew', 40), ('dumpling', 30), ('yam', 30), ('coconut_milk', 40), ('stock', 90), ('onion', 15), ('oil', 5)])

add('lat-fish-tea', 'Fish tea (Jamaica)', 'Fish tea',
    'fish tea vissoep jamaica heldere soep',
    'soup', 'jm', 350, '1 kom',
    [('fish_white', 90), ('green' if False else 'potato', 30), ('dumpling', 25), ('onion', 20), ('carrot', 20), ('stock', 150), ('lime_juice', 5), ('oil', 5), ('pepper', 5)])

add('lat-jm-chicken-soup', 'Jamaican chicken soup (met dumpling i yam)', 'Jamaican chicken soup',
    'jamaican chicken soup kippensoep dumpling pumpkin jamaica',
    'soup', 'jm', 400, '1 kom',
    [('chicken_stew', 90), ('dumpling', 40), ('yam', 30), ('pumpkin', 40), ('potato', 30), ('carrot', 20), ('onion', 20), ('stock', 120), ('oil', 5), ('pepper', 5)])

add('lat-pepperpot-soup-jm', 'Pepper pot soup (Jamaica)', 'Jamaican pepper pot soup',
    'pepper pot soup pepperpot jamaica callaloo',
    'soup', 'jm', 350, '1 kom',
    [('callaloo', 80), ('spinach', 30), ('beef_stew', 50), ('shrimp', 20), ('okra', 30), ('onion', 20), ('stock', 105), ('oil', 10), ('pepper', 5)])

add('lat-escovitch-fish', 'Escovitch fish', 'Escovitch fish',
    'escovitch fish jamaica gebakken vis pickles',
    'protein', 'jm', 200, '1 portie',
    [('fish_white', 150), ('oil', 15), ('onion', 15), ('pepper', 10), ('carrot', 5), ('lime_juice', 5)])

add('lat-escovitch-plate', 'Escovitch fish with festival', 'Escovitch fish with festival',
    'escovitch fish festival jamaica bord',
    'meal', 'jm', 350, '1 bord',
    [('lat-escovitch-fish', 200), ('lat-festival', 70), ('lat-callaloo-jm', 80)])

add('lat-bammy', 'Bammy (cassavebrood, Jamaica)', 'Bammy',
    'bammy jamaica cassavebrood cassava bread',
    'carb', 'jm', 80, '1 stuk',
    [('yuca', 80), ('coconut_milk', 15), ('oil', 5)])

# ---------------------------------------------------------------------------
# Trinidad & Tobago
# ---------------------------------------------------------------------------
add('lat-doubles', 'Doubles (bara met channa)', 'Doubles',
    'doubles bara channa trinidad tobago street food',
    'meal', 'tt', 200, '1 portie (2 stuks)',
    [('pastry_fried', 80), ('chickpeas', 80), ('pepper', 10), ('onion', 10), ('oil', 15), ('cucumber', 5)])

add('lat-pelau', 'Pelau (Trinidad)', 'Pelau',
    'pelau trinidad tobago rijst kip pigeon peas',
    'meal', 'tt', 400, '1 bord',
    [('rice', 160), ('chicken_stew', 100), ('beans_pigeon', 50), ('coconut_milk', 40), ('onion', 20), ('oil', 15), ('carrot', 15)])

add('lat-callaloo-soup-tt', 'Callaloo soep (Trinidad, met krab i kokos)', 'Trinidad callaloo soup',
    'callaloo soup trinidad tobago dasheen krab kokos',
    'soup', 'tt', 350, '1 kom',
    [('callaloo', 100), ('okra', 40), ('crab', 50), ('coconut_milk', 70), ('onion', 20), ('stock', 55), ('oil', 10), ('pepper', 5)])

add('lat-corn-soup-tt', 'Corn soup (Trinidad street food)', 'Trinidad corn soup',
    'corn soup trinidad tobago maissoep street food',
    'soup', 'tt', 400, '1 kom',
    [('corn', 100), ('split_peas', 50), ('dumpling', 40), ('carrot', 25), ('potato', 30), ('coconut_milk', 40), ('stock', 100), ('oil', 8), ('onion', 7)])

add('lat-cowheel-soup-tt', 'Cow heel soup (Trinidad)', 'Trinidad cow heel soup',
    'cow heel soup trinidad tobago',
    'soup', 'tt', 350, '1 kom',
    [('cowheel', 90), ('split_peas', 40), ('dumpling', 30), ('yam', 30), ('onion', 20), ('stock', 125), ('oil', 5), ('carrot', 10)])

add('lat-bake-shark', 'Bake and shark (Trinidad)', 'Bake and shark',
    'bake and shark trinidad maracas',
    'meal', 'tt', 280, '1 stuk',
    [('johnny_cake', 100), ('fish_white', 100), ('oil', 25), ('cabbage', 20), ('pepper', 15), ('lime_juice', 5), ('ketchup', 15)])

add('lat-roti-chicken-tt', 'Roti with chicken curry (Trinidad)', 'Chicken roti',
    'roti chicken curry trinidad tobago roti kip',
    'meal', 'tt', 400, '1 stuk',
    [('flour', 80), ('oil', 15), ('chicken_stew', 140), ('potato', 80), ('onion', 25), ('pepper', 15), ('coconut_milk', 25), ('chickpeas', 20)])

add('lat-roti-goat-tt', 'Roti with goat curry (Trinidad)', 'Goat roti',
    'roti goat curry trinidad tobago',
    'meal', 'tt', 400, '1 stuk',
    [('flour', 80), ('oil', 15), ('goat', 140), ('potato', 80), ('onion', 25), ('pepper', 15), ('coconut_milk', 25), ('chickpeas', 20)])

add('lat-pholourie', 'Pholourie (Trinidad)', 'Pholourie',
    'pholourie phulourie trinidad split pea fritters',
    'snack', 'tt', 60, '4 stuks',
    [('split_peas', 30), ('flour', 15), ('oil', 15)])

add('lat-aloo-pie', 'Aloo pie (Trinidad)', 'Aloo pie',
    'aloo pie trinidad aardappel pastry',
    'snack', 'tt', 120, '1 stuk',
    [('pastry_fried', 60), ('potato', 45), ('onion', 5), ('oil', 10)])

add('lat-oil-down-tt', 'Oil down (Grenada / TT-stijl)', 'Oil down',
    'oil down grenada breadfruit kokos',
    'meal', 'bb', 400, '1 bord',
    [('breadfruit', 140), ('coconut_milk', 80), ('spinach', 40), ('chicken_stew', 60), ('dumpl' if False else 'dumpling', 30), ('onion', 20), ('oil', 10), ('carrot', 20)])

add('lat-fish-broth-tt', 'Fish broth (Trinidad)', 'Trinidad fish broth',
    'fish broth trinidad vissoep',
    'soup', 'tt', 350, '1 kom',
    [('fish_white', 90), ('dumpling', 40), ('green' if False else 'yam', 30), ('potato', 30), ('onion', 20), ('stock', 125), ('oil', 5), ('lime_juice', 5), ('pepper', 5)])

add('lat-split-peas-soup-tt', 'Split peas soup (Trinidad)', 'Trinidad split peas soup',
    'split peas soup trinidad',
    'soup', 'tt', 350, '1 kom',
    [('split_peas', 120), ('dumpling', 40), ('pumpkin', 30), ('carrot', 20), ('onion', 20), ('stock', 110), ('oil', 5), ('coconut_milk', 5)])

# Barbados & Eastern Caribbean
add('lat-coucou', 'Cou-cou (Barbados, mais i okra)', 'Cou-cou',
    'cou-cou coucou cou cou barbados funchi okra',
    'carb', 'bb', 180, '1 portie',
    [('funchi', 140), ('okra', 30), ('butter', 10)])

add('lat-flying-fish', 'Flying fish (Barbados, gebakken of gestoofd)', 'Flying fish',
    'flying fish barbados vliegende vis',
    'protein', 'bb', 150, '1 portie',
    [('fish_white', 130), ('oil', 10), ('lime_juice', 5), ('onion', 5)])

add('lat-coucou-flying-fish', 'Cou-cou and flying fish (Barbados)', 'Cou-cou and flying fish',
    'cou-cou and flying fish coucou flying fish barbados nationaal',
    'meal', 'bb', 400, '1 bord',
    [('lat-coucou', 180), ('lat-flying-fish', 150), ('tomato_sauce', 40), ('onion', 15), ('pepper', 15)])

add('lat-pudding-souse', 'Pudding and souse (Barbados)', 'Pudding and souse',
    'pudding and souse barbados sweet potato varkensvlees',
    'meal', 'bb', 350, '1 bord',
    [('sweet_potato', 150), ('pork', 100), ('cucumber', 30), ('onion', 20), ('lime_juice', 15), ('oil', 20), ('pepper', 15)])

add('lat-macaroni-pie-bb', 'Macaroni pie (Barbados)', 'Macaroni pie',
    'macaroni pie barbados kaas pasta',
    'carb', 'bb', 180, '1 portie',
    [('pasta', 120), ('cheese', 40), ('evaporated_milk', 15), ('butter', 5)])

add('lat-jug-jug', 'Jug-jug (Barbados)', 'Jug-jug',
    'jug jug jug-jug barbados guinea corn pigeon peas',
    'meal', 'bb', 200, '1 portie',
    [('beans_pigeon', 80), ('cornmeal_dry', 30), ('pork', 40), ('stock', 30), ('onion', 15), ('oil', 5)])

add('lat-breadfruit-oil-down', 'Oil down (Grenada, nationaal)', 'Grenadian oil down',
    'oil down grenada nationaal breadfruit kokos callaloo',
    'meal', 'bb', 420, '1 bord',
    [('breadfruit', 150), ('coconut_milk', 90), ('callaloo', 40), ('pork', 50), ('dumpling', 30), ('onion', 20), ('carrot', 20), ('oil', 10), ('pepper', 10)])

add('lat-tannia-soup', 'Tannia soup (St Lucia / Dominica)', 'Tannia soup',
    'tannia soup tania st lucia dominica taro soep',
    'soup', 'bb', 350, '1 kom',
    [('taro', 140), ('chicken_stew', 50), ('onion', 25), ('stock', 120), ('oil', 8), ('pepper', 7)])

add('lat-breadfruit-soup-bb', 'Breadfruit soup (Oost-Caribisch)', 'Breadfruit soup',
    'breadfruit soup broodvrucht soep st lucia st vincent',
    'soup', 'bb', 350, '1 kom',
    [('breadfruit', 140), ('saltfish', 40), ('onion', 25), ('stock', 130), ('oil', 8), ('pepper', 7)])

add('lat-crab-callaloo-bb', 'Crab callaloo (Grenada / St Lucia)', 'Crab callaloo',
    'crab callaloo grenada st lucia krab',
    'soup', 'bb', 350, '1 kom',
    [('callaloo', 100), ('crab', 70), ('okra', 30), ('coconut_milk', 60), ('onion', 20), ('stock', 60), ('oil', 10)])

add('lat-green-fig-saltfish', 'Green fig and saltfish (St Lucia)', 'Green fig and saltfish',
    'green fig saltfish st lucia groene banaan bakkeljauw',
    'meal', 'bb', 350, '1 bord',
    [('plantain_boiled', 180), ('saltfish', 90), ('onion', 30), ('pepper', 20), ('oil', 20), ('tomato', 10)])

add('lat-roasted-breadfruit-fish', 'Roasted breadfruit and fish (St Vincent)', 'Roasted breadfruit and fish',
    'roasted breadfruit fish st vincent svg',
    'meal', 'bb', 400, '1 bord',
    [('breadfruit', 180), ('fish_white', 150), ('oil', 20), ('onion', 20), ('lime_juice', 10), ('pepper', 20)])

# French Antilles
add('lat-colombo-poulet', 'Colombo de poulet (Guadeloupe / Martinique)', 'Chicken colombo',
    'colombo de poulet colombo kip guadeloupe martinique franse antillen',
    'meal', 'gp', 250, '1 portie',
    [('chicken_stew', 140), ('potato', 40), ('eggplant' if False else 'mixed_veg', 20), ('onion', 15), ('coconut_milk', 20), ('oil', 10), ('pepper', 5)])

add('lat-colombo-rijst', 'Colombo de poulet avec riz', 'Chicken colombo with rice',
    'colombo riz rijst guadeloupe martinique',
    'meal', 'gp', 430, '1 bord',
    [('lat-colombo-poulet', 250), ('rice', 180)])

add('lat-blaff', 'Blaff de poisson (vis in bouillon)', 'Blaff (fish broth)',
    'blaff poisson vis bouillon guadeloupe martinique',
    'soup', 'gp', 350, '1 kom',
    [('fish_white', 120), ('onion', 30), ('lime_juice', 15), ('stock', 160), ('oil', 10), ('pepper', 15)])

add('lat-soupe-giraumon', 'Soupe de giraumon (pompoensoep)', 'Giraumon pumpkin soup',
    'soupe de giraumon giraumon pompoensoep martinique guadeloupe',
    'soup', 'gp', 350, '1 kom',
    [('pumpkin', 180), ('onion', 25), ('potato', 40), ('coconut_milk', 40), ('stock', 55), ('oil', 5), ('milk', 5)])

add('lat-soupe-congo', 'Soupe à congo (bonensoep, Franse Antillen)', 'Soupe à congo',
    'soupe a congo soupe à congo bonensoep guadeloupe martinique',
    'soup', 'gp', 350, '1 kom',
    [('beans_kidney', 140), ('pork', 40), ('onion', 25), ('stock', 130), ('oil', 8), ('carrot', 7)])

add('lat-bebele', 'Bébélé (Guadeloupe, tripes i groente)', 'Bébélé',
    'bebele bébélé guadeloupe pens broodvrucht',
    'soup', 'gp', 350, '1 kom',
    [('tripe', 80), ('breadfruit', 70), ('green' if False else 'plantain_boiled', 40), ('onion', 25), ('stock', 120), ('oil', 8), ('pepper', 7)])

add('lat-calalou-gp', 'Calalou (Franse Antillen)', 'Antillean calalou',
    'calalou guadeloupe martinique okra krab',
    'soup', 'gp', 300, '1 kom',
    [('okra', 80), ('callaloo', 50), ('crab', 50), ('onion', 20), ('stock', 85), ('oil', 10), ('pepper', 5)])

add('lat-accras-morue', 'Accras de morue (bakkeljauwballetjes)', 'Saltfish accras',
    'accras de morue accras morue bakkeljauw balletjes martinique guadeloupe',
    'snack', 'gp', 60, '3 stuks',
    [('saltfish', 25), ('flour', 15), ('onion', 5), ('oil', 15)])

add('lat-boudin-creole', 'Boudin créole', 'Creole blood sausage',
    'boudin creole boudin créole martinique guadeloupe',
    'protein', 'gp', 80, '1 stuk',
    [('pork_fatty', 50), ('onion', 10), ('rice', 20), ('oil', 10), ('pepper', 10)])

add('lat-crabe-farcis', 'Crabes farcis (gevulde krab)', 'Stuffed crab',
    'crabes farcis gevulde krab martinique guadeloupe',
    'meal', 'gp', 150, '1 stuk',
    [('crab', 80), ('bread', 30), ('onion', 15), ('oil', 15), ('pepper', 10)])

add('lat-féroce-avocat', 'Féroce d\'avocat (Martinique)', 'Féroce d\'avocat',
    'feroce avocat féroce d avocat martinique bakkeljauw avocado',
    'snack', 'gp', 150, '1 portie',
    [('avocado', 70), ('saltfish', 40), ('cassava' if False else 'yuca', 20), ('oil', 10), ('pepper', 5), ('lime_juice', 5)])

# Bahamas, Cayman, TCI, VI
add('lat-conch-chowder-bs', 'Conch chowder (Bahama\'s / TCI)', 'Conch chowder',
    'conch chowder bahamas turks caicos karko soep',
    'soup', 'bs', 350, '1 kom',
    [('conch', 90), ('potato', 50), ('tomato', 40), ('onion', 25), ('pepper', 15), ('stock', 115), ('oil', 8), ('carrot', 7)])

add('lat-conch-salad-bs', 'Conch salad (Bahama\'s)', 'Conch salad',
    'conch salad bahamas karko salade',
    'meal', 'bs', 200, '1 portie',
    [('conch', 120), ('onion', 20), ('pepper', 15), ('tomato', 20), ('lime_juice', 15), ('cucumber', 10)])

add('lat-crack-conch', 'Cracked conch (Bahama\'s)', 'Cracked conch',
    'cracked conch bahamas gebakken karko',
    'protein', 'bs', 180, '1 portie',
    [('conch', 130), ('flour', 20), ('oil', 25), ('lime_juice', 5)])

add('lat-boil-fish-ky', 'Boil fish (Cayman)', 'Cayman boil fish',
    'boil fish cayman vis ontbijt banana',
    'soup', 'bs', 400, '1 kom',
    [('fish_white', 120), ('plantain_boiled', 80), ('potato', 40), ('onion', 30), ('stock', 110), ('oil', 10), ('lime_juice', 10)])

add('lat-fish-tea-ky', 'Fish tea (Cayman / Jamaica-stijl)', 'Cayman fish tea',
    'fish tea cayman',
    'soup', 'bs', 350, '1 kom',
    [('fish_white', 90), ('potato', 40), ('onion', 25), ('stock', 175), ('lime_juice', 8), ('oil', 5), ('pepper', 7)])

add('lat-jerk-cayman-plate', 'Cayman jerk chicken with rice and beans', 'Cayman jerk plate',
    'jerk chicken cayman rice beans',
    'meal', 'bs', 450, '1 bord',
    [('lat-jerk-chicken', 180), ('rice', 150), ('beans_kidney', 80), ('plantain_fried', 40)])

# ---------------------------------------------------------------------------
# Suriname, Guyana, Belize
# ---------------------------------------------------------------------------
add('lat-moksi-alesi', 'Moksi alesi (Surinaamse gemengde rijst)', 'Moksi alesi',
    'moksi alesi moksi alesi suriname gemengde rijst zoute vis kip',
    'meal', 'sr', 400, '1 bord',
    [('rice', 180), ('chicken_stew', 60), ('saltfish', 30), ('beans_kidney', 40), ('mixed_veg', 40), ('oil', 20), ('onion', 20), ('egg', 10)])

add('lat-pom', 'Pom (Surinaamse pomtayer-ovenschotel)', 'Pom',
    'pom pomtayer suriname ovenschotel kip feest',
    'meal', 'sr', 250, '1 portie',
    [('taro', 120), ('chicken_stew', 70), ('citrus' if False else 'orange_juice', 15), ('oil', 20), ('onion', 15), ('sugar', 10)])

add('lat-roti-kip-sr', 'Roti kip (Suriname)', 'Surinamese chicken roti',
    'roti kip roti chicken suriname aardappel kousenband',
    'meal', 'sr', 450, '1 bord',
    [('flour', 80), ('oil', 15), ('chicken_stew', 140), ('potato', 100), ('mixed_veg', 40), ('onion', 25), ('coconut_milk', 30), ('chickpeas', 20)])

add('lat-pindasoep-sr', 'Pindasoep (Suriname)', 'Surinamese peanut soup',
    'pindasoep pinda soep suriname peanut soup tom tom',
    'soup', 'sr', 350, '1 kom',
    [('peanuts', 50), ('chicken_stew', 50), ('plantain_boiled', 30), ('stock', 190), ('onion', 15), ('oil', 10), ('pepper', 5)])

add('lat-pindasoep-tomtom', 'Pindasoep ku tomtom (met bakbanaanballen)', 'Peanut soup with tomtom',
    'pindasoep tomtom suriname',
    'soup', 'sr', 420, '1 kom',
    [('lat-pindasoep-sr', 350), ('plantain_boiled', 70)])

add('lat-saoto-sr', 'Saoto soep (Suriname)', 'Saoto soup',
    'saoto soep soto suriname javanese kippensoep',
    'soup', 'sr', 400, '1 kom',
    [('chicken_stew', 80), ('rice', 50), ('egg', 30), ('bean_sprouts' if False else 'mixed_veg', 30), ('stock', 180), ('onion', 15), ('oil', 10), ('potato', 5)])

add('lat-herheri', 'Her’heri (Suriname, groente i vis)', 'Herheri',
    'herheri her heri suriname bakbanaan cassave vis',
    'soup', 'sr', 400, '1 kom',
    [('saltfish', 60), ('plantain_boiled', 70), ('yuca', 60), ('sweet_potato', 50), ('onion', 25), ('stock', 120), ('oil', 15)])

add('lat-dhal-sr', 'Dhal soep (Suriname)', 'Surinamese dhal',
    'dhal dal soep suriname linzen',
    'soup', 'sr', 350, '1 kom',
    [('lentils', 140), ('onion', 25), ('stock', 160), ('oil', 10), ('pepper', 8), ('garlic', 7)])

add('lat-bakkeljauw-sr', 'Bakkeljauw (Surinaamse stijl)', 'Surinamese saltfish',
    'bakkeljauw suriname zoutvis',
    'meal', 'sr', 180, '1 portie',
    [('saltfish', 90), ('onion', 30), ('tomato', 25), ('pepper', 15), ('oil', 20)])

add('lat-bami-sr', 'Bami (Suriname)', 'Surinamese bami',
    'bami suriname bami goreng noedels',
    'meal', 'sr', 350, '1 bord',
    [('bami', 230), ('chicken_stew', 60), ('mixed_veg', 40), ('oil', 15), ('onion', 5)])

add('lat-nasi-sr', 'Nasi (Suriname)', 'Surinamese nasi',
    'nasi suriname nasi goreng gebakken rijst',
    'meal', 'sr', 350, '1 bord',
    [('rice', 200), ('chicken_stew', 70), ('mixed_veg', 50), ('oil', 20), ('onion', 10)])

add('lat-bara-sr', 'Bara (Suriname)', 'Surinamese bara',
    'bara suriname lentil fritter',
    'snack', 'sr', 70, '2 stuks',
    [('split_peas', 35), ('flour', 15), ('oil', 20)])

add('lat-tiw-sr', 'Telo (gebakken cassave, Suriname)', 'Telo (fried cassava)',
    'telo cassave suriname gebakken yuca',
    'snack', 'sr', 120, '1 portie',
    [('yuca_fried', 100)], src=SRC)

add('lat-pepperpot-gy', 'Pepperpot (Guyana)', 'Guyanese pepperpot',
    'pepperpot guyana cassareep stoofpot kerst',
    'meal', 'gy', 300, '1 portie',
    [('beef_stew', 100), ('pork', 50), ('oxtail', 40), ('cassareep', 30), ('onion', 20), ('stock', 50), ('oil', 5), ('pepper', 5)])

add('lat-pepperpot-bread-gy', 'Pepperpot with bread (Guyana)', 'Pepperpot with bread',
    'pepperpot with bread guyana plato',
    'meal', 'gy', 400, '1 bord',
    [('lat-pepperpot-gy', 300), ('bread', 100)])

add('lat-metemgee', 'Metemgee (Guyana)', 'Metemgee',
    'metemgee metagee guyana kokos wortelgroenten vis',
    'soup', 'gy', 400, '1 kom',
    [('coconut_milk', 80), ('plantain_boiled', 50), ('yuca', 40), ('yam', 40), ('saltfish', 50), ('dumpling', 30), ('onion', 20), ('stock', 80), ('oil', 5), ('pepper', 5)])

add('lat-cookup-gy', 'Cook-up rice (Guyana)', 'Cook-up rice',
    'cook-up rice cookup guyana rijst bonen vlees',
    'meal', 'gy', 400, '1 bord',
    [('rice', 160), ('beans_black', 50), ('chicken_stew', 70), ('coconut_milk', 50), ('onion', 20), ('oil', 15), ('mixed_veg', 35)])

add('lat-cowheel-gy', 'Cow heel soup (Guyana)', 'Guyanese cow heel soup',
    'cow heel soup guyana',
    'soup', 'gy', 350, '1 kom',
    [('cowheel', 90), ('split_peas', 40), ('dumpling', 30), ('yam', 30), ('onion', 20), ('stock', 125), ('oil', 5), ('carrot', 10)])

add('lat-serre-bz', 'Serre (Belize, kokosvissoep)', 'Serre (Belizean coconut fish soup)',
    'serre belize coconut fish soup kokos vissoep',
    'soup', 'bz', 400, '1 kom',
    [('fish_white', 100), ('coconut_milk', 100), ('plantain_boiled', 50), ('onion', 25), ('stock', 105), ('oil', 10), ('lime_juice', 5), ('pepper', 5)])

add('lat-chimole', 'Chimole / black dinner (Belize)', 'Chimole',
    'chimole black dinner belize recado negro soep',
    'soup', 'bz', 400, '1 kom',
    [('chicken_stew', 100), ('egg', 50), ('onion', 25), ('tomato', 30), ('stock', 175), ('oil', 10), ('pepper', 10)])

add('lat-escabeche-bz', 'Escabeche (Belize, uiensoep met vis of kip)', 'Belizean escabeche',
    'escabeche belize onion soup vis kip',
    'soup', 'bz', 350, '1 kom',
    [('chicken_stew', 80), ('onion', 80), ('lime_juice', 15), ('pepper', 15), ('stock', 150), ('oil', 10)])

add('lat-rice-beans-bz', 'Rice and beans (Belize, met stoofkip)', 'Belizean rice and beans plate',
    'rice and beans belize stew chicken fried plantain',
    'meal', 'bz', 500, '1 bord',
    [('rice', 160), ('beans_kidney', 80), ('coconut_milk', 30), ('chicken_stew', 140), ('plantain_fried', 60), ('coleslaw', 30)])

add('lat-hudut', 'Hudut (Garifuna, vis in kokos met mashed plantain)', 'Hudut',
    'hudut garifuna belize honduras kokos vis plantain',
    'meal', 'bz', 450, '1 bord',
    [('fish_white', 130), ('coconut_milk', 80), ('plantain_boiled', 180), ('onion', 20), ('oil', 20), ('pepper', 10), ('lime_juice', 10)])

print('caribbean block defined')

# ---------------------------------------------------------------------------
# Venezuela & Colombia
# ---------------------------------------------------------------------------
add('lat-arepa-reina', 'Arepa Reina Pepiada', 'Arepa Reina Pepiada',
    'arepa reina pepiada venezuela kip avocado',
    'meal', 've', 220, '1 stuk',
    [('arepa', 120), ('chicken', 50), ('avocado', 40), ('mayo', 10)])

add('lat-arepa-pabellon', 'Arepa pabellón', 'Arepa pabellón',
    'arepa pabellon venezuela carne mechada caraotas platano',
    'meal', 've', 250, '1 stuk',
    [('arepa', 120), ('beef_shredded', 50), ('beans_black', 40), ('plantain_fried', 30), ('cheese', 10)])

add('lat-pabellon-criollo', 'Pabellón criollo (Venezuela)', 'Pabellón criollo',
    'pabellon criollo pabellón venezuela rijst zwarte bonen carne platano',
    'meal', 've', 500, '1 bord',
    [('rice', 160), ('beans_black', 100), ('beef_shredded', 120), ('plantain_fried', 80), ('cheese', 20), ('oil', 20)])

add('lat-cachapa', 'Cachapa (maispannekoek met kaas)', 'Cachapa',
    'cachapa venezuela mais pannenkoek queso de mano',
    'meal', 've', 250, '1 stuk',
    [('corn', 140), ('cheese', 60), ('milk', 25), ('sugar', 10), ('oil', 15)])

add('lat-tequenos-ve', 'Tequeños (Venezuela)', 'Venezuelan tequeños',
    'tequenos venezuela kaasstengels',
    'snack', 've', 80, '3 stuks',
    [('pastry_fried', 45), ('cheese', 25), ('oil', 10)])

add('lat-empanada-ve', 'Empanada venezolana (maisdeeg, gebakken)', 'Venezuelan empanada',
    'empanada venezolana venezuela kasava mais',
    'snack', 've', 130, '1 stuk',
    [('masa', 70), ('beef_shredded', 35), ('oil', 20), ('onion', 5)])

add('lat-asado-negro', 'Asado negro (Venezuela)', 'Asado negro',
    'asado negro venezuela stoofvlees papelón',
    'meal', 've', 250, '1 portie',
    [('beef_stew', 160), ('onion', 25), ('sugar', 15), ('oil', 15), ('stock', 20), ('pepper', 15)])

add('lat-asado-negro-aros', 'Asado negro con arroz', 'Asado negro with rice',
    'asado negro con arroz venezuela',
    'meal', 've', 430, '1 bord',
    [('lat-asado-negro', 250), ('rice', 180)])

add('lat-hallaca', 'Hallaca (Venezuela, kersttamale)', 'Hallaca',
    'hallaca hayaca venezuela kerst tamale',
    'meal', 've', 280, '1 stuk',
    [('masa', 100), ('beef_stew', 40), ('pork', 30), ('chicken_stew', 20), ('raisins', 10), ('olives', 10), ('oil', 20), ('onion', 20), ('pepper', 15), ('rice', 15)])

add('lat-sopa-mondongo-ve', 'Sopa de mondongo (Venezuela)', 'Venezuelan mondongo',
    'sopa de mondongo venezuela penssoep',
    'soup', 've', 350, '1 kom',
    [('tripe', 90), ('potato', 40), ('carrot', 25), ('onion', 25), ('tomato', 25), ('stock', 130), ('oil', 8), ('pepper', 7)])

add('lat-sancocho-ve', 'Sancocho venezolano', 'Venezuelan sancocho',
    'sancocho venezolano venezuela',
    'soup', 've', 400, '1 kom',
    [('chicken_stew', 70), ('beef_stew', 40), ('yuca', 40), ('plantain_boiled', 40), ('potato', 30), ('corn', 30), ('onion', 20), ('stock', 115), ('oil', 5), ('pepper', 10)])

add('lat-pisca-andina', 'Pisca andina (Andesssoep met ei i melk)', 'Pisca andina',
    'pisca andina venezuela andes ontbijtsoep',
    'soup', 've', 350, '1 kom',
    [('milk', 150), ('potato', 80), ('egg', 50), ('onion', 20), ('stock', 40), ('cilantro' if False else 'oil', 5), ('cheese', 5)])

add('lat-sopa-caraotas', 'Sopa de caraotas (Venezuela)', 'Black bean soup (Venezuela)',
    'sopa de caraotas venezuela zwarte bonensoep',
    'soup', 've', 350, '1 kom',
    [('beans_black', 160), ('onion', 25), ('stock', 145), ('oil', 10), ('sofrito', 10)])

add('lat-sopa-res-ve', 'Sopa de res (Venezuela)', 'Venezuelan beef soup',
    'sopa de res venezuela rundensoep',
    'soup', 've', 350, '1 kom',
    [('beef_stew', 90), ('potato', 50), ('carrot', 25), ('onion', 25), ('corn', 20), ('stock', 130), ('oil', 5), ('celery', 5)])

add('lat-ajiaco-co', 'Ajiaco bogotano', 'Ajiaco bogotano',
    'ajiaco bogotano ajiaco colombia kippensoep aardappel capers',
    'soup', 'co', 400, '1 kom',
    [('chicken_stew', 80), ('potato', 140), ('corn', 40), ('onion', 20), ('stock', 100), ('cream', 10), ('avocado', 5), ('oil', 5)])

add('lat-sancocho-gallina-co', 'Sancocho de gallina (Colombia)', 'Colombian hen sancocho',
    'sancocho de gallina colombia',
    'soup', 'co', 400, '1 kom',
    [('chicken_stew', 90), ('yuca', 50), ('plantain_boiled', 50), ('potato', 40), ('corn', 30), ('onion', 20), ('stock', 110), ('oil', 5), ('pepper', 5)])

add('lat-sancocho-trifasico', 'Sancocho trifásico (Colombia)', 'Three-meat sancocho',
    'sancocho trifasico trifásico colombia',
    'soup', 'co', 400, '1 kom',
    [('chicken_stew', 50), ('beef_stew', 50), ('pork', 40), ('yuca', 40), ('plantain_boiled', 40), ('potato', 30), ('corn', 30), ('onion', 20), ('stock', 90), ('oil', 5), ('pepper', 5)])

add('lat-mondongo-co', 'Mondongo colombiano', 'Colombian mondongo',
    'mondongo colombiano colombia penssoep',
    'soup', 'co', 350, '1 kom',
    [('tripe', 90), ('potato', 40), ('carrot', 25), ('onion', 25), ('tomato', 25), ('stock', 130), ('oil', 8), ('peas' if False else 'beans_pigeon', 7)])

add('lat-changua', 'Changua (Colombia, melk-ei ontbijtsoep)', 'Changua',
    'changua colombia ontbijtsoep melk ei',
    'soup', 'co', 300, '1 kom',
    [('milk', 200), ('egg', 55), ('onion', 15), ('bread', 20), ('water', 10)])

add('lat-caldo-costilla', 'Caldo de costilla (Colombia)', 'Rib broth',
    'caldo de costilla colombia ribsoep ontbijt',
    'soup', 'co', 350, '1 kom',
    [('beef_stew', 90), ('potato', 80), ('onion', 25), ('stock', 140), ('oil', 5), ('cilantro' if False else 'pepper', 10)])

add('lat-bandeja-paisa', 'Bandeja paisa (Colombia)', 'Bandeja paisa',
    'bandeja paisa colombia bonen rijst gehakt chicharron ei platano',
    'meal', 'co', 700, '1 bord',
    [('beans_red', 120), ('rice', 150), ('ground_beef', 80), ('chicharron', 40), ('egg', 55), ('plantain_fried', 60), ('avocado', 40), ('white_roll', 40), ('oil', 15), ('chorizo' if False else 'sausage', 100)])

add('lat-ajiaco-plato', 'Ajiaco met rijst i avocado', 'Ajiaco with rice and avocado',
    'ajiaco met rijst colombia bord',
    'meal', 'co', 550, '1 bord',
    [('lat-ajiaco-co', 350), ('rice', 120), ('avocado', 80)])

add('lat-arepa-huevo-co', 'Arepa de huevo (Colombia, Costa)', 'Arepa de huevo',
    'arepa de huevo colombia cartagena ei',
    'meal', 'co', 180, '1 stuk',
    [('masa', 90), ('egg', 55), ('oil', 30), ('onion', 5)])

add('lat-empanada-co', 'Empanada colombiana', 'Colombian empanada',
    'empanada colombiana colombia',
    'snack', 'co', 120, '1 stuk',
    [('masa', 60), ('potato', 25), ('ground_beef', 20), ('oil', 15)])

add('lat-cazuela-mariscos-co', 'Cazuela de mariscos (Colombia)', 'Colombian seafood casserole',
    'cazuela de mariscos colombia zeevruchten',
    'soup', 'co', 350, '1 kom',
    [('shrimp', 50), ('fish_white', 50), ('coconut_milk', 80), ('potato', 30), ('onion', 20), ('stock', 100), ('oil', 10), ('pepper', 10)])

add('lat-mute', 'Mute santandereano', 'Mute santandereano',
    'mute santandereano colombia mais pens',
    'soup', 'co', 350, '1 kom',
    [('hominy', 100), ('tripe', 50), ('pork', 40), ('onion', 20), ('stock', 125), ('oil', 8), ('pepper', 7)])

# Brazil
add('lat-feijoada', 'Feijoada (Brazilië)', 'Feijoada',
    'feijoada brazilië brazilie zwarte bonen varkensvlees',
    'meal', 'br', 400, '1 bord',
    [('beans_black', 150), ('pork_fatty', 60), ('sausage', 40), ('beef_stew', 30), ('onion', 20), ('oil', 10), ('rice', 5), ('orange_juice', 5), ('stock', 80)])

add('lat-feijoada-plato', 'Feijoada completa (met rijst, farofa, sinaasappel)', 'Complete feijoada plate',
    'feijoada completa brazilië bord rijst farofa couve',
    'meal', 'br', 600, '1 bord',
    [('lat-feijoada', 300), ('rice', 150), ('flour', 20), ('oil', 10), ('cabbage', 80), ('orange_juice', 20), ('plantain_fried', 20)])

add('lat-moqueca', 'Moqueca de peixe (Brazilië)', 'Moqueca',
    'moqueca de peixe brazilië visstoofpot kokos dende',
    'meal', 'br', 350, '1 portie',
    [('fish_white', 150), ('coconut_milk', 80), ('tomato', 40), ('onion', 30), ('pepper', 25), ('oil', 15), ('lime_juice', 10)])

add('lat-moqueca-rijst', 'Moqueca com arroz', 'Moqueca with rice',
    'moqueca com arroz brazilië',
    'meal', 'br', 500, '1 bord',
    [('lat-moqueca', 320), ('rice', 180)])

add('lat-canja', 'Canja de galinha', 'Canja de galinha',
    'canja de galinha brazilië kippensoep rijst',
    'soup', 'br', 350, '1 kom',
    [('chicken_stew', 80), ('rice', 50), ('carrot', 25), ('onion', 25), ('stock', 160), ('oil', 5), ('celery', 5)])

add('lat-caldo-feijao', 'Caldo de feijão', 'Bean broth',
    'caldo de feijao feijão brazilië bonensoep',
    'soup', 'br', 300, '1 kom',
    [('beans_black', 140), ('onion', 25), ('stock', 120), ('oil', 10), ('bacon', 5)])

add('lat-caldo-mocoto', 'Caldo de mocotó (koeienpootsoep)', 'Caldo de mocotó',
    'caldo de mocoto mocotó brazilië koeienpoot',
    'soup', 'br', 350, '1 kom',
    [('cowheel', 100), ('onion', 25), ('potato', 40), ('stock', 170), ('oil', 8), ('pepper', 7)])

add('lat-tacaca', 'Tacacá (Amazone, Pará)', 'Tacacá',
    'tacaca tacacá brazilië amazone garnaal tucupi',
    'soup', 'br', 300, '1 kom',
    [('shrimp', 60), ('yuca', 80), ('stock', 140), ('oil', 10), ('pepper', 10)])

add('lat-caldo-camarao', 'Caldo de camarão', 'Shrimp broth (Brazil)',
    'caldo de camarao camarão brazilië garnalensoep',
    'soup', 'br', 300, '1 kom',
    [('shrimp', 80), ('onion', 25), ('tomato', 30), ('stock', 150), ('oil', 10), ('pepper', 5)])

add('lat-sopa-mandioca', 'Sopa de mandioca', 'Cassava soup (Brazil)',
    'sopa de mandioca brazilië cassavesoep',
    'soup', 'br', 350, '1 kom',
    [('yuca', 140), ('chicken_stew', 50), ('onion', 25), ('stock', 120), ('oil', 8), ('pepper', 7)])

add('lat-pao-queijo', 'Pão de queijo', 'Pão de queijo',
    'pao de queijo pão de queijo brazilië kaabroodje cassave',
    'snack', 'br', 40, '2 stuks',
    [('yuca', 15), ('flour', 5), ('cheese', 12), ('egg', 5), ('oil', 3)])

add('lat-coxinha', 'Coxinha (kipkroket)', 'Coxinha',
    'coxinha brazilië kipkroket',
    'snack', 'br', 80, '1 stuk',
    [('pastry_fried', 40), ('chicken_stew', 25), ('oil', 10), ('cheese', 5)])

add('lat-brigadeiro', 'Brigadeiro', 'Brigadeiro',
    'brigadeiro brazilië chocolade snoep',
    'snack', 'br', 30, '1 stuk',
    [('condensed_milk', 60), ('sugar', 10), ('butter', 10), ('flour' if False else 'coconut_grated', 20)])  # cocoa approx via sugar/fat; keep estimate

add('lat-acai-bowl', 'Açaí bowl (met granola i banaan)', 'Açaí bowl',
    'acai açaí bowl brazilië',
    'meal', 'br', 300, '1 kom',
    [('banana', 80), ('sugar', 15), ('granola' if False else 'flour', 20), ('milk', 40), ('ice', 30), ('honey', 10), ('berries' if False else 'mango', 105)])

add('lat-vatapa', 'Vatapá', 'Vatapá',
    'vatapa vatapá brazilië bahia brood kokos garnaal',
    'meal', 'br', 200, '1 portie',
    [('bread', 40), ('coconut_milk', 60), ('shrimp', 40), ('peanuts', 20), ('oil', 20), ('onion', 20)])

# Peru / Ecuador / Bolivia
add('lat-ceviche-pe', 'Ceviche peruano', 'Peruvian ceviche',
    'ceviche peruano peru vis limoen ui',
    'meal', 'pe', 250, '1 portie',
    [('fish_white', 150), ('lime_juice', 40), ('onion', 30), ('pepper', 15), ('sweet_potato', 15)])

add('lat-ceviche-mixto', 'Ceviche mixto', 'Mixed ceviche',
    'ceviche mixto peru garnaal vis',
    'meal', 'pe', 250, '1 portie',
    [('fish_white', 80), ('shrimp', 70), ('lime_juice', 40), ('onion', 30), ('pepper', 15), ('sweet_potato', 15)])

add('lat-lomo-saltado', 'Lomo saltado', 'Lomo saltado',
    'lomo saltado peru roerbak rund tomaat friet',
    'meal', 'pe', 450, '1 bord',
    [('beef_stew', 140), ('potato', 120), ('oil', 20), ('tomato', 50), ('onion', 40), ('rice', 70), ('pepper', 10)])

add('lat-aji-gallina', 'Ají de gallina', 'Ají de gallina',
    'aji de gallina ají de gallina peru kip roomsaus',
    'meal', 'pe', 350, '1 bord',
    [('chicken', 120), ('bread', 30), ('evaporated_milk', 40), ('cheese', 15), ('oil', 15), ('onion', 20), ('rice', 100), ('potato', 10)])

add('lat-anticuchos', 'Anticuchos (hartenbrochettes)', 'Anticuchos',
    'anticuchos peru brochette hart',
    'protein', 'pe', 150, '2 stuks',
    [('beef_stew', 120), ('oil', 15), ('pepper', 10), ('onion', 5)])

add('lat-chupe-camarones', 'Chupe de camarones', 'Shrimp chupe',
    'chupe de camarones peru garnalensoep melk',
    'soup', 'pe', 400, '1 kom',
    [('shrimp', 80), ('milk', 80), ('potato', 70), ('corn', 30), ('egg', 30), ('rice', 20), ('onion', 20), ('stock', 55), ('oil', 10), ('peas' if False else 'cheese', 5)])

add('lat-sopa-criolla', 'Sopa criolla (Peru)', 'Sopa criolla',
    'sopa criolla peru rund noedels ei',
    'soup', 'pe', 350, '1 kom',
    [('beef_stew', 70), ('pasta', 40), ('tomato', 30), ('egg', 40), ('onion', 20), ('stock', 140), ('oil', 10)])

add('lat-caldo-gallina-pe', 'Caldo de gallina (Peru)', 'Peruvian hen soup',
    'caldo de gallina peru kippensoep noedels',
    'soup', 'pe', 400, '1 kom',
    [('chicken_stew', 90), ('pasta', 40), ('potato', 40), ('egg', 30), ('onion', 20), ('stock', 170), ('oil', 5), ('carrot', 5)])

add('lat-parihuela', 'Parihuela (Peruaanse zeevruchtensoep)', 'Parihuela',
    'parihuela peru zeevruchtensoep',
    'soup', 'pe', 400, '1 kom',
    [('fish_white', 70), ('shrimp', 40), ('conch' if False else 'crab', 30), ('tomato', 30), ('onion', 20), ('stock', 190), ('oil', 10), ('pepper', 10)])

add('lat-aguadito', 'Aguadito de pollo', 'Aguadito de pollo',
    'aguadito de pollo peru koriander kippensoep rijst',
    'soup', 'pe', 350, '1 kom',
    [('chicken_stew', 80), ('rice', 40), ('onion', 20), ('pepper', 15), ('stock', 180), ('oil', 8), ('carrot', 7)])

add('lat-chairo', 'Chairo (Andesssoep)', 'Chairo',
    'chairo bolivia peru andes chuño',
    'soup', 'bo', 350, '1 kom',
    [('beef_stew', 60), ('potato', 80), ('beans_kidney', 30), ('carrot', 20), ('onion', 20), ('stock', 130), ('oil', 5), ('chuño' if False else 'taro', 5)])

add('lat-encebollado', 'Encebollado (Ecuador, tonijn-uiensoep)', 'Encebollado',
    'encebollado ecuador tonijn ui vissoep ontbijt',
    'soup', 'ec', 400, '1 kom',
    [('tuna', 100), ('onion', 80), ('yuca', 80), ('lime_juice', 20), ('stock', 100), ('oil', 10), ('pepper', 10)])

add('lat-locro-papas', 'Locro de papas (Ecuador)', 'Locro de papas',
    'locro de papas ecuador aardappelsoep kaas avocado',
    'soup', 'ec', 350, '1 kom',
    [('potato', 160), ('milk', 60), ('cheese', 25), ('onion', 20), ('stock', 60), ('oil', 10), ('avocado', 15)])

add('lat-fanesca', 'Fanesca (Ecuador, paas-graansoep)', 'Fanesca',
    'fanesca ecuador pasen graan vissoep',
    'soup', 'ec', 400, '1 kom',
    [('saltfish', 40), ('beans_kidney', 30), ('beans_pigeon', 20), ('corn', 30), ('pumpkin', 30), ('milk', 50), ('peanuts', 15), ('onion', 20), ('stock', 150), ('oil', 10), ('cheese', 5)])

add('lat-yaguarlocro', 'Yaguarlocro (Ecuador)', 'Yaguarlocro',
    'yaguarlocro ecuador penssoep bloed',
    'soup', 'ec', 350, '1 kom',
    [('tripe', 80), ('potato', 80), ('onion', 25), ('stock', 145), ('oil', 10), ('pepper', 10)])

add('lat-sopa-mani-bo', 'Sopa de maní (Bolivia)', 'Bolivian peanut soup',
    'sopa de mani maní bolivia pindasoep',
    'soup', 'bo', 350, '1 kom',
    [('peanuts', 50), ('chicken_stew', 50), ('potato', 50), ('stock', 175), ('onion', 15), ('oil', 10)])

add('lat-fricase-bo', 'Fricasé (Bolivia, varkenssoep)', 'Bolivian fricasé',
    'fricase fricasé bolivia varkenssoep',
    'soup', 'bo', 400, '1 kom',
    [('pork', 100), ('hominy', 60), ('potato', 50), ('onion', 25), ('stock', 145), ('oil', 10), ('pepper', 10)])

add('lat-caldo-pata-ec', 'Caldo de pata (Ecuador)', 'Ecuadorian cow-foot soup',
    'caldo de pata ecuador koeienpootsoep',
    'soup', 'ec', 350, '1 kom',
    [('cowheel', 90), ('hominy', 50), ('peanuts', 20), ('onion', 25), ('stock', 150), ('oil', 8), ('pepper', 7)])

# Southern cone
add('lat-locro-ar', 'Locro argentino', 'Argentine locro',
    'locro argentino argentinë argentina mais bonen stoofpot',
    'soup', 'ar', 400, '1 kom',
    [('hominy', 80), ('beans_white' if False else 'beans_kidney', 50), ('pumpkin', 40), ('pork', 50), ('sausage', 30), ('onion', 25), ('stock', 110), ('oil', 10), ('pepper', 5)])

add('lat-empanada-ar', 'Empanada argentina (uit de oven)', 'Argentine empanada',
    'empanada argentina argentinë oven',
    'snack', 'ar', 100, '1 stuk',
    [('pastry_baked', 60), ('ground_beef', 25), ('onion', 8), ('egg', 5), ('olives', 2)])

add('lat-asado-ar', 'Asado (Argentijnse grill)', 'Asado',
    'asado argentinë argentina asado parrilla',
    'protein', 'ar', 200, '1 portie',
    [('beef_stew', 180), ('oil', 10), ('salt' if False else 'onion', 10)])

add('lat-asado-plato-ar', 'Asado met ensalada criolla i brood', 'Asado plate with salad and bread',
    'asado plato argentinë bord',
    'meal', 'ar', 450, '1 bord',
    [('lat-asado-ar', 200), ('bread', 80), ('tomato', 80), ('onion', 40), ('oil', 20), ('pepper', 30)])

add('lat-choripan', 'Choripán', 'Choripán',
    'choripan choripán argentinë chorizo brood',
    'meal', 'ar', 200, '1 stuk',
    [('white_roll', 80), ('sausage', 90), ('oil', 10), ('onion', 20)])

add('lat-carbonada', 'Carbonada criolla', 'Carbonada criolla',
    'carbonada criolla argentinë stoofpot perzik',
    'soup', 'ar', 350, '1 kom',
    [('beef_stew', 80), ('potato', 50), ('sweet_potato', 40), ('corn', 30), ('pumpkin', 30), ('onion', 20), ('stock', 90), ('oil', 5), ('raisins', 5)])

add('lat-cazuela-cl', 'Cazuela chilena', 'Chilean cazuela',
    'cazuela chilena chili soep rund pompoen',
    'soup', 'cl', 400, '1 kom',
    [('beef_stew', 80), ('potato', 60), ('pumpkin', 50), ('corn', 30), ('rice', 20), ('onion', 20), ('stock', 125), ('oil', 5), ('carrot', 10)])

add('lat-caldillo-congrio', 'Caldillo de congrio (Chili)', 'Caldillo de congrio',
    'caldillo de congrio chili vissoep conger',
    'soup', 'cl', 350, '1 kom',
    [('fish_fatty', 100), ('potato', 50), ('onion', 25), ('tomato', 25), ('stock', 130), ('oil', 10), ('carrot', 10)])

add('lat-puchero', 'Puchero (Argentinië / Uruguay)', 'Puchero',
    'puchero argentinë uruguay stoofpot',
    'soup', 'ar', 400, '1 kom',
    [('beef_stew', 80), ('chicken_stew', 40), ('potato', 50), ('carrot', 30), ('chickpeas', 30), ('onion', 20), ('stock', 135), ('oil', 5), ('cabbage', 10)])

add('lat-bori-bori', 'Bori bori (Paraguay, soep met maïsballen)', 'Bori bori',
    'bori bori paraguay soep maisballen',
    'soup', 'py', 350, '1 kom',
    [('chicken_stew', 70), ('cornmeal_dry', 30), ('cheese', 15), ('onion', 20), ('stock', 200), ('oil', 8), ('carrot', 7)])

add('lat-sopa-paraguaya', 'Sopa paraguaya (maisbrood, geen soep)', 'Sopa paraguaya',
    'sopa paraguaya paraguay maisbrood kaas',
    'carb', 'py', 120, '1 stuk',
    [('cornmeal_dry', 30), ('cheese', 25), ('egg', 20), ('onion', 15), ('oil', 10)])

add('lat-chipa', 'Chipá (Paraguay / NO-Argentinië)', 'Chipá',
    'chipa chipá paraguay kaas cassave broodje',
    'snack', 'py', 50, '1 stuk',
    [('yuca', 20), ('cheese', 15), ('egg', 8), ('oil', 7)])

add('lat-completo', 'Completo (Chileense hotdog)', 'Completo',
    'completo chili hotdog avocado zuurkool',
    'meal', 'cl', 250, '1 stuk',
    [('white_roll', 70), ('sausage', 70), ('avocado', 40), ('mayo', 20), ('tomato', 30), ('cabbage', 20)])

add('lat-pastel-choclo', 'Pastel de choclo (Chili)', 'Pastel de choclo',
    'pastel de choclo chili mais ovenschotel gehakt',
    'meal', 'cl', 300, '1 portie',
    [('corn', 120), ('ground_beef', 80), ('chicken_stew', 20), ('onion', 25), ('egg', 20), ('oil', 15), ('sugar', 10), ('milk', 10)])

# Mexico
add('lat-pozole-rojo', 'Pozole rojo', 'Pozole rojo',
    'pozole rojo mexico maissoep varken',
    'soup', 'mx', 400, '1 kom',
    [('hominy', 140), ('pork', 80), ('onion', 20), ('stock', 140), ('oil', 8), ('pepper', 12)])

add('lat-pozole-verde', 'Pozole verde', 'Pozole verde',
    'pozole verde mexico',
    'soup', 'mx', 400, '1 kom',
    [('hominy', 140), ('chicken_stew', 80), ('onion', 20), ('stock', 140), ('oil', 8), ('pepper', 12)])

add('lat-pozole-blanco', 'Pozole blanco', 'Pozole blanco',
    'pozole blanco mexico',
    'soup', 'mx', 400, '1 kom',
    [('hominy', 140), ('pork', 80), ('onion', 20), ('stock', 145), ('oil', 8), ('pepper', 7)])

add('lat-menudo', 'Menudo (penssoep, Mexico)', 'Menudo',
    'menudo mexico penssoep',
    'soup', 'mx', 350, '1 kom',
    [('tripe', 90), ('hominy', 60), ('onion', 25), ('stock', 155), ('oil', 8), ('pepper', 12)])

add('lat-caldo-res-mx', 'Caldo de res (Mexico)', 'Mexican beef soup',
    'caldo de res mexico rundensoep',
    'soup', 'mx', 400, '1 kom',
    [('beef_stew', 80), ('potato', 40), ('carrot', 30), ('corn', 30), ('cabbage', 30), ('onion', 20), ('stock', 155), ('oil', 5), ('celery', 10)])

add('lat-caldo-pollo-mx', 'Caldo de pollo (Mexico)', 'Mexican chicken soup',
    'caldo de pollo mexico kippensoep',
    'soup', 'mx', 350, '1 kom',
    [('chicken_stew', 80), ('potato', 40), ('carrot', 30), ('onion', 20), ('stock', 165), ('oil', 5), ('celery', 10)])

add('lat-sopa-tortilla', 'Sopa de tortilla / sopa azteca', 'Tortilla soup',
    'sopa de tortilla sopa azteca mexico',
    'soup', 'mx', 350, '1 kom',
    [('tomato', 80), ('corn_tortilla', 40), ('chicken_stew', 40), ('cheese', 20), ('avocado', 20), ('stock', 135), ('oil', 10), ('onion', 5)])

add('lat-sopa-lima', 'Sopa de lima (Yucatán)', 'Sopa de lima',
    'sopa de lima yucatan mexico',
    'soup', 'mx', 350, '1 kom',
    [('chicken_stew', 70), ('lime_juice', 20), ('corn_tortilla', 30), ('onion', 20), ('tomato', 25), ('stock', 175), ('oil', 10)])

add('lat-mole-olla', 'Mole de olla', 'Mole de olla',
    'mole de olla mexico rund stoofsoep',
    'soup', 'mx', 400, '1 kom',
    [('beef_stew', 90), ('potato', 40), ('chayote', 30), ('carrot', 25), ('onion', 20), ('stock', 175), ('oil', 10), ('pepper', 10)])

add('lat-caldo-tlalpeno', 'Caldo tlalpeño', 'Caldo tlalpeño',
    'caldo tlalpeno tlalpeño mexico kip kikkererwten',
    'soup', 'mx', 350, '1 kom',
    [('chicken_stew', 80), ('chickpeas', 50), ('carrot', 25), ('onion', 20), ('stock', 160), ('oil', 8), ('pepper', 7)])

add('lat-sopa-fideo', 'Sopa de fideo', 'Sopa de fideo',
    'sopa de fideo mexico vermicellisoep',
    'soup', 'mx', 300, '1 kom',
    [('pasta', 50), ('tomato', 50), ('onion', 20), ('stock', 170), ('oil', 10)])

add('lat-chilpachole', 'Chilpachole de jaiba (krabsoep, Veracruz)', 'Chilpachole',
    'chilpachole jaiba mexico veracruz krabsoep',
    'soup', 'mx', 350, '1 kom',
    [('crab', 90), ('tomato', 50), ('onion', 25), ('stock', 165), ('oil', 10), ('pepper', 10)])

add('lat-caldo-siete-mares', 'Caldo de siete mares', 'Seven seas soup',
    'caldo de siete mares mexico zeevruchtensoep',
    'soup', 'mx', 400, '1 kom',
    [('fish_white', 50), ('shrimp', 40), ('crab', 30), ('tomato', 30), ('onion', 20), ('stock', 210), ('oil', 10), ('pepper', 10)])

add('lat-tacos-pastor', 'Tacos al pastor (3 stuks)', 'Tacos al pastor (3)',
    'tacos al pastor mexico taco',
    'meal', 'mx', 250, '3 stuks',
    [('corn_tortilla', 90), ('pork', 90), ('pineapple', 20), ('onion', 20), ('oil', 15), ('cilantro' if False else 'pepper', 15)])

add('lat-tacos-carnitas', 'Tacos de carnitas (3 stuks)', 'Carnitas tacos (3)',
    'tacos de carnitas mexico',
    'meal', 'mx', 250, '3 stuks',
    [('corn_tortilla', 90), ('pork_fatty', 90), ('onion', 25), ('oil', 15), ('lime_juice', 10), ('cabbage', 20)])

add('lat-enchiladas-rojas', 'Enchiladas rojas (2 stuks)', 'Red enchiladas (2)',
    'enchiladas rojas mexico',
    'meal', 'mx', 300, '2 stuks',
    [('corn_tortilla', 80), ('chicken', 80), ('cheese', 40), ('tomato_sauce', 50), ('cream', 20), ('oil', 20), ('onion', 10)])

add('lat-chiles-rellenos', 'Chiles rellenos', 'Chiles rellenos',
    'chiles rellenos mexico gevulde peper',
    'meal', 'mx', 250, '1 stuk',
    [('pepper', 80), ('cheese', 60), ('egg', 40), ('tomato_sauce', 40), ('oil', 25), ('flour', 5)])

add('lat-guacamole', 'Guacamole', 'Guacamole',
    'guacamole mexico avocado',
    'fat', 'mx', 60, '2 eetlepels',
    [('avocado', 80), ('onion', 8), ('tomato', 7), ('lime_juice', 5)])

add('lat-elote', 'Elote (Mexicaanse maiskolf)', 'Elote',
    'elote mexico maiskolf mayo kaas',
    'snack', 'mx', 200, '1 kolf',
    [('corn', 140), ('mayo', 20), ('cheese', 25), ('oil', 10), ('lime_juice', 5)])

add('lat-tamal-mx', 'Tamal (Mexico)', 'Mexican tamal',
    'tamal tamale mexico',
    'meal', 'mx', 150, '1 stuk',
    [('masa', 90), ('pork', 30), ('oil', 20), ('onion', 10)])

# Central America
add('lat-kakik', 'Kak’ik (Guatemala, kalkoensoep)', 'Kak\'ik',
    'kakik kak’ik guatemala kalkoensoep',
    'soup', 'gt', 400, '1 kom',
    [('turkey', 100), ('tomato', 40), ('onion', 25), ('stock', 210), ('oil', 10), ('pepper', 15)])

add('lat-pepian', 'Pepián (Guatemala)', 'Pepián',
    'pepian pepián guatemala stoofpot',
    'meal', 'gt', 300, '1 portie',
    [('chicken_stew', 120), ('tomato', 40), ('pumpkin', 20), ('sesame' if False else 'peanuts', 15), ('onion', 20), ('stock', 70), ('oil', 10), ('rice', 5)])

add('lat-pepian-rijst', 'Pepián con arroz y tortilla', 'Pepián with rice and tortilla',
    'pepian con arroz guatemala',
    'meal', 'gt', 480, '1 bord',
    [('lat-pepian', 250), ('rice', 150), ('corn_tortilla', 80)])

add('lat-sopa-pata-sv', 'Sopa de pata (El Salvador)', 'Salvadoran cow-foot soup',
    'sopa de pata el salvador koeienpootsoep',
    'soup', 'sv', 400, '1 kom',
    [('cowheel', 90), ('tripe', 30), ('yuca', 40), ('corn', 30), ('cabbage', 25), ('onion', 20), ('stock', 150), ('oil', 8), ('pepper', 7)])

add('lat-sopa-res-sv', 'Sopa de res (El Salvador)', 'Salvadoran beef soup',
    'sopa de res el salvador',
    'soup', 'sv', 400, '1 kom',
    [('beef_stew', 80), ('yuca', 40), ('plantain_boiled', 30), ('corn', 30), ('carrot', 25), ('onion', 20), ('stock', 160), ('oil', 5), ('cabbage', 10)])

add('lat-pupusa-frijol', 'Pupusa de frijol (El Salvador)', 'Bean pupusa',
    'pupusa de frijol el salvador',
    'meal', 'sv', 130, '1 stuk',
    [('masa', 80), ('beans_red', 30), ('oil', 15), ('cheese', 5)])

add('lat-pupusa-queso', 'Pupusa de queso', 'Cheese pupusa',
    'pupusa de queso el salvador',
    'meal', 'sv', 130, '1 stuk',
    [('masa', 80), ('cheese', 35), ('oil', 15)])

add('lat-pupusa-revuelta', 'Pupusa revuelta (chicharrón, bonen i kaas)', 'Revuelta pupusa',
    'pupusa revuelta el salvador',
    'meal', 'sv', 140, '1 stuk',
    [('masa', 75), ('chicharron', 15), ('beans_red', 15), ('cheese', 20), ('oil', 15)])

add('lat-pupusas-curtido', 'Pupusas (2) met curtido', 'Two pupusas with curtido',
    'pupusas curtido el salvador bord',
    'meal', 'sv', 320, '2 stuks',
    [('lat-pupusa-revuelta', 140), ('lat-pupusa-frijol', 130), ('cabbage', 40), ('carrot', 10)])

add('lat-sopa-caracol-hn', 'Sopa de caracol (Honduras)', 'Honduran conch soup',
    'sopa de caracol honduras karkosoep kokos',
    'soup', 'hn', 400, '1 kom',
    [('conch', 90), ('coconut_milk', 80), ('yuca', 40), ('plantain_boiled', 30), ('onion', 20), ('stock', 125), ('oil', 8), ('pepper', 7)])

add('lat-tapado-hn', 'Tapado (Garifuna, Honduras)', 'Tapado',
    'tapado honduras garifuna kokos zeevruchten',
    'soup', 'hn', 400, '1 kom',
    [('fish_white', 60), ('shrimp', 40), ('coconut_milk', 80), ('plantain_boiled', 50), ('yuca', 40), ('onion', 20), ('stock', 95), ('oil', 8), ('pepper', 7)])

add('lat-baleada', 'Baleada (Honduras)', 'Baleada',
    'baleada honduras tortilla bonen kaas',
    'meal', 'hn', 220, '1 stuk',
    [('wheat_tortilla', 80), ('beans_red', 70), ('cheese', 30), ('cream', 20), ('egg', 20)])

add('lat-sopa-albondigas-ni', 'Sopa de albóndigas (Nicaragua)', 'Nicaraguan meatball soup',
    'sopa de albondigas albóndigas nicaragua',
    'soup', 'ni', 350, '1 kom',
    [('ground_beef', 70), ('rice', 20), ('potato', 40), ('carrot', 25), ('onion', 20), ('stock', 160), ('oil', 8), ('tomato', 7)])

add('lat-gallo-pinto', 'Gallo pinto (Nicaragua / Costa Rica)', 'Gallo pinto',
    'gallo pinto nicaragua costa rica rijst bonen ontbijt',
    'carb', 'ni', 250, '1 portie',
    [('rice', 130), ('beans_red', 80), ('onion', 15), ('oil', 15), ('pepper', 10)])

add('lat-gallo-pinto-plato', 'Gallo pinto con huevo, queso i plátano', 'Gallo pinto breakfast plate',
    'gallo pinto ontbijt ei kaas platano costa rica nicaragua',
    'meal', 'cr', 450, '1 bord',
    [('lat-gallo-pinto', 220), ('egg', 55), ('queso_fresco', 40), ('plantain_fried', 80), ('sour_cream', 25), ('corn_tortilla', 30)])

add('lat-olla-carne', 'Olla de carne (Costa Rica)', 'Olla de carne',
    'olla de carne costa rica rund stoofsoep',
    'soup', 'cr', 400, '1 kom',
    [('beef_stew', 80), ('yuca', 40), ('potato', 40), ('corn', 30), ('plantain_boiled', 30), ('carrot', 20), ('onion', 20), ('stock', 125), ('oil', 5), ('chayote', 10)])

add('lat-sopa-negra-cr', 'Sopa negra (Costa Rica)', 'Costa Rican black bean soup',
    'sopa negra costa rica zwarte bonensoep ei',
    'soup', 'cr', 350, '1 kom',
    [('beans_black', 150), ('egg', 50), ('onion', 25), ('stock', 110), ('oil', 8), ('pepper', 7)])

add('lat-casado', 'Casado (Costa Rica)', 'Casado',
    'casado costa rica rijst bonen vlees platano salade',
    'meal', 'cr', 550, '1 bord',
    [('rice', 150), ('beans_red', 80), ('chicken_stew', 120), ('plantain_fried', 60), ('cabbage', 40), ('potato', 40), ('oil', 20), ('tomato', 40)])

add('lat-sancocho-pa', 'Sancocho panameño', 'Panamanian sancocho',
    'sancocho panameno panameño panama',
    'soup', 'pa', 400, '1 kom',
    [('chicken_stew', 90), ('yam', 50), ('yuca', 40), ('corn', 30), ('onion', 20), ('stock', 155), ('oil', 5), ('cilantro' if False else 'pepper', 10)])

add('lat-sancocho-pa-arroz', 'Sancocho panameño con arroz', 'Panamanian sancocho with rice',
    'sancocho panama con arroz',
    'meal', 'pa', 550, '1 bord',
    [('lat-sancocho-pa', 370), ('rice', 180)])

add('lat-hojaldres', 'Hojaldres (Panama, ontbijtbrood)', 'Hojaldres',
    'hojaldres panama ontbijt gebakken brood',
    'carb', 'pa', 70, '1 stuk',
    [('johnny_cake', 100)], src=SRC)

# Extra widely eaten staples / drinks / snacks to round out coverage
add('lat-maduros', 'Maduros (rijpe gebakken bakbanaan)', 'Maduros',
    'maduros platano maduro rijpe bakbanaan caribe latino',
    'carb', 'car', 120, '1 portie',
    [('plantain_fried', 100)], src=SRC_USDA)

add('lat-arroz-frijoles-gen', 'Arroz con frijoles / rice and beans', 'Rice and beans',
    'arroz con frijoles rice and beans rijst bonen caribe latino',
    'carb', 'car', 200, '1 portie',
    [('rice', 130), ('beans_kidney', 60), ('sofrito', 8), ('oil', 2)])

add('lat-yuca-con-mojo', 'Yuca con mojo', 'Yuca with mojo',
    'yuca con mojo cassave knoflooksaus cuba caribe',
    'carb', 'cu', 180, '1 portie',
    [('yuca', 150), ('oil', 15), ('garlic', 8), ('lime_juice', 7)])

add('lat-horchata-mx', 'Horchata (Mexico)', 'Horchata',
    'horchata mexico rijstmelk kaneel',
    'drink', 'mx', 250, '1 glas',
    [('rice', 30), ('milk', 80), ('sugar', 20), ('water', 120)])

add('lat-jamaica-drink', 'Agua de jamaica (hibiscusdrank)', 'Agua de jamaica',
    'agua de jamaica hibiscus mexico jamaica drank',
    'drink', 'mx', 250, '1 glas',
    [('sorrel', 30), ('sugar', 20), ('water', 200)])

add('lat-chicha-morada', 'Chicha morada (Peru)', 'Chicha morada',
    'chicha morada peru paarse mais drank',
    'drink', 'pe', 250, '1 glas',
    [('sugar', 20), ('pineapple', 20), ('lime_juice', 10), ('water', 200)])

add('lat-mate', 'Mate (Argentinië / Uruguay)', 'Mate',
    'mate yerba mate argentinë uruguay',
    'drink', 'ar', 200, '1 calabaza',
    [('water', 200)])

add('lat-pina-colada', 'Piña colada', 'Piña colada',
    'pina colada piña colada puerto rico cocktail',
    'drink', 'pr', 250, '1 glas',
    [('pineapple', 80), ('coconut_milk', 60), ('rum', 40), ('sugar', 15), ('ice', 55)],
    src=SRC_ALC)

add('lat-mojito', 'Mojito', 'Mojito',
    'mojito cuba cocktail rum munt',
    'drink', 'cu', 200, '1 glas',
    [('rum', 45), ('sugar', 15), ('lime_juice', 25), ('water', 115)],
    src=SRC_ALC)

add('lat-rum-punch', 'Rum punch (Caribisch)', 'Rum punch',
    'rum punch rumponche caribe jamaica barbados',
    'drink', 'car', 200, '1 glas',
    [('rum', 45), ('orange_juice', 60), ('pineapple', 40), ('sugar', 15), ('lime_juice', 15), ('water', 25)],
    src=SRC_ALC)

add('lat-sorrel-drink', 'Sorrel / hibiscus punch (Caribisch)', 'Sorrel drink',
    'sorrel drink hibiscus jamaica trinidad christmas',
    'drink', 'jm', 250, '1 glas',
    [('sorrel', 40), ('sugar', 22), ('water', 188)])

add('lat-mauby', 'Mauby (Caribische drank)', 'Mauby',
    'mauby mavi mabí barbados trinidad virgin islands',
    'drink', 'bb', 250, '1 glas',
    [('sugar', 20), ('water', 230)])

add('lat-coquito', 'Coquito (Puerto Rico)', 'Coquito',
    'coquito puerto rico kokos rum kerst',
    'drink', 'pr', 100, '1 glas',
    [('coconut_milk', 40), ('condensed_milk', 25), ('rum', 25), ('evaporated_milk', 10)],
    src=SRC_ALC)

add('lat-tres-leches', 'Tres leches (punt)', 'Tres leches cake',
    'tres leches mexico latino taart',
    'snack', 'mx', 120, '1 punt',
    [('flour', 20), ('sugar', 20), ('egg', 20), ('condensed_milk', 20), ('evaporated_milk', 15), ('milk', 15), ('cream', 10)])

add('lat-flan', 'Flan / crème caramel', 'Flan',
    'flan creme caramel latino mexico cuba',
    'snack', 'mx', 120, '1 punt',
    [('condensed_milk', 35), ('evaporated_milk', 25), ('egg', 25), ('sugar', 15)])

add('lat-arroz-leche', 'Arroz con leche', 'Rice pudding',
    'arroz con leche rijstpudding latino caribe',
    'snack', 'car', 180, '1 kom',
    [('rice', 60), ('milk', 90), ('sugar', 20), ('condensed_milk', 10)])

add('lat-dulce-leche', 'Dulce de leche (1 lepel)', 'Dulce de leche',
    'dulce de leche argentinë spread',
    'snack', 'ar', 20, '1 lepel',
    [('condensed_milk', 80), ('sugar', 20)])

print('all dishes defined:', len(ORDER))


def atwater(rec):
    return 4 * rec['p'] + 4 * rec['c'] + 9 * rec['f']


def validate():
    problems = []
    for i in ORDER:
        rec = ITEMS[i]
        at = atwater(rec)
        # alcohol / zero-calorie drinks can diverge
        if rec['src'] != SRC_ALC and rec['kcal'] > 8:
            if at > 0 and abs(rec['kcal'] - at) / max(rec['kcal'], at) > 0.25:
                problems.append('atwater %s: kcal=%s vs 4-4-9=%s' % (i, rec['kcal'], round(at, 1)))
        if rec['kcal'] < 0 or rec['p'] < 0 or rec['c'] < 0 or rec['f'] < 0:
            problems.append('negative %s' % i)
        if rec['g'] <= 0:
            problems.append('portion %s' % i)
        if not rec['nl'] or not rec['en'] or not rec['al']:
            problems.append('names %s' % i)
    if problems:
        raise SystemExit('Validation failed:\n  ' + '\n  '.join(problems[:30]))


def counts():
    cats = Counter(ITEMS[i]['cat'] for i in ORDER)
    rgs = Counter(ITEMS[i]['rg'] for i in ORDER)
    car = sum(1 for i in ORDER if ITEMS[i]['rg'] in CARIBBEAN_RG)
    soups = sum(1 for i in ORDER if ITEMS[i]['cat'] == 'soup')
    return {
        'total': len(ORDER),
        'caribbean': car,
        'latam_other': len(ORDER) - car,
        'soups': soups,
        'cats': dict(cats),
        'regions': dict(rgs),
    }


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def write_js():
    validate()
    st = counts()
    filters_js = []
    for key, label, codes in FILTERS:
        filters_js.append('    %s: %s' % (js_str(key), js_str(codes if codes != '*' and codes != 'CAR' else codes)))
    # Build REGION_FILTERS map
    fmap = {}
    for key, label, codes in FILTERS:
        fmap[key] = {'label': label, 'codes': codes}
    lines = []
    lines.append('/* Forged by Grace — Caribbean & Latin American dishes.')
    lines.append('   Macros are per 100 g. Values are recipe-based estimates from typical home')
    lines.append('   recipes plus USDA FoodData Central / NEVO-style ingredient values.')
    lines.append('   Portions vary by cook; treat numbers as estimates, not lab analysis.')
    lines.append('   Generated by tools/gen_caribbean_foods.py — %s items, %s Caribbean, %s soups. */' % (
        st['total'], st['caribbean'], st['soups']))
    lines.append('(function (FD) {')
    lines.append("  'use strict';")
    lines.append('  if (!FD || !FD.FOODS || !FD.BY_ID) return;')
    lines.append('  var K = ["id","en","nl","al","cat","kcal","p","c","f","fib","g","portion","src","rg"];')
    lines.append('  var REGIONS = {')
    lines.append(',\n'.join('    %s: %s' % (js_str(k), js_str(v)) for k, v in REGIONS.items()))
    lines.append('  };')
    lines.append('  var FILTERS = [')
    lines.append(',\n'.join('    [%s, %s, %s]' % (js_str(k), js_str(lab), js_str(codes)) for k, lab, codes in FILTERS))
    lines.append('  ];')
    lines.append('  var CARIBBEAN = %s;' % js_str(sorted(CARIBBEAN_RG)))
    lines.append('  var R = [')
    recs = []
    for i in ORDER:
        r = ITEMS[i]
        recs.append('    [%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s]' % (
            js_str(r['id']), js_str(r['en']), js_str(r['nl']), js_str(r['al']),
            js_str(r['cat']), r['kcal'], r['p'], r['c'], r['f'], r['fib'],
            r['g'], js_str(r['portion']), js_str(r['src']), js_str(r['rg'])))
    lines.append(',\n'.join(recs))
    lines.append('  ];')
    lines.append('  FD.REGIONS = REGIONS;')
    lines.append('  FD.REGION_FILTERS = FILTERS;')
    lines.append('  FD.CARIBBEAN_RG = CARIBBEAN;')
    lines.append('  if (!FD.CATS.soup) FD.CATS.soup = "Soups";')
    lines.append('  R.forEach(function (r) {')
    lines.append('    var o = { x: 1 };')
    lines.append('    K.forEach(function (k, i) { o[k] = r[i]; });')
    lines.append('    if (!o.nl) o.nl = o.en;')
    lines.append('    o.rgName = REGIONS[o.rg] || "";')
    lines.append('    if (FD.BY_ID[o.id]) return;')
    lines.append('    FD.FOODS.push(o);')
    lines.append('    FD.BY_ID[o.id] = o;')
    lines.append('  });')
    lines.append('})(typeof window !== "undefined" ? window.FBG_FOODS : (typeof FBG_FOODS !== "undefined" ? FBG_FOODS : null));')
    lines.append('')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text('\n'.join(lines), encoding='utf-8')
    return st


if __name__ == '__main__':
    st = write_js()
    print('Wrote', OUT)
    print('total', st['total'], 'caribbean', st['caribbean'], 'other', st['latam_other'], 'soups', st['soups'])
    print('cats', dict(sorted(st['cats'].items(), key=lambda x: -x[1])))
    print('regions', dict(sorted(st['regions'].items(), key=lambda x: -x[1])))
