import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { PORT, providerModes } from './env';
import { api } from './routes/api';
import { TOTAL_STAY_COUNT } from './data/hotels';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api', api);

// Serve the built frontend in production (web/dist), if present.
const here = dirname(fileURLToPath(import.meta.url)); // server/src
const webDist = resolve(here, '../../web/dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => res.sendFile(resolve(webDist, 'index.html')));
}

app.listen(PORT, () => {
  const modes = providerModes();
  console.log(`\n  Wayfinder server → http://localhost:${PORT}`);
  console.log(`  Providers: agent=${modes.agent} flights=${modes.flights} stays=${modes.stays} activities=${modes.activities} weather=${modes.weather}`);
  console.log(`  Mock lodging inventory: ${TOTAL_STAY_COUNT} properties`);
  if (modes.agent === 'MOCK') console.log('  (set ANTHROPIC_API_KEY to enable the Claude planner)');
  if (modes.flights === 'MOCK') console.log('  (set DUFFEL_TEST_TOKEN to enable real Duffel test-mode flights)\n');
});
