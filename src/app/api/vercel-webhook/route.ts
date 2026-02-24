import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { sendLiveEmail } from '@/lib/email';

// Vercel signs webhook payloads with HMAC-SHA1 using your webhook secret.
// Set VERCEL_WEBHOOK_SECRET in env vars after creating the webhook in Vercel.
function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha1', secret).update(body).digest('hex');
  return `sha1=${expected}` === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.VERCEL_WEBHOOK_SECRET;
    const signature = req.headers.get('x-vercel-signature') ?? '';

    // Verify signature if secret is configured
    if (secret && !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Only act on successful deployments of the main site
    if (
      payload.type === 'deployment.succeeded' &&
      payload.payload?.project?.name === 'made-in-heaven-mezuzahs'
    ) {
      await sendLiveEmail();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Vercel webhook error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
