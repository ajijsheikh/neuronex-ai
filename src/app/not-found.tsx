import Link from "next/link";
import { Brain, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="h-14 w-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto">
          <Brain className="h-6 w-6 text-zinc-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-zinc-50">Page not found</h1>
          <p className="text-sm text-zinc-400">
            This page does not exist or has been moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
