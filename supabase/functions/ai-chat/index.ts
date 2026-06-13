// Streaming AI co-pilot chat for the owner.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { messages } = await req.json();

    // Inject recent comments stats as system context
    const { data: stats } = await supabase
      .from("comments").select("sentiment_label, platform, themes, english_text")
      .eq("user_id", user.id).eq("is_spam", false)
      .order("created_at", { ascending: false }).limit(40);
    const ctx = stats?.length
      ? `Recent customer feedback (last ${stats.length}):\n${stats.map((c) => `- [${c.sentiment_label}|${c.platform}] ${c.english_text}`).join("\n")}`
      : "No customer feedback yet.";

    // Persist user message
    const lastUser = messages[messages.length - 1];
    if (lastUser?.role === "user") {
      await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: lastUser.content });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: `You are TrendSage AI Co-Pilot, an AI advisor for retail business owners. Be concise, friendly, and actionable. Suggest concrete marketing & operational improvements based on customer feedback. Use markdown for clarity.\n\n${ctx}` },
          ...messages,
        ],
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiResp.ok || !aiResp.body) return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Tee stream: send to client and collect to persist
    let fullText = "";
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResp.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              const c = j.choices?.[0]?.delta?.content;
              if (c) fullText += c;
            } catch { /* partial */ }
          }
        }
        if (fullText) {
          await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: fullText });
        }
        controller.close();
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
