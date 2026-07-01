import type { ClimateNormal } from '@wayfinder/shared';

// Historical monthly climate normals per destination (index 0 = January).
// Static lookup — deliberately not a live call. Grounds the agent's seasonal reasoning.
interface MonthlySeries {
  high: number[]; // °C daytime high
  low: number[]; // °C overnight low
  rain: number[]; // mm precipitation
}

const CLIMATE: Record<string, MonthlySeries> = {
  lisbon: {
    high: [15, 16, 18, 19, 21, 25, 27, 28, 26, 22, 18, 15],
    low: [8, 9, 11, 12, 14, 17, 18, 19, 18, 15, 11, 9],
    rain: [95, 85, 55, 60, 45, 15, 5, 7, 30, 80, 110, 105],
  },
  kyoto: {
    high: [9, 10, 14, 20, 25, 28, 32, 34, 29, 23, 17, 11],
    low: [1, 1, 4, 9, 14, 19, 23, 24, 20, 13, 7, 2],
    rain: [50, 65, 110, 115, 150, 215, 220, 130, 175, 120, 70, 45],
  },
  reykjavik: {
    high: [3, 4, 4, 6, 10, 12, 14, 13, 11, 7, 4, 3],
    low: [-2, -2, -1, 1, 4, 7, 9, 8, 6, 3, 0, -2],
    rain: [76, 72, 82, 58, 44, 50, 52, 62, 67, 86, 73, 79],
  },
  barcelona: {
    high: [13, 14, 16, 18, 21, 25, 28, 28, 26, 22, 17, 14],
    low: [6, 7, 9, 11, 15, 18, 21, 22, 19, 15, 10, 7],
    rain: [40, 35, 40, 50, 50, 35, 25, 60, 80, 90, 60, 45],
  },
  queenstown: {
    high: [22, 22, 19, 16, 12, 8, 7, 10, 13, 16, 18, 21],
    low: [10, 10, 8, 5, 2, -1, -2, 0, 3, 5, 7, 9],
    rain: [75, 70, 80, 70, 80, 65, 60, 65, 70, 80, 75, 80],
  },
  marrakech: {
    high: [18, 20, 23, 26, 29, 33, 38, 38, 33, 28, 23, 19],
    low: [6, 8, 11, 13, 16, 19, 22, 22, 19, 15, 11, 7],
    rain: [30, 35, 35, 30, 15, 5, 2, 3, 8, 25, 35, 35],
  },
  'mexico-city': {
    high: [22, 24, 26, 27, 26, 24, 23, 23, 22, 23, 22, 21],
    low: [6, 7, 9, 11, 12, 13, 12, 12, 12, 10, 8, 6],
    rain: [10, 7, 10, 25, 55, 110, 140, 135, 120, 60, 15, 8],
  },
  bali: {
    high: [30, 30, 31, 31, 31, 30, 29, 29, 30, 31, 31, 30],
    low: [24, 24, 24, 24, 24, 23, 23, 23, 23, 24, 24, 24],
    rain: [345, 275, 265, 110, 85, 75, 65, 55, 80, 130, 210, 300],
  },
  'cape-town': {
    high: [26, 26, 25, 23, 20, 18, 17, 18, 19, 21, 23, 25],
    low: [16, 16, 14, 12, 9, 8, 7, 8, 9, 11, 13, 15],
    rain: [15, 17, 20, 40, 70, 90, 85, 75, 45, 35, 20, 15],
  },
  vienna: {
    high: [3, 5, 10, 16, 20, 23, 26, 26, 20, 14, 8, 4],
    low: [-2, -1, 2, 6, 11, 14, 15, 15, 11, 7, 3, -1],
    rain: [40, 40, 45, 45, 65, 70, 70, 65, 55, 40, 50, 45],
  },
  'costa-rica': {
    high: [24, 25, 26, 26, 26, 25, 25, 25, 25, 24, 24, 24],
    low: [14, 14, 15, 16, 17, 17, 16, 16, 16, 16, 15, 15],
    rain: [6, 10, 15, 45, 230, 280, 200, 240, 355, 300, 140, 40],
  },
  split: {
    high: [11, 12, 15, 18, 23, 27, 30, 30, 26, 20, 15, 12],
    low: [4, 5, 7, 10, 15, 18, 21, 21, 17, 13, 8, 5],
    rain: [75, 60, 70, 60, 55, 45, 30, 40, 75, 90, 110, 95],
  },
};

function verdict(high: number, low: number, rain: number): string {
  const parts: string[] = [];
  if (high >= 33) parts.push('hot — plan around midday heat');
  else if (high >= 24) parts.push('warm');
  else if (high >= 17) parts.push('mild, pleasant');
  else if (high >= 9) parts.push('cool — pack layers');
  else parts.push('cold — bundle up');

  if (rain >= 160) parts.push('wet, frequent rain');
  else if (rain >= 80) parts.push('some rain likely');
  else if (rain <= 25) parts.push('dry');
  else parts.push('mostly dry');

  if (high >= 18 && high <= 28 && rain <= 60) parts.push('shoulder-season sweet spot');
  return parts.join(', ');
}

export function getClimateNormal(destinationId: string, month: number): ClimateNormal | undefined {
  const series = CLIMATE[destinationId];
  if (!series) return undefined;
  const i = Math.min(11, Math.max(0, month - 1));
  return {
    destinationId,
    month,
    highC: series.high[i],
    lowC: series.low[i],
    rainMm: series.rain[i],
    verdict: verdict(series.high[i], series.low[i], series.rain[i]),
  };
}

/** A rough 0-1 seasonal-fit score for ranking: rewards mild temps and low rain. */
export function seasonalFitScore(destinationId: string, month: number): number {
  const c = getClimateNormal(destinationId, month);
  if (!c) return 0.5;
  // Temperature comfort: peak around 24°C high, penalize extremes.
  const tempScore = 1 - Math.min(1, Math.abs(c.highC - 24) / 22);
  // Rain comfort: dry is best.
  const rainScore = 1 - Math.min(1, c.rainMm / 220);
  return Math.max(0, Math.min(1, 0.6 * tempScore + 0.4 * rainScore));
}
