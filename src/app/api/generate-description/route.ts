import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, tagline, categories, imageUrl } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured — add ANTHROPIC_API_KEY to env' }, { status: 500 });
    }

    const sizeCategory = (categories || []).find((c: string) => c.includes('\u2033') || c.toLowerCase().includes('small') || c.toLowerCase().includes('medium') || c.toLowerCase().includes('large'));
    const hasGoldLeaf = (categories || []).some((c: string) => c.toLowerCase().includes('gold'));

    const known = [
      name ? `Name: "${name}"` : '',
      tagline ? `Tagline: "${tagline}"` : '',
      sizeCategory ? `Size: ${sizeCategory}` : '',
      hasGoldLeaf ? 'Features gold leaf accents' : '',
    ].filter(Boolean).join('\n');

    // Determine which fields to generate
    const needName = !name;
    const needTagline = !tagline;

    const content: Array<{ type: string; source?: { type: string; url?: string }; text?: string }> = [];

    if (imageUrl) {
      content.push({
        type: 'image',
        source: { type: 'url', url: imageUrl },
      });
    }

    content.push({
      type: 'text',
      text: `You are writing product copy for "Made in Heaven Mezuzahs" — a collection of handcrafted, artistic mezuzah cases by Sorah Weiss. Each piece is unique and made with love.

${known ? `Here is what we know so far:\n${known}` : 'No details provided yet — use the image to guide you.'}

${imageUrl ? 'Use the image above to describe the visual details — colors, textures, patterns, materials you can see.' : 'Since no image is available, create something inspired and beautiful.'}

Generate the following as a JSON object:
${needName ? '- "name": A short, evocative product name (2-4 words, like "The Garden Rose" or "Sapphire Dreams"). Creative, boutique feel.' : ''}
${needTagline ? '- "tagline": A brief poetic tagline (4-8 words, like "Blooming at Your Door" or "Where Earth Meets Sky").' : ''}
- "description": A warm, poetic product description (2-3 sentences). Artisan and heartfelt tone — like a small boutique, not a big retailer. Focus on beauty, craftsmanship, and spiritual significance.

Return ONLY valid JSON with the requested fields, no markdown or extra text.`,
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
        max_tokens: 400,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text?.trim() || '{}';

    // Parse the JSON response, stripping markdown fences if present
    const cleaned = raw.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
    const result = JSON.parse(cleaned);

    return NextResponse.json({
      name: result.name || '',
      tagline: result.tagline || '',
      description: result.description || '',
    });
  } catch (err) {
    console.error('Generate description error:', err);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
