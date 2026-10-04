export type Product = {
  id: number;
  created_at: string;
  name: string;
  category: string;
  description: string | null;
  scents: string[];
  colors: {
    name: string;
    hex: string | null;
    image_url?: string;
    image_urls?: string[];
    price?: number;
    options?: {
      name: string;
      price?: number;
      image_url?: string;
      image_urls?: string[];
    }[];
  }[];
  price: number;
  stock: number;
  image_urls: string[];
  is_featured: boolean;
  is_active: boolean;
    size_ml: number | null;
  option_groups?: {
  
    label: string;
    choices: { name: string; hex?: string }[];
  }[];
    show_order_counter?: boolean;

};

export type CarouselCandle = {
  productId: number;
  colorName: string;
  name: string;
  description: string | null;
  price: number;
  size_ml: number | null;
  scents: string[];
  image: string | null;
};