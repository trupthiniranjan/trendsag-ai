import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color?: "primary" | "positive" | "negative" | "warn";
}

const colorMap: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  positive: "text-positive bg-[hsl(var(--positive))]/10",
  negative: "text-negative bg-[hsl(var(--negative))]/10",
  warn: "text-warn bg-[hsl(var(--warn))]/10",
};

export function StatCard({ icon: Icon, label, value, color = "primary" }: StatCardProps) {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}
