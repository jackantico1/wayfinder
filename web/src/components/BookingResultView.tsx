import type { BookingResult } from '@wayfinder/shared';
import { money } from '../lib/format';

export function BookingResultView({ result, onRestart }: { result: BookingResult; onRestart: () => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine/20 text-2xl text-pine">
          ✓
        </div>
        <div>
          <h2 className="font-display text-3xl">Booked</h2>
          {result.sandbox && (
            <span className="mt-2 inline-block rounded-full border border-sun px-2 py-0.5 text-xs text-sun">
              SANDBOX — ran end-to-end, charged no one
            </span>
          )}
        </div>

        <p className="text-sand/90">{result.summary}</p>

        <div className="grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-edge p-4">
            <div className="text-xs uppercase tracking-wide text-haze">
              Flight ({result.flightProvider === 'duffel' ? 'Duffel order' : 'mock'})
            </div>
            <div className="mt-1 font-mono text-lg">{result.flightConfirmation}</div>
          </div>
          <div className="rounded-xl border border-edge p-4">
            <div className="text-xs uppercase tracking-wide text-haze">Hotel confirmation</div>
            <div className="mt-1 font-mono text-lg">{result.stayConfirmation}</div>
          </div>
        </div>

        <div className="text-sm text-haze">
          Total {money(result.grandTotal, result.currency)} · booked {new Date(result.bookedAt).toLocaleString()}
        </div>

        <button className="btn-ghost" onClick={onRestart}>
          Plan another trip
        </button>
      </div>
    </div>
  );
}
