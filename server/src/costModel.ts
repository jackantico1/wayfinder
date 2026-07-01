import type { Currency, Destination } from '@wayfinder/shared';

// The cost model is the single source of truth for money math. It converts the
// USD-denominated provider data into the traveler's currency and estimates
// flight cost from great-circle distance. Displayed pricing is driven by THIS
// model, never by Duffel's raw sandbox price (which is illustrative in test mode).

// 1 USD = X of the target currency (approximate, static — a demo, not a bank).
const FX: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
};

export function toCurrency(usd: number, currency: Currency): number {
  return Math.round(usd * FX[currency]);
}

// Coordinates for common origin hubs, matched against free-text origin input.
const ORIGIN_COORDS: Record<string, [number, number]> = {
  london: [51.5, -0.13], lhr: [51.47, -0.45], lgw: [51.15, -0.19],
  'new york': [40.71, -74.0], nyc: [40.71, -74.0], jfk: [40.64, -73.78], newark: [40.69, -74.17],
  'los angeles': [34.05, -118.24], lax: [33.94, -118.41],
  'san francisco': [37.77, -122.42], sfo: [37.62, -122.38],
  chicago: [41.88, -87.63], ord: [41.98, -87.9],
  boston: [42.36, -71.06], bos: [42.36, -71.0],
  toronto: [43.65, -79.38], yyz: [43.68, -79.63],
  vancouver: [49.28, -123.12], yvr: [49.19, -123.18],
  paris: [48.86, 2.35], cdg: [49.01, 2.55],
  berlin: [52.52, 13.4], madrid: [40.42, -3.7], amsterdam: [52.37, 4.9],
  dublin: [53.35, -6.26], dubai: [25.2, 55.27], dxb: [25.25, 55.36],
  singapore: [1.35, 103.82], sin: [1.36, 103.99],
  'hong kong': [22.32, 114.17], hkg: [22.31, 113.91],
  tokyo: [35.68, 139.69], hnd: [35.55, 139.78],
  sydney: [-33.87, 151.21], syd: [-33.95, 151.18],
  melbourne: [-37.81, 144.96],
};

const DEFAULT_ORIGIN: [number, number] = [40.71, -74.0]; // fall back to NYC-ish
const DEFAULT_DISTANCE_KM = 6500;

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function resolveOrigin(home: string): [number, number] | null {
  const key = home.trim().toLowerCase();
  if (ORIGIN_COORDS[key]) return ORIGIN_COORDS[key];
  // Loose contains match (e.g. "London, UK").
  for (const [name, coords] of Object.entries(ORIGIN_COORDS)) {
    if (key.includes(name)) return coords;
  }
  return null;
}

export function flightDistanceKm(home: string, dest: Destination): number {
  const origin = resolveOrigin(home);
  if (!origin) return DEFAULT_DISTANCE_KM;
  return haversineKm(origin, [dest.latitude, dest.longitude]);
}

/**
 * Estimated round-trip economy flight cost for the whole party, in USD.
 * A simple base + per-km model that produces realistic figures across short
 * and long hauls — this is the number budget math uses.
 */
export function estimateFlightUsd(home: string, dest: Destination, partySize: number): number {
  const km = flightDistanceKm(home, dest);
  const perPerson = 90 + km * 0.09;
  return Math.round(perPerson * partySize);
}
