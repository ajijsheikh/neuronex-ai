"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_FLASHCARDS } from "@/lib/mock-data";
import { Layers, RotateCcw, ThumbsUp, ThumbsDown, Check, X, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FlashcardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const card = MOCK_FLASHCARDS[currentIndex];

  const handleNext = () => {
    if (currentIndex < MOCK_FLASHCARDS.length - 1) {
      setIsFlipped(false);
      // Wait for flip animation to finish before changing card
      setTimeout(() => setCurrentIndex(c => c + 1), 150);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

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
              <p className="text-muted-foreground">You reviewed {MOCK_FLASHCARDS.length} cards today. The SRS algorithm has scheduled your next reviews.</p>
              <Button onClick={handleRestart} className="w-full mt-4 bg-white text-black hover:bg-zinc-200">
                Return to Decks
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Layers className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Daily Review</h1>
            <p className="text-xs text-muted-foreground">Deep Learning Deck • {MOCK_FLASHCARDS.length - currentIndex} cards left</p>
          </div>
        </div>
      </div>

      {/* 3D Flashcard Container */}
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
              {/* Front side */}
              <Card className="absolute inset-0 backface-hidden bg-white/5 border-white/10 hover:border-white/20 transition-colors shadow-2xl flex flex-col">
                <CardContent className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center">
                  <span className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Front
                  </span>
                  <span className="absolute top-6 right-6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white rounded">
                    {card.status}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-medium text-white leading-tight">
                    {card.front}
                  </h2>
                  <p className="absolute bottom-8 text-sm text-muted-foreground animate-pulse">
                    Click to flip
                  </p>
                </CardContent>
              </Card>

              {/* Back side */}
              <Card 
                className="absolute inset-0 backface-hidden bg-white text-black shadow-2xl flex flex-col"
                style={{ transform: "rotateX(180deg)" }}
              >
                <CardContent className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center">
                  <span className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Back
                  </span>
                  <h2 className="text-2xl md:text-3xl font-medium leading-relaxed">
                    {card.back}
                  </h2>
                  <div className="absolute bottom-6 w-full px-6 flex items-center justify-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
                      Tag: {card.conceptTag}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* SRS Actions */}
      <div className="shrink-0 h-24 flex items-center justify-center mt-8">
        <AnimatePresence>
          {isFlipped ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex items-center gap-3 w-full max-w-2xl"
            >
              <Button onClick={handleNext} variant="outline" className="flex-1 h-14 bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:text-red-400">
                <X className="mr-2 h-5 w-5" /> Again (1m)
              </Button>
              <Button onClick={handleNext} variant="outline" className="flex-1 h-14 bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400">
                <ThumbsDown className="mr-2 h-5 w-5" /> Hard (6m)
              </Button>
              <Button onClick={handleNext} variant="outline" className="flex-1 h-14 bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400">
                <Check className="mr-2 h-5 w-5" /> Good (1d)
              </Button>
              <Button onClick={handleNext} variant="outline" className="flex-1 h-14 bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20 hover:text-blue-400">
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
