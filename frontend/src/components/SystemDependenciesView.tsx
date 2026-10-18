import React, { useState } from 'react';
import { 
  Network, 
  Server, 
  Flame, 
  Share2, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  GitFork,
  Users,
  Search,
  CheckCircle2
} from 'lucide-react';

interface SystemDependenciesViewProps {
  onNavigateToBlastRadius: (systemId: string) => void;
  onNavigateToGraph: (systemId: string) => void;
}

export const SystemDependenciesView: React.FC<SystemDependenciesViewProps> = ({
  onNavigateToBlastRadius,
  onNavigateToGraph
}) => {
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'TIER-0' | 'TIER-1' | 'TIER-2'>('ALL');
  const [search, setSearch] = useState('');

  const systems = [
    {
      id: 'sys-payment-api',
      name: 'Payment API',
      tier: 'TIER-0',
      criticality: 'CRITICAL',
      ownerTeam: 'Payments Engineering',
      onCall: 'Priya Sharma (Staff Eng)',
      description: 'Core microservice handling credit card processing, merchant payouts, and balance verification.',
      upstreamDeps: [
        { id: 'sys-trans-db', name: 'Transaction Database', rel: 'DEPENDS_ON' },
        { id: 'sys-fraud-engine', name: 'Fraud Detection Service', rel: 'DEPENDS_ON' }
      ],
      downstreamProjects: [
        { id: 'proj-alpha', name: 'Project Alpha (Checkout Redesign)', rel: 'USES' },
        { id: 'proj-beta', name: 'Project Beta (Mobile App v3)', rel: 'USES' }
      ],
      spof: true,
      sla: '99.99%'
    },
    {
      id: 'sys-trans-db',
      name: 'Transaction Database',
      tier: 'TIER-0',
      criticality: 'CRITICAL',
      ownerTeam: 'Platform Infrastructure',
      onCall: 'Marcus Vance (Principal SRE)',
      description: 'Primary ACID distributed relational store storing transaction records and ledger entries.',
      upstreamDeps: [],
      downstreamProjects: [
        { id: 'sys-payment-api', name: 'Payment API', rel: 'DEPENDS_ON' },
        { id: 'proj-gamma', name: 'Project Gamma (Audit Automation)', rel: 'USES' }
      ],
      spof: true,
      sla: '99.999%'
    },
    {
      id: 'sys-fraud-engine',
      name: 'Fraud Detection Service',
      tier: 'TIER-1',
      criticality: 'HIGH',
      ownerTeam: 'Platform Infrastructure',
      onCall: 'Marcus Vance (Principal SRE)',
      description: 'Real-time risk scoring engine analyzing anomalous transaction telemetry and velocity limits.',
      upstreamDeps: [
        { id: 'sys-trans-db', name: 'Transaction Database', rel: 'DEPENDS_ON' }
      ],
      downstreamProjects: [
        { id: 'sys-payment-api', name: 'Payment API', rel: 'DEPENDS_ON' }
      ],
      spof: false,
      sla: '99.9%'
    },
    {
      id: 'sys-notification-svc',
      name: 'Notification Service',
      tier: 'TIER-2',
      criticality: 'MEDIUM',
      ownerTeam: 'Platform Infrastructure',
      onCall: 'Marcus Vance (Principal SRE)',
      description: 'Asynchronous event bus delivering transactional emails, SMS alerts, and webhooks.',
      upstreamDeps: [],
      downstreamProjects: [
        { id: 'sys-payment-api', name: 'Payment API', rel: 'USES' }
      ],
      spof: false,
      sla: '99.5%'
    }
  ];

  const filtered = systems.filter(s => {
    const matchesTier = selectedTier === 'ALL' || s.tier === selectedTier;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.id.toLowerCase().includes(search.toLowerCase()) ||
                          s.ownerTeam.toLowerCase().includes(search.toLowerCase());
    return matchesTier && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cyber-grid bg-radial-ambient select-none">
      {/* Header */}
      <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-[#287BFF]" />
              <h2 className="text-lg font-bold text-white">System Dependency Matrix</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#287BFF]/10 text-[#287BFF] border border-[#287BFF]/30 font-semibold">
                FalkorDB Architecture Graph
              </span>
            </div>
            <p className="text-xs text-[#94A8C7]">
              Multi-hop topological dependency mapping. Identify upstream service contracts, downstream consumer projects, and Single Points of Failure (SPOF).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'TIER-0', 'TIER-1', 'TIER-2'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  selectedTier === tier
                    ? 'bg-[#287BFF] text-white shadow-lg shadow-[#287BFF]/30'
                    : 'bg-[#050B16] text-[#94A8C7] hover:text-white border border-white/5'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-1">
          <Search className="h-3.5 w-3.5 absolute left-3.5 top-4 text-[#5E718D]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search systems, owning teams, or identifiers..."
            className="w-full bg-[#050B16] border border-white/10 focus:border-[#287BFF] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F4F7FF] placeholder-[#5E718D] focus:outline-none"
          />
        </div>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map(sys => (
          <div 
            key={sys.id}
            className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-[#287BFF]" />
                    <h3 className="text-sm font-bold text-white">{sys.name}</h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-[#5E718D] border border-white/5">
                      {sys.id}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A8C7] mt-1 leading-relaxed">
                    {sys.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                    sys.criticality === 'CRITICAL' ? 'bg-[#FF5370]/10 text-[#FF5370] border-[#FF5370]/30' :
                    sys.criticality === 'HIGH' ? 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30' :
                    'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/30'
                  }`}>
                    {sys.tier} • {sys.criticality}
                  </span>
                  {sys.spof && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FF5370]/10 text-[#FF5370] border border-[#FF5370]/30 flex items-center gap-1">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      SPOF RISK
                    </span>
                  )}
                </div>
              </div>

              {/* Upstream & Downstream Topology */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Upstream Dependencies */}
                <div className="bg-[#050B16] border border-white/5 rounded-xl p-3 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-[#FFB020] uppercase tracking-wider block">
                    Upstream Dependencies ({sys.upstreamDeps.length})
                  </span>
                  {sys.upstreamDeps.length > 0 ? (
                    <div className="space-y-1">
                      {sys.upstreamDeps.map((dep, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono text-[#94A8C7]">
                          <span className="text-[#FFB020] font-bold">DEPENDS_ON</span>
                          <span className="text-white font-medium truncate">{dep.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#5E718D] italic">Root Infrastructure (No upstream deps)</p>
                  )}
                </div>

                {/* Downstream Consumers */}
                <div className="bg-[#050B16] border border-white/5 rounded-xl p-3 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider block">
                    Downstream Consumers ({sys.downstreamProjects.length})
                  </span>
                  {sys.downstreamProjects.length > 0 ? (
                    <div className="space-y-1">
                      {sys.downstreamProjects.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono text-[#94A8C7]">
                          <span className="text-[#00D9FF] font-bold">{p.rel}</span>
                          <span className="text-white font-medium truncate">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#5E718D] italic">No direct consumers mapped</p>
                  )}
                </div>
              </div>

              {/* Ownership & SLA */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-[#5E718D]">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#6D4AFF]" />
                  <span>{sys.ownerTeam}</span>
                  <span className="text-white font-medium">({sys.onCall})</span>
                </span>
                <span className="font-mono text-[#00D6A0] font-semibold">SLA: {sys.sla}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
              <button
                onClick={() => onNavigateToBlastRadius(sys.id)}
                className="py-2 px-3 rounded-xl bg-[#FF5370]/10 hover:bg-[#FF5370]/20 border border-[#FF5370]/30 text-[#FF5370] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Simulate Outage</span>
              </button>

              <button
                onClick={() => onNavigateToGraph(sys.id)}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5 text-[#287BFF]" />
                <span>Explore in Graph</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
