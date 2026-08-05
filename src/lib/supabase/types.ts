export type Product = {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  scents: string[];
  colors: { name: string; hex: string | null; image_url?: string }[];
  price: number;
  stock: number;
  image_urls: string[];
  is_featured: boolean;
  size_ml: number | null;
};