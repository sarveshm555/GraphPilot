import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.graph.seed import seed_database
from app.analysis.blast_radius import calculate_blast_radius
from app.memory.service import memory_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_graph():
    seed_database()

def test_blast_radius_payment_api():
    """Verify blast radius calculation for Payment API"""
    res = client.get("/api/blast-radius?system_id=sys-payment-api&max_depth=3")
    assert res.status_code == 200
    data = res.json()
    assert data["target_system"]["id"] == "sys-payment-api"
    assert data["target_system"]["name"] == "Payment API"
    
    # Check severity
    assert data["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    
    # Check direct downstream projects (Project Alpha and Checkout Modernization V2)
    downstream_projects = [p["name"] for p in data["direct_downstream_projects"]]
    assert "Project Alpha" in downstream_projects
    assert "Checkout Modernization V2" in downstream_projects
    
    # Check direct upstream dependencies
    upstream_deps = [d["name"] for d in data["direct_upstream_dependencies"]]
    assert "Transaction Database" in upstream_deps
    assert "Fraud Detection Service" in upstream_deps
    
    # Check owning team structure
    owning_team_names = [t["team"]["name"] for t in data["owning_teams"]]
    assert "Payments Engineering" in owning_team_names
    
    # Check key engineers across owning teams
    engineers = [e["name"] for t in data["owning_teams"] for e in t["engineers"]]
    assert "Priya Sharma" in engineers
    
    # Check historical incidents
    incident_ids = [inc["incident"]["id"] for inc in data["historical_incidents"]]
    assert "inc-101" in incident_ids

def test_blast_radius_nonexistent_system():
    """Verify honest error handling when querying unknown system"""
    res = client.get("/api/blast-radius?system_id=sys-nonexistent")
    assert res.status_code == 404
    data = res.json()
    assert "not found" in data["detail"].lower()

def test_entities_search():
    """Verify entity directory search with query and label filtering"""
    # Search for Priya
    res = client.get("/api/entities/search?query=Priya")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    names = [r["name"] for r in data]
    assert "Priya Sharma" in names
    
    # Search by label Person
    res_person = client.get("/api/entities/search?label=Person")
    assert res_person.status_code == 200
    data_person = res_person.json()
    assert isinstance(data_person, list)
    labels = [r["label"] for r in data_person]
    assert all(l == "Person" for l in labels)

def test_memory_verify_and_supersede():
    """Verify memory verification and superseding lifecycle"""
    # 1. Propose memory
    rec = memory_service.record_finding(
        text="Cache TTL should be set to 300 seconds",
        target_entity_id="sys-payment-api",
        verification_status="proposed"
    )
    finding_id = rec["id"]
    assert rec["verification_status"] == "proposed"
    
    # 2. Verify memory
    res_verify = client.post(f"/api/memory/{finding_id}/verify")
    assert res_verify.status_code == 200
    v_data = res_verify.json()
    assert v_data["finding"]["verification_status"] == "verified"
    
    # 3. Supersede memory
    res_super = client.post(
        f"/api/memory/{finding_id}/supersede",
        params={"new_text": "Cache TTL should be set to 600 seconds due to high traffic"}
    )
    assert res_super.status_code == 200
    s_data = res_super.json()
    assert s_data["success"] is True
    assert s_data["finding"]["verification_status"] == "superseded"
    assert s_data["replacement"]["verification_status"] == "verified"

def test_document_ingestion_duplicate():
    """Verify document upload deduplication via hash matching"""
    uid = uuid.uuid4().hex[:8]
    file_content = f"# Architecture Guide {uid}\nPayment API uses PostgreSQL and Redis.".encode("utf-8")
    
    # First upload
    res1 = client.post(
        "/api/documents/upload",
        files={"file": (f"guide_{uid}.md", file_content, "text/markdown")}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["already_ingested"] is False
    assert data1["graph_modified"] is True
    
    # Duplicate upload with identical content
    res2 = client.post(
        "/api/documents/upload",
        files={"file": (f"guide_dup_{uid}.md", file_content, "text/markdown")}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["already_ingested"] is True
    assert data2["graph_modified"] is False
    assert data2["relationships_linked"] == 0
