# Marketing Intelligence Platform — Architecture & Build Spec

A "second brain" for marketing teams running Google Ads Performance Max. Not a reporting mirror — a memory system that prevents repeated mistakes and speeds up decisions.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│  Dashboard · Memory Explorer · AI Assistant · Reports        │
└───────────────────────────┬───────────────────────────────────┘
                            │ REST (JWT)
┌───────────────────────────▼───────────────────────────────────┐
│                     API GATEWAY (Express)                    │
│  Auth MW · RBAC MW · Rate Limit · Validation · Logging       │
└───┬─────────────┬─────────────┬─────────────┬────────────────┘
   │             │             │             │
┌───▼───┐   ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
│ Ads   │   │ Memory    │  │ AI      │  │ Reports   │
│ Sync  │   │ Service   │  │ Service │  │ Service   │
│Service│   │(experience│  │(RAG +   │  │(PDF/XLS)  │
│       │   │ engine)   │  │ LLM)    │  │           │
└───┬───┘   └─────┬─────┘  └────┬────┘  └─────┬─────┘
   │             │             │             │
┌───▼─────────────▼─────────────▼─────────────▼────┐
│         PostgreSQL (Prisma)  +  Redis (cache)     │
│         S3-compatible storage (attachments)       │
└────────────────────────────────────────────────────┘
        │
