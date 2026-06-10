"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_NOTES } from "@/lib/mock-data";
import { Search, Plus, FileText, Download, Share, Brain, Settings2, Sparkles, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StudyNotesPage() {
  const [activeNote, setActiveNote] = useState(MOCK_NOTES[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = MOCK_NOTES.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-zinc-950 overflow-hidden">
      {/* Internal Sidebar for Notes List */}
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
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setActiveNote(note)}
              className={\`w-full text-left p-3 rounded-lg transition-colors \${
                activeNote.id === note.id 
                  ? "bg-primary/10 text-white" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }\`}
            >
              <h3 className="font-medium text-sm truncate mb-1">{note.title}</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 opacity-80">
                  <BookOpen className="h-3 w-3" /> {note.level}
                </span>
                <span className="opacity-50">{note.updatedAt}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground">
              {activeNote.level} Level
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Source: {activeNote.documentName}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8 gap-2 text-muted-foreground hover:text-white">
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
              
              {/* Markdown Content Simulation */}
              <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-white">
                {activeNote.content.split('\\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('# ')) return null; // Skip h1 since we already rendered it
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
                  
                  // Handle inline bolding basic regex
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
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
