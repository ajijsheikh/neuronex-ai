"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Timer, CheckCircle2, XCircle, ArrowRight, RotateCcw, Loader2, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  conceptTag: string | null;
}

interface QuizSummary {
  id: string;
  title: string;
  difficulty: string;
  questionCount: number;
  document: { title: string } | null;
  _count: { questions: number; attempts: number };
}

export default function QuizSimulatorPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [, setActiveQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/quiz", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load quizzes");
        const data = await res.json();
        if (!cancelled) setQuizzes(data.quizzes || []);
      } catch {
        if (!cancelled) setError("Failed to load quizzes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const startQuiz = async (quizId: string) => {
    if (!user) return;
    setActiveQuizId(quizId);
    setTakingQuiz(true);
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quizId }),
      });
      if (!res.ok) throw new Error("Failed to load quiz");
      const data = await res.json();
      setQuestions(data.quiz.questions || []);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setScore(0);
      setIsFinished(false);
    } catch {
      toast.error("Failed to load quiz");
      setActiveQuizId(null);
      setTakingQuiz(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(option);
  };

  const handleCheck = () => {
    if (!selectedAnswer) return;
    setIsAnswerRevealed(true);
    if (selectedAnswer === questions[currentIndex].correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((c) => c + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setScore(0);
    setIsFinished(false);
  };

  const handleBackToList = () => {
    setActiveQuizId(null);
    setTakingQuiz(false);
    setCurrentIndex(0);
    setIsFinished(false);
    window.location.reload();
  };

  if (loading && !takingQuiz && quizzes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && quizzes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-4">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    );
  }

  if (!takingQuiz && quizzes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-zinc-950 gap-3">
        <Brain className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No quizzes yet</p>
        <p className="text-xs text-muted-foreground/60">Upload a document to generate a quiz</p>
      </div>
    );
  }

  if (isFinished) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center p-6 bg-zinc-950">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <Card className="bg-white/5 border-white/10 text-center py-8">
            <CardContent className="space-y-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 border-4 border-primary/30">
                <span className="text-4xl font-bold text-primary">{percentage}%</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Quiz Completed!</h2>
              <p className="text-muted-foreground">You correctly answered {score} out of {questions.length} questions.</p>
              <div className="flex gap-3">
                <Button onClick={handleRestart} className="flex-1 bg-primary text-white hover:bg-primary/90">
                  <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                </Button>
                <Button onClick={handleBackToList} variant="outline" className="flex-1 border-white/10">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (takingQuiz && loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (takingQuiz && questions.length > 0) {
    const question = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Brain className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">AI Quiz Simulator</h1>
                <p className="text-xs text-muted-foreground">{questions.length} questions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <Timer className="h-4 w-4 text-muted-foreground" /> {questions.length - currentIndex} left
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10 [&>div>div]:bg-violet-400" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 md:p-8 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white rounded">
                      {question.difficulty}
                    </span>
                    {question.conceptTag && (
                      <span className="text-xs text-muted-foreground">{question.conceptTag}</span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                    {question.question}
                  </h2>
                </div>

                <div className="p-6 md:p-8 bg-black/20">
                  {question.options ? (
                    <div className="space-y-3">
                      {question.options.map((option, idx) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrect = option === question.correctAnswer;

                        let optionClass = "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20";
                        let OptionIcon = null;

                        if (isAnswerRevealed) {
                          if (isCorrect) {
                            optionClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
                            OptionIcon = CheckCircle2;
                          } else if (isSelected) {
                            optionClass = "bg-red-500/10 border-red-500/50 text-red-400";
                            OptionIcon = XCircle;
                          } else {
                            optionClass = "bg-white/5 border-white/10 text-zinc-500 opacity-50";
                          }
                        } else if (isSelected) {
                          optionClass = "bg-violet-500/20 border-violet-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelect(option)}
                            disabled={isAnswerRevealed}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${optionClass}`}
                          >
                            <div className="flex items-center gap-4">
                              <span className="flex items-center justify-center h-6 w-6 rounded bg-black/30 text-xs font-mono opacity-70">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="font-medium">{option}</span>
                            </div>
                            {OptionIcon && <OptionIcon className="h-5 w-5" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={selectedAnswer || ""}
                        onChange={(e) => handleSelect(e.target.value)}
                        disabled={isAnswerRevealed}
                        placeholder="Type your answer..."
                        className="w-full p-4 rounded-xl border bg-white/5 border-white/10 text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all duration-200 disabled:opacity-50"
                      />
                    </div>
                  )}

                  <AnimatePresence>
                    {isAnswerRevealed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                        className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200 leading-relaxed"
                      >
                        <strong className="text-blue-400 block mb-1">Explanation:</strong>
                        {question.explanation}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end">
          {!isAnswerRevealed ? (
            <Button
              onClick={handleCheck}
              disabled={!selectedAnswer}
              size="lg"
              className="bg-white text-black hover:bg-zinc-200 px-8"
            >
              Check Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-violet-500 text-white hover:bg-violet-600 px-8 group"
            >
              {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
          <Brain className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Quiz Library</h1>
          <p className="text-xs text-muted-foreground">Select a quiz to start</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz) => (
          <motion.div key={quiz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => startQuiz(quiz.id)} className="w-full text-left">
              <Card className="bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/[0.07] transition-all cursor-pointer h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-white mb-2 truncate">{quiz.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <span className="px-2 py-0.5 rounded bg-white/10 capitalize">{quiz.difficulty}</span>
                    <span>{quiz._count.questions} questions</span>
                    <span>{quiz._count.attempts} attempts</span>
                  </div>
                  <Button size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                    <Sparkles className="mr-2 h-3.5 w-3.5" /> Start Quiz
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
