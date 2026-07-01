// Best-effort origin → IATA guess. Used to label the intended route and to seed
// the flight search origin (Duffel test mode ignores it and uses its sandbox
// route; the mock uses it cosmetically).
const CITY_IATA: Record<string, string> = {
  london: 'LHR', 'new york': 'JFK', nyc: 'JFK', 'los angeles': 'LAX',
  'san francisco': 'SFO', chicago: 'ORD', boston: 'BOS', toronto: 'YYZ',
  vancouver: 'YVR', paris: 'CDG', berlin: 'BER', madrid: 'MAD',
  amsterdam: 'AMS', dublin: 'DUB', dubai: 'DXB', singapore: 'SIN',
  'hong kong': 'HKG', tokyo: 'HND', sydney: 'SYD', melbourne: 'MEL',
};

export function guessOriginIata(home: string): string {
  const raw = home.trim();
  if (/^[A-Za-z]{3}$/.test(raw)) return raw.toUpperCase();
  const key = raw.toLowerCase();
  if (CITY_IATA[key]) return CITY_IATA[key];
  for (const [name, iata] of Object.entries(CITY_IATA)) {
    if (key.includes(name)) return iata;
  }
  return 'LHR';
}
