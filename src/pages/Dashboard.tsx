import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LiveCommentFeed } from "@/components/dashboard/LiveCommentFeed";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { PlatformPie } from "@/components/dashboard/PlatformPie";
import { SentimentPie } from "@/components/dashboard/SentimentPie";
import { StatCard } from "@/components/dashboard/StatCard";
import { Activity, MessageSquare, ShieldAlert, ThumbsUp, ThumbsDown } from "lucide-react";

interface Comment {
  id: string;
  platform: string;
  sentiment_label: "positive" | "neutral" | "negative" | null;
  is_spam: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("comments").select("id, platform, sentiment_label, is_spam, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(500);
    setComments((data as Comment[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("dashboard-comments")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const stats = useMemo(() => {
    const real = comments.filter((c) => !c.is_spam);
    return {
      total: real.length,
      positive: real.filter((c) => c.sentiment_label === "positive").length,
      negative: real.filter((c) => c.sentiment_label === "negative").length,
      spam: comments.filter((c) => c.is_spam).length,
    };
  }, [comments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold mb-1">Customer Pulse</h1>
        <p className="text-sm text-muted-foreground">Live overview of every voice across your channels.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={MessageSquare} label="Reviews" value={stats.total} color="primary" />
        <StatCard icon={ThumbsUp} label="Positive" value={stats.positive} color="positive" />
        <StatCard icon={ThumbsDown} label="Negative" value={stats.negative} color="negative" />
        <StatCard icon={ShieldAlert} label="Spam blocked" value={stats.spam} color="warn" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold">Sentiment over time</h2>
          </div>
          <SentimentChart />
        </div>
        <div className="glass rounded-xl p-5">
          <h2 className="font-display font-semibold mb-4">Sentiment mix</h2>
          <SentimentPie />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <h2 className="font-display font-semibold mb-4">By platform</h2>
          <PlatformPie />
        </div>
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Live feed</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
              streaming
            </div>
          </div>
          <LiveCommentFeed limit={8} />
        </div>
      </div>
    </div>
  );
}
