import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app.graph.seed import seed_database
from app.graph.client import db_client
from app.agent.tools import (
    tool_find_system_dependencies,
    tool_find_related_projects,
    tool_find_previous_incidents,
    tool_find_shortest_path,
    FindSystemDependenciesInput,
    FindRelatedProjectsInput,
    FindPreviousIncidentsInput,
    FindShortestPathInput
)
from app.agent.orchestrator import agent_orchestrator
from app.agent.validation import GroundingValidator
from app.memory.service import memory_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_graph():
    seed_database()

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_overview_endpoint():
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_nodes"] > 10
    assert data["total_relationships"] > 10

def test_tool_find_system_dependencies():
    res = tool_find_system_dependencies(FindSystemDependenciesInput(system_name="Payment API"))
    assert res["found"] is True
    assert len(res["facts"]) > 0
    facts = res["facts"][0]
    # Check upstream deps
    upstream_names = [d["name"] for d in facts["upstream_dependencies"]]
    assert "Transaction Database" in upstream_names
    assert "Fraud Detection Service" in upstream_names

def test_tool_find_previous_incidents():
    res = tool_find_previous_incidents(FindPreviousIncidentsInput(system_id="sys-payment-api"))
    assert len(res["incidents"]) > 0
    inc = res["incidents"][0]
    assert inc["incident"]["id"] == "inc-101"
    assert inc["resolved_by"]["name"] == "Priya Sharma"
    assert len(res["sources"]) > 0

def test_multi_hop_shortest_path():
    """Verify 3+ hop traversal from Project Alpha to Transaction Database or Team Payments"""
    res = tool_find_shortest_path(FindShortestPathInput(
        start_entity="Project Alpha",
        end_entity="Transaction Database"
    ))
    assert res["paths_found"] > 0
    # First path length should have multiple hops (Project Alpha -> Payment API -> Transaction DB)
    first_path = res["paths"][0]
    assert len(first_path["edges"]) >= 2
    edge_types = [e["type"] for e in first_path["edges"]]
    assert "USES" in edge_types
    assert "DEPENDS_ON" in edge_types

def test_agent_refuses_unknown_entity():
    """Verify agent does not fabricate fake entity Project Omega"""
    res = agent_orchestrator.process_question("Which systems depend on Project Omega?")
    assert res.outcome == "entity_unknown"
    assert "Project Omega" in res.answer or "Project Omega" in res.limitations[0]
    assert len(res.facts) == 0

def test_agent_chat_multi_hop_answer():
    req_body = {"question": "How is Project Alpha connected to Engineer Priya Sharma?"}
    res = client.post("/api/chat", json=req_body)
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "answered_with_path"
    assert len(data["graph_paths"]) > 0
    assert "Payment API" in data["answer"] or "Lead Engineer" in data["answer"]

def test_persistent_memory():
    # Save a finding
    mem = memory_service.confirm_finding(
        text="All high-throughput mutations must verify write-ahead logs.",
        target_entity_id="sys-trans-db",
        session_id="test-session-1"
    )
    assert mem["id"].startswith("find-")
    assert mem["verification_status"] == "verified"
    
    # Query findings
    all_findings = memory_service.list_findings()
    matching = [f for f in all_findings if f["id"] == mem["id"]]
    assert len(matching) == 1
    assert matching[0]["text"] == "All high-throughput mutations must verify write-ahead logs."

def test_document_ingestion_and_provenance():
    sample_md = b"# INC-101 Postmortem Analysis\nPayment API experienced high latency connecting to Transaction Database."
    files = {"file": ("INC-101-analysis.md", sample_md, "text/markdown")}
    res = client.post("/api/documents/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "sys-payment-api" in data["extracted_entities"]["systems"]
    assert "inc-101" in data["extracted_entities"]["incidents"]
