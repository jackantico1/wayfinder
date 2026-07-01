import type { FlightOffer } from '@wayfinder/shared';

export interface FlightSearch {
  /** Best-effort origin IATA derived from the traveler's home location. */
  originIata: string;
  /** Intended destination IATA. */
  destinationIata: string;
  /** ISO departure date. */
  departISO: string;
  /** ISO return date. */
  returnISO: string;
  adults: number;
}

export interface FlightOrder {
  reference: string;
  provider: 'duffel' | 'mock';
  /** True when booked against a sandbox / test environment. */
  sandbox: boolean;
}

// Mirrors Duffel's model with three operations. `getOffer` exists because
// offers expire — we re-fetch immediately before booking.
export interface FlightProvider {
  readonly mode: 'SANDBOX' | 'MOCK';
  searchOffers(req: FlightSearch): Promise<FlightOffer[]>;
  getOffer(offerId: string): Promise<FlightOffer | null>;
  createOrder(offerId: string): Promise<FlightOrder>;
}
