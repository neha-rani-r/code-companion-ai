# DataForge.ai

> Generate production-ready data engineering code 
> from plain English descriptions.

🔗 **[Try it free — no signup needed](https://neha-rani-r.github.io/code-companion-ai/)**

---

## What it does

Describe your pipeline problem in plain English.
Get production-ready code in seconds.

**Artifacts:**
Airflow DAG · dbt Model · PySpark Job · Redshift SQL

**Clouds:**
AWS · GCP · Azure

---

## What makes it different

Most AI tools give you code that works in a 
notebook. DataForge.ai gives you code that works 
in production — because every pattern comes from 
pipelines actually shipped at enterprise scale.

---

### 1. Cloud-enforced generation
Not just a label switch. Every service reference, 
path format, SDK import and auth pattern changes:
```
AWS   → S3 (s3://), Redshift, boto3, IAM roles
GCP   → GCS (gs://), BigQuery, google-cloud-bigquery  
Azure → ADLS (abfss://), Synapse, azure-storage-blob
```

Generic AI tools use boto3 even when you say GCP.
DataForge.ai enforces cloud-native patterns 
throughout the entire output.

---

### 2. Production-grade system prompt
The core of the tool — encodes 8 years of 
production DE knowledge into every output:

- Idempotency by default — safe to re-run
- Retry with exponential backoff
- Real error handling — not bare try/except
- Airflow connection variables — not hardcoded strings
- Provider-specific operators — not generic Python
- Late data handling built in
- Code review ready — no cleanup needed

---

### 3. Structured output — code plus context

Every generation follows this structure:
```
## Code
[complete runnable code]

## Why this approach
[key architectural decisions explained]

## Watch out for
[common production pitfalls flagged]
```

You get the code AND the reasoning. Junior DEs 
learn why, not just what. Senior DEs get the 
context they'd want in a code review.

---

### 4. Session management without page refresh

Switching cloud or artifact type:
- Clears conversation context instantly
- Shows toast confirmation of the switch
- Resets state cleanly
- No full page reload needed

Most tools require a full browser refresh to 
reset context.

---

### 5. API security via Cloudflare Worker proxy

API keys never live in the frontend bundle.
All AI calls route through a serverless 
Cloudflare Worker proxy.

Most vibe-coded tools expose the API key 
directly in browser code. DataForge.ai doesn't.

---

### 6. Download as proper file

One click exports:
- `artifact.py` for Airflow, Spark, dbt
- `artifact.sql` for Redshift SQL
- `artifact.yaml` for data contracts

Drop it straight into your project. 
No copy-paste required.

---

### 7. Real DE quick-start scenarios

Pre-built chips for actual DE problems:
- Daily S3 → Snowflake ETL pipeline
- Incremental dbt model with tests
- PySpark deduplication job
- Redshift CTAS with sort keys

Not "write hello world" — real pipeline patterns 
DEs face every week.

---

### 8. Fully open source with automated CI/CD

- Public GitHub repo — fork and run your own
- GitHub Actions — automated build and deploy
- Zero vendor lock-in
- Cloudflare Worker — swap AI model any time

---

## Why it's different from generic AI

| | Generic AI | DataForge.ai |
|---|---|---|
| Idempotency | Rarely | Always |
| Cloud services | Generic boto3 | Provider-native |
| Error handling | Basic | Retry with backoff |
| Connection patterns | Hardcoded | Best practice |
| Late data handling | Missing | Built in |
| Output structure | Just code | Code + reasoning |
| API key security | Exposed | Proxied |
| Code review ready | Needs rework | Ships as-is |

---

## Who uses this

**Data Engineers** — skip boilerplate, start from 
a production-quality baseline every time

**Junior DEs** — learn production patterns by 
example, understand the why behind each decision

**Engineering Managers** — reference implementations 
for code reviews, standards and onboarding

**Data Architects** — prototype and compare 
cloud stacks instantly without writing boilerplate

**DE Teams & Consultancies** — consistent quality 
baseline across all team members from day one

---

## How I built it

End to end — architecture, engineering and 
deployment pipeline.

- **System prompt engineering** — encodes production 
  DE best practices, cloud service mapping and 
  output structure that mirrors real code reviews

- **Multi-cloud routing** — AWS, GCP and Azure 
  enforce correct services, path formats, SDKs 
  and auth patterns throughout entire output

- **Cloudflare Worker proxy** — serverless security 
  layer, API keys never exposed in frontend

- **GitHub Actions CI/CD** — automated build and 
  deploy on every push to main

- **Streaming architecture** — real-time SSE token 
  streaming with proper buffer management

- **Session management** — context resets on 
  cloud or artifact switch without page reload

- **Static hosting architecture** — React SPA 
  routing, asset path resolution and cache 
  handling for GitHub Pages deployment

---

## Tech stack

React · TypeScript · Vite · Tailwind CSS  
Cloudflare Workers · Groq API (Llama 3.3 70B)  
GitHub Actions · GitHub Pages

---

## Run locally
```bash
git clone https://github.com/neha-rani-r/code-companion-ai
cd code-companion-ai
npm install
cp .env.example .env
# Add your VITE_WORKER_URL
npm run dev
```

---

## Roadmap

- [ ] Rate limiting per user
- [ ] Artifact history — last 10 generations
- [ ] Data contracts and schema design
- [ ] Follow-up prompt iteration
- [ ] Team mode — shared artifact library

---

## Built by

**Neha Rani**  
Engineering Manager & Data Architect  
HashedIn by Deloitte

8 years building data lakes, data mesh and 
cloud modernization at JP Morgan Chase, 
Citrix and Accenture.

🔗 [LinkedIn](https://www.linkedin.com/in/neha-rani-r/) · 
🐙 [GitHub](https://github.com/neha-rani-r)

Tried the tool? Have feedback or want to discuss 
the architecture?  
[Connect on LinkedIn →](https://www.linkedin.com/in/neha-rani-r/)

---

MIT License
```

---

Tell me when Claude Code pushes — then check your README at:
```
https://github.com/neha-rani-r/code-companion-ai
