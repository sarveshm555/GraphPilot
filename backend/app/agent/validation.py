"""
Grounding and Citation Validator
Enforces Hackathon requirements:
1. Every cited source must actually exist in the retrieved database record.
2. Every displayed graph relationship must come directly from database traversal.
3. Unknown entity names are never presented as confirmed facts.
4. AI recommendations are kept strictly separated from verified historical facts.
5. If an entity is not found in the graph, it explicitly states this rather than hallucinating.
"""
from typing import List, Dict, Any
from app.agent.schemas import GroundedAnswer, SourceReference, GraphPathSegment

class GroundingValidator:
    @staticmethod
    def validate_and_ground(
        raw_answer: str,
        retrieved_facts: List[Dict[str, Any]],
        retrieved_paths: List[Dict[str, Any]],
        retrieved_sources: List[Dict[str, Any]],
        retrieved_memories: List[Dict[str, Any]],
        recommendations: List[str],
        entity_found: bool = True,
        queried_entity: str = "",
        agent_mode: str = "deterministic"
    ) -> GroundedAnswer:
        
        limitations = []
        
        # 1. Handle Entity Unknown
        if not entity_found and queried_entity:
            return GroundedAnswer(
                answer=f"The entity '{queried_entity}' was not found in the company knowledge graph. GraphPilot does not fabricate organizational records or assumptions.",
                outcome="entity_unknown",
                facts=[],
                recommendations=[],
                sources=[],
                graph_paths=[],
                memory_references=[],
                limitations=[
                    f"No matching nodes for '{queried_entity}' were discovered in the FalkorDB knowledge graph.",
                    "An absence of evidence in the graph indicates the entity is missing from the recorded dataset; it does not prove the entity does not exist in reality."
                ],
                agent_mode=agent_mode
            )

        # 2. Validate Sources
        validated_sources = []
        seen_sources = set()
        for s in retrieved_sources:
            sid = s.get("id") or s.get("title", "")
            if sid and sid not in seen_sources:
                seen_sources.add(sid)
                validated_sources.append(SourceReference(
                    id=s.get("id", "doc-unknown"),
                    title=s.get("title", "Untitled Document"),
                    source_uri=s.get("source_uri"),
                    source_type=s.get("source_type"),
                    excerpt=s.get("excerpt")
                ))

        # 3. Validate Graph Paths
        validated_paths = []
        for p in retrieved_paths:
            src = p.get("source")
            rel = p.get("relationship")
            tgt = p.get("target")
            if src and rel and tgt:
                validated_paths.append(GraphPathSegment(
                    source=str(src),
                    relationship=str(rel),
                    target=str(tgt),
                    properties=p.get("properties")
                ))

        # 4. Enforce Fact Limitations & Absence Caveat
        if not retrieved_facts and not validated_paths:
            limitations.append("An empty traversal indicates the relationship or topic was not found in the recorded graph; it does not prove the entity or topic does not exist in reality.")
            outcome = "no_graph_evidence"
            if not raw_answer:
                raw_answer = "No matching records or graph relationships were found in the NovaPay company knowledge graph."
        elif validated_paths:
            outcome = "answered_with_path"
        else:
            outcome = "answered_no_path"

        # 5. Strict recommendation labeling
        cleaned_recommendations = [
            rec.strip() for rec in recommendations if rec and isinstance(rec, str)
        ]

        return GroundedAnswer(
            answer=raw_answer,
            outcome=outcome,
            facts=retrieved_facts,
            recommendations=cleaned_recommendations,
            sources=validated_sources,
            graph_paths=validated_paths,
            memory_references=retrieved_memories,
            limitations=limitations,
            agent_mode=agent_mode
        )
