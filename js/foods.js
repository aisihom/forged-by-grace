/* Forged by Grace — built-in food database (per 100 g, typical NL/EU values from public nutrition tables;
   values are averages, check the label for exact numbers), Food-101 photo mapping, verses. */
(function (root) {
  'use strict';
  // id, English, Dutch, category, kcal, protein, carbs, fat, default portion g, portion label
  var RAW = [
    // Protein
    ['chicken-breast', 'Chicken breast (cooked)', 'Kipfilet (bereid)', 'protein', 165, 31, 0, 3.6, 150, '1 fillet'],
    ['chicken-thigh', 'Chicken thigh (cooked)', 'Kippendij (bereid)', 'protein', 209, 26, 0, 10.9, 120, '1 piece'],
    ['turkey-breast', 'Turkey breast (cooked)', 'Kalkoenfilet (bereid)', 'protein', 135, 30, 0, 1, 150, '1 portion'],
    ['beef-lean-mince', 'Lean beef mince 5% (cooked)', 'Rundergehakt mager (bereid)', 'protein', 176, 26, 0, 8, 125, '1 portion'],
    ['beef-steak', 'Beef steak (cooked)', 'Biefstuk (bereid)', 'protein', 187, 29, 0, 7.5, 150, '1 steak'],
    ['pork-tenderloin', 'Pork tenderloin (cooked)', 'Varkenshaas (bereid)', 'protein', 143, 26, 0, 3.5, 150, '1 portion'],
    ['salmon', 'Salmon (cooked)', 'Zalm (bereid)', 'protein', 206, 22, 0, 13, 125, '1 fillet'],
    ['cod', 'Cod (cooked)', 'Kabeljauw (bereid)', 'protein', 105, 23, 0, 0.9, 150, '1 fillet'],
    ['tuna-can', 'Tuna in water (canned)', 'Tonijn in water (blik)', 'protein', 116, 26, 0, 1, 112, '1 can drained'],
    ['shrimp', 'Shrimp (cooked)', 'Garnalen (bereid)', 'protein', 99, 24, 0.2, 0.3, 100, '1 portion'],
    ['herring', 'Dutch herring (raw)', 'Hollandse nieuwe haring', 'protein', 201, 15, 0, 15.5, 80, '1 herring'],
    ['egg', 'Egg', 'Ei', 'protein', 143, 12.6, 0.7, 9.5, 55, '1 egg'],
    ['egg-white', 'Egg white', 'Eiwit', 'protein', 52, 11, 0.7, 0.2, 33, '1 egg white'],
    ['tofu', 'Tofu', 'Tofu', 'protein', 144, 15.7, 2.8, 8.7, 100, '1 portion'],
    ['tempeh', 'Tempeh', 'Tempeh', 'protein', 192, 20, 7.6, 10.8, 100, '1 portion'],
    ['whey', 'Whey protein powder', 'Whey eiwitpoeder', 'protein', 390, 78, 7, 6, 30, '1 scoop'],
    ['chicken-fillet-slices', 'Chicken fillet slices (cold cut)', 'Kipfilet beleg', 'protein', 104, 21, 1.5, 1.5, 20, '1 slice'],
    ['smoked-beef', 'Smoked beef (rookvlees)', 'Rookvlees', 'protein', 118, 24, 0.5, 2.3, 15, '1 slice'],
    ['ham', 'Ham (lean)', 'Ham (mager)', 'protein', 113, 19, 1, 3.5, 20, '1 slice'],
    ['falafel', 'Falafel', 'Falafel', 'protein', 333, 13, 32, 18, 20, '1 ball'],
    // Dairy
    ['quark-low', 'Low-fat quark (magere kwark)', 'Magere kwark', 'dairy', 57, 10, 3.6, 0.2, 250, '1 bowl'],
    ['skyr', 'Skyr (plain)', 'Skyr naturel', 'dairy', 63, 11, 4, 0.2, 150, '1 pot'],
    ['greek-yogurt', 'Greek yogurt 10%', 'Griekse yoghurt 10%', 'dairy', 122, 4.5, 4, 10, 150, '1 bowl'],
    ['yogurt-low', 'Low-fat yogurt', 'Magere yoghurt', 'dairy', 36, 4.3, 4.3, 0.1, 200, '1 bowl'],
    ['milk-semi', 'Semi-skimmed milk', 'Halfvolle melk', 'dairy', 46, 3.4, 4.8, 1.5, 250, '1 glass'],
    ['milk-skim', 'Skimmed milk', 'Magere melk', 'dairy', 35, 3.5, 4.8, 0.1, 250, '1 glass'],
    ['cheese-gouda', 'Gouda cheese 48+', 'Goudse kaas 48+', 'dairy', 356, 25, 0, 28, 20, '1 slice'],
    ['cheese-30', 'Cheese 30+ (light)', 'Kaas 30+', 'dairy', 270, 30, 0, 16, 20, '1 slice'],
    ['cottage', 'Cottage cheese', 'Hüttenkäse', 'dairy', 98, 11, 3.4, 4.3, 100, '1/2 tub'],
    ['mozzarella-light', 'Mozzarella light', 'Mozzarella light', 'dairy', 165, 20, 1, 9, 60, '1/2 ball'],
    ['feta', 'Feta', 'Feta', 'dairy', 264, 14, 4, 21, 30, '1 portion'],
    ['protein-pudding', 'High-protein pudding', 'Proteïne pudding', 'dairy', 75, 10, 6, 1.5, 200, '1 pot'],
    // Carbs
    ['oats', 'Oats (rolled)', 'Havermout', 'carb', 372, 13.5, 58.7, 7, 50, '1 portion'],
    ['rice-white', 'White rice (cooked)', 'Witte rijst (gekookt)', 'carb', 130, 2.7, 28, 0.3, 180, '1 portion'],
    ['rice-brown', 'Brown rice (cooked)', 'Zilvervliesrijst (gekookt)', 'carb', 123, 2.7, 25.6, 1, 180, '1 portion'],
    ['pasta', 'Pasta (cooked)', 'Pasta (gekookt)', 'carb', 158, 5.8, 31, 0.9, 200, '1 portion'],
    ['pasta-wholewheat', 'Wholewheat pasta (cooked)', 'Volkoren pasta (gekookt)', 'carb', 149, 6, 27, 1.5, 200, '1 portion'],
    ['potato', 'Potatoes (boiled)', 'Aardappelen (gekookt)', 'carb', 86, 1.7, 18, 0.1, 250, '1 portion'],
    ['sweet-potato', 'Sweet potato (baked)', 'Zoete aardappel (gebakken)', 'carb', 90, 2, 20.7, 0.2, 200, '1 portion'],
    ['bread-wholegrain', 'Wholegrain bread', 'Volkorenbrood', 'carb', 240, 10, 40, 3.5, 35, '1 slice'],
    ['bread-white', 'White bread', 'Wit brood', 'carb', 265, 9, 49, 3.2, 30, '1 slice'],
    ['crispbread', 'Crispbread (knäckebröd)', 'Knäckebröd', 'carb', 350, 10, 64, 2, 12, '1 piece'],
    ['rice-cake', 'Rice cake', 'Rijstwafel', 'carb', 387, 8, 81, 2.8, 8, '1 cake'],
    ['wrap', 'Wholewheat wrap', 'Volkoren wrap', 'carb', 300, 9, 49, 7, 62, '1 wrap'],
    ['couscous', 'Couscous (cooked)', 'Couscous (bereid)', 'carb', 112, 3.8, 23, 0.2, 180, '1 portion'],
    ['quinoa', 'Quinoa (cooked)', 'Quinoa (gekookt)', 'carb', 120, 4.4, 21, 1.9, 180, '1 portion'],
    ['muesli', 'Muesli (no added sugar)', 'Muesli (zonder suiker)', 'carb', 360, 10, 60, 6, 45, '1 portion'],
    ['kidney-beans', 'Kidney beans (canned)', 'Kidneybonen (blik)', 'carb', 100, 7, 13, 0.5, 100, '1/2 can'],
    ['chickpeas', 'Chickpeas (canned)', 'Kikkererwten (blik)', 'carb', 119, 7, 15, 2.4, 100, '1/2 can'],
    ['lentils', 'Lentils (cooked)', 'Linzen (gekookt)', 'carb', 116, 9, 20, 0.4, 150, '1 portion'],
    ['ontbijtkoek', 'Gingerbread (ontbijtkoek)', 'Ontbijtkoek', 'snack', 325, 4.5, 72, 1.5, 25, '1 slice'],
    // Fruit
    ['banana', 'Banana', 'Banaan', 'fruit', 89, 1.1, 22.8, 0.3, 120, '1 banana'],
    ['apple', 'Apple', 'Appel', 'fruit', 52, 0.3, 13.8, 0.2, 150, '1 apple'],
    ['berries', 'Mixed berries', 'Gemengde bessen', 'fruit', 50, 1, 10, 0.4, 100, '1 handful'],
    ['strawberries', 'Strawberries', 'Aardbeien', 'fruit', 32, 0.7, 7.7, 0.3, 150, '1 bowl'],
    ['orange', 'Orange', 'Sinaasappel', 'fruit', 47, 0.9, 11.8, 0.1, 160, '1 orange'],
    ['kiwi', 'Kiwi', 'Kiwi', 'fruit', 61, 1.1, 14.7, 0.5, 75, '1 kiwi'],
    ['pear', 'Pear', 'Peer', 'fruit', 57, 0.4, 15, 0.1, 170, '1 pear'],
    ['grapes', 'Grapes', 'Druiven', 'fruit', 69, 0.7, 18, 0.2, 100, '1 handful'],
    ['mango', 'Mango', 'Mango', 'fruit', 60, 0.8, 15, 0.4, 150, '1/2 mango'],
    // Veg
    ['broccoli', 'Broccoli', 'Broccoli', 'veg', 34, 2.8, 7, 0.4, 200, '1 portion'],
    ['green-beans', 'Green beans', 'Sperziebonen', 'veg', 31, 1.8, 7, 0.2, 200, '1 portion'],
    ['spinach', 'Spinach', 'Spinazie', 'veg', 23, 2.9, 3.6, 0.4, 200, '1 portion'],
    ['mixed-salad', 'Mixed salad', 'Gemengde salade', 'veg', 17, 1.3, 3, 0.2, 100, '1 bowl'],
    ['tomato', 'Tomato', 'Tomaat', 'veg', 18, 0.9, 3.9, 0.2, 100, '1 tomato'],
    ['cucumber', 'Cucumber', 'Komkommer', 'veg', 15, 0.7, 3.6, 0.1, 100, '1/3 cucumber'],
    ['bell-pepper', 'Bell pepper', 'Paprika', 'veg', 31, 1, 6, 0.3, 150, '1 pepper'],
    ['carrot', 'Carrots', 'Wortel', 'veg', 41, 0.9, 9.6, 0.2, 100, '1 portion'],
    ['stir-fry-veg', 'Stir-fry vegetables', 'Wokgroente', 'veg', 30, 1.8, 4.5, 0.3, 200, '1 portion'],
    ['mushrooms', 'Mushrooms', 'Champignons', 'veg', 22, 3.1, 3.3, 0.3, 100, '1 portion'],
    ['zucchini', 'Zucchini', 'Courgette', 'veg', 17, 1.2, 3.1, 0.3, 150, '1/2 zucchini'],
    ['cauliflower', 'Cauliflower', 'Bloemkool', 'veg', 25, 1.9, 5, 0.3, 200, '1 portion'],
    ['onion', 'Onion', 'Ui', 'veg', 40, 1.1, 9.3, 0.1, 80, '1 onion'],
    // Fats
    ['olive-oil', 'Olive oil', 'Olijfolie', 'fat', 884, 0, 0, 100, 10, '1 tbsp'],
    ['butter', 'Butter', 'Roomboter', 'fat', 717, 0.9, 0.1, 81, 10, '1 tsp spread'],
    ['peanut-butter', 'Peanut butter (100%)', 'Pindakaas (100%)', 'fat', 600, 25, 12, 50, 15, '1 tbsp'],
    ['almonds', 'Almonds', 'Amandelen', 'fat', 579, 21, 22, 50, 25, '1 handful'],
    ['walnuts', 'Walnuts', 'Walnoten', 'fat', 654, 15, 14, 65, 25, '1 handful'],
    ['avocado', 'Avocado', 'Avocado', 'fat', 160, 2, 8.5, 14.7, 70, '1/2 avocado'],
    ['hummus', 'Hummus', 'Hummus', 'fat', 237, 7.9, 14, 17, 30, '2 tbsp'],
    ['chia', 'Chia seeds', 'Chiazaad', 'fat', 486, 17, 42, 31, 15, '1 tbsp'],
    ['dark-chocolate', 'Dark chocolate 70%', 'Pure chocolade 70%', 'snack', 598, 7.8, 46, 43, 20, '2 squares'],
    // Snacks / drinks / meals
    ['protein-bar', 'Protein bar', 'Eiwitreep', 'snack', 360, 33, 35, 12, 55, '1 bar'],
    ['stroopwafel', 'Stroopwafel', 'Stroopwafel', 'snack', 450, 3.5, 66, 19, 30, '1 waffle'],
    ['chips', 'Crisps', 'Chips', 'snack', 536, 6, 53, 34, 30, '1 small bag'],
    ['kroket', 'Kroket', 'Kroket', 'snack', 230, 6, 20, 14, 70, '1 kroket'],
    ['frikandel', 'Frikandel', 'Frikandel', 'snack', 245, 12, 7, 19, 70, '1 frikandel'],
    ['fries', 'Fries (patat)', 'Patat', 'snack', 312, 3.4, 41, 15, 150, '1 medium'],
    ['hagelslag', 'Chocolate sprinkles (hagelslag)', 'Hagelslag', 'snack', 480, 5, 70, 19, 15, '1 slice worth'],
    ['jam', 'Jam', 'Jam', 'snack', 250, 0.4, 60, 0.1, 15, '1 tbsp'],
    ['honey', 'Honey', 'Honing', 'snack', 304, 0.3, 82, 0, 10, '1 tsp'],
    ['orange-juice', 'Orange juice', 'Sinaasappelsap', 'drink', 45, 0.7, 10.4, 0.2, 200, '1 glass'],
    ['cola', 'Cola (regular)', 'Cola (normaal)', 'drink', 42, 0, 10.6, 0, 330, '1 can'],
    ['cola-zero', 'Cola zero', 'Cola zero', 'drink', 0.3, 0, 0, 0, 330, '1 can'],
    ['coffee-milk', 'Coffee with milk', 'Koffie verkeerd', 'drink', 25, 1.6, 2.4, 0.9, 200, '1 cup'],
    ['beer', 'Beer (pils)', 'Bier (pils)', 'drink', 43, 0.5, 3.6, 0, 250, '1 glass'],
    ['erwtensoep', 'Pea soup (erwtensoep)', 'Erwtensoep', 'meal', 95, 6, 9, 3.5, 300, '1 bowl'],
    ['stamppot', 'Stamppot (boerenkool)', 'Stamppot boerenkool', 'meal', 110, 3.5, 12, 5, 350, '1 plate'],
    ['pizza', 'Pizza margherita', 'Pizza margherita', 'meal', 250, 11, 30, 9.5, 300, '1/2 pizza'],
    ['lasagna', 'Lasagna', 'Lasagne', 'meal', 135, 8, 11, 6.5, 350, '1 portion'],
    ['nasi', 'Nasi goreng', 'Nasi goreng', 'meal', 165, 6, 23, 5.5, 350, '1 plate'],
    ['shoarma', 'Shoarma (meat)', 'Shoarma (vlees)', 'meal', 215, 21, 2, 14, 150, '1 portion'],
    ['poke-bowl', 'Poke bowl (salmon)', 'Pokébowl (zalm)', 'meal', 150, 8, 18, 5, 400, '1 bowl']
  ];
  var FOODS = RAW.map(function (r) {
    return { id: r[0], en: r[1], nl: r[2], cat: r[3], kcal: r[4], p: r[5], c: r[6], f: r[7], g: r[8], portion: r[9] };
  });
  var FOOD_BY_ID = {};
  FOODS.forEach(function (f) { FOOD_BY_ID[f.id] = f; });
  var CATS = { protein: 'Protein', dairy: 'Dairy', carb: 'Carbs & grains', fruit: 'Fruit', veg: 'Vegetables', fat: 'Fats & nuts', snack: 'Snacks', drink: 'Drinks', meal: 'Meals', custom: 'My foods', scan: 'Scanned' };

  // Food-101 classes → rough macros per 100 g + typical portion (g). Used for photo estimates only.
  // [label, kcal, p, c, f, portion g]
  var F101 = {
    apple_pie: [237, 2, 34, 11, 125], baby_back_ribs: [290, 24, 5, 19, 250], baklava: [430, 6, 45, 25, 60], beef_carpaccio: [150, 21, 1, 7, 100],
    beef_tartare: [190, 20, 2, 11, 150], beet_salad: [90, 3, 9, 5, 200], beignets: [390, 6, 45, 21, 100], bibimbap: [140, 6, 20, 4, 450],
    bread_pudding: [250, 6, 35, 9, 150], breakfast_burrito: [210, 10, 20, 10, 250], bruschetta: [190, 5, 25, 8, 100], caesar_salad: [150, 7, 7, 11, 250],
    cannoli: [370, 7, 40, 20, 80], caprese_salad: [180, 10, 4, 14, 200], carrot_cake: [410, 4, 50, 22, 110], ceviche: [100, 15, 6, 2, 200],
    cheesecake: [320, 6, 26, 22, 120], cheese_plate: [380, 24, 3, 30, 100], chicken_curry: [150, 13, 6, 8, 300], chicken_quesadilla: [270, 15, 22, 14, 200],
    chicken_wings: [255, 24, 4, 16, 200], chocolate_cake: [370, 5, 50, 17, 110], chocolate_mousse: [250, 5, 22, 16, 120], churros: [450, 5, 50, 26, 100],
    clam_chowder: [90, 5, 9, 4, 300], club_sandwich: [230, 14, 18, 11, 250], crab_cakes: [210, 14, 12, 12, 150], creme_brulee: [300, 4, 25, 20, 120],
    croque_madame: [260, 15, 17, 15, 250], cup_cakes: [380, 4, 55, 17, 70], deviled_eggs: [200, 11, 1, 17, 100], donuts: [420, 5, 50, 22, 70],
    dumplings: [210, 8, 26, 8, 200], edamame: [120, 11, 9, 5, 150], eggs_benedict: [230, 12, 12, 15, 250], escargots: [180, 14, 3, 13, 100],
    falafel: [333, 13, 32, 18, 150], filet_mignon: [220, 28, 0, 12, 200], fish_and_chips: [230, 12, 22, 11, 350], foie_gras: [460, 11, 5, 44, 60],
    french_fries: [312, 3.4, 41, 15, 150], french_onion_soup: [80, 4, 8, 3.5, 350], french_toast: [230, 8, 26, 10, 180], fried_calamari: [230, 15, 12, 13, 150],
    fried_rice: [170, 5, 25, 6, 300], frozen_yogurt: [160, 4, 28, 3.5, 150], garlic_bread: [350, 8, 42, 16, 80], gnocchi: [160, 4, 30, 3, 250],
    greek_salad: [110, 4, 5, 9, 250], grilled_cheese_sandwich: [350, 13, 30, 20, 150], grilled_salmon: [206, 22, 0, 13, 150], guacamole: [160, 2, 9, 14, 80],
    gyoza: [210, 9, 24, 9, 150], hamburger: [250, 13, 22, 12, 220], hot_and_sour_soup: [40, 3, 4, 1.5, 350], hot_dog: [270, 10, 22, 16, 150],
    huevos_rancheros: [160, 8, 12, 9, 300], hummus: [237, 7.9, 14, 17, 80], ice_cream: [210, 3.5, 24, 11, 120], lasagna: [135, 8, 11, 6.5, 350],
    lobster_bisque: [110, 5, 7, 7, 300], lobster_roll_sandwich: [240, 13, 22, 11, 200], macaroni_and_cheese: [190, 8, 20, 9, 300], macarons: [400, 7, 60, 15, 50],
    miso_soup: [35, 2.5, 3.5, 1.2, 300], mussels: [170, 24, 7, 4.5, 250], nachos: [330, 9, 33, 18, 200], omelette: [155, 11, 1, 12, 150],
    onion_rings: [330, 4.5, 36, 19, 120], oysters: [80, 9, 5, 2.5, 120], pad_thai: [175, 8, 24, 6, 350], paella: [160, 9, 20, 5, 350],
    pancakes: [230, 6, 32, 9, 180], panna_cotta: [230, 3, 22, 14, 120], peking_duck: [300, 19, 6, 22, 200], pho: [60, 4.5, 7, 1.5, 500],
    pizza: [266, 11, 33, 10, 250], pork_chop: [230, 27, 0, 13, 180], poutine: [230, 6, 25, 12, 350], prime_rib: [330, 23, 0, 26, 250],
    pulled_pork_sandwich: [240, 14, 22, 10, 250], ramen: [90, 5, 11, 3, 550], ravioli: [180, 8, 25, 6, 250], red_velvet_cake: [370, 4, 52, 17, 110],
    risotto: [150, 4, 20, 6, 300], samosa: [300, 6, 32, 17, 100], sashimi: [130, 21, 0, 5, 150], scallops: [110, 20, 5, 1, 150],
    seaweed_salad: [70, 1.5, 10, 3, 100], shrimp_and_grits: [150, 9, 13, 7, 300], spaghetti_bolognese: [150, 8, 18, 5, 350], spaghetti_carbonara: [200, 9, 22, 9, 350],
    spring_rolls: [230, 5, 26, 12, 120], steak: [250, 26, 0, 16, 200], strawberry_shortcake: [270, 4, 38, 12, 130], sushi: [145, 6, 28, 1, 200],
    tacos: [220, 10, 20, 11, 200], takoyaki: [190, 7, 22, 8, 150], tiramisu: [290, 6, 30, 16, 120], tuna_tartare: [140, 22, 2, 5, 150],
    waffles: [290, 7, 35, 14, 120]
  };

  var VERSES = [
    ['1 Corinthians 6:19-20', 'Your body is a temple of the Holy Spirit… therefore honour God with your body.'],
    ['Proverbs 4:23', 'Above all else, guard your heart, for everything you do flows from it.'],
    ['Romans 12:2', 'Be transformed by the renewing of your mind.'],
    ['Philippians 4:13', 'I can do all this through Him who gives me strength.'],
    ['Isaiah 40:31', 'Those who hope in the Lord will renew their strength.'],
    ['Proverbs 27:17', 'As iron sharpens iron, so one person sharpens another.'],
    ['1 Corinthians 9:27', 'I discipline my body and keep it under control.'],
    ['Galatians 6:9', 'Let us not become weary in doing good, for at the proper time we will reap a harvest.'],
    ['2 Timothy 1:7', 'God gave us a spirit not of fear but of power, love and self-discipline.'],
    ['Hebrews 12:11', 'No discipline seems pleasant at the time… later it produces a harvest of righteousness and peace.'],
    ['Joshua 1:9', 'Be strong and courageous. Do not be afraid; the Lord your God will be with you.'],
    ['Romans 6:14', 'You are not under the law, but under grace.'],
    ['Lamentations 3:22-23', 'His mercies are new every morning; great is your faithfulness.'],
    ['Colossians 3:23', 'Whatever you do, work at it with all your heart, as working for the Lord.']
  ];

  root.FBG_FOODS = { FOODS: FOODS, BY_ID: FOOD_BY_ID, CATS: CATS, F101: F101, VERSES: VERSES };
})(typeof window !== 'undefined' ? window : this);