┌───────▼────────┐
│ Google Ads API  │  (OAuth2, scheduled sync jobs via BullMQ)
└─────────────────┘
```

**Key architectural decision:** the "Marketing Memory" is not a side feature bolted onto campaign data — it's the primary entity. Campaigns imported from Google Ads get *linked* to Experience records; Experiences can also exist without a live campaign (a hypothesis that was never launched, a competitor observation, a manual note). This is what makes feature 4 (don't repeat mistakes) possible: the recommendation engine queries Experiences, not raw Ads data.

### Background jobs (BullMQ + Redis)
- `syncGoogleAdsAccount` — pulls campaigns/asset groups/metrics on a schedule (default every 6h, configurable per org)
- `generateWeeklyReport` / `generateMonthlyReport` / `generateQuarterlyReport`
- `embedExperience` — generates a vector embedding for each Experience (for semantic search/AI assistant) whenever one is created or edited
- `refreshTokens` — proactive Google OAuth refresh before expiry

---

## 2. Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- IDENTITY & TEAMS ----------

model Organization {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  createdAt     DateTime @default(now())
  members       Membership[]
  googleAccounts GoogleAdsAccount[]
  experiences   Experience[]
  notes         Note[]
  campaigns     Campaign[]
  reports       Report[]
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String?
  emailVerified Boolean  @default(false)
  name          String
  avatarUrl     String?
  createdAt     DateTime @default(now())
  memberships   Membership[]
  refreshTokens RefreshToken[]
  experiencesAuthored Experience[] @relation("ExperienceAuthor")
  notes         Note[]
  comments      Comment[]
}

enum Role {
  OWNER
  ADMIN
  MARKETING_MANAGER
  ANALYST
  VIEWER
}

model Membership {
  id             String       @id @default(cuid())
  userId         String
  organizationId String
  role           Role
  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@unique([userId, organizationId])
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String
  expiresAt DateTime
  revoked   Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id])
}

// ---------- GOOGLE ADS IMPORT ----------

model GoogleAdsAccount {
  id             String   @id @default(cuid())
  organizationId String
  customerId     String   // Google Ads customer ID
  accessToken    String   // encrypted at rest
  refreshToken   String   // encrypted at rest
  lastSyncedAt   DateTime?
  syncStatus     String   @default("idle") // idle|syncing|error
  organization   Organization @relation(fields: [organizationId], references: [id])
  campaigns      Campaign[]
}

model Campaign {
  id              String   @id @default(cuid())
  organizationId  String
  googleAdsAccountId String
  externalId      String   // Google Ads campaign ID
  name            String
  status          String   // ENABLED|PAUSED|REMOVED
  channelType     String   // PERFORMANCE_MAX etc.
  budgetMicros    BigInt
  country         String?
  startDate       DateTime?
  endDate         DateTime?
  organization    Organization @relation(fields: [organizationId], references: [id])
  googleAdsAccount GoogleAdsAccount @relation(fields: [googleAdsAccountId], references: [id])
  assetGroups     AssetGroup[]
  metrics         CampaignMetric[]
  experiences     Experience[]
  notes           Note[]
  @@unique([googleAdsAccountId, externalId])
  @@index([organizationId, country])
}

model AssetGroup {
  id          String   @id @default(cuid())
  campaignId  String
  externalId  String
  name        String
  status      String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  assets      Asset[]
}

model Asset {
  id           String   @id @default(cuid())
  assetGroupId String
  type         String   // IMAGE|VIDEO|HEADLINE|DESCRIPTION|LOGO
  content      String   // text content or S3 URL
  performanceLabel String? // LOW|GOOD|BEST
  assetGroup   AssetGroup @relation(fields: [assetGroupId], references: [id])
}

// Daily granularity metrics snapshot — enables trend graphs without recomputation
model CampaignMetric {
  id             String   @id @default(cuid())
  campaignId     String
  date           DateTime
  impressions    Int
  clicks         Int
  conversions    Float
  costMicros     BigInt
  ctr            Float
  cpaMicros      BigInt
  roas           Float
  conversionRate Float
  country        String?
  audienceSignal String?
  searchCategory String?
  campaign       Campaign @relation(fields: [campaignId], references: [id])
  @@unique([campaignId, date, country])
  @@index([campaignId, date])
}

model Product {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  category       String
  externalId     String?  // Merchant Center ID if applicable
}

// ---------- MARKETING MEMORY (core innovation) ----------

model Experience {
  id             String   @id @default(cuid())
  organizationId String
  campaignId     String?  // nullable: an experience doesn't have to map to a live campaign

  title          String
  description    String?
  goal           String?
  hypothesis     String?

  country        String?
  language       String?
  targetAudience String?
  industry       String?
  category       String?
  productName    String?
  platform       String   @default("google_ads")
  googleCampaignId String?

  budgetMicros   BigInt?
  spendMicros    BigInt?
  roas           Float?
  cpaMicros      BigInt?
  ctr            Float?
  conversionRate Float?
  revenueMicros  BigInt?
  profitMicros   BigInt?

  startDate      DateTime?
  endDate        DateTime?

  creativeUsed   String?
  offer          String?
  landingPage    String?
  keywords       String[] // Postgres text array
  audience       String?

  result         String?  // free text summary of outcome
  lessonsLearned String?
  mistakesMade   String?
  recommendations String?

  status         String   @default("draft") // draft|active|completed|archived
  tags           String[]
  priority       String   @default("normal") // low|normal|high

  authorId       String
  embedding      Unsupported("vector(1536)")? // pgvector, for semantic search / AI assistant

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  campaign       Campaign?    @relation(fields: [campaignId], references: [id])
  author         User         @relation("ExperienceAuthor", fields: [authorId], references: [id])
  attachments    Attachment[]
  notes          Note[]

  @@index([organizationId, country])
  @@index([organizationId, category])
  @@index([organizationId, status])
  @@index([tags], type: Gin)
}

model Attachment {
  id           String   @id @default(cuid())
  experienceId String
  url          String   // S3 key
  filename     String
  mimeType     String
  experience   Experience @relation(fields: [experienceId], references: [id])
}

// ---------- NOTES ----------

model Note {
  id             String   @id @default(cuid())
  organizationId String
  authorId       String
  content        String   // markdown
  campaignId     String?
  experienceId   String?
  country        String?
  category       String?
  productName    String?
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  author         User         @relation(fields: [authorId], references: [id])
  campaign       Campaign?    @relation(fields: [campaignId], references: [id])
  experience     Experience?  @relation(fields: [experienceId], references: [id])
  comments       Comment[]
  attachments    Attachment[] @relation("NoteAttachments")
}

model Comment {
  id        String   @id @default(cuid())
  noteId    String
  authorId  String
  content   String
  createdAt DateTime @default(now())
  note      Note     @relation(fields: [noteId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])
}

// ---------- REPORTS ----------

model Report {
  id             String   @id @default(cuid())
  organizationId String
  type           String   // weekly|monthly|quarterly|custom
  format         String   // pdf|xlsx|csv
  fileUrl        String
  periodStart    DateTime
  periodEnd      DateTime
  createdAt      DateTime @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id])
}
```

