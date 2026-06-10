"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_NOTES, MOCK_SUMMARIES } from "@/lib/mock-data";
import { FileText, Clock, Brain, Target, BookOpen, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type SummaryType = keyof typeof MOCK_SUMMARIES;

const SUMMARY_TYPES: { id: SummaryType; label: string; icon: any; desc: string }[] = [
  { id: "30sec", label: "30-Second", icon: Clock, desc: "The core thesis in 2 sentences" },
  { id: "2min", label: "2-Minute", icon: FileText, desc: "Brief overview of main ideas" },
  { id: "5min", label: "5-Minute", icon: BookOpen, desc: "Detailed summary of all major topics" },
  { id: "executive", label: "Executive", icon: Target, desc: "Professional background and findings" },
  { id: "exam", label: "Exam-Night", icon: Brain, desc: "Critical facts and formulas only" },
];

export default function SummariesPage() {
  const [activeType, setActiveType] = useState<SummaryType>("2min");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <Layers className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart Summaries</h1>
          <p className="text-sm text-muted-foreground">Viewing summaries for "{MOCK_NOTES[0].title}"</p>
        </div>
      </div>

      {/* Tabs / Filter Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SUMMARY_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = activeType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap \${
                isActive 
                  ? "bg-white text-black shadow-lg" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10"
              }\`}
            >
              <Icon className={\`h-4 w-4 \${isActive ? "text-black" : ""}\`} />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Card className="bg-white/5 border-white/10 shadow-2xl h-full">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                  {(() => {
                    const activeMeta = SUMMARY_TYPES.find(t => t.id === activeType)!;
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
                  {MOCK_SUMMARIES[activeType].split('\\n').map((paragraph, idx) => {
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
                      const [strong, rest] = paragraph.split(': ');
                      return <p key={idx}><strong className="text-white">{strong}:</strong> {rest}</p>;
                    }
                    if (paragraph.trim() === '') return <br key={idx} />;
                    return <p key={idx} className="mb-4">{paragraph}</p>;
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
