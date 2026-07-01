import type { ProviderMode, ProviderModes } from '@wayfinder/shared';

const STYLE: Record<ProviderMode, string> = {
  LIVE: 'border-pine text-pine',
  SANDBOX: 'border-sun text-sun',
  MOCK: 'border-haze text-haze',
};

export function ProviderBadge({ label, mode }: { label: string; mode: ProviderMode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${STYLE[mode]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}: {mode}
    </span>
  );
}

export function ProviderBadges({ modes }: { modes: ProviderModes }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProviderBadge label="agent" mode={modes.agent} />
      <ProviderBadge label="flights" mode={modes.flights} />
      <ProviderBadge label="stays" mode={modes.stays} />
      <ProviderBadge label="activities" mode={modes.activities} />
      <ProviderBadge label="weather" mode={modes.weather} />
    </div>
  );
}
