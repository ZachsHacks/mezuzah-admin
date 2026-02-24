export interface Mezuzah {
  images: string[];
  name: string;
  tagline: string;
  price: number;
  categories: string[];
  description: string;
}

export const ALL_CATEGORIES = [
  'Small (4″)',
  'Medium (4-6″)',
  'Large (7-8″)',
  'Extra Large (10-12″)',
  'With Gold Leaf',
  'New Arrival',
] as const;

export const SIZE_CATEGORIES = [
  'Small (4″)',
  'Medium (4-6″)',
  'Large (7-8″)',
  'Extra Large (10-12″)',
] as const;
