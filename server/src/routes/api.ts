import { Router } from 'express';
import type {
  BookRequest,
  CartRequest,
  Intake,
  PlanRequest,
  RefineRequest,
} from '@wayfinder/shared';
import { providerModes } from '../env';
import { planTrip, refineItinerary } from '../agent/orchestrator';
import { assembleCart, executeBooking, BookingError } from '../booking/stateMachine';

export const api = Router();

// Light validation / coercion so a malformed intake fails cleanly rather than
// deep in the agent.
function validateIntake(x: any): Intake {
  if (!x || typeof x !== 'object') throw new Error('intake required');
  const total = Number(x.budget?.total);
  if (!Number.isFinite(total) || total <= 0) throw new Error('budget.total must be a positive number');
  const nights = Math.max(1, Math.min(30, Math.floor(Number(x.nights) || 0)));
  if (!nights) throw new Error('nights required');
  if (!x.homeLocation || typeof x.homeLocation !== 'string') throw new Error('homeLocation required');
  return {
    budget: {
      total,
      currency: x.budget?.currency ?? 'USD',
      kind: x.budget?.kind === 'flexible' ? 'flexible' : 'hard',
    },
    interests: Array.isArray(x.interests) ? x.interests : [],
    freeText: typeof x.freeText === 'string' ? x.freeText : '',
    homeLocation: x.homeLocation,
    nights,
    dateWindow: {
      earliest: x.dateWindow?.earliest ?? null,
      latest: x.dateWindow?.latest ?? null,
      note: typeof x.dateWindow?.note === 'string' ? x.dateWindow.note : '',
    },
    partySize: Math.max(1, Math.min(12, Math.floor(Number(x.partySize) || 1))),
  };
}

api.get('/health', (_req, res) => res.json({ ok: true }));
api.get('/modes', (_req, res) => res.json(providerModes()));

api.post('/plan', async (req, res) => {
  try {
    const { intake } = req.body as PlanRequest;
    const clean = validateIntake(intake);
    const { destinations, itinerary } = await planTrip(clean);
    res.json({ destinations, itinerary, modes: providerModes() });
  } catch (err) {
    console.error('[api] /plan error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

api.post('/refine', async (req, res) => {
  try {
    const { intake, destinationId, instruction } = req.body as RefineRequest;
    const clean = validateIntake(intake);
    if (!destinationId) throw new Error('destinationId required');
    const itinerary = await refineItinerary(clean, destinationId, String(instruction ?? ''));
    res.json({ itinerary, modes: providerModes() });
  } catch (err) {
    console.error('[api] /refine error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

api.post('/cart', async (req, res) => {
  try {
    const { intake, itinerary } = req.body as CartRequest;
    const clean = validateIntake(intake);
    if (!itinerary) throw new Error('itinerary required');
    const cart = await assembleCart(clean, itinerary);
    res.json({ cart, modes: providerModes() });
  } catch (err) {
    console.error('[api] /cart error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

api.post('/book', async (req, res) => {
  try {
    const { cart, confirmed, confirmedOverBudget } = req.body as BookRequest;
    if (!cart) throw new Error('cart required');
    const result = await executeBooking(cart, Boolean(confirmed), Boolean(confirmedOverBudget));
    res.json({ result });
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(err.status).json({ error: err.message, code: err.code });
      return;
    }
    console.error('[api] /book error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});
