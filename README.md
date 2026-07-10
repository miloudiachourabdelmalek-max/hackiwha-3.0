# Marketing Intelligence Platform — Starter Scaffold

Runnable MVP skeleton for the architecture described in `docs/ARCHITECTURE.md`.

## What's implemented in this scaffold
- Auth: register/login/refresh (JWT + refresh token rotation), password hashing
- Organizations + Membership + role-based middleware
- Campaigns: list/detail (seeded sample data, real Google Ads sync is stubbed — see `src/integrations/googleAds`)
- Experiences (Marketing Memory): full CRUD + the "similar experiences" matching endpoint (feature 4)
- Frontend: Login, Dashboard (KPI cards + trend chart), Campaigns table, Memory list/detail/new with live "similar experiences" panel

## What's stubbed, not real, on purpose
- Google Ads OAuth callback exchanges a code for tokens but the actual Ads API client call is a mock returning fixture data — wire in `google-ads-api` npm package + real OAuth client credentials to go live
- AI Assistant endpoint returns retrieved experiences without calling out to an LLM yet — the retrieval half (feature 4 logic) is real, the generation half needs an API key wired into `src/services/assistant.service.js`
- Report generation (PDF/XLSX) is not included in this pass — ask and I'll add it next

## Run it
```
cp backend/.env.example backend/.env   # fill in JWT_SECRET at minimum
docker compose up --build
```
Backend: http://localhost:4000
Frontend: http://localhost:5173

Then, in a separate shell:
```
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend node prisma/seed.js
```

Seeded login: `demo@raftell.test` / `password123`