**Notes on normalization:**
- `CampaignMetric` is kept at daily grain (not pre-aggregated) so trend graphs, heat maps, and custom date ranges are just `GROUP BY` queries — aggregation happens at query time or via a materialized view refreshed nightly for dashboard speed.
- `Experience.embedding` uses `pgvector` — required for the AI assistant's semantic search ("show campaigns similar to this one") and for feature 4's similarity matching, which shouldn't rely on exact string matches on country/category alone.
- Money stored as `Micros` (BigInt) matching Google Ads API convention — avoids float rounding errors, convert to display currency at the API/view layer only.

---

## 3. REST API Specification

Base path: `/api/v1`. All authenticated routes require `Authorization: Bearer <JWT>`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Email + password signup, sends verification email |
| POST | `/auth/login` | Returns access + refresh token |
| POST | `/auth/refresh` | Rotate refresh token → new access token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/verify-email` | Consume verification token |
| POST | `/auth/forgot-password` / `/auth/reset-password` | Password reset flow |
| GET | `/auth/google` | Redirect to Google OAuth consent (Ads scope) |
| GET | `/auth/google/callback` | Exchange code, store tokens on `GoogleAdsAccount` |

### Organizations & Team
| Method | Path | Description |
|---|---|---|
| GET/POST | `/organizations` | List / create orgs for current user |
| GET/PATCH | `/organizations/:id` | Org detail / update |
| GET | `/organizations/:id/members` | List members + roles |
| POST | `/organizations/:id/invite` | Invite by email with role |
| PATCH/DELETE | `/organizations/:id/members/:userId` | Change role / remove |

### Google Ads Sync
| Method | Path | Description |
|---|---|---|
| GET | `/ads-accounts` | List connected accounts |
| POST | `/ads-accounts/:id/sync` | Trigger manual sync job |
| GET | `/ads-accounts/:id/sync-status` | Poll job status |
| DELETE | `/ads-accounts/:id` | Disconnect |

### Campaigns & Metrics
| Method | Path | Description |
|---|---|---|
| GET | `/campaigns` | `?country=&category=&status=&sort=&page=&limit=` |
| GET | `/campaigns/:id` | Detail incl. asset groups |
| GET | `/campaigns/:id/metrics` | `?from=&to=&groupBy=day|week|month` |
| GET | `/campaigns/compare` | `?ids=1,2,3` side-by-side comparison |
| GET | `/campaigns/:id/heatmap` | Country x metric matrix |

### Marketing Memory (Experiences)
| Method | Path | Description |
|---|---|---|
| GET/POST | `/experiences` | List (filterable) / create |
| GET/PATCH/DELETE | `/experiences/:id` | CRUD |
| POST | `/experiences/:id/attachments` | Upload to S3, attach |
| GET | `/experiences/similar` | `?country=&category=&campaignType=` → feature 4 recommendation engine |
| GET | `/experiences/search` | Full-text + tag search, see §5 |

### Notes
| Method | Path | Description |
|---|---|---|
| GET/POST | `/notes` | `?campaignId=&experienceId=&country=&category=` |
| PATCH/DELETE | `/notes/:id` | Edit / delete |
| POST | `/notes/:id/comments` | Add comment |

### AI Assistant
| Method | Path | Description |
|---|---|---|
| POST | `/assistant/query` | `{ question: string, context?: {...} }` → RAG answer |
| GET | `/assistant/history` | Past Q&A for the org |

### Reports
| Method | Path | Description |
|---|---|---|
| POST | `/reports/generate` | `{ type, format, periodStart, periodEnd }` → async job |
| GET | `/reports` | List generated reports |
| GET | `/reports/:id/download` | Signed S3 URL |

**Conventions:** cursor or offset pagination (`?page=&limit=`, max 100/page) on every list endpoint; `sort=field:asc|desc`; standard envelope `{ data, meta: { page, total } }`; errors as `{ error: { code, message, details? } }` with correct HTTP status (400/401/403/404/409/422/500).

---

## 4. Feature 4 in Detail — "Don't Repeat Mistakes" Engine

This is the differentiator, so it deserves a concrete algorithm rather than "AI will handle it":

1. **Structured pre-filter** — when a user starts a new campaign draft (country, category/product, campaign type, budget range), query `Experience` for exact/near matches on `country`, `category`, `platform`, and budget within ±30%.
2. **Semantic fallback/boost** — embed the new campaign's description + hypothesis, cosine-similarity search against `Experience.embedding` (pgvector `<=>` operator) to surface conceptually similar experiences the structured filter missed (e.g. same audience type but different country).
3. **Ranking** — merge both result sets, rank by: recency, ROAS/profit outcome (surface failures with high mistake-density first — those are the highest-value warnings), and tag overlap.
4. **Output card per match**, always showing: what was tried, what happened (ROAS/CPA/profit), the recorded mistake/lesson, and a one-line recommendation — never raw dumps of old campaigns.
5. This same pipeline powers `/experiences/similar` and the AI assistant's "have we tried this before" queries — one engine, two entry points.

---

## 5. Search Engine (Feature 5)

- PostgreSQL full-text search (`tsvector` generated column) across `title`, `description`, `hypothesis`, `result`, `lessonsLearned`, `mistakesMade`, `recommendations`.
- GIN index on the tsvector column, and a separate GIN index on `tags` (array).
- Structured filters (country, date range, budget range, ROAS/CPA thresholds, author, status) combine with the FTS query via `AND` in a single parametrized query — no ORM string concatenation, use Prisma's `$queryRaw` with tagged templates for the FTS portion.
- Search relevance ranked with `ts_rank`, boosted by recency for ties.

---

## 6. AI Assistant Architecture

- RAG pattern, not fine-tuning: user question → embed → pgvector similarity search over `Experience` (and optionally `CampaignMetric` aggregates) → top-k results injected as context → Claude API call with a system prompt constraining it to answer only from provided context and to cite which experiences it drew from.
- For aggregate questions ("summarize all campaigns in Spain"), a pre-step runs a structured SQL aggregation (avg ROAS, total spend, count) and feeds both the numbers and the top relevant Experience records to the model, so it isn't asked to do arithmetic from prose.
- Store each Q&A pair (question, retrieved experience IDs, answer) in an `AssistantQuery` log table (add to schema if audit trail is wanted) — useful for both trust/debugging and later fine-tuning of retrieval quality.

---

## 7. Frontend Architecture

### Page map
```
/login, /register, /forgot-password
/onboarding (connect Google Ads, create org)
/dashboard                      → cards, trend graphs, heatmap
/campaigns                      → filterable table
/campaigns/:id                  → detail, metrics, linked experiences
/campaigns/compare?ids=...      → side-by-side
/memory                         → Experience list/search (the core new-idea screen)
/memory/:id                     → Experience detail
/memory/new                     → creation form (triggers "similar experiences" panel live as you type)
/assistant                      → chat-style Q&A
/notes                          → notes list, filterable
/reports                        → generate + history
/settings/organization
/settings/team
/settings/integrations           → Google Ads connection status
```

### Component hierarchy (top level)
```
<AppShell>
  <Sidebar />           // Notion/Linear-style collapsed nav
  <TopBar />            // org switcher, search, user menu
  <MainContent>
    <PageHeader />
    <FilterBar />       // shared across Campaigns/Memory/Notes
    <DataView>          // renders as Table | Cards | Chart depending on route
      <KpiCardGrid />
      <TrendChart />
      <HeatmapGrid />
      <DataTable />     // wraps React Table
    </DataView>
  </MainContent>
  <CommandPalette />    // cmd+k, Linear-style
