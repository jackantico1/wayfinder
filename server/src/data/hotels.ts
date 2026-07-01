import type { Stay } from '@wayfinder/shared';
import { getDestination } from './destinations';

// Deterministically generated mock lodging inventory (~15 properties per
// destination, a few hundred total). Rates are in USD and sit in a realistic
// band per city so the total-cost math holds together even though the data is
// synthetic. Behind the same interface a real wholesaler would implement.

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface CityConfig {
  neighborhoods: string[];
  /** Mid-band nightly rate (USD) for a solid 3-star. */
  baseRate: number;
  amenityPool: string[];
}

const CITY: Record<string, CityConfig> = {
  lisbon: { neighborhoods: ['Alfama', 'Baixa', 'Chiado', 'Príncipe Real', 'Belém'], baseRate: 120, amenityPool: ['rooftop', 'breakfast', 'A/C', 'wifi', 'bar'] },
  kyoto: { neighborhoods: ['Gion', 'Higashiyama', 'Downtown', 'Arashiyama', 'Kyoto Station'], baseRate: 160, amenityPool: ['onsen', 'breakfast', 'garden', 'wifi', 'tea room'] },
  reykjavik: { neighborhoods: ['Old Harbour', 'Downtown 101', 'Laugavegur', 'Grandi'], baseRate: 210, amenityPool: ['geothermal spa', 'breakfast', 'aurora wake-up', 'wifi', 'sauna'] },
  barcelona: { neighborhoods: ['Eixample', 'Barri Gòtic', 'El Born', 'Gràcia', 'Barceloneta'], baseRate: 140, amenityPool: ['rooftop pool', 'breakfast', 'A/C', 'wifi', 'bar'] },
  queenstown: { neighborhoods: ['Central', 'Lakefront', 'Fernhill', 'Frankton'], baseRate: 190, amenityPool: ['lake view', 'breakfast', 'hot tub', 'wifi', 'ski storage'] },
  marrakech: { neighborhoods: ['Medina', 'Gueliz', 'Hivernage', 'Palmeraie'], baseRate: 110, amenityPool: ['riad courtyard', 'plunge pool', 'breakfast', 'wifi', 'hammam'] },
  'mexico-city': { neighborhoods: ['Roma Norte', 'Condesa', 'Polanco', 'Centro', 'Juárez'], baseRate: 115, amenityPool: ['rooftop', 'breakfast', 'wifi', 'bar', 'gym'] },
  bali: { neighborhoods: ['Ubud', 'Seminyak', 'Canggu', 'Uluwatu', 'Sanur'], baseRate: 95, amenityPool: ['private pool', 'breakfast', 'yoga', 'wifi', 'spa'] },
  'cape-town': { neighborhoods: ['City Bowl', 'Camps Bay', 'V&A Waterfront', 'Sea Point', 'Constantia'], baseRate: 130, amenityPool: ['ocean view', 'pool', 'breakfast', 'wifi', 'bar'] },
  vienna: { neighborhoods: ['Innere Stadt', 'Leopoldstadt', 'Neubau', 'Landstrasse'], baseRate: 135, amenityPool: ['breakfast', 'wifi', 'spa', 'bar', 'coffee house'] },
  'costa-rica': { neighborhoods: ['La Fortuna', 'Monteverde', 'Manuel Antonio', 'San José', 'Tamarindo'], baseRate: 120, amenityPool: ['pool', 'breakfast', 'jungle view', 'wifi', 'hot springs'] },
  split: { neighborhoods: ['Old Town', 'Bačvice', 'Varoš', 'Meje', 'Žnjan'], baseRate: 115, amenityPool: ['sea view', 'breakfast', 'A/C', 'wifi', 'terrace'] },
};

const ADJ = ['Casa', 'The', 'Hotel', 'Villa', 'Grand', 'Boutique', 'Little', 'Old', 'Blue', 'Golden'];
const NOUN = ['Terrace', 'Courtyard', 'Quarter', 'Lantern', 'Harbor', 'Garden', 'Retreat', 'House', 'Rooms', 'Lodge'];

function cancellationFor(stars: number, rand: () => number): string {
  if (stars <= 2) return 'Non-refundable';
  if (rand() < 0.5) return 'Free cancellation up to 48h before check-in';
  return 'Free cancellation up to 24h before check-in';
}

function buildStays(destinationId: string): Stay[] {
  const cfg = CITY[destinationId];
  const dest = getDestination(destinationId);
  if (!cfg || !dest) return [];
  const rand = mulberry32(hashSeed(destinationId));
  const count = 12 + Math.floor(rand() * 6); // 12-17
  const stays: Stay[] = [];
  for (let i = 0; i < count; i++) {
    const stars = 2 + Math.floor(rand() * 4); // 2-5
    const neighborhood = cfg.neighborhoods[Math.floor(rand() * cfg.neighborhoods.length)];
    // Rate scales with star band around the city base, plus jitter.
    const starMult = { 2: 0.65, 3: 1, 4: 1.5, 5: 2.3 }[stars] ?? 1;
    const jitter = 0.85 + rand() * 0.3;
    const nightlyRate = Math.round((cfg.baseRate * starMult * jitter) / 5) * 5;
    const amenities = [...cfg.amenityPool]
      .sort(() => rand() - 0.5)
      .slice(0, 2 + Math.floor(rand() * 3));
    const name = `${ADJ[Math.floor(rand() * ADJ.length)]} ${NOUN[Math.floor(rand() * NOUN.length)]}`;
    stays.push({
      id: `${destinationId}-stay-${i + 1}`,
      name: `${name} ${neighborhood}`,
      neighborhood,
      starRating: stars,
      nightlyRate,
      currency: 'USD',
      amenities,
      latitude: dest.latitude + (rand() - 0.5) * 0.08,
      longitude: dest.longitude + (rand() - 0.5) * 0.08,
      cancellationPolicy: cancellationFor(stars, rand),
    });
  }
  return stays;
}

// Precompute once at module load.
const STAYS_BY_DEST: Record<string, Stay[]> = {};
for (const id of Object.keys(CITY)) {
  STAYS_BY_DEST[id] = buildStays(id);
}

export function getStays(destinationId: string): Stay[] {
  return STAYS_BY_DEST[destinationId] ?? [];
}

export const TOTAL_STAY_COUNT = Object.values(STAYS_BY_DEST).reduce((n, s) => n + s.length, 0);
