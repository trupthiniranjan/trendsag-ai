import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Source { id: string; name: string; ingest_token: string; active: boolean; created_at: string; }

export default function SourcesPage() {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [name, setName] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("sources").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSources((data as Source[]) || []);
  }
  useEffect(() => { load(); }, [user]);

  async function create() {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("sources").insert({ user_id: user.id, name: name.trim() });
    if (error) { toast.error(error.message); return; }
    setName(""); load(); toast.success("Source created");
  }

  async function remove(id: string) {
    await supabase.from("sources").delete().eq("id", id);
    load();
  }

  async function seedDemo() {
    setSeeding(true);
    const { data, error } = await supabase.functions.invoke("seed-demo-data");
    setSeeding(false);
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    toast.success(`Seeded ${data.count} demo comments — analyzing now`);
  }

  async function handleFile(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const text = await file.text();
      let rows: any[] = [];
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : parsed.comments || [];
      } else {
        // CSV: header,row,row...
        const lines = text.split(/\r?\n/).filter(Boolean);
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        rows = lines.slice(1).map((l) => {
          const cells = l.split(",");
          const o: any = {};
          headers.forEach((h, i) => o[h] = cells[i]?.trim());
          return o;
        });
      }
      const inserts = rows.filter((r) => r.text || r.comment || r.review || r.original_text).map((r) => ({
        user_id: user.id,
        platform: r.platform || "upload",
        author: r.author || r.name || null,
        product: r.product || null,
        rating: r.rating ? Number(r.rating) : null,
        original_text: r.text || r.comment || r.review || r.original_text,
        raw_payload: r,
      }));
      if (!inserts.length) { toast.error("No valid rows found"); return; }
      const { data: ins } = await supabase.from("comments").insert(inserts).select("id");
      // trigger analysis
      ins?.forEach((c) => supabase.functions.invoke("analyze-comment", { body: { comment_id: c.id } }));
      toast.success(`Imported ${inserts.length} comments`);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Sources</h1>
        <p className="text-sm text-muted-foreground">Pipe customer feedback in from anywhere.</p>
      </div>

      <Tabs defaultValue="webhook">
        <TabsList>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="demo">Demo data</TabsTrigger>
        </TabsList>

        <TabsContent value="webhook" className="space-y-4 mt-4">
          <div className="glass rounded-xl p-5">
            <div className="flex gap-2 mb-4">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Source name (e.g., Flipkart Scraper)" />
              <Button onClick={create} className="bg-gradient-primary text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
            <div className="space-y-3">
              {sources.map((s) => {
                const url = `${supabaseUrl}/functions/v1/ingest-comment?token=${s.ingest_token}`;
                return (
                  <div key={s.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-display font-medium">{s.name}</div>
                      <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">POST endpoint</div>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted/40 rounded px-2 py-1.5 text-xs font-mono break-all">{url}</code>
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied"); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <details className="mt-3">
                      <summary className="text-xs text-primary cursor-pointer">Example payload</summary>
                      <pre className="text-[10px] bg-muted/40 rounded p-2 mt-2 overflow-x-auto font-mono">
{`{
  "comments": [{
    "platform": "Flipkart",
    "author": "Priya",
    "product": "Earbuds",
    "rating": 4,
    "text": "Great sound, lasts all day."
  }]
}`}
                      </pre>
                    </details>
                  </div>
                );
              })}
              {sources.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No sources yet. Create one to get a webhook URL.</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div className="glass rounded-xl p-5">
            <Label htmlFor="file" className="block mb-3">Upload CSV or JSON</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <input id="file" type="file" accept=".csv,.json" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button asChild disabled={uploading}>
                <label htmlFor="file" className="cursor-pointer">
                  {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing…</> : "Choose file"}
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                CSV columns: platform, author, product, rating, text<br />
                JSON: array of objects with same fields
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="demo" className="space-y-4 mt-4">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-display font-semibold">Generate demo data</h3>
                <p className="text-xs text-muted-foreground">Inserts ~16 realistic reviews and runs AI analysis on each.</p>
              </div>
            </div>
            <Button onClick={seedDemo} disabled={seeding} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Seed demo comments
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