</AppShell>
```

### State/data
- React Query for all server state (campaigns, experiences, metrics) — cache keys namespaced by org id, invalidated on mutation.
- Context API reserved for genuinely global UI state only: current org, current user, theme. Not for server data.
- Reusable hooks: `useCampaigns(filters)`, `useExperiences(filters)`, `useSimilarExperiences(draft)`, `useAssistantQuery()`, `useReportGeneration()`.
- Forms via React Hook Form + zod schema validation shared conceptually with backend Joi/zod validation (keep field names identical to reduce translation bugs).

### Visual direction
Stripe/Linear/Notion-inspired means: generous whitespace, restrained color (one accent color reserved for primary actions and positive-metric indicators, a separate warning color reserved only for "mistake/failure" signals from the Memory engine — this color-coding is actually functional, not decorative, since failure-flagging is the product's core value), monospace for numeric metrics in tables, no gradients/shadows-as-decoration. Avoid Google's dense blue-link/grid aesthetic entirely.

---

## 8. Auth Flow

1. Register (email/password) → verification email sent (JWT-signed token, 24h expiry) → account unusable for org creation until verified (soft gate, not hard block, to reduce friction).
2. Login → short-lived access token (15 min) + long-lived refresh token (30 days, stored hashed in DB, rotated on every use — old token revoked when new one issued, detect reuse of a revoked token as a signal to revoke the whole family).
3. Separately: **Google OAuth for Ads access** is not the login mechanism — it's a per-organization integration grant (scopes: `https://www.googleapis.com/auth/adwords`). A user logs in with email/password (or optionally "Sign in with Google" for identity, kept as a separate concern from the Ads-scoped OAuth grant used for data import).
4. RBAC middleware resolves `Membership.role` for the org referenced in the request (`X-Org-Id` header or route param) and checks against a permission matrix (e.g. only Owner/Admin can invite members or disconnect Ads accounts; Analyst/Viewer are read-only on Experiences; Marketing Manager can create/edit Experiences and Notes but not manage billing).

