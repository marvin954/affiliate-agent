# Affiliate Research Agent

AI-powered affiliate program research tool. Uses Claude with live web search to find real, current affiliate programs every time you search.

## Deploy to Vercel in 3 steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial"
gh repo create affiliate-agent --public --push
```

### 2. Add environment variable in Vercel
In your Vercel project settings → Environment Variables:
```
ANTHROPIC_API_KEY = your_key_here
```

### 3. Deploy
```bash
vercel --prod
```
Or connect the GitHub repo in Vercel dashboard for auto-deploy.

## Features
- Live web search — finds NEW programs every search, not a static list
- Filter by niche, commission type, sort order
- Optional keyword search
- Real-time streaming status log showing each web search
- Join / View Ads / Network page links for every result
- Bookmark / save programs across searches
- High-ticket ($500+) and standard programs separated
