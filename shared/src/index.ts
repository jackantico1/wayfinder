// ─────────────────────────────────────────────────────────────────────────────
// Wayfinder shared types — the contract imported by BOTH server and web.
// Pure type declarations (no runtime values) so consumers use `import type`
// and there is zero build-ordering coupling between workspaces.
// ─────────────────────────────────────────────────────────────────────────────

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export const INTEREST_TAGS = [
  'adventure-outdoors',
  'food-wine',
  'culture-history',
  'beach-relaxation',
  'nightlife',
  'off-the-beaten-path',
  'family-friendly',
] as const;
export type InterestTag = (typeof INTEREST_TAGS)[number];

/** A provider's active implementation, surfaced to the UI as a badge. */
export type ProviderMode = 'LIVE' | 'SANDBOX' | 'MOCK';

export interface ProviderModes {
  /** The season-aware planner + itinerary builder. LIVE = Claude, MOCK = deterministic reasoner. */
  agent: ProviderMode;
  /** Flights. SANDBOX = real Duffel test mode, MOCK = seeded offers. */
  flights: ProviderMode;
  stays: ProviderMode;
  activities: ProviderMode;
  weather: ProviderMode;
}

// ── Intake ───────────────────────────────────────────────────────────────────

export interface Budget {
  /** Total trip budget, in the selected currency, for the whole party. */
  total: number;
  currency: Currency;
  /** 'hard' = binding cap the agent must not exceed; 'flexible' = soft target. */
  kind: 'hard' | 'flexible';
}

export interface Intake {
  budget: Budget;
  /** Quick-select tags. */
  interests: InterestTag[];
  /** Free-text travel style, e.g. "I want to hike but also eat really well". */
  freeText: string;
  /** Origin city or airport, e.g. "London" or "LHR". */
  homeLocation: string;
  /** Trip length in nights. */
  nights: number;
  /**
   * Optional date preference. `null` = flexible ("sometime soon"); the agent
   * infers a sensible window from the current date.
   */
  dateWindow: {
    /** ISO date (YYYY-MM-DD) or null. */
    earliest: string | null;
    latest: string | null;
    /** Free-text flexibility, e.g. "sometime in the next 3 months". */
    note: string;
  };
  partySize: number;
}

// ── Weather / climate ──────────────────────────────────────────────────────────

export interface ClimateNormal {
  destinationId: string;
  /** 1-12. */
  month: number;
  highC: number;
  lowC: number;
  rainMm: number;
  /** One-line human verdict, e.g. "warm, dry — shoulder season sweet spot". */
  verdict: string;
}

// ── Destinations ───────────────────────────────────────────────────────────────

export interface Destination {
  id: string;
  city: string;
  country: string;
  /** Primary airport IATA code. */
  iata: string;
  region: string;
  tags: InterestTag[];
  blurb: string;
  /** Rough great-circle distance bands from a handful of hub origins, for reachability heuristics. */
  latitude: number;
  longitude: number;
}

export interface DestinationRec {
  destinationId: string;
  city: string;
  country: string;
  /** One-line rationale tying the pick back to the user's specific inputs. */
  rationale: string;
  /** The climate verdict for the inferred travel month. */
  seasonNote: string;
  /** Rough per-person all-in estimate, for at-a-glance budget fit. */
  estimatedTotal: number;
}

export interface DestinationResult {
  /** The inferred travel month (1-12) the recs are reasoned against. */
  travelMonth: number;
  travelMonthLabel: string;
  primary: DestinationRec;
  alternates: DestinationRec[];
}

// ── Flights / stays / activities (provider outputs) ────────────────────────────

export interface FlightOffer {
  /** Provider-native offer id (Duffel offer id, or mock id). */
  id: string;
  provider: 'duffel' | 'mock';
  origin: string;
  destination: string;
  carrier: string;
  /** Raw provider price (illustrative only in sandbox — NOT used for budget math). */
  rawPrice: number;
  rawCurrency: string;
  departISO: string;
  arriveISO: string;
  durationMinutes: number;
  /** True when the price is sandbox/test data and must be labeled illustrative. */
  illustrative: boolean;
  cabin: string;
}

