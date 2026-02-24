import { NextRequest, NextResponse } from 'next/server';
import { getFile, putFile } from '@/lib/github';
import { parseSiteContentFile, generateSiteContentFile } from '@/lib/site-content';
import { sendSubmittedEmail } from '@/lib/email';
import { SiteContent } from '@/types/site-content';

const FILE_PATH = 'data/site-content.js';

export async function GET() {
  try {
    const file = await getFile(FILE_PATH);
    const content = Buffer.from(file.content, 'base64').toString('utf8');
    const siteContent = parseSiteContentFile(content);
    return NextResponse.json({ siteContent, sha: file.sha });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as { siteContent: SiteContent; page: string };

    const file = await getFile(FILE_PATH);
    const newContent = generateSiteContentFile(body.siteContent);
    const encoded = Buffer.from(newContent, 'utf8').toString('base64');

    await putFile(
      FILE_PATH,
      encoded,
      file.sha,
      `Update ${body.page} page content via admin panel`
    );

    sendSubmittedEmail(`Updated ${body.page} page`).catch((e) =>
      console.warn('Email send failed:', e)
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
