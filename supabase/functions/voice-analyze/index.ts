// Accepts base64 audio, transcribes & translates to English, analyzes sentiment.
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

    const { audio_base64, mime_type, save_as_comment, platform } = await req.json();
    if (!audio_base64) return json({ error: "Missing audio" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    // Use Gemini multimodal to transcribe + translate + analyze in one call
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a multilingual audio analyzer. Always call analyze_voice." },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio, translate to English if needed, and analyze sentiment." },
              { type: "input_audio", input_audio: { data: audio_base64, format: mime_type?.includes("mp3") ? "mp3" : "wav" } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_voice",
            description: "Analyze the audio",
            parameters: {
              type: "object",
              properties: {
                original_transcript: { type: "string" },
                english_text: { type: "string" },
                language: { type: "string" },
                sentiment_score: { type: "number" },
                sentiment_label: { type: "string", enum: ["positive", "neutral", "negative"] },
                themes: { type: "array", items: { type: "string" } },
                summary: { type: "string" },
              },
              required: ["original_transcript", "english_text", "language", "sentiment_score", "sentiment_label", "themes", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_voice" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limit exceeded" }, 429);
    if (aiResp.status === 402) return json({ error: "Credits exhausted" }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Voice AI error", aiResp.status, t);
      return json({ error: "AI failed" }, 500);
    }

    const aiData = await aiResp.json();
    const args = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);

    if (save_as_comment) {
      await supabase.from("comments").insert({
        user_id: user.id,
        platform: platform || "voice",
        original_text: args.original_transcript,
        english_text: args.english_text,
        language: args.language,
        sentiment_score: args.sentiment_score,
        sentiment_label: args.sentiment_label,
        themes: args.themes,
        analyzed: true,
      });
    }

    return json({ success: true, analysis: args });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
