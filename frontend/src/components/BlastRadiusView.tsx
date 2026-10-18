import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  ShieldAlert, 
  GitFork, 
  Users, 
  Clock, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Database,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { fetchBlastRadius } from '../services/api';
import { BlastRadiusResult } from '../types';

interface BlastRadiusViewProps {
  initialSystemId?: string;
  onNavigateToGraph?: (highlightPath?: any[]) => void;
}

const PRESET_SYSTEMS = [
  { id: 'sys-payment-api', name: 'Payment API', desc: 'Tier-0 Central Gateway' },
  { id: 'sys-trans-db', name: 'Transaction Database', desc: 'Tier-0 ACID Ledger' },
  { id: 'sys-fraud-engine', name: 'Fraud Detection Service', desc: 'Tier-1 Real-time ML' },
  { id: 'sys-notification-svc', name: 'Notification Service', desc: 'Tier-2 Webhook Gateway' }
];

export function BlastRadiusView({ initialSystemId = 'sys-payment-api', onNavigateToGraph }: BlastRadiusViewProps) {
  const [selectedSystem, setSelectedSystem] = useState(initialSystemId);
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BlastRadiusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectedEntity, setInspectedEntity] = useState<any | null>(null);

  useEffect(() => {
    loadAnalysis(selectedSystem, maxDepth);
  }, [selectedSystem, maxDepth]);

  const loadAnalysis = async (sysId: string, depth: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBlastRadius(sysId, depth);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate blast radius');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            CRITICAL SEVERITY
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            HIGH SEVERITY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            MEDIUM SEVERITY
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0e17] text-slate-100">
      {/* Top Header / Selector */}
      <div className="p-6 border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 w-6 rounded bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Flame className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                System Blast Radius Analysis
              </h2>
              <span className="text-[10px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded font-mono border border-slate-700">
                FalkorDB Multi-Hop
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulate service failures and calculate multi-hop cascading impacts across projects, dependencies, and teams.
            </p>
          </div>

          {/* System Dropdown Selector & Depth Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Presets */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
              {PRESET_SYSTEMS.map(sys => (
                <button
                  key={sys.id}
                  onClick={() => setSelectedSystem(sys.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    selectedSystem === sys.id
                      ? 'bg-rose-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {sys.name}
                </button>
              ))}
            </div>

            {/* Depth Selector Buttons */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Depth:</span>
              {[1, 2, 3, 4, 5].map(d => (
                <button
                  key={d}
                  onClick={() => setMaxDepth(d)}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                    maxDepth === d
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={`Traverse up to ${d} hops`}
                >
                  {d}H
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-indigo-400 gap-2 text-xs">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Computing FalkorDB multi-hop dependency paths and incident histories...
          </div>
        )}

        {error && (
          <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-xs text-rose-200 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold">Blast Radius Calculation Failed</p>
              <p className="text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {data && data.found && !loading && (
          <>
            {/* Simulation Status Notice */}
            <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold text-amber-200">Simulation Mode: Hypothetical Service Degradation</span>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    This analysis projects potential multi-hop cascading outages across the architecture graph. It is a predictive blast radius calculation, distinct from an active real-time outage.
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-900/40 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-700/50 uppercase font-semibold">
                Predictive Cypher
              </span>
            </div>

            {/* Severity Card & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#131c31] border border-slate-800 rounded-xl p-4 md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Failure Risk Assessment</span>
                  {getSeverityBadge(data.severity)}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {data.target_system?.name || selectedSystem}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {data.severity_rationale}
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                  <span className="text-indigo-400">ID: {data.target_system?.id}</span>
                  <span>|</span>
                  <span>Criticality: {data.target_system?.criticality || 'Standard'}</span>
                </div>
              </div>

              <div className="bg-[#131c31] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-400">Total Entities in Blast Radius</span>
                <p className="text-3xl font-extrabold text-rose-400">{data.metrics?.total_affected_entities || 0}</p>
                <span className="text-[11px] text-slate-400">Direct & transitive impacts</span>
              </div>

              <div className="bg-[#131c31] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-400">Impacted Customer Projects</span>
                <p className="text-3xl font-extrabold text-amber-400">
                  {(data.metrics?.direct_projects_count || 0) + (data.metrics?.transitive_projects_count || 0)}
                </p>
                <span className="text-[11px] text-slate-400">P0 & active revenue rails</span>
              </div>
            </div>

            {/* Semantic Separation: Structural Baseline vs Simulated Outage Impact */}
            <div className="bg-[#101D32] border border-blue-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-sky-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Existing Architecture Baseline (Upstream Dependencies)
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-semibold">
                  STRUCTURAL DEPENDENCY (NOT OUTAGE IMPACT)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                These are verified services that <strong className="text-white">{data.target_system?.name || selectedSystem}</strong> depends upon to function normally. They are the underlying infrastructure, not downstream cascading victims.
              </p>
              {data.direct_upstream_dependencies && data.direct_upstream_dependencies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {data.direct_upstream_dependencies.map(dep => (
                    <div
                      key={dep.id}
                      onClick={() => setInspectedEntity({ type: 'Upstream Dependency', title: dep.name, id: dep.id, criticality: dep.criticality, description: dep.description })}
                      className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{dep.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{dep.id}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                        {dep.criticality || 'Tier-0'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-2 bg-slate-950/40 rounded border border-slate-800">
                  Root service — no upstream system dependencies registered in FalkorDB.
                </p>
              )}
            </div>

            {/* Direct Downstream Projects vs Transitive Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Direct Downstream Projects */}
              <div className="bg-[#131c31] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Hypothetical Outage: Directly Dependent Projects ({data.direct_downstream_projects?.length || 0})
                  </h4>
                  <span className="text-[10px] text-rose-300 font-mono bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 font-semibold">
                    SIMULATED OUTAGE IMPACT
                  </span>
                </div>

                <div className="space-y-2">
                  {data.direct_downstream_projects?.map(proj => (
                    <div 
                      key={proj.id} 
                      onClick={() => setInspectedEntity({ type: 'Project', title: proj.name, id: proj.id, priority: proj.priority, status: proj.status, impact: 'Direct Downstream' })}
                      className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/50 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div>
                        <span className="font-semibold text-white text-xs">{proj.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-800 font-mono">
                            {proj.priority} Priority
                          </span>
                          <span className="text-[10px] text-slate-400">Status: {proj.status}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-rose-400 font-mono bg-rose-950/50 px-2 py-0.5 rounded border border-rose-900/60">
                        Direct Impact
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transitive Projects (Multi-Hop) */}
              <div className="bg-[#131c31] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Transitive Cascading Projects ({data.transitive_projects?.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">2+ Hop Cascading</span>
                </div>

                {data.transitive_projects?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                    No indirect customer projects affected beyond the direct consumers.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.transitive_projects?.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setInspectedEntity({ type: 'Project (Transitive)', title: item.project.name, id: item.project.id, via: item.via_system, impact: 'Transitive Multi-Hop' })}
                        className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div>
                          <span className="font-semibold text-white text-xs">{item.project.name}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Cascades via dependency on <span className="text-indigo-300 font-semibold">{item.via_system}</span>
                          </p>
                        </div>
                        <span className="text-[10px] text-amber-400 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-900/60">
                          Transitive
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Responsible Teams & On-Call Engineers */}
            <div className="bg-[#131c31] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-purple-400" />
                  Responsible Owning Teams & Incident Responders
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">OWNS / MEMBER_OF</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.owning_teams?.map((tEntry, tIdx) => (
                  <div key={tIdx} className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg">
                    <span 
                      onClick={() => setInspectedEntity({ type: 'Team', title: tEntry.team.name, id: tEntry.team.id, mission: tEntry.team.mission })}
                      className="font-bold text-white text-xs block mb-1 cursor-pointer hover:text-indigo-300 transition-colors"
                    >
                      {tEntry.team.name}
                    </span>
                    <p className="text-[11px] text-slate-400 mb-3">{tEntry.team.mission}</p>
                    
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                      Assigned Engineers ({tEntry.engineers.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tEntry.engineers.map((eng, eIdx) => (
                        <div 
                          key={eIdx} 
                          onClick={() => setInspectedEntity({ type: 'Person', title: eng.name, id: eng.id, role: eng.role, team: tEntry.team.name })}
                          className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 px-2.5 py-1 rounded text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          <span className="text-slate-200">{eng.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({eng.role || 'Staff'})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Precedent (Incidents & Resolutions) */}
            <div className="bg-[#131c31] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-rose-400" />
                  Historical Precedent: Incidents & Past Resolutions ({data.historical_incidents?.length || 0})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">AFFECTED / RESOLVED_BY</span>
              </div>

              {data.historical_incidents?.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  No historical outage records found in FalkorDB for this system.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.historical_incidents?.map((incEntry, idx) => (
                    <div key={idx} className="bg-slate-900/90 border border-slate-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">
                          {incEntry.incident.title || incEntry.incident.id}
                        </span>
                        <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono">
                          {incEntry.incident.severity || 'SEV-1'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        <span className="text-slate-400">Resolution: </span>
                        {incEntry.incident.resolution || 'Documented in postmortem.'}
                      </p>
                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        {incEntry.resolved_by && (
                          <span className="flex items-center gap-1 text-cyan-300">
                            Resolved by: <span className="font-semibold text-slate-200">{incEntry.resolved_by.name}</span>
                          </span>
                        )}
                        {incEntry.document && (
                          <span className="flex items-center gap-1 text-amber-300">
                            <FileText className="h-3 w-3" />
                            Postmortem: <span className="font-semibold text-slate-200">{incEntry.document.title}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Traversed Blast Radius Graph Paths */}
            {data.graph_paths && data.graph_paths.length > 0 && (
              <div className="bg-[#131c31] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <GitFork className="h-4 w-4 text-indigo-400" />
                    Verified FalkorDB Traversal Paths ({data.graph_paths.length})
                  </h4>
                  {onNavigateToGraph && (
                    <button
                      onClick={() => onNavigateToGraph(data.graph_paths)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      Inspect in Knowledge Graph <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {data.graph_paths.map((p, idx) => (
                    <div key={idx} className="bg-slate-900/80 border border-slate-800/80 px-3 py-2 rounded-lg text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-slate-200 font-semibold">{p.source}</span>
                        <span className="text-indigo-400">-[{p.relationship}]-&gt;</span>
                        <span className="text-slate-200 font-semibold">{p.target}</span>
                      </div>
                      {p.impact_type && (
                        <span className="text-[10px] text-slate-500 font-mono uppercase">
                          {p.impact_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Honesty & Limitations Disclaimer */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block mb-1">Knowledge Boundary & Reality Disclaimer</span>
              {data.limitations?.map((lim, idx) => (
                <p key={idx} className="text-[11px] leading-relaxed text-slate-400">
                  • {lim}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Entity Inspector Side Drawer */}
      {inspectedEntity && (
        <aside className="w-80 border-l border-slate-800 bg-[#0f172a] flex flex-col h-full overflow-hidden shadow-2xl z-20 shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Entity Inspector
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-mono border border-rose-500/30">
                Blast Impact
              </span>
            </div>
            <button
              onClick={() => setInspectedEntity(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                {inspectedEntity.type || 'Entity'}
              </span>
              <h3 className="text-sm font-bold text-white">{inspectedEntity.title || inspectedEntity.name}</h3>
              {inspectedEntity.id && (
                <p className="text-[11px] font-mono text-indigo-400 mt-0.5">{inspectedEntity.id}</p>
              )}
            </div>

            {inspectedEntity.impact && (
              <div className="bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg">
                <span className="text-[10px] text-rose-300 uppercase font-bold block mb-0.5">Impact Severity</span>
                <p className="text-rose-200 text-xs font-medium">{inspectedEntity.impact}</p>
                {inspectedEntity.via && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cascading via: <span className="text-indigo-300 font-semibold">{inspectedEntity.via}</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">Entity Details</span>
              <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800 overflow-hidden">
                {Object.entries(inspectedEntity).filter(([k]) => !['type', 'title', 'id', 'impact', 'via'].includes(k)).map(([k, v]) => (
                  <div key={k} className="px-3 py-1.5 flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{k}</span>
                    <span className="text-slate-200 text-[11px] break-words">
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {onNavigateToGraph && (
              <button
                onClick={() => {
                  onNavigateToGraph(data?.graph_paths || []);
                }}
                className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <GitFork className="h-3.5 w-3.5 text-indigo-400" />
                Highlight In Knowledge Graph
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
