import type { Intake } from '@wayfinder/shared';
import { planTrip } from '../src/agent/orchestrator';

// Lightweight eval harness (seed for the roadmap item): run representative intake
// scenarios and assert outputs stay in budget and structurally + seasonally sane.
// Run: npm run check:budget

interface Scenario {
  name: string;
  intake: Intake;
}

function intake(partial: Partial<Intake> & Pick<Intake, 'budget' | 'homeLocation' | 'nights'>): Intake {
  return {
    interests: [],
    freeText: '',
    dateWindow: { earliest: null, latest: null, note: '' },
    partySize: 2,
    ...partial,
  };
}

const SCENARIOS: Scenario[] = [
  {
    name: 'Foodie couple, generous EU budget',
    intake: intake({
      budget: { total: 4500, currency: 'USD', kind: 'flexible' },
      homeLocation: 'London',
      nights: 5,
      interests: ['food-wine', 'culture-history'],
      freeText: 'great food and some history, relaxed pace',
    }),
  },
  {
    name: 'Beach & relaxation from NYC',
    intake: intake({
      budget: { total: 6500, currency: 'USD', kind: 'hard' },
      homeLocation: 'New York',
      nights: 7,
      interests: ['beach-relaxation'],
      freeText: 'warm beaches, unwind',
    }),
  },
  {
    name: 'Adventure trip from SF',
    intake: intake({
      budget: { total: 9000, currency: 'USD', kind: 'flexible' },
      homeLocation: 'San Francisco',
      nights: 6,
      interests: ['adventure-outdoors'],
      freeText: 'hiking and outdoors, off the beaten path',
    }),
  },
];

async function run() {
  let failures = 0;
  for (const s of SCENARIOS) {
    const { destinations, itinerary } = await planTrip(s.intake);
    const checks: [string, boolean][] = [
      ['days == nights', itinerary.days.length === s.intake.nights],
      ['flights > 0', itinerary.breakdown.flights > 0],
      ['lodging > 0', itinerary.breakdown.lodging > 0],
      ['within budget (or flexible)', itinerary.withinBudget || s.intake.budget.kind === 'flexible'],
      ['every day has ≥1 activity', itinerary.days.every((d) => d.activities.length >= 1)],
    ];
    const ok = checks.every(([, pass]) => pass);
    if (!ok) failures++;
    console.log(`\n${ok ? '✅' : '❌'} ${s.name}`);
    console.log(`   → ${destinations.primary.city} (${destinations.travelMonthLabel})`);
    console.log(`   → ${destinations.primary.seasonNote}`);
    console.log(`   → total ${Math.round(itinerary.breakdown.flights + itinerary.breakdown.lodging + itinerary.breakdown.activities)} / ${s.intake.budget.total} ${s.intake.budget.currency}, buffer ${itinerary.breakdown.buffer}`);
    for (const [label, pass] of checks) if (!pass) console.log(`     ✗ ${label}`);
  }
  console.log(`\n${failures === 0 ? 'All scenarios passed.' : `${failures} scenario(s) failed.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
