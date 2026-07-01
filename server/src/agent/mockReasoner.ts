import type { Activity, Intake, InterestTag, Stay } from '@wayfinder/shared';
import type { DestinationPicks, PlanSkeleton, DaySkeleton } from '../planTypes';
import { DESTINATIONS, getDestination } from '../data/destinations';
import { seasonalFitScore, getClimateNormal } from '../data/climate';
import { estimateDestinationTotalUsd } from '../estimates';
import { toCurrency } from '../costModel';
import { getStays } from '../data/hotels';
import { getActivities } from '../data/activities';
import { inferTravelMonth, monthLabel } from '../util/date';

// Deterministic, KB-grounded reasoner. Runs when there's no Anthropic key so the
// app is fully functional out of the box (badge: MOCK). Mirrors the shape of the
// Claude path: it produces destination picks and an itinerary skeleton; the
// server does all the money math.

const KEYWORD_TAGS: { re: RegExp; tag: InterestTag }[] = [
  { re: /hik|hike|trek|outdoor|nature|mountain|adventur/i, tag: 'adventure-outdoors' },
  { re: /food|eat|dining|wine|culinary|restaurant|cuisine/i, tag: 'food-wine' },
  { re: /museum|histor|culture|art|ruin|temple/i, tag: 'culture-history' },
  { re: /beach|relax|spa|chill|unwind|sun/i, tag: 'beach-relaxation' },
  { re: /night|club|bar|party/i, tag: 'nightlife' },
  { re: /off.the.beaten|hidden|local|authentic|quiet/i, tag: 'off-the-beaten-path' },
  { re: /kid|family|child/i, tag: 'family-friendly' },
];

function effectiveInterests(intake: Intake): Set<InterestTag> {
  const set = new Set<InterestTag>(intake.interests);
  for (const { re, tag } of KEYWORD_TAGS) {
    if (re.test(intake.freeText)) set.add(tag);
  }
  return set;
}

export function selectDestinationsMock(intake: Intake): DestinationPicks {
  const month = inferTravelMonth(intake);
  const interests = effectiveInterests(intake);
  const wantsClose = /clos(er|e to home)|short flight|nearby|less far/i.test(intake.freeText);

  const scored = DESTINATIONS.map((dest) => {
    const overlap = dest.tags.filter((t) => interests.has(t)).length;
    const tagScore = interests.size ? overlap / interests.size : 0.4;
    const season = seasonalFitScore(dest.id, month);
    const estUsd = estimateDestinationTotalUsd(intake, dest);
    const estCur = toCurrency(estUsd, intake.budget.currency);
    const budgetFit = estCur <= intake.budget.total ? 1 : Math.max(0, intake.budget.total / estCur);
    let score = 0.4 * tagScore + 0.35 * season + 0.25 * budgetFit;
    if (wantsClose) {
      // Prefer nearer destinations when asked.
      const km = Math.abs(dest.latitude) + Math.abs(dest.longitude);
      score -= km / 4000;
    }
    return { dest, score, season, budgetFit, overlap };
  }).sort((a, b) => b.score - a.score);

  const monthName = monthLabel(month);
  const build = (entry: (typeof scored)[number]) => {
    const climate = getClimateNormal(entry.dest.id, month);
    const topTag = entry.dest.tags.find((t) => interests.has(t)) ?? entry.dest.tags[0];
    const tagPhrase = topTag.replace(/-/g, ' & ');
    const fit = entry.budgetFit >= 1 ? 'comfortably within budget' : 'a stretch on budget';
    const rationale = `${entry.dest.city} in ${monthName}: ${climate?.verdict ?? 'good conditions'} — strong for ${tagPhrase}, ${fit}.`;
    return { destinationId: entry.dest.id, rationale };
  };

  return {
    travelMonth: month,
    primary: build(scored[0]),
    alternates: scored.slice(1, 4).map(build),
  };
}

function isFullDay(a: Activity): boolean {
  return a.durationHours >= 6;
}

/**
 * Distribute activities into days: 2-3/day, no two high-intensity or two full-day
 * items in the same day, and never the same activity twice in one day. Cycles
 * through the ranked list (advancing a global pointer for variety) so every day
 * gets something even when the trip is longer than the activity pool.
 */
