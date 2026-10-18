import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  Clock, 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  Upload, 
  CheckCircle2, 
  Database, 
  ShieldCheck, 
  GitCommit, 
  ChevronRight, 
  ExternalLink,
  Share2,
  X,
  Search,
  Command
} from 'lucide-react';
import { 
  fetchOverview, 
  sendChatMessage, 
  fetchGraph, 
  fetchMemories, 
  confirmMemory, 
  uploadDocument, 
  fetchDocuments,
  verifyMemory,
  supersedeMemory
} from './services/api';
import { GroundedAnswer, OverviewMetrics, Finding } from './types';
import { Sidebar, NavTabId } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewDashboard } from './components/OverviewDashboard';
import { InteractiveGraph } from './components/InteractiveGraph';
import { BlastRadiusView } from './components/BlastRadiusView';
import { EntitySearchView } from './components/EntitySearchView';
import { TraversalExplorer } from './components/TraversalExplorer';
import { IncidentAnalysisView } from './components/IncidentAnalysisView';
import { SystemDependenciesView } from './components/SystemDependenciesView';
import { ReportsInsightsView } from './components/ReportsInsightsView';
import { SettingsView } from './components/SettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickSearchModal, setShowQuickSearchModal] = useState(false);

  // Chat state
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; grounded?: GroundedAnswer }>>([
    {
      role: 'assistant',
      text: "Hello! I am GraphPilot, your explainable company brain powered by FalkorDB. Ask me about system dependencies, past incident postmortems, architecture decisions, or team ownership. Every answer is grounded in explicit graph traversals with verifiable citations."
    }
  ]);
  const [selectedPathHighlight, setSelectedPathHighlight] = useState<any[]>([]);

  // Blast radius state
  const [blastSystemId, setBlastSystemId] = useState<string>('sys-payment-api');

  // Graph state
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [graphLoading, setGraphLoading] = useState(false);

  // Memory state
  const [memories, setMemories] = useState<Finding[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [memoryFilter, setMemoryFilter] = useState<'all' | 'verified' | 'proposed' | 'superseded'>('all');
  const [savingMemory, setSavingMemory] = useState(false);
  const [supersedeModalId, setSupersedeModalId] = useState<string | null>(null);
  const [supersedeText, setSupersedeText] = useState('');

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<{
    message: string;
    already_ingested?: boolean;
    graph_modified?: boolean;
    relationships_linked?: number;
    document_id?: string;
    filename?: string;
    content_hash?: string;
    text_status?: string;
    bytes_processed?: number;
    extracted_entities?: {
      systems?: string[];
      incidents?: string[];
      projects?: string[];
    };
    relationships_preview?: Array<{ source: string; type: string; target: string }>;
    validation_errors?: string[];
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Initial load
  useEffect(() => {
    refreshAllData();
  }, []);

  // Keyboard shortcut for Cmd/Ctrl+K quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSearchModal(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowQuickSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadOverview(),
      loadGraph(),
      loadMemories(),
      loadDocuments()
    ]);
    setIsRefreshing(false);
  };

  const loadOverview = async () => {
    try {
      const data = await fetchOverview();
      setOverview(data);
    } catch (e) {
      console.error('Failed to load overview:', e);
    }
  };

  const loadGraph = async () => {
    setGraphLoading(true);
    try {
      const data = await fetchGraph(150);
      setGraphData(data);
    } catch (e) {
      console.error('Failed to load graph:', e);
    } finally {
      setGraphLoading(false);
    }
  };

  const loadMemories = async () => {
    try {
      const data = await fetchMemories();
      setMemories(data);
    } catch (e) {
      console.error('Failed to load memories:', e);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (e) {
      console.error('Failed to load documents:', e);
    }
  };

  const handleAsk = async (promptText?: string) => {
    const q = promptText || question;
    if (!q.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    if (!promptText) setQuestion('');
    setLoading(true);

    try {
      const result = await sendChatMessage(q);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: result.answer,
        grounded: result
      }]);
      if (result.graph_paths && result.graph_paths.length > 0) {
        setSelectedPathHighlight(result.graph_paths);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Error processing question: ${err.message || 'Unknown server error'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMemory = async () => {
    if (!newMemoryText.trim()) return;
    setSavingMemory(true);
    try {
      await confirmMemory(newMemoryText, 'sys-payment-api');
      setNewMemoryText('');
      await loadMemories();
      await loadOverview();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMemory(false);
    }
  };

  const handleVerifyMemory = async (findingId: string) => {
    try {
      await verifyMemory(findingId);
      await loadMemories();
      await loadOverview();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSupersedeMemory = async (findingId: string) => {
    if (!supersedeText.trim()) return;
    try {
      await supersedeMemory(findingId, supersedeText);
      setSupersedeModalId(null);
      setSupersedeText('');
      await loadMemories();
      await loadOverview();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadDocument(file);
      setUploadResult(res);
      await loadDocuments();
      await loadOverview();
      await loadGraph();
    } catch (err: any) {
      setUploadResult({
        message: `Failed to upload: ${err.message || 'Server error'}`
      });
    } finally {
      setUploading(false);
    }
  };

  const navigateToBlastRadius = (systemId: string) => {
    setBlastSystemId(systemId);
    setActiveTab('blast');
  };

  const navigateToGraphWithPath = (path?: any[]) => {
    if (path && path.length > 0) {
      setSelectedPathHighlight(path);
    }
    setActiveTab('graph');
  };

  const navigateToGraphWithSystem = (systemId: string) => {
    const matchingEdges = graphData.edges.filter(
      e => e.source === systemId || e.target === systemId
    );
    if (matchingEdges.length > 0) {
      setSelectedPathHighlight(matchingEdges.map(e => ({
        source: e.source,
        relationship: e.type,
        target: e.target
      })));
    }
    setActiveTab('graph');
  };

  const exampleQuestions = [
    "Which systems depend on the Payment API?",
    "Who has previously handled incidents affecting the Payment API?",
    "What evidence supports the resolution of Incident INC-101?",
    "Which projects are connected to the Transaction Database?",
    "How is Project Alpha connected to Engineer Priya?",
    "What knowledge was saved during the previous session?",
    "Which systems depend on Project Omega?"
  ];

  const filteredMemories = memories.filter(m => {
    if (memoryFilter === 'all') return true;
    return m.verification_status.toLowerCase() === memoryFilter;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050B16] text-[#F4F7FF] font-sans antialiased">
      {/* 1. Global Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        overview={overview}
      />

      {/* 2. Main Application Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Global Top Header */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          overview={overview}
          onRefresh={refreshAllData}
          isRefreshing={isRefreshing}
          onOpenQuickSearch={() => setShowQuickSearchModal(true)}
        />

        {/* Dynamic View Rendering */}
        <main className="flex-1 flex flex-col h-[calc(100%-64px)] overflow-hidden relative">
          {/* Tab 1: Overview Command Center Showcase */}
          {activeTab === 'overview' && (
            <OverviewDashboard
              overview={overview}
              graphData={graphData}
              graphLoading={graphLoading}
              docCount={documents.length}
              onNavigateToTab={setActiveTab}
              onNavigateToBlastRadius={navigateToBlastRadius}
              onAskQuestionInChat={(q) => {
                setActiveTab('chat');
                handleAsk(q);
              }}
            />
          )}

          {/* Tab 2: AI Company Assistant Workspace */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex h-full overflow-hidden bg-[#050B16]">
              {/* Left Chat Stream */}
              <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-3xl rounded-2xl p-4.5 text-xs leading-relaxed shadow-lg ${
                          m.role === 'user'
                            ? 'bg-gradient-to-r from-[#6D4AFF] to-[#287BFF] text-white rounded-br-none'
                            : 'bg-[#0B1628] border border-white/10 text-[#F4F7FF] rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>

                        {/* Grounded Evidence Details via TraversalExplorer */}
                        {m.grounded && (
                          <div className="mt-4 pt-3 border-t border-white/10">
                            <TraversalExplorer 
                              answer={m.grounded}
                              onInspectInGraph={navigateToGraphWithPath}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 text-xs text-[#00D9FF] bg-[#0B1628] p-3 rounded-xl border border-[#00D9FF]/20 w-fit">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#00D9FF]" />
                      <span>Executing parameterized Cypher queries in FalkorDB & grounding response...</span>
                    </div>
                  )}
                </div>

                {/* Question Prompts & Send Input */}
                <div className="pt-4 border-t border-white/5 shrink-0 space-y-2">
                  <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                    {exampleQuestions.map((eq, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleAsk(eq)}
                        className="whitespace-nowrap px-3 py-1 rounded-xl bg-[#0B1628] hover:bg-[#101D32] border border-white/5 hover:border-[#6D4AFF]/40 text-[#94A8C7] hover:text-[#F4F7FF] text-[11px] transition-all cursor-pointer"
                      >
                        {eq}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAsk()}
                      placeholder="Ask about dependencies, incident postmortems, architecture, or blast radius..."
                      className="flex-1 bg-[#0B1628] border border-white/10 rounded-xl px-4 py-3 text-xs text-[#F4F7FF] placeholder-[#5E718D] focus:outline-none focus:border-[#6D4AFF] transition-colors"
                    />
                    <button
                      onClick={() => handleAsk()}
                      disabled={loading || !question.trim()}
                      className="bg-gradient-to-r from-[#6D4AFF] to-[#287BFF] hover:opacity-95 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#6D4AFF]/20 shrink-0 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Ask Brain</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Traversal Inspector Rail */}
              <div className="w-80 border-l border-white/5 bg-[#07111F] p-4 flex flex-col justify-between overflow-y-auto shrink-0 select-none">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-[#00D9FF]" />
                      Active Traversal
                    </h3>
                    {selectedPathHighlight.length > 0 && (
                      <button
                        onClick={() => navigateToGraphWithPath(selectedPathHighlight)}
                        className="text-[10px] text-[#00D9FF] hover:underline flex items-center gap-1 font-semibold"
                      >
                        View in Graph <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {selectedPathHighlight.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#5E718D] border border-dashed border-white/10 rounded-2xl p-4 space-y-2">
                      <GitCommit className="h-6 w-6 mx-auto text-[#5E718D]" />
                      <p className="font-medium text-[#94A8C7]">No active traversal path.</p>
                      <p className="text-[11px]">Ask a question to see live multi-hop relationship chains retrieved from FalkorDB.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-[#94A8C7]">
                        Explicit relationships traversed in FalkorDB:
                      </p>
                      {selectedPathHighlight.map((p, idx) => (
                        <div key={idx} className="bg-[#0B1628] border border-white/5 p-3 rounded-xl text-xs space-y-1">
                          <div className="text-white font-semibold truncate">{p.source}</div>
                          <div className="text-[10px] text-[#00D9FF] my-1 font-mono flex items-center gap-1">
                            <ChevronRight className="h-3 w-3 shrink-0" />
                            <span className="bg-[#00D9FF]/10 px-1.5 py-0.5 rounded border border-[#00D9FF]/20 font-bold">{p.relationship}</span>
                          </div>
                          <div className="text-[#94A8C7] font-medium truncate">{p.target}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 text-[11px] text-[#5E718D] space-y-1">
                  <p className="flex items-center gap-1 text-[#00D6A0]">
                    <CheckCircle2 className="h-3 w-3" /> 100% Parameterized Cypher
                  </p>
                  <p>Zero arbitrary code execution</p>
                  <p className="font-mono text-[10px] text-[#5E718D]">FalkorDB v4.22.1 on port 6379</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Interactive Knowledge Graph */}
          {activeTab === 'graph' && (
            <div className="flex-1 overflow-hidden relative">
              <InteractiveGraph 
                rawNodes={graphData.nodes}
                rawEdges={graphData.edges}
                highlightPath={selectedPathHighlight}
                onSelectSystemForBlastRadius={navigateToBlastRadius}
                onRefresh={loadGraph}
                isLoading={graphLoading}
              />
            </div>
          )}

          {/* Tab 4: Traversal Explorer View */}
          {activeTab === 'traversal' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cyber-grid bg-radial-ambient select-none">
              <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-[#00D9FF]" />
                    <h3 className="text-sm font-bold text-white">Active Graph Traversal Sequences</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 px-2 py-0.5 rounded font-semibold">
                    FalkorDB Multi-Hop
                  </span>
                </div>
                <p className="text-xs text-[#94A8C7] leading-relaxed">
                  Inspect directional relationship sequences retrieved from FalkorDB. Click any edge to reveal properties, verified facts, and provenance citations.
                </p>

                {selectedPathHighlight.length === 0 ? (
                  <div className="bg-[#050B16] border border-dashed border-white/10 rounded-2xl p-10 text-center text-xs text-[#5E718D] space-y-3">
                    <GitCommit className="h-8 w-8 mx-auto text-[#5E718D]" />
                    <p className="font-medium text-white">No active multi-hop traversal in memory.</p>
                    <p className="max-w-md mx-auto text-[11px] text-[#94A8C7]">
                      Ask a question in the AI Assistant or use "Find Path" in the Knowledge Graph to visualize explicit multi-hop relationship chains.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          handleAsk("How is Project Alpha connected to Engineer Priya?");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#6D4AFF]/20 hover:bg-[#6D4AFF]/30 border border-[#6D4AFF]/40 text-[#6D4AFF] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Load Sample: Project Alpha ➔ Priya (4 Hops)
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          handleAsk("Which systems depend on the Payment API?");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs transition-colors cursor-pointer"
                      >
                        Load Sample: Payment API Dependencies
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#050B16] border border-white/5 p-3 rounded-xl text-xs font-mono">
                      <span className="text-[#94A8C7]">
                        Total Path Segments: <strong className="text-[#00D9FF]">{selectedPathHighlight.length}</strong>
                      </span>
                      <button
                        onClick={() => navigateToGraphWithPath(selectedPathHighlight)}
                        className="text-xs text-[#6D4AFF] hover:underline flex items-center gap-1 font-semibold"
                      >
                        Inspect in React Flow Graph <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>

                    <TraversalExplorer 
                      answer={{
                        answer: "Active path traversal loaded from FalkorDB graph query.",
                        outcome: "answered_with_path",
                        facts: selectedPathHighlight.map(p => `${p.source} relates to ${p.target} via ${p.relationship}`),
                        recommendations: ["Trace upstream systems before applying schema migrations.", "Verify team ownership in Global Directory."],
                        sources: [
                          { id: "DOC-201", title: "Payment API High-Load Latency Mitigation", source_uri: "internal-docs/incidents/inc-101.md" }
                        ],
                        graph_paths: selectedPathHighlight,
                        memory_references: [],
                        limitations: ["Only explicitly materialized edges in FalkorDB are shown."],
                        agent_mode: "deterministic"
                      }}
                      onInspectInGraph={navigateToGraphWithPath}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Global Entity Directory */}
          {activeTab === 'entities' && (
            <div className="flex-1 overflow-hidden">
              <EntitySearchView 
                onSelectSystemForBlastRadius={navigateToBlastRadius}
                onNavigateToGraph={navigateToGraphWithPath}
              />
            </div>
          )}

          {/* Tab 6: Blast Radius Analysis */}
          {activeTab === 'blast' && (
            <div className="flex-1 overflow-hidden">
              <BlastRadiusView 
                initialSystemId={blastSystemId}
                onNavigateToGraph={navigateToGraphWithPath}
              />
            </div>
          )}

          {/* Tab 7: Incident Analysis */}
          {activeTab === 'incidents' && (
            <IncidentAnalysisView
              onAskQuestionInChat={(q) => {
                setActiveTab('chat');
                handleAsk(q);
              }}
              onNavigateToBlastRadius={navigateToBlastRadius}
            />
          )}

          {/* Tab 8: System Dependencies */}
          {activeTab === 'dependencies' && (
            <SystemDependenciesView
              onNavigateToBlastRadius={navigateToBlastRadius}
              onNavigateToGraph={navigateToGraphWithSystem}
            />
          )}

          {/* Tab 9: Knowledge Ingestion */}
          {activeTab === 'documents' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cyber-grid bg-radial-ambient select-none">
              {/* Upload Box */}
              <div className="bg-[#0B1628] border border-dashed border-white/10 hover:border-[#6D4AFF]/40 rounded-2xl p-8 text-center shadow-xl transition-colors">
                <Upload className="h-8 w-8 text-[#6D4AFF] mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white">Upload Organizational Knowledge</h3>
                <p className="text-xs text-[#94A8C7] mt-1 max-w-md mx-auto">
                  Ingest Markdown (.md), TXT (.txt), or CSV (.csv) documents. Entities and relationships will be automatically extracted, SHA-256 hashed, and linked to the FalkorDB graph.
                </p>
                <label className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-[#6D4AFF] to-[#287BFF] hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-[#6D4AFF]/20">
                  <span>Select Document File</span>
                  <input type="file" onChange={handleFileUpload} accept=".md,.txt,.csv" className="hidden" />
                </label>

                {uploading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-[#00D9FF] mt-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Hashing content & extracting graph relationships...</span>
                  </div>
                )}

                {uploadResult && (
                  <div className={`mt-5 p-4 rounded-xl text-xs max-w-2xl mx-auto text-left border ${
                    uploadResult.already_ingested
                      ? 'bg-[#FFB020]/10 border-[#FFB020]/30 text-[#FFB020]'
                      : 'bg-[#00D6A0]/10 border-[#00D6A0]/30 text-[#00D6A0]'
                  }`}>
                    <div className="flex items-center justify-between font-semibold mb-2">
                      <div className="flex items-center gap-2">
                        {uploadResult.already_ingested ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-[#FFB020]" />
                            <span>Deduplication Notice: Exact SHA-256 Hash Exists</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-[#00D6A0]" />
                            <span>Document Ingested Successfully</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#050B16] border border-white/10 text-white">
                        SHA-256 Verified
                      </span>
                    </div>

                    <p className="text-[11px] text-[#F4F7FF] leading-relaxed mb-3">{uploadResult.message}</p>

                    {/* Document Processing Stages Stepper */}
                    <div className="bg-[#050B16] border border-white/5 rounded-xl p-3 my-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A8C7] block mb-2">
                        Pipeline Execution Verification Stages:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                        <div className="bg-[#0B1628] p-2 rounded-lg border border-white/5">
                          <span className="text-[#5E718D] block">1. Upload & Decode</span>
                          <span className="text-[#00D6A0]">✓ {uploadResult.text_status || 'UTF-8 Complete'}</span>
                        </div>
                        <div className="bg-[#0B1628] p-2 rounded-lg border border-white/5">
                          <span className="text-[#5E718D] block">2. Deduplication</span>
                          <span className={uploadResult.already_ingested ? "text-[#FFB020]" : "text-[#00D6A0]"}>
                            {uploadResult.already_ingested ? "SHA-256 Match (Skip)" : "Unique Hash"}
                          </span>
                        </div>
                        <div className="bg-[#0B1628] p-2 rounded-lg border border-white/5">
                          <span className="text-[#5E718D] block">3. Validation</span>
                          <span className="text-[#00D6A0]">
                            {uploadResult.validation_errors && uploadResult.validation_errors.length > 0 ? "Errors Detected" : "0 Validation Errors"}
                          </span>
                        </div>
                        <div className="bg-[#0B1628] p-2 rounded-lg border border-white/5">
                          <span className="text-[#5E718D] block">4. Extracted Systems</span>
                          <span className="text-[#00D9FF]">{uploadResult.extracted_entities?.systems?.join(', ') || 'None identified'}</span>
                        </div>
                        <div className="bg-[#0B1628] p-2 rounded-lg border border-white/5">
                          <span className="text-[#5E718D] block">5. Extracted Incidents</span>
                          <span className="text-[#6D4AFF]">{uploadResult.extracted_entities?.incidents?.join(', ') || 'None identified'}</span>
                        </div>
                        <div className="bg-[#0B1628] p-2 rounded-lg border border-white/5">
                          <span className="text-[#5E718D] block">6. Graph Status</span>
                          <span className={uploadResult.graph_modified ? "text-[#00D6A0]" : "text-[#94A8C7]"}>
                            {uploadResult.graph_modified ? `Mutated (+${uploadResult.relationships_linked} edges)` : "Preserved Unmodified"}
                          </span>
                        </div>
                      </div>

                      {uploadResult.relationships_preview && uploadResult.relationships_preview.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] font-mono">
                          <span className="text-[#94A8C7] block mb-1">Relationship Previews in FalkorDB:</span>
                          <div className="space-y-1">
                            {uploadResult.relationships_preview.map((rel, rIdx) => (
                              <div key={rIdx} className="text-[#00D9FF]">
                                <span className="text-[#94A8C7]">{rel.source}</span>
                                <span className="text-[#6D4AFF] mx-1">-[{rel.type}]-&gt;</span>
                                <span className="text-white">{rel.target}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {uploadResult.relationships_linked !== undefined && (
                      <div className="pt-2 border-t border-white/5 flex flex-wrap justify-between text-[11px] text-[#94A8C7] font-mono gap-2">
                        <span>Doc ID: <strong className="text-white">{uploadResult.document_id}</strong></span>
                        <span>Hash: <strong className="text-[#5E718D]">{uploadResult.content_hash?.slice(0, 16)}...</strong></span>
                        <span>Edges Linked: <strong className="text-[#00D6A0]">{uploadResult.relationships_linked}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Document List */}
              <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white">Ingested Document Evidence & Provenance</h3>
                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="bg-[#050B16] border border-white/5 rounded-xl p-3.5 text-xs flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{doc.title}</span>
                          <span className="text-[10px] bg-white/5 text-[#00D9FF] px-2 py-0.5 rounded font-mono border border-white/5">
                            {doc.source_type}
                          </span>
                        </div>
                        <p className="text-[#94A8C7] text-[11px]">{doc.excerpt || doc.source_uri}</p>
                        <span className="text-[10px] font-mono text-[#5E718D] block">URI: {doc.source_uri || 'internal-doc'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-white bg-white/5 px-2 py-1 rounded border border-white/10 shrink-0">
                        {doc.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 10: Reports & Insights */}
          {activeTab === 'reports' && (
            <ReportsInsightsView
              overview={overview}
              memories={memories}
              docCount={documents.length}
            />
          )}

          {/* Tab 11: Persistent Memory */}
          {activeTab === 'memory' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cyber-grid bg-radial-ambient select-none">
              {/* Create Memory Form */}
              <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white">Confirm New Company Finding</h3>
                <p className="text-xs text-[#94A8C7]">
                  Verified findings are persisted as <code className="text-[#00D6A0] font-mono">:Finding</code> nodes in FalkorDB, surviving server restarts and cross-session queries.
                </p>
                <div className="flex gap-3 pt-1">
                  <input
                    type="text"
                    value={newMemoryText}
                    onChange={e => setNewMemoryText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveMemory()}
                    placeholder="Enter architectural decision, incident lesson, or verified dependency finding..."
                    className="flex-1 bg-[#050B16] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#F4F7FF] placeholder-[#5E718D] focus:outline-none focus:border-[#00D6A0] transition-colors"
                  />
                  <button
                    onClick={handleSaveMemory}
                    disabled={savingMemory || !newMemoryText.trim()}
                    className="bg-[#00D6A0] hover:bg-[#00D6A0]/90 disabled:opacity-50 text-[#050B16] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-[#00D6A0]/20 shrink-0 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Persist Finding</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Historical Memory Archive</h3>
                <div className="flex gap-1 bg-[#0B1628] p-1 rounded-xl border border-white/5 text-xs">
                  {(['all', 'verified', 'proposed', 'superseded'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setMemoryFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                        memoryFilter === tab
                          ? 'bg-[#6D4AFF] text-white shadow-md'
                          : 'text-[#94A8C7] hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Findings */}
              <div className="space-y-3">
                {filteredMemories.length === 0 ? (
                  <div className="bg-[#0B1628] border border-white/5 rounded-2xl p-8 text-center text-xs text-[#5E718D]">
                    No findings match the "{memoryFilter}" filter.
                  </div>
                ) : (
                  filteredMemories.map((m) => (
                    <div key={m.id} className="bg-[#0B1628] border border-white/5 rounded-2xl p-4.5 text-xs space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                            m.verification_status === 'verified'
                              ? 'bg-[#00D6A0]/10 text-[#00D6A0] border-[#00D6A0]/30'
                              : m.verification_status === 'superseded'
                              ? 'bg-[#FF5370]/10 text-[#FF5370] border-[#FF5370]/30 line-through'
                              : 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                          }`}>
                            {m.verification_status.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-[#5E718D] font-mono">ID: {m.id}</span>
                        </div>
                        <span className="text-[10px] text-[#5E718D] flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" /> {m.created_at || 'Recorded in session'}
                        </span>
                      </div>

                      <p className={`text-white text-xs leading-relaxed font-medium ${
                        m.verification_status === 'superseded' ? 'line-through text-[#5E718D]' : ''
                      }`}>
                        {m.text}
                      </p>

                      {m.superseded_at && (
                        <p className="text-[10px] text-[#FFB020] font-mono">
                          Superseded at: {m.superseded_at}
                        </p>
                      )}

                      {/* Action Buttons for Memory */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-[#5E718D] font-mono text-[10px]">Session: {m.session_id}</span>
                        <div className="flex items-center gap-2">
                          {m.verification_status !== 'verified' && m.verification_status !== 'superseded' && (
                            <button
                              onClick={() => handleVerifyMemory(m.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#00D6A0]/10 text-[#00D6A0] hover:bg-[#00D6A0]/20 border border-[#00D6A0]/30 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                            >
                              <Check className="h-3 w-3" /> Mark Verified
                            </button>
                          )}
                          {m.verification_status !== 'superseded' && (
                            <button
                              onClick={() => {
                                setSupersedeModalId(m.id);
                                setSupersedeText('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A8C7] hover:text-white border border-white/5 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" /> Supersede with Update
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Supersede Modal */}
              {supersedeModalId && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-[#0B1628] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-[#FFB020]" />
                      Supersede Finding ({supersedeModalId})
                    </h4>
                    <p className="text-xs text-[#94A8C7]">
                      This will mark the existing finding as superseded in FalkorDB and create a new linked finding with a <code className="text-[#6D4AFF] font-mono">:SUPERSEDED_BY</code> relationship.
                    </p>
                    <textarea
                      rows={3}
                      value={supersedeText}
                      onChange={e => setSupersedeText(e.target.value)}
                      placeholder="Enter the updated or corrected knowledge..."
                      className="w-full bg-[#050B16] border border-white/10 rounded-xl p-3 text-xs text-[#F4F7FF] placeholder-[#5E718D] focus:outline-none focus:border-[#6D4AFF]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSupersedeModalId(null)}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94A8C7] hover:text-white text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSupersedeMemory(supersedeModalId)}
                        disabled={!supersedeText.trim()}
                        className="px-4 py-2 rounded-xl bg-[#6D4AFF] hover:bg-[#6D4AFF]/90 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirm Supersession
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 12: Settings & Diagnostics */}
          {activeTab === 'settings' && (
            <SettingsView
              overview={overview}
              onRefresh={refreshAllData}
              isRefreshing={isRefreshing}
            />
          )}
        </main>
      </div>

      {/* Global Quick Search Modal (Cmd/Ctrl+K) */}
      {showQuickSearchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 p-4 z-50">
          <div className="bg-[#0B1628] border border-white/10 rounded-2xl max-w-xl w-full p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Command className="h-4 w-4 text-[#287BFF]" />
                <span>Command Navigation (Cmd+K)</span>
              </div>
              <button
                onClick={() => setShowQuickSearchModal(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-[#5E718D] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#5E718D] uppercase tracking-wider block mb-1">
                Jump to View
              </span>
              {[
                { id: 'overview', title: 'Command Center Overview', desc: 'Main dashboard & interactive knowledge graph' },
                { id: 'chat', title: 'AI Company Assistant', desc: 'Ask natural language queries with graph proof' },
                { id: 'graph', title: 'Knowledge Graph Explorer', desc: 'Full-screen React Flow graph visualizer' },
                { id: 'blast', title: 'Blast Radius Analyzer', desc: 'Cascading dependency outage simulator' },
                { id: 'incidents', title: 'Incident Postmortem Analysis', desc: 'Historical outages & verified postmortems' },
                { id: 'dependencies', title: 'System Dependency Matrix', desc: 'Tier-0, Tier-1, Tier-2 topology' },
                { id: 'entities', title: 'Global Entity Directory', desc: 'Search all 9 entity labels in FalkorDB' },
                { id: 'documents', title: 'Knowledge Ingestion Pipeline', desc: 'Upload documents & extract entities' },
                { id: 'reports', title: 'Reports & Insights', desc: 'Graph governance & audit logs' },
                { id: 'memory', title: 'Persistent Company Memory', desc: 'Verified cross-session findings' },
                { id: 'settings', title: 'Settings & Diagnostics', desc: 'FalkorDB status & 8 Cypher tools' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as NavTabId);
                    setShowQuickSearchModal(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-[#00D9FF]">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#5E718D]">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#5E718D] group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
