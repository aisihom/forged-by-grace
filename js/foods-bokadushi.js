/* Forged by Grace — Curaçao "kos di boka dushi" (traditionele zoetigheden, ko'i dushi).
   Bronnen voor de lijst: curacao.com, curacao365.nl, nl.wikipedia (Tentalaria), dushipapiamentu.nl,
   antilliaans-eten.nl, antilliaansekeuken.nl, smartwheelscuracao.com (november 2026).
   Er bestaan geen officiële voedingswaarden: alle cijfers zijn schattingen per 100 g op basis van
   typische recepten (suiker, pinda, kokos, (gecondenseerde) melk, bloem) en USDA/NEVO-ingrediënten.
   kcal = 4P + 4K + 9V. 20 nieuwe items + betere zoekwoorden voor bestaande items. */
(function (FD) {
  'use strict';
  if (!FD || !FD.FOODS || !FD.BY_ID) return;
  var B = "boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou";
  var K = ["id","en","nl","al","cat","kcal","p","c","f","fib","g","portion","src","rg"];
  var R = [
    ["bd-leter-di-pinda","Lèter di pinda (peanut S-cookie, estimate)","Lèter di pinda (pindakoekje in S-vorm, schatting)","leter di pinda lèter di pinda letter di pinda leter pinda letters letter s koekje pindakoekje peanut letter cookie nootmuskaat boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",480,9,58,23.5,2.5,25,"1 lèter (±25 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-koi-lechi","Ko'i lechi (milk sweet, estimate)","Ko'i lechi / kos di lechi (melksnoep, schatting)","ko'i lechi koi lechi kos di lechi kosdilechi koilechi ko i lechi melksnoep melkfudge milk fudge milk candy poedermelk gecondenseerde melk boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",427,10,72,11,0,20,"1 stuk (±20 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-koi-lechi-kayente","Ko'i lechi kayente (cooked milk fudge, estimate)","Ko'i lechi kayente (gekookte melkfudge, schatting)","ko'i lechi kayente koi lechi kayente kos di lechi kayente ko'i lechi kondensa kondensá fudge gekookt condensed milk fudge boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",425,5.5,76,11,0,20,"1 stuk (±20 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-panseiku","Panseiku (peanut praline, estimate)","Panseiku (pindabrok / pindapraline, schatting)","panseiku pan seiku panseku pindabrok pindasnoep pinda praline peanut candy peanut brittle bruine suiker boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",492,11.6,62,22,4,20,"1 stuk (±20 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-tentalaria-kashupete","Tentalaria di kashupete (cashew marzipan, estimate)","Tentalaria di kashupete (cashewsnoep, schatting)","tentalaria di kashupete tentalaria kashupete tentalaria cashew tentalarya kasjoe cashewnoot cashewsnoep marsepein marzipan amandel boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",494,9,65,22,1.7,20,"1 stuk (±20 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-kakina","Kakiña (pulled toffee, estimate)","Kakiña (getrokken toffee, schatting)","kakiña kakina kakinja kakinya toffee karamel getrokken toffee pulled candy boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",390,0.5,88,4,0,10,"1 stuk (±10 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-djente-kacho","Djente kachó (coconut chunks in syrup, estimate)","Djente kachó (kokosbrokken in suikerstroop, schatting)","djente kacho djente kachó dente kacho hondentand kokos kokosbrokken coconut candy kos di koko boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",389,1.5,62,15,4.5,25,"1 stuk (±25 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-zjozjoli","Zjozjolí (sesame bar, estimate)","Zjozjolí (sesamreep, schatting)","zjozjoli zjozjolí jojoli yoyoli zjozjoli sesam sesamzaad sesamreep sesame bar sesame candy ajonjoli boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",490,8.5,60,24,5,25,"1 reepje (±25 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-sunchi","Sunchi (meringue kisses, estimate)","Sunchi (schuimpjes / meringue, schatting)","sunchi suntji soentsji schuimpjes schuim meringue meringues kisses eiwit sunchi di koló boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",392,4,94,0,0,10,"2 stuks (±10 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-chupabebe","Chupabèbè (sugar lollipop, estimate)","Chupabèbè (suikerlolly, schatting)","chupabebe chupabèbè chupa bebe tsjoepabebe lolly lollie lollipop suikerlolly suikerstroop boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",392,0,98,0,0,15,"1 lolly (±15 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-dushi-tamarein","Dushi di tamarein (tamarind balls, estimate)","Dushi di tamarein (tamarindeballetjes, schatting)","dushi di tamarein kos di tamarein tamarein sukra tamarein sukrá bolita di tamarein tamarijn tamarinde tamarindeballetjes tamarind balls dulce de tamarindo boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",360,1.2,88,0.3,2,15,"1 balletje (±15 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-tert-di-pruimu","Tèrt di pruimu (prune tartlet, estimate)","Tèrt di pruimu (pruimentaartje, schatting)","tert di pruimu tèrt di pruimu tert pruimu pruimentaartje pruimentaart prune tart tartlet feest boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",411,4.5,60,17,2.5,40,"1 taartje (±40 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-bolo-di-kashupete","Bolo di kashupete (cashew cake, estimate)","Bolo di kashupete (cashewnotentaart, schatting)","bolo di kashupete bolo kashupete bolo di cashewpete cashew taart cashewnotentaart cashew cake feesttaart boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",451,6.5,50,25,1,90,"1 punt (±90 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-bolo-di-pinda","Bolo di pinda (peanut cake, estimate)","Bolo di pinda (pindataart, schatting)","bolo di pinda bolo pinda pindataart pinda taart peanut cake botertaart feesttaart boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",434,7,52,22,1.5,90,"1 punt (±90 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-bolo-di-pistachi","Bolo di pistachi (pistachio cake, estimate)","Bolo di pistachi (pistachetaart, schatting)","bolo di pistachi bolo pistache bolo di pistache pistachetaart pistache taart pistachio cake feesttaart boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",439,6,52,23,1.2,90,"1 punt (±90 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-pan-bolo","Pan bolo / pudin di pan (bread pudding, estimate)","Pan bolo / pudin di pan (broodpudding, schatting)","pan bolo panbolo pudin di pan pudin pan budin broodpudding broodtaart bread pudding rozijnen kaneel boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",253,5.5,42,7,1.2,120,"1 portie (±120 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-bolo-di-maishi","Bolo di maishi (corn cake, estimate)","Bolo di maishi (maïscake, schatting)","bolo di maishi bolo maishi maiscake maïscake maismeel corn cake cornbread zoet boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",335,4.5,50,13,1.5,80,"1 punt (±80 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-bolo-di-banana","Bolo di banana (banana cake, estimate)","Bolo di banana (bananencake, schatting)","bolo di banana bolo di bakoba bananencake bananen cake banana cake banana bread boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",352,4.5,52,14,1.5,80,"1 punt (±80 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-pandushi-kokolishi","Pandushi kokolishi (sweet spiral bun, estimate)","Pandushi kokolishi (zoet slakkenhuisbroodje, schatting)","pandushi kokolishi pan dushi kokolishi pandushi di kokolishi kokolishi zoet broodje kaneelbroodje slakkenhuis sweet roll cinnamon roll boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",329,7,55,9,1.8,80,"1 broodje (±80 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"],
    ["bd-konfita-papaya","Konfitá di papaya (candied papaya, estimate)","Konfitá di papaya (gekonfijte papaja, schatting)","konfita di papaya konfitá di papaya konfitura di papaya dushi di papaya papaya dushi gekonfijte papaja papaja jam candied papaya preserve kerst boka dushi kos di boka dushi kos dushi ko'i dushi koi dushi kos'i dushi snoep zoetigheid zoet lekkers antilliaans curacao curaçao korsou","snack",282,0.3,70,0.1,1.5,30,"1 schaaltje (±30 g)","Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao","cw"]
  ];
  // Bestaande Caribische items: zoekbaar maken via "boka dushi" (geen duplicaten toevoegen).
  var ALIAS = {
    "lat-kokada": "kos di koko kokada di koko kokosnoepje",
    "lat-tenten": "pinda brok",
    "lat-kesio": "kesio quesio puding karamelpudding",
    "lat-bolo-pretu": "bolo preto black cake bolo di pasku bruidstaart",
    "lat-pan-dushi": "pandushi pan dushi zoet brood"
  };
  Object.keys(ALIAS).forEach(function (id) {
    var o = FD.BY_ID[id];
    if (o && String(o.al || '').indexOf('boka dushi') === -1) { o.al = (o.al || '') + ' ' + ALIAS[id] + ' ' + B; delete o._h; }
  });
  // Tentalaria stond als kokossnoep; het is pinda-/cashewmarsepein (gemalen pinda + suiker + amandel).
  var t = FD.BY_ID["lat-tentalaria"];
  if (t && !t.bd) {
    t.bd = 1;
    t.en = "Tentalaria di pinda (peanut marzipan, estimate)";
    t.nl = "Tentalaria di pinda (pindasnoep / pindamarsepein, schatting)";
    t.al = "tentalaria tentalarya tentalaria di pinda pindasnoep pindamarsepein marsepein peanut marzipan amandel " + B;
    t.kcal = 505; t.p = 12.9; t.c = 58; t.f = 24.6; t.fib = 4; t.g = 20; t.portion = "1 stuk (±20 g)";
    t.src = "Schatting (typisch recept, USDA/NEVO-basisingrediënten); kos di boka dushi, Curaçao";
    delete t._h;
  }
  R.forEach(function (r) {
    var o = { x: 1 };
    K.forEach(function (k, i) { o[k] = r[i]; });
    o.rgName = (FD.REGIONS && FD.REGIONS[o.rg]) || "Curaçao";
    if (FD.BY_ID[o.id]) return;
    FD.FOODS.push(o);
    FD.BY_ID[o.id] = o;
  });
})(typeof window !== "undefined" ? window.FBG_FOODS : (typeof FBG_FOODS !== "undefined" ? FBG_FOODS : null));
