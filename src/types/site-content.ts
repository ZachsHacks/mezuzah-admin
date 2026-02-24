export interface SiteContent {
  about: {
    quote: string;
    paragraphs: string[];
  };
  contact: {
    intro: string;
    phone: string;
    phoneHref: string;
    subtext: string;
  };
  categories: {
    sizes: string[];
    specials: string[];
  };
}
