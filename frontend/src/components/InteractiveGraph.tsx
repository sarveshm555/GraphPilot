import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Search, 
  Filter, 
  Maximize2, 
  ExternalLink, 
  Flame, 
  GitFork, 
  Layers, 
  RefreshCw,
  X,
  GitCommit,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { fetchEntityDetail } from '../services/api';

interface GraphNodeProps {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

interface GraphEdgeProps {
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
}

interface InteractiveGraphProps {
  rawNodes: GraphNodeProps[];
  rawEdges: GraphEdgeProps[];
  onSelectSystemForBlastRadius?: (systemId: string) => void;
  highlightPath?: Array<{ source: string; relationship: string; target: string }>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const LABEL_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  System: { bg: 'bg-sky-950/80', border: 'border-sky-500', text: 'text-sky-300', dot: '#38bdf8' },
  Project: { bg: 'bg-indigo-950/80', border: 'border-indigo-500', text: 'text-indigo-300', dot: '#818cf8' },
  Team: { bg: 'bg-purple-950/80', border: 'border-purple-500', text: 'text-purple-300', dot: '#c084fc' },
  Person: { bg: 'bg-cyan-950/80', border: 'border-cyan-500', text: 'text-cyan-300', dot: '#22d3ee' },
  Incident: { bg: 'bg-rose-950/80', border: 'border-rose-500', text: 'text-rose-300', dot: '#fb7185' },
  Document: { bg: 'bg-amber-950/80', border: 'border-amber-500', text: 'text-amber-300', dot: '#fbbf24' },
  Decision: { bg: 'bg-emerald-950/80', border: 'border-emerald-500', text: 'text-emerald-300', dot: '#34d399' },
  Finding: { bg: 'bg-fuchsia-950/80', border: 'border-fuchsia-500', text: 'text-fuchsia-300', dot: '#e879f9' },
  SupportTicket: { bg: 'bg-yellow-950/80', border: 'border-yellow-500', text: 'text-yellow-300', dot: '#facc15' },
  Entity: { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-300', dot: '#94a3b8' }
};

export function InteractiveGraph({
  rawNodes,
  rawEdges,
  onSelectSystemForBlastRadius,
  highlightPath,
  onRefresh,
  isLoading = false
}: InteractiveGraphProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string>('All');
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('All');
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [expandedNeighbors, setExpandedNeighbors] = useState<any[]>([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  // Path finding state
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [startEntity, setStartEntity] = useState('Project Alpha');
  const [endEntity, setEndEntity] = useState('Priya Sharma');
  const [pathFinding, setPathFinding] = useState(false);
  const [customHighlightPath, setCustomHighlightPath] = useState<Array<{ source: string; relationship: string; target: string }>>([]);
  const [pathResultSummary, setPathResultSummary] = useState<string | null>(null);

  // Active path to highlight (either from prop or from interactive path finder)
  const activeHighlightPath = useMemo(() => {
    if (customHighlightPath.length > 0) return customHighlightPath;
    return highlightPath || [];
  }, [customHighlightPath, highlightPath]);

  // Available labels & edge types
  const availableLabels = useMemo(() => {
    const s = new Set<string>();
    rawNodes.forEach(n => n.labels?.forEach(l => s.add(l)));
    return ['All', ...Array.from(s)];
  }, [rawNodes]);

  const availableEdgeTypes = useMemo(() => {
    const s = new Set<string>();
    rawEdges.forEach(e => s.add(e.type));
    return ['All', ...Array.from(s)];
  }, [rawEdges]);

  // Compute Layout Positions
  const { initialNodes, initialEdges } = useMemo(() => {
    // Filter nodes
    const filteredNodes = rawNodes.filter(n => {
      const matchesLabel = selectedLabel === 'All' || n.labels?.includes(selectedLabel);
      const name = n.properties?.name || n.properties?.title || n.id || '';
      const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase()) || n.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLabel && matchesSearch;
    });

    const activeNodeIds = new Set(filteredNodes.map(n => n.id));

    // Layout algorithms by category tiers
    const labelTiers: Record<string, number> = {
      Person: 0,
      Team: 1,
      System: 2,
      Project: 3,
      Document: 4,
      Incident: 4,
      Decision: 5,
      Finding: 5,
      SupportTicket: 4
    };

    const tierGroups: Record<number, GraphNodeProps[]> = {};
    filteredNodes.forEach(n => {
      const primaryLabel = n.labels?.[0] || 'Entity';
      const tier = labelTiers[primaryLabel] ?? 2;
      if (!tierGroups[tier]) tierGroups[tier] = [];
      tierGroups[tier].push(n);
    });

    // Check highlighted nodes from path
    const highlightedNodes = new Set<string>();
    if (activeHighlightPath && activeHighlightPath.length > 0) {
      activeHighlightPath.forEach(p => {
        highlightedNodes.add(p.source.toLowerCase());
        highlightedNodes.add(p.target.toLowerCase());
      });
    }

    const flowNodes: Node[] = [];
    Object.entries(tierGroups).forEach(([tierStr, nodesInTier]) => {
      const tier = parseInt(tierStr, 10);
      const xBase = 120 + tier * 280;
      const count = nodesInTier.length;
      const ySpacing = Math.max(90, Math.min(140, 600 / Math.max(1, count)));
      const yOffset = 80 + (count > 1 ? 0 : 150);

      nodesInTier.forEach((n, idx) => {
        const primaryLabel = n.labels?.[0] || 'Entity';
        const color = LABEL_COLORS[primaryLabel] || LABEL_COLORS.Entity;
        const name = n.properties?.name || n.properties?.title || n.id;
        const isHighlighted = (
          highlightedNodes.has(n.id.toLowerCase()) || 
          highlightedNodes.has(name.toLowerCase())
        );

        flowNodes.push({
          id: n.id,
          position: { x: xBase, y: yOffset + idx * ySpacing },
          data: {
            label: (
              <div className="flex flex-col text-left">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                    {primaryLabel}
                  </span>
                  {n.properties?.criticality && (
                    <span className="text-[9px] font-mono px-1 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {n.properties.criticality}
                    </span>
                  )}
                  {n.properties?.priority && (
                    <span className="text-[9px] font-mono px-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {n.properties.priority}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-slate-100 text-xs leading-tight line-clamp-1">
                  {name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {n.id}
                </span>
              </div>
            ),
            raw: n
          },
          style: {
            background: isHighlighted ? '#1e1b4b' : color.bg,
            border: isHighlighted ? '2px solid #818cf8' : `1.5px solid ${color.border.replace('border-', '')}`,
            borderRadius: '10px',
            padding: '10px',
            width: 220,
            color: '#f8fafc',
            boxShadow: isHighlighted ? '0 0 15px rgba(129, 140, 248, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
          }
        });
      });
    });

    // Edges
    const flowEdges: Edge[] = [];
    rawEdges.forEach((e, idx) => {
      // Find source and target in filtered nodes
      if (activeNodeIds.has(e.source) && activeNodeIds.has(e.target)) {
        if (selectedEdgeType !== 'All' && e.type !== selectedEdgeType) return;

        const isHighlighted = activeHighlightPath?.some(
          p => (
            (p.source.toLowerCase() === e.source.toLowerCase() || p.source.toLowerCase() === rawNodes.find(n => n.id === e.source)?.properties?.name?.toLowerCase()) &&
            (p.target.toLowerCase() === e.target.toLowerCase() || p.target.toLowerCase() === rawNodes.find(n => n.id === e.target)?.properties?.name?.toLowerCase())
          )
        );

        flowEdges.push({
          id: `e-${idx}-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.type,
          animated: isHighlighted,
          style: {
            stroke: isHighlighted ? '#818cf8' : '#64748b',
            strokeWidth: isHighlighted ? 2.5 : 1.2
          },
          labelStyle: {
            fill: isHighlighted ? '#a5b4fc' : '#94a3b8',
            fontSize: 9,
            fontWeight: 600,
            fontFamily: 'monospace'
          },
          labelBgStyle: {
            fill: '#0f172a',
            fillOpacity: 0.85
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isHighlighted ? '#818cf8' : '#64748b',
            width: 14,
            height: 14
          }
        });
      }
    });

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [rawNodes, rawEdges, selectedLabel, selectedEdgeType, searchTerm, activeHighlightPath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize when initialNodes or initialEdges change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle Node Click
  const handleNodeClick = useCallback(async (_: any, node: Node) => {
    const raw = (node.data as any)?.raw;
    setSelectedNodeData(raw);
    setExpandedNeighbors([]);

    if (raw?.id) {
      setLoadingNeighbors(true);
      try {
        const details = await fetchEntityDetail(raw.id);
        if (details?.neighbors) {
          setExpandedNeighbors(details.neighbors);
        }
      } catch (err) {
        console.error('Error fetching node neighbors:', err);
      } finally {
        setLoadingNeighbors(false);
      }
    }
  }, []);

  // Handle Find Path Action
  const handleFindPath = async () => {
    if (!startEntity.trim() || !endEntity.trim()) return;
    setPathFinding(true);
    setPathResultSummary(null);
    try {
      const res = await fetch(`/api/graph/path?start=${encodeURIComponent(startEntity)}&end=${encodeURIComponent(endEntity)}`);
      const data = await res.json();
      if (data.paths && data.paths.length > 0) {
        const firstPath = data.paths[0];
        const newHighlights: Array<{ source: string; relationship: string; target: string }> = [];
        firstPath.edges?.forEach((ed: any) => {
          newHighlights.push({
            source: ed.source,
            relationship: ed.type || ed.relationship || 'CONNECTED',
            target: ed.target
          });
        });
        setCustomHighlightPath(newHighlights);
        setPathResultSummary(`Discovered ${newHighlights.length}-hop path connecting '${startEntity}' to '${endEntity}' in FalkorDB.`);
      } else {
        setPathResultSummary(`No path found between '${startEntity}' and '${endEntity}' in the company knowledge graph.`);
        setCustomHighlightPath([]);
      }
    } catch (err: any) {
      setPathResultSummary(`Path query error: ${err.message}`);
    } finally {
      setPathFinding(false);
    }
  };

  const handleResetView = () => {
    setSearchTerm('');
    setSelectedLabel('All');
    setSelectedEdgeType('All');
    setCustomHighlightPath([]);
    setPathResultSummary(null);
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0e17]">
        {/* Top Control Bar */}
        <div className="h-14 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur px-4 flex items-center justify-between gap-3 z-10 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search entities by name, ID, or property..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Label Filter */}
            <select
              value={selectedLabel}
              onChange={e => setSelectedLabel(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {availableLabels.map(lbl => (
                <option key={lbl} value={lbl}>{lbl === 'All' ? 'All Entity Types' : lbl}</option>
              ))}
            </select>

            {/* Edge Type Filter */}
            <select
              value={selectedEdgeType}
              onChange={e => setSelectedEdgeType(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {availableEdgeTypes.map(rtype => (
                <option key={rtype} value={rtype}>{rtype === 'All' ? 'All Relationships' : rtype}</option>
              ))}
            </select>

            {/* Path Finder Toggle */}
            <button
              onClick={() => setShowPathFinder(!showPathFinder)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                showPathFinder || customHighlightPath.length > 0
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>Path Finder</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleResetView}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
              title="Reset Filters & Path Highlight"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
                title="Refresh from FalkorDB"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            <div className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              Nodes: {nodes.length} | Edges: {edges.length}
            </div>
          </div>
        </div>

        {/* Path Finder Floating Panel */}
        {showPathFinder && (
          <div className="p-3 bg-[#131c31] border-b border-slate-800 flex items-center justify-between gap-3 text-xs z-20 shadow-xl">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <GitFork className="h-3.5 w-3.5 text-indigo-400" />
                Find Multi-Hop Path:
              </span>
              <input
                type="text"
                value={startEntity}
                onChange={e => setStartEntity(e.target.value)}
                placeholder="Start node (e.g. Project Alpha)..."
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs w-48 focus:outline-none focus:border-indigo-500"
              />
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={endEntity}
                onChange={e => setEndEntity(e.target.value)}
                placeholder="End node (e.g. Priya Sharma)..."
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs w-48 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleFindPath}
                disabled={pathFinding || !startEntity.trim() || !endEntity.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1 rounded font-semibold text-xs transition-colors flex items-center gap-1"
              >
                {pathFinding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Compute Path
              </button>
            </div>

            {pathResultSummary && (
              <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                {pathResultSummary}
              </span>
            )}

            <button
              onClick={() => setShowPathFinder(false)}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* React Flow Viewport */}
        <div className="flex-1 w-full h-full relative">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-20">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-indigo-400 text-xs shadow-xl">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Querying FalkorDB Graph Schema...
              </div>
            </div>
          )}

          {nodes.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <Layers className="h-8 w-8 text-slate-600" />
              <p className="text-xs">No graph entities match the active filters.</p>
              <button
                onClick={handleResetView}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              fitView
              minZoom={0.2}
              maxZoom={2.5}
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background color="#1e293b" gap={20} size={1} variant={BackgroundVariant.Dots} />
              <Controls className="bg-slate-900 border border-slate-700 rounded-lg text-slate-200 fill-slate-200 overflow-hidden shadow-lg" />
              <MiniMap
                nodeColor={n => {
                  const raw = (n.data as any)?.raw;
                  const lbl = raw?.labels?.[0] || 'Entity';
                  return LABEL_COLORS[lbl]?.dot || '#94a3b8';
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg shadow-xl"
                maskColor="rgba(15, 23, 42, 0.75)"
              />

              <Panel position="bottom-left" className="bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-lg text-[10px] space-y-1">
                <span className="font-semibold text-slate-300 block mb-1">Entity Color Legend</span>
                <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                  {Object.entries(LABEL_COLORS).slice(0, 9).map(([lbl, c]) => (
                    <div key={lbl} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.dot }} />
                      <span className="text-slate-300">{lbl}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </ReactFlow>
          )}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNodeData && (
        <aside className="w-84 border-l border-slate-800 bg-[#0f172a] flex flex-col h-full overflow-hidden shadow-2xl z-20 shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Entity Inspector
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
                FalkorDB
              </span>
            </div>
            <button
              onClick={() => setSelectedNodeData(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* Identification */}
            <div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Name / Title</span>
              <h3 className="text-sm font-bold text-white">
                {selectedNodeData.properties?.name || selectedNodeData.properties?.title || selectedNodeData.id}
              </h3>
              <p className="text-[11px] font-mono text-indigo-400 mt-0.5">{selectedNodeData.id}</p>
            </div>

            {/* Labels */}
            <div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">Labels</span>
              <div className="flex flex-wrap gap-1">
                {selectedNodeData.labels?.map((l: string) => (
                  <span key={l} className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setStartEntity(selectedNodeData.properties?.name || selectedNodeData.id);
                  setShowPathFinder(true);
                }}
                className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <GitFork className="h-4 w-4 text-indigo-400" />
                Find Path From This Entity
              </button>

              {selectedNodeData.labels?.includes('System') && onSelectSystemForBlastRadius && (
                <button
                  onClick={() => onSelectSystemForBlastRadius(selectedNodeData.id)}
                  className="w-full bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flame className="h-4 w-4 text-rose-400" />
                  Analyze System Blast Radius
                </button>
              )}
            </div>

            {/* Properties Table */}
            <div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Properties</span>
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg divide-y divide-slate-800/80 overflow-hidden">
                {Object.entries(selectedNodeData.properties || {}).map(([key, val]) => (
                  <div key={key} className="px-3 py-2 flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono text-slate-400">{key}</span>
                    <span className="text-slate-200 break-words text-[11px]">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected Graph Neighbors */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Connected Entities ({expandedNeighbors.length})
                </span>
                {loadingNeighbors && <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />}
              </div>

              {expandedNeighbors.length === 0 && !loadingNeighbors ? (
                <p className="text-[11px] text-slate-500 italic bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  No direct neighbor relationships discovered in this view.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {expandedNeighbors.map((nbr, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg flex flex-col gap-1 text-[11px]"
                    >
                      <div className="flex items-center justify-between text-indigo-400 font-mono text-[10px]">
                        <span>-[{nbr.edge?.type || 'CONNECTED'}]-&gt;</span>
                      </div>
                      <span className="font-semibold text-slate-200">
                        {nbr.node?.name || nbr.node?.title || nbr.node?.id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

export default InteractiveGraph;
