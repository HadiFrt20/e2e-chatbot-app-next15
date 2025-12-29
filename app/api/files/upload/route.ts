import type { NextRequest } from 'next/server';
import { Buffer } from 'node:buffer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const contentType = file.type || 'application/octet-stream';
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const url = `data:${contentType};base64,${base64}`;

  return Response.json({
    url,
    pathname: file.name,
    contentType,
  });
}
