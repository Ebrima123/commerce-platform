import type { Theme } from './theme';

// Mariseh API shapes (estore-backend/platform_stores).

export interface PlatformStore {
  id: string;
  slug: string;
  name: string;
  industry: string;
  theme: Partial<Theme>;
  published: boolean;
  list_on_marketplace: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicPlatformStore {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  theme: Partial<Theme>;
  owner_id: string;
  avatar_url: string;
  description: string;
  banner_url: string;
  whatsapp: string;
  location: string;
  categories: string[];
}

export interface SlugCheck { slug: string; available: boolean; reason: string | null }
