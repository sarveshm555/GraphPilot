import React from 'react';
import { 
  Layers, 
  MessageSquare, 
  Share2, 
  GitFork, 
  Search, 
  Flame, 
  ShieldAlert, 
  Network, 
  FileText, 
  BarChart3, 
  Database, 
  Settings, 
  PanelLeftClose, 
  PanelLeft, 
  Compass, 
  Cpu, 
  Server
} from 'lucide-react';
import { OverviewMetrics } from '../types';

export type NavTabId = 
  | 'overview' 
  | 'chat' 
  | 'graph' 
  | 'traversal' 
  | 'entities' 
  | 'blast' 
  | 'incidents' 
  | 'dependencies' 
  | 'documents' 
  | 'reports' 
  | 'memory' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  overview: OverviewMetrics | null;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  overview
}) => {
  const navGroups: NavGroup[] = [
    {
      group: 'INTELLIGENCE',
      items: [
        { id: 'overview', label: 'Overview', icon: Layers },
        { id: 'chat', label: 'AI Assistant', icon: MessageSquare, badge: 'Cypher AI', badgeColor: 'bg-[#6D4AFF]/20 text-[#6D4AFF] border-[#6D4AFF]/30' },
      ]
    },
    {
      group: 'GRAPH EXPLORATION',
      items: [
        { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
        { id: 'traversal', label: 'Traversal Explorer', icon: GitFork, badge: 'Multi-Hop', badgeColor: 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/30' },
        { id: 'entities', label: 'Entity Directory', icon: Search },
      ]
    },
    {
      group: 'RELIABILITY & OPS',
      items: [
        { id: 'blast', label: 'Blast Radius', icon: Flame, badge: 'Cascade', badgeColor: 'bg-[#FF5370]/20 text-[#FF5370] border-[#FF5370]/30' },
        { id: 'incidents', label: 'Incident Analysis', icon: ShieldAlert },
        { id: 'dependencies', label: 'System Dependencies', icon: Network },
      ]
    },
    {
      group: 'KNOWLEDGE BASE',
      items: [
        { id: 'documents', label: 'Knowledge Ingestion', icon: FileText },
        { id: 'reports', label: 'Reports & Insights', icon: BarChart3 },
        { id: 'memory', label: 'Persistent Memory', icon: Database, badge: `${overview?.verified_memories || 0}`, badgeColor: 'bg-[#00D6A0]/20 text-[#00D6A0] border-[#00D6A0]/30' },
        { id: 'settings', label: 'Settings & Engine', icon: Settings },
      ]
    }
  ];

  const isFalkorLive = overview?.health?.indicator === 'connected';
  const isLlmActive = overview?.llm?.status === 'llm_active';

  return (
    <aside 
      className={`${
        collapsed ? 'w-18' : 'w-64'
      } border-r border-white/5 bg-[#07111F] flex flex-col justify-between p-3 shrink-0 transition-all duration-300 ease-in-out relative z-30 select-none`}
    >
      <div className="flex flex-col h-[calc(100%-140px)]">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1 mb-5 pt-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative flex items-center justify-center">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#6D4AFF] via-[#287BFF] to-[#00D9FF] flex items-center justify-center text-white shadow-lg shadow-[#6D4AFF]/30 shrink-0">
                <Compass className="h-5 w-5 animate-pulse-slow" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00D6A0] ring-2 ring-[#07111F]" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold tracking-wider text-white">GRAPHPILOT</h1>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#6D4AFF]/20 text-[#6D4AFF] border border-[#6D4AFF]/30 font-bold">
                    v2.4
                  </span>
                </div>
                <p className="text-[10px] text-[#94A8C7] truncate font-medium">Company Brain • FalkorDB</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-[#94A8C7] hover:text-white transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-4 pr-1">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-[#5E718D] uppercase">
                  {group.group}
                </div>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-0' : 'justify-between px-3'
                    } py-2 rounded-xl text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6D4AFF]/20 via-[#287BFF]/10 to-transparent text-[#F4F7FF] border border-[#6D4AFF]/40 shadow-sm shadow-[#6D4AFF]/10'
                        : 'text-[#94A8C7] hover:text-[#F4F7FF] hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-lg transition-colors ${
                        isActive ? 'text-[#00D9FF]' : 'text-[#94A8C7] group-hover:text-white'
                      }`}>
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Active vertical pill indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-[#6D4AFF] to-[#00D9FF]" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Engine Status Bottom Telemetry */}
      <div className="pt-3 border-t border-white/5 shrink-0">
        {!collapsed ? (
          <div className="space-y-2">
            {/* FalkorDB Telemetry Card */}
            <div className="bg-[#0B1628] border border-white/5 rounded-xl p-2.5 text-xs hover:border-[#6D4AFF]/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#94A8C7] flex items-center gap-1.5">
                  <Server className="h-3 w-3 text-[#287BFF]" />
                  FalkorDB
                </span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                  isFalkorLive 
                    ? 'bg-[#00D6A0]/10 text-[#00D6A0] border-[#00D6A0]/30' 
                    : 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isFalkorLive ? 'bg-[#00D6A0] animate-pulse' : 'bg-[#FFB020]'}`} />
                  {isFalkorLive ? 'CONNECTED' : 'IN-MEMORY'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#5E718D] pt-1">
                <span>{overview?.health?.host || 'localhost'}:{overview?.health?.port || 6379}</span>
                <span className="text-[#94A8C7]">
                  <strong>{overview?.total_nodes || 0}</strong> nodes • <strong>{overview?.total_relationships || 0}</strong> rels
                </span>
              </div>
            </div>

            {/* AI Reasoning Mode Card */}
            <div className="bg-[#0B1628] border border-white/5 rounded-xl p-2.5 text-xs hover:border-[#6D4AFF]/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#94A8C7] flex items-center gap-1.5">
                  <Cpu className="h-3 w-3 text-[#6D4AFF]" />
                  AI Agent Mode
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                  overview?.llm?.status === 'llm_active' 
                    ? 'bg-[#00D6A0]/10 text-[#00D6A0] border-[#00D6A0]/30' 
                    : overview?.llm?.status === 'error'
                    ? 'bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/30'
                    : overview?.llm?.status === 'misconfigured'
                    ? 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                    : 'bg-[#6D4AFF]/10 text-[#6D4AFF] border-[#6D4AFF]/30'
                }`}>
                  {overview?.llm?.status === 'llm_active' ? 'LIVE OPENAI' :
                   overview?.llm?.status === 'error' ? 'LLM ERROR' :
                   overview?.llm?.status === 'misconfigured' ? 'KEY MISSING' :
                   'DETERMINISTIC DEMO'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#5E718D] pt-1">
                <span>{overview?.llm?.provider || 'mock'} ({overview?.llm?.model || 'gpt-4o-mini'})</span>
                <span className="text-[#00D9FF] font-semibold">8 Cypher Tools</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-1">
            <span 
              className={`h-2.5 w-2.5 rounded-full ${isFalkorLive ? 'bg-[#00D6A0] ring-2 ring-[#00D6A0]/20' : 'bg-[#FFB020] ring-2 ring-[#FFB020]/20'}`}
              title={isFalkorLive ? "FalkorDB Live: Connected" : "In-Memory Engine Active"} 
            />
            <span 
              className={`h-2.5 w-2.5 rounded-full ${
                overview?.llm?.status === 'llm_active' ? 'bg-[#00D6A0] ring-2 ring-[#00D6A0]/20' :
                overview?.llm?.status === 'error' ? 'bg-[#FF4D4D] ring-2 ring-[#FF4D4D]/20' :
                overview?.llm?.status === 'misconfigured' ? 'bg-[#FFB020] ring-2 ring-[#FFB020]/20' :
                'bg-[#6D4AFF] ring-2 ring-[#6D4AFF]/20'
              }`}
              title={
                overview?.llm?.status === 'llm_active' ? `Live OpenAI: ${overview?.llm?.model}` :
                overview?.llm?.status === 'error' ? `LLM Error: ${overview?.llm?.error || 'Failed'}` :
                overview?.llm?.status === 'misconfigured' ? 'LLM Key Missing (Set OPENAI_API_KEY)' :
                'Deterministic Demo Mode'
              } 
            />
          </div>
        )}
      </div>
    </aside>
  );
};
