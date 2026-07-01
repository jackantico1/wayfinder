import { useState } from 'react';
import type { Cart } from '@wayfinder/shared';
import { money, fmtDate } from '../lib/format';

const KIND_LABEL = { flight: 'Flight', stay: 'Stay', activity: 'Activities' } as const;

export function CartView({
  cart,
  onConfirm,
  onBack,
  busy,
  error,
}: {
  cart: Cart;
  onConfirm: (confirmed: boolean, confirmedOverBudget: boolean) => void;
  onBack: () => void;
  busy: boolean;
  error: string | null;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [overOk, setOverOk] = useState(false);
  const canBook = confirmed && (!cart.exceedsBudget || overOk);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Review your cart</h2>
          {cart.sandbox && (
            <span className="rounded-full border border-sun px-2 py-0.5 text-xs text-sun">SANDBOX · no real charge</span>
          )}
        </div>
        <p className="text-sm text-haze">
          {cart.city} · {fmtDate(cart.startDate)} – {fmtDate(cart.endDate)} · {cart.guests} traveler
          {cart.guests > 1 ? 's' : ''}
        </p>

        <div className="divide-y divide-edge">
          {cart.items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3 py-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-haze">{KIND_LABEL[item.kind]}</div>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-haze">{item.detail}</div>
                <div className="mt-0.5 text-xs text-pine">{item.cancellation}</div>
              </div>
              <div className="shrink-0 tabular-nums">{money(item.price, cart.currency)}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-edge pt-3">
          <span className="font-display text-lg">Grand total</span>
          <span className="font-display text-lg">{money(cart.grandTotal, cart.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-haze">
          <span>Your {cart.budgetKind} budget</span>
          <span>{money(cart.budgetTotal, cart.currency)}</span>
        </div>
      </div>

      {cart.exceedsBudget && (
        <div className="card border-clay/60 bg-clay/10">
          <h3 className="font-medium text-clay">⚠ Over budget</h3>
          <p className="mt-1 text-sm text-sand/90">
            This cart is {money(cart.grandTotal - cart.budgetTotal, cart.currency)} over your stated {cart.budgetKind}{' '}
            budget. A second, explicit confirmation is required before it will book.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={overOk} onChange={(e) => setOverOk(e.target.checked)} />
            I understand this exceeds my budget and want to proceed.
          </label>
        </div>
      )}

      {error && <div className="card border-clay/60 bg-clay/10 text-sm text-clay">{error}</div>}

      <div className="card space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          I've reviewed the dates, times, total, and cancellation terms.
        </label>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={!canBook || busy} onClick={() => onConfirm(confirmed, overOk)}>
            {busy ? 'Booking…' : 'Confirm & book'}
          </button>
          <button className="btn-ghost" disabled={busy} onClick={onBack}>
            Back to itinerary
          </button>
        </div>
        <p className="text-xs text-haze">
          Nothing books until you confirm. The flight settles on the Duffel Balance (test) — no card, no real
          money. The hotel is a mock reservation.
        </p>
      </div>
    </div>
  );
}
