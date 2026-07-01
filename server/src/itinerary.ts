import type {
  Activity,
  Destination,
  FlightOffer,
  Intake,
  Itinerary,
  Stay,
  DayPlan,
  DayActivity,
  CostLine,
} from '@wayfinder/shared';
import type { PlanSkeleton } from './planTypes';
import { estimateFlightUsd, toCurrency } from './costModel';
import { addDays, toISODate } from './util/date';
import { guessOriginIata } from './util/airports';

function roomsNeeded(partySize: number): number {
  return Math.max(1, Math.ceil(partySize / 2));
}

function fmtTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Turn a reasoner skeleton into a fully-costed Itinerary. This is the single
 * place money is computed, shared by the Claude and mock paths so budget math is
 * always coherent regardless of who did the selection.
 */
export function assembleItinerary(args: {
  intake: Intake;
  destination: Destination;
  stay: Stay;
  activitiesById: Map<string, Activity>;
  flightOffer: FlightOffer;
  skeleton: PlanSkeleton;
  start: Date;
}): Itinerary {
  const { intake, destination, stay, activitiesById, flightOffer, skeleton, start } = args;
  const currency = intake.budget.currency;
  const nights = intake.nights;
  const rooms = roomsNeeded(intake.partySize);

  // ── Money (all converted to the traveler's currency) ──────────────────────
  const flightsCost = toCurrency(
    estimateFlightUsd(intake.homeLocation, destination, intake.partySize),
    currency,
  );
  const nightlyConverted = toCurrency(stay.nightlyRate * rooms, currency);
  const lodgingCost = nightlyConverted * nights;

  // ── Day plans + running totals ────────────────────────────────────────────
  const days: DayPlan[] = [];
  let activitiesRunningUsd = 0;
  let activitiesTotalConverted = 0;

  skeleton.days.slice(0, nights).forEach((daySkel, idx) => {
    const dayNumber = idx + 1;
    const acts: DayActivity[] = [];
    // Start the day at 09:30 and space activities with a 1h buffer between them.
    let cursorMin = 9 * 60 + 30;
    for (const actId of daySkel.activityIds) {
      const a = activitiesById.get(actId);
      if (!a) continue;
      // Activity costs are per-person; scale to the whole party.
      const partyCostUsd = a.cost * intake.partySize;
      acts.push({
        time: fmtTime(Math.floor(cursorMin / 60) % 24, cursorMin % 60),
        name: a.name,
        area: a.area,
        durationHours: a.durationHours,
        cost: toCurrency(partyCostUsd, currency),
        intensity: a.intensity,
      });
      activitiesRunningUsd += partyCostUsd;
      cursorMin += Math.round(a.durationHours * 60) + 60;
    }
    activitiesTotalConverted += acts.reduce((s, a) => s + a.cost, 0);

    // Running total through end of this day: flights (all, up front) +
    // lodging accrued per night + activities so far.
    const runningTotal =
      flightsCost + nightlyConverted * dayNumber + toCurrency(activitiesRunningUsd, currency);

    days.push({
      day: dayNumber,
      title: daySkel.title,
      activities: acts,
      runningTotal,
    });
  });

  const activitiesCost = activitiesTotalConverted;
  const grandTotal = flightsCost + lodgingCost + activitiesCost;
  const buffer = intake.budget.total - grandTotal;

  // ── Cost lines ────────────────────────────────────────────────────────────
  const costLines: CostLine[] = [
    {
      label: `Flights (round trip, ${intake.partySize} ${intake.partySize === 1 ? 'traveler' : 'travelers'})`,
      amount: flightsCost,
      note: flightOffer.illustrative
        ? `Duffel sandbox raw price ${flightOffer.rawPrice} ${flightOffer.rawCurrency} — illustrative; budget uses the estimate`
        : undefined,
    },
    {
      label: `Lodging (${nights} ${nights === 1 ? 'night' : 'nights'} × ${rooms} ${rooms === 1 ? 'room' : 'rooms'}, ${stay.name})`,
      amount: lodgingCost,
    },
    { label: 'Activities', amount: activitiesCost },
    { label: 'Buffer remaining', amount: buffer, note: buffer < 0 ? 'over budget' : undefined },
  ];

  const originIata = guessOriginIata(intake.homeLocation);
  const startISO = toISODate(start);
  const endISO = toISODate(addDays(start, nights));

  return {
    destinationId: destination.id,
    city: destination.city,
    country: destination.country,
    startDate: startISO,
    endDate: endISO,
    nights,
    partySize: intake.partySize,
    summary: skeleton.summary,
    lodging: {
      stayId: stay.id,
      name: stay.name,
      neighborhood: stay.neighborhood,
      nightlyRate: nightlyConverted,
    },
    flight: {
      offerId: flightOffer.id,
      carrier: flightOffer.carrier,
      route: `${originIata} → ${destination.iata}`,
      estimatedCost: flightsCost,
      illustrativeRawPrice: flightOffer.illustrative ? flightOffer.rawPrice : undefined,
      illustrative: flightOffer.illustrative,
    },
    days,
    costLines,
    breakdown: {
      flights: flightsCost,
      lodging: lodgingCost,
      activities: activitiesCost,
      buffer,
      currency,
    },
    withinBudget: grandTotal <= intake.budget.total,
  };
}
