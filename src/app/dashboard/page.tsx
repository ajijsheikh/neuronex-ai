"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Share2, MessageCircle, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ documentCount: 0, entityCount: 0 });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/graph/data", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats({ documentCount: data.documentCount || 0, entityCount: data.entities?.length || 0 });
        }
      } catch {} finally {
        setFetching(false);
      }
    })();
  }, [user]);

  const statCards = [
    { label: "Documents", value: stats.documentCount, icon: FileText, href: "/dashboard/upload" },
    { label: "Entities", value: stats.entityCount, icon: Share2, href: "/dashboard/graph" },
    { label: "AI Queries", value: "—", icon: MessageCircle, href: "/dashboard/chat" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening in your knowledge base.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="card-hover cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {fetching ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : s.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No documents yet</p>
              <p className="text-xs text-muted-foreground/60 mb-4">Upload your first document to get started</p>
              <Button size="sm" className="text-xs" render={<Link href="/dashboard/upload" />}>
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No suggestions yet</p>
              <p className="text-xs text-muted-foreground/60 mb-4">Insights will appear as you add more documents</p>
              <Button variant="outline" size="sm" className="text-xs gap-1" render={<Link href="/dashboard/chat" />}>
                Open AI Chat <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
