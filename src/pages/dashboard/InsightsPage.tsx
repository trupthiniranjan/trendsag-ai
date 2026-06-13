import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Receipt, AlertTriangle, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Insight {
  id: string;
  summary: string;
  top_themes: any;
  positive_highlights: any;
  negative_highlights: any;
  comment_count: number | null;
  created_at: string;
}

interface Recommendation {
  id: string;
  title: string;
  situation: string | null;
  diagnosis: string | null;
  steps: any;
  next_action: string | null;
  priority: string | null;
  created_at: string;
}

export default function InsightsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loadingI, setLoadingI] = useState(false);
  const [loadingR, setLoadingR] = useState(false);
  const [focus, setFocus] = useState("");

  async function load() {
    if (!user) return;
    const { data: i } = await supabase.from("ai_insights").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    const { data: r } = await supabase.from("recommendations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    setInsights((i as Insight[]) || []);
    setRecs((r as Recommendation[]) || []);
  }
  useEffect(() => { load(); }, [user]);

  async function genInsight() {
    setLoadingI(true);
    const { data, error } = await supabase.functions.invoke("ai-insights");
    setLoadingI(false);
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    toast.success("Insight generated");
    load();
  }

  async function genRec() {
    setLoadingR(true);
    const { data, error } = await supabase.functions.invoke("business-recommendation", { body: { focus } });
    setLoadingR(false);
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    toast.success("Recommendation receipt ready");
    setFocus("");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">AI Insights & Recommendations</h1>
        <p className="text-sm text-muted-foreground">Strategic analysis grounded in your real customer feedback.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="font-display font-semibold">AI Insights</h2></div>
            <Button onClick={genInsight} disabled={loadingI} size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              {loadingI ? <Loader2 className="h-3 w-3 animate-spin" /> : "Generate"}
            </Button>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin">
            {insights.length === 0 && <p className="text-sm text-muted-foreground">No insights yet. Click generate to analyze your reviews.</p>}
            {insights.map((i) => (
              <div key={i.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{i.comment_count} reviews</Badge>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}</span>
                </div>
                <p className="text-sm mb-3">{i.summary}</p>
                {Array.isArray(i.top_themes) && i.top_themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {i.top_themes.map((t: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-[10px]">{t.theme} · {t.count}</Badge>
                    ))}
                  </div>
                )}
                {Array.isArray(i.positive_highlights) && i.positive_highlights.length > 0 && (
                  <div className="text-xs space-y-1 mb-2">
                    {i.positive_highlights.map((h: string, idx: number) => (
                      <div key={idx} className="flex gap-1.5"><ThumbsUp className="h-3 w-3 text-positive shrink-0 mt-0.5" /><span>{h}</span></div>
                    ))}
                  </div>
                )}
                {Array.isArray(i.negative_highlights) && i.negative_highlights.length > 0 && (
                  <div className="text-xs space-y-1">
                    {i.negative_highlights.map((h: string, idx: number) => (
                      <div key={idx} className="flex gap-1.5"><AlertTriangle className="h-3 w-3 text-negative shrink-0 mt-0.5" /><span>{h}</span></div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /><h2 className="font-display font-semibold">Recommendation Receipts</h2></div>
          </div>
          <div className="flex gap-2 mb-4">
            <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Optional focus (e.g., shipping, pricing)" />
            <Button onClick={genRec} disabled={loadingR} size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              {loadingR ? <Loader2 className="h-3 w-3 animate-spin" /> : "Generate"}
            </Button>
          </div>
          <div className="space-y-4 max-h-[540px] overflow-y-auto scrollbar-thin">
            {recs.length === 0 && <p className="text-sm text-muted-foreground">No recommendations yet.</p>}
            {recs.map((r) => <ReceiptCard key={r.id} rec={r} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptCard({ rec }: { rec: Recommendation }) {
  const priorityColor: Record<string, string> = {
    urgent: "bg-destructive text-destructive-foreground",
    high: "bg-warn/80 text-background",
    medium: "bg-neutral/80 text-background",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <div className="border border-dashed border-border rounded-lg p-4 bg-background/40 font-mono text-xs">
      <div className="text-center border-b border-dashed border-border pb-2 mb-3">
        <div className="font-display font-bold text-base">TRENDSAGE AI</div>
        <div className="text-[10px] text-muted-foreground">action receipt · {formatDistanceToNow(new Date(rec.created_at), { addSuffix: true })}</div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <span className="font-display font-semibold text-sm not-italic">{rec.title}</span>
          {rec.priority && <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${priorityColor[rec.priority]}`}>{rec.priority}</span>}
        </div>
        {rec.situation && <div><span className="text-muted-foreground">SITUATION ──── </span>{rec.situation}</div>}
        {rec.diagnosis && <div><span className="text-muted-foreground">DIAGNOSIS ──── </span>{rec.diagnosis}</div>}
        {Array.isArray(rec.steps) && rec.steps.length > 0 && (
          <div>
            <div className="text-muted-foreground mt-2 mb-1">─── ACTION STEPS ───</div>
            {rec.steps.map((s: any, i: number) => (
              <div key={i} className="ml-2 mb-1">
                <div>{i + 1}. <span className="font-semibold">{s.step}</span></div>
                <div className="text-muted-foreground ml-3">{s.detail}</div>
              </div>
            ))}
          </div>
        )}
        {rec.next_action && (
          <div className="border-t border-dashed border-border pt-2 mt-2">
            <div className="text-muted-foreground">NEXT ACTION →</div>
            <div className="font-semibold text-primary">{rec.next_action}</div>
          </div>
        )}
        <div className="text-center text-muted-foreground border-t border-dashed border-border pt-2 mt-2 text-[9px]">
          ★ thank you for shopping smart ★
        </div>
      </div>
    </div>
  );
}
