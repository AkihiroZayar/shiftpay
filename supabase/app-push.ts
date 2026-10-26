// AkihiroLabs — app-push Edge Function
// Shared Web Push backend for AkihiroLabs apps without login (ShiftPay, …).
//   POST {action:"subscribe",   app, sub, tz, events}  → save / replace reminders
//   POST {action:"unsubscribe", endpoint}             → forget this device
//   POST {action:"tick"}                              → send reminders due now (pg_cron, every minute)
// Deploy with "Verify JWT" OFF — the browser calls it directly.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:byte@akihirolabs.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const APPS = new Set(["shiftpay"]);
const ORIGIN_OK = /^https:\/\/([a-z0-9-]+\.)?akihirolabs\.com$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const MAX_EVENTS = 120;

function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ORIGIN_OK.test(o) ? o : "https://akihirolabs.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Vary": "Origin",
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function cleanEvents(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const now = Date.now();
  return raw
    .map((e) => ({
      at: (() => { const t = Date.parse(str(e?.at, 40)); return Number.isNaN(t) ? "" : new Date(t).toISOString(); })(),
      title: str(e?.title, 80),
      body: str(e?.body, 200),
      tag: str(e?.tag, 60),
    }))
    .filter((e) => {
      const t = Date.parse(e.at);
      return e.title && !Number.isNaN(t) && t > now - 60_000 && t < now + 120 * 86_400_000;
    })
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, MAX_EVENTS);
}

async function subscribe(req: Request, b: any) {
  const app = str(b.app, 30);
  const sub = b.sub ?? {};
  const endpoint = str(sub.endpoint, 1000);
  if (!APPS.has(app)) return json(req, { error: "unknown app" }, 400);
  if (!/^https:\/\//.test(endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) return json(req, { error: "bad subscription" }, 400);

  const { error } = await sb.from("app_push").upsert({
    app,
    endpoint,
    p256dh: str(sub.keys.p256dh, 200),
    auth: str(sub.keys.auth, 100),
    tz: str(b.tz, 60) || "Asia/Tokyo",
    events: cleanEvents(b.events),
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  return error ? json(req, { error: error.message }, 500) : json(req, { ok: true });
}

async function unsubscribe(req: Request, b: any) {
  const endpoint = str(b.endpoint, 1000);
  if (endpoint) await sb.from("app_push").delete().eq("endpoint", endpoint);
  return json(req, { ok: true });
}

async function tick(req: Request) {
  const now = Date.now();
  const from = new Date(now - 2 * 60_000).toISOString();   // catch up on a missed minute
  const to = new Date(now + 30_000).toISOString();

  const { data: rows, error } = await sb.from("app_push").select("*");
  if (error) return json(req, { error: error.message }, 500);

  let sent = 0;
  for (const r of rows ?? []) {
    const due = (r.events as any[]).filter((e) => e.at >= from && e.at <= to);
    for (const e of due) {
      const key = `${r.id}|${e.at}|${e.tag}`;
      const { error: dup } = await sb.from("app_push_log").insert({ log_key: key });
      if (dup) continue; // already sent
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          JSON.stringify({ title: e.title, body: e.body, tag: e.tag || r.app, url: "/" }),
          { TTL: 600 },
        );
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await sb.from("app_push").delete().eq("id", r.id); // device unsubscribed
          break;
        }
        console.error("push failed", r.app, err?.statusCode, err?.body);
      }
    }
  }
  return json(req, { ok: true, sent });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "POST only" }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { /* empty */ }
  switch (b.action) {
    case "subscribe": return subscribe(req, b);
    case "unsubscribe": return unsubscribe(req, b);
    case "tick": return tick(req);
    default: return json(req, { error: "unknown action" }, 400);
  }
});
