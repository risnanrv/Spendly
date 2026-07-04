import { Hono } from 'hono';
import { handleAuthRequest } from '../controllers/auth.controller.js';

const authRoutes = new Hono();

// Forward all authentication requests to the controller proxy
authRoutes.on(['POST', 'GET'], '/*', handleAuthRequest);

export default authRoutes;
