import { DUFFEL_TEST_TOKEN, hasDuffel } from '../env';
import { staticWeatherProvider } from './weather/static';
import { mockStayProvider } from './stays/mock';
import { mockActivityProvider } from './activities/mock';
import { createMockFlightProvider } from './flights/mock';
import { createDuffelFlightProvider } from './flights/duffel';
import type { FlightProvider } from './flights/types';

// Central provider wiring. The agent and booking layers depend only on these
// interfaces — the real-vs-mock decision lives here and nowhere else. This seam
// is the point: flights can be a live API while everything else is mocked, with
// zero changes upstream.
export const weather = staticWeatherProvider;
export const stays = mockStayProvider;
export const activities = mockActivityProvider;

export const flights: FlightProvider = hasDuffel
  ? createDuffelFlightProvider(DUFFEL_TEST_TOKEN)
  : createMockFlightProvider();
