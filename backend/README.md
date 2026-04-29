# Backend

Express backend for Glow Research.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create env file:
   ```bash
   cp .env.example .env
   ```

3. **Configure API Keys** (Required for Google Scholar):
   - **Google Scholar**: Get free SerpAPI key from https://serpapi.com/ and add to `.env`
   - **Semantic Scholar**: (Optional) Get API key from https://www.semanticscholar.org/product/api

4. Start development server:
   ```bash
   npm run dev
   ```

For detailed API configuration, see [RESEARCH_API_GUIDE.md](./RESEARCH_API_GUIDE.md)

## Features

### Research Paper Sources

The backend fetches from **major scholarly databases**:

| Source | Coverage | Free | API Key | Status |
|--------|----------|------|---------|--------|
| **Google Scholar** | 389M+ papers | ⚠️ Limited | ✅ Required (SerpAPI) | Direct access |
| **Semantic Scholar** | 200M+ papers | ✅ | ⚠️ Optional | Highly recommended |
| **arXiv** | CS, Physics, Math | ✅ | ❌ | Always active |
| **PubMed** | Biomedical | ✅ | ❌ | Always active |

**To use Google Scholar**: You MUST get a free SerpAPI key from https://serpapi.com/

See [RESEARCH_API_GUIDE.md](./RESEARCH_API_GUIDE.md) for detailed configuration.

## API

### Health Check
- GET /api/health

### Authentication
- POST /api/auth/request-otp
- POST /api/auth/verify-otp
- POST /api/auth/register
- POST /api/auth/login

### Agent APIs

- POST /api/agents/run
- GET /api/agents/jobs/:jobId
- POST /api/agents/jobs/:jobId/synthesize

### Research APIs

These endpoints run the full research pipeline:

- POST /api/research/start
  - Body: `{ "query": "your search query" }`
  - Returns: `{ "ok": true, "jobId": "..." }`

- GET /api/research/status/:jobId
  - Returns: Job status and results

- POST /api/research/synthesize/:jobId
  - Returns: Synthesis of findings

