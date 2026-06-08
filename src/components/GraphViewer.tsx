"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionLineType,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface GraphEntity {
  id: string;
  name: string;
  type: string;
}

interface GraphRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
}

const typeColors: Record<string, string> = {
  Person: "#3b82f6",
  Concept: "#8b5cf6",
  Technology: "#06b6d4",
  Organization: "#f59e0b",
  Location: "#10b981",
};

export function GraphViewer() {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphEntity | null>(null);

  const fetchGraph = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/graph/data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch graph");
      const data = await res.json();

      const flowNodes: Node[] = data.entities.map((entity: GraphEntity, i: number) => ({
        id: entity.id,
        type: "default",
        position: { x: Math.sin(i * 2.4) * 300, y: Math.cos(i * 1.8) * 300 },
        data: {
          label: entity.name,
          type: entity.type,
        },
        style: {
          background: typeColors[entity.type] || "#6b7280",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 500,
        },
      }));

      const flowEdges: Edge[] = data.relations.map((rel: GraphRelation) => ({
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        label: rel.relationshipType,
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#6b7280", strokeWidth: 2 },
        labelStyle: { fontSize: 11, fill: "#9ca3af" },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch {
      toast.error("Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, [user, setNodes, setEdges]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode({
        id: node.id,
        name: node.data.label as string,
        type: node.data.type as string,
      });
    },
    []
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">No knowledge graph yet</p>
        <p className="text-sm">Upload documents to build your graph</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          connectionLineType={ConnectionLineType.SmoothStep}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1f2937" gap={20} />
          <Controls className="bg-background border border-border rounded-lg" />
          <MiniMap
            className="bg-background border border-border rounded-lg"
            nodeColor={(node) => (node.style?.background as string) || "#6b7280"}
          />
        </ReactFlow>
      </div>

      <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedNode?.name}</SheetTitle>
          </SheetHeader>
          {selectedNode && (
            <div className="mt-4 space-y-4">
              <Badge>{selectedNode.type}</Badge>
              <p className="text-sm text-muted-foreground">
                Connected to {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length} other nodes
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
