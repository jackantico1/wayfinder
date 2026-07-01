import type { FlightOffer } from '@wayfinder/shared';
import type { FlightProvider, FlightSearch, FlightOrder } from './types';
import { createMockFlightProvider } from './mock';

// Real Duffel integration, in TEST mode, isolated behind the FlightProvider
// interface. Design notes (from the spec, and worth calling out in an interview):
//   • Auth with a `duffel_test_` token — the full search→offer→order lifecycle
//     runs risk-free, no accreditation, no real money.
//   • We book Duffel's own sandbox carrier, Duffel Airways (IATA ZZ), on a
//     reliable route (LHR→JFK) so an offer reliably comes back — real airlines'
//     sandboxes are flaky.
//   • Payment settles on the unlimited Duffel Balance — no card ever enters the app.
//   • Test-mode prices/schedules are NOT realistic, so the offer is treated as a
//     real bookable object while displayed pricing comes from the cost model.
//     `illustrative: true` flags the raw figure for honest labeling in the UI.

// Duffel's sandbox happy path.
const SANDBOX_ORIGIN = 'LHR';
const SANDBOX_DESTINATION = 'JFK';

function mapOffer(offer: any): FlightOffer {
  const slice = offer?.slices?.[0];
  const firstSeg = slice?.segments?.[0];
  const lastSeg = slice?.segments?.[slice.segments.length - 1];
  const carrier = offer?.owner?.name ?? firstSeg?.operating_carrier?.name ?? 'Duffel Airways';
  return {
    id: offer.id,
    provider: 'duffel',
    origin: slice?.origin?.iata_code ?? SANDBOX_ORIGIN,
    destination: slice?.destination?.iata_code ?? SANDBOX_DESTINATION,
    carrier,
    rawPrice: Number(offer.total_amount ?? 0),
    rawCurrency: offer.total_currency ?? 'GBP',
    departISO: firstSeg?.departing_at ?? new Date().toISOString(),
    arriveISO: lastSeg?.arriving_at ?? new Date().toISOString(),
    durationMinutes: 0,
    illustrative: true, // sandbox price — never used for budget math
    cabin: 'economy',
  };
}

export function createDuffelFlightProvider(token: string): FlightProvider {
  const fallback = createMockFlightProvider();
  // Lazily constructed so an SDK/import hiccup degrades gracefully to mock.
  let clientPromise: Promise<any> | null = null;
  async function client(): Promise<any> {
    if (!clientPromise) {
      clientPromise = import('@duffel/api').then(({ Duffel }) => new Duffel({ token }));
    }
    return clientPromise;
  }

  return {
    mode: 'SANDBOX',

    async searchOffers(req: FlightSearch): Promise<FlightOffer[]> {
      try {
        const duffel = await client();
        const res = await duffel.offerRequests.create({
          slices: [
            {
              origin: SANDBOX_ORIGIN,
              destination: SANDBOX_DESTINATION,
              departure_date: req.departISO,
            },
          ],
          passengers: Array.from({ length: Math.max(1, req.adults) }, () => ({ type: 'adult' })),
          cabin_class: 'economy',
          return_offers: true,
        });
        const offers: any[] = res?.data?.offers ?? [];
        if (offers.length === 0) throw new Error('no offers returned');
        return offers.slice(0, 4).map(mapOffer);
      } catch (err) {
        console.warn('[duffel] searchOffers failed, falling back to mock:', (err as Error).message);
        return fallback.searchOffers(req);
      }
    },

    async getOffer(offerId: string): Promise<FlightOffer | null> {
      if (!offerId.startsWith('off_')) return fallback.getOffer(offerId);
      try {
        const duffel = await client();
        const res = await duffel.offers.get(offerId);
        return res?.data ? mapOffer(res.data) : null;
      } catch (err) {
        console.warn('[duffel] getOffer failed:', (err as Error).message);
        return null;
      }
    },

    async createOrder(offerId: string): Promise<FlightOrder> {
      if (!offerId.startsWith('off_')) return fallback.createOrder(offerId);
      try {
        const duffel = await client();
        // Re-fetch the offer immediately before booking — offers expire, and we
        // need the current passenger ids + amount.
        const offerRes = await duffel.offers.get(offerId);
        const offer = offerRes?.data;
        if (!offer) throw new Error('offer expired');

        const passengers = (offer.passengers ?? []).map((p: any) => ({
          id: p.id,
          title: 'mr',
          gender: 'm',
          given_name: 'Wayfinder',
          family_name: 'Traveler',
          born_on: '1990-01-01',
          email: 'traveler@wayfinder.example',
          phone_number: '+442080160509',
        }));

        const orderRes = await duffel.orders.create({
          selected_offers: [offerId],
          // Settle on the unlimited Duffel Balance — no card, no real charge.
          payments: [
            { type: 'balance', amount: offer.total_amount, currency: offer.total_currency },
          ],
          passengers,
        });
        const order = orderRes?.data;
        return {
          reference: order?.booking_reference ?? order?.id ?? 'DUFFEL-TEST',
          provider: 'duffel',
          sandbox: true,
        };
      } catch (err) {
        console.warn('[duffel] createOrder failed, falling back to mock:', (err as Error).message);
        return fallback.createOrder(offerId);
      }
    },
  };
}
