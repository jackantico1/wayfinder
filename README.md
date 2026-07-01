# Wayfinder — an agentic trip planner

Wayfinder turns four inputs — **budget, interests, home location, trip length** — into a season-aware, day-by-day itinerary inside your budget, then runs a **review-then-execute** booking flow with a hard human checkpoint on the money-moving step.

It's a portfolio project built to show three things:

1. **LLM tool-use / agent orchestration** — Claude drives discrete, inspectable tool calls across two decomposed phases.
2. **Reasoning over structured inputs + external data** — season-aware destination selection against the actual calendar.
3. **Responsible agentic action** — autonomy right up to an irreversible action, then a mandatory human checkpoint.

The most impressive thing here isn't that the agent *can* book a trip. It's the deliberate design of **where it's allowed to act autonomously and where it must stop and ask.**

---

## Architecture

```
  ┌─────────┐   ┌──────────────────────┐   ┌──────────────────────────┐   ┌───────────────┐   ┌──────────────────┐
  │ Intake  │──▶│ Season-aware planner │──▶│ Tool-calling researcher  │──▶│  Itinerary    │──▶│ Guarded booking  │
  │ (4 in)  │   │ pick destination for │   │ flights · stays ·        │   │  day-by-day + │   │ cart → confirm → │
  │         │   │ THIS month + budget  │   │ activities · weather     │   │  cost model   │   │ execute (test)   │
  └─────────┘   └──────────┬───────────┘   └───────────┬──────────────┘   └───────────────┘   └────────┬─────────┘
                           │ get_climate                │ search_* tools                                 │ createOrder / confirmStay
                           ▼                            ▼                                                ▼
                   ┌───────────────────────────────────────────────────────────────────────────────────────────┐
                   │  Swappable provider interfaces — the seam is the point:                                    │
                   │   flights  = REAL Duffel (test mode)   |   stays / activities / weather = mocks             │
                   │  Every provider is `typed request → typed response`; swap an impl, nothing upstream changes │
                   └───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Two decomposed agent steps (not one giant prompt)

- **Destination selection** (`server/src/agent/orchestrator.ts` → `selectDestinations`). Claude infers the travel month from trip length + date preference, reasons over a curated destination knowledge base, may call `get_climate` to justify seasonality, and returns 1 primary + 2–3 alternates — each with a one-line rationale tied to *your* inputs.
- **Itinerary construction** (`buildItineraryFor`). For the chosen destination, Claude calls `search_stays` / `search_activities` / `search_flights`, picks a stay and paces 2–4 activities per day, and emits a structured skeleton.

The LLM does **selection and narrative**; the server does **all the money math** (`server/src/costModel.ts`, `itinerary.ts`) so budget totals are always coherent. Decomposing it this way makes the agent's reasoning inspectable — every tool call is logged.

### The swappable-tool seam

Flights being real while everything else is mocked is a **feature of the architecture, not a compromise**. It demonstrates the pattern concretely: `providers/flights/` has a `duffel.ts` and a `mock.ts` behind one `FlightProvider` interface; `providers/index.ts` picks the implementation from env. To make hotels real, you'd drop a new impl behind `StayProvider` — nothing else changes.

### Budget vs. sandbox pricing

Duffel test-mode prices aren't realistic, so Wayfinder treats the Duffel integration as **real** (auth, offer/order objects, order confirmation, Balance payment) while driving **displayed pricing and budget math from the cost model**. The raw sandbox figure is shown clearly labeled *illustrative*.

---

## The booking guardrail (the standout)

`server/src/booking/stateMachine.ts` is a **review-then-execute** machine, never a one-click money mover:

1. **Assemble the cart** — re-fetches the flight offer via `getOffer` (offers expire), gathers the stay + activities with prices and cancellation terms.
2. **Present for explicit confirmation** — the UI shows dates, total, and refund policy; nothing books silently.
3. **Guardrails before execution:**
   - **Hard stop over budget** → requires a distinct *second* confirmation (`BUDGET_CONFIRMATION_REQUIRED`).
   - **No raw payment data ever** — the flight settles on the unlimited **Duffel Balance** (test mode); the hotel is a mock confirmation. Nothing stores or types card numbers.
   - **Full pre-booking state is logged** (offer id, cart, totals) — the action is auditable.
4. **Execute** — `createOrder` against Duffel test mode (a real order object comes back) + `confirmStay` against the mock provider. The sandbox state is visible in the UI throughout.
5. **Return** a confirmation with the Duffel order reference + mock hotel code.

This is the same pattern serious agentic-commerce systems use: autonomy up to the irreversible step, then a mandatory checkpoint.

---

## Run it

Requires Node ≥ 20.

```bash
npm install            # installs all three workspaces
npm run dev            # server on :4000, web on :5173 (proxied)
# open http://localhost:5173
```

**Clone-and-run with zero keys.** Everything falls back to deterministic mocks; the UI shows a `MOCK` / `SANDBOX` / `LIVE` badge per provider. Add keys to light up the real paths:

```bash
cp .env.example .env
# ANTHROPIC_API_KEY=...     → agent badge LIVE (Claude planner)
# DUFFEL_TEST_TOKEN=duffel_test_...  → flights badge SANDBOX (real Duffel test mode)
```

Other commands:

```bash
npm run check:budget   # eval harness: asserts scenarios stay in budget + seasonally sane
npm run typecheck      # type-check server + web
npm run build          # production web build (server serves web/dist)
npm run start          # run the server (serves the built frontend)
```

---

## Layout

```
shared/     TS types imported by both server and web (the contract)
server/
  src/agent/       orchestrator, prompts, tool defs, Claude loop, mock reasoner
  src/providers/   flights (duffel|mock), stays, activities, weather — behind interfaces
  src/data/        curated KB: destinations, climate normals, activities, generated hotels
  src/booking/     the review-then-execute state machine + guardrails
  src/costModel.ts money math (FX + distance-based flight estimate)
  src/itinerary.ts assembles a fully-costed itinerary from a reasoner skeleton
web/        React + Vite + Tailwind: intake → itinerary → refine → cart → booked
```

---

## Roadmap (deliberately not built yet)

- **Real hotels** behind the existing `searchStays` / `confirmStay` interface (Hotelbeds / Expedia Rapid) — a clean demo of the swappable-tool design scaling to real inventory.
- Multi-destination / multi-leg trips.
- Learned preferences across sessions ("you tend to prefer shoulder season and boutique stays").
- Group planning with shared budgets.
- A fuller eval suite (the `check:budget` script is the seed).
- Post-trip: calendar export + packing list.
