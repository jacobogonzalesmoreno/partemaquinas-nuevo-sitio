import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getSecurityEnv } from '@/lib/env';
import crypto from 'crypto';

const TYPES = new Map([
  ['image/jpeg', 'image'], ['image/png', 'image'], ['image/webp', 'image'], ['image/gif', 'image'],
  ['video/mp4', 'video'], ['video/webm', 'video'], ['application/pdf', 'raw'],
]);

export async function POST(request) {
  const auth = requireRole(request, 'editor');
  if (!auth.ok) return auth.response;
  try {
    const input = await request.json();
    const resourceType = TYPES.get(input.type);
    const size = Number(input.size);
    if (!resourceType || !Number.isFinite(size) || size <= 0) return NextResponse.json({ error: 'Formato de archivo no permitido.' }, { status: 415 });
    const { MAX_UPLOAD_MB } = getSecurityEnv();
    const maxBytes = (resourceType === 'video' ? Math.min(50, MAX_UPLOAD_MB * 5) : MAX_UPLOAD_MB) * 1024 * 1024;
    if (size > maxBytes) return NextResponse.json({ error: `El archivo supera el límite de ${Math.floor(maxBytes / 1024 / 1024)} MB.` }, { status: 413 });
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: 'El almacenamiento de archivos no está configurado.' }, { status: 503 });
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'partemaquinas/blog';
    const signature = crypto.createHash('sha256').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature, resourceType });
  } catch (error) {
    console.error('Blog media signature error:', error?.name || 'unknown');
    return NextResponse.json({ error: 'No se pudo preparar la subida.' }, { status: 500 });
  }
}
