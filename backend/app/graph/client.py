import logging
from typing import Any, Dict, List, Optional
from app.config import settings

logger = logging.getLogger("graphpilot.falkordb")

try:
    from falkordb import FalkorDB
    _FALKORDB_AVAILABLE = True
except ImportError:
    _FALKORDB_AVAILABLE = False
    logger.warning("Official falkordb package not available; in-memory fallback will be used.")

class FalkorDBClient:
    """
    FalkorDB Client with transparent connection management & explicit status reporting.
    Distinguishes:
    - real FalkorDB connection (with TLS/SSL support for FalkorDB Cloud)
    - in-memory fallback
    - database unavailable
    Includes dynamic auto-reconnect logic so whenever FalkorDB becomes available,
    queries immediately execute against the live FalkorDB instance.
    """
    def __init__(
        self,
        host: str = settings.FALKORDB_HOST,
        port: int = settings.FALKORDB_PORT,
        graph_name: str = settings.FALKORDB_GRAPH_NAME,
        ssl: Optional[bool] = None,
        ssl_cert_reqs: Optional[str] = None,
        connect_timeout: float = settings.FALKORDB_CONNECT_TIMEOUT,
        socket_timeout: float = settings.FALKORDB_SOCKET_TIMEOUT,
    ):
        self.host = host
        self.port = port
        self.graph_name = graph_name
        self.ssl = ssl if ssl is not None else settings.FALKORDB_SSL
        self.ssl_cert_reqs = ssl_cert_reqs or settings.FALKORDB_SSL_CERT_REQS
        self.connect_timeout = connect_timeout
        self.socket_timeout = socket_timeout
        self.real_client = None
        self.graph = None
        self.is_connected = False
        self.connection_error: Optional[str] = None
        self._init_connection()

    @property
    def is_remote_host(self) -> bool:
        return self.host.lower().strip() not in ("localhost", "127.0.0.1")

    @property
    def effective_ssl(self) -> bool:
        if self.ssl is not None:
            return self.ssl
        # FalkorDB Cloud instances require TLS; localhost Docker defaults to plain TCP
        return self.is_remote_host

    def _try_connect_host(self, host: str, ssl_enabled: bool) -> bool:
        if not _FALKORDB_AVAILABLE:
            self.connection_error = "falkordb library not installed"
            return False

        cert_reqs = self.ssl_cert_reqs or "required"

        try:
            client = FalkorDB(
                host=host,
                port=self.port,
                password=settings.FALKORDB_PASSWORD or None,
                ssl=ssl_enabled,
                ssl_cert_reqs=cert_reqs if ssl_enabled else "required",
                ssl_check_hostname=False,
                socket_timeout=self.socket_timeout,
                socket_connect_timeout=self.connect_timeout,
            )
            g = client.select_graph(self.graph_name)
            # Test connectivity
            g.query("RETURN 1")
            self.real_client = client
            self.graph = g
            self.is_connected = True
            self.connection_error = None
            logger.info(
                f"Connected to real FalkorDB server at {host}:{self.port} "
                f"(ssl={ssl_enabled}, cert_reqs={cert_reqs if ssl_enabled else 'N/A'}), "
                f"graph: {self.graph_name}"
            )
            return True
        except Exception as e:
            err_msg = str(e)
            self.connection_error = err_msg
            logger.warning(f"FalkorDB connection failed for {host}:{self.port} (ssl={ssl_enabled}): {err_msg}")
            return False

    def _init_connection(self):
        self.ensure_connected(force=True)

    def ensure_connected(self, force: bool = False) -> bool:
        """
        Verify connection to real FalkorDB server.
        If disconnected or forced, attempts connection to configured host (and 127.0.0.1 IPv4 fallback for localhost).
        """
        if self.is_connected and self.graph and not force:
            try:
                self.graph.query("RETURN 1")
                return True
            except Exception as e:
                logger.warning(f"Connection check failed: {e}. Attempting reconnect...")
                self.is_connected = False
                self.real_client = None
                self.graph = None
                self.connection_error = str(e)

        # Determine SSL configuration
        ssl_enabled = self.effective_ssl

        # 1. Attempt connection to configured host
        if self._try_connect_host(self.host, ssl_enabled=ssl_enabled):
            return True

        # 2. If configured host was "localhost", also attempt direct 127.0.0.1 (Windows IPv4)
        if self.host.lower() == "localhost":
            if self._try_connect_host("127.0.0.1", ssl_enabled=False):
                return True

        self.is_connected = False
        self.real_client = None
        self.graph = None
        self._init_in_memory_engine()
        return False

    def _init_in_memory_engine(self):
        from app.graph.in_memory_engine import InMemoryGraphEngine
        if not hasattr(self, "in_memory_engine"):
            self.in_memory_engine = InMemoryGraphEngine()

    def query(self, cypher: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """
        Execute a parameterized Cypher query.
        When connected to real FalkorDB, executes the raw parameterized Cypher on the server.
        When offline, executes on the in-memory engine.
        """
        params = params or {}
        if not self.is_connected:
            self.ensure_connected()

        if self.is_connected and self.graph:
            try:
                return self.graph.query(cypher, params)
            except Exception as e:
                err_str = str(e)
                if "already indexed" in err_str.lower() or "already exists" in err_str.lower():
                    logger.debug(f"Index query note: {e}")
                    return None
                
                # Check for network/connection drop errors
                if any(k in err_str.lower() for k in ["connection refused", "connection reset", "broken pipe", "timeout"]):
                    logger.warning(f"FalkorDB connection dropped during query: {e}. Falling back to in-memory.")
                    self.is_connected = False
                    self.real_client = None
                    self.graph = None
                    self.connection_error = str(e)
                    self._init_in_memory_engine()
                    return self.in_memory_engine.query(cypher, params)

                logger.error(f"FalkorDB server query error: {e}")
                raise e
        else:
            if not hasattr(self, "in_memory_engine"):
                self._init_in_memory_engine()
            return self.in_memory_engine.query(cypher, params)

    def health(self) -> Dict[str, Any]:
        """
        Returns explicit status indicator:
        - "connected": Real FalkorDB server connected and responding.
        - "fallback_active": Real server unavailable, in-memory engine active.
        - "unavailable": Neither real server nor fallback engine is operational.
        """
        is_live = self.ensure_connected()
        status_indicator = "connected" if is_live else ("fallback_active" if hasattr(self, "in_memory_engine") else "unavailable")

        return {
            "status": "healthy" if status_indicator in ("connected", "fallback_active") else "unhealthy",
            "indicator": status_indicator,
            "backend": "falkordb-server" if is_live else "falkordb-in-memory-engine",
            "host": self.host,
            "port": self.port,
            "ssl": self.effective_ssl,
            "graph_name": self.graph_name,
            "connected_to_remote": is_live,
            "query_target": f"falkordb-server ({self.host}:{self.port}, ssl={self.effective_ssl})" if is_live else "in-memory-engine",
            "connection_error": None if is_live else self.connection_error
        }

db_client = FalkorDBClient()