---

## 9. Folder Structure

```
marketing-intel-platform/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   │   ├── ui/            // buttons, inputs, cards (design system primitives)
│   │   │   ├── charts/
│   │   │   ├── memory/
│   │   │   └── campaigns/
│   │   ├── hooks/
│   │   ├── services/           // axios API clients, one file per resource
│   │   ├── context/
│   │   ├── utils/
│   │   └── router.jsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/            // business logic, framework-agnostic
│   │   ├── repositories/        // Prisma queries isolated here (swappable/testable)
│   │   ├── middleware/          // auth, rbac, validation, errorHandler, logging
│   │   ├── jobs/                // BullMQ processors
│   │   ├── integrations/
│   │   │   └── googleAds/       // client wrapper, mappers Ads API → Prisma models
│   │   ├── routes/
│   │   ├── validators/
│   │   └── app.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md (this file)
│   ├── API.md
│   └── runbooks/
├── docker/
│   ├── docker-compose.yml
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
└── .github/workflows/ci.yml
```

**Layering rule enforced in code review, not just docs:** controllers only orchestrate (parse request → call service → shape response); services hold business logic and call repositories; repositories are the only files that import `PrismaClient`. This is what makes "swap Postgres later" or "unit test business logic without a DB" actually possible.

---

## 10. Development Roadmap

**Phase 0 — Foundation (weeks 1–2)**
Auth (email/password + JWT/refresh), Organizations/Membership/RBAC, base folder structure, Docker Compose (Postgres, Redis, backend, frontend), CI skeleton.

