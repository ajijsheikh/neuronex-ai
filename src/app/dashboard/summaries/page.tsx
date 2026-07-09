"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Clock, Brain, Target, BookOpen, Layers, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type SummaryType = "30sec" | "2min" | "5min" | "executive" | "exam";

const SUMMARY_TYPES: { id: SummaryType; label: string; icon: typeof Clock; desc: string }[] = [
  { id: "30sec", label: "30-Second", icon: Clock, desc: "The core thesis in 2 sentences" },
  { id: "2min", label: "2-Minute", icon: FileText, desc: "Brief overview of main ideas" },
  { id: "5min", label: "5-Minute", icon: BookOpen, desc: "Detailed summary of all major topics" },
  { id: "executive", label: "Executive", icon: Target, desc: "Professional background and findings" },
  { id: "exam", label: "Exam-Night", icon: Brain, desc: "Critical facts and formulas only" },
];

interface Document {
  id: string;
  title: string;
}

interface Summary {
  id: string;
  type: SummaryType;
  content: string;
  documentId: string;
  document: { title: string };
}

export default function SummariesPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeType = "2min";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const [docsRes, summariesRes] = await Promise.all([
          fetch("/api/documents", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/summaries", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!docsRes.ok || !summariesRes.ok) throw new Error("Failed to load data");
        const docsData = await docsRes.json();
        const summariesData = await summariesRes.json();
        if (!cancelled) {
          setDocuments(docsData.documents || []);
          setSummaries(summariesData.summaries || []);
          if (docsData.documents?.length > 0 && !selectedDocId) {
            setSelectedDocId(docsData.documents[0].id);
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const generateSummary = async (type: SummaryType) => {
    if (!user || !selectedDocId) return;
    setGenerating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentId: selectedDocId, type }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const data = await res.json();
      setSummaries((prev) => {
        const filtered = prev.filter((s) => !(s.documentId === selectedDocId && s.type === type));
        return [...filtered, data.summary];
      });
      toast.success(`${type} summary generated`);
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  const currentSummaries = summaries.filter((s) => s.documentId === selectedDocId);
  const activeSummary = currentSummaries.find((s) => s.type === activeType);
  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-4">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-3">
        <Layers className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
        <p className="text-xs text-muted-foreground/60">Upload a document to generate summaries</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <Layers className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart Summaries</h1>
          <p className="text-sm text-muted-foreground">
            {selectedDoc ? `Summaries for "${selectedDoc.title}"` : "Select a document"}
          </p>
        </div>
      </div>

      {/* Document Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDocId(doc.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedDocId === doc.id
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            <FileText className="h-4 w-4" />
            {doc.title.length > 25 ? doc.title.slice(0, 25) + "..." : doc.title}
          </button>
        ))}
      </div>

      {/* Summary Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SUMMARY_TYPES.map((type) => {
          const Icon = type.icon;
          const existing = currentSummaries.find((s) => s.type === type.id);
          return (
            <button
              key={type.id}
              onClick={() => {
                if (!existing) generateSummary(type.id);
              }}
              disabled={generating}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeType === type.id && existing
                  ? "bg-white text-black shadow-lg"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10 disabled:opacity-50"
              }`}
            >
              <Icon className={`h-4 w-4 ${activeType === type.id && existing ? "text-black" : ""}`} />
              {type.label}
              {generating && !existing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : !existing ? (
                <Sparkles className="h-3 w-3 opacity-60" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeSummary ? (
            <motion.div
              key={activeType}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/5 border-white/10 shadow-2xl">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    {(() => {
                      const activeMeta = SUMMARY_TYPES.find((t) => t.id === activeType)!;
                      const Icon = activeMeta.icon;
                      return (
                        <>
                          <div className="p-2.5 rounded-lg bg-primary/20 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-white">{activeMeta.label} Summary</h2>
                            <p className="text-xs text-muted-foreground">{activeMeta.desc}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed prose-strong:text-white prose-li:text-zinc-300">
                    {activeSummary.content.split('\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('- **')) {
                        const match = paragraph.match(/- \*\*(.*?)\*\*(.*)/);
                        if (match) {
                          return (
                            <li key={idx} className="ml-4 list-disc mb-2">
                              <strong className="text-white">{match[1]}</strong>{match[2]}
                            </li>
                          );
                        }
                      }
                      if (paragraph.startsWith('Background:') || paragraph.startsWith('Findings:') || paragraph.startsWith('Recommendations:')) {
                        const [strong, ...rest] = paragraph.split(': ');
                        return <p key={idx}><strong className="text-white">{strong}:</strong> {rest.join(': ')}</p>;
                      }
                      if (paragraph.trim() === '') return <br key={idx} />;
                      return <p key={idx} className="mb-4">{paragraph}</p>;
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">No summaries yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click a summary type above to generate one</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
