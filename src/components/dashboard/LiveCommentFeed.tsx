import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ShieldAlert, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  platform: string;
  author: string | null;
  product: string | null;
  rating: number | null;
  original_text: string;
  english_text: string | null;
  language: string | null;
  sentiment_label: "positive" | "neutral" | "negative" | null;
  is_spam: boolean;
  themes: string[] | null;
  created_at: string;
}

const sentimentClass: Record<string, string> = {
  positive: "border-l-[hsl(var(--positive))] bg-[hsl(var(--positive))]/5",
  negative: "border-l-[hsl(var(--negative))] bg-[hsl(var(--negative))]/5",
  neutral: "border-l-[hsl(var(--neutral))] bg-[hsl(var(--neutral))]/5",
  spam: "border-l-muted-foreground bg-muted/20 opacity-60",
};

export function LiveCommentFeed({ limit = 50, hideSpam = true }: { limit?: number; hideSpam?: boolean }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("comments").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(limit);
    setComments((data as Comment[]) || []);
  }

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("live-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `user_id=eq.${user.id}` },
        (payload) => setComments((prev) => [payload.new as Comment, ...prev].slice(0, limit)))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "comments", filter: `user_id=eq.${user.id}` },
        (payload) => setComments((prev) => prev.map((c) => c.id === (payload.new as Comment).id ? payload.new as Comment : c)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, limit]);

  const filtered = hideSpam ? comments.filter((c) => !c.is_spam) : comments;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No comments yet. Head to <span className="text-primary">Sources</span> to ingest some.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
      <AnimatePresence initial={false}>
        {filtered.map((c) => {
          const cls = c.is_spam ? sentimentClass.spam : sentimentClass[c.sentiment_label || "neutral"];
          return (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`border-l-2 rounded-md p-3 ${cls}`}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-mono uppercase">{c.platform}</Badge>
                {c.author && <span className="font-medium text-foreground">{c.author}</span>}
                {c.product && <span>· {c.product}</span>}
                {c.rating != null && (
                  <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-current text-warn" />{c.rating}</span>
                )}
                {c.is_spam && <Badge variant="outline" className="text-[10px] gap-1"><ShieldAlert className="h-2.5 w-2.5" />spam</Badge>}
                <span className="ml-auto text-[10px]">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
              </div>
              <p className="text-sm">{c.english_text || c.original_text}</p>
              {c.english_text && c.original_text !== c.english_text && (
                <p className="text-xs text-muted-foreground mt-1 italic">orig ({c.language}): {c.original_text}</p>
              )}
              {c.themes && c.themes.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {c.themes.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>)}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
