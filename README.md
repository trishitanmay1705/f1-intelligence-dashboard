# F1 Intelligence Dashboard

A full-stack Formula 1 data dashboard built with **FastAPI** and **Next.js 15**. Browse live standings, race results, driver careers, and watch races replay lap-by-lap — all powered by the Jolpica/Ergast F1 API with a persistent file-based cache.

---

## Features

### Home
- Season-at-a-glance: upcoming race countdown, recent race winner, live championship leader
- Interactive race calendar grid — click any race to jump directly to its calendar entry
- Live driver and constructor standings tables with animated row entrance

### Standings
- Driver and constructor championship standings for any season (2021–present)
- Animated card entrance with stagger delay
- Tabbed layout with smooth panel transition animations

### Calendar
- Full race weekend schedule with FP1/FP2/FP3, Sprint, Qualifying, and Race sessions
- Click any race row to expand its weekend schedule
- Click **Race**, **Qualifying**, or **Sprint** session buttons to load inline results — no page navigation required
- Deep-link support: navigating from the home calendar card opens and scrolls to the correct round automatically

### Race Results
- Classification table with position badges, grid-vs-finish delta indicators, and fastest lap highlight
- **Race Replay** — lap-by-lap animated line chart:
  - 20 driver lines coloured by constructor
  - ▶ Play / ⏸ Pause / ↺ Replay controls
  - Scrubber to jump to any lap instantly
  - 1× / 2× / 4× playback speed
  - Hover the chart for a per-lap position tooltip sorted P1 → last
  - Live standings sidebar (updates each lap) with hover-to-highlight

### Driver Profiles
- Full career statistics: seasons, championships, wins, podiums, poles, total points
- **Career Points Chart** — gradient bars per team with championship ★ markers, average reference line, animated entrance, and custom tooltip
- Season-by-season breakdown table with position badges, relative points mini-bar, and staggered row animations
- Teams timeline with colour-coded pills

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3.3, custom CSS animations (spring easing) |
| Charts | Recharts 3.8 |
| Backend | FastAPI, Python 3.11, httpx (async) |
| Cache | File-based JSON cache (persistent, TTL-aware) |
| Data | [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) (Ergast-compatible) |
| Deploy | Render (backend), configurable for any static host (frontend) |

---

## Project Structure

```
f1-intelligence-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/routes/f1.py      # All API endpoints
│   │   ├── core/config.py        # Settings (env vars)
│   │   ├── services/
│   │   │   ├── f1_service.py     # Data fetching + reshaping
│   │   │   └── cache.py          # File-based JSON cache
│   │   └── main.py               # FastAPI app + CORS
│   ├── cache/                    # Cached API responses (gitignored)
│   ├── requirements.txt
│   └── render.yaml               # Render deploy config
└── frontend/
    ├── app/
    │   ├── page.tsx              # Home dashboard
    │   ├── standings/page.tsx    # Standings
    │   ├── calendar/page.tsx     # Race calendar + session results
    │   ├── results/page.tsx      # Race results + replay chart
    │   └── drivers/[driverId]/   # Driver career page
    ├── components/
    │   ├── charts/
    │   │   ├── RaceReplayChart.tsx
    │   │   ├── CareerPointsChart.tsx
    │   │   ├── DriverPointsChart.tsx
    │   │   ├── ConstructorPointsChart.tsx
    │   │   └── ChampionshipGapChart.tsx
    │   └── ui/                   # Navbar, badges, cards, etc.
    ├── lib/
    │   ├── api.ts                # Typed API client (axios)
    │   └── teamColors.ts         # Constructor colour map
    └── tailwind.config.ts
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/f1/season/{season}` | Race calendar for a season |
| GET | `/api/v1/f1/standings/drivers?season=` | Driver championship standings |
| GET | `/api/v1/f1/standings/constructors?season=` | Constructor standings |
| GET | `/api/v1/f1/results/{season}/{round}` | Race classification |
| GET | `/api/v1/f1/qualifying/{season}/{round}` | Qualifying results |
| GET | `/api/v1/f1/sprint/{season}/{round}` | Sprint race results |
| GET | `/api/v1/f1/laps/{season}/{round}` | Lap-by-lap position data |
| GET | `/api/v1/f1/drivers/{driver_id}/career` | Full driver career stats |
| GET | `/api/v1/f1/admin/cache/clear` | Clear all cached data |

Interactive docs available at `/api/docs` when the backend is running.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Create .env
echo JOLPICA_BASE_URL=https://api.jolpi.ca/ergast/f1 > .env

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Caching Strategy

Historical race data (any season before the current year) is cached **permanently** — it never changes, so there's no reason to re-fetch it. Current-season data uses a **5-minute TTL**. The cache lives in `backend/cache/` as hashed JSON files and survives server restarts.

The lap-by-lap endpoint paginates Jolpica's 100-entry-per-page limit automatically using `asyncio.gather` to fetch all pages in parallel, then merges and reshapes the data before caching the final result.

---

## Deployment

The backend includes a `render.yaml` for one-click deploy on [Render](https://render.com). Set the `JOLPICA_BASE_URL` environment variable in your Render service settings.

For the frontend, set `NEXT_PUBLIC_API_URL` to your deployed backend URL and deploy to Vercel, Netlify, or any Next.js-compatible host.
