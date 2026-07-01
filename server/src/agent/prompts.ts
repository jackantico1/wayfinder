import type { Activity, Intake, Stay } from '@wayfinder/shared';
import type { Destination } from '@wayfinder/shared';
import { getClimateNormal } from '../data/climate';
import { estimateDestinationTotalUsd } from '../estimates';
import { toCurrency } from '../costModel';
import { monthLabel } from '../util/date';

function intakeSummary(intake: Intake): string {
  const { budget } = intake;
  return [
    `Budget: ${budget.total} ${budget.currency} total for the party (${budget.kind} cap).`,
    `Party size: ${intake.partySize}.`,
    `Home / origin: ${intake.homeLocation}.`,
    `Trip length: ${intake.nights} nights.`,
    `Quick-select interests: ${intake.interests.join(', ') || '(none)'}.`,
    `Free-text travel style: "${intake.freeText || '(none given)'}".`,
    `Date preference: ${intake.dateWindow.note || (intake.dateWindow.earliest ? `earliest ${intake.dateWindow.earliest}` : 'flexible / soon')}.`,
  ].join('\n');
}

export const SELECTION_SYSTEM = `You are Wayfinder's season-aware destination planner.

Given a traveler's constraints and the CURRENT DATE, you:
1. Infer the likely travel window (month/season) from trip length + any date preference.
2. Reason over the provided candidate destinations, considering seasonality (is it actually good to visit THEN?), reachability and cost from the origin, and how well each matches the traveler's interests.
3. Select ONE primary recommendation plus 2-3 alternates.

Each pick needs a single-sentence rationale that ties back to THIS traveler's specific inputs (season + interests + budget). Do not recommend a destination that is miserable in the inferred month.

You may call get_climate to check a destination's climate in a specific month. When ready, finish by calling submit_destinations with your picks. Do not write a long preamble — reason, then submit.`;

export function selectionUserMessage(intake: Intake, candidates: Destination[], travelMonth: number): string {
  const monthName = monthLabel(travelMonth);
  const catalog = candidates
    .map((d) => {
      const c = getClimateNormal(d.id, travelMonth);
      const est = toCurrency(estimateDestinationTotalUsd(intake, d), intake.budget.currency);
      return `- ${d.id} — ${d.city}, ${d.country} [${d.region}] tags: ${d.tags.join(', ')}. ${monthName} climate: ${c ? `${c.highC}°C/${c.lowC}°C, ${c.rainMm}mm — ${c.verdict}` : 'n/a'}. Rough all-in est: ${est} ${intake.budget.currency}. ${d.blurb}`;
    })
    .join('\n');

  return `Today's date: ${new Date().toISOString().slice(0, 10)}.
Inferred travel month: ${monthName}.

Traveler:
${intakeSummary(intake)}

Candidate destinations (climate shown for ${monthName}; estimates already in ${intake.budget.currency}):
${catalog}

Pick the best primary + 2-3 alternates for this traveler and month, then call submit_destinations. Use only destination ids from the list above.`;
}

export const ITINERARY_SYSTEM = `You are Wayfinder's itinerary builder.

For the chosen destination you:
1. Call search_stays and search_activities (and optionally search_flights) to see real options.
2. Choose ONE stay that fits the budget and the traveler's style.
3. Build a realistic day-by-day plan: 2-4 activities per day, paced sensibly — do NOT stack two full-day or two high-intensity activities in the same day; balance active days with lighter ones.
4. Keep the whole trip within the stated budget (flights + lodging + activities). The server computes exact costs; you make sensible selections.

When ready, finish by calling submit_itinerary with the chosen stayId, a one-paragraph "why this trip" summary, and one day entry per night, each listing the activity ids for that day. Use only ids returned by the tools. Do not write a long preamble — gather, then submit.`;

export function itineraryUserMessage(
  intake: Intake,
  destination: Destination,
  travelMonth: number,
  instruction?: string,
): string {
  const c = getClimateNormal(destination.id, travelMonth);
  const base = `Destination: ${destination.city}, ${destination.country} (id: ${destination.id}).
Travel month: ${monthLabel(travelMonth)} — ${c?.verdict ?? 'n/a'}.

Traveler:
${intakeSummary(intake)}

Build a ${intake.nights}-night itinerary (one day entry per night). Call the tools to see stays and activities, then call submit_itinerary.`;
  if (instruction) {
    return `${base}

REFINE REQUEST from the traveler — adjust the plan accordingly: "${instruction}"`;
  }
  return base;
}

// Compact tool-result renderers (kept small to save tokens).
export function renderStays(stays: Stay[], currency: string): string {
  return stays
    .slice(0, 12)
    .map((s) => `${s.id} | ${s.name} | ${s.starRating}★ | ${s.neighborhood} | ${s.nightlyRate} USD/night | ${s.amenities.join(', ')} | ${s.cancellationPolicy}`)
    .join('\n');
}

export function renderActivities(acts: Activity[]): string {
  return acts
    .map((a) => `${a.id} | ${a.name} | ${a.category} | ${a.durationHours}h | ${a.intensity} intensity | ${a.cost} USD/person | ${a.area}`)
    .join('\n');
}
