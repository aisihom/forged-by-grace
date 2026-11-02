# Forged by Grace — Train the body. Guard the heart.

Personal training + nutrition + mental coaching app by **Aarón Ricardo**.
One app, two seats: **Coach mode** (clients, plans, check-ins, intake briefs) and **Athlete mode** (today, food, training, progress).
Aarón can be his own first client on the same phone with the ⇄ switch at the top.

100% free: no server, no account, no paid API. Plain HTML/CSS/JS, no build step.

## What's inside
- **Coach dashboard**: unlimited clients (tested with 10+), last check-in, adherence %, weight, "needs attention".
- **Training plans**: 8 templates (Get Lean 3/4/5 days, Build Muscle, Strength 5×5, Home dumbbells, Bodyweight, Beginner).
  Builder: weeks, progression (double / linear / RPE), auto deload every 5th week, edit sets/reps/rest/RPE, swap/add/reorder exercises from the library (60+ exercises with coaching cues).
- **Workout logger**: last-time values, weight suggestions from the progression rule, rest timer with vibration, PRs (estimated 1RM), history.
- **Meal plans**: calories + macros auto-calculated (Mifflin-St Jeor BMR × activity, goal deficit, protein g/kg); 3/4/5 meals; auto-fit portions to the targets; swap foods with equal protein/carbs/fat; 7-day grocery list (copy / WhatsApp).
- **Food database**: 100+ common Dutch/European foods per 100 g + your own custom foods + scanned products.
- **Food log**: search, "eaten as planned" in one tap, **barcode scanner**, **AI food photo**, day ring + macro bars, week chart.
- **Barcode**: live camera (native BarcodeDetector, fallback html5-qrcode bundled in `vendor/`), photo of a barcode, or type the number. Products from **Open Food Facts** (free, no key). Scanned products are cached on the device.
- **AI food photo**: free on-device AI (Food-101 Swin model via transformers.js). Gives the top-3 dishes + typical macros; you pick the grams. Always marked as an *estimate*. Photo is stored with the log entry, never uploaded.
- **Progress**: weight + waist charts, optional progress photos, streaks, daily habits (water, steps, sleep, protein, veg, optional quiet time / prayer).
- **Mental coaching intake** (`intake.html`, EN/ES/NL) → coaching brief: themes, watch-outs, focus areas, first-session questions, reply draft.
- Verse of the day (optional), English / Nederlands / Español (Spanish partial in the app, full in the intake).
- Backup / restore (JSON file), works offline once loaded (PWA).

## How sharing works without a server
1. Coach: **Client → Send plan to client** → link via WhatsApp / email / copy / file. The plan is compressed *inside* the link (`#imp=…`, ~2 KB).
2. Client opens the link on their phone → **Start my plan**. Everything they log stays on their phone.
3. Client: **Today → Weekly check-in → Send** → link back to the coach (WhatsApp / email to aricardo147@gmail.com).
4. Coach opens that link → it lands on the right client (weight, workouts, calorie days, habits, adherence, note).
Plan changes = send the update link again. It is not live sync: data only moves when someone taps Send.

## Put it online for free (needed for real links + live camera)
Camera scanning and sharing links need **https**. Any free static host works, e.g. GitHub Pages:
1. Create a free GitHub repo, upload all files in this folder.
2. Settings → Pages → Deploy from branch `main` / root.
3. Open `https://<username>.github.io/<repo>/` on your phone → Share → "Add to Home Screen".
Opened as a file (double-click `index.html`) everything works on that device, but links can't be opened by others and the live barcode camera is off (photo-of-barcode and typing still work).

## Limits (honest)
- AI photo = estimate. It recognises 101 dish types (pizza, sushi, steak, salads, pasta…), not Dutch home meals like stamppot or a plate of rice+chicken+broccoli; then you choose from the food list. Calories depend on portion/oil/sauce: expect ±25-40 %. First use downloads ~90 MB (once, cached) — Wi-Fi recommended; slower on older phones.
- Open Food Facts is crowd-sourced: some products are missing or incomplete → "Add it yourself".
- Data lives in the browser of each device. Clearing browser data deletes it → export backups.
- Links contain the client's data; send them only to the right person.
- Not medical advice. Crisis: 112 / 113 Zelfmoordpreventie (0800-0113).

## Files
`index.html` app · `intake.html` client questionnaire · `config.js` coach name/email/WhatsApp ·
`js/core.js` state, calculators, generators, sharing · `js/views-athlete.js` · `js/views-coach.js` · `js/scan.js` barcode + AI photo ·
`js/foods.js` food DB + Food-101 macros + verses · `js/data.js` exercises · `js/i18n.js` translations · `vendor/html5-qrcode.min.js` (Apache-2.0).
