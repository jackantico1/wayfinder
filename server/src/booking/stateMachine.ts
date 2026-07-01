import type { BookingResult, Cart, CartItem, Intake, Itinerary } from '@wayfinder/shared';
import { flights as flightProvider, stays as stayProvider } from '../providers';
import { getStays } from '../data/hotels';
import { getActivities } from '../data/activities';

// The booking flow is the standout — and the one that requires the most product
// discipline. It is deliberately a REVIEW-THEN-EXECUTE machine: the agent is
// autonomous up to the point of an irreversible, money-moving action, then stops
// and requires an explicit human confirmation. Everything here reflects that.

export class BookingError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
  }
}

function money(n: number): string {
  return Math.round(n).toString();
}

/**
 * Assemble the bookable cart. Re-fetches the flight offer via getOffer (offers
 * expire) so the cart reflects the exact object we will book.
 */
export async function assembleCart(intake: Intake, itinerary: Itinerary): Promise<Cart> {
  const currency = itinerary.breakdown.currency;
  const fresh = await flightProvider.getOffer(itinerary.flight.offerId);
  const flightOfferId = fresh?.id ?? itinerary.flight.offerId;
  const stay = getStays(itinerary.destinationId).find((s) => s.id === itinerary.lodging.stayId);
  const activityIds = itinerary.days.flatMap((d) =>
    d.activities.map((a) => a.name),
  );
  const activityCount = activityIds.length;

  const items: CartItem[] = [
    {
      kind: 'flight',
      label: `${itinerary.flight.carrier} · ${itinerary.flight.route}`,
      detail: `Round trip · ${itinerary.startDate} → ${itinerary.endDate}${fresh ? '' : ' · offer re-fetch pending'}`,
      price: itinerary.breakdown.flights,
      cancellation: flightProvider.mode === 'SANDBOX'
        ? 'Duffel test order — settled on Duffel Balance, no real charge'
        : 'Sandbox mock — no real charge',
      ref: flightOfferId,
    },
    {
      kind: 'stay',
      label: itinerary.lodging.name,
      detail: `${itinerary.lodging.neighborhood} · ${itinerary.nights} nights · ${money(itinerary.lodging.nightlyRate)} ${currency}/night`,
      price: itinerary.breakdown.lodging,
      cancellation: stay?.cancellationPolicy ?? 'See property terms',
    },
    {
      kind: 'activity',
      label: 'Activities & experiences',
      detail: `${activityCount} booked experiences across ${itinerary.days.length} days`,
      price: itinerary.breakdown.activities,
      cancellation: 'Reserved — most cancellable up to 24h before',
    },
  ];

  const grandTotal = itinerary.breakdown.flights + itinerary.breakdown.lodging + itinerary.breakdown.activities;

  return {
    cartId: `cart-${Date.now().toString(36)}`,
    city: itinerary.city,
    startDate: itinerary.startDate,
    endDate: itinerary.endDate,
    guests: intake.partySize,
    items,
    currency,
    grandTotal,
    budgetTotal: intake.budget.total,
    budgetKind: intake.budget.kind,
    exceedsBudget: grandTotal > intake.budget.total,
    sandbox: true, // the whole app runs in test/sandbox mode — always surfaced
    flightOfferId,
    stayId: itinerary.lodging.stayId,
    activityIds: getActivities(itinerary.destinationId).map((a) => a.id),
  };
}

/**
 * Execute the booking — only after the guardrails pass. Nothing books silently.
 */
export async function executeBooking(
  cart: Cart,
  confirmed: boolean,
  confirmedOverBudget: boolean,
): Promise<BookingResult> {
  // Guardrail 1: an explicit confirmation is mandatory.
  if (!confirmed) {
    throw new BookingError('Booking requires explicit confirmation.', 'CONFIRMATION_REQUIRED', 400);
  }
  // Guardrail 2: over budget requires a distinct, second confirmation.
  if (cart.exceedsBudget && !confirmedOverBudget) {
    throw new BookingError(
      `Total ${money(cart.grandTotal)} ${cart.currency} exceeds the ${cart.budgetKind} budget of ${money(cart.budgetTotal)} ${cart.currency}. Requires a second confirmation.`,
      'BUDGET_CONFIRMATION_REQUIRED',
      409,
    );
  }

  // Guardrail 3: log the full pre-booking state — the action is auditable.
  console.log(
    '[booking] PRE-BOOK AUDIT',
    JSON.stringify({
      cartId: cart.cartId,
      flightOfferId: cart.flightOfferId,
      stayId: cart.stayId,
      grandTotal: cart.grandTotal,
      currency: cart.currency,
      budgetTotal: cart.budgetTotal,
      exceedsBudget: cart.exceedsBudget,
      confirmedOverBudget,
      sandbox: cart.sandbox,
    }),
  );

  // Execute. The agent never handles card data: the flight settles on Duffel
  // Balance (test) or a mock, and the hotel is a mock confirmation.
  const order = await flightProvider.createOrder(cart.flightOfferId);
  const reservation = stayProvider.confirmStay(cart.stayId, cart.startDate, cart.endDate, cart.guests);

  const result: BookingResult = {
    status: 'confirmed',
    flightConfirmation: order.reference,
    flightProvider: order.provider,
    stayConfirmation: reservation.confirmationCode,
    grandTotal: cart.grandTotal,
    currency: cart.currency,
    summary: `Booked ${cart.city}: ${cart.startDate} → ${cart.endDate}, ${cart.guests} traveler(s). Flight ${order.reference} (${order.provider}${order.sandbox ? ', sandbox' : ''}), hotel ${reservation.confirmationCode}.`,
    sandbox: true,
    bookedAt: new Date().toISOString(),
  };

  console.log('[booking] CONFIRMED', JSON.stringify({ cartId: cart.cartId, flight: result.flightConfirmation, stay: result.stayConfirmation }));
  return result;
}
