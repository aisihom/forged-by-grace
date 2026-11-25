# FBG quality rules

## The one rule
**Never deploy without `scripts/release.sh`.** No manual copying to `/tmp/fbg`, no hand-edited version numbers, no `git push` from the deploy repo.

```
cd /workspace/trainer-app
scripts/release.sh "what changed"            # 3.31.0 -> 3.31.1
scripts/release.sh --dry-run "what changed"  # test everything, push nothing
```
The script pulls/rebases, refuses if someone else's live change would be overwritten, bumps the version everywhere
(`version.json`, `sw.js`, `js/core.js`, `package.json`, every `?v=` in every `.html`), runs `npm test`,
**refuses to deploy if anything fails** (and undoes the bump), pushes, and waits until the live site serves the new version.
GitHub Actions (`.github/workflows/test.yml`) runs the same `npm test` on every push as a second net.

## What `npm test` checks (≈15 s)
- **Syntax**: every `.js` file and inline `<script>` parses; `config.js` defines `FBG_CONFIG`; no `debugger` / merge markers.
- **Release consistency**: one version everywhere, every script/css has `?v=`, every loaded file exists and is in the offline cache (`sw.js` ASSETS), manifest icons exist, no test hard-codes a version.
- **Data**: unique exercise + food ids, every exercise has fields, demo media and 2+ alternatives; plan slots/days/weeks point at real exercises; macros are real numbers, kcal fits 4/4/9.
- **Unit tests** (`test/*.js`): steps math, health sync parsing, photos, food DBs, exercise library.
- **Headless smoke** (`test/smoke.js`, real Chrome, network cut off): every client screen (Today, Food, Train, Progress, More, Health, Pet, Plan, Meal, Sync) and every coach screen, NL + EN; fails on any console error, page error, empty screen or visible `NaN`/`undefined`. Also runs the real code for: step total (sync + manual + sport + cardio, max-merge, no double counting), server health row idempotent, coach plan/macros/step goal reaching the client (and later updates), Sweatpoints gift once, error guard and render guard.

## Checklist for every change
1. Change the code in `/workspace/trainer-app` (never in `/tmp/fbg`).
2. New file loaded by `index.html`? Add `?v=…` and add it to `ASSETS` in `sw.js` (the test tells you).
3. New screen, coach→client field or calculation? Add a step to `test/smoke.js` or a small `test/*.js`. Fixed a bug? Add a test that would have caught it.
4. Never hard-code the app version or exact item counts in tests; read `version.json` / use `>=`.
5. `npm test` green → `scripts/release.sh "…"`.
6. After release: check real-device errors in Supabase: `select created_at, version, route, msg from app_errors order by created_at desc limit 50;`

## Safety nets inside the app
- `js/guard.js` (loaded first): uncaught errors and promise rejections show one calm toast and are logged (scrubbed, max 5 per session, no tokens/emails) to `app_errors` (insert-only RLS).
- `App.route` render guard: a screen that throws shows "Dit scherm kon even niet laden" + retry, instead of a blank page.
- Button handlers (`data-act`) are wrapped: one broken button can't freeze the app.

## Sync safety (v3.32, quality week 16 Nov 2026)
- `js/syncmerge.js`: before the first push of a session the phone reads its own `client_data` rows and merges them in
  (server-only items are added, nothing local is removed). No push happens until that read succeeded; an empty kind is
  never sent over server data. Test: `test/sync-merge.js` + smoke step "sync: a fresh phone…".
- Server net `supabase/keep_nonempty.sql`: an UPDATE can never replace non-empty data with an empty copy (old app versions too).
- `supabase/intake_drop.sql`: intake filled in via a Safari link (`intake.html?c=…&k=<coach token>`) is saved into the
  dossier of the client with the same e-mail. No match = nothing saved + a clear warning on the thanks screen.
- Backup taken before the audit: `private.client_data_bak_20261116` (not reachable from the app).
- Rest timer (`js/rest.js`): the end chime is baked into a short WAV that starts when you tick a set, so it still sounds if iOS freezes the page behind a locked screen. A screen wake lock (when the OS allows it) keeps the countdown visible. An app update will not auto-reload during a workout or rest. Test: `test/rest-timer.js`.
