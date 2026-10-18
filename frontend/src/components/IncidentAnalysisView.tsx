import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Server, 
  User, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Flame,
  Search
} from 'lucide-react';

interface IncidentAnalysisViewProps {
  onAskQuestionInChat: (question: string) => void;
  onNavigateToBlastRadius: (systemId: string) => void;
}

export const IncidentAnalysisView: React.FC<IncidentAnalysisViewProps> = ({
  onAskQuestionInChat,
  onNavigateToBlastRadius
}) => {
  const incidents = [
    {
      id: 'INC-101',
      title: 'Payment Gateway Timeout Spikes',
      severity: 'SEV-1',
      status: 'RESOLVED',
      systemId: 'sys-payment-api',
      systemName: 'Payment API',
      timestamp: '2025-01-14T09:42:00Z',
      resolvedBy: 'Priya Sharma (Staff Engineer)',
      resolvedById: 'eng-priya',
      docId: 'DOC-201',
      docTitle: 'Postmortem: INC-101 Connection Pool Exhaustion',
      rootCause: 'HikariCP connection pool exhausted under 300% burst transaction volume due to missing idle connection reapers.',
      resolutionEvidence: 'Max pool size scaled from 50 to 250 connections; idle timeout reduced to 30,000ms with keepalive reapers active.',
      preventativeActions: [
        'Implemented adaptive circuit breaking at ingress edge gateway',
        'Added P99 latency alerts on connection checkout exceeding 50ms',
        'Updated runbook for replica failover procedures'
      ],
      cypherPath: [
        { source: 'Incident INC-101', rel: 'AFFECTED', target: 'Payment API' },
        { source: 'Incident INC-101', rel: 'RESOLVED_BY', target: 'Priya Sharma' },
        { source: 'Incident INC-101', rel: 'DOCUMENTED_IN', target: 'Document DOC-201' }
      ]
    },
    {
      id: 'INC-102',
      title: 'Transaction Ledger Read Replica Lag',
      severity: 'SEV-2',
      status: 'MITIGATED',
      systemId: 'sys-trans-db',
      systemName: 'Transaction Database',
      timestamp: '2025-02-02T16:15:00Z',
      resolvedBy: 'Platform Infrastructure Team',
      resolvedById: 'team-platform-infra',
      docId: 'DOC-202',
      docTitle: 'Incident Report: Transaction DB Replication Buffer Lag',
      rootCause: 'Replication buffer overrun during end-of-quarter batch reconciliation jobs running concurrently with OLTP payment traffic.',
      resolutionEvidence: 'Replication buffer allocated 2GB; batch jobs isolated to secondary read replicas with dedicated query routing.',
      preventativeActions: [
        'Separated OLAP reconciliation queries from real-time ledger writes',
        'Established SLA monitoring on WAL replication lag threshold (>500ms)'
      ],
      cypherPath: [
        { source: 'Incident INC-102', rel: 'AFFECTED', target: 'Transaction Database' },
        { source: 'Incident INC-102', rel: 'RESOLVED_BY', target: 'Platform Infrastructure' },
        { source: 'Incident INC-102', rel: 'DOCUMENTED_IN', target: 'Document DOC-202' }
      ]
    }
  ];

  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);
  const [searchFilter, setSearchFilter] = useState('');

  const filtered = incidents.filter(i => 
    i.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    i.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    i.systemName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cyber-grid bg-radial-ambient select-none">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#FF5370]" />
            <h2 className="text-lg font-bold text-white">Incident Postmortem Analysis</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF5370]/10 text-[#FF5370] border border-[#FF5370]/30 font-semibold">
              FalkorDB :Incident Nodes
            </span>
          </div>
          <p className="text-xs text-[#94A8C7]">
            Every incident record in GraphPilot is connected to affected systems, resolving engineers, and postmortem documentation via explicit graph relationships.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAskQuestionInChat("What evidence supports the resolution of Incident INC-101?")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6D4AFF] to-[#287BFF] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#6D4AFF]/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask AI About Incidents</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Incident List + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3.5 top-3 text-[#5E718D]" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Filter incidents by ID, title, or system..."
              className="w-full bg-[#0B1628] border border-white/10 focus:border-[#6D4AFF] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F4F7FF] placeholder-[#5E718D] focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {filtered.map(inc => {
              const isSelected = selectedIncident.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-[#101D32] border-[#6D4AFF] shadow-lg shadow-[#6D4AFF]/10'
                      : 'bg-[#0B1628] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{inc.id}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        inc.severity === 'SEV-1' ? 'bg-[#FF5370]/10 text-[#FF5370] border-[#FF5370]/30' :
                        'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#00D6A0] font-semibold bg-[#00D6A0]/10 px-2 py-0.2 rounded border border-[#00D6A0]/20">
                      {inc.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-[#F4F7FF] line-clamp-1">
                    {inc.title}
                  </h3>

                  <p className="text-[11px] text-[#94A8C7] line-clamp-2 leading-relaxed">
                    {inc.rootCause}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-[#5E718D]">
                    <span>Target: <strong className="text-[#00D9FF]">{inc.systemName}</strong></span>
                    <span>Resolver: <strong className="text-[#94A8C7]">{inc.resolvedBy.split(' ')[0]}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Incident Inspector */}
        <div className="lg:col-span-7 bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{selectedIncident.id}: {selectedIncident.title}</h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  selectedIncident.severity === 'SEV-1' ? 'bg-[#FF5370]/10 text-[#FF5370] border-[#FF5370]/30' :
                  'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                }`}>
                  {selectedIncident.severity}
                </span>
              </div>
              <p className="text-xs text-[#5E718D] font-mono mt-1">
                Timestamp: {new Date(selectedIncident.timestamp).toUTCString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToBlastRadius(selectedIncident.systemId)}
                className="px-3 py-1.5 rounded-xl bg-[#FF5370]/10 hover:bg-[#FF5370]/20 border border-[#FF5370]/30 text-xs font-semibold text-[#FF5370] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Simulate Outage</span>
              </button>
            </div>
          </div>

          {/* Explicit FalkorDB Relationships Trail */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider block">
              FalkorDB Provenance Graph Edges
            </span>
            <div className="bg-[#050B16] border border-white/5 rounded-xl p-3 space-y-2">
              {selectedIncident.cypherPath.map((edge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-white font-semibold bg-white/5 px-2 py-0.5 rounded">{edge.source}</span>
                  <span className="text-[#00D9FF] font-bold">-[{edge.rel}]-&gt;</span>
                  <span className="text-[#6D4AFF] font-semibold bg-white/5 px-2 py-0.5 rounded">{edge.target}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Root Cause & Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#050B16] border border-white/5 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#FF5370] uppercase tracking-wider block">
                Root Cause Analysis
              </span>
              <p className="text-xs text-[#94A8C7] leading-relaxed">
                {selectedIncident.rootCause}
              </p>
            </div>

            <div className="bg-[#050B16] border border-white/5 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#00D6A0] uppercase tracking-wider block">
                Resolution Evidence
              </span>
              <p className="text-xs text-[#94A8C7] leading-relaxed">
                {selectedIncident.resolutionEvidence}
              </p>
            </div>
          </div>

          {/* Preventative Action Items */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[#FFB020] uppercase tracking-wider block">
              Architectural Action Items & Safeguards
            </span>
            <div className="space-y-2">
              {selectedIncident.preventativeActions.map((action, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#050B16] border border-white/5 flex items-start gap-2.5 text-xs text-[#F4F7FF]">
                  <CheckCircle2 className="h-4 w-4 text-[#00D6A0] shrink-0 mt-0.5" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger in AI Assistant */}
          <div className="pt-2">
            <button
              onClick={() => onAskQuestionInChat(`What evidence supports the resolution of Incident ${selectedIncident.id}?`)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6D4AFF] to-[#287BFF] hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#6D4AFF]/25 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Verify Resolution in AI Company Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
