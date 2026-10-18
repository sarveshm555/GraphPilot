import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Database, 
  GitFork, 
  ShieldCheck, 
  FileText, 
  Share2, 
  Flame, 
  Search, 
  ArrowRight, 
  Clock, 
  ChevronRight, 
  Server, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Cpu,
  CornerDownRight,
  Maximize2
} from 'lucide-react';
import { OverviewMetrics, GroundedAnswer } from '../types';
import { InteractiveGraph } from './InteractiveGraph';
import { sendChatMessage } from '../services/api';

interface OverviewDashboardProps {
  overview: OverviewMetrics | null;
  graphData: { nodes: any[]; edges: any[] };
  graphLoading: boolean;
  docCount: number;
  onNavigateToTab: (tab: any) => void;
  onNavigateToBlastRadius: (systemId: string) => void;
  onAskQuestionInChat: (question: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  overview,
  graphData,
  graphLoading,
  docCount,
  onNavigateToTab,
  onNavigateToBlastRadius,
  onAskQuestionInChat
}) => {
  // Local quick query state in Overview
  const [quickQuery, setQuickQuery] = useState('');
  const [compactChatLoading, setCompactChatLoading] = useState(false);
  const [compactAnswer, setCompactAnswer] = useState<GroundedAnswer | null>(null);
  const [compactError, setCompactError] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<any[]>([]);

  const exampleQuestions = [
    "Which systems depend on the Payment API?",
    "Who has previously handled incidents affecting the Payment API?",
    "What evidence supports the resolution of Incident INC-101?",
    "Which projects are connected to the Transaction Database?",
    "How is Project Alpha connected to Engineer Priya?",
    "Which systems depend on Project Omega?"
  ];

  const handleQuickAsk = async (qText?: string) => {
    const query = qText || quickQuery;
    if (!query.trim()) return;
    
    setCompactChatLoading(true);
    setCompactError(null);
    try {
      const res = await sendChatMessage(query);
      setCompactAnswer(res);
      if (res.graph_paths && res.graph_paths.length > 0) {
        setHighlightedPath(res.graph_paths);
      }
    } catch (err: any) {
      setCompactError(err.message || 'Failed to query graph');
    } finally {
      setCompactChatLoading(false);
    }
  };

  const coreSystems = [
    { id: 'sys-payment-api', name: 'Payment API', tier: 'Tier-0 Central Gateway', criticality: 'CRITICAL', owner: 'Payments Engineering', deps: 2 },
    { id: 'sys-trans-db', name: 'Transaction Database', tier: 'Tier-0 ACID Ledger', criticality: 'CRITICAL', owner: 'Platform Infrastructure', deps: 3 },
    { id: 'sys-fraud-engine', name: 'Fraud Detection Service', tier: 'Tier-1 Real-time ML', criticality: 'HIGH', owner: 'Platform Infrastructure', deps: 1 },
    { id: 'sys-notification-svc', name: 'Notification Service', tier: 'Tier-2 Webhook Gateway', criticality: 'MEDIUM', owner: 'Platform Infrastructure', deps: 1 }
  ];

  const recentIncidents = [
    {
      id: 'INC-101',
      title: 'Payment Gateway Timeout Spikes',
      sev: 'SEV-1',
      status: 'RESOLVED',
      summary: 'Connection pool exhausted under burst load. Resolved by Staff Engineer Priya Sharma with HikariCP pool resizing & idle reaper tuning.',
      doc: 'DOC-201',
      system: 'Payment API'
    },
    {
      id: 'INC-102',
      title: 'Transaction Ledger Read Replica Lag',
      sev: 'SEV-2',
      status: 'MITIGATED',
      summary: 'Replication buffer overrun during end-of-quarter reconciliation batches. Buffer increased to 2GB by Platform Infrastructure.',
      doc: 'DOC-202',
      system: 'Transaction DB'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cyber-grid bg-radial-ambient select-none">
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1628]/95 via-[#07111F]/95 to-[#050B16]/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Glow ambient background orbs */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#6D4AFF]/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 h-60 w-60 rounded-full bg-[#00D9FF]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6D4AFF] to-[#00D9FF] text-white shadow-lg shadow-[#6D4AFF]/30">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Explainable AI Company Brain
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6D4AFF]/20 text-[#6D4AFF] border border-[#6D4AFF]/40 font-bold">
                    FalkorDB Inside
                  </span>
                </h1>
                <p className="text-xs text-[#94A8C7]">
                  Context for AI Agents • Deterministic Graph Traversal & Verifiable Architecture Provenance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-[#00D6A0]/10 text-[#00D6A0] border border-[#00D6A0]/30 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D6A0] animate-ping" />
                Zero Hallucination Traversal
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#287BFF]/10 text-[#287BFF] border border-[#287BFF]/30 font-semibold">
                Cypher-Grounded
              </span>
            </div>
          </div>

          {/* Quick Query Input */}
          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickQuery}
                  onChange={e => setQuickQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && quickQuery.trim()) {
                      handleQuickAsk();
                    }
                  }}
                  placeholder="Ask Company Brain (e.g. Which systems depend on Payment API? Or who resolved INC-101?)"
                  className="w-full bg-[#050B16]/90 border border-white/10 focus:border-[#6D4AFF] rounded-xl px-4 py-3 text-xs text-[#F4F7FF] placeholder-[#5E718D] focus:outline-none shadow-inner transition-colors"
                />
              </div>

              <button
                onClick={() => handleQuickAsk()}
                disabled={compactChatLoading || !quickQuery.trim()}
                className="bg-gradient-to-r from-[#6D4AFF] to-[#287BFF] hover:opacity-95 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#6D4AFF]/25 shrink-0 cursor-pointer"
              >
                {compactChatLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Query Brain</span>
              </button>

              <button
                onClick={() => {
                  if (quickQuery.trim()) {
                    onAskQuestionInChat(quickQuery);
                  } else {
                    onNavigateToTab('chat');
                  }
                }}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#94A8C7] hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
                title="Open in AI Assistant Workspace"
              >
                <span>Full Chat</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Suggested Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
              <span className="text-[#5E718D] text-[10px] font-mono mr-1">PROMPT PRESETS:</span>
              {exampleQuestions.slice(0, 4).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuickQuery(q);
                    handleQuickAsk(q);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#0B1628] hover:bg-[#101D32] border border-white/5 hover:border-[#6D4AFF]/40 text-[#94A8C7] hover:text-[#F4F7FF] text-[11px] transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Entities */}
        <div 
          onClick={() => onNavigateToTab('entities')}
          className="bg-[#0B1628]/90 hover:bg-[#101D32] border border-white/5 hover:border-[#287BFF]/40 rounded-2xl p-4.5 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-[#94A8C7] mb-2">
            <span className="text-xs font-semibold tracking-wide">Graph Entities</span>
            <div className="p-2 rounded-xl bg-[#287BFF]/10 text-[#287BFF] group-hover:scale-110 transition-transform">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-white tracking-tight">{overview?.total_nodes || 0}</p>
            <span className="text-[10px] font-mono text-[#00D6A0] font-semibold">9 Labels</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-[#5E718D] flex justify-between">
            <span>Systems, Teams, People</span>
            <ArrowRight className="h-3 w-3 text-[#287BFF] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 2: Relationships */}
        <div 
          onClick={() => onNavigateToTab('graph')}
          className="bg-[#0B1628]/90 hover:bg-[#101D32] border border-white/5 hover:border-[#6D4AFF]/40 rounded-2xl p-4.5 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-[#94A8C7] mb-2">
            <span className="text-xs font-semibold tracking-wide">Explicit Edges</span>
            <div className="p-2 rounded-xl bg-[#6D4AFF]/10 text-[#6D4AFF] group-hover:scale-110 transition-transform">
              <GitFork className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-[#6D4AFF] tracking-tight">{overview?.total_relationships || 0}</p>
            <span className="text-[10px] font-mono text-[#00D9FF] font-semibold">Cypher Verified</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-[#5E718D] flex justify-between">
            <span>DEPENDS_ON, RESOLVED_BY</span>
            <ArrowRight className="h-3 w-3 text-[#6D4AFF] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 3: Verified Memories */}
        <div 
          onClick={() => onNavigateToTab('memory')}
          className="bg-[#0B1628]/90 hover:bg-[#101D32] border border-white/5 hover:border-[#00D6A0]/40 rounded-2xl p-4.5 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-[#94A8C7] mb-2">
            <span className="text-xs font-semibold tracking-wide">Verified Findings</span>
            <div className="p-2 rounded-xl bg-[#00D6A0]/10 text-[#00D6A0] group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-[#00D6A0] tracking-tight">{overview?.verified_memories || 0}</p>
            <span className="text-[10px] font-mono text-[#00D6A0] font-semibold">Active Memory</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-[#5E718D] flex justify-between">
            <span>Cross-Session Provenance</span>
            <ArrowRight className="h-3 w-3 text-[#00D6A0] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 4: Ingested Docs */}
        <div 
          onClick={() => onNavigateToTab('documents')}
          className="bg-[#0B1628]/90 hover:bg-[#101D32] border border-white/5 hover:border-[#FFB020]/40 rounded-2xl p-4.5 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-[#94A8C7] mb-2">
            <span className="text-xs font-semibold tracking-wide">Ingested Knowledge</span>
            <div className="p-2 rounded-xl bg-[#FFB020]/10 text-[#FFB020] group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-[#FFB020] tracking-tight">{docCount}</p>
            <span className="text-[10px] font-mono text-[#FFB020] font-semibold">Postmortems/ADRs</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-[#5E718D] flex justify-between">
            <span>Regex Entity Extraction</span>
            <ArrowRight className="h-3 w-3 text-[#FFB020] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* 3. Centerpiece Split: Interactive Graph (60%) + Live Assistant Rail (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Columns: Embedded Interactive Knowledge Graph */}
        <div className="lg:col-span-7 bg-[#0B1628] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl h-[560px]">
          <div className="h-12 border-b border-white/5 px-4 bg-[#07111F] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-[#00D9FF]" />
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                Interactive Graph Visualizer
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-[#94A8C7] border border-white/10">
                FalkorDB Subgraph
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('graph')}
              className="text-[11px] font-medium text-[#287BFF] hover:text-[#00D9FF] flex items-center gap-1 transition-colors"
            >
              <span>Full Screen</span>
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 relative">
            <InteractiveGraph
              rawNodes={graphData.nodes}
              rawEdges={graphData.edges}
              isLoading={graphLoading}
              highlightPath={highlightedPath}
              onSelectSystemForBlastRadius={onNavigateToBlastRadius}
            />
          </div>
        </div>

        {/* Right 5 Columns: Compact AI Assistant with Instant Answers */}
        <div className="lg:col-span-5 bg-[#0B1628] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl h-[560px]">
          <div className="h-12 border-b border-white/5 px-4 bg-[#07111F] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#6D4AFF]" />
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                Cypher Reasoning Engine
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#6D4AFF]/20 text-[#6D4AFF] border border-[#6D4AFF]/30 font-semibold">
                Grounded
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('chat')}
              className="text-[11px] font-medium text-[#6D4AFF] hover:text-[#94A8C7] flex items-center gap-1 transition-colors"
            >
              <span>Open Workspace</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {compactChatLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 text-center py-12">
                <div className="h-8 w-8 rounded-full border-2 border-[#6D4AFF]/20 border-t-[#6D4AFF] animate-spin" />
                <p className="text-xs font-medium text-[#F4F7FF]">Traversing FalkorDB Graph...</p>
                <p className="text-[11px] text-[#5E718D] font-mono">Executing parameterized Cypher pattern</p>
              </div>
            ) : compactAnswer ? (
              <div className="space-y-4">
                {/* Outcome Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#5E718D]">Graph Result</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    compactAnswer.outcome === 'answered_with_path' 
                      ? 'bg-[#00D6A0]/10 text-[#00D6A0] border-[#00D6A0]/30' 
                      : 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                  }`}>
                    {compactAnswer.outcome.toUpperCase()}
                  </span>
                </div>

                {/* Answer Text */}
                <div className="bg-[#050B16] border border-white/5 rounded-xl p-3.5 text-xs text-[#F4F7FF] leading-relaxed shadow-inner">
                  {compactAnswer.answer}
                </div>

                {/* Graph Paths Highlight Indicator */}
                {compactAnswer.graph_paths && compactAnswer.graph_paths.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider block">
                      Active Traversal Path ({compactAnswer.graph_paths.length} hops)
                    </span>
                    <div className="space-y-1 bg-[#050B16] border border-[#00D9FF]/20 rounded-xl p-2.5">
                      {compactAnswer.graph_paths.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[10px] font-mono text-[#94A8C7]">
                          <span className="text-white font-bold">{p.source}</span>
                          <span className="text-[#00D9FF]">-[{p.relationship}]-&gt;</span>
                          <span className="text-white font-bold">{p.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources & Evidence Documentation */}
                {compactAnswer.sources && compactAnswer.sources.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#FFB020] uppercase tracking-wider block">
                      Verified Evidence Documentation ({compactAnswer.sources.length})
                    </span>
                    <div className="space-y-1">
                      {compactAnswer.sources.map((src, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#050B16] border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white truncate">{src.title}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-[#FFB020] border border-white/5">
                              {src.id}
                            </span>
                          </div>
                          {src.excerpt && (
                            <p className="text-[10px] text-[#94A8C7] line-clamp-2 leading-relaxed italic">
                              "{src.excerpt}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {compactAnswer.recommendations && compactAnswer.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#FFB020] uppercase tracking-wider block">
                      AI Recommended Action
                    </span>
                    <div className="space-y-1">
                      {compactAnswer.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/20 text-[11px] text-[#FFB020] flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : compactError ? (
              <div className="p-3 rounded-xl bg-[#FF5370]/10 border border-[#FF5370]/30 text-xs text-[#FF5370] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Traversal Error</span>
                </div>
                <p className="text-[11px] opacity-90">{compactError}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-3">
                <div className="p-3 rounded-2xl bg-white/5 text-[#6D4AFF]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Instant Graph Reasoning</h4>
                <p className="text-xs text-[#94A8C7] max-w-xs">
                  Type a prompt above or click any suggested chip to execute a parameterized multi-hop Cypher query on FalkorDB.
                </p>
                <div className="space-y-1.5 w-full pt-2">
                  {exampleQuestions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuickQuery(q);
                        handleQuickAsk(q);
                      }}
                      className="w-full text-left p-2 rounded-lg bg-[#050B16] hover:bg-white/5 border border-white/5 hover:border-[#6D4AFF]/30 text-[11px] text-[#94A8C7] hover:text-[#F4F7FF] transition-all flex items-center justify-between"
                    >
                      <span className="truncate">{q}</span>
                      <CornerDownRight className="h-3 w-3 text-[#6D4AFF] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Lower Section: Entity Distribution + Live Systems + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Entity Breakdown */}
        <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#287BFF]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Entity Distribution
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#5E718D]">FalkorDB Node Labels</span>
          </div>

          <div className="space-y-2.5">
            {overview && Object.entries(overview.node_type_distribution).map(([label, count]) => {
              const total = overview.total_nodes || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#94A8C7]">{label}</span>
                    <span className="font-mono text-white text-[11px]">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#050B16] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#287BFF] to-[#6D4AFF] rounded-full" 
                      style={{ width: `${Math.max(pct, 5)}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Core Infrastructure Systems */}
        <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-[#00D9FF]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Tier-0 Core Systems
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#5E718D]">Impact Simulation</span>
          </div>

          <div className="space-y-2">
            {coreSystems.map(sys => (
              <div 
                key={sys.id}
                onClick={() => onNavigateToBlastRadius(sys.id)}
                className="p-2.5 rounded-xl bg-[#050B16] hover:bg-white/5 border border-white/5 hover:border-[#FF5370]/40 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-[#00D9FF] transition-colors">
                      {sys.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-[#5E718D] border border-white/5">
                      {sys.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5E718D] mt-0.5">{sys.tier} • {sys.owner}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    sys.criticality === 'CRITICAL' ? 'bg-[#FF5370]/10 text-[#FF5370] border-[#FF5370]/30' :
                    'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                  }`}>
                    {sys.criticality}
                  </span>
                  <Flame className="h-3.5 w-3.5 text-[#FF5370] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Historical Incidents & Resolutions */}
        <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FF5370]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Historical Postmortems
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#5E718D]">Verifiable Findings</span>
          </div>

          <div className="space-y-2.5">
            {recentIncidents.map(inc => (
              <div 
                key={inc.id}
                onClick={() => onAskQuestionInChat(`What evidence supports the resolution of Incident ${inc.id}?`)}
                className="p-3 rounded-xl bg-[#050B16] hover:bg-white/5 border border-white/5 hover:border-[#6D4AFF]/40 cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-[#6D4AFF] transition-colors">
                    {inc.id}: {inc.title}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#00D6A0]/10 text-[#00D6A0] border border-[#00D6A0]/30">
                    {inc.sev} {inc.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#94A8C7] line-clamp-2 leading-relaxed">
                  {inc.summary}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-[#5E718D]">
                  <span>System: <strong className="text-[#00D9FF]">{inc.system}</strong></span>
                  <span>Doc: <strong className="text-[#FFB020]">{inc.doc}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Architectural Callout Banner */}
      <div className="bg-gradient-to-r from-[#0B1628] via-[#101D32] to-[#0B1628] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00D6A0]" />
            Why FalkorDB Graph Traversal Eliminates LLM Hallucinations
          </h4>
          <p className="text-xs text-[#94A8C7] leading-relaxed">
            Vector search models retrieve semantically similar document fragments, risking speculative synthesis.
            In contrast, GraphPilot executes strict Cypher multi-hop traversals over <code className="text-[#00D9FF] font-mono font-semibold">DEPENDS_ON</code>, <code className="text-[#6D4AFF] font-mono font-semibold">RESOLVED_BY</code>, and <code className="text-[#00D6A0] font-mono font-semibold">USES</code> relationships, guaranteeing every stated dependency and incident resolution corresponds to an explicit path in FalkorDB.
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab('traversal')}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 shrink-0 transition-colors"
        >
          <span>View Multi-Hop Chains</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#00D9FF]" />
        </button>
      </div>
    </div>
  );
};
