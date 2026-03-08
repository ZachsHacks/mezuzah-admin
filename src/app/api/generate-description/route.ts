import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, tagline, categories, imageUrl, field } = await req.json();

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

    const content: Array<{ type: string; source?: { type: string; url?: string }; text?: string }> = [];

    if (imageUrl) {
      content.push({
        type: 'image',
        source: { type: 'url', url: imageUrl },
      });
    }

    // Field-specific prompts
    const noMarkdown = 'CRITICAL: Return ONLY plain text. Do NOT use any markdown formatting — no #, *, **, _, `, or headings. Do NOT repeat the product name at the start.';
    const fieldPrompts: Record<string, string> = {
      name: `Generate a product name that is EXACTLY 2-3 words. No more than 3 words. Examples: "Golden Sunrise", "The Garden Rose", "Sapphire Dreams", "Ocean Whisper". Creative, boutique feel. ${noMarkdown} Return ONLY the name — nothing else.`,
      tagline: `Generate a tagline that is EXACTLY one short line, 4-7 words max. Examples: "Blooming at Your Door", "Where Earth Meets Sky", "Grace in Every Detail". Keep it poetic but concise. ${noMarkdown} Return ONLY the tagline — nothing else.`,
      description: `Write a product description in EXACTLY 2 short sentences. Keep it warm and heartfelt — like a small boutique, not a big retailer. Mention what makes this piece visually special and its spiritual significance. Be concise — no filler words, no long-winded prose. ${noMarkdown}`,
    };

    const preamble = `You are writing product copy for "Made in Heaven Mezuzahs" — a collection of handcrafted, artistic mezuzah cases by Sorah Weiss. Each piece is unique and made with love.

${known ? `Here is what we know so far:\n${known}` : 'No details provided yet — use the image to guide you.'}

${imageUrl ? 'Use the image above to describe the visual details — colors, textures, patterns, materials you can see.' : 'Since no image is available, create something inspired and beautiful.'}`;

    if (field && fieldPrompts[field]) {
      // Generate a single field
      content.push({ type: 'text', text: `${preamble}\n\n${fieldPrompts[field]}` });
    } else {
      // Generate all missing fields as JSON (legacy/fallback)
      const needName = !name;
      const needTagline = !tagline;
      content.push({
        type: 'text',
        text: `${preamble}\n\nGenerate the following as a JSON object:\n${needName ? '- "name": Product name, EXACTLY 2-3 words. E.g. "Golden Sunrise", "Sapphire Dreams".\n' : ''}${needTagline ? '- "tagline": One short poetic line, 4-7 words max. E.g. "Grace in Every Detail".\n' : ''}- "description": EXACTLY 2 short sentences. Warm, boutique tone. No filler.\n\nReturn ONLY valid JSON with the requested fields, no markdown or extra text.`,
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: field === 'description' ? 150 : 50,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text?.trim() || '';

    // Strip any markdown formatting the model might include
    function stripMarkdown(text: string): string {
      return text
        .replace(/^#{1,6}\s+/gm, '')  // headings
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')  // bold/italic
        .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')  // underline bold/italic
        .replace(/`([^`]+)`/g, '$1')  // inline code
        .replace(/^\s*\n/gm, ' ')  // collapse blank lines
        .replace(/\s{2,}/g, ' ')  // collapse multiple spaces
        .trim();
    }

    if (field && fieldPrompts[field]) {
      return NextResponse.json({ [field]: stripMarkdown(raw) });
    }

    // Multi-field JSON response
    const cleaned = raw.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
    const result = JSON.parse(cleaned);
    return NextResponse.json({
      name: stripMarkdown(result.name || ''),
      tagline: stripMarkdown(result.tagline || ''),
      description: stripMarkdown(result.description || ''),
    });
  } catch (err) {
    console.error('Generate description error:', err);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
