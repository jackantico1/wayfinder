import { useState } from 'react';
import type { Currency, DestinationRec, DestinationResult } from '@wayfinder/shared';
import { money } from '../lib/format';

function Rec({
  rec,
  currency,
  primary,
  active,
  onPlan,
  busy,
}: {
  rec: DestinationRec;
  currency: Currency;
  primary?: boolean;
  active: boolean;
  onPlan?: () => void;
  busy: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${active ? 'border-clay bg-clay/10' : 'border-edge'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-display text-lg">
              {rec.city}, {rec.country}
            </h4>
            {primary && <span className="chip chip-on text-xs">Primary pick</span>}
            {active && !primary && <span className="chip chip-on text-xs">Now planning</span>}
          </div>
          <p className="mt-1 text-sm text-sand/90">{rec.rationale}</p>
          <p className="mt-1 text-xs text-haze">{rec.seasonNote}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-haze">est. all-in</div>
          <div className="font-medium">{money(rec.estimatedTotal, currency)}</div>
        </div>
      </div>
      {onPlan && !active && (
        <button className="btn-ghost mt-3 text-sm" onClick={onPlan} disabled={busy}>
          Plan this one instead
        </button>
      )}
    </div>
  );
}

export function DestinationPanel({
  destinations,
  currency,
  activeId,
  onPlanAlternate,
  busy,
}: {
  destinations: DestinationResult;
  currency: Currency;
  activeId: string;
  onPlanAlternate: (id: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">Why here, why now</h3>
          <p className="text-sm text-haze">Season-aware picks for {destinations.travelMonthLabel}.</p>
        </div>
      </div>
      <Rec
        rec={destinations.primary}
        currency={currency}
        primary
        active={activeId === destinations.primary.destinationId}
        onPlan={() => onPlanAlternate(destinations.primary.destinationId)}
        busy={busy}
      />
      <button className="text-sm text-haze hover:text-sand" onClick={() => setOpen((o) => !o)}>
        {open ? '▾ Hide' : '▸ Show'} {destinations.alternates.length} alternates
      </button>
      {open && (
        <div className="space-y-3">
          {destinations.alternates.map((a) => (
            <Rec
              key={a.destinationId}
              rec={a}
              currency={currency}
              active={activeId === a.destinationId}
              onPlan={() => onPlanAlternate(a.destinationId)}
              busy={busy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
