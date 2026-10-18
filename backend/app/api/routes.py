from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Dict, Any, List, Optional
from app.graph.client import db_client
from app.graph.seed import seed_database
from app.agent.orchestrator import agent_orchestrator
from app.agent.schemas import ChatRequest, GroundedAnswer, MemoryConfirmRequest
from app.agent.tools import _get_result_rows, _to_prop_dict
from app.config import settings
from app.memory.service import memory_service
from app.ingestion.pipeline import ingestion_pipeline

router = APIRouter(prefix="/api")

@router.get("/overview")
def get_overview() -> Dict[str, Any]:
    """Summary metrics of the knowledge graph and application state"""
    node_types: Dict[str, int] = {}
    nodes_count = 0
    edges_count = 0

    db_client.ensure_connected()

    if db_client.is_connected and db_client.graph:
        try:
            # Query node count and types from real FalkorDB
            n_res = db_client.query("MATCH (n) RETURN labels(n)[0] as lbl, count(n) as cnt")
            for row in _get_result_rows(n_res):
                lbl = row[0] if row[0] else "Entity"
                cnt = row[1] if len(row) > 1 else 1
                node_types[lbl] = cnt
                nodes_count += cnt
                
            e_res = db_client.query("MATCH ()-[r]->() RETURN count(r) as total")
            e_rows = _get_result_rows(e_res)
            if e_rows:
                edges_count = e_rows[0][0]
        except Exception:
            pass
    else:
        # Fallback in-memory inspection
        if hasattr(db_client, "in_memory_engine"):
            nodes_count = len(db_client.in_memory_engine.nodes)
            edges_count = len(db_client.in_memory_engine.edges)
            for n in db_client.in_memory_engine.nodes.values():
                for lbl in n.get("labels", []):
                    node_types[lbl] = node_types.get(lbl, 0) + 1

    llm_info = {
        "provider": settings.LLM_PROVIDER,
        "model": settings.effective_model,
        "status": agent_orchestrator.get_llm_status(),
        "tool_calling_enabled": True,
        "timeout_seconds": settings.effective_timeout,
        "error": agent_orchestrator.get_llm_error(),
        "error_type": agent_orchestrator.get_llm_error_type()
    }

    verified_memories_count = len(memory_service.list_findings(status="verified"))

    return {
        "status": "online",
        "graph_name": db_client.graph_name,
        "total_nodes": nodes_count,
        "total_relationships": edges_count,
        "node_type_distribution": node_types,
        "verified_memories": verified_memories_count,
        "health": db_client.health(),
        "llm": llm_info
    }

@router.post("/llm/test")
def test_llm_endpoint() -> Dict[str, Any]:
    """Validate runtime connectivity to the configured LLM provider"""
    return agent_orchestrator.test_llm_connection()

@router.post("/chat", response_model=GroundedAnswer)
def chat_with_agent(req: ChatRequest) -> GroundedAnswer:
    """Natural language question endpoint grounded by FalkorDB graph reasoning"""
    return agent_orchestrator.process_question(
        question=req.question,
        session_id=req.session_id or "default-session",
        tenant_id=req.tenant_id or "novapay-primary"
    )

@router.get("/graph")
def get_graph(limit: int = 150) -> Dict[str, Any]:
    """Retrieve graph nodes and relationships for visual graph explorer"""
    formatted_nodes = []
    formatted_edges = []

    db_client.ensure_connected()

    if db_client.is_connected and db_client.graph:
        try:
            n_res = db_client.query(f"MATCH (n) RETURN n, labels(n) LIMIT {limit}")
            for row in _get_result_rows(n_res):
                n_obj = row[0]
                props = _to_prop_dict(n_obj)
                labels = row[1] if len(row) > 1 and row[1] else (n_obj.labels if hasattr(n_obj, "labels") else ["Entity"])
                nid = props.get("id") or str(getattr(n_obj, "id", ""))
                formatted_nodes.append({
                    "id": nid,
                    "labels": labels,
                    "properties": props
                })

            e_res = db_client.query(f"MATCH (a)-[r]->(b) RETURN a.id, b.id, type(r), r LIMIT {limit * 2}")
            for row in _get_result_rows(e_res):
                src = row[0]
                tgt = row[1]
                rtype = row[2] if len(row) > 2 else "CONNECTED"
                r_props = _to_prop_dict(row[3]) if len(row) > 3 else {}
                if src and tgt:
                    formatted_edges.append({
                        "source": src,
                        "target": tgt,
                        "type": rtype,
                        "properties": r_props
                    })
            return {
                "nodes": formatted_nodes,
                "edges": formatted_edges,
                "total_nodes": len(formatted_nodes),
                "total_edges": len(formatted_edges)
            }
        except Exception:
            pass

    # Fallback to in-memory engine
    res = db_client.query("RETURN n")
    if len(res) > 0 and len(res.result_set) > 0:
        nodes = res.result_set[0][0]
        edges = res.result_set[0][1]
        return {
            "nodes": nodes[:limit],
            "edges": edges[:limit * 2],
            "total_nodes": len(nodes),
            "total_edges": len(edges)
        }
    return {"nodes": [], "edges": [], "total_nodes": 0, "total_edges": 0}

