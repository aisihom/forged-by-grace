# Add a client from an intake (assistant procedure, v3.7.0)

No backend: a client = a public plan file + a private link hash.

1. Private working folder (NOT in the repo): `/workspace/clients/<first>/` — keep intake/PDFs here.
2. Write `/workspace/clients/<first>/spec.json` (copy `/workspace/clients/frai/spec.json`):
   - `slug` (lowercase-dashes, becomes `clients/<slug>.json`), `name`.
   - `public`: profile without weight/height/age/health (goal, level, mode, activity, days, `targetsOverride` macros),
     `msg`, `planName`, `planNotes` (no medical info), `days` = 7 entries Mon→Sun `[title, [[exerciseId, sets, reps], …]]`
     (title "Rest Day" → rest, "Active Recovery" → walk day), `ideas` (eetschema groups + general tips).
   - `private`: `profile` (sex, age, height, weight), medical `planNotes`, `mealTips`, `tipsTitle`, `flags` (coach-only), `coachNotes` (coach-only).
   - Exercise ids: `grep -o "ex('[a-z0-9-]*'" js/data.js`. Missing exercise → add to `js/data.js` + `js/exinfo.js` (X entry + S() muscles) and demo photos via `/workspace/v34/proc.py` from `/workspace/free-exercise-db`.
   - Unknown data → sensible defaults and say "aan te passen" in coachNotes.
3. Serve the app (`python3 -m http.server 8799` in trainer-app) and run
   `python3 /workspace/tests/mkclient_v37.py /workspace/clients/<first>/spec.json > /workspace/clients/<first>/links.txt`
   → writes `clients/<slug>.json` and prints CLIENT and COACH links (`?client=<slug>#p=<compressed private part>`).
4. Test (`/workspace/tests/client_v37.py` as template), bump version, deploy, open the live link once.
5. Send: CLIENT link → client (email/WhatsApp, only to him). COACH link → Aarón opens on his phone → client appears in Coach list with flags + notes.

Password: first open of the CLIENT link asks the client to set a password (≥6, PBKDF2-SHA256 salted hash stored on his phone only).
"Wachtwoord vergeten" = coach resends the same (or a regenerated) CLIENT link; opening it resets the password, logs stay.
This is a device-local lock, not a server account. Plan updates later: change spec → regenerate → client re-opens link (or coach uses "Update met klant delen").
