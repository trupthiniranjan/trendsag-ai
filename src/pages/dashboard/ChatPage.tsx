import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, Send, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Msg { role: "user" | "assistant"; content: string; }

export default function ChatPage() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_messages").select("role, content").eq("user_id", user.id)
      .order("created_at").limit(50).then(({ data }) => {
        if (data) setMessages(data.filter((m: any) => m.role !== "system") as Msg[]);
      });
  }, [user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming || !session) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: next }),
      });
      if (resp.status === 429) { toast.error("Rate limit, slow down"); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("Lovable AI credits exhausted"); setStreaming(false); return; }
      if (!resp.ok || !resp.body) { toast.error("Chat failed"); setStreaming(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", acc = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
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
            if (c) {
              acc += c;
              setMessages((p) => { const x = [...p]; x[x.length - 1] = { role: "assistant", content: acc }; return x; });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setStreaming(false); }
  }

  return (
    <div className="h-[calc(100vh-9rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-semibold">AI Co-Pilot</h1>
        <p className="text-sm text-muted-foreground">Ask anything. Powered by your real customer data.</p>
      </div>

      <div ref={scrollRef} className="flex-1 glass rounded-xl p-4 overflow-y-auto scrollbar-thin space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-10 w-10 mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Try: <em>"What should I improve about shipping based on recent reviews?"</em></p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-primary/20" : "bg-gradient-primary"}`}>
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary-foreground" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${m.role === "user" ? "bg-primary/10" : "bg-secondary"}`}>
              <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2">
                <ReactMarkdown>{m.content || (streaming ? "▍" : "")}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your co-pilot…" disabled={streaming} />
        <Button type="submit" disabled={streaming || !input.trim()} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
