# ⚡ GoalFlash — Programmatic SEO for Football Scores

A zero-cost, fully automated static site targeting high-volume football score queries in Saudi Arabia and the Arabic-speaking world. Covers **FIFA World Cup 2026** and the **Saudi Pro League** with bilingual English + Arabic pages.

## Architecture

```
GitHub Actions (cron)
  │
  ├─ fetch-scores.js ──→ API-Football (8-10 leagues)
  │                         │
  │                         ▼
  │                    src/data/matches.json  (cached data)
  │                         │
  ├─ astro build ──────────→│
  │                         ▼
  │            ┌────────────────────────────┐
  │            │  Static HTML per match:    │
  │            │                            │
  │            │  /match/[en-slug]/         │  English
  │            │  /ar/match/[en-slug]/      │  Arabic
  │            │  /ar/[arabic-slug]/        │  Arabic URL redirect
  │            └────────────────────────────┘
  │                         │
  └─ deploy ───────────────→ Cloudflare Pages (edge CDN)
```

Every match generates **3 URLs**:

| URL Pattern | Purpose |
|---|---|
| `/match/saudi-arabia-vs-uruguay-live-score/` | English match page |
| `/ar/match/saudi-arabia-vs-uruguay-live-score/` | Arabic match page |
| `/ar/مباراة-السعودية-ضد-أوروغواي/` | Arabic slug redirect → canonical Arabic page |

## Cost

| Service | Free Tier | Our Usage |
|---|---|---|
| API-Football (RapidAPI) | 100 req/day | ~60 req/day (10 leagues × 6 runs) |
| GitHub Actions | 2,000 min/month | ~180 min/month |
| Cloudflare Pages | 500 builds/month | ~180 builds/month |
| **Monthly total** | | **$0** |

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USER/goalflash.git
cd goalflash
npm install
```

### 2. Get API key

1. Go to [rapidapi.com](https://rapidapi.com)
2. Search **"API-Football"** → subscribe to free plan
3. Copy your RapidAPI key

### 3. Test locally

```bash
cp .env.example .env
# Edit .env → paste your RAPIDAPI_KEY

npm run fetch        # Pull today's matches
npm run dev          # http://localhost:4321
```

### 4. Deploy to Cloudflare Pages

1. Push repo to GitHub
2. Cloudflare Dashboard → Pages → Create Project → connect repo
3. Build command: `npm run build` | Output: `dist`
4. Go to Settings → Environment Variables → add `RAPIDAPI_KEY`
5. Get your API token and account ID from Cloudflare

### 5. Set GitHub Secrets

Repo → Settings → Secrets → Actions:

| Secret | Where to find it |
|---|---|
| `RAPIDAPI_KEY` | RapidAPI dashboard |
| `CLOUDFLARE_API_TOKEN` | CF dashboard → API Tokens → "Edit Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | CF dashboard → any page → right sidebar |

### 6. Finalize

Update these values for your domain:

- `astro.config.mjs` → `site: "https://your-domain.com"`
- `public/robots.txt` → sitemap URL

Push to `main` — the pipeline fires immediately, then runs on the cron schedule.

## Project Structure

```
goalflash/
├── .github/workflows/
│   └── deploy.yml              ← Cron-triggered CI/CD
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── scripts/
│   └── fetch-scores.js         ← Multi-league data fetcher
├── src/
│   ├── components/
│   │   ├── MatchCard.astro     ← Card for index listings
│   │   └── Scoreboard.astro    ← Giant score hero component
│   ├── data/
│   │   └── matches.json        ← Cached API data (auto-updated)
│   ├── layouts/
│   │   └── BaseLayout.astro    ← HTML shell + SEO meta slots
│   ├── pages/
│   │   ├── index.astro         ← EN homepage
│   │   ├── match/
│   │   │   └── [slug].astro    ← EN match detail (programmatic)
│   │   └── ar/
│   │       ├── index.astro     ← AR homepage
│   │       ├── [arslug].astro  ← AR slug redirect pages
│   │       └── match/
│   │           └── [slug].astro ← AR match detail (programmatic)
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
├── .env.example
└── .gitignore
```

## Multi-Tournament Configuration

### Adding leagues

Edit the `LEAGUES` array in `scripts/fetch-scores.js`:

```js
{ id: 233, name: "Egyptian Premier League", nameAR: "الدوري المصري", priority: 2 },
```

Find league IDs at: https://www.api-football.com/documentation-v3#tag/Leagues

### Adding team translations

Expand the `TEAM_AR` dictionary:

```js
"Al Ain":  "العين",
"Persepolis": "برسبوليس",
```

### Cron schedule tuning

The workflow uses two cron patterns:

- **World Cup months** (June-July): every 2 hours, 12:00–22:00 UTC
- **Regular season** (rest of year): every 3 hours, 08:00–23:00 UTC

Adjust in `.github/workflows/deploy.yml`.

## SEO Features

- [x] Programmatic `<title>` and `<meta description>` per match and language
- [x] `SportsEvent` JSON-LD structured data with live scores
- [x] `BreadcrumbList` JSON-LD
- [x] `hreflang` tags linking EN ↔ AR alternates
- [x] Canonical URLs on all pages
- [x] Arabic slug redirect pages (`/ar/مباراة-...`)
- [x] Open Graph + Twitter Card meta
- [x] Auto-generated `sitemap.xml`
- [x] `robots.txt` with sitemap reference
- [x] Tournament badge identification (World Cup vs SPL vs UCL)
- [x] Score breakdown table (HT, FT, ET, penalties)
- [x] Zero JavaScript shipped — pure static HTML
- [x] Mobile-responsive, RTL-compatible layout

## License

MIT
