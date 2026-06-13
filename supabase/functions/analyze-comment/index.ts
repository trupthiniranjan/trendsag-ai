// Analyzes a single comment: language, English translation, sentiment, spam, themes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { comment_id } = await req.json();
    if (!comment_id) return json({ error: "Missing comment_id" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: comment, error } = await supabase
      .from("comments").select("*").eq("id", comment_id).maybeSingle();
    if (error || !comment) return json({ error: "Comment not found" }, 404);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You analyze customer reviews. Always call the analyze_comment tool." },
          { role: "user", content: `Customer review:\n"""${comment.original_text}"""\nRating: ${comment.rating ?? "n/a"}\nPlatform: ${comment.platform}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_comment",
            description: "Returns analysis of a customer review.",
            parameters: {
              type: "object",
              properties: {
                language: { type: "string", description: "ISO 639-1 code of detected language" },
                english_text: { type: "string", description: "Translated English version (or original if already English)" },
                sentiment_score: { type: "number", description: "From -1 (very negative) to 1 (very positive)" },
                sentiment_label: { type: "string", enum: ["positive", "neutral", "negative"] },
                is_spam: { type: "boolean" },
                spam_reason: { type: "string", description: "Empty string if not spam" },
                themes: { type: "array", items: { type: "string" }, description: "1-4 short theme tags like 'shipping', 'quality', 'price'" },
              },
              required: ["language", "english_text", "sentiment_score", "sentiment_label", "is_spam", "spam_reason", "themes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_comment" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return json({ error: "AI analysis failed", status: aiResp.status }, 500);
    }

    const aiData = await aiResp.json();
    const argsStr = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) return json({ error: "No tool call returned" }, 500);
    const a = JSON.parse(argsStr);

    await supabase.from("comments").update({
      language: a.language,
      english_text: a.english_text,
      sentiment_score: a.sentiment_score,
      sentiment_label: a.sentiment_label,
      is_spam: a.is_spam,
      spam_reason: a.spam_reason || null,
      themes: a.themes,
      analyzed: true,
    }).eq("id", comment_id);

    // Create alert for negative non-spam comments
    if (!a.is_spam && a.sentiment_label === "negative") {
      await supabase.from("alerts").insert({
        user_id: comment.user_id,
        type: "new_comment",
        title: "Negative review received",
        message: a.english_text.slice(0, 140),
        comment_id,
      });
    } else if (!a.is_spam) {
      await supabase.from("alerts").insert({
        user_id: comment.user_id,
        type: "new_comment",
        title: `New ${a.sentiment_label} review`,
        message: a.english_text.slice(0, 140),
        comment_id,
      });
    }

    return json({ success: true, analysis: a });
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
