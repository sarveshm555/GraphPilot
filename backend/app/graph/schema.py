"""
GraphPilot Graph Data Model & Schema Definition
Nodes:
- Person (id, name, role, email, tenant_id)
- Team (id, name, mission, tenant_id)
- Project (id, name, status, priority, tenant_id)
- System (id, name, description, criticality, tenant_id)
- Document (id, title, source_uri, source_type, content_hash, tenant_id)
- Incident (id, title, summary, resolution, created_at, status, tenant_id)
- SupportTicket (id, title, priority, status, tenant_id)
- Decision (id, title, rationale, status, created_at, tenant_id)
- Finding (id, text, created_at, session_id, verification_status, tenant_id)

Relationships:
- (Person)-[:MEMBER_OF]->(Team)
- (Team)-[:OWNS]->(System)
- (Person)-[:WORKED_ON]->(Project)
- (Project)-[:USES]->(System)
- (System)-[:DEPENDS_ON]->(System)
- (Incident)-[:AFFECTED]->(System)
- (Incident)-[:RESOLVED_BY]->(Person)
- (Incident)-[:DOCUMENTED_IN]->(Document)
- (SupportTicket)-[:RELATED_TO]->(System)
- (Decision)-[:INFORMED_BY]->(Incident)
- (Decision)-[:ABOUT]->(System)
- (Finding)-[:SUPPORTS]->(Incident|System|Project)
"""

NODE_LABELS = [
    "Person",
    "Team",
    "Project",
    "System",
    "Document",
    "Incident",
    "SupportTicket",
    "Decision",
    "Finding"
]

RELATIONSHIPS = [
    "MEMBER_OF",
    "OWNS",
    "WORKED_ON",
    "USES",
    "DEPENDS_ON",
    "AFFECTED",
    "RESOLVED_BY",
    "DOCUMENTED_IN",
    "RELATED_TO",
    "INFORMED_BY",
    "ABOUT",
    "SUPPORTS"
]

INDEX_QUERIES = [
    "CREATE INDEX FOR (p:Person) ON (p.id)",
    "CREATE INDEX FOR (t:Team) ON (t.id)",
    "CREATE INDEX FOR (pr:Project) ON (pr.id)",
    "CREATE INDEX FOR (s:System) ON (s.id)",
    "CREATE INDEX FOR (d:Document) ON (d.id)",
    "CREATE INDEX FOR (i:Incident) ON (i.id)",
    "CREATE INDEX FOR (st:SupportTicket) ON (st.id)",
    "CREATE INDEX FOR (dc:Decision) ON (dc.id)",
    "CREATE INDEX FOR (f:Finding) ON (f.id)"
]
