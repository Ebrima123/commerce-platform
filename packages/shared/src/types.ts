// Shapes returned by the existing estore-backend API. These will move to a
// dedicated Store (tenant) model in the backend phase — keep usage behind the
// helpers in this package so that switch stays contained.

export interface PublicStore {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  store_name: string;
  store_description: string;
  store_banner_url: string;
  store_whatsapp: string;
  store_location: string;
  product_count: number;
  member_since: string | null;
}

export interface ProductImage { id?: string; url?: string; image_url?: string; position?: number }

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string | number;
  stock_quantity: number;
  in_stock: boolean;
  category: string;
  image_url: string;
  images?: ProductImage[];
  seller_id?: string;
  // Real social proof from the backend (absent on some endpoints).
  sales_count?: number;
  average_rating?: number;
  total_reviews?: number;
  is_best_seller?: boolean;
  is_hot_pick?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  full_name: string;
  avatar_url: string;
  role: string;
}

export interface Paginated<T> { count: number; next: string | null; previous: string | null; results: T[] }
