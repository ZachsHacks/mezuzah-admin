export interface Mezuzah {
  id?: string;      // assigned when an auto-saved draft is created
  draft?: boolean;  // true while not yet published
  images: string[];
  name: string;
  tagline: string;
  price: number;
  categories: string[];
  description: string;
}

export const ALL_CATEGORIES = [
  'Small (4″)',
  'Medium (5-7″)',
  'Large (8-10″)',
  'Extra Large (12″+)',
  'With Gold Leaf',
  'New Arrival',
] as const;

export const SIZE_CATEGORIES = [
  'Small (4″)',
  'Medium (5-7″)',
  'Large (8-10″)',
  'Extra Large (12″+)',
] as const;
