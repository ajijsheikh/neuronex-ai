"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Share2,
  MessageCircle,
  Settings,
  Brain,
  LogOut,
  Search,
  User,
  ChevronRight,
  Loader2,
  BookOpen,
  FileText,
  Layers,
  Network,
  Activity,
  AlertTriangle,
  Map,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/study-notes", label: "Study Notes", icon: BookOpen },
  { href: "/dashboard/summaries", label: "Summaries", icon: FileText },
  { href: "/dashboard/quiz", label: "Quiz Simulator", icon: Brain },
  { href: "/dashboard/flashcards", label: "Flashcards", icon: Layers },
  { href: "/dashboard/graph", label: "Knowledge Graph", icon: Share2 },
  { href: "/dashboard/mindmap", label: "Mind Map", icon: Network },
  { href: "/dashboard/tutor", label: "AI Tutor", icon: MessageCircle },
  { href: "/dashboard/health", label: "Knowledge Health", icon: Activity },
  { href: "/dashboard/gaps", label: "Gap Detection", icon: AlertTriangle },
  { href: "/dashboard/path", label: "Learning Path", icon: Map },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-sidebar-border bg-sidebar shrink-0">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <Brain className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm text-white">NEURONEX</span>
      </div>
      <div className="flex-1 p-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, status, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen overflow-hidden">
        <SidebarSkeleton />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background/80" />
          <main className="flex-1 p-6">
            <div className="space-y-4 max-w-4xl mx-auto">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
              <div className="grid sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Brain className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  if (status === "error" || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <LogOut className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-sm font-medium">Authentication Error</p>
          <p className="text-xs text-muted-foreground">Unable to authenticate. Please try signing in again.</p>
          <Button size="sm" className="text-xs" onClick={() => router.push("/login")}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  const currentPage = navItems.find((item) => pathname === item.href);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex flex-col w-56 border-r border-sidebar-border bg-sidebar shrink-0">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-white">NEURONEX</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link relative ${isActive ? "active" : ""}`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.email}</p>
            </div>
            <button onClick={signOut} className="text-sidebar-foreground hover:text-white transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            {currentPage && currentPage.label !== "Dashboard" && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground">{currentPage.label}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8 h-8 w-48 text-xs bg-muted border-none rounded-lg" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />}>
                <User className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2 text-xs" disabled>
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={signOut}>
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative bg-zinc-950 text-zinc-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex items-center justify-around h-14 px-2">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
