import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export function SentimentChart() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);

  async function load() {
    if (!user) return;
    const since = subDays(new Date(), 14).toISOString();
    const { data: rows } = await supabase
      .from("comments").select("created_at, sentiment_label")
      .eq("user_id", user.id).eq("is_spam", false)
      .gte("created_at", since);
    const buckets: Record<string, { positive: number; neutral: number; negative: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const k = format(startOfDay(subDays(new Date(), i)), "MMM dd");
      buckets[k] = { positive: 0, neutral: 0, negative: 0 };
    }
    rows?.forEach((r: any) => {
      const k = format(startOfDay(new Date(r.created_at)), "MMM dd");
      if (buckets[k] && r.sentiment_label) buckets[k][r.sentiment_label as "positive" | "neutral" | "negative"]++;
    });
    setData(Object.entries(buckets).map(([day, v]) => ({ day, ...v })));
  }

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel("sent-chart").on("postgres_changes",
      { event: "*", schema: "public", table: "comments", filter: `user_id=eq.${user.id}` }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="pos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--positive))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--positive))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="neg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--negative))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--negative))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="neu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--neutral))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--neutral))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="positive" stroke="hsl(var(--positive))" fill="url(#pos)" strokeWidth={2} />
        <Area type="monotone" dataKey="neutral" stroke="hsl(var(--neutral))" fill="url(#neu)" strokeWidth={2} />
        <Area type="monotone" dataKey="negative" stroke="hsl(var(--negative))" fill="url(#neg)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
