"""
Automated Test Suite for GraphPilot LLM Tool Selection & Answer Generation
Tests:
1. Mock/offline mode without paid API calls
2. Missing API key when a real provider is selected
3. Genuine LLM tool-call handling using mocked provider responses
4. Valid tool execution against FalkorDB
5. Invalid tool names and arguments handling
6. Unrelated cafeteria question refusal
7. Unknown Project Omega refusal
8. Unknown Quantum Ledger refusal
9. Project Alpha and Priya Sharma multi-hop path
10. Source evidence and relationship-path validation
11. Provider timeouts and malformed responses handling
12. Prevention of unsupported claims
13. Overview and health indicators for LLM status
"""
import pytest
from unittest.mock import MagicMock, patch
from types import SimpleNamespace
from app.config import settings
from app.graph.client import db_client
from app.graph.seed import seed_database
from app.agent.orchestrator import agent_orchestrator
from app.agent.validation import GroundingValidator
from app.agent.schemas import GroundedAnswer

@pytest.fixture(autouse=True)
def setup_env_and_db():
    seed_database()
    orig_provider = settings.LLM_PROVIDER
    orig_key = settings.LLM_API_KEY
    orig_openai_key = settings.OPENAI_API_KEY
    orig_openai_model = settings.OPENAI_MODEL
    orig_openai_timeout = settings.OPENAI_TIMEOUT_SECONDS
    settings.LLM_PROVIDER = "mock"
    settings.LLM_API_KEY = ""
    settings.OPENAI_API_KEY = ""
    settings.OPENAI_MODEL = ""
    settings.OPENAI_TIMEOUT_SECONDS = 30.0
    agent_orchestrator._last_llm_status = "idle"
    agent_orchestrator._last_llm_error = None
    agent_orchestrator._last_llm_error_type = None
    yield
    settings.LLM_PROVIDER = orig_provider
    settings.LLM_API_KEY = orig_key
    settings.OPENAI_API_KEY = orig_openai_key
    settings.OPENAI_MODEL = orig_openai_model
    settings.OPENAI_TIMEOUT_SECONDS = orig_openai_timeout
    agent_orchestrator._last_llm_status = "idle"
    agent_orchestrator._last_llm_error = None
    agent_orchestrator._last_llm_error_type = None

def test_mock_offline_mode():
    """Verify application functions correctly in explicit mock/offline mode without API calls"""
    settings.LLM_PROVIDER = "mock"
    settings.LLM_API_KEY = ""
    res = agent_orchestrator.process_question("Which systems depend on the Payment API?")
    assert res.outcome == "answered_with_path"
    assert len(res.facts) > 0
    assert len(res.graph_paths) > 0
    assert "Payment API" in res.answer

def test_missing_api_key_when_real_provider_selected():
    """Verify explicit error report when real provider is configured without an API key"""
    settings.LLM_PROVIDER = "openai"
    settings.LLM_API_KEY = ""
    res = agent_orchestrator.process_question("Which systems depend on the Payment API?")
    assert res.outcome == "fallback"
    assert "Configuration Error" in res.answer
    assert "LLM_API_KEY is not set" in res.answer
    assert "LLM_PROVIDER is set to 'openai', but LLM_API_KEY is missing." in res.limitations[0]

def test_genuine_llm_tool_calling_with_mocked_provider():
    """Verify multi-step bounded tool calling with mocked OpenAI client"""
    settings.LLM_PROVIDER = "openai"
    settings.LLM_API_KEY = "mock-openai-key-test"

    # Step 1: LLM selects find_system_dependencies tool
    tool_call_mock = SimpleNamespace(
        id="call_12345",
        function=SimpleNamespace(
            name="find_system_dependencies",
            arguments='{"system_name": "Payment API"}'
        )
    )
    first_choice = SimpleNamespace(
        message=SimpleNamespace(
            content=None,
            tool_calls=[tool_call_mock]
        )
    )
    first_response = SimpleNamespace(choices=[first_choice])

    # Step 2: LLM receives tool results and responds with grounded answer
    second_choice = SimpleNamespace(
        message=SimpleNamespace(
            content="Payment API is a Tier-0 system that depends on Transaction Database and Fraud Detection Service.\nRecommendation: Monitor connection pool capacity.",
            tool_calls=None
        )
    )
    second_response = SimpleNamespace(choices=[second_choice])

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = [first_response, second_response]

    with patch("openai.OpenAI", return_value=mock_client):
        res = agent_orchestrator.process_question("Which systems depend on the Payment API?")

    assert res.outcome == "answered_with_path"
    assert len(res.facts) > 0
    assert len(res.graph_paths) > 0
    assert "Payment API" in res.answer
    assert len(res.recommendations) >= 1
    assert "Monitor connection pool capacity" in res.recommendations[0]

