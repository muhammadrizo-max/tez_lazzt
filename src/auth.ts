import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Token muddati: 12 soat
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export type Role = 'admin' | 'ofitsiant' | 'courier';

export interface TokenPayload {
  u: string; // username
  r: Role;   // role
  cid?: string; // courier id (faqat kuryer uchun)
  exp: number;
}

// Maxfiy kalit: SESSION_SECRET ustun turadi. Yo'q bo'lsa, ADMIN_PASSWORD + BOT_TOKEN dan olinadi.
// Vercelda har bir instance bir xil kalitga ega bo'lishi shart, shuning uchun random ishlatilmaydi.
function getSecret(): string {
  const s =
    process.env.SESSION_SECRET ||
    `${process.env.ADMIN_PASSWORD || ''}|${process.env.BOT_TOKEN || ''}|fallback`;
  if (!process.env.SESSION_SECRET) {
    console.warn('[auth] SESSION_SECRET o\'rnatilmagan. Production uchun Vercel env ga qo\'shing.');
  }
  return s;
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

export function signToken(data: Omit<TokenPayload, 'exp'>): string {
  const payload: TokenPayload = { ...data, exp: Date.now() + TOKEN_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', getSecret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = b64url(crypto.createHmac('sha256', getSecret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64').toString('utf-8')) as TokenPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function readPayload(req: Request): TokenPayload | null {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  return verifyToken(token);
}

// Faqat admin va ofitsiant (xodimlar)
export function requireStaff(req: Request, res: Response, next: NextFunction) {
  const p = readPayload(req);
  if (!p || (p.r !== 'admin' && p.r !== 'ofitsiant')) {
    return res.status(401).json({ error: 'Avval tizimga kiring!' });
  }
  (req as any).auth = p;
  next();
}

// Kuryer yoki xodim
export function requireCourierOrStaff(req: Request, res: Response, next: NextFunction) {
  const p = readPayload(req);
  if (!p) return res.status(401).json({ error: 'Avval tizimga kiring!' });
  (req as any).auth = p;
  next();
}
