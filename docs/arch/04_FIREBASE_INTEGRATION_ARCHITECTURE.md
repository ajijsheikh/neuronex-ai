# Firebase Integration Architecture

---

## 1. Services Used

| Service | Purpose | SDK |
|---|---|---|
| **Firebase Auth** | User authentication (Google OAuth, GitHub, Email/Password) | Client SDK (`firebase/auth`) |
| **Firebase Admin Auth** | JWT verification on server | Admin SDK (`firebase-admin/auth`) |
| **Firebase Storage** | Raw file storage (PDFs, TXTs) | Client SDK (`firebase/storage`) |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                         │
│  ┌──────────────┐    ┌──────────────────┐               │
│  │ Firebase Auth │◄───│ AuthProvider      │               │
│  │   (Client)    │    │ (React Context)   │               │
│  └──────┬───────┘    └──────────────────┘               │
│         │ onAuthStateChanged()                          │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ Firebase      │   Upload file → get download URL      │
│  │ Storage       │─────────────────────────────────┐    │
│  └──────┬───────┘                                   │    │
│         │                                           │    │
└─────────┼───────────────────────────────────────────┼────┘
          │ JWT Token (Authorization: Bearer)         │ fileUrl
          ▼                                           ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (Server)                 │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────┐       │
│  │ Firebase Admin    │    │  Auth Middleware      │       │
│  │ Auth (verifyIdToken)│◄───│  verifyJWT(request)   │       │
│  └──────────────────┘    └──────────────────────┘       │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────┐       │
│  │ Firebase Admin    │    │  Storage Service      │       │
│  │ (optional, for    │    │  (download file for   │       │
│  │  server-side ops) │    │   processing)         │       │
│  └──────────────────┘    └──────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Client-Side Initialization

```typescript
// src/lib/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const storage = getStorage(app);
```

## 4. Auth Provider

```typescript
// src/providers/auth-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  getIdToken: () => Promise<string>;
}

// Provider wraps root layout
// onAuthStateChanged subscribes once; on login, syncs user to DB via POST /api/auth/sync
// getIdToken() returns fresh JWT for API calls
```

## 5. Server-Side Auth Middleware

```typescript
// src/lib/auth.ts
import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

export async function authenticate(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid authorization header", 401);
  }
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new AuthError("Invalid or expired token", 401);
  }
}
```

## 6. Firebase Admin SDK

```typescript
// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY!
);

const app = getApps().length === 0
  ? initializeApp({ credential: cert(serviceAccount), storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET })
  : getApps()[0];

export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
```

## 7. Storage Strategy

| Concern | Decision |
|---|---|
| **Upload path** | `users/{userId}/documents/{documentId}/{filename}` |
| **Upload mechanism** | Client-side upload via `firebase/storage` SDK (resumable, gzip) |
| **Access** | Direct download URL (short-lived) passed to server for processing |
| **Security rules** | `request.auth.uid == userId` — strict path isolation |
| **File size limit** | 10 MB (MVP); enforced client-side + Firebase rules |
| **Supported types** | `application/pdf`, `text/plain` |

**Upload flow:**
1. User drops file in `Dropzone`
2. Client generates unique path: `users/{uid}/documents/{uuid}/{originalName}`
3. Client uploads via `uploadBytesResumable()` with progress callback
4. On complete, client gets download URL via `getDownloadURL()`
5. Client calls `POST /api/documents/ingest` with the URL

## 8. Security Rules

```javascript
// Firebase Storage Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 9. Auth Provider Interop with Next.js Middleware

```typescript
// src/middleware.ts (Next.js Edge Middleware)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Client-side middleware: redirect unauthenticated users to /login
// Uses edge-compatible Firebase token check or simply checks for existence of token cookie
// On the client, AuthProvider handles the real session

export function middleware(request: NextRequest) {
  // Protected routes
  if (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/graph")) {
    // Check for Firebase ID token in cookie (set by client after login)
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/graph/:path*", "/documents/:path*"],
};
```

## 10. Environment Variables

See [08_ENVIRONMENT_VARIABLES.md](./08_ENVIRONMENT_VARIABLES.md) for the full list of Firebase-related env vars.
