let app: import("firebase/app").FirebaseApp | undefined;
let auth: import("firebase/auth").Auth | undefined;
let storage: import("firebase/storage").FirebaseStorage | undefined;

export function getFirebaseApp() {
  if (typeof window === "undefined") return undefined;
  if (!app) {
    const { initializeApp, getApps } = require("firebase/app");
    app = getApps().length === 0
      ? initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        })
      : getApps()[0];
  }
  return app;
}

export function getFirebaseAuth() {
  if (typeof window === "undefined") return undefined;
  if (!auth) {
    const { getAuth } = require("firebase/auth");
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseStorage() {
  if (typeof window === "undefined") return undefined;
  if (!storage) {
    const { getStorage } = require("firebase/storage");
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}
