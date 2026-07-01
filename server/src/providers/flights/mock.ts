import type { FlightOffer } from '@wayfinder/shared';
import type { FlightProvider, FlightSearch, FlightOrder } from './types';

// Seeded mock flight offers behind the exact interface the real Duffel client
// implements — the whole app runs clone-and-go with no keys.
const CARRIERS = ['Meridian Air', 'Northwind', 'Azul Atlantic', 'Cirrus'];

function offerFor(req: FlightSearch, i: number): FlightOffer {
  const depart = new Date(`${req.departISO}T09:00:00Z`);
  const durationMinutes = 120 + ((i * 97) % 600);
  const arrive = new Date(depart.getTime() + durationMinutes * 60_000);
  return {
    id: `mock-offer-${req.originIata}-${req.destinationIata}-${i}`,
    provider: 'mock',
    origin: req.originIata,
    destination: req.destinationIata,
    carrier: CARRIERS[i % CARRIERS.length],
    rawPrice: 240 + i * 60,
    rawCurrency: 'USD',
    departISO: depart.toISOString(),
    arriveISO: arrive.toISOString(),
    durationMinutes,
    illustrative: false,
    cabin: 'economy',
  };
}

export function createMockFlightProvider(): FlightProvider {
  const cache = new Map<string, FlightOffer>();
  return {
    mode: 'MOCK',
    async searchOffers(req) {
      const offers = [0, 1, 2].map((i) => offerFor(req, i));
      for (const o of offers) cache.set(o.id, o);
      return offers;
    },
    async getOffer(offerId) {
      return cache.get(offerId) ?? null;
    },
    async createOrder(offerId): Promise<FlightOrder> {
      return {
        reference: `WF-MOCK-${offerId.slice(-4).toUpperCase()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
        provider: 'mock',
        sandbox: false,
      };
    },
  };
}
