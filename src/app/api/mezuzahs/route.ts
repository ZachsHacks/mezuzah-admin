import { NextRequest, NextResponse } from 'next/server';
import { getFile, putFile } from '@/lib/github';
import { parseMezuzahsFile, generateMezuzahsFile } from '@/lib/mezuzahs';
import { Mezuzah } from '@/types/mezuzah';

const FILE_PATH = 'data/mezuzahs.js';

export async function GET() {
  try {
    const file = await getFile(FILE_PATH);
    const content = Buffer.from(file.content, 'base64').toString('utf8');
    const mezuzahs = parseMezuzahsFile(content);
    return NextResponse.json({ mezuzahs, sha: file.sha });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as { mezuzahs: Mezuzah[] };

    // Fetch current SHA (required by GitHub for updates)
    const file = await getFile(FILE_PATH);

    const newContent = generateMezuzahsFile(body.mezuzahs);
    const encoded = Buffer.from(newContent, 'utf8').toString('base64');

    await putFile(
      FILE_PATH,
      encoded,
      file.sha,
      'Update mezuzah collection via admin panel'
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
