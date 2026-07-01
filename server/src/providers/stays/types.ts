import type { Stay } from '@wayfinder/shared';

export interface StaySearch {
  destinationId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  /** Optional nightly-rate ceiling in USD. */
  priceCeilingUsd?: number;
}

export interface StayReservation {
  stayId: string;
  confirmationCode: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  cancellationPolicy: string;
}

// The interface a real wholesaler (Hotelbeds, Expedia Rapid) would implement.
// Swap the implementation and nothing upstream changes.
export interface StayProvider {
  searchStays(req: StaySearch): Stay[];
  confirmStay(stayId: string, checkIn: string, checkOut: string, guests: number): StayReservation;
}
