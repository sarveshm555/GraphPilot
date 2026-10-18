import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.graph.client import db_client
from app.agent.tools import _get_result_rows, _to_prop_dict

class MemoryService:
    """
    Persistent Company Memory backed by FalkorDB Finding nodes.
    Survives API requests and application restarts.
    """
    @staticmethod
    def list_findings(status: Optional[str] = None) -> List[Dict[str, Any]]:
        cypher = (
            "MATCH (f:Finding) "
            "OPTIONAL MATCH (f)-[:SUPPORTS]->(target) "
            "RETURN f, collect(target) as connected_entities"
        )
        res = db_client.query(cypher)
        findings = []
        for row in _get_result_rows(res):
            f = _to_prop_dict(row[0])
            raw_targets = row[1] if len(row) > 1 else []
            connected = [_to_prop_dict(t) for t in raw_targets if t]
            if status and f.get("verification_status") != status:
                continue
            findings.append({
                "id": f.get("id"),
                "text": f.get("text"),
                "created_at": f.get("created_at"),
                "session_id": f.get("session_id"),
                "verification_status": f.get("verification_status", "verified"),
                "connected_entities": connected
            })
        return findings

    @staticmethod
    def confirm_finding(
        text: str,
        target_entity_id: Optional[str] = "sys-payment-api",
        session_id: str = "default-session",
        verification_status: str = "verified"
    ) -> Dict[str, Any]:
        finding_id = f"find-{uuid.uuid4().hex[:8]}"
        created_at = datetime.now(timezone.utc).isoformat()
        
        # Merge Finding Node
        node_query = (
            "MERGE (f:Finding {id: $id}) "
            "SET f.text = $text, f.created_at = $created_at, f.session_id = $session_id, f.verification_status = $status "
            "RETURN f"
        )
        db_client.query(node_query, {
            "id": finding_id,
            "text": text,
            "created_at": created_at,
            "session_id": session_id,
            "status": verification_status,
            "props": {
                "id": finding_id,
                "text": text,
                "created_at": created_at,
                "session_id": session_id,
                "verification_status": verification_status
            }
        })
        
        # Connect to entity if supplied
        if target_entity_id:
            edge_query = (
                "MATCH (f:Finding {id: $finding_id}), (target {id: $target_id}) "
                "MERGE (f)-[r:SUPPORTS]->(target) "
                "RETURN f.id, target.id"
            )
            db_client.query(edge_query, {
                "finding_id": finding_id,
                "target_id": target_entity_id,
                "source_id": finding_id,
                "props": {"confirmed_at": created_at}
            })

        return {
            "id": finding_id,
            "text": text,
            "created_at": created_at,
            "session_id": session_id,
            "verification_status": verification_status,
            "connected_to": target_entity_id
        }

    @staticmethod
    def verify_finding(finding_id: str) -> Dict[str, Any]:
        """Update a proposed finding to verified status in FalkorDB"""
        cypher = (
            "MATCH (f:Finding {id: $id}) "
            "SET f.verification_status = 'verified' "
            "RETURN f"
        )
        res = db_client.query(cypher, {"id": finding_id})
        rows = _get_result_rows(res)
        if not rows:
            return {"success": False, "message": f"Finding '{finding_id}' not found"}
        props = _to_prop_dict(rows[0][0])
        return {"success": True, "finding": props}

    @staticmethod
    def supersede_finding(finding_id: str, new_text: Optional[str] = None) -> Dict[str, Any]:
        """Mark finding as superseded by an updated finding or correction"""
        superseded_at = datetime.now(timezone.utc).isoformat()
        cypher = (
            "MATCH (f:Finding {id: $id}) "
            "SET f.verification_status = 'superseded', f.superseded_at = $superseded_at "
            "RETURN f"
        )
        res = db_client.query(cypher, {"id": finding_id, "superseded_at": superseded_at})
        rows = _get_result_rows(res)
        if not rows:
            return {"success": False, "message": f"Finding '{finding_id}' not found"}
        props = _to_prop_dict(rows[0][0])
        
        replacement = None
        if new_text and new_text.strip():
            replacement = MemoryService.confirm_finding(
                text=new_text.strip(),
                target_entity_id="sys-payment-api",
                session_id=props.get("session_id", "default-session"),
                verification_status="verified"
            )
            link_cypher = (
                "MATCH (old:Finding {id: $old_id}), (new:Finding {id: $new_id}) "
                "MERGE (old)-[:SUPERSEDED_BY]->(new) "
                "RETURN old.id, new.id"
            )
            db_client.query(link_cypher, {"old_id": finding_id, "new_id": replacement["id"]})

        return {"success": True, "finding": props, "replacement": replacement}

    # Alias for flexibility
    record_finding = confirm_finding

memory_service = MemoryService()
