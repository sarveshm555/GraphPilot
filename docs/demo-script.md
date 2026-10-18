# GraphPilot 3-Minute Hackathon Demonstration Script
## Graph Hacks: Context for AI Agents (Track 03 — Company Brain)
**Tagline**: *"Connect Knowledge. Trace Every Relationship. Explain Every Answer."*

This script is optimized for a crisp, high-impact 3-minute hackathon demo proving genuine FalkorDB integration, explainable multi-hop reasoning, failure impact analysis, and persistent company memory.

---

### Step 1: Prove FalkorDB Connection & Graph Scale (0:00 - 0:30)
1. **Action**: Open GraphPilot at `http://localhost:5173`.
2. **Highlight Sidebar**:
   - Point to the **Graph Engine** badge: `FalkorDB Live` (`localhost:6379`, graph `graphpilot`).
   - Point to the **AI Intelligence** badge: `Mock Offline` / `LLM Active` with `Graph Tools (8)`.
3. **Navigate to "Overview & Architecture"**:
   - Show live counts: **22+ Entities**, **28+ Relationships**, **Verified Memories**, and **Ingested Knowledge Docs**.
   - Show entity distribution across 9 labels (`System`, `Project`, `Team`, `Person`, `Incident`, `Document`, `Decision`, `Finding`, `SupportTicket`).
   - Mention: *"GraphPilot operates directly against a real FalkorDB instance running on Docker. Every answer is grounded in explicit Cypher traversals."*

---

### Step 2: Explainable Multi-Hop Reasoning with Traversal Stepper (0:30 - 1:15)
1. **Navigate to "Company Assistant"**:
2. **Scenario A — 4-Hop Connection**: Click chip:
   > `"How is Project Alpha connected to Engineer Priya?"`
   - **Show Output**:
     - Agent returns exact 4-hop path: `Project Alpha` -> `USES` -> `Payment API` -> `DEPENDS_ON` -> `Transaction Database` <- `OWNS` <- `Payments Engineering` <- `MEMBER_OF` <- `Priya Sharma`.
     - Highlight the **TraversalExplorer** component in the message: visual hops, relationship labels, and supporting document citations.
     - Show the **Active Traversal** panel on the right with a one-click button: *"View in Graph"*.
3. **Scenario B — Incident Postmortem Grounding**: Click chip:
   > `"Who has previously handled incidents affecting the Payment API?"`
   - **Show Output**:
     - Cites `INC-101` ("Payment Gateway Timeout Spikes"), resolved by `Priya Sharma`.
     - Cites Document `doc-201` ("Payment API High-Load Latency Mitigation").
     - Highlight the clearly separated **AI Recommended Action** box: strictly distinguished from historical facts.

---

### Step 3: Interactive Knowledge Graph Explorer & Path Finder (1:15 - 1:45)
1. **Navigate to "Interactive Knowledge Graph"**:
2. **Action**:
   - Pan and zoom the `@xyflow/react` node-link graph with controls and minimap.
   - Filter by Label: Select `System` or `Incident` to isolate components.
   - **Interactive Path Finder**: Select Start Node (`Project Alpha`) and End Node (`Priya Sharma`) in the top panel, then click **Find Path**. The graph instantly calculates the shortest path via FalkorDB (`/api/graph/path`) and animates/highlights the multi-hop traversal in glowing cyan/indigo.
   - Click **Reset View** to restore standard rendering.
   - Click on the `Payment API` node:
     - The **Entity Inspector drawer** slides in from the right.
     - Displays raw properties, incoming/outgoing relationship edges, and connected neighbors.
     - Click the red button in the drawer: *"Analyze Blast Radius"*.

---

### Step 4: Blast Radius & Failure Impact Analyzer (1:45 - 2:15)
1. **Auto-navigated to "Blast Radius Analysis"**:
   - Target System: `Payment API (sys-payment-api)`.
2. **Highlight Results**:
   - **Severity Banner**: Marked **CRITICAL** (Tier-0 core infrastructural rail).
   - **Direct Downstream Projects**: `Project Alpha` and `Checkout Modernization V2` (P0 priority).
   - **Direct Upstream Dependencies**: `Transaction Database` and `Fraud Detection Service`.
   - **Owning Team & On-Call Engineers**: `Payments Engineering` led by `Priya Sharma`.
   - **Historical Incidents Precedent**: `INC-101` with direct link to mitigation documentation.
   - **Clickable Entity Drawer**: Click any affected project, team, or engineer to inspect properties without leaving the blast radius view.
3. **Interactive Depth Buttons**: Click `[1H]`, `[2H]`, `[3H]`, `[4H]`, or `[5H]` to show dynamic transitive impact recalculation in FalkorDB.

---

### Step 5: Honest Failure Boundary & Anti-Hallucination (2:15 - 2:35)
1. **Navigate back to "Company Assistant"**:
2. **Ask Nonexistent Entity**:
   > `"Which systems depend on Project Omega?"`
3. **Highlight Agent Response**:
   - Agent executes Cypher lookup in FalkorDB and detects zero matching nodes.
   - Returns explicit honest refusal:
     > *"The entity 'Project Omega' was not found in the FalkorDB knowledge graph. GraphPilot does not fabricate organizational records or assumptions."*
   - Cites limitation: *"An absence of evidence in the graph does not prove that the entity does not exist in reality."*
   - **Key takeaway**: Zero hallucination, zero fallback to Payment API.

---

### Step 6: Persistent Memory Lifecycle & Deduplication (2:35 - 3:00)
1. **Navigate to "Persistent Memory"**:
   - Show findings archive with status tags: `VERIFIED`, `PROPOSED`, `SUPERSEDED`.
   - Enter finding: *"All database queries must use parameterized Cypher to ensure injection prevention."*
   - Click **Persist Finding**.
   - Show one-click **Supersede with Update** modal: establishing an explicit `:SUPERSEDED_BY` edge in FalkorDB.
2. **Navigate to "Documents & Ingestion"**:
   - Re-upload an existing postmortem file.
   - Show the **Deduplication Notice**: Content matched existing SHA-256 hash. Ingestion pipeline skips redundant nodes, keeping the FalkorDB graph clean and canonical.
3. **Conclusion**:
   - *"GraphPilot demonstrates how FalkorDB acts as the true brain of an enterprise AI assistant — connecting knowledge, tracing every relationship, and explaining every answer."*
