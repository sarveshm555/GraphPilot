"""
Synthetic Company Graph Seed Dataset
Company: NovaPay Financial Technologies (Synthetic)
Entities designed to demonstrate 3+ hop traversal:
1. Multi-hop:
   Project Alpha -> USES -> Payment API -> DEPENDS_ON -> Transaction Database -> OWNS <- Payments Engineering <- MEMBER_OF <- Priya Sharma (Staff Engineer)
2. Incident Resolution:
   Incident INC-101 ("Payment Gateway Timeout Spikes") -> AFFECTED -> Payment API
   INC-101 -> RESOLVED_BY -> Priya Sharma
   INC-101 -> DOCUMENTED_IN -> Postmortem DOC-201 ("Payment API High-Load Latency Mitigation")
3. Architecture Decision:
   Decision DEC-301 ("Implement Redis Cluster Cache for Transaction DB") -> INFORMED_BY -> Incident INC-101
   DEC-301 -> ABOUT -> Transaction Database
4. Support Tickets:
   SupportTicket TICKET-501 -> RELATED_TO -> Payment API
"""

SEED_NODES = {
    "Person": [
        {"id": "usr-priya", "name": "Priya Sharma", "role": "Staff Engineer", "email": "priya.sharma@novapay.synthetic"},
        {"id": "usr-alex", "name": "Alex Chen", "role": "Site Reliability Engineer", "email": "alex.chen@novapay.synthetic"},
        {"id": "usr-marcus", "name": "Marcus Vance", "role": "Lead Architect", "email": "marcus.vance@novapay.synthetic"},
        {"id": "usr-sarah", "name": "Sarah Jenkins", "role": "Product Manager", "email": "sarah.j@novapay.synthetic"}
    ],
    "Team": [
        {"id": "team-payments", "name": "Payments Engineering", "mission": "High-throughput core transaction rails"},
        {"id": "team-platform", "name": "Platform Infrastructure", "mission": "Cloud reliability, networking, and datastores"},
        {"id": "team-checkout", "name": "Checkout Experience", "mission": "Customer-facing payment interfaces"}
    ],
    "Project": [
        {"id": "proj-alpha", "name": "Project Alpha", "status": "active", "priority": "P0"},
        {"id": "proj-beta", "name": "Project Beta", "status": "planning", "priority": "P1"},
        {"id": "proj-checkout-v2", "name": "Checkout Modernization V2", "status": "active", "priority": "P0"}
    ],
    "System": [
        {"id": "sys-payment-api", "name": "Payment API", "description": "Unified REST & gRPC endpoint for customer transactions", "criticality": "Tier-0"},
        {"id": "sys-trans-db", "name": "Transaction Database", "description": "ACID distributed ledger for ledger mutations", "criticality": "Tier-0"},
        {"id": "sys-fraud-engine", "name": "Fraud Detection Service", "description": "Real-time ML scoring for incoming transaction requests", "criticality": "Tier-1"},
        {"id": "sys-notification-svc", "name": "Notification Service", "description": "Customer email and SMS webhook gateway", "criticality": "Tier-2"}
    ],
    "Document": [
        {
            "id": "doc-201",
            "title": "Payment API High-Load Latency Mitigation",
            "source_uri": "https://docs.novapay.synthetic/postmortems/INC-101-resolution.md",
            "source_type": "markdown",
            "content_hash": "a1b2c3d4e5f67890",
            "excerpt": "During Black Friday load testing, connection pooling saturation in Transaction Database triggered 504 timeouts on Payment API. Priya Sharma mitigated by scaling connection pool from 50 to 200 and tuning query timeouts."
        },
        {
            "id": "doc-202",
            "title": "Architecture Blueprint: Core Payment Infrastructure 2026",
            "source_uri": "https://docs.novapay.synthetic/architecture/payment-blueprint.md",
            "source_type": "markdown",
            "content_hash": "f6e5d4c3b2a19876",
            "excerpt": "Payment API is the central Tier-0 orchestrator. All external checkout flows flow through Project Alpha and Checkout Modernization, both relying strictly on Payment API and Transaction DB."
        }
    ],
    "Incident": [
        {
            "id": "inc-101",
            "title": "Payment Gateway Timeout Spikes INC-101",
            "summary": "Connection pool exhaustion between Payment API and Transaction DB resulting in 12% 504 error rate.",
            "resolution": "Connection pool maximum increased to 200; idle connection reaper tuned to 30s. Handled and verified by Priya Sharma.",
            "created_at": "2026-03-12T14:32:00Z",
            "status": "resolved"
        },
        {
            "id": "inc-102",
            "title": "Fraud Engine Scoring Latency INC-102",
            "summary": "Model inference queue backup causing delayed authorizations.",
            "resolution": "Autoscaling replicas bumped and fallback threshold enabled by Alex Chen.",
            "created_at": "2026-04-05T09:15:00Z",
            "status": "resolved"
        }
    ],
    "SupportTicket": [
        {
            "id": "ticket-501",
            "title": "Intermittent HTTP 504 on /v1/charge endpoint",
            "priority": "High",
            "status": "closed"
        },
        {
            "id": "ticket-502",
            "title": "Webhook delay for Settlement events",
            "priority": "Medium",
            "status": "open"
        }
    ],
    "Decision": [
        {
            "id": "dec-301",
            "title": "Implement Distributed Connection Pool & Read Replica Routing",
            "rationale": "Direct outcome of Incident INC-101 to eliminate single-point saturation on Transaction Database.",
            "status": "approved",
            "created_at": "2026-03-15T11:00:00Z"
        }
    ],
    "Finding": [
        {
            "id": "find-001",
            "text": "Payment API failure modes are predominantly DB connection starvation rather than network partition. Verified in Q1 postmortem review.",
            "created_at": "2026-03-20T16:00:00Z",
            "session_id": "seed-session-0",
            "verification_status": "verified"
        }
    ]
}

