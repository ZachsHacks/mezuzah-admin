import { SiteContent } from '@/types/site-content';

export function parseSiteContentFile(content: string): SiteContent {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Could not locate SITE_CONTENT object');
  const objContent = content.slice(start, end + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${objContent}`)() as SiteContent;
}

const FILE_HEADER = `// ┌─────────────────────────────────────────────────────────────────────────┐
// │  MADE IN HEAVEN MEZUZAHS — Site Content                                 │
// │                                                                         │
// │  Managed via the admin panel.                                           │
// │  Edit About and Contact page text here.                                 │
// └─────────────────────────────────────────────────────────────────────────┘

`;

export function generateSiteContentFile(content: SiteContent): string {
  const paragraphsJson = JSON.stringify(content.about.paragraphs, null, 4)
    .split('\n')
    .map((l, i) => (i === 0 ? l : '    ' + l))
    .join('\n');

  return `${FILE_HEADER}const SITE_CONTENT = {

  about: {
    quote: ${JSON.stringify(content.about.quote)},
    paragraphs: ${paragraphsJson}
  },

  contact: {
    intro: ${JSON.stringify(content.contact.intro)},
    phone: ${JSON.stringify(content.contact.phone)},
    phoneHref: ${JSON.stringify(content.contact.phoneHref)},
    subtext: ${JSON.stringify(content.contact.subtext)}
  }

};\n`;
}
