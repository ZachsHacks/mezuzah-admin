import { Mezuzah } from '@/types/mezuzah';

// The file in the repo uses Unicode ″ (U+2033) for inch marks.
// JS template literals and object syntax — we parse server-side with Function().
export function parseMezuzahsFile(content: string): Mezuzah[] {
  const arrayStart = content.indexOf('[');
  const arrayEnd = content.lastIndexOf(']');
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error('Could not locate MEZUZAHS array in file');
  }
  const arrayContent = content.slice(arrayStart, arrayEnd + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${arrayContent}`)() as Mezuzah[];
}

const FILE_HEADER = `// ┌─────────────────────────────────────────────────────────────────────────┐
// │  MADE IN HEAVEN MEZUZAHS — Collection Data                              │
// │                                                                         │
// │  Managed via the admin panel.                                           │
// │                                                                         │
// │  CATEGORIES — mix and match any of:                                     │
// │    "Small (4″)"  "Medium (4-6″)"  "Large (7-8″)"  "Extra Large (10-12″)" │
// │    "With Gold Leaf"  "New Arrival"                                      │
// └─────────────────────────────────────────────────────────────────────────┘

`;

export function generateMezuzahsFile(mezuzahs: Mezuzah[]): string {
  const entries = mezuzahs
    .map((m) => {
      const desc = m.description
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
      const cats = JSON.stringify(m.categories);
      return `  {
    image:      ${JSON.stringify(m.image)},
    name:       ${JSON.stringify(m.name)},
    tagline:    ${JSON.stringify(m.tagline)},
    price:      ${m.price},
    categories: ${cats},
    description: \`${desc}\`,
  }`;
    })
    .join(',\n\n');

  return `${FILE_HEADER}const MEZUZAHS = [\n\n${entries},\n\n];\n`;
}
