// Forged by Grace — send due rest-timer Web Push messages (VAPID).
// Invoked by pg_cron only when a pending alert is about to fire. $0 path.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = { "Content-Type": "application/json" };

Deno.serve(async (_req: Request) => {
  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "https://hdcpxmctilthjhdhhixw.supabase.co";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!key) return json({ error: "no service role" }, 500);
    const sb = createClient(url, key, { auth: { persistSession: false } });

    const vapidRes = await sb.rpc("rest_alert_vapid");
    if (vapidRes.error || !vapidRes.data?.[0]?.private_jwk) {
      return json({ error: "vapid missing" }, 500);
    }
    const vapid = vapidRes.data[0] as { public_key: string; private_jwk: JsonWebKey; subject: string };

    const claim = await sb.rpc("rest_alert_claim");
    if (claim.error) return json({ error: claim.error.message }, 500);
    const rows = (claim.data ?? []) as { id: string; endpoint: string; p256dh: string; auth: string }[];
    let sent = 0, failed = 0;
    for (const row of rows) {
      try {
        const res = await sendWebPush(row, { title: "Rust voorbij!", body: "Tijd voor je volgende set 💪", tag: "fbg-rest" }, vapid);
        const ok = res.status >= 200 && res.status < 300;
        const errText = ok ? null : `${res.status} ${await res.text().catch(() => "")}`.trim();
        await sb.rpc("rest_alert_finish", { p_id: row.id, p_ok: ok, p_error: errText });
        if (ok) sent++; else failed++;
      } catch (e) {
        failed++;
        await sb.rpc("rest_alert_finish", { p_id: row.id, p_ok: false, p_error: String(e).slice(0, 300) });
      }
    }
    return json({ sent, failed, n: rows.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; tag: string },
  vapid: { public_key: string; private_jwk: JsonWebKey; subject: string },
): Promise<Response> {
  const body = await encryptPayload(JSON.stringify(payload), sub.p256dh, sub.auth);
  const aud = new URL(sub.endpoint).origin;
  const jwt = await vapidJwt(vapid, aud);
  return fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapid.public_key}`,
      TTL: "60",
      Urgency: "high",
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
    },
    body,
  });
}

async function vapidJwt(vapid: { private_jwk: JsonWebKey; subject: string }, aud: string): Promise<string> {
  const header = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: vapid.subject || "https://aisihom.github.io/forged-by-grace",
  })));
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const jwk = { ...vapid.private_jwk, key_ops: ["sign"], ext: true };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, data));
  return `${header}.${payload}.${bytesToB64url(sig)}`;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function u32(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
}

async function hkdf(ikm: ArrayBuffer, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

async function encryptPayload(plaintext: string, p256dh: string, auth: string): Promise<Uint8Array> {
  const uaPubRaw = b64urlToBytes(p256dh);
  const authSecret = b64urlToBytes(auth);
  const asPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", asPair.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPubRaw, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPair.privateKey, 256);
  const keyInfo = concat([new TextEncoder().encode("WebPush: info\0"), uaPubRaw, asPub]);
  const ikm = await hkdf(ecdh, authSecret, keyInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(ikm, salt, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(ikm, salt, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);
  const padded = concat([new TextEncoder().encode(plaintext), new Uint8Array([2])]);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, padded));
  // rfc8188 header: salt (16) || rs (4) || idlen (1) || keyid (as public 65)
  return concat([salt, u32(4096), new Uint8Array([asPub.length]), asPub, ciphertext]);
}
