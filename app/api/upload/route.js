import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getSecurityEnv } from '@/lib/env';


export async function POST(request) {
  try {
    const auth = requireRole(request, 'editor');
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Archivo invalido.' }, { status: 400 });
    }

    const { MAX_UPLOAD_MB, ALLOWED_UPLOAD_TYPES } = getSecurityEnv();
    const allowedTypes = ALLOWED_UPLOAD_TYPES
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido.' }, { status: 415 });
    }

    const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Archivo demasiado grande.' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    const dataUri = `data:${mimeType};base64,${base64}`;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'partemaquinas';

    // Firma la peticion
    const crypto = await import('crypto');
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
      { method: 'POST', body: uploadFormData }
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || 'Error Cloudinary' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ url: data.secure_url });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'No se pudo subir el archivo.' }, { status: 500 });
  }
}