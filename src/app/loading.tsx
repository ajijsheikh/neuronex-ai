import { Brain, Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
      <Brain className="h-8 w-8 text-primary/60" />
      <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
      <p className="text-sm text-zinc-500">Loading NEURONEX...</p>
    </div>
  );
}
