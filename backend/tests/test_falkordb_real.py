import pytest
from app.config import settings
from app.graph.client import db_client
from app.graph.seed import seed_database
from app.agent.tools import (
    tool_find_system_dependencies,
    tool_find_previous_incidents,
    tool_find_shortest_path,
    FindSystemDependenciesInput,
    FindPreviousIncidentsInput,
    FindShortestPathInput
)

def is_real_falkordb_running() -> bool:
    """Check if real FalkorDB server is connected on configured host/port"""
    health = db_client.health()
    return health.get("connected_to_remote", False) is True

@pytest.mark.skipif(
    not is_real_falkordb_running(),
    reason=(
        "Real FalkorDB server is not running on configured host/port "
        f"({settings.FALKORDB_HOST}:{settings.FALKORDB_PORT}). "
        "Skipping real database integration tests. Start FalkorDB via "
        "'docker run -p 6379:6379 -it --rm falkordb/falkordb' to run these tests."
    )
)
class TestRealFalkorDBIntegration:
    """
    Integration tests executed exclusively against a live, genuine FalkorDB server.
    Ensures parameterized Cypher queries, multi-hop traversals, and indexing work on the server.
    """

    def test_real_server_ping(self):
        res = db_client.graph.query("RETURN 1 as ping")
        assert res is not None
        assert len(res.result_set) == 1
        assert res.result_set[0][0] == 1

    def test_real_server_seeding_and_counts(self):
        seed_res = seed_database()
        assert seed_res["nodes_seeded"] > 0
        assert seed_res["relationships_seeded"] > 0
        
        # Verify node count query
        count_res = db_client.graph.query("MATCH (n) RETURN count(n) as total")
        assert count_res.result_set[0][0] >= 20

    def test_real_server_system_dependencies(self):
        res = tool_find_system_dependencies(FindSystemDependenciesInput(system_name="Payment API"))
        assert res["found"] is True
        assert len(res["facts"]) > 0
        fact = res["facts"][0]
        upstream_names = [d.get("name") for d in fact["upstream_dependencies"]]
        assert "Transaction Database" in upstream_names

    def test_real_server_incident_retrieval(self):
        res = tool_find_previous_incidents(FindPreviousIncidentsInput(system_id="sys-payment-api"))
        assert len(res["incidents"]) > 0
        inc_data = res["incidents"][0]
        assert inc_data["incident"]["id"] == "inc-101"
        assert inc_data["resolved_by"]["name"] == "Priya Sharma"

    def test_real_server_multi_hop_shortest_path(self):
        res = tool_find_shortest_path(FindShortestPathInput(
            start_entity="Project Alpha",
            end_entity="Transaction Database"
        ))
        assert res["paths_found"] > 0
        first_path = res["paths"][0]
        assert len(first_path) >= 2
