"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Share2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface GraphEntity { id: string; name: string; type: string }
interface GraphDocument { id: string; title: string; type: string; status: string; createdAt: string }
interface GraphRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  document: GraphDocument | null;
  sourceEntity: GraphEntity;
  targetEntity: GraphEntity;
}

const typeColors: Record<string, string> = {
  Person: "#3b82f6", Concept: "#8b5cf6", Technology: "#06b6d4",
  Organization: "#f59e0b", Location: "#10b981",
};

export default function GraphPage() {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [relations, setRelations] = useState<GraphRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphEntity | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/graph/data", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (cancelled) return;
        setRelations(data.relations || []);

        const flowNodes: Node[] = data.entities.map((entity: GraphEntity, i: number) => ({
          id: entity.id,
          type: "default",
          position: { x: Math.sin(i * 2.4) * 300, y: Math.cos(i * 1.8) * 300 },
          data: { label: entity.name, type: entity.type },
          style: {
            background: typeColors[entity.type] || "#6b7280",
            color: "#fff", border: "none", borderRadius: "12px",
            padding: "10px 18px", fontSize: "13px", fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          },
        }));

        const flowEdges: Edge[] = data.relations.map((rel: GraphRelation) => ({
          id: rel.id,
          source: rel.sourceEntityId,
          target: rel.targetEntityId,
          label: rel.relationshipType,
          type: "smoothstep",
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          style: { stroke: "#3f3f46", strokeWidth: 1.5 },
          labelStyle: { fontSize: 10, fill: "#71717a" },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch {
        if (!cancelled) toast.error("Failed to load graph");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, setNodes, setEdges]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode({ id: node.id, name: node.data.label as string, type: node.data.type as string });
  };

  const selectedNodeDocs = selectedNode
    ? relations
        .filter((r) => r.sourceEntityId === selectedNode.id || r.targetEntityId === selectedNode.id)
        .map((r) => r.document)
        .filter((d): d is GraphDocument => d !== null)
        .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
    : [];

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">Knowledge Graph</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" className="h-7 w-7" onClick={() => window.location.reload()}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center p-6">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Share2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No knowledge graph yet</p>
            <p className="text-xs text-muted-foreground/60">Upload documents to build your graph</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={2}
            connectionLineType={ConnectionLineType.SmoothStep}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1c1c1f" gap={24} size={1} />
            <Controls showInteractive={false} className="bg-card border border-border rounded-lg [&_button]:border-border [&_button]:text-muted-foreground" />
            <MiniMap
              className="bg-card border border-border rounded-lg !bottom-4 !right-4"
              nodeColor={(n) => (n.style?.background as string) || "#6b7280"}
              maskColor="rgba(10,10,11,0.8)"
            />
          </ReactFlow>
        )}
      </div>

      <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <SheetContent className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle>{selectedNode?.name}</SheetTitle>
            <SheetDescription>
              Entity details and connected documents
            </SheetDescription>
          </SheetHeader>
          {selectedNode && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <Badge variant="secondary" className="font-normal">{selectedNode.type}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Connections</p>
                <p className="text-sm">
                  {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length} relationships
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Related Documents</p>
                {selectedNodeDocs.length > 0 ? (
                  <div className="space-y-2">
                    {selectedNodeDocs.map((doc) => (
                      <div key={doc.id} className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground capitalize">{doc.type}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60">No documents linked to this entity</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
