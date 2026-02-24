import { NextRequest, NextResponse } from 'next/server';
import { getFile, putFile, createFile } from '@/lib/github';

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '')
    .replace(/-+/g, '-');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Sanitize filename with a timestamp prefix to avoid collisions
    const ext = file.name.split('.').pop() || 'jpg';
    const base = file.name.replace(/\.[^.]+$/, '');
    const safeName = sanitizeFilename(base);
    const filename = `${safeName}-${Date.now()}.${ext}`;
    const repoPath = `images/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const encoded = buffer.toString('base64');

    // Try to update if it exists, otherwise create
    let sha: string | undefined;
    try {
      const existing = await getFile(repoPath);
      sha = existing.sha;
    } catch {
      // File doesn't exist yet — create it
    }

    if (sha) {
      await putFile(repoPath, encoded, sha, `Upload image: ${filename}`);
    } else {
      await createFile(repoPath, encoded, `Upload image: ${filename}`);
    }

    return NextResponse.json({ path: `images/${filename}` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

