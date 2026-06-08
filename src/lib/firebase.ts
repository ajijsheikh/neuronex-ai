import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseConfig } from "./firebase-config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;
let initError: Error | null = null;

function initialize(): boolean {
  if (app) return true;
  if (initError) return false;

  const config = getFirebaseConfig();
  if (!config) {
    initError = new Error("Firebase configuration is missing");
    if (process.env.NODE_ENV === "development") {
      console.error("[NEURONEX] Firebase initialization skipped: missing config");
    }
    return false;
  }

  try {
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    auth = getAuth(app);
    storage = getStorage(app);
    if (process.env.NODE_ENV === "development") {
      console.log("[NEURONEX] Firebase initialized successfully");
    }
    return true;
  } catch (err) {
    initError = err instanceof Error ? err : new Error("Failed to initialize Firebase");
    if (process.env.NODE_ENV === "development") {
      console.error("[NEURONEX] Firebase initialization error:", initError);
    }
    return false;
  }
}

export function getFirebaseApp(): FirebaseApp | undefined {
  initialize();
  return app;
}

export function getFirebaseAuth(): Auth | undefined {
  initialize();
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage | undefined {
  initialize();
  return storage;
}

export function getFirebaseInitError(): Error | null {
  return initError;
}

export function resetFirebase(): void {
  app = undefined;
  auth = undefined;
  storage = undefined;
  initError = null;
}
