import { NextRequest, NextResponse } from 'next/server';
import { getFile, putFile, createFile } from '@/lib/github';
import { Mezuzah } from '@/types/mezuzah';
import { cookies } from 'next/headers';

const FILE_PATH = 'data/drafts.json';

export async function GET() {
  const cookieStore = await cookies();
  if (!cookieStore.get('admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const file = await getFile(FILE_PATH);
    const drafts: Mezuzah[] = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    return NextResponse.json({ drafts });
  } catch {
    // File doesn't exist yet — return empty list
    return NextResponse.json({ drafts: [] });
  }
}

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get('admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { drafts } = await req.json() as { drafts: Mezuzah[] };
    const content = Buffer.from(JSON.stringify(drafts, null, 2), 'utf8').toString('base64');

    // Try to update existing file; if not found, create it
    try {
      const existing = await getFile(FILE_PATH);
      await putFile(FILE_PATH, content, existing.sha, 'Update drafts');
    } catch {
      await createFile(FILE_PATH, content, 'Create drafts file');
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
