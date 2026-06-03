import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
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
    const originalName = file.name || 'upload';
    const ext = path.extname(originalName);
    const baseName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .slice(0, 60) || 'archivo';
    const fileName = `${Date.now()}-${randomUUID()}-${baseName}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, fileName), buffer);

    return NextResponse.json({ url: `/uploads/${fileName}` });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo subir el archivo.' }, { status: 500 });
  }
}
