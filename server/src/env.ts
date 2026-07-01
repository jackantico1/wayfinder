import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { ProviderModes } from '@wayfinder/shared';

// Load .env from the repo root (the server workspace runs with cwd = server/).
const here = dirname(fileURLToPath(import.meta.url)); // server/src
config({ path: resolve(here, '../../.env') });
config(); // also honor a cwd-local .env, harmless if absent

export const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY ?? '').trim();
export const ANTHROPIC_MODEL = (process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-8').trim();
export const DUFFEL_TEST_TOKEN = (process.env.DUFFEL_TEST_TOKEN ?? '').trim();
export const PORT = Number(process.env.PORT) || 4000;

/** The agent uses Claude when a key is set; otherwise a deterministic mock reasoner. */
export const hasAnthropic = ANTHROPIC_API_KEY.length > 0;
/** Flights use real Duffel test mode only with a valid `duffel_test_` token. */
export const hasDuffel = DUFFEL_TEST_TOKEN.startsWith('duffel_test_');

export function providerModes(): ProviderModes {
  return {
    agent: hasAnthropic ? 'LIVE' : 'MOCK',
    flights: hasDuffel ? 'SANDBOX' : 'MOCK',
    stays: 'MOCK',
    activities: 'MOCK',
    weather: 'MOCK',
  };
}
