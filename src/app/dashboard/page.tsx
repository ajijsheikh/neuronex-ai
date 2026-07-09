"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Target, ArrowRight, Activity, Sparkles, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Note {
  id: string;
  title: string;
  level: string;
  createdAt: string;
  document: { title: string };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const [notesRes, docsRes] = await Promise.all([
          fetch("/api/study-notes", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/documents", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!notesRes.ok || !docsRes.ok) throw new Error("Failed to load data");
        const notesData = await notesRes.json();
        const docsData = await docsRes.json();
        if (!cancelled) {
          setNotes(notesData.studyNotes?.slice(0, 2) || []);
          setDocumentCount(docsData.documents?.length || 0);
        }
      } catch {
        if (!cancelled) setError("Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const displayName = user?.displayName || "Learner";

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRetry} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {displayName}
          </h1>
          <p className="text-muted-foreground mt-1">
            You have <span className="text-primary font-medium">{documentCount} document{documentCount !== 1 ? "s" : ""}</span> in your knowledge base.
          </p>
        </div>
      </motion.div>

      {/* Main Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white/5 border-white/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{documentCount}</span>
                <span className="text-sm text-muted-foreground">total uploaded</span>
              </div>
              <Progress value={Math.min(documentCount * 10, 100)} className="h-1.5 mt-4 bg-white/10 [&>div>div]:bg-emerald-400" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-400" /> Study Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-white mb-1">{notes.length} Recent Notes</p>
              <Link href="/dashboard/study-notes">
                <Button size="sm" variant="secondary" className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white border-0">
                  View All Notes <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/90 leading-relaxed">
                Upload a document to generate study notes, summaries, quizzes, and flashcards powered by AI.
              </p>
              <Link href="/dashboard/upload">
                <Button size="sm" variant="secondary" className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border-0">
                  Upload Document <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      {notes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Study Notes</h2>
            <Link href="/dashboard/study-notes" className="text-muted-foreground hover:text-white text-sm font-medium">View All</Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
              >
                <Link href={`/dashboard/study-notes?id=${note.id}`}>
                  <Card className="bg-white/5 border-white/10 card-hover cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 rounded-md bg-white/5">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                          {note.level}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{note.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Brain className="h-3 w-3" /> {note.document.title}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {notes.length === 0 && documentCount > 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No study notes yet. Upload a document and generate notes from it.</p>
        </div>
      )}
    </div>
  );
}