def test_valid_tool_execution_against_falkordb():
    """Verify tools execute valid parameterized queries against FalkorDB"""
    dep_res = agent_orchestrator.execute_tool_by_name(
        "find_system_dependencies",
        {"system_name": "Payment API"}
    )
    assert dep_res.get("found") is True
    assert len(dep_res.get("facts", [])) > 0
    upstream = [d["name"] for d in dep_res["facts"][0]["upstream_dependencies"]]
    assert "Transaction Database" in upstream

    search_res = agent_orchestrator.execute_tool_by_name(
        "search_entities",
        {"query": "Priya"}
    )
    assert search_res.get("found") is True
    assert search_res.get("count") >= 1
    assert any("Priya Sharma" in r["name"] for r in search_res["results"])

def test_invalid_tool_names_and_arguments():
    """Verify robust handling of invalid tool names and malformed arguments"""
    # 1. Invalid tool name
    bad_tool_res = agent_orchestrator.execute_tool_by_name("delete_all_databases", {})
    assert "not found" in bad_tool_res["error"]
    assert bad_tool_res["valid_tool"] is False

    # 2. Invalid/missing arguments for valid tool
    bad_args_res = agent_orchestrator.execute_tool_by_name("find_system_dependencies", {})
    assert "Validation/Execution error" in bad_args_res["error"]
    assert bad_args_res["valid_tool"] is True

def test_unrelated_cafeteria_question_refusal():
    """Verify unrelated questions return honest absence of records without defaulting to Payment API"""
    settings.LLM_PROVIDER = "mock"
    res = agent_orchestrator.process_question("What is the cafeteria lunch menu for Friday?")
    assert res.outcome == "no_graph_evidence"
    assert len(res.facts) == 0
    assert len(res.graph_paths) == 0
    assert "Payment API" not in res.answer
    assert "No records matching this question were found in the NovaPay company knowledge graph" in res.answer
    assert "An empty traversal indicates the relationship or topic was not found in the recorded graph" in res.limitations[0]

def test_unknown_project_omega_refusal():
    """Verify nonexistent entity Project Omega is refused with explicit reality distinction"""
    settings.LLM_PROVIDER = "mock"
    res = agent_orchestrator.process_question("Which systems depend on Project Omega?")
    assert res.outcome == "entity_unknown"
    assert len(res.facts) == 0
    assert len(res.graph_paths) == 0
    assert "Project Omega" in res.answer
    assert "was not found in the company knowledge graph" in res.answer
    assert any("does not prove the entity does not exist in reality" in lim for lim in res.limitations)

def test_unknown_quantum_ledger_refusal():
    """Verify nonexistent entity Quantum Ledger is refused with explicit reality distinction"""
    settings.LLM_PROVIDER = "mock"
    res = agent_orchestrator.process_question("Which team owns the Quantum Ledger?")
    assert res.outcome == "entity_unknown"
    assert len(res.facts) == 0
    assert "Quantum Ledger" in res.answer
    assert any("does not prove the entity does not exist in reality" in lim for lim in res.limitations)

def test_multi_hop_path_alpha_to_priya():
    """Verify 4-hop traversal between Project Alpha and Engineer Priya"""
    settings.LLM_PROVIDER = "mock"
    res = agent_orchestrator.process_question("How does Project Alpha connect to Priya Sharma?")
    assert res.outcome == "answered_with_path"
    assert len(res.graph_paths) >= 4
    relationships = [p.relationship for p in res.graph_paths]
    assert "USES" in relationships
    assert "DEPENDS_ON" in relationships

def test_source_evidence_and_path_validation():
    """Verify incident retrieval includes supporting documents and postmortems"""
    settings.LLM_PROVIDER = "mock"
    res = agent_orchestrator.process_question("Who has previously handled incidents affecting the Payment API?")
    assert res.outcome == "answered_with_path"
    assert len(res.sources) > 0
    assert any(s.id == "doc-201" for s in res.sources)
    assert any("Payment API" in s.title for s in res.sources)

def test_provider_timeouts_and_malformed_responses():
    """Verify graceful handling when LLM provider raises connection timeout"""
    settings.LLM_PROVIDER = "openai"
    settings.LLM_API_KEY = "sk-mock-timeout-key"

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("Connection timed out after 25.0s")

    with patch("openai.OpenAI", return_value=mock_client):
        res = agent_orchestrator.process_question("Which systems depend on the Payment API?")

    assert res.outcome == "fallback"
    assert "AI Provider Error" in res.answer
    assert "timed out" in res.answer
    assert len(res.facts) == 0
    assert len(res.graph_paths) == 0

def test_prevention_of_unsupported_claims():
    """Verify GroundingValidator prevents ungrounded facts or unverified paths"""
    validated = GroundingValidator.validate_and_ground(
        raw_answer="Some unsupported speculation.",
        retrieved_facts=[],
        retrieved_paths=[],
        retrieved_sources=[],
        retrieved_memories=[],
        recommendations=["Ungrounded recommendation"],
        entity_found=True
    )
    assert validated.outcome == "no_graph_evidence"
    assert len(validated.facts) == 0
    assert len(validated.graph_paths) == 0
    assert any("does not prove the entity or topic does not exist in reality" in lim for lim in validated.limitations)

