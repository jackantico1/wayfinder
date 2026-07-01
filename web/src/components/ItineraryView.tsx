import type { Itinerary } from '@wayfinder/shared';
import { money, fmtDate } from '../lib/format';
import { DayCard } from './DayCard';

export function ItineraryView({
  itinerary,
  onBook,
  busy,
}: {
  itinerary: Itinerary;
  onBook: () => void;
  busy: boolean;
}) {
  const { currency } = itinerary.breakdown;
  const total = itinerary.breakdown.flights + itinerary.breakdown.lodging + itinerary.breakdown.activities;
  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">
              {itinerary.city}, {itinerary.country}
            </h2>
            <p className="text-haze">
              {fmtDate(itinerary.startDate)} – {fmtDate(itinerary.endDate)} · {itinerary.nights} nights ·{' '}
              {itinerary.partySize} traveler{itinerary.partySize > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`inline-block rounded-full px-3 py-1 text-sm ${
                itinerary.withinBudget ? 'bg-pine/20 text-pine' : 'bg-clay/20 text-clay'
              }`}
            >
              {money(total, currency)} / {money(itinerary.breakdown.buffer + total, currency)}{' '}
              {itinerary.withinBudget ? '· in budget' : '· over budget'}
            </div>
          </div>
        </div>

        <p className="text-sand/90">{itinerary.summary}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-edge p-3 text-sm">
            <div className="text-haze">Flights · {itinerary.flight.carrier}</div>
            <div className="mt-0.5">
              {itinerary.flight.route} — est. {money(itinerary.flight.estimatedCost, currency)}
            </div>
            {itinerary.flight.illustrative && (
              <div className="mt-1 text-xs text-sun">
                Booked via sandbox (Duffel Airways, LHR–JFK). Raw test price{' '}
                {itinerary.flight.illustrativeRawPrice} illustrative — budget uses the estimate.
              </div>
            )}
          </div>
          <div className="rounded-xl border border-edge p-3 text-sm">
            <div className="text-haze">Lodging · {itinerary.lodging.neighborhood}</div>
            <div className="mt-0.5">
              {itinerary.lodging.name} — {money(itinerary.lodging.nightlyRate, currency)}/night
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {itinerary.days.map((d) => (
          <DayCard key={d.day} day={d} currency={currency} />
        ))}
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl">Ready?</h3>
          <p className="text-sm text-haze">
            The agent assembles a real cart. You review everything before anything books.
          </p>
        </div>
        <button className="btn-primary" onClick={onBook} disabled={busy}>
          {busy ? 'Assembling cart…' : 'Book it for me →'}
        </button>
      </div>
    </div>
  );
}
