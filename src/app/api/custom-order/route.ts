import { NextRequest, NextResponse } from 'next/server';
import { sendCustomOrderEmail } from '@/lib/email';

const ALLOWED_ORIGINS = [
  'https://www.madeinheavenmezuzahs.com',
  'https://madeinheavenmezuzahs.com',
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');

  try {
    const body = await req.json() as {
      name?: string;
      contact?: string;
      description?: string;
      size?: string;
      details?: string;
    };

    const { name, contact, description, size, details } = body;

    if (!name?.trim() || !contact?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Name, contact, and description are required.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Fire-and-forget — email failures should not block the success response
    sendCustomOrderEmail({ name: name.trim(), contact: contact.trim(), description: description.trim(), size, details })
      .catch((e) => console.error('Custom order email failed:', e));

    return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500, headers: corsHeaders(origin) });
  }
}
