import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Signature",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Verifies a Lemon Squeezy webhook signature using the shared secret.
 * Lemon Squeezy sends `X-Signature` as a hex-encoded HMAC-SHA256 of the raw body.
 */
async function verifySignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === signature.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("LEMONSQUEZY_WEBHOOK_SECRET");
  if (!secret) return json({ error: "Webhook not configured" }, 500);

  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature");

  const valid = await verifySignature(rawBody, signature, secret);
  if (!valid) return json({ error: "Invalid signature" }, 401);

  let payload: { meta?: { event_name?: string; custom_data?: { user_email?: string } }; data?: { id?: string; attributes?: { user_email?: string; status?: string } } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const eventName = payload.meta?.event_name ?? "";
  const email = payload.meta?.custom_data?.user_email ?? payload.data?.attributes?.user_email;
  const orderId = payload.data?.id;

  if (!email) return json({ error: "Missing email" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (eventName === "order_created" || eventName === "order_refunded") {
    const status = eventName === "order_refunded" ? "refunded" : "active";
    const { error } = await supabase
      .from("entitlements")
      .upsert(
        { user_email: email.toLowerCase(), plan: "pro", status, lemon_order_id: orderId },
        { onConflict: "lemon_order_id" },
      );

    if (error) return json({ error: "Database error" }, 500);
    return json({ ok: true, email, status });
  }

  return json({ ok: true, ignored: eventName });
});
