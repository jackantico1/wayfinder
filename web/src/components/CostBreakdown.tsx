import type { CostBreakdown as Breakdown } from '@wayfinder/shared';
import { money } from '../lib/format';

export function CostBreakdown({ breakdown, budgetTotal }: { breakdown: Breakdown; budgetTotal: number }) {
  const { currency } = breakdown;
  const spent = breakdown.flights + breakdown.lodging + breakdown.activities;
  const pct = Math.min(100, Math.round((spent / budgetTotal) * 100));
  const over = breakdown.buffer < 0;
  const rows = [
    ['Flights', breakdown.flights],
    ['Lodging', breakdown.lodging],
    ['Activities', breakdown.activities],
  ] as const;

  return (
    <div className="card space-y-3">
      <h3 className="font-display text-xl">Cost breakdown</h3>
      <div className="h-2 w-full overflow-hidden rounded-full bg-edge">
        <div className={`h-full ${over ? 'bg-clay' : 'bg-pine'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-1.5 text-sm">
        {rows.map(([label, amt]) => (
          <div key={label} className="flex justify-between">
            <span className="text-haze">{label}</span>
            <span>{money(amt, currency)}</span>
          </div>
        ))}
        <div className="my-2 border-t border-edge" />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{money(spent, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-haze">Budget</span>
          <span className="text-haze">{money(budgetTotal, currency)}</span>
        </div>
        <div className={`flex justify-between font-medium ${over ? 'text-clay' : 'text-pine'}`}>
          <span>{over ? 'Over budget' : 'Buffer remaining'}</span>
          <span>{money(breakdown.buffer, currency)}</span>
        </div>
      </div>
    </div>
  );
}
