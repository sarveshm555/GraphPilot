import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Cpu, 
  Wrench, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  Info,
  Sliders
} from 'lucide-react';
import { OverviewMetrics } from '../types';
import { testLlmConnection } from '../services/api';

interface SettingsViewProps {
  overview: OverviewMetrics | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  overview,
  onRefresh,
  isRefreshing
}) => {
  const isFalkorLive = overview?.health?.indicator === 'connected';
  const isLlmActive = overview?.llm?.status === 'llm_active';

  const [isTestingLlm, setIsTestingLlm] = useState(false);
  const [testResult, setTestResult] = useState<{
    provider: string;
    model?: string;
    status: string;
    message: string;
    error_type?: string;
  } | null>(null);

  const handleTestLlm = async () => {
    setIsTestingLlm(true);
    setTestResult(null);
    try {
      const res = await testLlmConnection();
      setTestResult(res);
      onRefresh();
    } catch (err: any) {
      setTestResult({
        provider: overview?.llm?.provider || 'unknown',
        status: 'error',
        message: err.message || 'Failed to ping LLM provider'
      });
      onRefresh();
    } finally {
      setIsTestingLlm(false);
    }
  };

  const cypherTools = [
    {
      name: 'get_system_dependencies',
      description: 'Executes MATCH (s:System {id: $id})-[:DEPENDS_ON*1..2]->(d:System) to discover upstream and downstream infrastructure.',
      category: 'Topological Traversal'
    },
    {
      name: 'get_incident_history',
      description: 'Executes MATCH (i:Incident)-[:AFFECTED]->(s:System {id: $id}) to retrieve past postmortems and severity ratings.',
      category: 'Reliability Intelligence'
    },
    {
      name: 'get_incident_resolution',
      description: 'Executes MATCH (i:Incident {id: $id})-[:RESOLVED_BY]->(p), (i)-[:DOCUMENTED_IN]->(d) to extract verified evidence.',
      category: 'Provenance Audit'
    },
    {
      name: 'get_project_connections',
      description: 'Executes MATCH (p:Project {id: $id})-[:USES]->(s:System) to map business initiatives to underlying services.',
      category: 'Entity Relationship'
    },
    {
      name: 'find_path_between_entities',
      description: 'Executes shortest path discovery between arbitrary nodes to reveal indirect connections and team handoffs.',
      category: 'Multi-Hop Pathing'
    },
    {
      name: 'simulate_blast_radius',
      description: 'Simulates cascading component failure to evaluate direct projects, transitive dependents, and on-call owners.',
      category: 'Reliability Simulation'
    },
    {
      name: 'query_persistent_memory',
      description: 'Searches verified cross-session findings stored in FalkorDB with verification status filters.',
      category: 'Episodic Memory'
    },
    {
      name: 'search_entity_directory',
      description: 'Indexes all 9 graph labels with fuzzy substring matching and live relationship connection counts.',
      category: 'Global Index'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cyber-grid bg-radial-ambient select-none">
      {/* Header */}
      <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#6D4AFF]" />
            <h2 className="text-lg font-bold text-white">Engine Configuration & Diagnostics</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6D4AFF]/10 text-[#6D4AFF] border border-[#6D4AFF]/30 font-semibold">
              Live System Telemetry
            </span>
          </div>
          <p className="text-xs text-[#94A8C7]">
            Inspect runtime FalkorDB connectivity, AI agent reasoning configuration, and registered Cypher graph tools.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#00D9FF]' : ''}`} />
          <span>Ping Engines</span>
        </button>
      </div>

      {/* 2-Column: FalkorDB Settings + LLM Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FalkorDB Configuration Card */}
        <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-[#287BFF]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                FalkorDB Graph Engine
              </h3>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isFalkorLive ? 'bg-[#00D6A0]/10 text-[#00D6A0] border-[#00D6A0]/30' :
              'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
            }`}>
              {isFalkorLive ? 'CONNECTED LIVE' : 'IN-MEMORY FALLBACK'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Engine Backend</span>
              <span className="font-mono text-white font-semibold">{overview?.health?.backend || 'falkordb-server'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Database Endpoint</span>
              <span className="font-mono text-[#00D9FF] font-semibold">{overview?.health?.host || 'localhost'}:{overview?.health?.port || 6379}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Graph Space Name</span>
              <span className="font-mono text-[#6D4AFF] font-semibold">{overview?.health?.graph_name || 'graphpilot'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Active Node Count</span>
              <span className="font-mono text-white font-semibold">{overview?.total_nodes || 0} nodes</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Active Relationship Count</span>
              <span className="font-mono text-white font-semibold">{overview?.total_relationships || 0} edges</span>
            </div>
          </div>
        </div>

        {/* AI Agent Configuration Card */}
        <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#6D4AFF]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Agent & LLM Provider
              </h3>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              overview?.llm?.status === 'llm_active' ? 'bg-[#00D6A0]/10 text-[#00D6A0] border-[#00D6A0]/30' :
              overview?.llm?.status === 'error' ? 'bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/30' :
              overview?.llm?.status === 'misconfigured' ? 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30' :
              'bg-[#6D4AFF]/10 text-[#6D4AFF] border-[#6D4AFF]/30'
            }`}>
              {overview?.llm?.status === 'llm_active' ? 'LIVE OPENAI' :
               overview?.llm?.status === 'error' ? 'LLM ERROR' :
               overview?.llm?.status === 'misconfigured' ? 'KEY MISSING' :
               'DETERMINISTIC DEMO'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Provider</span>
              <span className="font-mono text-white font-semibold">{overview?.llm?.provider || 'mock'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Model Identifier</span>
              <span className="font-mono text-[#00D9FF] font-semibold">{overview?.llm?.model || 'gpt-4o-mini'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Request Timeout</span>
              <span className="font-mono text-white font-semibold">{overview?.llm?.timeout_seconds || 30}s</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050B16] border border-white/5">
              <span className="text-[#94A8C7]">Function / Tool Calling</span>
              <span className="font-mono text-[#00D6A0] font-semibold">
                {overview?.llm?.tool_calling_enabled ? 'ENABLED (8 Cypher Tools)' : 'DISABLED'}
              </span>
            </div>

            {overview?.llm?.error && (
              <div className="p-3 rounded-xl bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block">
                  Configuration / Runtime Error
                </span>
                <p className="text-[11px] leading-relaxed break-words">{overview.llm.error}</p>
              </div>
            )}

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleTestLlm}
                disabled={isTestingLlm}
                className="w-full py-2.5 px-3 rounded-xl bg-[#6D4AFF]/20 hover:bg-[#6D4AFF]/30 border border-[#6D4AFF]/40 text-xs font-semibold text-[#F4F7FF] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#00D9FF] ${isTestingLlm ? 'animate-spin' : ''}`} />
                <span>{isTestingLlm ? 'Pinging LLM Provider...' : 'Test LLM Provider Connectivity'}</span>
              </button>

              {testResult && (
                <div className={`p-2.5 rounded-xl border text-xs font-mono ${
                  testResult.status === 'llm_active' || testResult.status === 'mock_offline'
                    ? 'bg-[#00D6A0]/10 border-[#00D6A0]/30 text-[#00D6A0]'
                    : 'bg-[#FF4D4D]/10 border-[#FF4D4D]/30 text-[#FF4D4D]'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{testResult.status === 'llm_active' ? '✓ Connected' : testResult.status === 'mock_offline' ? '✓ Mock Active' : '✕ Error'}</span>
                    <span className="text-[10px] text-[#94A8C7]">({testResult.provider})</span>
                  </div>
                  <div className="text-[11px] mt-1">{testResult.message}</div>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#050B16] border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#FFB020] uppercase tracking-wider block">
                Deterministic Fallback & OpenAI Grounding
              </span>
              <p className="text-[11px] text-[#94A8C7] leading-relaxed">
                GraphPilot supports both offline deterministic demo mode and live OpenAI function calling. When OpenAI is active, questions are processed via bounded Cypher tool calling against FalkorDB, ensuring all answers are grounded in explicit graph relationships. If OpenAI requests fail, GraphPilot halts inference to eliminate hallucination risk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registered Cypher Tools Directory */}
      <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[#00D9FF]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Registered Cypher Graph Tools (8 Active)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#00D6A0] font-semibold">Strict Typing Verified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cypherTools.map((tool, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#050B16] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono font-bold text-[#00D9FF]">{tool.name}</code>
                <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded text-[#5E718D] border border-white/5">
                  {tool.category}
                </span>
              </div>
              <p className="text-[11px] text-[#94A8C7] leading-relaxed">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
