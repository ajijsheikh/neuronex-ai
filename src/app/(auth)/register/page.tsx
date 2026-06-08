"use client";

import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Brain } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 font-semibold mb-8">
          <Brain className="h-5 w-5 text-primary" />
          <span className="text-sm">NEURONEX</span>
        </Link>
        <AuthForm mode="register" />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
