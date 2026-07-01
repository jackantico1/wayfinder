import type { StayProvider } from './types';
import { getStays } from '../../data/hotels';

function code(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// Deliberately mocked for v1: keeps the app self-contained and instantly
// runnable by anyone cloning the repo. Same interface a live provider uses.
export const mockStayProvider: StayProvider = {
  searchStays({ destinationId, guests, priceCeilingUsd }) {
    let stays = getStays(destinationId);
    if (priceCeilingUsd) stays = stays.filter((s) => s.nightlyRate <= priceCeilingUsd);
    // A room comfortably holds up to 2 guests; nudge larger parties toward
    // bigger properties (proxy: higher star rating).
    if (guests > 2) stays = stays.filter((s) => s.starRating >= 3);
    return [...stays].sort((a, b) => a.nightlyRate - b.nightlyRate);
  },

  confirmStay(stayId, checkIn, checkOut, guests) {
    const stay = getStays(stayId.split('-stay-')[0]).find((s) => s.id === stayId);
    return {
      stayId,
      confirmationCode: code('WF-STAY'),
      checkIn,
      checkOut,
      guests,
      cancellationPolicy: stay?.cancellationPolicy ?? 'See property terms',
    };
  },
};
