"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ThumbsUp, ThumbsDown, Check, X, GraduationCap, Loader2, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Deck {
  id: string;
  name: string;
  stats: { total: number; due: number; learning: number; new: number; mastered: number };
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  conceptTag: string | null;
  status: string;
  isDue: boolean;
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [, setSelectedDeckId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/flashcards/decks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load decks");
        const data = await res.json();
        if (!cancelled) setDecks(data.decks || []);
      } catch {
        if (!cancelled) setError("Failed to load flashcard decks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const selectDeck = async (deckId: string) => {
    if (!user) return;
    setSelectedDeckId(deckId);
    setReviewing(true);
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/flashcards/decks/${deckId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load deck");
      const data = await res.json();
      setFlashcards(data.flashcards || []);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
    } catch {
      toast.error("Failed to load deck");
      setSelectedDeckId(null);
      setReviewing(false);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (rating: number) => {
    if (!user || !flashcards[currentIndex]) return;
    const card = flashcards[currentIndex];
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) throw new Error("Failed to save review");
    } catch {
      toast.error("Failed to save review");
    }
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((c) => c + 1), 150);
    } else {
      setIsFinished(true);
    }
  };

  const handleBackToDecks = () => {
    setSelectedDeckId(null);
    setReviewing(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    window.location.reload();
  };

  if (loading && !reviewing) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && decks.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-4">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    );
  }

  if (!reviewing && decks.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-3">
        <Layers className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No flashcard decks yet</p>
        <p className="text-xs text-muted-foreground/60">Upload a document to generate flashcards</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center p-6 bg-zinc-950">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <Card className="bg-white/5 border-white/10 text-center py-8">
            <CardContent className="space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30">
                <GraduationCap className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Deck Completed!</h2>
              <p className="text-muted-foreground">You reviewed {flashcards.length} cards. The SRS algorithm has scheduled your next reviews.</p>
              <Button onClick={handleBackToDecks} className="w-full mt-4 bg-white text-black hover:bg-zinc-200">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Decks
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (reviewing && loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reviewing && !loading && flashcards.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-3">
        <GraduationCap className="h-10 w-10 text-emerald-400" />
        <p className="text-sm font-medium text-white">All cards reviewed!</p>
        <Button onClick={handleBackToDecks} variant="outline">Back to Decks</Button>
      </div>
    );
  }

  if (reviewing) {
    const card = flashcards[currentIndex];
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Layers className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Reviewing</h1>
              <p className="text-xs text-muted-foreground">{flashcards.length - currentIndex} cards left</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBackToDecks} className="text-muted-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl aspect-[3/2] relative cursor-pointer"
              onClick={() => !isFlipped && setIsFlipped(true)}
            >
              <motion.div
                initial={false}
                animate={{ rotateX: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d"
              >
                <Card className="absolute inset-0 backface-hidden bg-white/5 border-white/10 hover:border-white/20 transition-colors shadow-2xl flex flex-col">
                  <CardContent className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center">
                    <span className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Front</span>
                    <span className="absolute top-6 right-6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white rounded">
                      {card.status}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-medium text-white leading-tight">{card.front}</h2>
                    <p className="absolute bottom-8 text-sm text-muted-foreground animate-pulse">Click to flip</p>
                  </CardContent>
                </Card>

                <Card className="absolute inset-0 backface-hidden bg-white text-black shadow-2xl flex flex-col" style={{ transform: "rotateX(180deg)" }}>
                  <CardContent className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center">
                    <span className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Back</span>
                    <h2 className="text-2xl md:text-3xl font-medium leading-relaxed">{card.back}</h2>
                    {card.conceptTag && (
                      <div className="absolute bottom-6 w-full px-6 flex items-center justify-center gap-4">
                        <span className="px-3 py-1 rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">Tag: {card.conceptTag}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="shrink-0 h-24 flex items-center justify-center mt-8">
          <AnimatePresence>
            {isFlipped ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 w-full max-w-2xl">
                <Button onClick={() => submitRating(0)} variant="outline" className="flex-1 h-14 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:text-red-400">
                  <X className="mr-2 h-5 w-5" /> Again (1m)
                </Button>
                <Button onClick={() => submitRating(1)} variant="outline" className="flex-1 h-14 bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400">
                  <ThumbsDown className="mr-2 h-5 w-5" /> Hard (6m)
                </Button>
                <Button onClick={() => submitRating(2)} variant="outline" className="flex-1 h-14 bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400">
                  <Check className="mr-2 h-5 w-5" /> Good (1d)
                </Button>
                <Button onClick={() => submitRating(3)} variant="outline" className="flex-1 h-14 bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-400">
                  <ThumbsUp className="mr-2 h-5 w-5" /> Easy (4d)
                </Button>
              </motion.div>
            ) : (
              <div className="w-full max-w-2xl text-center text-sm text-muted-foreground">
                Recall the answer, then click the card to flip.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <Layers className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Flashcard Decks</h1>
          <p className="text-xs text-muted-foreground">Select a deck to start reviewing</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => (
          <motion.div key={deck.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => selectDeck(deck.id)} className="w-full text-left">
              <Card className="bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/[0.07] transition-all cursor-pointer h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-white mb-3 truncate">{deck.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="px-2.5 py-1.5 rounded-md bg-white/5 text-muted-foreground">
                      Total <span className="text-white font-medium ml-1">{deck.stats.total}</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-md bg-yellow-500/10 text-yellow-500">
                      Due <span className="font-medium ml-1">{deck.stats.due}</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-md bg-blue-500/10 text-blue-400">
                      Learning <span className="font-medium ml-1">{deck.stats.learning}</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                      Mastered <span className="font-medium ml-1">{deck.stats.mastered}</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border-0">
                    Review Deck
                  </Button>
                </CardContent>
              </Card>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