**Phase 1 — Google Ads Import (weeks 3–5)**
OAuth flow, `GoogleAdsAccount` connection, sync job for Campaigns/AssetGroups/Assets/CampaignMetric, manual + scheduled sync, sync status UI.

**Phase 2 — Dashboard (weeks 6–7)**
Campaign list/detail, KPI cards, trend charts, comparison view, heatmap, filtering/sorting.

**Phase 3 — Marketing Memory core (weeks 8–10)**
Experience CRUD, Notes, Attachments/S3, full-text search engine.

**Phase 4 — Recommendation Engine + AI Assistant (weeks 11–13)**
pgvector setup, embedding pipeline, `/experiences/similar`, RAG assistant endpoint, assistant chat UI.

**Phase 5 — Reports + Teamwork polish (weeks 14–15)**
PDF/XLSX/CSV report generation, scheduled weekly/monthly/quarterly reports, invite flow, permission matrix hardening.

**Phase 6 — Hardening & launch (week 16)**
Load testing sync jobs, rate limiting, error monitoring (Sentry), logging (pino → hosted log sink), production deploy.

---

## 11. MVP Definition

Ship-able as a paid pilot with a single design partner after Phases 0–3:
- Google Ads OAuth + import + scheduled sync
- Clean dashboard (cards, trend chart, table, filtering)
- Full Experience CRUD + full-text search
- Manual "log this campaign as an experience" flow (even without the AI similarity engine yet — a searchable, well-tagged memory is already more valuable than Google's UI for this use case)

Everything in Phase 4+ (AI assistant, auto-recommendations, reports) is a strong v1.1–v1.3, not MVP-blocking — it's what turns "useful tool" into "sticky, hard-to-churn platform," but the searchable memory itself is what proves the core hypothesis.

---

## 12. Future Features (post-v1)

- Slack/Teams integration: push a "similar past experience" card into the channel when a new campaign is drafted
- Auto-drafted Experience records from campaign end (system proposes a summary, human edits/confirms — reduces the "nobody fills out the retro" failure mode that kills memory systems)
- Multi-channel expansion beyond Google Ads (Meta, TikTok) using the same Experience schema — `platform` field is already designed for this
- Anomaly detection (alert when a running campaign's ROAS drops below its own historical baseline)
- Benchmark library across organizations (opt-in, anonymized) — "shoe campaigns in France industry-wide average ROAS is X" — a genuine moat if enough orgs opt in

---

## 13. Production Deployment Strategy

- Docker Compose for local/staging parity; production on managed containers (ECS Fargate or equivalent) rather than raw EC2 — sync jobs and API scale independently.
- Postgres: managed (RDS/Cloud SQL) with pgvector extension enabled, daily automated backups, read replica once dashboard read load justifies it.
- Redis: managed (ElastiCache) for BullMQ + caching.
- S3-compatible storage for attachments/report files, signed URLs only, never public buckets.
- Secrets (Google OAuth client secret, JWT signing key, DB creds) in a secrets manager, never in `.env` committed to the repo — `.env.example` only.
- GitHub Actions: lint → test → build Docker images → push to registry → deploy on merge to `main`, with a manual approval gate for production.
- Structured logging (pino) shipped to a hosted sink; error tracking via Sentry on both frontend and backend; health-check endpoints (`/health`, `/health/db`, `/health/redis`) for the orchestrator.
- Encrypt `GoogleAdsAccount` OAuth tokens at rest (application-level encryption, not just disk encryption) since these are live credentials to a client's ad spend.

---

## What I'd build first if this were my own startup

Phase 0–3 as scoped, but I'd get a real design partner's actual Google Ads account connected in week 3, not week 5 — the riskiest unknown here isn't the CRUD, it's whether Performance Max's asset-group-level data maps cleanly to a useful Experience record, and that's only discoverable with real messy data, not a spec.
