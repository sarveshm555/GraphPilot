import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router
from app.graph.seed import seed_database
from app.graph.client import db_client

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("graphpilot.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GraphPilot Backend...")
    # Seed database with coherent synthetic company dataset on startup
    try:
        seed_database()
        logger.info("GraphPilot synthetic dataset seeded.")
    except Exception as e:
        logger.error(f"Error during graph seed: {e}")
    yield
    logger.info("GraphPilot Backend shutting down.")

app = FastAPI(
    title="GraphPilot API",
    description="Explainable AI Company Brain Powered by FalkorDB",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.agent.orchestrator import agent_orchestrator

app.include_router(router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "GraphPilot Company Brain API",
        "version": "1.0.0",
        "database": db_client.health(),
        "llm": {
            "provider": settings.LLM_PROVIDER,
            "model": settings.effective_model,
            "status": agent_orchestrator.get_llm_status(),
            "tool_calling_enabled": True,
            "timeout_seconds": settings.effective_timeout,
            "error": agent_orchestrator.get_llm_error()
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
