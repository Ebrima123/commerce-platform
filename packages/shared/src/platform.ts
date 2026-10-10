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
  /** Connected custom domain (e.g. awafashion.com), null if none. */
  custom_domain?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicPlatformStore {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  theme: Partial<Theme>;
  custom_domain?: string | null;
  owner_id: string;
  avatar_url: string;
  description: string;
  banner_url: string;
  whatsapp: string;
  location: string;
  categories: string[];
}

export interface DomainRecord { type: string; name: string; value: string; purpose?: string }
export interface StoreDomain {
  id: number;
  domain: string;
  is_apex: boolean;
  status: 'pending' | 'active';
  records: DomainRecord[];
  last_error: string;
  last_checked_at: string | null;
  connected_at: string | null;
  created_at: string;
  url: string;
}

export interface SlugCheck { slug: string; available: boolean; reason: string | null }