export interface Stay {
  id: string;
  name: string;
  neighborhood: string;
  starRating: number;
  /** Nightly rate, per room, in the destination's realistic band. */
  nightlyRate: number;
  currency: Currency;
  amenities: string[];
  latitude: number;
  longitude: number;
  cancellationPolicy: string;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  durationHours: number;
  cost: number;
  currency: Currency;
  area: string;
  /** Intensity so the planner paces the day realistically. */
  intensity: 'low' | 'medium' | 'high';
}

// ── Itinerary ──────────────────────────────────────────────────────────────────

export interface CostLine {
  label: string;
  amount: number;
  /** Extra context, e.g. "illustrative — Duffel sandbox price". */
  note?: string;
}

export interface DayActivity {
  time: string; // e.g. "09:30"
  name: string;
  area: string;
  durationHours: number;
  cost: number;
  intensity: 'low' | 'medium' | 'high';
}

export interface DayPlan {
  day: number;
  title: string;
  activities: DayActivity[];
  /** Running total of estimated spend through the end of this day. */
  runningTotal: number;
}

export interface CostBreakdown {
  flights: number;
  lodging: number;
  activities: number;
  /** budget.total - (flights + lodging + activities). Can be negative. */
  buffer: number;
  currency: Currency;
}

export interface Itinerary {
  destinationId: string;
  city: string;
  country: string;
  /** ISO dates. */
  startDate: string;
  endDate: string;
  nights: number;
  partySize: number;
  /** One-paragraph "why this trip". */
  summary: string;
  lodging: {
    stayId: string;
    name: string;
    neighborhood: string;
    nightlyRate: number;
  };
  flight: {
    offerId: string;
    carrier: string;
    route: string;
    /** Cost-model estimate used for budget math (not the raw sandbox price). */
    estimatedCost: number;
    /** The raw provider figure, shown labeled as illustrative when in sandbox. */
    illustrativeRawPrice?: number;
    illustrative: boolean;
  };
  days: DayPlan[];
  costLines: CostLine[];
  breakdown: CostBreakdown;
  /** Within the stated budget after the cost model is applied. */
  withinBudget: boolean;
}

// ── Booking ────────────────────────────────────────────────────────────────────

export interface CartItem {
  kind: 'flight' | 'stay' | 'activity';
  label: string;
  detail: string;
  price: number;
  cancellation: string;
  /** For flights: the (re-fetched) offer id we will book. */
  ref?: string;
}

export interface Cart {
  cartId: string;
  city: string;
  startDate: string;
  endDate: string;
  guests: number;
  items: CartItem[];
  currency: Currency;
  grandTotal: number;
  budgetTotal: number;
  budgetKind: 'hard' | 'flexible';
  /** True when grandTotal > budgetTotal — requires a second, explicit confirmation. */
  exceedsBudget: boolean;
  /** Sandbox/test state, surfaced to the UI. */
  sandbox: boolean;
  flightOfferId: string;
  stayId: string;
  activityIds: string[];
}

export interface BookingResult {
  status: 'confirmed';
  /** Duffel order reference (real order object in test mode) or mock reference. */
  flightConfirmation: string;
  flightProvider: 'duffel' | 'mock';
  /** Mock hotel confirmation code. */
  stayConfirmation: string;
  grandTotal: number;
  currency: Currency;
  summary: string;
  sandbox: boolean;
  bookedAt: string;
}

// ── API request/response envelopes ─────────────────────────────────────────────

export interface PlanRequest {
  intake: Intake;
}
export interface PlanResponse {
  destinations: DestinationResult;
  itinerary: Itinerary;
  modes: ProviderModes;
}

export interface RefineRequest {
  intake: Intake;
  destinationId: string;
  instruction: string;
}
export interface RefineResponse {
  itinerary: Itinerary;
  modes: ProviderModes;
}

export interface CartRequest {
  intake: Intake;
  itinerary: Itinerary;
}
export interface CartResponse {
  cart: Cart;
  modes: ProviderModes;
}

export interface BookRequest {
  cart: Cart;
  /** Must be true to book at all. */
  confirmed: boolean;
  /** Required (must be true) when cart.exceedsBudget. */
  confirmedOverBudget: boolean;
}
export interface BookResponse {
  result: BookingResult;
}

export interface ApiError {
  error: string;
  /** e.g. 'BUDGET_CONFIRMATION_REQUIRED' */
  code?: string;
}
