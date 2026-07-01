import type { Activity } from '@wayfinder/shared';

// Per-destination points of interest. Costs are stored in USD (base currency);
// the cost model converts to the traveler's chosen currency. `intensity` lets
// the itinerary builder pace days realistically (no full-day hike next to a
// museum crawl).
type Seed = Omit<Activity, 'id' | 'currency'>;

const SEEDS: Record<string, Seed[]> = {
  lisbon: [
    { name: 'Alfama walking & fado tour', category: 'culture', durationHours: 3, cost: 45, area: 'Alfama', intensity: 'low' },
    { name: 'Time Out Market food crawl', category: 'food', durationHours: 2, cost: 40, area: 'Cais do Sodré', intensity: 'low' },
    { name: 'Belém: Jerónimos & pastéis', category: 'culture', durationHours: 3, cost: 25, area: 'Belém', intensity: 'low' },
    { name: 'Sintra palaces day trip', category: 'sightseeing', durationHours: 6, cost: 70, area: 'Sintra', intensity: 'medium' },
    { name: 'Cascais coast & beach', category: 'beach', durationHours: 5, cost: 30, area: 'Cascais', intensity: 'low' },
    { name: 'Bairro Alto bar hop', category: 'nightlife', durationHours: 3, cost: 50, area: 'Bairro Alto', intensity: 'medium' },
  ],
  kyoto: [
    { name: 'Fushimi Inari torii hike', category: 'sightseeing', durationHours: 3, cost: 0, area: 'Fushimi', intensity: 'medium' },
    { name: 'Arashiyama bamboo & monkey park', category: 'sightseeing', durationHours: 4, cost: 15, area: 'Arashiyama', intensity: 'medium' },
    { name: 'Kaiseki dinner', category: 'food', durationHours: 2, cost: 90, area: 'Gion', intensity: 'low' },
    { name: 'Nishiki Market tasting walk', category: 'food', durationHours: 2, cost: 35, area: 'Downtown', intensity: 'low' },
    { name: 'Kinkaku-ji & Ryoan-ji temples', category: 'culture', durationHours: 4, cost: 20, area: 'Northwest', intensity: 'low' },
    { name: 'Tea ceremony & kimono', category: 'culture', durationHours: 2, cost: 55, area: 'Higashiyama', intensity: 'low' },
  ],
  reykjavik: [
    { name: 'Golden Circle geysers & falls', category: 'sightseeing', durationHours: 8, cost: 95, area: 'South-west', intensity: 'medium' },
    { name: 'Blue Lagoon geothermal soak', category: 'relaxation', durationHours: 3, cost: 80, area: 'Grindavík', intensity: 'low' },
    { name: 'South Coast waterfalls & black sand', category: 'sightseeing', durationHours: 9, cost: 120, area: 'South Coast', intensity: 'medium' },
    { name: 'Northern lights hunt', category: 'sightseeing', durationHours: 4, cost: 75, area: 'Countryside', intensity: 'low' },
    { name: 'Glacier hike on Sólheimajökull', category: 'adventure', durationHours: 6, cost: 140, area: 'South Coast', intensity: 'high' },
    { name: 'Reykjavik harbour & food walk', category: 'food', durationHours: 3, cost: 55, area: 'Old Harbour', intensity: 'low' },
  ],
  barcelona: [
    { name: 'Sagrada Família & Gaudí walk', category: 'culture', durationHours: 3, cost: 40, area: 'Eixample', intensity: 'low' },
    { name: 'Gothic Quarter tapas crawl', category: 'food', durationHours: 3, cost: 55, area: 'Barri Gòtic', intensity: 'low' },
    { name: 'Park Güell & Gràcia', category: 'sightseeing', durationHours: 3, cost: 25, area: 'Gràcia', intensity: 'medium' },
    { name: 'Barceloneta beach afternoon', category: 'beach', durationHours: 4, cost: 20, area: 'Barceloneta', intensity: 'low' },
    { name: 'Montjuïc & Magic Fountain', category: 'sightseeing', durationHours: 4, cost: 20, area: 'Montjuïc', intensity: 'medium' },
    { name: 'El Born wine & vermouth bars', category: 'nightlife', durationHours: 3, cost: 45, area: 'El Born', intensity: 'medium' },
  ],
  queenstown: [
    { name: 'Ben Lomond alpine day hike', category: 'adventure', durationHours: 7, cost: 0, area: 'Queenstown Hill', intensity: 'high' },
    { name: 'Milford Sound cruise day trip', category: 'sightseeing', durationHours: 12, cost: 160, area: 'Fiordland', intensity: 'medium' },
    { name: 'Shotover jet & canyon', category: 'adventure', durationHours: 3, cost: 110, area: 'Shotover River', intensity: 'high' },
    { name: 'Gibbston Valley wine tour', category: 'food', durationHours: 5, cost: 95, area: 'Gibbston', intensity: 'low' },
    { name: 'Lake Wakatipu kayak', category: 'adventure', durationHours: 4, cost: 85, area: 'Lakefront', intensity: 'medium' },
    { name: 'Skyline gondola & luge', category: 'sightseeing', durationHours: 3, cost: 55, area: 'Bob’s Peak', intensity: 'low' },
  ],
  marrakech: [
    { name: 'Jemaa el-Fnaa & souks by night', category: 'culture', durationHours: 3, cost: 20, area: 'Medina', intensity: 'medium' },
    { name: 'Bahia Palace & Saadian Tombs', category: 'culture', durationHours: 3, cost: 25, area: 'Medina', intensity: 'low' },
    { name: 'Atlas Mountains & Berber villages', category: 'adventure', durationHours: 8, cost: 75, area: 'High Atlas', intensity: 'medium' },
    { name: 'Cooking class & Majorelle Garden', category: 'food', durationHours: 5, cost: 65, area: 'Gueliz', intensity: 'low' },
    { name: 'Hammam & riad afternoon', category: 'relaxation', durationHours: 2, cost: 45, area: 'Medina', intensity: 'low' },
    { name: 'Agafay desert sunset dinner', category: 'sightseeing', durationHours: 6, cost: 90, area: 'Agafay', intensity: 'low' },
  ],
  'mexico-city': [
    { name: 'Centro Histórico & Templo Mayor', category: 'culture', durationHours: 4, cost: 20, area: 'Centro', intensity: 'medium' },
    { name: 'Teotihuacán pyramids day trip', category: 'sightseeing', durationHours: 7, cost: 70, area: 'Teotihuacán', intensity: 'medium' },
    { name: 'Roma / Condesa taco & mezcal crawl', category: 'food', durationHours: 4, cost: 55, area: 'Roma Norte', intensity: 'low' },
    { name: 'Frida Kahlo Museum & Coyoacán', category: 'culture', durationHours: 4, cost: 30, area: 'Coyoacán', intensity: 'low' },
    { name: 'Xochimilco trajinera boats', category: 'sightseeing', durationHours: 4, cost: 40, area: 'Xochimilco', intensity: 'low' },
    { name: 'Lucha libre night', category: 'nightlife', durationHours: 3, cost: 35, area: 'Doctores', intensity: 'medium' },
  ],
  bali: [
    { name: 'Tegallalang rice terraces & swing', category: 'sightseeing', durationHours: 4, cost: 40, area: 'Ubud', intensity: 'low' },
    { name: 'Mount Batur sunrise trek', category: 'adventure', durationHours: 7, cost: 65, area: 'Kintamani', intensity: 'high' },
    { name: 'Uluwatu temple & kecak dance', category: 'culture', durationHours: 4, cost: 30, area: 'Uluwatu', intensity: 'low' },
    { name: 'Seminyak beach club day', category: 'beach', durationHours: 5, cost: 50, area: 'Seminyak', intensity: 'low' },
    { name: 'Ubud yoga & Balinese cooking', category: 'relaxation', durationHours: 4, cost: 45, area: 'Ubud', intensity: 'low' },
    { name: 'Nusa Penida island snorkel trip', category: 'adventure', durationHours: 10, cost: 90, area: 'Nusa Penida', intensity: 'medium' },
  ],
  'cape-town': [
    { name: 'Table Mountain cable car & trails', category: 'adventure', durationHours: 4, cost: 40, area: 'Table Mountain', intensity: 'medium' },
    { name: 'Cape Peninsula & Boulders penguins', category: 'sightseeing', durationHours: 8, cost: 85, area: 'Cape Point', intensity: 'medium' },
    { name: 'Stellenbosch winelands tasting', category: 'food', durationHours: 6, cost: 90, area: 'Stellenbosch', intensity: 'low' },
    { name: 'V&A Waterfront & harbour', category: 'food', durationHours: 3, cost: 45, area: 'V&A Waterfront', intensity: 'low' },
    { name: 'Camps Bay beach & sundowners', category: 'beach', durationHours: 4, cost: 35, area: 'Camps Bay', intensity: 'low' },
    { name: 'Lion’s Head sunrise hike', category: 'adventure', durationHours: 3, cost: 0, area: 'Signal Hill', intensity: 'high' },
  ],
  vienna: [
    { name: 'Schönbrunn Palace & gardens', category: 'culture', durationHours: 4, cost: 35, area: 'Hietzing', intensity: 'low' },
    { name: 'Ringstrasse & Hofburg walk', category: 'culture', durationHours: 3, cost: 20, area: 'Innere Stadt', intensity: 'low' },
    { name: 'Coffee house & Sachertorte', category: 'food', durationHours: 2, cost: 25, area: 'Innere Stadt', intensity: 'low' },
    { name: 'Belvedere & Klimt', category: 'culture', durationHours: 3, cost: 30, area: 'Landstrasse', intensity: 'low' },
    { name: 'Naschmarkt food stroll', category: 'food', durationHours: 2, cost: 35, area: 'Wieden', intensity: 'low' },
    { name: 'Prater park & giant wheel', category: 'family', durationHours: 3, cost: 30, area: 'Leopoldstadt', intensity: 'low' },
  ],
  'costa-rica': [
    { name: 'Arenal volcano & hot springs', category: 'adventure', durationHours: 8, cost: 95, area: 'La Fortuna', intensity: 'medium' },
    { name: 'Monteverde cloud forest & zipline', category: 'adventure', durationHours: 6, cost: 85, area: 'Monteverde', intensity: 'high' },
    { name: 'Manuel Antonio beach & wildlife', category: 'beach', durationHours: 6, cost: 55, area: 'Manuel Antonio', intensity: 'low' },
    { name: 'Whitewater rafting Pacuare', category: 'adventure', durationHours: 8, cost: 110, area: 'Turrialba', intensity: 'high' },
    { name: 'Coffee plantation tour', category: 'food', durationHours: 4, cost: 45, area: 'Central Valley', intensity: 'low' },
    { name: 'Sloth sanctuary & river float', category: 'family', durationHours: 5, cost: 60, area: 'Sarapiquí', intensity: 'low' },
  ],
  split: [
    { name: 'Diocletian’s Palace old town walk', category: 'culture', durationHours: 3, cost: 25, area: 'Old Town', intensity: 'low' },
    { name: 'Hvar island ferry day trip', category: 'beach', durationHours: 9, cost: 70, area: 'Hvar', intensity: 'low' },
    { name: 'Krka waterfalls & swim', category: 'sightseeing', durationHours: 7, cost: 75, area: 'Krka NP', intensity: 'medium' },
    { name: 'Marjan hill hike & beaches', category: 'adventure', durationHours: 3, cost: 0, area: 'Marjan', intensity: 'medium' },
    { name: 'Konoba dinner & Dalmatian wine', category: 'food', durationHours: 2, cost: 45, area: 'Old Town', intensity: 'low' },
    { name: 'Blue Cave & islands speedboat', category: 'adventure', durationHours: 8, cost: 120, area: 'Vis & Biševo', intensity: 'medium' },
  ],
};

export function getActivities(destinationId: string): Activity[] {
  const seeds = SEEDS[destinationId] ?? [];
  return seeds.map((s, i) => ({
    ...s,
    id: `${destinationId}-act-${i + 1}`,
    currency: 'USD',
  }));
}
