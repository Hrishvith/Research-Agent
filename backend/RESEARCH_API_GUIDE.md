# Research Paper API Configuration Guide

This backend integrates with multiple scholarly databases to fetch research papers. Below is a guide to configure each source.

## Overview

The paper search pipeline fetches from multiple sources in parallel:

| Source | Requirement | Priority | Free Tier | Notes |
|--------|-------------|----------|-----------|-------|
| **Semantic Scholar** | Optional API key | High | ✅ Yes (100 req/5min) | Recommended - best metadata |
| **Google Scholar** | ✅ REQUIRED SerpAPI key | High | ⚠️ Limited free tier (100/month) | Direct access to Google Scholar |
| **arXiv** | None | Medium | ✅ Yes | Free CS/Physics papers |
| **PubMed** | None | Medium | ✅ Yes | Free biomedical literature |

## Setup Instructions

### 1. Environment File

Create a `.env` file in the backend directory (copy from `.env.example`):

```bash
cd backend/backend
cp .env.example .env
```

### 2. Google Scholar (Required for Google Scholar results)

**Why**: Direct access to Google Scholar database with 389M+ papers

**Setup**:
1. Go to https://serpapi.com/
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `.env`:
   ```
   SERPAPI_KEY=your_serpapi_key_here
   ```

**Important**: Without this key, Google Scholar will NOT be used. Only arXiv, PubMed, and Semantic Scholar will be available.

**Pricing**: 
- Free tier: 100 searches per month
- Paid: $0.002-0.005 per search (auto-scaling)
- Recommendation: Free tier works well for development/testing

### 3. Semantic Scholar (Optional but Recommended)

**Why**: Best metadata quality, large coverage, free tier available

**Setup**:
1. Go to https://www.semanticscholar.org/product/api
2. Click "Get API Key" and fill out the form
3. Add to `.env`:
   ```
   SEMANTIC_SCHOLAR_API_KEY=your_api_key_here
   ```

**Free Tier**: 100 requests per 5 minutes

**Benefits with API key**: Higher rate limits (up to 10k+ requests/month with upgrade)

### 4. Configure in Backend

After creating `.env`, restart the backend:

```bash
npm start
```

The backend will log which sources are being used:

```
[Log] Google Scholar enabled (SERPAPI_KEY detected)
[Log] Semantic Scholar API key detected, using higher rate limits
```

OR

```
[Log] Google Scholar disabled (SERPAPI_KEY not set)
[Log] Active sources: arXiv, Semantic Scholar, PubMed
```

## API Limits and Recommendations

### Google Scholar (SerpAPI) - REQUIRED
- **Free tier**: 100 searches per month
- **Paid**: $0.002-$0.005 per search
- **Coverage**: 389M+ academic papers
- **Recommendation**: Get free API key to enable Google Scholar

### Semantic Scholar - OPTIONAL
- **Free tier**: 100 requests per 5 minutes
- **With API key**: 10,000+ requests depending on plan
- **Coverage**: 200M+ papers
- **Recommendation**: Get API key for production use

### arXiv - ALWAYS FREE
- **Unlimited**: Free public API
- **Coverage**: Computer Science, Physics, Mathematics
- **No auth needed**

### PubMed - ALWAYS FREE
- **Unlimited**: Free public API
- **Coverage**: Biomedical and life sciences
- **No auth needed**

## Testing the Integration

### Test Query via Frontend

1. Go to http://localhost:8080
2. Enter a search query (e.g., "machine learning")
3. Check terminal logs to see which sources are returning results:

```
Active sources: arXiv, Semantic Scholar, PubMed, Google Scholar
Papers retrieved: {
  total: 20,
  bySource: {
    "arXiv": 5,
    "Semantic Scholar": 5,
    "PubMed": 5,
    "Google Scholar": 5
  }
}
```

### Direct API Test (via PowerShell)

```powershell
# Start research job
$body = @{ query = 'machine learning' } | ConvertTo-Json
$result = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:5000/api/research/start `
  -ContentType 'application/json' -Body $body

# Check status
Start-Sleep -Seconds 2
$jobId = $result.jobId
Invoke-RestMethod http://127.0.0.1:5000/api/research/status/$jobId | ConvertTo-Json -Depth 6
```

## Troubleshooting

### "Google Scholar disabled (SERPAPI_KEY not set)"
- ⚠️ Google Scholar is NOT available
- 📌 Solution: Get free SERPAPI_KEY from https://serpapi.com/ and add to `.env`

### No Google Scholar results
- ⚠️ SERPAPI_KEY not configured or invalid
- 📌 Solution: Verify SERPAPI_KEY is correct in `.env`
- 📌 Restart backend after adding key

### "Too Many Requests" from Semantic Scholar
- ⚠️ Rate limit hit (100 req/5 min)
- 📌 Solution: Get API key or wait 5 minutes

### No papers returned from any source
- ⚠️ Check query quality
- 📌 Test with well-known terms (e.g., "machine learning", "neural networks")
- 📌 Check internet connection
- 📌 Verify API keys in `.env`

### SerpAPI 429 error
- ⚠️ Free tier limit reached (100/month)
- 📌 Upgrade to SerpAPI Pro or wait for monthly reset

## Advanced Configuration

### Increase Paper Limit

Edit `src/agents/paper-search-agent.js`:

```javascript
const FINAL_PAPER_LIMIT = 20; // Change to higher number (max ~100)
```

### Adjust Source Priorities

Edit `src/agents/paper-search-agent.js`:

```javascript
const SOURCE_ORDER = ["Google Scholar", "Semantic Scholar", "arXiv", "PubMed"];
// Reorder to prioritize different sources
```

### Rate Limiting

Add rate limiting middleware in `src/server.js`:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/research/', limiter);
```

## Summary

✅ **Minimum Setup**: REQUIRED - Get SerpAPI key for Google Scholar

🚀 **Recommended Setup**: 
- SerpAPI key for Google Scholar (free tier available)
- Semantic Scholar API key (optional, free tier available)

📊 **Production Setup**:
- SerpAPI key for Google Scholar reliability
- Semantic Scholar API key for better metadata
- Rate limiting enabled
- Error monitoring configured

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Get free SerpAPI key from https://serpapi.com/
- [ ] Add `SERPAPI_KEY=...` to `.env`
- [ ] Restart backend: `npm start`
- [ ] Test with a search query
- [ ] Verify Google Scholar results in logs

