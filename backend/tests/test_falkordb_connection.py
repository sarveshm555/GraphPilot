import pytest
from unittest.mock import patch, MagicMock
from app.config import Settings
from app.graph.client import FalkorDBClient, db_client


def test_localhost_docker_development_preserved():
    """Verify default localhost configuration uses plain TCP (ssl=False) and connects to local Docker if running."""
    client = FalkorDBClient(host="localhost", port=6379, graph_name="graphpilot")
    assert client.is_remote_host is False
    assert client.effective_ssl is False
    
    health = client.health()
    assert health["host"] == "localhost"
    assert health["port"] == 6379
    assert health["ssl"] is False
    # If Docker container is running locally, it connects to real server
    if health["connected_to_remote"]:
        assert health["backend"] == "falkordb-server"
        assert health["indicator"] == "connected"
        assert health["connection_error"] is None


def test_cloud_host_ssl_auto_detection():
    """Verify that any remote cloud host automatically defaults to SSL/TLS enabled."""
    client = FalkorDBClient(
        host="my-cluster.falkordb.cloud",
        port=54735,
        graph_name="graphpilot",
        connect_timeout=0.1,
        socket_timeout=0.1
    )
    assert client.is_remote_host is True
    assert client.effective_ssl is True


def test_explicit_ssl_override_flags():
    """Verify that FALKORDB_SSL environment variable/parameter overrides default host behavior."""
    # Remote cloud host with SSL explicitly disabled
    client_no_ssl = FalkorDBClient(
        host="my-cluster.falkordb.cloud",
        port=54735,
        ssl=False,
        connect_timeout=0.1,
        socket_timeout=0.1
    )
    assert client_no_ssl.effective_ssl is False

    # Local host with SSL explicitly enabled
    client_force_ssl = FalkorDBClient(
        host="localhost",
        port=6379,
        ssl=True,
        connect_timeout=0.1,
        socket_timeout=0.1
    )
    assert client_force_ssl.effective_ssl is True


def test_driver_tls_supported_arguments_passed():
    """Verify that FalkorDB client passes the correct driver kwargs (ssl, ssl_cert_reqs, timeouts)."""
    with patch("app.graph.client.FalkorDB") as mock_falkordb_cls:
        mock_instance = MagicMock()
        mock_graph = MagicMock()
        mock_graph.query.return_value = MagicMock(result_set=[[1]])
        mock_instance.select_graph.return_value = mock_graph
        mock_falkordb_cls.return_value = mock_instance

        client = FalkorDBClient(
            host="remote-cloud.falkordb.cloud",
            port=54735,
            ssl=True,
            ssl_cert_reqs="none",
            connect_timeout=3.0,
            socket_timeout=7.0
        )

        assert client.is_connected is True
        assert client.connection_error is None

        # Verify FalkorDB constructor kwargs
        mock_falkordb_cls.assert_called_with(
            host="remote-cloud.falkordb.cloud",
            port=54735,
            password=None,
            ssl=True,
            ssl_cert_reqs="none",
            ssl_check_hostname=False,
            socket_timeout=7.0,
            socket_connect_timeout=3.0,
        )


def test_failed_cloud_connection_reports_accurate_error():
    """
    Ensure failed cloud connections report an accurate error,
    do NOT falsely report a live database connection, and fall back cleanly.
    """
    # Attempting to connect to an unreachable remote endpoint
    client = FalkorDBClient(
        host="nonexistent-cluster-999.falkordb.cloud",
        port=54735,
        graph_name="graphpilot",
        connect_timeout=0.2,
        socket_timeout=0.2
    )

    health = client.health()

    # Must NOT falsely report a live remote connection
    assert health["connected_to_remote"] is False
    assert health["backend"] == "falkordb-in-memory-engine"
    assert health["indicator"] == "fallback_active"
    assert health["ssl"] is True
    assert health["query_target"] == "in-memory-engine"

    # Must report the accurate error string
    assert health["connection_error"] is not None
    assert len(health["connection_error"]) > 0

    # Ensure querying still returns valid results via in-memory engine without crash
    res = client.query("MATCH (n) RETURN count(n) as count")
    assert res is not None


def test_ssl_cert_verification_failure_does_not_auto_disable_verification():
    """
    Verify that SSL certificate verification failures do NOT automatically disable verification.
    The client must fail cleanly, report connected_to_remote=False, and record the exact certificate error.
    """
    call_count = 0

    def mock_falkordb_init(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        assert kwargs.get("ssl_cert_reqs") == "required"
        raise Exception("SSLCertVerificationError: certificate verify failed: self-signed certificate")

    with patch("app.graph.client.FalkorDB", side_effect=mock_falkordb_init):
        client = FalkorDBClient(
            host="cloud-selfsigned.falkordb.cloud",
            port=54735,
            ssl=True,
            ssl_cert_reqs=None,
            connect_timeout=2.0,
            socket_timeout=2.0
        )
        # Driver should NOT be called a second time with ssl_cert_reqs='none'
        assert call_count == 1
        assert client.is_connected is False
        assert client.connection_error is not None
        assert "certificate verify failed" in client.connection_error

        health = client.health()
        assert health["connected_to_remote"] is False
        assert health["backend"] == "falkordb-in-memory-engine"
        assert health["indicator"] == "fallback_active"


def test_explicit_ssl_cert_reqs_when_configured():
    """Verify that when a user explicitly configures ssl_cert_reqs='none', that setting is respected."""
    with patch("app.graph.client.FalkorDB") as mock_falkordb_cls:
        mock_instance = MagicMock()
        mock_graph = MagicMock()
        mock_graph.query.return_value = MagicMock(result_set=[[1]])
        mock_instance.select_graph.return_value = mock_graph
        mock_falkordb_cls.return_value = mock_instance

        client = FalkorDBClient(
            host="cloud-cluster.falkordb.cloud",
            port=54735,
            ssl=True,
            ssl_cert_reqs="none",
            connect_timeout=2.0,
            socket_timeout=2.0
        )

        assert client.is_connected is True
        mock_falkordb_cls.assert_called_with(
            host="cloud-cluster.falkordb.cloud",
            port=54735,
            password=None,
            ssl=True,
            ssl_cert_reqs="none",
            ssl_check_hostname=False,
            socket_timeout=2.0,
            socket_connect_timeout=2.0,
        )
