"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Brain, Clock, Target, ArrowRight, Activity, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { MOCK_USER, MOCK_NOTES } from "@/lib/mock-data";

export default function DashboardPage() {
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
            Welcome back, {MOCK_USER.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            You're currently a <span className="text-primary font-medium">{MOCK_USER.level}</span>. Let's keep learning.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <Flame className="h-4 w-4" />
            <span className="font-semibold text-sm">{MOCK_USER.streak} Day Streak</span>
          </div>
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
                <Activity className="h-4 w-4 text-emerald-400" /> Knowledge Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{MOCK_USER.healthScore}</span>
                <span className="text-sm text-emerald-400">+2 from last week</span>
              </div>
              <Progress value={MOCK_USER.healthScore} className="h-1.5 mt-4 bg-white/10" indicatorClassName="bg-emerald-400" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-400" /> Today's Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-white mb-1">Review 15 Flashcards</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <span>10 completed</span>
                <span>5 remaining</span>
              </div>
              <Progress value={66} className="h-1.5 bg-white/10" indicatorClassName="bg-violet-400" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Daily AI Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/90 leading-relaxed">
                Your retention in <span className="font-semibold text-primary">System Design</span> is dropping. I recommend taking a quick 5-minute quiz to reinforce those concepts.
              </p>
              <Button size="sm" variant="secondary" className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border-0">
                Generate Quiz <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Study Notes</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white" asChild>
            <Link href="/dashboard/study-notes">View All</Link>
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {MOCK_NOTES.slice(0, 2).map((note, i) => (
            <motion.div 
              key={note.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
            >
              <Link href={`/dashboard/study-notes?id=\${note.id}`}>
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
                      <span className="flex items-center gap-1"><Brain className="h-3 w-3" /> {note.documentName}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {note.updatedAt}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
