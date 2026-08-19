import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Network,
  Loader2,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import type { DocumentWithAnalysis, AnalysisResult, Entity, Relation } from '@/types';
import { loadDocumentsWithAnalysis } from '@/lib/documents';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

const ENTITY_COLORS: Record<string, string> = {
  PERSON: '#0ea5e9',
  ORGANIZATION: '#14b8a6',
  LOCATION: '#f59e0b',
  DATE: '#ec4899',
  MONEY: '#8b5cf6',
  UNKNOWN: '#64748b',
};

export default function KnowledgeGraphPage() {
  const [documents, setDocuments] = useState<DocumentWithAnalysis[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    async function load() {
      const { data } = await loadDocumentsWithAnalysis();

      if (data) {
        setDocuments(data);
        if (data.length > 0 && data[0].analysis?.[0]) {
          setSelectedDoc(data[0].id);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const currentDoc = documents.find((d) => d.id === selectedDoc);
  const currentAnalysis = currentDoc?.analysis?.[0];

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  useEffect(() => {
    if (!currentAnalysis) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const entities = currentAnalysis.entities as Entity[];
    const relations = currentAnalysis.relations as Relation[];

    const nodeMap = new Map<string, GraphNode>();
    const cx = 400, cy = 300;

    entities.forEach((e, i) => {
      const angle = (i / Math.max(entities.length, 1)) * Math.PI * 2;
      const r = 150 + Math.random() * 50;
      const id = e.text.toLowerCase();
      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id,
          label: e.text,
          type: e.type,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        });
      }
    });

    const graphEdges: GraphEdge[] = [];
    relations.forEach((r) => {
      const sId = r.subject.toLowerCase();
      const tId = r.object.toLowerCase();
      if (nodeMap.has(sId) && nodeMap.has(tId)) {
        graphEdges.push({ source: sId, target: tId, label: r.predicate });
      } else {
        if (!nodeMap.has(sId)) {
          nodeMap.set(sId, {
            id: sId, label: r.subject, type: r.subjectType,
            x: cx + (Math.random() - 0.5) * 300, y: cy + (Math.random() - 0.5) * 200, vx: 0, vy: 0,
          });
        }
        if (!nodeMap.has(tId)) {
          nodeMap.set(tId, {
            id: tId, label: r.object, type: r.objectType,
            x: cx + (Math.random() - 0.5) * 300, y: cy + (Math.random() - 0.5) * 200, vx: 0, vy: 0,
          });
        }
        graphEdges.push({ source: sId, target: tId, label: r.predicate });
      }
    });

    setNodes(Array.from(nodeMap.values()));
    setEdges(graphEdges);
  }, [currentAnalysis]);

  // Force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const simulate = () => {
      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));
        const cx = 400, cy = 300;

        // Repulsion
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const dx = next[j].x - next[i].x;
            const dy = next[j].y - next[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 3000 / (dist * dist);
            next[i].vx -= (dx / dist) * force;
            next[i].vy -= (dy / dist) * force;
            next[j].vx += (dx / dist) * force;
            next[j].vy += (dy / dist) * force;
          }
        }

        // Attraction (edges)
        edges.forEach((e) => {
          const s = next.find((n) => n.id === e.source);
          const t = next.find((n) => n.id === e.target);
          if (!s || !t) return;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 120) * 0.02;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
          t.vx -= (dx / dist) * force;
          t.vy -= (dy / dist) * force;
        });

        // Center gravity
        next.forEach((n) => {
          n.vx += (cx - n.x) * 0.005;
          n.vy += (cy - n.y) * 0.005;
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x += n.vx;
          n.y += n.vy;
        });

        return next;
      });
      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [nodes.length, edges]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Network className="w-6 h-6 text-teal-600" />
          Knowledge Graph
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualize entities and their relationships as an interactive graph.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No documents to visualize</h3>
          <p className="text-sm text-slate-500 mb-4">Analyze text first to generate a knowledge graph.</p>
          <Link to="/analyze" className="text-teal-600 font-semibold text-sm">Analyze a document →</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-5">
          {/* Document selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 lg:max-h-[70vh] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-2">Documents</p>
            {documents.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDoc(d.id)}
                disabled={!d.analysis?.[0]}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  selectedDoc === d.id
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <span className="block truncate">{d.filename}</span>
              </button>
            ))}
          </div>

          {/* Graph */}
          <div className="bg-white rounded-xl border border-slate-200 relative overflow-hidden">
            <div className="absolute top-3 right-3 z-10 flex gap-1">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            {nodes.length === 0 ? (
              <div className="h-[70vh] flex items-center justify-center text-slate-400 text-sm">
                No graph data available for this document
              </div>
            ) : (
              <svg
                ref={svgRef}
                viewBox="0 0 800 600"
                className="w-full h-[70vh]"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              >
                {/* Edges */}
                {edges.map((e, i) => {
                  const s = nodes.find((n) => n.id === e.source);
                  const t = nodes.find((n) => n.id === e.target);
                  if (!s || !t) return null;
                  const mx = (s.x + t.x) / 2;
                  const my = (s.y + t.y) / 2;
                  return (
                    <g key={i}>
                      <line
                        x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                        stroke="#cbd5e1" strokeWidth="1.5"
                        markerEnd="url(#arrowhead)"
                      />
                      <text
                        x={mx} y={my}
                        textAnchor="middle"
                        className="text-[8px] fill-slate-400 font-medium"
                        style={{ fontSize: '8px' }}
                      >
                        {e.label.slice(0, 15)}
                      </text>
                    </g>
                  );
                })}

                {/* Arrow marker */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8" markerHeight="6"
                    refX="18" refY="3" orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#cbd5e1" />
                  </marker>
                </defs>

                {/* Nodes */}
                {nodes.map((n) => {
                  const color = ENTITY_COLORS[n.type] ?? '#64748b';
                  return (
                    <g key={n.id}>
                      <circle
                        cx={n.x} cy={n.y} r="22"
                        fill={color} fillOpacity="0.15"
                        stroke={color} strokeWidth="2"
                      />
                      <text
                        x={n.x} y={n.y + 38}
                        textAnchor="middle"
                        className="fill-slate-700 font-medium"
                        style={{ fontSize: '10px' }}
                      >
                        {n.label.length > 18 ? n.label.slice(0, 17) + '…' : n.label}
                      </text>
                      <text
                        x={n.x} y={n.y + 50}
                        textAnchor="middle"
                        style={{ fontSize: '7px' }}
                        fill={color}
                      >
                        {n.type}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