# Relationships: (source_label, source_id, rel_type, target_label, target_id, properties)
SEED_RELATIONSHIPS = [
    # People & Teams
    ("Person", "usr-priya", "MEMBER_OF", "Team", "team-payments", {"role": "Technical Lead"}),
    ("Person", "usr-alex", "MEMBER_OF", "Team", "team-platform", {"role": "Primary Oncall"}),
    ("Person", "usr-marcus", "MEMBER_OF", "Team", "team-platform", {"role": "Chief Architect"}),
    ("Person", "usr-sarah", "MEMBER_OF", "Team", "team-checkout", {"role": "Product Owner"}),
    
    # Teams & Systems
    ("Team", "team-payments", "OWNS", "System", "sys-payment-api", {"sla": "99.99%"}),
    ("Team", "team-payments", "OWNS", "System", "sys-trans-db", {"sla": "99.999%"}),
    ("Team", "team-platform", "OWNS", "System", "sys-notification-svc", {"sla": "99.9%"}),
    ("Team", "team-platform", "OWNS", "System", "sys-fraud-engine", {"sla": "99.95%"}),

    # People & Projects
    ("Person", "usr-priya", "WORKED_ON", "Project", "proj-alpha", {"role": "Lead Engineer"}),
    ("Person", "usr-marcus", "WORKED_ON", "Project", "proj-alpha", {"role": "Architecture Reviewer"}),
    ("Person", "usr-sarah", "WORKED_ON", "Project", "proj-checkout-v2", {"role": "Product Lead"}),

    # Projects & Systems
    ("Project", "proj-alpha", "USES", "System", "sys-payment-api", {"environment": "production"}),
    ("Project", "proj-checkout-v2", "USES", "System", "sys-payment-api", {"environment": "production"}),
    ("Project", "proj-beta", "USES", "System", "sys-notification-svc", {"environment": "staging"}),

    # System Dependencies
    ("System", "sys-payment-api", "DEPENDS_ON", "System", "sys-trans-db", {"protocol": "gRPC", "sync": True}),
    ("System", "sys-payment-api", "DEPENDS_ON", "System", "sys-fraud-engine", {"protocol": "HTTPS", "sync": True}),
    ("System", "sys-payment-api", "DEPENDS_ON", "System", "sys-notification-svc", {"protocol": "AMQP", "sync": False}),

    # Incidents
    ("Incident", "inc-101", "AFFECTED", "System", "sys-payment-api", {"severity": "SEV-1"}),
    ("Incident", "inc-101", "RESOLVED_BY", "Person", "usr-priya", {"action": "Scaled connection pools & tuned reapers"}),
    ("Incident", "inc-101", "DOCUMENTED_IN", "Document", "doc-201", {"section": "Complete Postmortem"}),

    ("Incident", "inc-102", "AFFECTED", "System", "sys-fraud-engine", {"severity": "SEV-2"}),
    ("Incident", "inc-102", "RESOLVED_BY", "Person", "usr-alex", {"action": "Horizontal auto-scaling trigger"}),

    # Decisions
    ("Decision", "dec-301", "INFORMED_BY", "Incident", "inc-101", {"reason": "Prevent recurrent connection starvation"}),
    ("Decision", "dec-301", "ABOUT", "System", "sys-trans-db", {"scope": "Infrastructure Architecture"}),

    # Support Tickets
    ("SupportTicket", "ticket-501", "RELATED_TO", "System", "sys-payment-api", {"reported_by": "Enterprise Merchant Tier 1"}),
    ("SupportTicket", "ticket-502", "RELATED_TO", "System", "sys-payment-api", {"reported_by": "Partner Integrations"}),

    # Documents & Systems
    ("Document", "doc-202", "ABOUT", "System", "sys-payment-api", {"relevance": "core_architecture"}),

    # Finding
    ("Finding", "find-001", "SUPPORTS", "System", "sys-payment-api", {"confidence": "high"})
]
