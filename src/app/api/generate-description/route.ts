import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, tagline, categories, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured — add ANTHROPIC_API_KEY to env' }, { status: 500 });
    }

    const sizeCategory = (categories || []).find((c: string) => c.includes('″') || c.toLowerCase().includes('small') || c.toLowerCase().includes('medium') || c.toLowerCase().includes('large'));
    const hasGoldLeaf = (categories || []).some((c: string) => c.toLowerCase().includes('gold'));

    const details = [
      `Name: "${name}"`,
      tagline ? `Tagline: "${tagline}"` : '',
      sizeCategory ? `Size: ${sizeCategory}` : '',
      hasGoldLeaf ? 'Features gold leaf accents' : '',
    ].filter(Boolean).join('\n');

    // Build the message content — include image if available
    const content: Array<{ type: string; source?: { type: string; media_type?: string; url?: string }; text?: string }> = [];

    if (imageUrl) {
      content.push({
        type: 'image',
        source: {
          type: 'url',
          url: imageUrl,
        },
      });
    }

    content.push({
      type: 'text',
      text: `You are writing product descriptions for "Made in Heaven Mezuzahs" — a collection of handcrafted, artistic mezuzah cases. Each piece is unique and made with love.

Write a warm, poetic, and elegant product description (2-3 sentences) for this mezuzah case. The tone should feel artisan and heartfelt — like a small boutique, not a big retailer. Focus on the beauty, craftsmanship, and the spiritual significance of the mezuzah.

${details}

${imageUrl ? 'Use the image above to describe the visual details — colors, textures, patterns, materials you can see.' : 'Since no image is available, focus on the name and tagline for inspiration.'}

Return ONLY the description text, no quotes or labels.`,
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const description = data.content?.[0]?.text?.trim() || '';

    return NextResponse.json({ description });
  } catch (err) {
    console.error('Generate description error:', err);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
