# Knowledge Graph Engine

## 1. Purpose
The Knowledge Graph Engine is responsible for translating the relational data in PostgreSQL into a visual, interactive network in the frontend using **React Flow** and **React Three Fiber**.

## 2. Graph Construction (Backend to Frontend)

### Data Fetching
The frontend calls `GET /api/graph`. The backend executes:
```sql
-- Conceptual Query
SELECT id, name as label, type FROM entities WHERE user_id = ?;
SELECT source_entity_id as source, target_entity_id as target, relation_type as label FROM relationships WHERE ...
```

### React Flow Data Transformation
React Flow requires arrays of `nodes` and `edges`.
*   **Nodes Array:**
    ```javascript
    const nodes = entities.map(entity => ({
      id: entity.id,
      position: { x: Math.random() * 500, y: Math.random() * 500 }, // Initial random, physics will sort it out
      data: { label: entity.name, type: entity.type },
      type: 'customNode' // Custom Shadcn styled node
    }));
    ```
*   **Edges Array:**
    ```javascript
    const edges = relations.map(rel => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      label: rel.relation_type,
      animated: true // Visual flair
    }));
    ```

## 3. 2D Graph Visualization (React Flow)
*   **Layout Algorithm:** Random positioning is bad. We will use `d3-force` or `elkjs` integrated with React Flow to apply force-directed layouts. This makes related nodes clump together into clusters automatically.
*   **Custom Nodes:** Nodes are styled as pill-shaped badges (using Tailwind). Color-coded by entity `type` (e.g., Blue for Tech, Green for Person).
*   **Interactivity:**
    *   `onNodeClick`: Opens the right-hand Shadcn Sidebar (`NodeSidebar`), fetching related documents for that entity.
    *   `onPaneClick`: Closes the sidebar.
    *   Scroll to zoom, drag to pan.

## 4. 3D Graph Visualization (React Three Fiber) - Experimental
*   **Implementation:** Render a `<canvas>` using `@react-three/fiber`.
*   **Nodes:** Rendered as `<Sphere>` or text sprites (`@react-three/drei` Text).
*   **Edges:** Rendered as `<Line>`.
*   **Physics:** Use `d3-force-3d` to calculate XYZ coordinates for each node.
*   **Controls:** `<OrbitControls>` for rotating, panning, and zooming in 3D space.

## 5. Performance Optimizations
*   **Thresholding:** If nodes > 500, edges > 1000, React Flow performance degrades.
*   **Solution:** Implement an edge weight system. Only render nodes that have at least 2 connections. Provide a UI slider to adjust the "Graph Density" (filtering out less connected nodes).

## 6. Future Scope
*   **Graph Editing:** Allow users to drag a connection from one node to another manually to create a new relationship, writing back to the DB.
