import type { DestinationResult, Intake, Itinerary, FlightOffer } from '@wayfinder/shared';
import type { DestinationPicks, PlanSkeleton } from '../planTypes';
import { hasAnthropic } from '../env';
import { DESTINATIONS, getDestination } from '../data/destinations';
import { getClimateNormal } from '../data/climate';
import { getStays } from '../data/hotels';
import { getActivities } from '../data/activities';
import { stays as stayProvider, activities as activityProvider, flights as flightProvider } from '../providers';
import { enrichDestinationRec } from '../estimates';
import { assembleItinerary } from '../itinerary';
import { inferTravelStart, inferTravelMonth, monthLabel, toISODate, addDays } from '../util/date';
import { guessOriginIata } from '../util/airports';
import { runToolLoop } from './claude';
import { SELECTION_TOOLS, ITINERARY_TOOLS } from './tools';
import {
  SELECTION_SYSTEM,
  selectionUserMessage,
  ITINERARY_SYSTEM,
  itineraryUserMessage,
  renderStays,
  renderActivities,
} from './prompts';
import { selectDestinationsMock, buildSkeletonMock } from './mockReasoner';

// ── Destination selection ──────────────────────────────────────────────────────

async function selectViaClaude(intake: Intake): Promise<DestinationPicks> {
  const month = inferTravelMonth(intake);
  const input = await runToolLoop({
    system: SELECTION_SYSTEM,
    userMessage: selectionUserMessage(intake, DESTINATIONS, month),
    tools: SELECTION_TOOLS,
    executors: {
      get_climate: (i) => JSON.stringify(getClimateNormal(i.destinationId, i.month) ?? { error: 'unknown destination' }),
    },
    terminalTool: 'submit_destinations',
    label: 'select',
  });
  return {
    travelMonth: month,
    primary: input.primary,
    alternates: Array.isArray(input.alternates) ? input.alternates : [],
  };
}

async function getPicks(intake: Intake): Promise<DestinationPicks> {
  if (hasAnthropic) {
    try {
      return await selectViaClaude(intake);
    } catch (err) {
      console.warn('[agent] destination selection via Claude failed, using mock:', (err as Error).message);
    }
  }
  return selectDestinationsMock(intake);
}

