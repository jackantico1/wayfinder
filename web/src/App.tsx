import { useEffect, useState } from 'react';
import type {
  BookingResult,
  Cart,
  DestinationResult,
  Intake,
  Itinerary,
  ProviderModes,
} from '@wayfinder/shared';
import * as api from './lib/api';
import { ApiError } from './lib/api';
import { ProviderBadges } from './components/ProviderBadge';
import { IntakeForm } from './components/Intake';
import { DestinationPanel } from './components/DestinationPanel';
import { CostBreakdown } from './components/CostBreakdown';
import { RefineBar } from './components/RefineBar';
import { ItineraryView } from './components/ItineraryView';
import { CartView } from './components/CartView';
import { BookingResultView } from './components/BookingResultView';

type Step = 'intake' | 'plan' | 'cart' | 'booked';

export function App() {
  const [modes, setModes] = useState<ProviderModes | null>(null);
  const [step, setStep] = useState<Step>('intake');
  const [intake, setIntake] = useState<Intake | null>(null);
  const [destinations, setDestinations] = useState<DestinationResult | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [activeId, setActiveId] = useState('');
  const [cart, setCart] = useState<Cart | null>(null);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);

  useEffect(() => {
    api.getModes().then(setModes).catch(() => {});
  }, []);

  async function run<T>(fn: () => Promise<T>, after: (r: T) => void) {
    setBusy(true);
    setError(null);
    try {
      after(await fn());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const handlePlan = (i: Intake) =>
    run(
      () => api.plan(i),
      (res) => {
        setIntake(i);
        setDestinations(res.destinations);
        setItinerary(res.itinerary);
        setActiveId(res.destinations.primary.destinationId);
        setModes(res.modes);
        setStep('plan');
      },
    );

  const handlePlanAlternate = (id: string) =>
    intake &&
    run(
      () => api.refine(intake, id, ''),
      (res) => {
        setItinerary(res.itinerary);
        setActiveId(id);
        setModes(res.modes);
      },
    );

  const handleRefine = (instruction: string) =>
    intake &&
    run(
      () => api.refine(intake, activeId, instruction),
      (res) => {
        setItinerary(res.itinerary);
        setModes(res.modes);
      },
    );

  const handleBook = () =>
    intake &&
    itinerary &&
    run(
      () => api.buildCart(intake, itinerary),
      (res) => {
        setCart(res.cart);
        setModes(res.modes);
        setBookError(null);
        setStep('cart');
      },
    );

  const handleConfirm = async (confirmed: boolean, confirmedOverBudget: boolean) => {
    if (!cart) return;
    setBusy(true);
    setBookError(null);
    try {
      const res = await api.book({ cart, confirmed, confirmedOverBudget });
      setBooking(res.result);
      setStep('booked');
    } catch (e) {
      setBookError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setStep('intake');
    setDestinations(null);
    setItinerary(null);
    setCart(null);
    setBooking(null);
    setError(null);
    setBookError(null);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-edge">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl">
                Wayfinder <span className="text-clay">·</span>{' '}
                <span className="text-base font-normal text-haze">agentic trip planner</span>
              </h1>
              <p className="text-sm text-haze">
                Intake → season-aware planner → tool-calling researcher → itinerary → guarded booking.
              </p>
            </div>
            {modes && <ProviderBadges modes={modes} />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && step !== 'cart' && (
          <div className="card mb-4 border-clay/60 bg-clay/10 text-sm text-clay">{error}</div>
        )}

        {step === 'intake' && (
          <div className="mx-auto max-w-2xl">
            <IntakeForm onSubmit={handlePlan} busy={busy} />
          </div>
        )}

        {step === 'plan' && destinations && itinerary && intake && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ItineraryView itinerary={itinerary} onBook={handleBook} busy={busy} />
            </div>
            <div className="space-y-4">
              <DestinationPanel
                destinations={destinations}
                currency={intake.budget.currency}
                activeId={activeId}
                onPlanAlternate={handlePlanAlternate}
                busy={busy}
              />
              <CostBreakdown breakdown={itinerary.breakdown} budgetTotal={intake.budget.total} />
              <RefineBar onRefine={handleRefine} busy={busy} />
            </div>
          </div>
        )}

        {step === 'cart' && cart && (
          <CartView
            cart={cart}
            onConfirm={handleConfirm}
            onBack={() => setStep('plan')}
            busy={busy}
            error={bookError}
          />
        )}

        {step === 'booked' && booking && <BookingResultView result={booking} onRestart={restart} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-haze">
        Flights are a real Duffel test-mode integration; stays, activities, and weather are mocked behind the
        same interfaces. Every run is sandbox — no real money moves.
      </footer>
    </div>
  );
}
