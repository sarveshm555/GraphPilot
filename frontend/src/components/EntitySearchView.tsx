import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  Users, 
  Database, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  Flame, 
  X, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { searchEntities, fetchEntityDetail } from '../services/api';
import { EntitySearchResult } from '../types';

interface EntitySearchViewProps {
  onSelectSystemForBlastRadius?: (systemId: string) => void;
  onNavigateToGraph?: (highlightPath?: any[]) => void;
}

const LABELS = ['All', 'Person', 'Team', 'Project', 'System', 'Incident', 'Document', 'Decision', 'Finding', 'SupportTicket'];

const LABEL_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  Person: { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-800' },
  Team: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-800' },
  Project: { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-800' },
  System: { bg: 'bg-sky-950/60', text: 'text-sky-300', border: 'border-sky-800' },
  Incident: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-800' },
  Document: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-800' },
  Decision: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-800' },
  Finding: { bg: 'bg-fuchsia-950/60', text: 'text-fuchsia-300', border: 'border-fuchsia-800' },
  SupportTicket: { bg: 'bg-yellow-950/60', text: 'text-yellow-300', border: 'border-yellow-800' },
  Entity: { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-800' }
};

export function EntitySearchView({ onSelectSystemForBlastRadius, onNavigateToGraph }: EntitySearchViewProps) {
  const [query, setQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [results, setResults] = useState<EntitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntitySearchResult | null>(null);
  const [neighbors, setNeighbors] = useState<any[]>([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  useEffect(() => {
    executeSearch(query, selectedLabel);
  }, [query, selectedLabel]);

  const executeSearch = async (q: string, lbl: string) => {
    setLoading(true);
    try {
      const data = await searchEntities(q, lbl);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntity = async (entity: EntitySearchResult) => {
    setSelectedEntity(entity);
    setNeighbors([]);
    setLoadingNeighbors(true);
    try {
      const details = await fetchEntityDetail(entity.id);
      if (details?.neighbors) {
        setNeighbors(details.neighbors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNeighbors(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0a0e17] text-slate-100">
      {/* Main Search List View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header and Controls */}
        <div className="p-6 border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-400" />
                Global Entity Directory & Search
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Search, filter, and inspect verified nodes across people, systems, teams, incidents, and documentation in FalkorDB.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              Matches: <span className="text-indigo-400 font-bold">{results.length}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by entity name, ID, title, role, or description..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Label Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {LABELS.map(lbl => (
              <button
                key={lbl}
                onClick={() => setSelectedLabel(lbl)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                  selectedLabel === lbl
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-20 text-indigo-400 gap-2 text-xs">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Querying FalkorDB entity indexes...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-20 text-xs text-slate-500 space-y-2">
              <Layers className="h-8 w-8 mx-auto text-slate-600" />
              <p>No entity nodes discovered in FalkorDB matching "{query}".</p>
              <button
                onClick={() => { setQuery(''); setSelectedLabel('All'); }}
                className="text-indigo-400 text-[11px] hover:underline"
              >
                Clear Search Filter
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map(entity => {
              const badge = LABEL_BADGES[entity.label] || LABEL_BADGES.Entity;
              return (
                <div
                  key={entity.id}
                  onClick={() => handleSelectEntity(entity)}
                  className={`bg-[#131c31] border rounded-xl p-4 text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    selectedEntity?.id === entity.id
                      ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-950/50'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {entity.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {entity.connected_count} Relationships
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">
                      {entity.name}
                    </h4>
                    <p className="text-[11px] font-mono text-indigo-400 mb-2">
                      {entity.id}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {entity.description || 'No summary recorded in graph.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate max-w-[150px]">
                      {entity.neighbor_types?.slice(0, 3).join(', ') || 'No neighbors'}
                    </span>
                    <span className="text-indigo-400 flex items-center gap-0.5 font-medium">
                      Inspect <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Entity Inspector Side Drawer */}
      {selectedEntity && (
        <aside className="w-84 border-l border-slate-800 bg-[#0f172a] flex flex-col h-full overflow-hidden shadow-2xl z-20">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Entity Details
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono border border-indigo-500/30">
                FalkorDB
              </span>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Name</span>
              <h3 className="text-sm font-bold text-white">{selectedEntity.name}</h3>
              <p className="text-[11px] font-mono text-indigo-400 mt-0.5">{selectedEntity.id}</p>
            </div>

            {selectedEntity.label === 'System' && onSelectSystemForBlastRadius && (
              <button
                onClick={() => onSelectSystemForBlastRadius(selectedEntity.id)}
                className="w-full bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Flame className="h-4 w-4 text-rose-400" />
                Analyze System Blast Radius
              </button>
            )}

            {onNavigateToGraph && (
              <button
                onClick={() => onNavigateToGraph([])}
                className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="h-4 w-4 text-indigo-400" />
                Locate in Knowledge Graph
              </button>
            )}

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">Properties</span>
              <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800 overflow-hidden">
                {Object.entries(selectedEntity.properties || {}).map(([k, v]) => (
                  <div key={k} className="px-3 py-1.5 flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono text-slate-500">{k}</span>
                    <span className="text-slate-200 text-[11px] break-words">
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Connected Entities ({neighbors.length})
                </span>
                {loadingNeighbors && <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />}
              </div>

              {neighbors.length === 0 && !loadingNeighbors ? (
                <p className="text-[11px] text-slate-500 italic p-3 bg-slate-900 rounded border border-slate-800">
                  No direct neighbors recorded.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {neighbors.map((nbr, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[11px]"
                    >
                      <span className="text-indigo-400 font-mono text-[10px] block mb-0.5">
                        -[{nbr.edge?.type || 'CONNECTED'}]-&gt;
                      </span>
                      <span className="font-semibold text-white">
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
