// Generates a "receipt-style" business recommendation for the owner.
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

    const { focus } = await req.json().catch(() => ({ focus: "" }));

    const { data: comments } = await supabase
      .from("comments").select("english_text, sentiment_label, themes, platform, rating")
      .eq("user_id", user.id).eq("is_spam", false)
      .order("created_at", { ascending: false }).limit(60);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const corpus = (comments || []).map((c) => `[${c.sentiment_label}|${c.platform}] ${c.english_text}`).join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a McKinsey-style retail strategist. Produce an actionable, prescriptive recommendation receipt. Always call build_recommendation." },
          { role: "user", content: `Owner focus: ${focus || "general improvement"}\n\nReviews:\n${corpus || "No reviews yet — give a generic onboarding recommendation."}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "build_recommendation",
            description: "Structured business recommendation",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                situation: { type: "string", description: "1-2 sentence diagnosis of current state" },
                diagnosis: { type: "string", description: "Root cause analysis, 2-4 sentences" },
                steps: { type: "array", items: { type: "object", properties: { step: { type: "string" }, detail: { type: "string" } }, required: ["step", "detail"], additionalProperties: false } },
                next_action: { type: "string", description: "Single highest-priority next action" },
                priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
              },
              required: ["title", "situation", "diagnosis", "steps", "next_action", "priority"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "build_recommendation" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limit exceeded" }, 429);
    if (aiResp.status === 402) return json({ error: "Credits exhausted" }, 402);
    if (!aiResp.ok) return json({ error: "AI failed" }, 500);

    const aiData = await aiResp.json();
    const args = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);

    const { data: rec } = await supabase.from("recommendations").insert({
      user_id: user.id, ...args,
    }).select().single();

    await supabase.from("alerts").insert({
      user_id: user.id, type: "recommendation_ready",
      title: "New AI recommendation ready",
      message: rec.title,
    });

    return json({ success: true, recommendation: rec });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
