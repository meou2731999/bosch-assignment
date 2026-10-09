import express from 'express';
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { USERS, type RequestRecord } from '../shared/model';
import { ApiError, canRead, saveRequest } from './service';
import { seedRequests } from './seed';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, '.data', 'requests.json');
mkdirSync(path.dirname(file), { recursive: true });
let records: RequestRecord[];
try { records = JSON.parse(readFileSync(file, 'utf8')); }
catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  records = seedRequests();
}
function persist(next: RequestRecord[]) {
  writeFileSync(`${file}.tmp`, JSON.stringify(next, null, 2));
  renameSync(`${file}.tmp`, file);
  records = next;
}
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '128kb' }));
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.get('/api/health', (_req, res) => res.json({ status: 'ok', authentication: 'demo-only' }));
app.use('/api', (req, res, next) => {
  const user = USERS.find(u => u.id === req.header('x-demo-user'));
  if (!user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Select a demo user.'));
  res.locals.user = user;
  next();
});
app.get('/api/forms/request', (_req, res, next) => {
  try {
    const config = JSON.parse(readFileSync(path.join(root, 'forms', 'active.json'), 'utf8'));
    res.json(loadDefinition(config.version));
  } catch (error) { next(error); }
});
app.get('/api/forms/request/versions/:version', (req, res, next) => {
  try { res.json(loadDefinition(Number(req.params.version))); } catch (error) { next(error); }
});
function loadDefinition(version: number) {
  if (![1, 2].includes(version)) throw new ApiError(404, 'NOT_FOUND', 'Form version not found.');
  const definition = JSON.parse(readFileSync(path.join(root, 'forms', `request.v${version}.json`), 'utf8'));
  // These are trusted author-managed fixtures, not a public schema ingestion endpoint.
  z.object({ components: z.array(z.record(z.string(), z.unknown())) }).parse(definition);
  return { version, definition };
}
app.get('/api/requests', (_req, res) => {
  res.json(records.filter(r => canRead(res.locals.user, r)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
});
app.get('/api/requests/:id', (req, res, next) => {
  const record = records.find(r => r.id === req.params.id);
  if (!record || !canRead(res.locals.user, record)) return next(new ApiError(404, 'NOT_FOUND', 'Request not found.'));
  res.json(record);
});
app.put('/api/requests/:id', (req, res, next) => {
  try {
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(req.params.id)) throw new ApiError(400, 'INVALID', 'Invalid request ID.');
    if (req.header('x-demo-failure') === 'true') throw new ApiError(503, 'UNAVAILABLE', 'The demo API is temporarily unavailable. Your form has not been saved.');
    const previous = records.find(r => r.id === req.params.id);
    const record = saveRequest(res.locals.user, previous, req.body, req.params.id, new Date().toISOString());
    persist([...records.filter(r => r.id !== record.id), record]);
    res.status(previous ? 200 : 201).json(record);
  } catch (error) { next(error); }
});
app.use('/api', (_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'API endpoint not found.')));
if (process.argv.includes('--production')) {
  app.use(express.static(path.join(root, 'dist')));
  app.get('/', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
}
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({ code: error.code, message: error.message, fields: error.fields });
  } else if (error instanceof SyntaxError) {
    res.status(400).json({ code: 'INVALID', message: 'The request contains invalid JSON.' });
  } else {
    console.error('API operation failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ code: 'INTERNAL', message: 'Unable to complete this operation. Please retry.' });
  }
});
const port = Number(process.env.PORT ?? 3001);
app.listen(port, '127.0.0.1', () => console.log(`Demo API: http://127.0.0.1:${port} (mock identity; local use only)`));
