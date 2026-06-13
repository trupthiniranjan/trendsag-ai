import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare, Mic, Sparkles, ShieldCheck, Bell, BarChart3, Receipt } from "lucide-react";

const features = [
  { icon: Activity, title: "Live Comment Stream", desc: "Real-time feed of every customer review across Flipkart, Meesho, Amazon and more." },
  { icon: BarChart3, title: "Sentiment Graphs", desc: "Live mood charts and pie analytics so you instantly see how customers feel." },
  { icon: ShieldCheck, title: "Spam Detector", desc: "AI silently filters out junk and bot reviews so you focus on what matters." },
  { icon: Sparkles, title: "AI Insights", desc: "Daily summaries with top themes, complaints and praise — auto-generated." },
  { icon: MessageSquare, title: "AI Co-Pilot Chat", desc: "Ask your AI advisor for marketing ideas grounded in real customer feedback." },
  { icon: Mic, title: "Voice Analyser", desc: "Speak in any language. We transcribe, translate and analyze instantly." },
  { icon: Receipt, title: "Recommendation Receipts", desc: "Receipt-style action plans: situation, diagnosis, next steps. Print and execute." },
  { icon: Bell, title: "Smart Alerts", desc: "Instant notifications when negative reviews land or sentiment dips." },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      <header className="container py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary glow flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">TrendSage AI</span>
        </div>
        <div className="flex gap-3">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth?mode=signup"><Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">Get started</Button></Link>
        </div>
      </header>

      <section className="container pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
          AI-powered customer voice intelligence
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Every customer review.<br />
          <span className="gradient-text">One brutal dashboard.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          TrendSage AI unifies feedback from Flipkart, Meesho, Amazon and beyond — then turns
          it into sentiment graphs, spam-free insights and prescriptive AI recommendations.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/auth?mode=signup"><Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow">Start free</Button></Link>
          <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-xl p-6 hover:border-primary/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

     
    </div>
  );
}
