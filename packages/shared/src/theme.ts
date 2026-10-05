// The store design ("theme") model shared by the admin editor and the
// storefront renderer. The backend stores it as opaque JSON (Store.theme), so
// this file is the single source of truth for section types, their settings
// fields, defaults, and the templates the store wizard generates from.

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontKey = 'inter' | 'dm-sans' | 'poppins' | 'playfair' | 'fraunces';
export type RadiusKey = 'none' | 'md' | 'xl' | 'full';
export type SurfaceKey = 'white' | 'warm' | 'dark';

export interface Brand {
  primaryColor: string;  // hex, e.g. #111827
  font: FontKey;
  headingFont: FontKey;
  radius: RadiusKey;
  surface: SurfaceKey;
  logoUrl: string;
}

export type SectionType =
  | 'announcement' | 'hero' | 'featured_products' | 'categories' | 'image_text'
  | 'features' | 'testimonials' | 'gallery' | 'rich_text' | 'whatsapp_cta';

export type SettingValue = string | number | boolean | ListItem[];
export type ListItem = Record<string, string>;

export interface Section {
  id: string;
  type: SectionType;
  hidden?: boolean;
  settings: Record<string, SettingValue>;
}

export interface Theme {
  version: 1;
  template: TemplateKey;
  brand: Brand;
  sections: Section[];
}

// ─── Settings fields (drive the editor's forms) ───────────────────────────────

export type Field =
  | { key: string; label: string; type: 'text'; placeholder?: string }
  | { key: string; label: string; type: 'textarea'; placeholder?: string }
  | { key: string; label: string; type: 'url'; placeholder?: string; help?: string }
  | { key: string; label: string; type: 'image' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'number'; min: number; max: number }
  | { key: string; label: string; type: 'toggle' }
  | { key: string; label: string; type: 'category' }
  | { key: string; label: string; type: 'list'; itemLabel: string; max: number; fields: ListField[]; newItem: ListItem };

export type ListField =
  | { key: string; label: string; type: 'text' | 'textarea' | 'image' | 'url' }
  | { key: string; label: string; type: 'icon' };

export const FEATURE_ICONS = ['truck', 'shield', 'clock', 'phone', 'star', 'leaf', 'gift', 'sparkles', 'heart', 'award', 'map-pin', 'credit-card'] as const;

export interface SectionDefinition {
  type: SectionType;
  label: string;
  description: string;
  icon: string;             // lucide icon name, resolved by each app
  fields: Field[];
  defaults: Record<string, SettingValue>;
  /** Max instances per page (e.g. one announcement bar). */
  limit?: number;
}

const alignOptions = [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }];

