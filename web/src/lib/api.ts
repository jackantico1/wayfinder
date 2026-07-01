import type {
  BookRequest,
  BookResponse,
  Cart,
  CartResponse,
  Intake,
  Itinerary,
  PlanResponse,
  ProviderModes,
  RefineResponse,
} from '@wayfinder/shared';

export class ApiError extends Error {
  constructor(message: string, readonly code?: string, readonly status?: number) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.error ?? `Request failed (${res.status})`, json.code, res.status);
  return json as T;
}

export function getModes(): Promise<ProviderModes> {
  return fetch('/api/modes').then((r) => r.json());
}

export function plan(intake: Intake): Promise<PlanResponse> {
  return post('/api/plan', { intake });
}

export function refine(intake: Intake, destinationId: string, instruction: string): Promise<RefineResponse> {
  return post('/api/refine', { intake, destinationId, instruction });
}

export function buildCart(intake: Intake, itinerary: Itinerary): Promise<CartResponse> {
  return post('/api/cart', { intake, itinerary });
}

export function book(req: BookRequest): Promise<BookResponse> {
  return post('/api/book', req);
}

export type { Cart };
