import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { api } from './routes/api';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api', api);

// Serve the built frontend in production (web/dist), if present.
// No-ops under Vercel, where the static build is served separately from the CDN.
const here = dirname(fileURLToPath(import.meta.url)); // server/src
const webDist = resolve(here, '../../web/dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => res.sendFile(resolve(webDist, 'index.html')));
}

export default app;
