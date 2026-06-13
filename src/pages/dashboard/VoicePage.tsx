import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function VoicePage() {
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        analyze(blob);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch { toast.error("Microphone access denied"); }
  }

  function stop() {
    recRef.current?.stop();
    setRecording(false);
  }

  async function analyze(blob: Blob, save = false) {
    setAnalyzing(true);
    try {
      const buf = await blob.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const { data, error } = await supabase.functions.invoke("voice-analyze", {
        body: { audio_base64: b64, mime_type: blob.type, save_as_comment: save, platform: "voice" },
      });
      if (error || data?.error) { toast.error(data?.error || error?.message); return; }
      setResult(data.analysis);
      if (save) toast.success("Saved as a comment");
    } finally { setAnalyzing(false); }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-semibold">Voice Analyser</h1>
        <p className="text-sm text-muted-foreground">Speak in any language. We transcribe, translate and analyze.</p>
      </div>

      <div className="glass rounded-2xl p-8 text-center">
        <button
          onClick={recording ? stop : start}
          disabled={analyzing}
          className={`h-28 w-28 rounded-full mx-auto flex items-center justify-center transition-all ${
            recording ? "bg-destructive glow animate-pulse" : "bg-gradient-primary glow"
          }`}
        >
          {analyzing ? <Loader2 className="h-10 w-10 animate-spin text-primary-foreground" /> :
           recording ? <Square className="h-10 w-10 text-destructive-foreground fill-current" /> :
           <Mic className="h-10 w-10 text-primary-foreground" />}
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          {analyzing ? "Analyzing voice…" : recording ? "Recording — tap to stop" : "Tap the mic and start speaking"}
        </p>
      </div>

      {result && (
        <div className="glass rounded-xl p-6 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Analysis</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">{result.language}</Badge>
              <Badge className={
                result.sentiment_label === "positive" ? "bg-positive text-background" :
                result.sentiment_label === "negative" ? "bg-negative text-background" : "bg-neutral text-background"
              }>{result.sentiment_label}</Badge>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Original transcript</div>
            <p className="text-sm italic">{result.original_transcript}</p>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">English</div>
            <p className="text-sm">{result.english_text}</p>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Summary</div>
            <p className="text-sm">{result.summary}</p>
          </div>
          {result.themes?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.themes.map((t: string) => <Badge key={t} variant="secondary">#{t}</Badge>)}
            </div>
          )}
          {audioBlob && (
            <Button onClick={() => analyze(audioBlob, true)} disabled={analyzing} variant="outline" className="w-full">
              <Save className="h-4 w-4 mr-2" /> Save as customer comment
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
