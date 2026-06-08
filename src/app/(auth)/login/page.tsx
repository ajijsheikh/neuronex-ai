"use client";

import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Brain } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8">
        <Brain className="h-6 w-6 text-primary" />
        NEURONEX
      </Link>
      <AuthForm mode="login" />
      <p className="mt-4 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
