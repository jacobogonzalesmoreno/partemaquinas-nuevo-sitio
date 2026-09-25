import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getSecurityEnv } from '@/lib/env';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const auth = requireRole(request, 'editor');
    if (!auth.ok) return auth.response;

    const declaredLength = Number(request.headers.get('content-length') || 0);
    const { MAX_UPLOAD_MB, ALLOWED_UPLOAD_TYPES } = getSecurityEnv();
    const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
    if (declaredLength > maxBytes + 64 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande.' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Archivo invalido.' }, { status: 400 });
    }

    const safeImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
    const allowedTypes = ALLOWED_UPLOAD_TYPES
      .split(',')
      .map(item => item.trim())
      .filter(item => safeImageTypes.has(item));

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido.' }, { status: 415 });
    }

    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Archivo demasiado grande.' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isGif = buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
    const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    const signatureMatches = (file.type === 'image/png' && isPng) || (file.type === 'image/jpeg' && isJpeg) || (file.type === 'image/gif' && isGif) || (file.type === 'image/webp' && isWebp);
    if (!signatureMatches) return NextResponse.json({ error: 'El contenido no coincide con el tipo de imagen.' }, { status: 415 });
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    const dataUri = `data:${mimeType};base64,${base64}`;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'El servicio de imágenes no está configurado.' }, { status: 503 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'partemaquinas';

    // Firma la peticion
    const signString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash('sha256')
      .update(signString)
      .digest('hex');

    const uploadFormData = new FormData();
    uploadFormData.append('file', dataUri);
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('signature', signature);
    uploadFormData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: uploadFormData, signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'El servicio de imágenes rechazó el archivo.' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ url: data.secure_url });

  } catch (error) {
    console.error('Upload error:', error?.name || 'unknown');
    return NextResponse.json({ error: 'No se pudo subir el archivo.' }, { status: 500 });
  }
}
