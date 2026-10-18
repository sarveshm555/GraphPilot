# GraphPilot Deployment Guide

## Local Development (With or Without Docker)

### Option A: Local Python & Vite (Instant dev)
1. **Activate Python environment & install requirements**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\pip install -r backend\requirements.txt
   ```
2. **Start Backend**:
   ```powershell
   $env:PYTHONPATH="backend"
   .\venv\Scripts\uvicorn app.main:app --port 8000 --reload
   ```
3. **Start Frontend**:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
4. Access UI at `http://localhost:5173`.

---

### Option B: Docker Compose (Full Stack with FalkorDB Container)
```bash
docker compose up --build
```
This deploys:
- `falkordb`: Port 6379 with persistent volume `falkordb_data`
- `backend`: FastAPI API server on port 8000
- `frontend`: Production Nginx bundle on port 80

---

## AWS Cloud Deployment Architecture

```mermaid
flowchart TD
    User["End User Browser"] --> CloudFront["AWS CloudFront CDN"]
    CloudFront --> S3Frontend["Amazon S3 Static Hosting (React Frontend)"]
    CloudFront --> APIGW["Amazon API Gateway"]
    
    APIGW --> Lambda["AWS Lambda (FastAPI with Mangum Adapter)"]
    Lambda --> FalkorDBHost["Persistent FalkorDB (AWS EC2 / FalkorDB Cloud)"]
    Lambda --> S3Docs["Amazon S3 (Document Ingestion Bucket)"]
    Lambda --> SecretsManager["AWS Secrets Manager (LLM & DB Credentials)"]
    Lambda --> CloudWatch["AWS CloudWatch (Operational & Audit Logs)"]
```

### Serverless Execution Rules
> [!IMPORTANT]
> FalkorDB is an in-memory graph database engine and **must not be run inside AWS Lambda**. 
> Deploy FalkorDB on an Amazon EC2 instance within a private VPC or utilize a managed FalkorDB Cloud cluster. AWS Lambda connects securely via VPC peering / security group rules over port 6379.
