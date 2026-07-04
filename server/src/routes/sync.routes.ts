import { Hono } from 'hono';
import { handlePush, handlePull } from '../controllers/sync.controller.js';

const syncRoutes = new Hono();

syncRoutes.post('/push', handlePush);
syncRoutes.post('/pull', handlePull);

export default syncRoutes;
