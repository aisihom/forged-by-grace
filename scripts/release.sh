#!/usr/bin/env bash
# Forged by Grace — the ONLY way to deploy.
#   scripts/release.sh "what changed"            -> bumps patch (3.30.15 -> 3.30.16)
#   scripts/release.sh "what changed" minor      -> 3.31.0
#   scripts/release.sh "what changed" 3.40.0     -> exact version
#   scripts/release.sh --dry-run "what changed"  -> everything except commit/push
# Steps: pull/rebase the deploy repo, refuse if someone else's live changes would be overwritten,
# bump the version EVERYWHERE, run the full test suite (refuse to deploy on any failure),
# copy to the deploy repo, commit, push, and wait until the live site serves the new version.
set -euo pipefail

DRY=0; if [ "${1:-}" = "--dry-run" ]; then DRY=1; shift; fi
MSG="${1:-}"; BUMP="${2:-patch}"
[ -n "$MSG" ] || { echo "usage: scripts/release.sh [--dry-run] \"what changed\" [patch|minor|major|x.y.z]"; exit 2; }

WORK="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY="${FBG_DEPLOY_DIR:-/tmp/fbg}"
REPO_URL="https://github.com/aisihom/forged-by-grace.git"
LIVE="https://aisihom.github.io/forged-by-grace"
red() { printf '\033[31m%s\033[0m\n' "$*"; }; green() { printf '\033[32m%s\033[0m\n' "$*"; }
die() { red "✗ $*"; red "✗ NOT deployed."; exit 1; }

# 0. deploy repo present and clean
if [ ! -d "$DEPLOY/.git" ]; then git clone -q "$REPO_URL" "$DEPLOY"; fi
cd "$DEPLOY"
git config user.name aisihom; git config user.email aisihom@users.noreply.github.com
[ -z "$(git status --porcelain)" ] || die "$DEPLOY has uncommitted changes. Look at them first (git -C $DEPLOY status)."

# 1. pull/rebase and make sure nothing live gets reverted
BASE="$(cat "$WORK/.release-base" 2>/dev/null || git rev-parse HEAD)"
git pull -q --rebase origin main || die "git pull --rebase failed"
CONFLICTS=""
norm() { sed -E 's/[0-9]+\.[0-9]+\.[0-9]+/X/g' "$1" 2>/dev/null; }  # ignore version numbers when comparing
for f in $(git diff --name-only "$BASE" HEAD 2>/dev/null || true); do
  [ -e "$DEPLOY/$f" ] || continue
  [ "$f" = version.json ] && continue
  if [ ! -e "$WORK/$f" ] || [ "$(norm "$DEPLOY/$f" | md5sum)" != "$(norm "$WORK/$f" | md5sum)" ]; then CONFLICTS="$CONFLICTS $f"; fi
done
[ -z "$CONFLICTS" ] || die "These files changed on GitHub since the last release and differ from $WORK:$CONFLICTS
  Copy those changes into $WORK first (or they would be overwritten)."

# 2. new version = bump(max(live, work))
LIVEV="$(node -e 'console.log(require(process.argv[1]).v)' "$DEPLOY/version.json")"
WORKV="$(node -e 'console.log(require(process.argv[1]).v)' "$WORK/version.json")"
NEWV="$(node -e '
  var a=process.argv[1].split(".").map(Number), b=process.argv[2].split(".").map(Number), m=process.argv[3];
  var cur=(a[0]-b[0]||a[1]-b[1]||a[2]-b[2])>=0?a:b;
  if(/^\d+\.\d+\.\d+$/.test(m)){var n=m.split(".").map(Number); if((n[0]-cur[0]||n[1]-cur[1]||n[2]-cur[2])<=0){console.error("version must be higher than "+cur.join("."));process.exit(1)} console.log(m)}
  else if(m==="major")console.log((cur[0]+1)+".0.0"); else if(m==="minor")console.log(cur[0]+"."+(cur[1]+1)+".0"); else console.log(cur[0]+"."+cur[1]+"."+(cur[2]+1));
' "$LIVEV" "$WORKV" "$BUMP")" || die "bad version argument"
echo "→ live $LIVEV, work $WORKV, releasing $NEWV"

# 3. bump everywhere (backup first so a failed test run leaves no half-bumped files)
cd "$WORK"
BK="$(mktemp -d)"; FILES="version.json sw.js js/core.js package.json $(ls *.html)"
for f in $FILES; do mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; done
restore() { for f in $FILES; do cp "$BK/$f" "$WORK/$f"; done; }
PUSHED=0; trap '[ "$PUSHED" = 1 ] || restore' EXIT   # any abort before the push undoes the version bump
node - "$NEWV" <<'NODE'
const fs = require('fs'), v = process.argv[2];
const ed = (f, fn) => { const s = fs.readFileSync(f, 'utf8'), o = fn(s); if (o === s && f !== 'package.json') throw new Error('no version found in ' + f); fs.writeFileSync(f, o); };
fs.writeFileSync('version.json', JSON.stringify({ v }));
ed('sw.js', s => s.replace(/var VERSION = 'fbg-v[^']+'/, `var VERSION = 'fbg-v${v}'`));
ed('js/core.js', s => s.replace(/App\.VERSION = '[^']+'/, `App.VERSION = '${v}'`));
ed('package.json', s => s.replace(/"version": "[^"]+"/, `"version": "${v}"`));
for (const f of fs.readdirSync('.').filter(n => n.endsWith('.html'))) { const s = fs.readFileSync(f, 'utf8'); fs.writeFileSync(f, s.replace(/\?v=[0-9.]+/g, '?v=' + v)); }
NODE

# 4. full test suite — any failure = no deploy
[ -d node_modules/playwright-core ] || npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null
if ! npm test; then die "Tests failed (version bump undone)."; fi

# 5. copy to deploy repo, re-check there, commit, push
cd "$DEPLOY"
find "$DEPLOY" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
tar -C "$WORK" --exclude=./node_modules --exclude=./screenshots --exclude=./.release-base -cf - . | tar -C "$DEPLOY" -xf -
node test/check-syntax.js >/dev/null && node test/check-release.js >/dev/null || { git checkout -q -- . ; git clean -qfd; die "Static checks failed in the deploy copy."; }
git add -A
echo "→ changes:"; git status --short | head -40
if [ "$DRY" = 1 ]; then git reset -q --hard HEAD; git clean -qfd; green "✓ dry run OK — tests pass, $NEWV would deploy. Nothing pushed, version bump undone."; exit 0; fi
git commit -q -m "v$NEWV: $MSG"
git push -q origin HEAD:main || { git reset -q --hard HEAD~1; die "git push failed (local commit undone)"; }
PUSHED=1
git rev-parse HEAD > "$WORK/.release-base"

# 6. verify live
echo "→ waiting for GitHub Pages to serve $NEWV…"
for i in $(seq 1 40); do
  got="$(curl -fsS "$LIVE/version.json?t=$(date +%s%N)" 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).v)}catch(e){console.log("")}})')"
  if [ "$got" = "$NEWV" ]; then
    sw="$(curl -fsS "$LIVE/sw.js?t=$(date +%s)" | grep -o "fbg-v[0-9.]*" | head -1)"
    [ "$sw" = "fbg-v$NEWV" ] || { sleep 10; continue; }
    green "✓ v$NEWV is live: $LIVE/"; exit 0
  fi
  sleep 10
done
red "! Pushed, but the live site still shows '$got' after ~7 min. Check https://github.com/aisihom/forged-by-grace/actions"; exit 1
