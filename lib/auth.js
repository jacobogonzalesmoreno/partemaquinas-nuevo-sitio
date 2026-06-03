import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSecurityEnv } from '@/lib/env';

const ROLE_ORDER = ['reader', 'editor', 'admin'];
const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function roleMeets(role, minRole) {
  const roleIndex = ROLE_ORDER.indexOf(role);
  const minIndex = ROLE_ORDER.indexOf(minRole);
  if (roleIndex === -1 || minIndex === -1) return false;
  return roleIndex >= minIndex;
}

function extractToken(request) {
  const header = request.headers.get('authorization') || request.headers.get('x-api-key') || '';
  if (!header) return '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return header.trim();
}

function resolveRoleFromToken(token) {
  const { ADMIN_API_KEY, EDITOR_API_KEY, READER_API_KEY } = getSecurityEnv();
  if (ADMIN_API_KEY && token === ADMIN_API_KEY) return 'admin';
  if (EDITOR_API_KEY && token === EDITOR_API_KEY) return 'editor';
  if (READER_API_KEY && token === READER_API_KEY) return 'reader';
  return null;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf-8');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function createSessionCookie(role) {
  const { SESSION_SECRET } = getSecurityEnv();
  const payload = {
    role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadEncoded = base64UrlEncode(payloadJson);
  const signature = sign(payloadEncoded, SESSION_SECRET);
  return `${payloadEncoded}.${signature}`;
}

export function parseSessionCookie(value) {
  if (!value) return null;
  const { SESSION_SECRET } = getSecurityEnv();
  const [payloadEncoded, signature] = value.split('.');
  if (!payloadEncoded || !signature) return null;
  const expected = sign(payloadEncoded, SESSION_SECRET);
  if (!timingSafeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (!payload?.role || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSession(request) {
  const cookieValue = request.cookies?.get(SESSION_COOKIE)?.value;
  return parseSessionCookie(cookieValue);
}

export function setSessionCookie(response, role) {
  const { NODE_ENV } = process.env;
  response.cookies.set(SESSION_COOKIE, createSessionCookie(role), {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function verifyAdminCredentials(username, password) {
  const { ADMIN_USER, ADMIN_PASSWORD } = getSecurityEnv();
  if (!ADMIN_USER || !ADMIN_PASSWORD) return false;
  return timingSafeEqual(String(username || ''), String(ADMIN_USER))
    && timingSafeEqual(String(password || ''), String(ADMIN_PASSWORD));
}

export function requireRole(request, minRole) {
  const session = getSession(request);
  const sessionRole = session?.role || null;
  const token = extractToken(request);
  const tokenRole = token ? resolveRoleFromToken(token) : null;
  const role = sessionRole || tokenRole;

  if (!role) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autorizado.' }, { status: 401 }),
    };
  }

  if (!roleMeets(role, minRole)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 }),
    };
  }

  return { ok: true, role };
}
