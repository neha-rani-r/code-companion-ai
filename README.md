# DataForge.ai — DE Artifact Generator

> Generate production-ready data engineering code 
> from plain English. No boilerplate. No copy-paste. 
> Just describe your pipeline and get code that's 
> ready to ship.

## Live Demo
🔗 [Try DataForge.ai — free, no signup](https://neha-rani-r.github.io/code-companion-ai/)

---

## What it does

DataForge.ai turns plain English pipeline descriptions 
into production-ready code artifacts in seconds.

**Supported artifacts:**
- **Airflow DAG** — retry logic, idempotency, 
  task dependencies, proper operators
- **dbt Model** — incremental strategy, tests, 
  schema YAML, on_schema_change handling
- **PySpark Job** — deduplication, partitioning, 
  performance optimization
- **Redshift SQL** — CTAS, sort keys, dist keys, 
  query optimization patterns

**Supported clouds:**
- AWS — S3, Redshift, Glue, boto3, aws-wrangler
- GCP — BigQuery, GCS, Dataflow, 
  google-cloud-bigquery
- Azure — ADLS Gen2, Synapse Analytics, 
  azure-storage-blob, azure-identity

---

## Why I built this

I have spent 8 years building production data 
pipelines at JP Morgan Chase, Citrix and Accenture 
— and now lead data engineering teams at Deloitte.

The most frustrating part was never the hard 
problems. It was the repetitive setup — writing 
the same retry logic, idempotency checks and 
cloud-specific imports on every single pipeline.

DataForge.ai encodes production DE best practices 
so engineers can skip the setup and focus on 
the business logic.

---

## What makes the output production-ready

Every generated artifact includes:

✅ Error handling with try/except blocks  
✅ Idempotency — safe to re-run without side effects  
✅ Inline comments explaining key decisions  
✅ Cloud-specific services — no generic placeholder code  
✅ Real connection patterns and path formats  
✅ Best practice structure for each artifact type  
✅ Patterns I have reviewed and shipped in production  

---

## How I built this

Designed and built end to end — from architecture 
decisions to deployment pipeline.

Key engineering work:

- **System prompt engineering** — the core of the 
  tool. Encodes production DE best practices, 
  cloud-specific service patterns, and output 
  structure that mirrors real code reviews

- **Multi-cloud routing** — AWS, GCP and Azure 
  each enforce correct services, path formats, 
  SDKs and connection patterns throughout the 
  entire generated output. Not just imports — 
  every service reference, path and auth pattern 
  is cloud-specific

- **Cloudflare Worker proxy** — serverless 
  architecture that keeps API keys secure and 
  never exposed in frontend code. All AI calls 
  route through the Worker

- **GitHub Actions CI/CD** — fully automated 
  build and deploy pipeline. Every push to main 
  triggers a production build and deploys to 
  GitHub Pages automatically

- **Streaming architecture** — real-time token 
  streaming for responsive UX. Handles SSE 
  format with proper buffer management and 
  delta extraction

- **Session management** — conversation context 
  resets cleanly on cloud or artifact type 
  switch, with toast notifications and smooth 
  state transitions — no full page reload needed

- **Static hosting architecture** — solved React 
  SPA routing, BrowserRouter basename 
  configuration, asset path resolution and 
  cache handling for GitHub Pages deployment

- **Security layer** — API key proxy pattern, 
  environment variable isolation across local 
  development, CI pipeline and production 
  environments

---

## Tech stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

**Backend:**
- Cloudflare Workers
- Groq API — Llama 3.3 70B
- Stateless by design — no database needed

**Infrastructure:**
- GitHub Actions CI/CD
- GitHub Pages
- Cloudflare Workers (edge proxy)

---

## Architecture
```
User describes pipeline problem
            ↓
React frontend — GitHub Pages
            ↓
Cloudflare Worker (API proxy)
            ↓
Groq API — Llama 3.3 70B
            ↓
Streaming SSE response
            ↓
Code panel — live token streaming
            ↓
Download as .py or .sql
```

---

## Running locally
```bash
# Clone the repo
git clone https://github.com/neha-rani-r/code-companion-ai
cd code-companion-ai

# Install dependencies
npm install

# Add environment variables
cp .env.example .env
# Add your VITE_WORKER_URL

# Run locally
npm run dev
```

---

## Deploying your own version

1. Fork this repo
2. Set up Cloudflare Worker with your API key
3. Add `VITE_WORKER_URL` to GitHub secrets
4. GitHub Actions deploys automatically on push

---

## Roadmap

- [ ] Rate limiting — 5 generations per day 
      per user
- [ ] Artifact history — save last 10 generations
- [ ] More artifact types — data contracts, 
      schema design, pipeline architecture docs
- [ ] Follow-up prompts — iterate on generated 
      code conversationally
- [ ] User accounts — save and share artifacts
- [ ] Team mode — shared artifact library

---

## Built by

**Neha Rani**  
Engineering Manager & Data Architect  
HashedIn by Deloitte

8 years building data lakes, data mesh and cloud 
modernization solutions across JP Morgan Chase, 
Citrix and Accentine.

🔗 [LinkedIn](https://www.linkedin.com/in/neha-rani-r/)  
🐙 [GitHub](https://github.com/neha-rani-r)

---

## Feedback and collaboration

Tried the tool? I'd love to hear your feedback.  
Building something in the data engineering space?  
Always happy to connect and talk architecture.

[Connect on LinkedIn →](https://www.linkedin.com/in/neha-rani-r/)

---

## License

MIT — free to use, fork and build on.
