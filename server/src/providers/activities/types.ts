import type { Activity } from '@wayfinder/shared';

export interface ActivityProvider {
  searchActivities(destinationId: string): Activity[];
}
