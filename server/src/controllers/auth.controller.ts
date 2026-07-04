import type { Context } from 'hono';
import { auth } from '../config/auth.js';

export const handleAuthRequest = async (c: Context) => {
  return auth.handler(c.req.raw);
};
