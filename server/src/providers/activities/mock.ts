import type { ActivityProvider } from './types';
import { getActivities } from '../../data/activities';

// Curated per-destination points of interest. A live places API is a clean
// later upgrade behind this same interface.
export const mockActivityProvider: ActivityProvider = {
  searchActivities(destinationId) {
    return getActivities(destinationId);
  },
};