def test_openai_env_var_precedence():
    """Verify OPENAI_API_KEY, OPENAI_MODEL, and OPENAI_TIMEOUT_SECONDS configure provider properly"""
    settings.OPENAI_API_KEY = "sk-proj-test-openai-key"
    settings.OPENAI_MODEL = "gpt-4o"
    settings.OPENAI_TIMEOUT_SECONDS = 45.0
    assert settings.effective_api_key == "sk-proj-test-openai-key"
    assert settings.effective_model == "gpt-4o"
    assert settings.effective_timeout == 45.0

def test_openai_authentication_error_handling():
    """Verify graceful handling and failure reporting when OpenAI returns 401 Unauthorized"""
    from openai import AuthenticationError
    settings.LLM_PROVIDER = "openai"
    settings.OPENAI_API_KEY = "sk-proj-invalid-key"

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = AuthenticationError(
        "Incorrect API key provided: sk-proj-invalid-key",
        response=MagicMock(status_code=401),
        body=None
    )

    with patch("openai.OpenAI", return_value=mock_client):
        res = agent_orchestrator.process_question("Which systems depend on the Payment API?")

    assert res.outcome == "fallback"
    assert res.agent_mode == "real_llm"
    assert "Authentication Error" in res.answer
    assert agent_orchestrator.get_llm_status() == "error"
    assert agent_orchestrator.get_llm_error_type() == "authentication_error"
    assert "Invalid or expired API key" in agent_orchestrator.get_llm_error()

def test_openai_rate_limit_and_quota_error_handling():
    """Verify graceful handling and failure reporting when OpenAI account has insufficient quota"""
    from openai import RateLimitError
    settings.LLM_PROVIDER = "openai"
    settings.OPENAI_API_KEY = "sk-proj-quota-exceeded"

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = RateLimitError(
        "You exceeded your current quota, please check your plan and billing details.",
        response=MagicMock(status_code=429),
        body=None
    )

    with patch("openai.OpenAI", return_value=mock_client):
        res = agent_orchestrator.process_question("Which systems depend on the Payment API?")

    assert res.outcome == "fallback"
    assert res.agent_mode == "real_llm"
    assert "Quota" in res.answer or "Rate Limit" in res.answer
    assert agent_orchestrator.get_llm_status() == "error"
    assert agent_orchestrator.get_llm_error_type() == "insufficient_quota"
    assert "insufficient api credits" in agent_orchestrator.get_llm_error().lower()

def test_openai_connection_error_handling():
    """Verify graceful handling when network fails to reach api.openai.com"""
    from openai import APIConnectionError
    settings.LLM_PROVIDER = "openai"
    settings.OPENAI_API_KEY = "sk-proj-valid-key"

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = APIConnectionError(request=MagicMock())

    with patch("openai.OpenAI", return_value=mock_client):
        res = agent_orchestrator.process_question("Which systems depend on the Payment API?")

    assert res.outcome == "fallback"
    assert "Connection Error" in res.answer
    assert agent_orchestrator.get_llm_status() == "error"
    assert agent_orchestrator.get_llm_error_type() == "connection_error"

def test_openai_api_timeout_error_handling():
    """Verify graceful handling when request to OpenAI times out"""
    from openai import APITimeoutError
    settings.LLM_PROVIDER = "openai"
    settings.OPENAI_API_KEY = "sk-proj-valid-key"
    settings.OPENAI_TIMEOUT_SECONDS = 15.0

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = APITimeoutError(request=MagicMock())

    with patch("openai.OpenAI", return_value=mock_client):
        res = agent_orchestrator.process_question("Which systems depend on the Payment API?")

    assert res.outcome == "fallback"
    assert "timed out" in res.answer
    assert agent_orchestrator.get_llm_status() == "error"
    assert agent_orchestrator.get_llm_error_type() == "timeout_error"

def test_llm_connectivity_test_method():
    """Verify test_llm_connection diagnostic method across mock, misconfigured, and live states"""
    # 1. Mock mode
    settings.LLM_PROVIDER = "mock"
    res_mock = agent_orchestrator.test_llm_connection()
    assert res_mock["status"] == "mock_offline"

    # 2. Misconfigured (provider=openai, key empty)
    settings.LLM_PROVIDER = "openai"
    settings.OPENAI_API_KEY = ""
    settings.LLM_API_KEY = ""
    res_misconf = agent_orchestrator.test_llm_connection()
    assert res_misconf["status"] == "misconfigured"

    # 3. Valid key ping
    settings.OPENAI_API_KEY = "sk-proj-valid-key"
    mock_client = MagicMock()
    mock_client.models.list.return_value = ["gpt-4o-mini"]
    with patch("openai.OpenAI", return_value=mock_client):
        res_live = agent_orchestrator.test_llm_connection()
    assert res_live["status"] == "llm_active"
    assert "Successfully verified" in res_live["message"]

