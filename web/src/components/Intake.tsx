import { useState } from 'react';
import type { Currency, Intake, InterestTag } from '@wayfinder/shared';
import { INTEREST_TAGS } from '@wayfinder/shared';

const TAG_LABEL: Record<InterestTag, string> = {
  'adventure-outdoors': 'Adventure & outdoors',
  'food-wine': 'Food & wine',
  'culture-history': 'Culture & history',
  'beach-relaxation': 'Beach & relaxation',
  nightlife: 'Nightlife',
  'off-the-beaten-path': 'Off the beaten path',
  'family-friendly': 'Family-friendly',
};

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export function IntakeForm({ onSubmit, busy }: { onSubmit: (intake: Intake) => void; busy: boolean }) {
  const [total, setTotal] = useState('5000');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [kind, setKind] = useState<'hard' | 'flexible'>('flexible');
  const [interests, setInterests] = useState<InterestTag[]>(['food-wine', 'culture-history']);
  const [freeText, setFreeText] = useState('I want to eat really well and see some history, without rushing.');
  const [homeLocation, setHomeLocation] = useState('London');
  const [nights, setNights] = useState('5');
  const [partySize, setPartySize] = useState('2');
  const [dateNote, setDateNote] = useState('sometime in the next couple of months');

  const toggle = (t: InterestTag) =>
    setInterests((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = () => {
    onSubmit({
      budget: { total: Number(total) || 0, currency, kind },
      interests,
      freeText,
      homeLocation,
      nights: Number(nights) || 1,
      dateWindow: { earliest: null, latest: null, note: dateNote },
      partySize: Number(partySize) || 1,
    });
  };

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="font-display text-2xl">Tell me about the trip</h2>
        <p className="mt-1 text-haze">
          Four things and a vibe. The agent picks a destination that's actually good to visit now, then
          builds a day-by-day plan inside your budget.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Total budget (whole party)</label>
          <div className="flex gap-2">
            <input className="field" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} />
            <select className="field w-28" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex gap-2 text-sm">
            {(['flexible', 'hard'] as const).map((k) => (
              <button key={k} className={`chip ${kind === k ? 'chip-on' : ''}`} onClick={() => setKind(k)}>
                {k === 'hard' ? 'Hard cap' : 'Flexible'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Home / origin (city or airport)</label>
          <input className="field" value={homeLocation} onChange={(e) => setHomeLocation(e.target.value)} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="label">Nights</label>
              <input className="field" inputMode="numeric" value={nights} onChange={(e) => setNights(e.target.value)} />
            </div>
            <div>
              <label className="label">Party size</label>
              <input
                className="field"
                inputMode="numeric"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Interests / travel style</label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.map((t) => (
            <button key={t} className={`chip ${interests.includes(t) ? 'chip-on' : ''}`} onClick={() => toggle(t)}>
              {TAG_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">In your own words</label>
        <textarea className="field min-h-[80px]" value={freeText} onChange={(e) => setFreeText(e.target.value)} />
      </div>

      <div>
        <label className="label">When (optional)</label>
        <input className="field" value={dateNote} onChange={(e) => setDateNote(e.target.value)} />
      </div>

      <button className="btn-primary w-full sm:w-auto" onClick={submit} disabled={busy}>
        {busy ? 'Planning…' : 'Plan my trip'}
      </button>
    </div>
  );
}
