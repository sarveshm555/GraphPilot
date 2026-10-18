# GraphPilot System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Layer (React 19 + Vite 8 + Tailwind CSS 4)"]
        UI["App Container & Navigation Shell"]
        Assistant["Company Assistant (TraversalExplorer)"]
        GraphExplorer["Interactive Knowledge Graph (@xyflow/react)"]
        BlastView["Blast Radius Analysis Engine"]
        EntityDirectory["Global Entity Directory & Search"]
        DocIngestion["Document Ingestion & Provenance"]
        MemoryExplorer["Persistent Memory Lifecycle"]
        AIStatus["AI Engine Status & Honesty Indicator"]
    end

    subgraph APILayer["Backend API Gateway (FastAPI)"]
        ChatEP["/api/chat"]
        GraphEP["/api/graph & /api/graph/entities/{id}"]
        BlastEP["/api/blast-radius"]
        EntitiesEP["/api/entities/search"]
        DocEP["/api/documents/upload & /api/documents"]
        MemEP["/api/memory/confirm & verify & supersede"]
        HealthEP["/health & /api/overview"]
    end

    subgraph AgentEngine["AI Agent Orchestrator & Grounding Layer"]
        Orchestrator["Agent Orchestrator"]
        LLM["LLM Function Calling Engine (OpenAI / Gemini / Ollama)"]
        Loop["Bounded Tool-Calling Loop (Max 4 Turns)"]
        OfflineEngine["Dynamic Graph-Grounded Entity Resolver"]
        Tools["8 Parameterized Cypher Tools"]
        Validator["Grounding & Citation Validator"]
    end

    subgraph AnalysisEngine["Graph Analytics & Lifecycle Engine"]
        BlastCalculator["Blast Radius Multi-Hop Impact Analyzer"]
        MemoryService["Memory Service (:SUPERSEDED_BY Persistence)"]
        IngestionPipeline["Ingestion Pipeline (SHA-256 Deduplication)"]
    end

    subgraph GraphLayer["Graph Database Layer (FalkorDB v4.22.1)"]
        FalkorDB["FalkorDB Server (Port 6379, Graph: graphpilot)"]
        Nodes["Nodes: Person, Team, Project, System, Document, Incident, Decision, Finding, SupportTicket"]
        Edges["Edges: DEPENDS_ON, USES, OWNS, RESOLVED_BY, INFORMED_BY, SUPPORTS, MEMBER_OF, SUPERSEDED_BY, ABOUT, DOCUMENTED_IN"]
    end

    UI --> Assistant
    UI --> GraphExplorer
    UI --> BlastView
    UI --> EntityDirectory
    UI --> DocIngestion
    UI --> MemoryExplorer
    AIStatus --> HealthEP

    Assistant --> ChatEP
    GraphExplorer --> GraphEP
    BlastView --> BlastEP
    EntityDirectory --> EntitiesEP
    DocIngestion --> DocEP
    MemoryExplorer --> MemEP

    ChatEP --> Orchestrator
    Orchestrator --> LLM
    LLM --> Loop
    Loop --> Tools
    Orchestrator --> OfflineEngine
    OfflineEngine --> Tools
    Tools --> FalkorDB

    BlastEP --> BlastCalculator
    BlastCalculator --> FalkorDB
    EntitiesEP --> FalkorDB
    DocEP --> IngestionPipeline
    IngestionPipeline --> FalkorDB
    MemEP --> MemoryService
    MemoryService --> FalkorDB

    FalkorDB --> Validator
    Validator --> Assistant
```

## Architectural Principles & Guarantees
1. **FalkorDB Graph as Primary Context Layer**: The graph drives multi-hop discovery, reasoning, failure impact analysis, and context extraction.
2. **Deterministic Parameterized Tools**: The LLM or offline resolver selects from 8 predefined tools with validated Pydantic schemas. Arbitrary unvalidated Cypher execution is strictly prevented.
3. **Bounded Multi-Step Tool Calling**: Supports bounded loops (up to 4 turns) allowing multi-step reasoning while preventing unbounded recursion or token waste.
4. **Transparent Configuration & Provider Modes**:
   - `LLM_PROVIDER=mock`: Fully functional offline mode using dynamic entity resolution against FalkorDB without external paid APIs.
   - `LLM_PROVIDER=openai`: Bounded function-calling integration with OpenAI-compatible providers (OpenAI, Gemini, OpenRouter, Ollama).
   - Missing API Key: Explicitly reports configuration error instead of silently pretending an LLM is running.
5. **Strict Grounding & Reality Distinction**: Distinguishes missing knowledge in the graph from absolute non-existence in reality, refuses unknown entities, and isolates AI recommendations from verified historical facts.
6. **Multi-Hop Failure Impact Analysis**: Deep transitive Cypher traversal evaluates downstream projects, direct upstream dependencies, owning teams, on-call engineers, and incident precedents.
7. **Document Deduplication & Idempotent Graph**: SHA-256 content hashing guarantees that identical document uploads will not create duplicate graph nodes or spurious relationships.
8. **Auditable Persistent Memory Lifecycle**: Three-state finding lifecycle (`proposed` -> `verified` -> `superseded`) with explicit `:SUPERSEDED_BY` relationships connecting historical findings to current knowledge.
