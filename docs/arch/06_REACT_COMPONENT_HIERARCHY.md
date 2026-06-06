# React Component Hierarchy

---

## 1. Component Tree

```
<RootLayout>                              // src/app/layout.tsx
  <ThemeProvider>                          // next-themes
    <AuthProvider>                         // Firebase auth context
      <QueryProvider>                      // TanStack Query
        <Toaster />                        // Shadcn toast notifications
        {children}                         // Page content
      </QueryProvider>
    </AuthProvider>
  </ThemeProvider>
</RootLayout>
```

### Authenticated Routes (`(dashboard)/layout.tsx`)

```
<DashboardLayout>
  <AuthGuard>                              // Redirects to /login if unauthenticated
    <LeftSidebar>                          // Collapsible, ~250px
      <UserProfile />                      // Avatar + display name + logout
      <Dropzone />                         // react-dropzone wrapper
      <ProcessingQueue />                  // Progress bars for active uploads
      <DocumentList>                       // ScrollArea
        <DocumentItem />                   // Title + status badge + date
        <DocumentItem />
        ...
      </DocumentList>
    </LeftSidebar>

    <main className="flex-1">
      {children}                           // Page-specific content
    </main>

    <RightSidebar>                         // Collapsible Sheet, ~350px
      {/* Context-dependent content — see below */}
    </RightSidebar>
  </AuthGuard>
</DashboardLayout>
```

### Page: `/dashboard`

```
<DashboardPage>
  {/* Main canvas shows graph by default */}
  <GraphViewer />                          // React Flow container
  <GraphToolbar />                         // Floating bottom-center: zoom, fit, toggle
</DashboardPage>

<RightSidebar>   {/* default state: Chat */}
  <ChatWindow>
    <ScrollArea>
      <MessageBubble type="user" />
      <MessageBubble type="assistant">
        <CitationPill />                   // Inline clickable pill
        <CitationPill />
      </MessageBubble>
    </ScrollArea>
    <ChatInput />                          // Fixed bottom
  </ChatWindow>
</RightSidebar>
```

### Page: `/graph` (full-screen explorer)

```
<GraphPage>
  <GraphViewer fullScreen />               // No sidebars, full viewport
  <GraphToolbar />
  <GraphFilters />                         // Slide-in panel: density, type toggles
</GraphPage>
```

### Right Sidebar States

```
<RightSidebar>
  {activePanel === "chat" && (
    <ChatWindow />                         // Default state
  )}
  {activePanel === "entity" && (
    <NodeSidebar>                          // Triggered by node click
      <EntityHeader />                     // Name + Type badge
      <EntitySummary />                    // AI-generated description
      <RelatedDocuments>                   // List of document links
        <DocumentItem />
      </RelatedDocuments>
      <RelatedEntities>                    // 1-hop neighbors list
        <RelatedEntityChip />
      </RelatedEntities>
    </NodeSidebar>
  )}
</RightSidebar>
```

---

## 2. Component Specifications

### 2.1 Graph Components

| Component | File | Description |
|---|---|---|
| `GraphViewer` | `graph-viewer.tsx` | Wraps `<ReactFlow>` with custom node/edge types, handles `onNodeClick`, `onPaneClick`, layout. Manages viewport via `useReactFlow()`. |
| `CustomNode` | `custom-node.tsx` | Shadcn `Badge`-styled pill. Color-coded by entity type (Person=blue, Concept=green, Tech=purple). Uses `Handle` for connection points. |
| `CustomEdge` | `custom-edge.tsx` | Styled bezier edge with `EdgeLabelRenderer` for relationship type label. Animated by default. |
| `GraphToolbar` | `graph-toolbar.tsx` | Floating bar: zoom in/out, fit view, lock/unlock drag, 2D/3D toggle (future). |
| `GraphFilters` | `graph-filters.tsx` | Sheet panel: `Slider` for min connections filter, `Checkbox` group for entity type visibility. |
| `NodeSidebar` | `node-sidebar.tsx` | Shadcn `Sheet` showing entity detail. Fetches `GET /api/entities/[id]` when opened. |
| `ThreeScene` | `three-scene.tsx` | R3F `<Canvas>` wrapper. Render spheres for nodes, lines for edges. `<OrbitControls>`. (Post-MVP) |

### 2.2 Chat Components

| Component | File | Description |
|---|---|---|
| `ChatWindow` | `chat-window.tsx` | Container with `ScrollArea` and fixed-bottom input. Manages scroll-to-bottom on new message. |
| `MessageBubble` | `message-bubble.tsx` | User on right (blue), AI on left (zinc surface). Streaming state shows `Skeleton` text. |
| `ChatInput` | `chat-input.tsx` | `Textarea` (auto-resize) + send button. Disabled during streaming. Enter to send, Shift+Enter for newline. |
| `CitationPill` | `citation-pill.tsx` | Shadcn `Badge` with hover tooltip showing source doc title. On click, opens `SourcePreview`. |
| `SourcePreview` | `source-preview.tsx` | Shadcn `Dialog` showing the exact retrieved chunk text and page number. |

### 2.3 Document Components

| Component | File | Description |
|---|---|---|
| `Dropzone` | `dropzone.tsx` | `react-dropzone` wrapper. Shows overlay "Drop to feed your brain" on drag. Accepts `.pdf`, `.txt`. Max 10MB. |
| `ProcessingQueue` | `processing-queue.tsx` | List of active/pending uploads with `Progress` bars and status labels (uploading → processing → done). |
| `DocumentList` | `document-list.tsx` | `ScrollArea` with search/filter input at top. Uses TanStack Query to fetch `GET /api/documents`. |
| `DocumentItem` | `document-item.tsx` | Row: title + file type icon + status badge + date. Context menu for delete. |

### 2.4 Shared Components

| Component | File | Description |
|---|---|---|
| `AuthGuard` | `auth-guard.tsx` | Checks `useAuth()`. If not loading and no user, redirect to `/login`. |
| `EmptyState` | `empty-state.tsx` | Illustration + heading + description. Used when graph is empty, no documents, etc. |
| `ErrorBoundary` | `error-boundary.tsx` | React error boundary with fallback UI + retry button. |

---

## 3. Props & Data Flow

```
GraphViewer
├── nodes: Node[]              ← from useGraph() hook (TanStack Query → GET /api/graph)
├── edges: Edge[]              ← from useGraph()
├── onNodeClick: (node) => void  → sets graphStore.selectedNodeId → opens NodeSidebar
└── onPaneClick: () => void      → clears graphStore.selectedNodeId → closes NodeSidebar

ChatWindow
├── onSendMessage: (text) => void  → useChat() hook → POST /api/chat
└── messages: Message[]            ← from useChat() hook (local state + stream)

Dropzone
└── onDrop: (files) => void        → useUpload() hook → Firebase Storage → POST /api/documents/ingest
```

---

## 4. Conditional Rendering Matrix

| State | Graph Area | Right Sidebar |
|---|---|---|
| **Loading** | `Skeleton` graph placeholder | Chat `Skeleton` |
| **Empty** (no documents) | `EmptyState`: "Upload your first document" | `EmptyState`: "Ask something" (disabled) |
| **Normal** (graph + chat) | Force-directed graph | Chat interface |
| **Node selected** | Highlighted node + faded others | Node detail panel |
| **Streaming** | — | Streaming message with citation pills appearing |
| **Error** | Error toast + retry button | Error message in chat |