function buildDestinationResult(intake: Intake, picks: DestinationPicks): DestinationResult {
  const month = picks.travelMonth;
  const primaryDest = getDestination(picks.primary.destinationId);
  if (!primaryDest) throw new Error('invalid primary destination id');
  const primary = enrichDestinationRec(intake, primaryDest, picks.primary.rationale, month);

  const seen = new Set([primary.destinationId]);
  const alternates = picks.alternates
    .map((p) => {
      const d = getDestination(p.destinationId);
      if (!d || seen.has(d.id)) return null;
      seen.add(d.id);
      return enrichDestinationRec(intake, d, p.rationale, month);
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 3);

  return { travelMonth: month, travelMonthLabel: monthLabel(month), primary, alternates };
}

export async function selectDestinations(intake: Intake): Promise<DestinationResult> {
  const picks = await getPicks(intake);
  try {
    return buildDestinationResult(intake, picks);
  } catch {
    return buildDestinationResult(intake, selectDestinationsMock(intake));
  }
}

// ── Itinerary construction ─────────────────────────────────────────────────────

async function fetchOffer(intake: Intake, destIata: string, start: Date): Promise<FlightOffer[]> {
  return flightProvider.searchOffers({
    originIata: guessOriginIata(intake.homeLocation),
    destinationIata: destIata,
    departISO: toISODate(start),
    returnISO: toISODate(addDays(start, intake.nights)),
    adults: intake.partySize,
  });
}

async function skeletonViaClaude(
  intake: Intake,
  destId: string,
  offers: FlightOffer[],
  instruction?: string,
): Promise<PlanSkeleton> {
  const dest = getDestination(destId)!;
  const month = inferTravelMonth(intake);
  const input = await runToolLoop({
    system: ITINERARY_SYSTEM,
    userMessage: itineraryUserMessage(intake, dest, month, instruction),
    tools: ITINERARY_TOOLS,
    executors: {
      search_stays: (i) =>
        renderStays(
          stayProvider.searchStays({
            destinationId: destId,
            checkIn: toISODate(inferTravelStart(intake)),
            checkOut: toISODate(addDays(inferTravelStart(intake), intake.nights)),
            guests: intake.partySize,
            priceCeilingUsd: i?.priceCeilingUsd,
          }),
          intake.budget.currency,
        ),
      search_activities: () => renderActivities(activityProvider.searchActivities(destId)),
      search_flights: () =>
        offers
          .map(
            (o) =>
              `${o.id} | ${o.carrier} | ${o.origin}->${o.destination} | ${o.rawPrice} ${o.rawCurrency}${o.illustrative ? ' (illustrative sandbox price)' : ''}`,
          )
          .join('\n'),
    },
    terminalTool: 'submit_itinerary',
    label: 'itinerary',
  });
  return { stayId: input.stayId, summary: input.summary, days: input.days ?? [] };
}

/** Guarantee a valid, fully-populated skeleton, backfilling from the mock reasoner. */
function sanitizeSkeleton(intake: Intake, destId: string, raw: PlanSkeleton): PlanSkeleton {
  const validStayIds = new Set(getStays(destId).map((s) => s.id));
  const validActIds = new Set(getActivities(destId).map((a) => a.id));
  const fallback = buildSkeletonMock(intake, destId);

  const stayId = raw?.stayId && validStayIds.has(raw.stayId) ? raw.stayId : fallback.stayId;

  let days = Array.isArray(raw?.days)
    ? raw.days.map((d) => ({
        title: typeof d?.title === 'string' && d.title ? d.title : 'Day',
        activityIds: Array.isArray(d?.activityIds) ? d.activityIds.filter((id: string) => validActIds.has(id)) : [],
      }))
    : [];

  if (days.length > intake.nights) days = days.slice(0, intake.nights);
  while (days.length < intake.nights) {
    days.push(fallback.days[days.length] ?? { title: `Day ${days.length + 1}`, activityIds: [] });
  }
  // Any day left empty by filtering gets the mock day's activities.
  days = days.map((d, i) => (d.activityIds.length ? d : fallback.days[i] ?? d));

  const summary = typeof raw?.summary === 'string' && raw.summary.length > 10 ? raw.summary : fallback.summary;
  return { stayId, summary, days };
}

async function buildItineraryFor(intake: Intake, destId: string, instruction?: string): Promise<Itinerary> {
  const dest = getDestination(destId);
  if (!dest) throw new Error(`unknown destination ${destId}`);
  const start = inferTravelStart(intake);
  const offers = await fetchOffer(intake, dest.iata, start);
  const chosenOffer = offers[0];

  let raw: PlanSkeleton | null = null;
  if (hasAnthropic) {
    try {
      raw = await skeletonViaClaude(intake, destId, offers, instruction);
    } catch (err) {
      console.warn('[agent] itinerary via Claude failed, using mock:', (err as Error).message);
    }
  }
  if (!raw) raw = buildSkeletonMock(intake, destId, instruction);
  const skeleton = sanitizeSkeleton(intake, destId, raw);

  const stay = getStays(destId).find((s) => s.id === skeleton.stayId)!;
  const activitiesById = new Map(getActivities(destId).map((a) => [a.id, a]));

  return assembleItinerary({ intake, destination: dest, stay, activitiesById, flightOffer: chosenOffer, skeleton, start });
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function planTrip(
  intake: Intake,
): Promise<{ destinations: DestinationResult; itinerary: Itinerary }> {
  const destinations = await selectDestinations(intake);
  const itinerary = await buildItineraryFor(intake, destinations.primary.destinationId);
  return { destinations, itinerary };
}

export async function refineItinerary(
  intake: Intake,
  destinationId: string,
  instruction: string,
): Promise<Itinerary> {
  return buildItineraryFor(intake, destinationId, instruction);
}
