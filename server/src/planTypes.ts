// Internal skeleton the reasoner (Claude OR mock) produces for a chosen
// destination. The server turns this into a full Itinerary with deterministic
// money math — so the LLM handles selection + narrative and never the arithmetic.
export interface DaySkeleton {
  title: string;
  activityIds: string[];
}

export interface PlanSkeleton {
  stayId: string;
  summary: string;
  days: DaySkeleton[];
}

// Destination selection output (from Claude or the mock reasoner). The server
// enriches these picks with climate verdicts and cost estimates.
export interface DestinationPick {
  destinationId: string;
  rationale: string;
}

export interface DestinationPicks {
  travelMonth: number;
  primary: DestinationPick;
  alternates: DestinationPick[];
}