function planDays(activities: Activity[], nights: number, perDay: number): DaySkeleton[] {
  const days: DaySkeleton[] = [];
  if (activities.length === 0) {
    for (let d = 0; d < nights; d++) days.push({ title: `Day ${d + 1}`, activityIds: [] });
    return days;
  }
  let ptr = 0;
  for (let d = 0; d < nights; d++) {
    const chosen: Activity[] = [];
    const usedIds = new Set<string>();
    let usedFullDay = false;
    let highCount = 0;
    let attempts = 0;
    const maxAttempts = activities.length * 2;
    while (chosen.length < perDay && attempts < maxAttempts) {
      const a = activities[ptr % activities.length];
      ptr++;
      attempts++;
      if (usedIds.has(a.id)) continue;
      if (isFullDay(a) && (usedFullDay || chosen.length > 0)) continue;
      if (a.intensity === 'high' && highCount >= 1) continue;
      chosen.push(a);
      usedIds.add(a.id);
      if (isFullDay(a)) usedFullDay = true;
      if (a.intensity === 'high') highCount++;
    }
    // Guarantee at least one activity per day even if pacing rules were tight.
    if (chosen.length === 0) {
      chosen.push(activities[ptr % activities.length]);
      ptr++;
    }
    days.push({
      title: `${chosen[0].area} & around`,
      activityIds: chosen.map((a) => a.id),
    });
  }
  return days;
}

export function buildSkeletonMock(
  intake: Intake,
  destinationId: string,
  instruction?: string,
): PlanSkeleton {
  const dest = getDestination(destinationId)!;
  const interests = effectiveInterests({ ...intake, freeText: `${intake.freeText} ${instruction ?? ''}` });
  const instr = (instruction ?? '').toLowerCase();
  const cheaper = /cheap|budget|less expensive|save|afford/.test(instr);
  const relaxed = /relax|slower|less packed|fewer|easy/.test(instr);
  const busier = /more|packed|pack in|busy|maximi/.test(instr);
  const perDay = relaxed ? 2 : busier ? 3 : intake.nights >= 5 ? 2 : 3;

  // ── Stay selection ────────────────────────────────────────────────────────
  const rooms = Math.max(1, Math.ceil(intake.partySize / 2));
  const lodgingBudget = intake.budget.total * 0.42;
  const nightlyBudgetCur = lodgingBudget / Math.max(1, intake.nights) / rooms;
  const stays = getStays(destinationId);
  const affordable = stays.filter((s) => toCurrency(s.nightlyRate, intake.budget.currency) <= nightlyBudgetCur);
  let stay: Stay;
  if (cheaper) {
    stay = [...stays].sort((a, b) => a.nightlyRate - b.nightlyRate)[0];
  } else if (affordable.length) {
    // Best comfort within budget: highest-rated affordable option.
    stay = affordable.sort((a, b) => b.starRating - a.starRating || a.nightlyRate - b.nightlyRate)[0];
  } else {
    stay = [...stays].sort((a, b) => a.nightlyRate - b.nightlyRate)[0];
  }

  // ── Activity selection ─────────────────────────────────────────────────────
  let activities = getActivities(destinationId);
  // Rank by interest match, then keep variety.
  const catForTag: Record<string, string[]> = {
    'adventure-outdoors': ['adventure', 'sightseeing'],
    'food-wine': ['food'],
    'culture-history': ['culture'],
    'beach-relaxation': ['beach', 'relaxation'],
    nightlife: ['nightlife'],
  };
  const wantedCats = new Set<string>();
  for (const t of interests) (catForTag[t] ?? []).forEach((c) => wantedCats.add(c));
  activities = [...activities].sort((a, b) => {
    const am = wantedCats.has(a.category) ? 1 : 0;
    const bm = wantedCats.has(b.category) ? 1 : 0;
    if (am !== bm) return bm - am;
    if (cheaper) return a.cost - b.cost;
    return 0;
  });

  const days = planDays(activities, intake.nights, perDay);

  const monthName = monthLabel(inferTravelMonth(intake));
  const topInterest = [...interests][0]?.replace(/-/g, ' & ') ?? 'exploring';
  const summary = `A ${intake.nights}-night ${dest.city} trip tuned for ${topInterest}, timed for ${monthName} conditions. ${cheaper ? 'Leaned toward value on lodging and activities. ' : ''}${relaxed ? 'Paced with room to breathe each day. ' : ''}Staying in ${stay.neighborhood}, with days built to stay inside your budget.`;

  return { stayId: stay.id, summary, days };
}
