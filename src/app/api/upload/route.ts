import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin, BUCKET, getPublicUrl } from '@/lib/supabase';
import { randomUUID } from 'crypto';

// POST /api/upload — two modes:
// 1. { action: "sign", filename, contentType } → returns a signed upload URL
// 2. { action: "signed-url-complete", path } → returns the public URL (confirmation step)

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get('admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabaseAdmin();

  if (body.action === 'sign') {
    const { filename, contentType } = body as { filename: string; contentType: string };
    const ext = filename.split('.').pop() || 'bin';
    const path = `${randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: getPublicUrl(path),
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
