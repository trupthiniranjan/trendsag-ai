import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const PALETTE = ["#34E0A1", "#22D3EE", "#FBBF24", "#F87171", "#A78BFA", "#F472B6", "#60A5FA"];

export function PlatformPie() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);

  async function load() {
    if (!user) return;
    const { data: rows } = await supabase
      .from("comments").select("platform").eq("user_id", user.id).eq("is_spam", false);
    const counts: Record<string, number> = {};
    rows?.forEach((r: any) => { counts[r.platform] = (counts[r.platform] || 0) + 1; });
    setData(Object.entries(counts).map(([name, value]) => ({ name, value })));
  }

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel("plat-pie").on("postgres_changes",
      { event: "*", schema: "public", table: "comments", filter: `user_id=eq.${user.id}` }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (data.length === 0) return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
