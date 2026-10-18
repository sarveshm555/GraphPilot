from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class GraphPathSegment(BaseModel):
    source: str
    relationship: str
    target: str
    properties: Optional[Dict[str, Any]] = None

class SourceReference(BaseModel):
    id: str
    title: str
    source_uri: Optional[str] = None
    source_type: Optional[str] = None
    excerpt: Optional[str] = None

class GroundedAnswer(BaseModel):
    answer: str
    outcome: str = Field(..., description="answered_with_path | answered_no_path | entity_unknown | no_graph_evidence | fallback")
    facts: List[Dict[str, Any]] = Field(default_factory=list, description="Direct facts supported by FalkorDB graph relationships")
    recommendations: List[str] = Field(default_factory=list, description="AI-generated actionable insights, distinctly separated from graph facts")
    sources: List[SourceReference] = Field(default_factory=list, description="Supporting documents retrieved from graph relationships")
    graph_paths: List[GraphPathSegment] = Field(default_factory=list, description="Explicit nodes and relationships traversed in the graph")
    memory_references: List[Dict[str, Any]] = Field(default_factory=list, description="Persistent company findings and historical resolutions")
    limitations: List[str] = Field(default_factory=list, description="Honest boundaries, empty query caveats, or unverified claims")
    agent_mode: str = Field(default="deterministic", description="'real_llm' or 'deterministic'")

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default-session"
    tenant_id: Optional[str] = "novapay-primary"
    max_hops: Optional[int] = 4

class MemoryConfirmRequest(BaseModel):
    text: str
    target_entity_id: Optional[str] = None
    session_id: Optional[str] = "default-session"
    verification_status: Optional[str] = "verified"
