"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, Share2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Brain className="h-6 w-6 text-primary" />
          NEURONEX
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" render={<Link href="/login" />}>
            Sign In
          </Button>
          <Button render={<Link href="/register" />}>
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Your Second Brain.
            <br />
            <span className="text-primary">Automatically Organized.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            NEURONEX transforms your scattered PDFs and notes into an interconnected
            knowledge graph. Upload anything, and let AI build a searchable, conversational
            web of your mind.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" render={<Link href="/register" />}>
              Start Building Your Brain
            </Button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border">
              <UploadIcon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Zero-Friction Ingestion</h3>
              <p className="text-sm text-muted-foreground">Drag and drop PDFs. AI automatically extracts and structures your knowledge.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border">
              <Share2 className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Auto-Linking Graph</h3>
              <p className="text-sm text-muted-foreground">Watch your knowledge graph build itself as entities and connections are discovered.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border">
              <MessageCircle className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">AI Conversational Search</h3>
              <p className="text-sm text-muted-foreground">Ask questions and get answers synthesized from your documents with citations.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        NEURONEX &mdash; Transform Scattered Information into Connected Intelligence
      </footer>
    </div>
  );
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
