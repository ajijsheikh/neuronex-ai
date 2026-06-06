# State Management Strategy

---

## 1. Architecture Overview

Three layers of state, each chosen for its specific role:

| Layer | Tool | Scope | Persistence |
|---|---|---|---|
| **Server State** | TanStack Query (React Query) | Data from API (documents, graph, entities) | In-memory cache + stale-while-revalidate |
| **Client UI State** | Zustand | Graph interaction (selected node, filter, viewport), UI toggles | In-memory only |
| **Auth State** | React Context (firebase/auth) | Firebase `User` object, loading state, `getIdToken()` | Auth state listener persists across navigation |

---

## 2. Server State: TanStack Query

### 2.1 Query Key Structure

```typescript
// src/config/query-keys.ts
export const queryKeys = {
  documents: {
    all: ["documents"] as const,
    list: (filters: DocumentFilters) => ["documents", "list", filters] as const,
    detail: (id: string) => ["documents", id] as const,
    chunks: (id: string) => ["documents", id, "chunks"] as const,
  },
  graph: {
    all: ["graph"] as const,
    data: (filters: GraphFilters) => ["graph", "data", filters] as const,
  },
  entities: {
    detail: (id: string) => ["entities", id] as const,
    relations: (id: string) => ["entities", id, "relations"] as const,
  },
} as const;
```

### 2.2 Query Hooks

```typescript
// src/hooks/use-graph.ts
export function useGraph(filters?: GraphFilters) {
  return useQuery({
    queryKey: queryKeys.graph.data(filters ?? defaultFilters),
    queryFn: () => fetchGraphData(filters),
    staleTime: 30_000,          // 30s before refetch
    gcTime: 5 * 60_000,         // keep in cache 5 min
  });
}

// src/hooks/use-documents.ts
export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents.list({}),
    queryFn: fetchDocuments,
    staleTime: 10_000,
  });
}

// src/hooks/use-entity.ts
export function useEntity(id: string | null) {
  return useQuery({
    queryKey: queryKeys.entities.detail(id!),
    queryFn: () => fetchEntity(id!),
    enabled: !!id,              // Don't fetch until node is selected
  });
}
```

### 2.3 Mutation Hooks

```typescript
// src/hooks/use-upload.ts
export function useUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAndIngest,
    onSuccess: () => {
      // Invalidate both graph and document queries after ingestion
      queryClient.invalidateQueries({ queryKey: queryKeys.graph.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}
```

### 2.4 Invalidation Strategy

| Event | Invalidate |
|---|---|
| Document uploaded & processed | `["documents"]`, `["graph"]` |
| Document deleted | `["documents"]`, `["graph"]`, `["entities"]` |
| Entity node clicked | `["entities", id]` (fetch on demand) |
| Chat message sent | No cache invalidation (chat is not cached) |

---

## 3. Client UI State: Zustand

### 3.1 Graph Store (`src/stores/graph-store.ts`)

```typescript
import { create } from "zustand";

interface GraphState {
  // Selection
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Filters
  entityTypeFilter: string[];        // ["Person", "Concept", ...] — empty = all
  setEntityTypeFilter: (types: string[]) => void;
  minConnections: number;            // minimum edge count to render
  setMinConnections: (n: number) => void;

  // Viewport
  viewport: { x: number; y: number; zoom: number };
  setViewport: (vp: { x: number; y: number; zoom: number }) => void;

  // Layout
  layoutEngine: "dagre" | "d3-force" | "elkjs";
  setLayoutEngine: (engine: "dagre" | "d3-force" | "elkjs") => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  entityTypeFilter: [],
  setEntityTypeFilter: (types) => set({ entityTypeFilter: types }),

  minConnections: 0,
  setMinConnections: (n) => set({ minConnections: n }),

  viewport: { x: 0, y: 0, zoom: 1 },
  setViewport: (vp) => set({ viewport: vp }),

  layoutEngine: "d3-force",
  setLayoutEngine: (engine) => set({ layoutEngine: engine }),
}));
```

### 3.2 Chat Store (`src/stores/chat-store.ts`)

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  appendToLastMessage: (chunk: string) => void;
  setCitations: (citations: Citation[]) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      return { messages: msgs };
    }),
  appendToLastMessage: (chunk) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
      return { messages: msgs };
    }),
  setCitations: (citations) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, citations };
      return { messages: msgs };
    }),
  clearChat: () => set({ messages: [] }),
}));
```

### 3.3 UI Store (`src/stores/ui-store.ts`)

```typescript
interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightSidebarPanel: "chat" | "entity" | "none";
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarPanel: (panel: "chat" | "entity" | "none") => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  rightSidebarPanel: "chat",
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  setRightSidebarPanel: (panel) => set({ rightSidebarPanel: panel, rightSidebarOpen: true }),
}));
```

---

## 4. Auth State: React Context

```typescript
// src/providers/auth-provider.tsx

interface AuthContextValue {
  user: User | null;              // Firebase User object
  isLoading: boolean;             // True while Firebase initializes auth state
  getIdToken: () => Promise<string>;  // Get fresh JWT for API calls
  signOut: () => Promise<void>;
}

// Provider wraps root layout:
//   1. Calls onAuthStateChanged(auth, handleUserChanged)
//   2. On login: syncs user to PostgreSQL via POST /api/auth/sync
//   3. On logout: clears TanStack Query cache
//   4. Exposes getIdToken() for use in API request interceptors

// Usage in API calls:
const { getIdToken } = useAuth();
const token = await getIdToken();
const res = await fetch("/api/graph", {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 5. Data Flow Diagram

```
Firebase Auth
    │ onAuthStateChanged
    ▼
AuthProvider (React Context)
    │ user, getIdToken, isLoading
    ▼
┌────────────────────────────────────────────────────┐
│                  Components                         │
│                                                     │
│  GraphViewer ──useGraph()─────► TanStack Query ──► API │
│  DocumentList ─useDocuments()─► TanStack Query ──► API │
│  Dropzone ────useUpload()────► TanStack Mutation ► API │
│  ChatWindow ──useChat()──────► Zustand (local) ───► API │
│                                                     │
│  GraphViewer ──useGraphStore()──► selectedNodeId     │
│  GraphFilters ─useGraphStore()──► filters             │
│  NodeSidebar ──useEntity()─────► TanStack Query     │
│                                                     │
│  Sidebars ────useUIStore()────► sidebar visibility   │
└────────────────────────────────────────────────────┘
```

## 6. State Persistence Notes

- **No localStorage persistence for MVP.** On page reload, TanStack Query refetches; Zustand state resets (this is acceptable — the graph re-renders from API data).
- **Future:** Persist chat history to PostgreSQL (`chats` table) for long-term conversation memory.
- **Future:** Persist graph viewport position to DB per-user session.
