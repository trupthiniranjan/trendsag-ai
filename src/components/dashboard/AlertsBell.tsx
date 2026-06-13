import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

export function AlertsBell() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("alerts").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20);
    setAlerts((data as Alert[]) || []);
  }

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("alerts-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const a = payload.new as Alert;
          setAlerts((prev) => [a, ...prev].slice(0, 20));
          toast(a.title, { description: a.message || undefined });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unread = alerts.filter((a) => !a.read).length;

  async function markAllRead() {
    if (!user || !unread) return;
    await supabase.from("alerts").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-mono flex items-center justify-center">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="font-display font-semibold">Alerts</div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
              <CheckCheck className="h-3 w-3 mr-1" />Mark read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No alerts yet</div>
          ) : alerts.map((a) => (
            <div key={a.id} className={`p-3 border-b border-border/50 ${!a.read ? "bg-primary/5" : ""}`}>
              <div className="text-sm font-medium">{a.title}</div>
              {a.message && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</div>}
              <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
