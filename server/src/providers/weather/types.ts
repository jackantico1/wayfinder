import type { ClimateNormal } from '@wayfinder/shared';

// Every provider sits behind a typed request→response interface so the
// implementation can be swapped without touching agent or booking logic.
export interface WeatherProvider {
  getClimate(destinationId: string, month: number): ClimateNormal | undefined;
}
