import app from './app';
import { PORT, providerModes } from './env';
import { TOTAL_STAY_COUNT } from './data/hotels';

app.listen(PORT, () => {
  const modes = providerModes();
  console.log(`\n  Wayfinder server → http://localhost:${PORT}`);
  console.log(`  Providers: agent=${modes.agent} flights=${modes.flights} stays=${modes.stays} activities=${modes.activities} weather=${modes.weather}`);
  console.log(`  Mock lodging inventory: ${TOTAL_STAY_COUNT} properties`);
  if (modes.agent === 'MOCK') console.log('  (set ANTHROPIC_API_KEY to enable the Claude planner)');
  if (modes.flights === 'MOCK') console.log('  (set DUFFEL_TEST_TOKEN to enable real Duffel test-mode flights)\n');
});
