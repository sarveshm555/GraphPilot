export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphPathSegment {
  source: string;
  relationship: string;
  target: string;
  properties?: Record<string, any>;
}

export interface SourceReference {
  id: string;
  title: string;
  source_uri?: string;
  source_type?: string;
  excerpt?: string;
}

export interface GroundedAnswer {
  answer: string;
  outcome: 'answered_with_path' | 'answered_no_path' | 'entity_unknown' | 'no_graph_evidence' | 'fallback';
  facts: any[];
  recommendations: string[];
  sources: SourceReference[];
  graph_paths: GraphPathSegment[];
  memory_references: any[];
  limitations: string[];
  agent_mode?: 'real_llm' | 'deterministic';
}

export interface OverviewMetrics {
  status: string;
  graph_name: string;
  total_nodes: number;
  total_relationships: number;
  node_type_distribution: Record<string, number>;
  verified_memories: number;
  health: {
    status: string;
    indicator: 'connected' | 'fallback_active' | 'unavailable';
    backend: string;
    connected_to_remote: boolean;
    host: string;
    port: number;
    graph_name: string;
  };
  llm?: {
    provider: string;
    model: string;
    status: 'mock_offline' | 'llm_active' | 'misconfigured' | 'error';
    tool_calling_enabled: boolean;
    timeout_seconds?: number;
    error?: string | null;
    error_type?: string | null;
  };
}

export interface Finding {
  id: string;
  text: string;
  created_at: string;
  session_id: string;
  verification_status: 'verified' | 'proposed' | 'superseded';
  superseded_at?: string;
  connected_entities?: any[];
}

export interface BlastRadiusResult {
  found: boolean;
  target_id?: string;
  message?: string;
  target_system?: Record<string, any>;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  severity_rationale?: string;
  direct_downstream_projects?: any[];
  direct_downstream_systems?: any[];
  direct_upstream_dependencies?: any[];
  transitive_projects?: any[];
  owning_teams?: Array<{
    team: Record<string, any>;
    engineers: any[];
  }>;
  historical_incidents?: Array<{
    incident: Record<string, any>;
    resolved_by?: Record<string, any>;
    document?: Record<string, any>;
  }>;
  support_tickets?: any[];
  architecture_decisions?: any[];
  graph_paths?: Array<{
    source: string;
    relationship: string;
    target: string;
    impact_type?: string;
    via?: string;
  }>;
  metrics?: {
    total_affected_entities: number;
    direct_projects_count: number;
    transitive_projects_count: number;
    upstream_dependencies_count: number;
    historical_incidents_count: number;
    support_tickets_count: number;
    traversal_depth_limit: number;
  };
  limitations?: string[];
}

export interface EntitySearchResult {
  id: string;
  label: string;
  name: string;
  description: string;
  properties: Record<string, any>;
  connected_count: number;
  neighbor_types: string[];
}
