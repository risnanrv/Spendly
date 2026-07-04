import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { onErrorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import syncRoutes from './routes/sync.routes.js';
import { logger } from './utils/logger.js';
import 'dotenv/config';

const app = new Hono();

// Global Middlewares
app.use('*', honoLogger());
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PATCH', 'DELETE'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  })
);

// Global Error Handler
app.onError(onErrorHandler);

// Base Status Route
app.get('/', (c) => c.text('Spendly Auth API Server — Active'));

// Restructured routes mapping
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/sync', syncRoutes);

// Port setup
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

logger.info(`Starting Spendly Auth Server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});
