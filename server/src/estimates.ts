import type { Destination, Intake, DestinationRec } from '@wayfinder/shared';
import { getStays } from './data/hotels';
import { getActivities } from './data/activities';
import { estimateFlightUsd, toCurrency } from './costModel';
import { getClimateNormal } from './data/climate';

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function roomsNeeded(partySize: number): number {
  return Math.max(1, Math.ceil(partySize / 2));
}

/** Rough all-in trip estimate for a destination, in USD, for at-a-glance budget fit. */
export function estimateDestinationTotalUsd(intake: Intake, dest: Destination): number {
  const flights = estimateFlightUsd(intake.homeLocation, dest, intake.partySize);
  const stays = getStays(dest.id);
  const medianNightly = median(stays.map((s) => s.nightlyRate)) || 130;
  const lodging = medianNightly * roomsNeeded(intake.partySize) * intake.nights;
  const acts = getActivities(dest.id);
  const avgActivity = acts.length ? acts.reduce((s, a) => s + a.cost, 0) / acts.length : 45;
  // ~2.5 activities/day, per person.
  const activities = avgActivity * 2.5 * intake.nights * intake.partySize;
  return Math.round(flights + lodging + activities);
}

/** Build a fully-populated DestinationRec from a bare pick (id + rationale). */
export function enrichDestinationRec(
  intake: Intake,
  dest: Destination,
  rationale: string,
  travelMonth: number,
): DestinationRec {
  const climate = getClimateNormal(dest.id, travelMonth);
  return {
    destinationId: dest.id,
    city: dest.city,
    country: dest.country,
    rationale,
    seasonNote: climate ? `${dest.city} in that month: ${climate.verdict}` : 'Seasonality data unavailable',
    estimatedTotal: toCurrency(estimateDestinationTotalUsd(intake, dest), intake.budget.currency),
  };
}
