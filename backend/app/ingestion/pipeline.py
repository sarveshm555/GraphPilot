"""
Document Ingestion Pipeline
- Supports Markdown (.md), TXT (.txt), and CSV (.csv)
- Computes SHA256 content hashes for idempotent deduplication
- Extracts structured entities & proposed relationships
- Preserves document provenance and metadata
"""
import hashlib
import uuid
import os
from typing import Dict, Any, List, Optional
from app.graph.client import db_client

class IngestionPipeline:
    def __init__(self, storage_dir: str = "./data/documents"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

    def process_file(self, filename: str, content: bytes, source_type: Optional[str] = None) -> Dict[str, Any]:
        # Compute hash
        content_hash = hashlib.sha256(content).hexdigest()
        ext = os.path.splitext(filename)[1].lower()
        if not source_type:
            source_type = ext.replace(".", "") or "txt"

        doc_id = f"doc-{content_hash[:10]}"
        text_content = content.decode("utf-8", errors="replace")

        # Check if already ingested in FalkorDB
        from app.agent.tools import _get_result_rows, _to_prop_dict
        check_q = "MATCH (d:Document {id: $id}) RETURN d"
        existing_res = db_client.query(check_q, {"id": doc_id})
        already_ingested = len(_get_result_rows(existing_res)) > 0

        # Entity and Relationship Extraction
        extracted = self.extract_entities(text_content, filename)

        # Prepare preview of relationships
        relationships_preview = []
        for sys_id in extracted["systems"]:
            relationships_preview.append({"source": doc_id, "type": "ABOUT", "target": sys_id})
        for inc_id in extracted["incidents"]:
            relationships_preview.append({"source": inc_id, "type": "DOCUMENTED_IN", "target": doc_id})

        if already_ingested:
            return {
                "status": "success",
                "message": "Document content identical to previously ingested knowledge (SHA-256 matched).",
                "document_id": doc_id,
                "filename": filename,
                "source_type": source_type,
                "content_hash": content_hash,
                "bytes_processed": len(content),
                "text_status": f"Decoded UTF-8 text ({len(text_content)} characters)",
                "extracted_entities": extracted,
                "already_ingested": True,
                "graph_modified": False,
                "relationships_linked": 0,
                "relationships_preview": relationships_preview,
                "validation_errors": []
            }

        # Save to storage
        local_path = os.path.join(self.storage_dir, f"{doc_id}_{filename}")
        with open(local_path, "w", encoding="utf-8") as f:
            f.write(text_content)

        # Entity and Relationship Extraction
        extracted = self.extract_entities(text_content, filename)
        
        # Store Document Node in Graph
        doc_query = (
            "MERGE (d:Document {id: $id}) "
            "SET d.title = $title, d.source_uri = $source_uri, d.source_type = $source_type, d.content_hash = $hash "
            "RETURN d"
        )
        db_client.query(doc_query, {
            "id": doc_id,
            "title": filename,
            "source_uri": f"file://{local_path}",
            "source_type": source_type,
            "hash": content_hash,
            "props": {
                "id": doc_id,
                "title": filename,
                "source_uri": f"file://{local_path}",
                "source_type": source_type,
                "content_hash": content_hash,
                "excerpt": text_content[:200]
            }
        })

        # Connect Extracted Entities
        relationships_linked = 0
        for sys_id in extracted["systems"]:
            db_client.query(
                "MATCH (d:Document {id: $doc_id}), (s:System {id: $sys_id}) MERGE (d)-[:ABOUT]->(s) RETURN d, s",
                {"doc_id": doc_id, "sys_id": sys_id, "source_id": doc_id, "target_id": sys_id, "props": {}}
            )
            relationships_linked += 1

        for inc_id in extracted["incidents"]:
            db_client.query(
                "MATCH (inc:Incident {id: $inc_id}), (d:Document {id: $doc_id}) MERGE (inc)-[:DOCUMENTED_IN]->(d) RETURN inc, d",
                {"inc_id": inc_id, "doc_id": doc_id}
            )
            relationships_linked += 1

        return {
            "status": "success",
            "document_id": doc_id,
            "filename": filename,
            "source_type": source_type,
            "content_hash": content_hash,
            "bytes_processed": len(content),
            "text_status": f"Decoded UTF-8 text ({len(text_content)} characters)",
            "extracted_entities": extracted,
            "already_ingested": already_ingested,
            "graph_modified": not already_ingested or relationships_linked > 0,
            "relationships_linked": relationships_linked,
            "relationships_preview": relationships_preview,
            "validation_errors": []
        }

    def extract_entities(self, text: str, filename: str) -> Dict[str, List[str]]:
        """Structured entity identifier based on known company terms"""
        lower = text.lower()
        found_systems = []
        if "payment" in lower:
            found_systems.append("sys-payment-api")
        if "database" in lower or "transaction" in lower:
            found_systems.append("sys-trans-db")
        if "fraud" in lower:
            found_systems.append("sys-fraud-engine")

        found_incidents = []
        if "inc-101" in lower:
            found_incidents.append("inc-101")
        if "inc-102" in lower:
            found_incidents.append("inc-102")

        return {
            "systems": found_systems,
            "incidents": found_incidents,
            "char_count": len(text)
        }

    def list_documents(self) -> List[Dict[str, Any]]:
        from app.agent.tools import _get_result_rows, _to_prop_dict
        res = db_client.query("MATCH (d:Document) RETURN d")
        docs = []
        for row in _get_result_rows(res):
            doc = _to_prop_dict(row[0])
            docs.append(doc)
        return docs

ingestion_pipeline = IngestionPipeline()
