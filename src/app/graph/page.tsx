"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { GraphViewer } from "@/components/GraphViewer";
import { ChatWindow } from "@/components/ChatWindow";
import { Button } from "@/components/ui/button";
import { MessageCircle, Share2, X } from "lucide-react";

export default function GraphPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex relative">
        <div className="flex-1">
          <GraphViewer />
        </div>

        {chatOpen && (
          <div className="w-96 border-l border-border flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-medium text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                AI Assistant
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setChatOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <ChatWindow />
            </div>
          </div>
        )}

        {!chatOpen && (
          <Button
            className="absolute bottom-6 right-6 shadow-lg"
            onClick={() => setChatOpen(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            AI Chat
          </Button>
        )}
      </div>
    </div>
  );
}
