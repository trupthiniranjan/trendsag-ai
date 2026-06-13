// Generates AI insights summary from recent comments for the authenticated user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: comments } = await supabase
      .from("comments")
      .select("english_text, original_text, sentiment_label, themes, platform, rating")
      .eq("user_id", user.id).eq("is_spam", false)
      .order("created_at", { ascending: false }).limit(80);

    if (!comments || comments.length === 0) return json({ error: "No comments yet" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const compact = comments.map((c, i) => `${i + 1}. [${c.platform}|${c.sentiment_label}|${c.rating ?? "?"}★] ${c.english_text || c.original_text}`).join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a retail customer-experience analyst. Always call build_insight." },
          { role: "user", content: `Analyze these ${comments.length} customer reviews and produce strategic insights:\n\n${compact}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "build_insight",
            description: "Structured customer insight",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "3-5 sentence executive summary" },
                top_themes: { type: "array", items: { type: "object", properties: { theme: { type: "string" }, count: { type: "number" }, sentiment: { type: "string" } }, required: ["theme", "count", "sentiment"], additionalProperties: false } },
                positive_highlights: { type: "array", items: { type: "string" } },
                negative_highlights: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "top_themes", "positive_highlights", "negative_highlights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "build_insight" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limit exceeded, try again later." }, 429);
    if (aiResp.status === 402) return json({ error: "Lovable AI credits exhausted." }, 402);
    if (!aiResp.ok) return json({ error: "AI failed" }, 500);

    const aiData = await aiResp.json();
    const args = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);

    const { data: insight } = await supabase.from("ai_insights").insert({
      user_id: user.id,
      summary: args.summary,
      top_themes: args.top_themes,
      positive_highlights: args.positive_highlights,
      negative_highlights: args.negative_highlights,
      comment_count: comments.length,
    }).select().single();

    return json({ success: true, insight });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
