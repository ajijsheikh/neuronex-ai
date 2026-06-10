"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_QUIZ_QUESTIONS } from "@/lib/mock-data";
import { Brain, Timer, CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function QuizSimulatorPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = MOCK_QUIZ_QUESTIONS[currentIndex];
  const progress = ((currentIndex) / MOCK_QUIZ_QUESTIONS.length) * 100;

  const handleSelect = (option: string) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(option);
  };

  const handleCheck = () => {
    if (!selectedAnswer) return;
    setIsAnswerRevealed(true);
    if (selectedAnswer === question.correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < MOCK_QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex(c => c + 1);
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

  if (isFinished) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center p-6 bg-zinc-950">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <Card className="bg-white/5 border-white/10 text-center py-8">
            <CardContent className="space-y-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 border-4 border-primary/30">
                <span className="text-4xl font-bold text-primary">{Math.round((score / MOCK_QUIZ_QUESTIONS.length) * 100)}%</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Quiz Completed!</h2>
              <p className="text-muted-foreground">You correctly answered {score} out of {MOCK_QUIZ_QUESTIONS.length} questions.</p>
              <Button onClick={handleRestart} className="w-full mt-4 bg-primary text-white hover:bg-primary/90">
                <RotateCcw className="mr-2 h-4 w-4" /> Try Again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header & Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AI Quiz Simulator</h1>
              <p className="text-xs text-muted-foreground">Deep Learning Fundamentals</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <Timer className="h-4 w-4 text-muted-foreground" /> 12:45
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Question {currentIndex + 1} of {MOCK_QUIZ_QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-violet-400" />
        </div>
      </div>

      {/* Question Card */}
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
                  <span className="text-xs text-muted-foreground">{question.conceptTag}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                  {question.question}
                </h2>
              </div>

              <div className="p-6 md:p-8 bg-black/20">
                {question.options && (
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
                          className={\`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between \${optionClass}\`}
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

      {/* Action Footer */}
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
            {currentIndex === MOCK_QUIZ_QUESTIONS.length - 1 ? "Finish Quiz" : "Next Question"} 
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>
    </div>
  );
}