export const SECTION_DEFINITIONS: Record<SectionType, SectionDefinition> = {
  announcement: {
    type: 'announcement', label: 'Announcement bar', icon: 'megaphone', limit: 1,
    description: 'A slim bar at the very top for offers or delivery news.',
    fields: [
      { key: 'text', label: 'Text', type: 'text', placeholder: 'Free delivery in Banjul this week' },
      { key: 'link', label: 'Link', type: 'url', placeholder: '/#products' },
    ],
    defaults: { text: 'Free delivery on orders over D 1,000', link: '' },
  },
  hero: {
    type: 'hero', label: 'Hero banner', icon: 'image',
    description: 'Big headline, image and button at the top of your page.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'textarea' },
      { key: 'buttonText', label: 'Button text', type: 'text' },
      { key: 'buttonLink', label: 'Button link', type: 'url', help: 'Use #products to jump to your products.' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'layout', label: 'Layout', type: 'select', options: [
        { value: 'overlay', label: 'Text over image' },
        { value: 'split', label: 'Image beside text' },
        { value: 'center', label: 'Centered, no image' },
      ] },
      { key: 'height', label: 'Height', type: 'select', options: [
        { value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' },
      ] },
    ],
    defaults: { heading: 'Welcome to our store', subheading: 'Quality products, delivered across The Gambia.', buttonText: 'Shop now', buttonLink: '#products', imageUrl: '', layout: 'overlay', height: 'md' },
  },
  featured_products: {
    type: 'featured_products', label: 'Product grid', icon: 'layout-grid',
    description: 'Show your products — all of them or one category.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'category', label: 'Category', type: 'category' },
      { key: 'limit', label: 'Products to show', type: 'number', min: 2, max: 48 },
      { key: 'columns', label: 'Columns (desktop)', type: 'select', options: [
        { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' },
      ] },
      { key: 'showSearch', label: 'Show search and category filter', type: 'toggle' },
    ],
    defaults: { title: 'Our products', subtitle: '', category: '', limit: 12, columns: '4', showSearch: true },
  },
  categories: {
    type: 'categories', label: 'Category list', icon: 'tags',
    description: 'Let customers browse by category.',
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
    defaults: { title: 'Shop by category' },
  },
  image_text: {
    type: 'image_text', label: 'Image with text', icon: 'panels-top-left',
    description: 'Tell your story next to a photo.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'imagePosition', label: 'Image position', type: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
      { key: 'buttonText', label: 'Button text', type: 'text' },
      { key: 'buttonLink', label: 'Button link', type: 'url' },
    ],
    defaults: { heading: 'Our story', body: 'Tell customers who you are, what you sell and why they can trust you.', imageUrl: '', imagePosition: 'left', buttonText: '', buttonLink: '' },
  },
  features: {
    type: 'features', label: 'Highlights', icon: 'sparkles',
    description: 'Icons with short reasons to buy — delivery, quality, support.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Highlights', type: 'list', itemLabel: 'Highlight', max: 6,
        fields: [{ key: 'icon', label: 'Icon', type: 'icon' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }],
        newItem: { icon: 'star', title: 'New highlight', text: 'Describe it in a sentence.' } },
    ],
    defaults: { title: '', items: [
      { icon: 'truck', title: 'Fast delivery', text: 'Across the Greater Banjul Area.' },
      { icon: 'shield', title: 'Quality guaranteed', text: 'Every item checked before it ships.' },
      { icon: 'phone', title: 'Order on WhatsApp', text: 'Questions? Message us any time.' },
    ] },
  },
  testimonials: {
    type: 'testimonials', label: 'Testimonials', icon: 'quote',
    description: 'What happy customers say about you.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Testimonials', type: 'list', itemLabel: 'Testimonial', max: 6,
        fields: [{ key: 'quote', label: 'Quote', type: 'textarea' }, { key: 'author', label: 'Name', type: 'text' }, { key: 'role', label: 'Detail', type: 'text' }],
        newItem: { quote: 'Great service and fast delivery!', author: 'Customer', role: 'Serekunda' } },
    ],
    defaults: { title: 'What customers say', items: [
      { quote: 'Fast delivery and exactly as pictured. Will order again!', author: 'Fatou J.', role: 'Brikama' },
      { quote: 'Friendly service and great prices.', author: 'Lamin C.', role: 'Bakau' },
    ] },
  },
  gallery: {
    type: 'gallery', label: 'Image gallery', icon: 'images',
    description: 'A grid of photos — your shop, products in use, events.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'images', label: 'Images', type: 'list', itemLabel: 'Image', max: 12,
        fields: [{ key: 'imageUrl', label: 'Image', type: 'image' }, { key: 'caption', label: 'Caption', type: 'text' }],
        newItem: { imageUrl: '', caption: '' } },
    ],
    defaults: { title: 'Gallery', images: [{ imageUrl: '', caption: '' }, { imageUrl: '', caption: '' }, { imageUrl: '', caption: '' }] },
  },
  rich_text: {
    type: 'rich_text', label: 'Text block', icon: 'type',
    description: 'A heading and paragraph — policies, notices, anything.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea' },
      { key: 'align', label: 'Alignment', type: 'select', options: alignOptions },
    ],
    defaults: { heading: 'About us', body: 'Write something your customers should know.', align: 'center' },
  },
  whatsapp_cta: {
    type: 'whatsapp_cta', label: 'WhatsApp button', icon: 'message-circle',
    description: 'A banner inviting customers to message you.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'buttonText', label: 'Button text', type: 'text' },
    ],
    defaults: { heading: 'Questions? Chat with us', text: 'We reply fast on WhatsApp — ask about sizes, stock or delivery.', buttonText: 'Message us on WhatsApp' },
  },
};

export const SECTION_ORDER: SectionType[] = [
  'hero', 'featured_products', 'categories', 'features', 'image_text',
  'testimonials', 'gallery', 'rich_text', 'whatsapp_cta', 'announcement',
];

// ─── Brand options ────────────────────────────────────────────────────────────

export const FONTS: Record<FontKey, { label: string; family: string; google: string }> = {
  inter:      { label: 'Inter',      family: "'Inter', system-ui, sans-serif",          google: 'Inter:wght@400;500;600;700' },
  'dm-sans':  { label: 'DM Sans',    family: "'DM Sans', system-ui, sans-serif",        google: 'DM+Sans:wght@400;500;600;700' },
  poppins:    { label: 'Poppins',    family: "'Poppins', system-ui, sans-serif",        google: 'Poppins:wght@400;500;600;700' },
  playfair:   { label: 'Playfair',   family: "'Playfair Display', Georgia, serif",      google: 'Playfair+Display:wght@500;600;700' },
  fraunces:   { label: 'Fraunces',   family: "'Fraunces', Georgia, serif",              google: 'Fraunces:wght@500;600;700' },
};

