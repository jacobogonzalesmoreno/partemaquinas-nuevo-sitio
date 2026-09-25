import { NextResponse } from 'next/server';
import { z } from 'zod';
import { setSessionCookie, verifyAdminCredentials } from '@/lib/auth';

const loginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(256),
});

export async function POST(request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 8 * 1024) {
    return NextResponse.json({ error: 'Solicitud demasiado grande.' }, { status: 413 });
  }
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Credenciales invalidas.' }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const ok = verifyAdminCredentials(username, password);
  if (!ok) {
    return NextResponse.json({ error: 'Usuario o clave incorrectos.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, 'admin');
  return response;
}
