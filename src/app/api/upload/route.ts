import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { cookies } from 'next/headers';

// Client-upload token server — the actual file goes directly from the browser
// to Vercel Blob, so it never hits this function's payload limit.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get('admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
          'image/heic', 'image/heif',
          'video/mp4', 'video/quicktime', 'video/webm', 'video/ogg', 'video/x-m4v',
        ],
        maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB
      }),
      onUploadCompleted: async () => {
        // No post-processing needed
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