@router.get("/graph/entities/{entity_id}")
def get_entity_details(entity_id: str) -> Dict[str, Any]:
    """Retrieve detailed properties and relationships for a selected graph entity"""
    if db_client.is_connected and db_client.graph:
        try:
            res = db_client.query(
                "MATCH (n) WHERE toLower(n.id) = toLower($id) OR toLower(n.name) = toLower($id) RETURN n, labels(n)",
                {"id": entity_id}
            )
            rows = _get_result_rows(res)
            if rows:
                node = rows[0][0]
                props = _to_prop_dict(node)
                labels = rows[0][1] if len(rows[0]) > 1 else (node.labels if hasattr(node, "labels") else ["Entity"])
                
                # Fetch neighbors
                nbr_res = db_client.query(
                    "MATCH (n)-[r]-(neighbor) WHERE toLower(n.id) = toLower($id) RETURN neighbor, type(r), r",
                    {"id": entity_id}
                )
                neighbors = []
                for n_row in _get_result_rows(nbr_res):
                    neighbors.append({
                        "node": _to_prop_dict(n_row[0]),
                        "edge": {"type": n_row[1], "properties": _to_prop_dict(n_row[2]) if len(n_row) > 2 else {}}
                    })
                return {
                    "entity": {"id": props.get("id", entity_id), "labels": labels, "properties": props},
                    "neighbors": neighbors
                }
        except Exception:
            pass

    # Fallback
    if hasattr(db_client, "in_memory_engine"):
        node = db_client.in_memory_engine.get_node(entity_id)
        if not node:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_id}' not found")
        neighbors = db_client.in_memory_engine.get_neighbors(entity_id)
        return {
            "entity": node,
            "neighbors": neighbors
        }
    return {"entity_id": entity_id, "detail": "Connected to remote FalkorDB"}

@router.get("/graph/path")
def find_graph_path(start: str, end: str) -> Dict[str, Any]:
    """Compute explicit multi-hop traversal paths connecting any two entities"""
    from app.agent.tools import tool_find_shortest_path, FindShortestPathInput
    res = tool_find_shortest_path(FindShortestPathInput(start_entity=start, end_entity=end))
    return res

@router.get("/blast-radius")
def get_blast_radius(system_id: str, max_depth: int = Query(default=3, ge=1, le=5)) -> Dict[str, Any]:
    """Calculate blast radius and multi-hop impact analysis for a system"""
    from app.analysis.blast_radius import calculate_blast_radius
    res = calculate_blast_radius(system_id=system_id, max_depth=max_depth)
    if not res.get("found", True):
        raise HTTPException(status_code=404, detail=res.get("message", f"System '{system_id}' not found"))
    return res

@router.get("/entities/search")
def search_entities_endpoint(query: str = Query(default=""), label: Optional[str] = None) -> List[Dict[str, Any]]:
    """Search across all entity types in FalkorDB with connection summaries"""
    cypher = (
        "MATCH (n) "
        "OPTIONAL MATCH (n)-[r]-(neighbor) "
        "RETURN n, labels(n)[0] as lbl, count(r) as conn_count, collect(DISTINCT labels(neighbor)[0]) as neighbor_labels"
    )
    res = db_client.query(cypher)
    rows = _get_result_rows(res)
    results = []
    q_lower = query.strip().lower()
    for row in rows:
        n_dict = _to_prop_dict(row[0])
        lbl = row[1] if len(row) > 1 and row[1] else "Entity"
        cnt = row[2] if len(row) > 2 else 0
        raw_n_labels = row[3] if len(row) > 3 else []
        n_labels = [l for l in raw_n_labels if l]

        if label and label.lower() != "all" and lbl.lower() != label.lower():
            continue

        name = n_dict.get("name") or n_dict.get("title") or n_dict.get("id") or ""
        desc = n_dict.get("description") or n_dict.get("summary") or n_dict.get("mission") or n_dict.get("role") or n_dict.get("text") or ""

        if not q_lower or q_lower in name.lower() or q_lower in n_dict.get("id", "").lower() or q_lower in desc.lower():
            results.append({
                "id": n_dict.get("id", ""),
                "label": lbl,
                "name": name,
                "description": desc,
                "properties": n_dict,
                "connected_count": cnt,
                "neighbor_types": n_labels
            })
    return results

@router.get("/memory")
def get_memory(status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve persistent findings and organizational resolutions"""
    return memory_service.list_findings(status=status)

@router.post("/memory/confirm")
def confirm_memory(req: MemoryConfirmRequest) -> Dict[str, Any]:
    """Save or verify a company finding node in FalkorDB"""
    return memory_service.confirm_finding(
        text=req.text,
        target_entity_id=req.target_entity_id,
        session_id=req.session_id or "default-session",
        verification_status=req.verification_status or "verified"
    )

@router.post("/memory/{finding_id}/verify")
def verify_finding_endpoint(finding_id: str) -> Dict[str, Any]:
    """Mark a proposed finding as verified in FalkorDB"""
    return memory_service.verify_finding(finding_id)

@router.post("/memory/{finding_id}/supersede")
def supersede_finding_endpoint(
    finding_id: str, 
    new_text: Optional[str] = Query(default=None),
    req: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Mark finding as superseded with optional replacement text"""
    replacement = new_text or (req.get("replacement_text") if req else None)
    return memory_service.supersede_finding(finding_id, new_text=replacement)

@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Upload organizational document (Markdown, TXT, CSV) to ingestion pipeline"""
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")
    result = ingestion_pipeline.process_file(file.filename or "document.txt", content)
    return result

@router.get("/documents")
def list_documents() -> List[Dict[str, Any]]:
    """List ingested documents and knowledge artifacts"""
    return ingestion_pipeline.list_documents()

@router.post("/seed")
def trigger_seed() -> Dict[str, Any]:
    """Trigger idempotent synthetic graph seeding"""
    return seed_database()
