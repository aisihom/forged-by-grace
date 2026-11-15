#!/usr/bin/env node
'use strict';
// LIVE end-to-end check of coach approval + full client delete, with THROWAWAY accounts only.
// Needs: private.coach_emails rows for fbg-e2e-coach-a@example.com / -b (added + removed by the operator).
// Never touches a real client. Prints PASS/FAIL per check. Cleanup of coaches is done in SQL afterwards.
var U = 'https://hdcpxmctilthjhdhhixw.supabase.co', K = 'sb_publishable_oFIIm1osyVtpV-t9PCjFxA_tkkQ9xUg';
var PW = process.env.FBG_E2E_PW || ('E2e-' + Math.random().toString(36).slice(2) + '!x9'); // run cleanup SQL before a re-run
var fails = 0;
function check(name, cond, extra) { if (cond) console.log('PASS  ' + name); else { fails++; console.log('FAIL  ' + name + (extra ? '  ' + JSON.stringify(extra).slice(0, 300) : '')); } }
async function req(method, path, tok, body, hdr) {
  var h = Object.assign({ apikey: K, 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}, hdr || {});
  var r = await fetch(U + path, { method: method, headers: h, body: body == null ? undefined : (typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body)) });
  var txt = await r.text(), j = null; try { j = JSON.parse(txt); } catch (e) { j = txt; }
  return { ok: r.ok, status: r.status, j: j };
}
async function signup(email) {
  var r = await req('POST', '/auth/v1/signup', null, { email: email, password: PW });
  if (!r.j.access_token) r = await req('POST', '/auth/v1/token?grant_type=password', null, { email: email, password: PW });
  return { tok: r.j.access_token, uid: r.j.user && r.j.user.id };
}
var rpc = function (tok, fn, args) { return req('POST', '/rest/v1/rpc/' + fn, tok, args || {}); };
(async function () {
  var ca = await signup('fbg-e2e-coach-a@example.com'), cb = await signup('fbg-e2e-coach-b@example.com');
  check('throwaway coaches signed in', ca.tok && cb.tok);
  var kt = await req('GET', '/rest/v1/coaches?select=invite_token&user_id=eq.' + ca.uid, ca.tok);
  var invite = kt.j[0] && kt.j[0].invite_token; check('coach A has invite token', !!invite, kt.j);
  var em = 'fbg-e2e-client-' + Date.now() + '@example.com', cl = await signup(em);
  var jr = await rpc(cl.tok, 'join_coach', { p_token: invite, p_name: 'E2E Test Klant', p_profile: { name: 'E2E' } });
  var cid = jr.j; check('client joined via invite', jr.ok && typeof cid === 'string', jr.j);
  var st = await rpc(cl.tok, 'my_status');
  check('new sign-up is pending', st.j && st.j.status === 'pending' && st.j.client_id === cid, st.j);
  var see = await req('GET', '/rest/v1/clients?select=id,plan', cl.tok);
  check('pending client cannot read its row/plan', see.ok && Array.isArray(see.j) && see.j.length === 0, see.j);
  var w = await req('POST', '/rest/v1/client_data', cl.tok, { client_id: cid, kind: 'food', data: { x: 1 } });
  check('pending client cannot write client_data', !w.ok, w.status);
  var up0 = await req('POST', '/storage/v1/object/checkin-photos/' + cid + '/ph-2026-11-15-front-e2e.jpg', cl.tok, new Uint8Array([255, 216, 255, 217]), { 'Content-Type': 'image/jpeg' });
  check('pending client cannot upload photos', !up0.ok, up0.status);
  var ht = await rpc(cl.tok, 'my_health_token', { p_reset: false });
  check('pending client gets no health key', !ht.ok, ht.status);
  var pi = await rpc(cl.tok, 'pending_push', { p_kind: 'intake', p_data: { answers: { a: 1 } } });
  check('pending client CAN send intake', pi.ok && pi.j === true, pi.j);
  var pf = await rpc(cl.tok, 'pending_push', { p_kind: 'food', p_data: { x: 1 } });
  check('pending_push refuses other kinds', !pf.ok, pf.status);
  var cv = await req('GET', '/rest/v1/clients?select=id,status&id=eq.' + cid, ca.tok);
  check('coach A sees the pending client', cv.j[0] && cv.j[0].status === 'pending', cv.j);
  var cbv = await req('GET', '/rest/v1/clients?select=id&id=eq.' + cid, cb.tok);
  check('coach B does not see it', Array.isArray(cbv.j) && cbv.j.length === 0, cbv.j);
  var ap = await req('PATCH', '/rest/v1/clients?id=eq.' + cid, ca.tok, { status: 'active' }, { Prefer: 'return=representation' });
  check('coach A approves', ap.ok && ap.j[0] && ap.j[0].status === 'active', ap.j);
  var st2 = await rpc(cl.tok, 'my_status'); check('client now active', st2.j.status === 'active', st2.j);
  w = await req('POST', '/rest/v1/client_data', cl.tok, { client_id: cid, kind: 'food', data: { x: 1 } });
  check('approved client can write', w.ok, w.j);
  var up = await req('POST', '/storage/v1/object/checkin-photos/' + cid + '/ph-2026-11-15-front-e2e.jpg', cl.tok, new Uint8Array([255, 216, 255, 217]), { 'Content-Type': 'image/jpeg' });
  var up2 = await req('POST', '/storage/v1/object/checkin-photos/' + cid + '/trash/1__ph-2026-11-14-back-e2e.jpg', cl.tok, new Uint8Array([255, 216, 255, 217]), { 'Content-Type': 'image/jpeg' });
  check('approved client uploads photo + trash photo', up.ok && up2.ok, [up.j, up2.j]);
  ht = await rpc(cl.tok, 'my_health_token', { p_reset: false }); check('approved client gets health key', ht.ok);
  var hp = await rpc(null, 'health_push', { p_token: ht.j, p_q: 'steps=1234' }); check('health push works when approved', hp.ok, hp.j);
  // permission: coach B and the client itself may NOT delete
  var d1 = await rpc(cb.tok, 'coach_delete_client', { p_cid: cid }); check('other coach cannot delete', !d1.ok && /not your client/.test(JSON.stringify(d1.j)), d1.j);
  var d2 = await rpc(cl.tok, 'coach_delete_client', { p_cid: cid }); check('client cannot delete', !d2.ok, d2.j);
  var d0 = await rpc(null, 'coach_delete_client', { p_cid: cid }); check('anon cannot delete', !d0.ok, d0.status);
  var d3 = await rpc(ca.tok, 'coach_delete_client', { p_cid: cid }); check('RPC refuses while photos left', !d3.ok && /photos left/.test(JSON.stringify(d3.j)), d3.j);
  check('was_deleted is false before delete', (await rpc(null, 'fbg_was_deleted', { p_cid: cid, p_uid: cl.uid })).j === false);
  // the app's way: list main + trash with the Storage API, remove, then RPC
  var names = [];
  for (var pre of [cid, cid + '/trash']) { var l = await req('POST', '/storage/v1/object/list/checkin-photos', ca.tok, { prefix: pre, limit: 1000 }); (Array.isArray(l.j) ? l.j : []).forEach(function (o) { if (o.id) names.push(pre + '/' + o.name); }); }
  check('coach lists 2 photos', names.length === 2, names);
  var rm = await req('DELETE', '/storage/v1/object/checkin-photos', ca.tok, { prefixes: names }); check('coach removes photos via Storage API', rm.ok, rm.j);
  var d4 = await rpc(ca.tok, 'coach_delete_client', { p_cid: cid }); check('coach A deletes own client', d4.ok && d4.j.ok && d4.j.login_deleted === true, d4.j);
  var gone = await req('GET', '/rest/v1/clients?select=id&id=eq.' + cid, ca.tok); check('clients row gone', gone.j.length === 0);
  var gd = await req('GET', '/rest/v1/client_data?select=kind&client_id=eq.' + cid, ca.tok); check('client_data gone', gd.j.length === 0);
  var hp2 = await rpc(null, 'health_push', { p_token: ht.j, p_q: 'steps=99' }); check('old health key dead', !hp2.ok);
  var li = await req('POST', '/auth/v1/token?grant_type=password', null, { email: em, password: PW }); check('client can no longer log in', !li.ok, li.status);
  check('tombstone: was_deleted(cid, uid) = true', (await rpc(null, 'fbg_was_deleted', { p_cid: cid, p_uid: cl.uid })).j === true);
  check('tombstone: wrong uid = false', (await rpc(null, 'fbg_was_deleted', { p_cid: cid, p_uid: ca.uid })).j === false);
  var di = await rpc(ca.tok, 'coach_deleted_ids'); check('coach A sees deleted id', Array.isArray(di.j) && di.j.indexOf(cid) !== -1, di.j);
  var di2 = await rpc(cb.tok, 'coach_deleted_ids'); check('coach B does not', Array.isArray(di2.j) && di2.j.indexOf(cid) === -1);
  var again = await signup(em); var st3 = again.tok ? await rpc(again.tok, 'my_status') : { j: { status: 'none' } };
  check('signing up again with same email starts empty', st3.j.status === 'none', st3.j);
  var em2 = 'fbg-e2e-inv-' + Date.now() + '@example.com';
  var ins = await req('POST', '/rest/v1/clients', ca.tok, { coach_id: ca.uid, email: em2, name: 'E2E Invite' }, { Prefer: 'return=representation' });
  var inv = await signup(em2), st4 = await rpc(inv.tok, 'my_status');
  check('coach-invited email signs up as pending', ins.ok && st4.j.status === 'pending', [ins.j, st4.j]);
  console.log(JSON.stringify({ cid: cid, reuser: again.uid || null, fails: fails }));
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
