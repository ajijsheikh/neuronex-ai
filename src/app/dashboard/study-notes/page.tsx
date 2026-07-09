"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, FileText, Download, Share, Brain, BookOpen, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  level: string;
  createdAt: string;
  document: { title: string };
}

export default function StudyNotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
        const res = await fetch("/api/study-notes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load study notes");
        const data = await res.json();
        if (!cancelled) {
          const fetchedNotes = data.studyNotes || [];
          setNotes(fetchedNotes);
          if (fetchedNotes.length > 0 && !activeNote) {
            setActiveNote(fetchedNotes[0]);
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load study notes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.document.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateQuiz = async () => {
    if (!user || !activeNote) return;
    toast.info("Quiz generation coming soon");
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-4">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-3">
        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No study notes yet</p>
        <p className="text-xs text-muted-foreground/60">Upload a document to generate study notes</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-zinc-950 overflow-hidden">
      <div className="w-80 border-r border-white/10 flex flex-col bg-zinc-950/50">
        <div className="p-4 border-b border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Study Notes</h2>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-9 bg-white/5 border-white/10 text-sm h-9 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No matching notes</p>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNote(note)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeNote?.id === note.id
                    ? "bg-primary/10 text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <h3 className="font-medium text-sm truncate mb-1">{note.title}</h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 opacity-80">
                    <BookOpen className="h-3 w-3" /> {note.level}
                  </span>
                  <span className="opacity-50">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground">
              {activeNote?.level} Level
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Source: {activeNote?.document.title}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8 gap-2 text-muted-foreground hover:text-white" onClick={handleGenerateQuiz}>
              <Brain className="h-4 w-4" /> Generate Quiz
            </Button>
            <Button size="sm" variant="ghost" className="h-8 gap-2 text-muted-foreground hover:text-white">
              <Share className="h-4 w-4" /> Share
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-2 border-white/10 bg-transparent text-white hover:bg-white/5">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:px-24">
          <AnimatePresence mode="wait">
            {activeNote && (
              <motion.div
                key={activeNote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto"
              >
                <h1 className="text-4xl font-bold text-white tracking-tight mb-8">
                  {activeNote.title}
                </h1>

                <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-white">
                  {activeNote.content.split('\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('# ')) return null;
                    if (paragraph.startsWith('## ')) return <h2 key={idx}>{paragraph.replace('## ', '')}</h2>;
                    if (paragraph.startsWith('### ')) return <h3 key={idx}>{paragraph.replace('### ', '')}</h3>;
                    if (paragraph.startsWith('- **')) {
                      const match = paragraph.match(/- \*\*(.*?)\*\*(.*)/);
                      if (match) {
                        return (
                          <li key={idx} className="ml-4 list-disc">
                            <strong className="text-white">{match[1]}</strong>{match[2]}
                          </li>
                        );
                      }
                    }
                    if (paragraph.startsWith('- ')) return <li key={idx} className="ml-4 list-disc">{paragraph.replace('- ', '')}</li>;
                    if (paragraph.trim() === '') return <br key={idx} />;

                    const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={idx}>
                        {parts.map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
