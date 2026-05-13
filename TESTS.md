# Tests

All tests live in the `backend/` package and use **Node.js's built-in test runner** (`node:test`).
No extra testing dependencies are required — just Node ≥ 18 (this project targets Node 22).

---

## How to Run

```bash
# From the repo root
cd backend

# Install dependencies (first time only)
npm ci

# Run all tests once
npm test

# Run all tests in watch mode
npm run test:watch

# Run a single file directly
node --test src/tests/audit.engine.test.js
```

Expected output ends with:

```
# tests 13
# suites 8
# pass  13
# fail  0
```

---

## Test Files

### `backend/src/tests/audit.engine.test.js`

Tests for `src/utils/audit.engine.js` — the pure, synchronous function (`runAudit`) that is the
core of the product. All tests use real entries from `pricingData.js`; no mocks are needed.

| # | Suite | Test name | What it verifies |
|---|---|---|---|
| 1 | Report structure | *returns the correct top-level shape* | `runAudit` always returns `{ summary, toolAudits[], overallRecommendations[] }` |
| 2 | Report structure | *reflects input spend and tool count in summary* | `summary.totalMonthlySpend`, `totalAnnualSpend`, and `numberOfTools` match the input |
| 3 | Unknown tool handling | *adds an error entry for an unrecognised toolId* | A `toolId` absent from `pricingData` produces a `toolAudit` with an `error` field containing "not found in pricing data" |
| 4 | Within-tool alternatives | *finds a cheaper plan within Cursor when on Ultra ($200/mo)* | Cursor Ultra → cheaper Cursor Pro/Hobby found; `hasCheaperAlternative = true`, `bestAlternative.monthlyCost < 200` |
| 5 | Within-tool alternatives | *returns up to 5 alternatives* | `toolAudit.alternatives.length ≤ 5` (engine caps results) |
| 6 | No cheaper alternative | *hasCheaperAlternative=false on the $0 Cursor Hobby plan* | Free plan cannot be undercut; `hasCheaperAlternative = false`, `bestAlternative = null` |
| 7 | No cheaper alternative | *adds a no-savings overall recommendation* | `overallRecommendations[0]` matches `/no cheaper/i` when no alternative exists |
| 8 | API tool alternatives | *classifies anthropicAPI as api type with token-based alternatives* | `alternativeType === "api"`, `hasCheaperAlternative = true`, `bestAlternative.estimatedMonthlyCost` is present |
| 9 | API tool alternatives | *classifies openAIAPI as api type* | Name contains "API" → `alternativeType === "api"` |
| 10 | Seat-based pricing | *enforces minimum seat count for Claude team plans* | Any alternative shown has `monthlyCost ≤ currentSpend`; engine applies `Math.max(membersNum, plan.seats.min)` |
| 11 | Cross-tool alternatives | *finds cheaper alternatives on other tools for Windsurf Max ($200)* | `hasCheaperAlternative = true`; at least one entry in `alternatives[]` has `toolName !== "Windsurf"` |
| 12 | Edge cases | *handles empty auditItems without throwing* | `auditItems: []` → `numberOfTools = 0`, no exceptions |
| 13 | Edge cases | *handles missing membersNum gracefully (defaults to 1)* | Omitting `membersNum` does not throw; a valid `toolAudit` is returned |

---

## CI

Every push to `main` (and every PR targeting `main`) triggers
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml), which runs two parallel jobs:

| Job | What it does |
|---|---|
| **Backend Tests** | `npm ci` → `npm test` (Node built-in test runner) |
| **Frontend Lint** | `npm ci` → `npm run lint` (ESLint via `@vitejs/plugin-react`) |

Both jobs use `ubuntu-latest` with Node 22 and npm dependency caching.
