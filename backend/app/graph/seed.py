import logging
from app.graph.client import db_client
from app.graph.schema import INDEX_QUERIES
from app.graph.seed_data import SEED_NODES, SEED_RELATIONSHIPS

logger = logging.getLogger("graphpilot.seed")

def seed_database():
    """
    Idempotent seeding of synthetic company knowledge graph into FalkorDB.
    Uses MERGE to guarantee nodes and edges are never duplicated on re-runs.
    """
    logger.info("Starting graph database initialization and seeding...")
    
    # 1. Apply Indexes
    for idx_query in INDEX_QUERIES:
        try:
            db_client.query(idx_query)
        except Exception as e:
            # Index already exists or duplicate index error
            logger.debug(f"Index query note: {e}")

    # 2. Ingest Nodes
    node_count = 0
    for label, records in SEED_NODES.items():
        for record in records:
            query = f"MERGE (n:{label} {{id: $id}}) SET n += $props RETURN n.id"
            db_client.query(query, {"id": record["id"], "props": record})
            node_count += 1

    # 3. Ingest Relationships
    edge_count = 0
    for src_label, src_id, rel_type, tgt_label, tgt_id, props in SEED_RELATIONSHIPS:
        query = (
            f"MATCH (a:{src_label} {{id: $source_id}}), (b:{tgt_label} {{id: $target_id}}) "
            f"MERGE (a)-[r:{rel_type}]->(b) "
            f"SET r += $props "
            f"RETURN a.id, b.id"
        )
        db_client.query(query, {
            "source_id": src_id,
            "target_id": tgt_id,
            "props": props
        })
        edge_count += 1

    logger.info(f"Seeding completed successfully: {node_count} nodes, {edge_count} relationships.")
    return {"nodes_seeded": node_count, "relationships_seeded": edge_count}

if __name__ == "__main__":
    result = seed_database()
    print("Seed result:", result)
