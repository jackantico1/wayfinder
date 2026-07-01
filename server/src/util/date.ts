import type { Intake } from '@wayfinder/shared';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLabel(month1to12: number): string {
  return MONTH_LABELS[Math.min(11, Math.max(0, month1to12 - 1))];
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Concrete trip start date. Uses the user's earliest date if given, otherwise
 * defaults to ~45 days out — far enough to be plannable, near enough to be real.
 */
export function inferTravelStart(intake: Intake): Date {
  const earliest = intake.dateWindow.earliest;
  if (earliest) {
    const d = new Date(`${earliest}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return addDays(new Date(), 45);
}

export function inferTravelMonth(intake: Intake): number {
  return inferTravelStart(intake).getUTCMonth() + 1;
}
