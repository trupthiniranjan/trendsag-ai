import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("business_name, display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setBusinessName(data?.business_name || "");
        setDisplayName(data?.display_name || "");
      });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ business_name: businessName, display_name: displayName }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Your profile and business info.</p>
      </div>

      <div className="glass rounded-xl p-6 space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled />
        </div>
        <div>
          <Label>Display name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label>Business name</Label>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