export const RADII: Record<RadiusKey, { label: string; value: string }> = {
  none: { label: 'Square', value: '0px' },
  md:   { label: 'Soft', value: '0.5rem' },
  xl:   { label: 'Rounded', value: '1rem' },
  full: { label: 'Pill', value: '9999px' },
};

export const SURFACES: Record<SurfaceKey, { label: string }> = {
  white: { label: 'Clean white' },
  warm:  { label: 'Warm cream' },
  dark:  { label: 'Dark' },
};

export const BRAND_SWATCHES = ['#111827', '#e11d48', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#2563eb', '#7c3aed', '#db2777', '#78350f'];

// ─── Industries & templates (the wizard) ──────────────────────────────────────

export type IndustryKey = 'fashion' | 'electronics' | 'beauty' | 'food' | 'home' | 'general';
export type TemplateKey = 'minimal' | 'bold' | 'boutique';

export const INDUSTRIES: Record<IndustryKey, { label: string; icon: string; hero: string; sub: string; story: string; features: ListItem[] }> = {
  fashion: {
    label: 'Fashion & clothing', icon: 'shirt',
    hero: 'New styles, every week', sub: 'Clothing, shoes and accessories — delivered to your door.',
    story: 'We pick every piece for quality and fit, so you look great without the hassle.',
    features: [
      { icon: 'truck', title: 'Fast delivery', text: 'Across the Greater Banjul Area.' },
      { icon: 'sparkles', title: 'Fresh arrivals', text: 'New styles added every week.' },
      { icon: 'phone', title: 'Size help', text: 'Ask us on WhatsApp before you buy.' },
    ],
  },
  electronics: {
    label: 'Electronics & gadgets', icon: 'smartphone',
    hero: 'Tech you can trust', sub: 'Phones, accessories and gadgets at fair prices.',
    story: 'Genuine products, tested before delivery, with friendly support after you buy.',
    features: [
      { icon: 'shield', title: 'Genuine products', text: 'Original items, tested before delivery.' },
      { icon: 'truck', title: 'Same-day delivery', text: 'In the Greater Banjul Area.' },
      { icon: 'award', title: 'After-sales support', text: 'We help you set up and fix issues.' },
    ],
  },
  beauty: {
    label: 'Beauty & care', icon: 'flower',
    hero: 'Glow, naturally', sub: 'Skincare, hair care and beauty essentials you will love.',
    story: 'We stock products we use ourselves — gentle, effective and fairly priced.',
    features: [
      { icon: 'leaf', title: 'Gentle formulas', text: 'Chosen for every skin type.' },
      { icon: 'heart', title: 'Loved by customers', text: 'Hundreds of happy repeat buyers.' },
      { icon: 'gift', title: 'Gift ready', text: 'Ask us to wrap it for someone special.' },
    ],
  },
  food: {
    label: 'Food & groceries', icon: 'shopping-basket',
    hero: 'Fresh, local, delivered', sub: 'Groceries and treats from our kitchen to your table.',
    story: 'Made fresh and sourced locally wherever we can.',
    features: [
      { icon: 'leaf', title: 'Fresh daily', text: 'Prepared and packed the same day.' },
      { icon: 'clock', title: 'On-time delivery', text: 'Choose a time that suits you.' },
      { icon: 'map-pin', title: 'Locally sourced', text: 'Supporting Gambian farmers.' },
    ],
  },
  home: {
    label: 'Home & living', icon: 'sofa',
    hero: 'Make your home yours', sub: 'Furniture, decor and everyday essentials.',
    story: 'Good-quality pieces for every room, at prices that make sense.',
    features: [
      { icon: 'truck', title: 'Delivery & setup', text: 'We bring it to you and set it up.' },
      { icon: 'award', title: 'Built to last', text: 'Quality materials, carefully chosen.' },
      { icon: 'credit-card', title: 'Pay on delivery', text: 'Wave or cash when it arrives.' },
    ],
  },
  general: {
    label: 'Something else', icon: 'store',
    hero: 'Welcome to our store', sub: 'Quality products, delivered across The Gambia.',
    story: 'Tell customers who you are, what you sell and why they can trust you.',
    features: SECTION_DEFINITIONS.features.defaults.items as ListItem[],
  },
};

export const TEMPLATES: Record<TemplateKey, { label: string; description: string; brand: Omit<Brand, 'primaryColor' | 'logoUrl'> }> = {
  minimal:  { label: 'Minimal',  description: 'Clean and simple. Lets your products do the talking.', brand: { font: 'inter', headingFont: 'inter', radius: 'md', surface: 'white' } },
  bold:     { label: 'Bold',     description: 'Big type, strong colour and full-width images.', brand: { font: 'poppins', headingFont: 'poppins', radius: 'xl', surface: 'white' } },
  boutique: { label: 'Boutique', description: 'Elegant serif headings on a warm background.', brand: { font: 'dm-sans', headingFont: 'playfair', radius: 'none', surface: 'warm' } },
};

let idCounter = 0;
export function newSectionId() {
  idCounter += 1;
  return `s_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createSection(type: SectionType, overrides: Record<string, SettingValue> = {}): Section {
  const defaults = structuredClone(SECTION_DEFINITIONS[type].defaults);
  return { id: newSectionId(), type, settings: { ...defaults, ...overrides } };
}

/** Build a complete starter design from the wizard's answers. */
export function generateTheme(opts: { storeName: string; industry: IndustryKey; template: TemplateKey; primaryColor: string }): Theme {
  const ind = INDUSTRIES[opts.industry] ?? INDUSTRIES.general;
  const tpl = TEMPLATES[opts.template] ?? TEMPLATES.minimal;

  const hero = createSection('hero', {
    heading: ind.hero, subheading: ind.sub,
    layout: opts.template === 'minimal' ? 'center' : opts.template === 'bold' ? 'overlay' : 'split',
    height: opts.template === 'bold' ? 'lg' : 'md',
  });
  const products = createSection('featured_products', { title: opts.template === 'boutique' ? 'The collection' : 'Our products' });
  const features = createSection('features', { items: structuredClone(ind.features) });
  const story = createSection('image_text', { heading: `About ${opts.storeName}`, body: ind.story });
  const whatsapp = createSection('whatsapp_cta');

  const sections: Section[] =
    opts.template === 'bold'
      ? [createSection('announcement'), hero, features, products, createSection('testimonials'), whatsapp]
      : opts.template === 'boutique'
        ? [hero, products, story, createSection('testimonials'), whatsapp]
        : [hero, products, features, whatsapp];

  return {
    version: 1,
    template: opts.template,
    brand: { ...tpl.brand, primaryColor: opts.primaryColor, logoUrl: '' },
    sections,
  };
}

/** Make any stored/partial theme safe to render (older shapes, missing keys). */
export function normalizeTheme(raw: unknown, fallbackName = 'Our store'): Theme {
  const t = (raw && typeof raw === 'object' ? raw : {}) as Partial<Theme>;
  const base = generateTheme({ storeName: fallbackName, industry: 'general', template: 'minimal', primaryColor: '#111827' });
  const brand = { ...base.brand, ...(t.brand ?? {}) };
  const sections = Array.isArray(t.sections)
    ? t.sections
        .filter(s => s && typeof s === 'object' && s.type in SECTION_DEFINITIONS)
        .map(s => ({ ...s, id: s.id || newSectionId(), settings: { ...SECTION_DEFINITIONS[s.type].defaults, ...(s.settings ?? {}) } }))
    : base.sections;
  return { version: 1, template: (t.template as TemplateKey) ?? 'minimal', brand, sections };
}

// ─── Rendering helpers ────────────────────────────────────────────────────────

/** Only allow safe link targets from merchant-entered settings. */
export function safeHref(href: unknown): string | undefined {
  if (typeof href !== 'string' || !href.trim()) return undefined;
  const h = href.trim();
  if (h.startsWith('/') || h.startsWith('#')) return h;
  try {
    const u = new URL(h);
    return u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:' || u.protocol === 'tel:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

/** "#e11d48" → "347 77% 50%" for CSS hsl() variables. */
export function hexToHslTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '240 10% 8%';
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** White or near-black text, whichever reads better on the brand colour. */
export function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '0 0% 100%';
  const n = parseInt(m[1], 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.4 ? '240 10% 8%' : '0 0% 100%';
}

/** Store address from a name: "Fatou's Fashion House" → "fatous-fashion-house". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

// ─── Editor ⇄ storefront preview messages ─────────────────────────────────────

export type PreviewMessage =
  | { type: 'cp:ready' }
  | { type: 'cp:theme'; theme: Theme }
  | { type: 'cp:select'; id: string }
  | { type: 'cp:highlight'; id: string | null };
