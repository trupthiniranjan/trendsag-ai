import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["hsl(var(--positive))", "hsl(var(--neutral))", "hsl(var(--negative))"];

export function SentimentPie() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);

  async function load() {
    if (!user) return;
    const { data: rows } = await supabase
      .from("comments").select("sentiment_label")
      .eq("user_id", user.id).eq("is_spam", false);
    const counts = { positive: 0, neutral: 0, negative: 0 };
    rows?.forEach((r: any) => { if (r.sentiment_label) counts[r.sentiment_label as keyof typeof counts]++; });
    setData([
      { name: "Positive", value: counts.positive },
      { name: "Neutral", value: counts.neutral },
      { name: "Negative", value: counts.negative },
    ].filter(d => d.value > 0));
  }

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel("sent-pie").on("postgres_changes",
      { event: "*", schema: "public", table: "comments", filter: `user_id=eq.${user.id}` }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (data.length === 0) return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
