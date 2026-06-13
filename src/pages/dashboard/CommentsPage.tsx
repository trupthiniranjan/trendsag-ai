import { useState } from "react";
import { LiveCommentFeed } from "@/components/dashboard/LiveCommentFeed";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function CommentsPage() {
  const [hideSpam, setHideSpam] = useState(true);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">All Comments</h1>
          <p className="text-sm text-muted-foreground">Live, AI-analyzed feed across every platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="spam" checked={!hideSpam} onCheckedChange={(v) => setHideSpam(!v)} />
          <Label htmlFor="spam" className="text-sm cursor-pointer">Show spam</Label>
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <LiveCommentFeed limit={200} hideSpam={hideSpam} />
      </div>
    </div>
  );
}
