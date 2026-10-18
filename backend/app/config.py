from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "*"]
    
    # FalkorDB settings
    FALKORDB_HOST: str = "localhost"
    FALKORDB_PORT: int = 6379
    FALKORDB_PASSWORD: str = ""
    FALKORDB_GRAPH_NAME: str = "graphpilot"
    FALKORDB_SSL: Optional[bool] = None
    FALKORDB_SSL_CERT_REQS: Optional[str] = None
    FALKORDB_CONNECT_TIMEOUT: float = 5.0
    FALKORDB_SOCKET_TIMEOUT: float = 10.0
    
    # LLM Settings
    LLM_PROVIDER: str = "mock"  # "mock", "openai", "gemini"
    LLM_MODEL: str = "gpt-4o-mini"
    OPENAI_MODEL: str = ""
    LLM_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_API_BASE: str = ""
    OPENAI_TIMEOUT_SECONDS: float = 30.0
    LLM_TIMEOUT_SECONDS: float = 30.0
    
    # Storage
    DOCUMENT_STORAGE_PATH: str = "./data/documents"
    MAX_UPLOAD_SIZE_MB: int = 10
    LOG_LEVEL: str = "INFO"

    @property
    def effective_api_key(self) -> str:
        return (self.OPENAI_API_KEY or self.LLM_API_KEY or "").strip()

    @property
    def effective_model(self) -> str:
        return (self.OPENAI_MODEL or self.LLM_MODEL or "gpt-4o-mini").strip()

    @property
    def effective_timeout(self) -> float:
        if self.OPENAI_TIMEOUT_SECONDS != 30.0:
            return self.OPENAI_TIMEOUT_SECONDS
        return self.LLM_TIMEOUT_SECONDS

    @property
    def is_mock_llm(self) -> bool:
        return self.LLM_PROVIDER.lower() in ("mock", "offline", "deterministic")

    @property
    def is_real_llm_configured(self) -> bool:
        if self.is_mock_llm:
            return False
        return bool(self.effective_api_key)

    @property
    def is_falkordb_remote(self) -> bool:
        return self.FALKORDB_HOST.lower().strip() not in ("localhost", "127.0.0.1")

    @property
    def effective_falkordb_ssl(self) -> bool:
        if self.FALKORDB_SSL is not None:
            return self.FALKORDB_SSL
        # FalkorDB Cloud instances require TLS; localhost Docker defaults to plain TCP
        return self.is_falkordb_remote

settings = Settings()
