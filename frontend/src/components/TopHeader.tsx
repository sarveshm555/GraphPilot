import React from 'react';
import { 
  RefreshCw, 
  Search, 
  Sparkles, 
  Database, 
  ChevronRight, 
  Command, 
  ShieldCheck,
  Server
} from 'lucide-react';
import { OverviewMetrics } from '../types';
import { NavTabId } from './Sidebar';

interface TopHeaderProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  overview: OverviewMetrics | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenQuickSearch?: () => void;
}

const tabTitles: Record<NavTabId, { title: string; subtitle: string; category: string }> = {
  overview: { title: 'Command Center', subtitle: 'Explainable AI Company Brain powered by FalkorDB', category: 'Intelligence' },
  chat: { title: 'AI Company Assistant', subtitle: 'Cypher-grounded reasoning with explicit provenance', category: 'Intelligence' },
  graph: { title: 'Interactive Knowledge Graph', subtitle: 'Direct node & relationship explorer with subgraph inspection', category: 'Graph Exploration' },
  traversal: { title: 'Traversal Explorer', subtitle: 'Multi-hop graph paths and structural connectivity verification', category: 'Graph Exploration' },
  entities: { title: 'Global Entity Directory', subtitle: 'Search and inspect all 9 entity labels in FalkorDB', category: 'Graph Exploration' },
  blast: { title: 'Blast Radius Analyzer', subtitle: 'Cascading dependency outage and transitive impact simulation', category: 'Reliability & Ops' },
  incidents: { title: 'Incident Postmortem Analysis', subtitle: 'Historical outages, resolved root-causes, and engineering owners', category: 'Reliability & Ops' },
  dependencies: { title: 'System Dependency Matrix', subtitle: 'Tier-0, Tier-1, and Tier-2 architectural topology', category: 'Reliability & Ops' },
  documents: { title: 'Knowledge Ingestion Pipeline', subtitle: 'Upload postmortems and ADRs with automated entity extraction', category: 'Knowledge Base' },
  reports: { title: 'Reports & Insights', subtitle: 'Comprehensive company graph statistics and governance audit', category: 'Knowledge Base' },
  memory: { title: 'Persistent Company Memory', subtitle: 'Cross-session findings verification and continuous learning', category: 'Knowledge Base' },
  settings: { title: 'Settings & Diagnostics', subtitle: 'FalkorDB instance configuration, LLM keys, and Cypher tools', category: 'Knowledge Base' }
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  overview,
  onRefresh,
  isRefreshing,
  onOpenQuickSearch
}) => {
  const current = tabTitles[activeTab] || tabTitles.overview;
  const isFalkorLive = overview?.health?.indicator === 'connected';

  return (
    <header className="h-16 border-b border-white/5 bg-[#07111F]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Breadcrumbs & View Meta */}
      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs text-[#5E718D] font-mono gap-1.5">
          <span>GraphPilot</span>
          <ChevronRight className="h-3 w-3 text-[#5E718D]" />
          <span className="text-[#94A8C7]">{current.category}</span>
          <ChevronRight className="h-3 w-3 text-[#5E718D]" />
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div>
          <h2 className="text-sm font-bold text-[#F4F7FF] flex items-center gap-2">
            {current.title}
            <span className="text-[10px] font-normal text-[#94A8C7] hidden md:inline">
              — {current.subtitle}
            </span>
          </h2>
        </div>
      </div>

      {/* Right: Quick Search, Engine Telemetry Badge, Refresh */}
      <div className="flex items-center gap-3">
        {/* Quick Search Bar */}
        <button
          onClick={onOpenQuickSearch || (() => setActiveTab('entities'))}
          className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0B1628] border border-white/5 hover:border-[#6D4AFF]/40 text-[#94A8C7] hover:text-[#F4F7FF] text-xs transition-colors shadow-inner"
        >
          <Search className="h-3.5 w-3.5 text-[#287BFF]" />
          <span className="text-[11px]">Search entities, systems, docs...</span>
          <div className="flex items-center gap-0.5 text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-[#5E718D]">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </button>

        {/* FalkorDB Live Status Indicator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1628] border border-white/5 text-xs font-mono">
          <div className="relative flex items-center justify-center">
            <span className={`h-2 w-2 rounded-full ${isFalkorLive ? 'bg-[#00D6A0]' : 'bg-[#FFB020]'}`} />
            {isFalkorLive && (
              <span className="absolute h-2 w-2 rounded-full bg-[#00D6A0] animate-ping opacity-75" />
            )}
          </div>
          <span className="text-[11px] font-semibold text-[#F4F7FF] hidden sm:inline">
            {isFalkorLive ? 'FalkorDB' : 'In-Memory Fallback'}
          </span>
          <span className="text-[10px] text-[#5E718D] hidden md:inline">
            ({overview?.total_nodes || 0} nodes)
          </span>
        </div>

        {/* AI Agent Mode Indicator Pill */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1628] border border-white/5 text-xs font-mono"
          title={
            overview?.llm?.status === 'llm_active' 
              ? `Live OpenAI (${overview?.llm?.model || 'gpt-4o-mini'}) - 8 Cypher tools active`
              : overview?.llm?.status === 'error'
              ? `LLM Error: ${overview?.llm?.error || 'Execution failed'}`
              : overview?.llm?.status === 'misconfigured'
              ? 'LLM Key Missing: Set OPENAI_API_KEY in .env'
              : 'Deterministic Offline Demo Mode: No external key required'
          }
        >
          <div className="relative flex items-center justify-center">
            <span className={`h-2 w-2 rounded-full ${
              overview?.llm?.status === 'llm_active' ? 'bg-[#00D6A0]' :
              overview?.llm?.status === 'error' ? 'bg-[#FF4D4D]' :
              overview?.llm?.status === 'misconfigured' ? 'bg-[#FFB020]' :
              'bg-[#6D4AFF]'
            }`} />
            {overview?.llm?.status === 'llm_active' && (
              <span className="absolute h-2 w-2 rounded-full bg-[#00D6A0] animate-ping opacity-75" />
            )}
          </div>
          <span className="text-[11px] font-semibold text-[#F4F7FF] hidden sm:inline">
            {overview?.llm?.status === 'llm_active' ? `OpenAI (${overview?.llm?.model || 'gpt-4o-mini'})` :
             overview?.llm?.status === 'error' ? 'LLM Error' :
             overview?.llm?.status === 'misconfigured' ? 'Key Missing' :
             'Deterministic Demo'}
          </span>
        </div>

        {/* Refresh Graph Data Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-white/5 rounded-xl text-[#94A8C7] hover:text-white border border-white/5 hover:border-white/10 transition-colors disabled:opacity-50"
          title="Refresh Graph and Telemetry Data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#00D9FF]' : ''}`} />
        </button>
      </div>
    </header>
  );
};
