"use client";

import { useEffect } from "react";
import { Brain, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Brain className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-zinc-400">
              An unexpected error occurred. Our team has been notified.
            </p>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
