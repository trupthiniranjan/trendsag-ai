import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, MessageSquareText, Sparkles, Bot, Mic, Webhook, Settings, LogOut } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { AlertsBell } from "./AlertsBell";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const items = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Comments", url: "/dashboard/comments", icon: MessageSquareText },
  { title: "AI Insights", url: "/dashboard/insights", icon: Sparkles },
  { title: "Co-Pilot", url: "/dashboard/chat", icon: Bot },
  { title: "Voice", url: "/dashboard/voice", icon: Mic },
  { title: "Sources", url: "/dashboard/sources", icon: Webhook },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("business_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setBusinessName(data?.business_name || "My Store"));
  }, [user]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <div className="px-4 py-5 flex items-center gap-2 border-b border-sidebar-border">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary glow flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold truncate">TrendSage AI</span>
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end={item.end} className={({ isActive }) =>
                          `flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`
                        }>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <div className="mt-auto p-3 border-t border-sidebar-border">
              <button onClick={logout} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-sidebar-accent/50 transition-colors">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center justify-between px-4 sticky top-0 bg-background/80 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <div className="text-xs text-muted-foreground">Business</div>
                <div className="text-sm font-medium">{businessName}</div>
              </div>
            </div>
            <AlertsBell />
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
