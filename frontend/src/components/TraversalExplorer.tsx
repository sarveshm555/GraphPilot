import React, { useState } from 'react';
import { 
  GitCommit, 
  Share2, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  ExternalLink, 
  ShieldAlert,
  ArrowRight,
  Database,
  Layers
} from 'lucide-react';
import { GroundedAnswer } from '../types';

interface TraversalExplorerProps {
  answer: GroundedAnswer;
  onInspectInGraph?: (path: any[]) => void;
}

export function TraversalExplorer({ answer, onInspectInGraph }: TraversalExplorerProps) {
  const [expandedEdgeIdx, setExpandedEdgeIdx] = useState<number | null>(null);
  
  const hasPaths = answer.graph_paths && answer.graph_paths.length > 0;
  const hasSources = answer.sources && answer.sources.length > 0;
  const hasFacts = answer.facts && answer.facts.length > 0;
  const hasRecommendations = answer.recommendations && answer.recommendations.length > 0;
  const hasLimitations = answer.limitations && answer.limitations.length > 0;

  const toggleEdgeExpand = (idx: number) => {
    setExpandedEdgeIdx(prev => prev === idx ? null : idx);
  };

  return (
    <div className="space-y-4 text-xs mt-3 pt-3 border-t border-slate-700/60">
      {/* 1. Verified Facts Section (Explicitly separated from recommendations) */}
      {hasFacts && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Verified Facts from Graph ({answer.facts.length})
            </span>
            <span className="text-[9px] bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded font-mono font-semibold uppercase">
              FalkorDB Grounded
            </span>
          </div>
          <div className="space-y-1.5">
            {answer.facts.map((fact, idx) => (
              <div key={idx} className="bg-slate-950/60 px-3 py-2 rounded-lg text-slate-200 text-xs flex items-start gap-2 border border-slate-800">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span className="leading-relaxed">
                  {typeof fact === 'object' ? JSON.stringify(fact) : String(fact)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Visual Path Sequence Stepper & Expandable Segments */}
      {hasPaths ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <GitCommit className="h-3.5 w-3.5" />
                Derived FalkorDB Traversal Path ({answer.graph_paths.length} Hops)
              </span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold uppercase border ${
                answer.agent_mode === 'real_llm'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50'
              }`}>
                {answer.agent_mode === 'real_llm' ? 'Real LLM Mode' : 'Deterministic Mode'}
              </span>
            </div>
            {onInspectInGraph && (
              <button
                onClick={() => onInspectInGraph(answer.graph_paths)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                Inspect in Graph <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Stepper Chain */}
          <div className="flex flex-wrap items-center gap-2">
            {answer.graph_paths.map((p, idx) => (
              <React.Fragment key={idx}>
                {idx === 0 && (
                  <span className="px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 font-semibold font-mono text-[11px] shadow-sm">
                    {p.source}
                  </span>
                )}
                <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-cyan-800/40">
                  <ArrowRight className="h-3 w-3" />
                  <span>{p.relationship}</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 font-semibold font-mono text-[11px] shadow-sm">
                  {p.target}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Interactive Expandable Relationship Segments */}
          <div className="space-y-1.5 pt-1">
            {answer.graph_paths.map((p, idx) => {
              const isExpanded = expandedEdgeIdx === idx;
              return (
                <div 
                  key={idx} 
                  className={`bg-slate-950/80 border rounded-lg transition-all overflow-hidden ${
                    isExpanded ? 'border-indigo-500/70 bg-slate-950 shadow-md' : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div 
                    onClick={() => toggleEdgeExpand(idx)}
                    className="px-3 py-2 text-[11px] font-mono text-slate-300 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-white font-medium">{p.source}</span>
                      <span className="text-cyan-400 text-[10px] bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                        -[{p.relationship}]-&gt;
                      </span>
                      <span className="text-slate-200">{p.target}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-[10px]">
                      <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>Relationship Type: <strong className="text-indigo-300 font-mono">{p.relationship}</strong></span>
                        <span>Hop: <strong className="text-slate-300">{idx + 1} of {answer.graph_paths.length}</strong></span>
                      </div>
                      {p.properties && Object.keys(p.properties).length > 0 ? (
                        <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] font-mono">
                          {Object.entries(p.properties).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-slate-400">
                              <span>{k}:</span>
                              <span className="text-slate-200">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No edge properties recorded in FalkorDB schema for this hop.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        answer.outcome === 'no_graph_evidence' && (
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-slate-500 shrink-0" />
            <span>No explicit graph traversal path was found in FalkorDB to support this question.</span>
          </div>
        )
      )}

      {/* 3. Supporting Source Documents & Evidence */}
      {hasSources && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Verified Source Evidence Documents ({answer.sources.length})
          </span>
          <div className="space-y-2">
            {answer.sources.map((s, idx) => (
              <div key={idx} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between font-semibold text-slate-200 text-xs">
                  <span>{s.title}</span>
                  <span className="font-mono text-[10px] text-amber-400/90 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
                    {s.id}
                  </span>
                </div>
                {s.excerpt && (
                  <p className="text-slate-400 text-[11px] italic mt-1.5 bg-slate-900/50 p-2 rounded border border-slate-800/80 leading-relaxed">
                    "{s.excerpt}"
                  </p>
                )}
                {s.source_uri && (
                  <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                    URI: {s.source_uri}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. AI Recommendations (Strictly Isolated from Historical Facts) */}
      {hasRecommendations && (
        <div className="bg-purple-950/30 border border-purple-800/50 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              AI Recommended Next Actions (Interpretations)
            </span>
            <span className="text-[9px] bg-purple-900/50 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded uppercase font-semibold">
              Advisory Only
            </span>
          </div>
          <div className="space-y-1.5">
            {answer.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-slate-950/60 px-3 py-2 rounded-lg text-slate-200 text-xs flex items-start gap-2 border border-purple-900/30">
                <span className="text-purple-400 font-bold">•</span>
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Honest Limitations & Absence Caveats */}
      {hasLimitations && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Knowledge Boundaries & Truth Limitations
          </span>
          {answer.limitations.map((lim, idx) => (
            <p key={idx} className="text-[11px] leading-relaxed text-slate-400">
              • {lim}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
