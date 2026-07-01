import type { Currency, DayPlan } from '@wayfinder/shared';
import { money } from '../lib/format';

const INTENSITY: Record<string, string> = {
  low: 'text-pine',
  medium: 'text-sun',
  high: 'text-clay',
};

export function DayCard({ day, currency }: { day: DayPlan; currency: Currency }) {
  return (
    <div className="rounded-xl border border-edge bg-ink/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-display text-lg">
          Day {day.day} · {day.title}
        </h4>
        <span className="text-xs text-haze">running {money(day.runningTotal, currency)}</span>
      </div>
      <ul className="space-y-2.5">
        {day.activities.map((a, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 w-12 shrink-0 tabular-nums text-haze">{a.time}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{a.name}</span>
                <span className={`text-xs ${INTENSITY[a.intensity]}`}>• {a.intensity}</span>
              </div>
              <div className="text-xs text-haze">
                {a.area} · {a.durationHours}h
              </div>
            </div>
            <span className="shrink-0 tabular-nums text-haze">{a.cost > 0 ? money(a.cost, currency) : 'free'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
