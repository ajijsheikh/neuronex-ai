"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/firebase-config";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  loading: boolean;
  signOut: () => Promise<void>;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  status: "loading",
  loading: true,
  signOut: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setStatus("unauthenticated");
      setUser(null);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus("error");
      setError(new Error("Failed to initialize Firebase Auth"));
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setStatus("authenticated");
        } else {
          setUser(null);
          setStatus("unauthenticated");
        }
        setError(null);
      },
      (err) => {
        console.error("[NEURONEX] Auth state error:", err);
        setError(err);
        setStatus("error");
      }
    );

    return unsubscribe;
  }, []);

  const signOut = async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      await firebaseSignOut(auth);
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  return (
    <AuthContext.Provider value={{ user, status, loading: status === "loading", signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
