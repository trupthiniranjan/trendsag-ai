// Public webhook for marketplace scrapers / external integrations.
// POST { token, comments: [{ platform, author, product, rating, text, language? }] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const token = body.token || new URL(req.url).searchParams.get("token");
    if (!token) return json({ error: "Missing token" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: source, error: srcErr } = await supabase
      .from("sources").select("id, user_id, active").eq("ingest_token", token).maybeSingle();
    if (srcErr || !source) return json({ error: "Invalid token" }, 401);
    if (!source.active) return json({ error: "Source disabled" }, 403);

    const items = Array.isArray(body.comments) ? body.comments : [body];
    const rows = items.filter((c: any) => c?.text || c?.original_text).map((c: any) => ({
      user_id: source.user_id,
      source_id: source.id,
      platform: c.platform || "webhook",
      author: c.author || null,
      product: c.product || null,
      rating: c.rating ?? null,
      original_text: c.text || c.original_text,
      language: c.language || null,
      raw_payload: c,
    }));
    if (!rows.length) return json({ error: "No valid comments" }, 400);

    const { data: inserted, error } = await supabase.from("comments").insert(rows).select("id");
    if (error) return json({ error: error.message }, 500);

    // Fire-and-forget analyze for each
    const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-comment`;
    inserted?.forEach((r) => {
      fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: r.id }),
      }).catch(() => {});
    });

    return json({ success: true, ingested: rows.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
