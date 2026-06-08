"use client";

import { useEffect, useState } from "react";
import { isFirebaseConfigured, getMissingConfigVars } from "@/lib/firebase-config";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FirebaseConfigWarning() {
  const [configured, setConfigured] = useState(true);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    setConfigured(isFirebaseConfigured());
    setMissing(getMissingConfigVars());
  }, []);

  if (configured) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-sm">Firebase Configuration Required</CardTitle>
          </div>
          <CardDescription className="text-xs">
            NEURONEX needs Firebase to be configured. Add the following variables to your{" "}
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">.env.local</code> file:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            {missing.map((v) => (
              <div key={v} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <div className="h-1 w-1 rounded-full bg-destructive shrink-0" />
                {v}
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted p-3 space-y-1.5">
            <p className="text-[11px] font-medium">Example .env.local</p>
            <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id`}
            </pre>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3 w-3" />
            Reload after configuring
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
