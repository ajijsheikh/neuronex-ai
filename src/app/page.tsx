"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Share2, MessageCircle, Upload, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-sm">NEURONEX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">Sign In</Link>
            <Button size="sm" className="text-xs h-8" render={<Link href="/register" />}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3 w-3 text-primary" />
              AI-Powered Knowledge OS
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
              Transform Scattered Information into{" "}
              <span className="gradient-text">Connected Intelligence</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              NEURONEX automatically builds an interactive knowledge graph from your documents.
              Upload anything — PDFs, notes, code — and let AI connect the dots.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" className="h-10 text-sm gap-2" render={<Link href="/register" />}>
                Start Building Your Brain
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link href="/login" className="inline-flex items-center justify-center h-10 px-4 text-sm rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">Watch Demo</Link>
            </div>

            <div className="mt-16 relative">
              <div className="rounded-xl border border-border bg-card p-4 sm:p-6 glow">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 via-secondary to-background flex items-center justify-center">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-primary/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Interactive Knowledge Graph Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need to organize knowledge</h2>
              <p className="text-muted-foreground text-sm">One platform to upload, understand, connect, and discover.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Upload, title: "Smart Ingestion", desc: "Drag-drop PDFs, images, and notes. AI extracts text and structure automatically." },
                { icon: Brain, title: "AI Understanding", desc: "Gemini AI summarizes, extracts entities, and generates embeddings for every document." },
                { icon: Share2, title: "Auto-Linking Graph", desc: "Watch your knowledge graph build itself as entities and relationships are discovered." },
                { icon: MessageCircle, title: "Conversational Search", desc: "Ask questions in plain English. Get answers with citations to your sources." },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="card-hover rounded-xl border border-border bg-card p-5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">How It Works</h2>
              <p className="text-muted-foreground text-sm">Four simple steps to your second brain.</p>
            </div>
            <div className="space-y-6">
              {[
                { step: "01", title: "Upload", desc: "Drop your PDFs, notes, or any document. We support multiple formats with bulk upload.", icon: Upload },
                { step: "02", title: "Understand", desc: "Gemini AI extracts text, identifies key entities, and generates vector embeddings for semantic search.", icon: Brain },
                { step: "03", title: "Connect", desc: "Entities are automatically linked into a knowledge graph. Watch relationships form between concepts.", icon: Share2 },
                { step: "04", title: "Discover", desc: "Ask questions, explore the graph, and uncover insights you never knew were hidden in your documents.", icon: Sparkles },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.step} className="flex gap-4 sm:gap-6 items-start">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-primary font-medium">{f.step}</span>
                        <h3 className="text-sm font-semibold">{f.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 border-t border-border text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to build your second brain?</h2>
            <p className="text-sm text-muted-foreground mb-6">Join NEURONEX and transform how you manage knowledge.</p>
            <Button size="lg" className="h-10 text-sm gap-2" render={<Link href="/register" />}>
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 px-4 sm:px-6 text-center text-xs text-muted-foreground">
        NEURONEX — Transform Scattered Information into Connected Intelligence
      </footer>
    </div>
  );
}
