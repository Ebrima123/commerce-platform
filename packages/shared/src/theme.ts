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
  /** Business category the store was generated for (drives sample products in the editor). */
  industry?: IndustryKey;
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

const LINK_HELP = 'Use #products to jump to your products, or whatsapp to open a chat with you.';
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
      { key: 'eyebrow', label: 'Small label above heading', type: 'text', placeholder: 'e.g. New season' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'textarea' },
      { key: 'buttonText', label: 'Button text', type: 'text' },
      { key: 'buttonLink', label: 'Button link', type: 'url', help: LINK_HELP },
      { key: 'showWhatsapp', label: 'Also show a WhatsApp button', type: 'toggle' },
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
    defaults: { eyebrow: '', showWhatsapp: true, heading: 'Welcome to our store', subheading: 'Quality products, delivered across The Gambia.', buttonText: 'Shop now', buttonLink: '#products', imageUrl: '', layout: 'overlay', height: 'md' },
  },
  featured_products: {
    type: 'featured_products', label: 'Product grid', icon: 'layout-grid',
    description: 'Show your products — all of them or one category.',
    fields: [
      { key: 'eyebrow', label: 'Small label above heading', type: 'text', placeholder: 'e.g. New season' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'category', label: 'Category', type: 'category' },
      { key: 'limit', label: 'Products to show', type: 'number', min: 2, max: 48 },
      { key: 'columns', label: 'Columns (desktop)', type: 'select', options: [
        { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' },
      ] },
      { key: 'imageRatio', label: 'Photo shape', type: 'select', options: [
        { value: 'square', label: 'Square' }, { value: 'portrait', label: 'Portrait (fashion)' }, { value: 'landscape', label: 'Landscape (furniture)' },
      ] },
      { key: 'showSearch', label: 'Show search and category filter', type: 'toggle' },
    ],
    defaults: { eyebrow: '', title: 'Our products', subtitle: '', category: '', limit: 12, columns: '4', imageRatio: 'square', showSearch: true },
  },
  categories: {
    type: 'categories', label: 'Category list', icon: 'tags',
    description: 'Tiles that jump to a category. Leave empty to use your product categories.',
    fields: [
      { key: 'eyebrow', label: 'Small label above heading', type: 'text', placeholder: 'e.g. New season' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Tiles', type: 'list', itemLabel: 'Tile', max: 8,
        fields: [{ key: 'name', label: 'Name (match a product category to filter)', type: 'text' }, { key: 'imageUrl', label: 'Image', type: 'image' }],
        newItem: { name: 'New category', imageUrl: '' } },
    ],
    defaults: { eyebrow: '', title: 'Shop by category', items: [] },
  },
  image_text: {
    type: 'image_text', label: 'Image with text', icon: 'panels-top-left',
    description: 'Tell your story next to a photo.',
    fields: [
      { key: 'eyebrow', label: 'Small label above heading', type: 'text', placeholder: 'e.g. New season' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'imagePosition', label: 'Image position', type: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
      { key: 'buttonText', label: 'Button text', type: 'text' },
      { key: 'buttonLink', label: 'Button link', type: 'url', help: LINK_HELP },
    ],
    defaults: { eyebrow: '', heading: 'Our story', body: 'Tell customers who you are, what you sell and why they can trust you.', imageUrl: '', imagePosition: 'left', buttonText: '', buttonLink: '' },
  },
  features: {
    type: 'features', label: 'Highlights', icon: 'sparkles',
    description: 'Icons with short reasons to buy — delivery, quality, support.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'style', label: 'Style', type: 'select', options: [{ value: 'strip', label: 'Compact strip' }, { value: 'cards', label: 'Cards' }] },
      { key: 'items', label: 'Highlights', type: 'list', itemLabel: 'Highlight', max: 6,
        fields: [{ key: 'icon', label: 'Icon', type: 'icon' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }],
        newItem: { icon: 'star', title: 'New highlight', text: 'Describe it in a sentence.' } },
    ],
    defaults: { title: '', style: 'cards', items: [
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

// ─── Industries, presets & templates (the wizard) ─────────────────────────────
// Each industry has a hand-designed default store ("Recommended"): brand,
// section order and copy chosen for how that kind of shopper buys. Copy avoids
// hard promises a merchant may not offer (warranty terms, refunds, free
// delivery) and testimonials start hidden — merchants add real quotes first.

export type IndustryKey = 'fashion' | 'electronics' | 'beauty' | 'food' | 'home' | 'general';
export type TemplateKey = 'recommended' | 'minimal' | 'bold' | 'boutique';

const img = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

type PresetSection = { type: SectionType; hidden?: boolean; settings: Record<string, SettingValue> };

export interface SampleProduct { name: string; price: number; imageUrl: string; category: string }

export interface IndustryPreset {
  label: string;
  icon: string;
  brand: Omit<Brand, 'logoUrl'>;
  /** Colours offered first in the wizard (brand colour + good alternatives). */
  colors: string[];
  sections: PresetSection[];
  /** Shown only in the editor preview while the store has no products. */
  samples: SampleProduct[];
}

const HIDDEN_TESTIMONIALS_NOTE = 'Replace these with real quotes from your customers, then show this section.';

export const INDUSTRIES: Record<IndustryKey, IndustryPreset> = {
  fashion: {
    label: 'Fashion & clothing', icon: 'shirt',
    brand: { primaryColor: '#6b21a8', headingFont: 'playfair', font: 'dm-sans', radius: 'none', surface: 'warm' },
    colors: ['#6b21a8', '#0f3a2e', '#832729', '#c28e38'],
    sections: [
      { type: 'announcement', settings: { text: 'New arrivals weekly • Order on WhatsApp • Pay with Wave or cash on delivery', link: '#products' } },
      { type: 'hero', settings: { eyebrow: 'New collection', heading: 'Elegance, cut for the modern Gambian woman', subheading: 'Grand boubous, kaftans and ready-to-wear — chosen for quality, fit and the occasion.', buttonText: 'Explore new arrivals', buttonLink: '#products', layout: 'split', height: 'lg', imageUrl: img('1696962701419-6f510910e838') } },
      { type: 'categories', settings: { eyebrow: 'Collections', title: 'Shop by collection', items: [
        { name: 'Kaftans & boubous', imageUrl: img('1696962678565-bee84e6b9cb6', 600) },
        { name: 'Ready-to-wear', imageUrl: img('1709809081557-78f803ce93a0', 600) },
        { name: 'Occasion wear', imageUrl: img('1625646741211-711bdd65c570', 600) },
      ] } },
      { type: 'featured_products', settings: { eyebrow: 'Just in', title: 'Signature pieces', subtitle: 'Limited pieces — message us to check your size', limit: 8, columns: '4', imageRatio: 'portrait', showSearch: false } },
      { type: 'image_text', settings: { eyebrow: 'Tailoring', heading: 'Made to your measurements', body: 'Send your measurements on WhatsApp and we will tailor your outfit for you. Ask us about fabrics and timing.', buttonText: 'Chat about tailoring', buttonLink: 'whatsapp', imagePosition: 'right', imageUrl: img('1558769132-cb1aea458c5e', 900) } },
      { type: 'testimonials', hidden: true, settings: { title: 'Loved by our customers', items: [
        { quote: HIDDEN_TESTIMONIALS_NOTE, author: 'Customer name', role: 'Banjul' },
        { quote: 'Example: Fit perfectly for my sister’s wedding. Ordering on WhatsApp was easy.', author: 'Customer name', role: 'Serekunda' },
      ] } },
      { type: 'whatsapp_cta', settings: { heading: 'Order or ask on WhatsApp', text: 'Send a screenshot of the piece you love — we confirm your size and arrange delivery.', buttonText: 'Message us on WhatsApp' } },
    ],
    samples: [
      { name: 'Embroidered Bazin Grand Boubou', price: 4850, category: 'Kaftans & boubous', imageUrl: img('1696962678565-bee84e6b9cb6', 600) },
      { name: 'Pleated Silk Kaftan', price: 2400, category: 'Kaftans & boubous', imageUrl: img('1625646741211-711bdd65c570', 600) },
      { name: 'Wax Print Wrap Dress', price: 1650, category: 'Ready-to-wear', imageUrl: img('1709809081557-78f803ce93a0', 600) },
      { name: 'Printed Headwrap Set', price: 950, category: 'Accessories', imageUrl: img('1505421031134-e57263cae630', 600) },
    ],
  },
  electronics: {
    label: 'Electronics & gadgets', icon: 'smartphone',
    brand: { primaryColor: '#0284c7', headingFont: 'poppins', font: 'inter', radius: 'md', surface: 'white' },
    colors: ['#0284c7', '#2563eb', '#059669', '#0f172a'],
    sections: [
      { type: 'announcement', settings: { text: 'Genuine devices • Check your item before you pay on delivery', link: '#products' } },
      { type: 'hero', settings: { eyebrow: 'Phones · Laptops · Accessories', heading: 'Genuine devices. Fair Gambian prices.', subheading: 'Smartphones, laptops and accessories — with real support after you buy.', buttonText: 'Browse devices', buttonLink: '#products', layout: 'overlay', height: 'md', imageUrl: img('1592899677977-9c10ca588bbd') } },
      { type: 'features', settings: { title: '', style: 'strip', items: [
        { icon: 'shield', title: 'Genuine products', text: 'Original devices — ask us for the IMEI or serial before you buy.' },
        { icon: 'truck', title: 'Fast delivery', text: 'Delivered across the Greater Banjul Area.' },
        { icon: 'credit-card', title: 'Wave or pay on delivery', text: 'Unbox and check your device when it arrives.' },
      ] } },
      { type: 'featured_products', settings: { eyebrow: 'In stock now', title: 'Latest arrivals & best sellers', subtitle: 'Message us to confirm stock and colours', limit: 8, columns: '4', imageRatio: 'square', showSearch: true } },
      { type: 'whatsapp_cta', settings: { heading: 'Questions about a device?', text: 'Chat with us on WhatsApp to check specs, stock or ask for a video of the item before delivery.', buttonText: 'Message us on WhatsApp' } },
    ],
    samples: [
      { name: 'iPhone 14 Pro 128GB', price: 48500, category: 'Phones', imageUrl: img('1592899677977-9c10ca588bbd', 600) },
      { name: 'Samsung Galaxy A54 5G', price: 19200, category: 'Phones', imageUrl: img('1598327105666-5b89351aff97', 600) },
      { name: 'Wireless Over-Ear Headphones', price: 2950, category: 'Audio', imageUrl: img('1505740420928-5e560c06d30e', 600) },
      { name: 'Oraimo 20,000mAh Power Bank', price: 1450, category: 'Accessories', imageUrl: img('1550009158-9ebf69173e03', 600) },
    ],
  },
  beauty: {
    label: 'Beauty & care', icon: 'flower',
    brand: { primaryColor: '#be185d', headingFont: 'fraunces', font: 'dm-sans', radius: 'xl', surface: 'warm' },
    colors: ['#be185d', '#d97706', '#9d5c43', '#4a7c59'],
    sections: [
      { type: 'announcement', settings: { text: 'Natural skin & hair care • Free routine advice on WhatsApp', link: 'whatsapp' } },
      { type: 'hero', settings: { eyebrow: 'Natural skin & hair care', heading: 'Glowing, nourished skin under the Gambian sun', subheading: 'Shea, oils and gentle care — with ingredients you can read and trust.', buttonText: 'Find your routine', buttonLink: '#products', layout: 'center', height: 'md', imageUrl: img('1522337360788-8b13dee7a37e') } },
      { type: 'categories', settings: { eyebrow: 'Your routine', title: 'Shop by routine', items: [
        { name: 'Face glow', imageUrl: img('1556228720-195a672e8a03', 600) },
        { name: 'Shea body care', imageUrl: img('1601049541289-9b1b7bbbfe19', 600) },
        { name: 'Hair & scalp', imageUrl: img('1527799820374-dcf8d9d4a388', 600) },
      ] } },
      { type: 'featured_products', settings: { eyebrow: 'Bestsellers', title: 'Customer favourites', subtitle: 'Gentle formulas for heat and humidity', limit: 8, columns: '4', imageRatio: 'square', showSearch: false } },
      { type: 'features', settings: { title: 'Why customers choose us', style: 'cards', items: [
        { icon: 'leaf', title: 'Gentle ingredients', text: 'Ask us for the full ingredient list of any product.' },
        { icon: 'sparkles', title: 'Made for our climate', text: 'Light textures that suit heat and humidity.' },
        { icon: 'heart', title: 'Personal advice', text: 'Tell us your skin goals and we suggest a routine.' },
      ] } },
      { type: 'whatsapp_cta', settings: { heading: 'Get a free routine recommendation', text: 'Message us on WhatsApp with your skin or hair goals — we will suggest what to use.', buttonText: 'Message us on WhatsApp' } },
    ],
    samples: [
      { name: 'Facial Glow Oil', price: 850, category: 'Face glow', imageUrl: img('1608571423902-eed4a5ad8108', 600) },
      { name: 'Whipped Shea Body Cream', price: 650, category: 'Shea body care', imageUrl: img('1601049541289-9b1b7bbbfe19', 600) },
      { name: 'Daily Moisturising Lotion', price: 1200, category: 'Face glow', imageUrl: img('1556228720-195a672e8a03', 600) },
      { name: 'Herbal Hair Butter', price: 750, category: 'Hair & scalp', imageUrl: img('1527799820374-dcf8d9d4a388', 600) },
    ],
  },
  food: {
    label: 'Food & groceries', icon: 'shopping-basket',
    brand: { primaryColor: '#15803d', headingFont: 'poppins', font: 'inter', radius: 'md', surface: 'white' },
    colors: ['#15803d', '#d97706', '#ea580c', '#1e3a8a'],
    sections: [
      { type: 'announcement', settings: { text: 'Fresh food & household staples • Order on WhatsApp for delivery', link: '#products' } },
      { type: 'hero', settings: { eyebrow: 'Fresh every day', heading: 'Fresh food & market staples, delivered to your door', subheading: 'Skip the heat and the traffic — vegetables, fish, grains and pantry supplies.', buttonText: 'Shop groceries', buttonLink: '#products', layout: 'split', height: 'sm', imageUrl: img('1687422809654-579d81c29d32') } },
      { type: 'features', settings: { title: '', style: 'strip', items: [
        { icon: 'leaf', title: 'Picked fresh', text: 'We pack your order fresh on the day.' },
        { icon: 'truck', title: 'To your kitchen', text: 'Heavy bags of rice and oil carried to your door.' },
        { icon: 'phone', title: 'Easy reorders', text: 'Send the same list next week — we remember.' },
      ] } },
      { type: 'featured_products', settings: { eyebrow: 'Shop now', title: 'Fresh today & essentials', subtitle: 'Prices per item — message us for bulk orders', limit: 12, columns: '4', imageRatio: 'square', showSearch: true } },
      { type: 'whatsapp_cta', settings: { heading: 'Have a shopping list?', text: 'Snap a photo of your list and send it on WhatsApp — we will price it and deliver.', buttonText: 'Send my list on WhatsApp' } },
    ],
    samples: [
      { name: 'Fresh Tomatoes & Peppers Basket (5kg)', price: 450, category: 'Vegetables', imageUrl: img('1542838132-92c53300491e', 600) },
      { name: 'Long Grain Rice (50kg bag)', price: 1850, category: 'Pantry', imageUrl: img('1687422809654-579d81c29d32', 600) },
      { name: 'Groundnut Oil (5L)', price: 650, category: 'Pantry', imageUrl: img('1542838132-92c53300491e', 600) },
      { name: 'Fresh Captain Fish Fillet (1kg)', price: 550, category: 'Fish & meat', imageUrl: img('1687422809654-579d81c29d32', 600) },
    ],
  },
  home: {
    label: 'Home & living', icon: 'sofa',
    brand: { primaryColor: '#9a3412', headingFont: 'fraunces', font: 'dm-sans', radius: 'md', surface: 'warm' },
    colors: ['#9a3412', '#365314', '#1c1917', '#78350f'],
    sections: [
      { type: 'announcement', settings: { text: 'Furniture & home essentials • Delivery and setup on request', link: 'whatsapp' } },
      { type: 'hero', settings: { eyebrow: 'Furniture & living', heading: 'Crafted for comfortable Gambian living', subheading: 'Solid furniture, durable fabrics and home essentials built for our climate.', buttonText: 'Explore the collection', buttonLink: '#products', layout: 'overlay', height: 'lg', imageUrl: img('1618221195710-dd6b41faaea6') } },
      { type: 'categories', settings: { eyebrow: 'Rooms', title: 'Shop by room', items: [
        { name: 'Living room', imageUrl: img('1555041469-a586c61ea9bc', 600) },
        { name: 'Dining & kitchen', imageUrl: img('1617806118233-18e1de247200', 600) },
        { name: 'Solar & backup', imageUrl: img('1508514177221-188b1cf16e9d', 600) },
      ] } },
      { type: 'featured_products', settings: { eyebrow: 'Featured', title: 'Featured furniture & living', subtitle: 'Ask us for dimensions and fabric options', limit: 6, columns: '3', imageRatio: 'landscape', showSearch: false } },
      { type: 'image_text', settings: { eyebrow: 'Built to last', heading: 'Built for our climate', body: 'Tell us about your space and we will help you choose pieces that last in coastal heat and humidity.', buttonText: 'Ask about custom sizes', buttonLink: 'whatsapp', imagePosition: 'left', imageUrl: img('1538688525198-9b88f6f53126', 900) } },
      { type: 'whatsapp_cta', settings: { heading: 'Have a design in mind?', text: 'Send your room size or a photo for inspiration on WhatsApp and we will get back to you with options.', buttonText: 'Message us on WhatsApp' } },
    ],
    samples: [
      { name: 'Solid Wood Coffee Table', price: 6800, category: 'Living room', imageUrl: img('1618221195710-dd6b41faaea6', 600) },
      { name: 'Three-Seater Linen Sofa', price: 38500, category: 'Living room', imageUrl: img('1555041469-a586c61ea9bc', 600) },
      { name: 'Six-Seater Dining Set', price: 24500, category: 'Dining & kitchen', imageUrl: img('1617806118233-18e1de247200', 600) },
    ],
  },
  general: {
    label: 'Something else', icon: 'store',
    brand: { primaryColor: '#0f766e', headingFont: 'inter', font: 'inter', radius: 'full', surface: 'white' },
    colors: ['#0f766e', '#1d4ed8', '#b91c1c', '#4338ca'],
    sections: [
      { type: 'announcement', settings: { text: 'Everyday essentials • Pay with Wave or cash on delivery', link: '#products' } },
      { type: 'hero', settings: { eyebrow: 'Everyday essentials', heading: 'Everything you need, delivered to your door', subheading: 'Great prices on home essentials, appliances and everyday goods.', buttonText: 'See today’s deals', buttonLink: '#products', layout: 'center', height: 'sm', imageUrl: img('1761370571806-886404629697') } },
      { type: 'features', settings: { title: '', style: 'strip', items: [
        { icon: 'truck', title: 'One delivery', text: 'Mix items from any category into one delivery.' },
        { icon: 'credit-card', title: 'Flexible payment', text: 'Pay with Wave or cash on delivery.' },
        { icon: 'phone', title: 'WhatsApp support', text: 'We confirm stock and answer questions fast.' },
      ] } },
      { type: 'categories', settings: { eyebrow: 'Browse', title: 'Top categories', items: [
        { name: 'Kitchen', imageUrl: img('1556911220-e15b29be8c8f', 600) },
        { name: 'Electronics', imageUrl: img('1505740420928-5e560c06d30e', 600) },
        { name: 'Travel & luggage', imageUrl: img('1565026057447-bc90a3dceb87', 600) },
      ] } },
      { type: 'featured_products', settings: { eyebrow: 'Deals', title: 'Best-selling deals', subtitle: 'Message us to check stock', limit: 12, columns: '4', imageRatio: 'square', showSearch: true } },
      { type: 'whatsapp_cta', settings: { heading: 'Looking for something specific?', text: 'Send us a photo of what you need on WhatsApp and we will check if we have it.', buttonText: 'Message us on WhatsApp' } },
    ],
    samples: [
      { name: 'Rechargeable Solar LED Lamp', price: 850, category: 'Electronics', imageUrl: img('1505740420928-5e560c06d30e', 600) },
      { name: 'Three-Piece Luggage Set', price: 4200, category: 'Travel & luggage', imageUrl: img('1565026057447-bc90a3dceb87', 600) },
      { name: 'Stainless Electric Kettle 2L', price: 750, category: 'Kitchen', imageUrl: img('1556911220-e15b29be8c8f', 600) },
      { name: 'Wireless Headphones', price: 1450, category: 'Electronics', imageUrl: img('1505740420928-5e560c06d30e', 600) },
    ],
  },
};

export const TEMPLATES: Record<TemplateKey, { label: string; description: string; brand?: Omit<Brand, 'primaryColor' | 'logoUrl'> }> = {
  recommended: { label: 'Recommended', description: 'Designed for your kind of store — the best place to start.' },
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

const HERO_LAYOUT: Record<Exclude<TemplateKey, 'recommended'>, { layout: string; height: string }> = {
  minimal: { layout: 'center', height: 'md' },
  bold: { layout: 'overlay', height: 'lg' },
  boutique: { layout: 'split', height: 'md' },
};

/**
 * Build a complete starter store from the wizard's answers. "Recommended"
 * uses the industry's hand-designed preset as-is; the other templates keep
 * the industry's sections and copy but apply their own type, corners,
 * background and hero layout.
 */
export function generateTheme(opts: { storeName: string; industry: IndustryKey; template: TemplateKey; primaryColor: string }): Theme {
  const preset = INDUSTRIES[opts.industry] ?? INDUSTRIES.general;
  const tpl = TEMPLATES[opts.template] ?? TEMPLATES.recommended;
  const style = opts.template !== 'recommended' ? HERO_LAYOUT[opts.template] : null;

  const sections = preset.sections.map(p => {
    const settings = structuredClone(p.settings);
    if (p.type === 'hero' && style) Object.assign(settings, style);
    const section = createSection(p.type, settings);
    if (p.hidden) section.hidden = true;
    return section;
  });

  return {
    version: 1,
    template: opts.template,
    industry: opts.industry,
    brand: { ...preset.brand, ...(tpl.brand ?? {}), primaryColor: opts.primaryColor, logoUrl: '' },
    sections,
  };
}

/** Make any stored/partial theme safe to render (older shapes, missing keys). */
export function normalizeTheme(raw: unknown, fallbackName = 'Our store'): Theme {
  const t = (raw && typeof raw === 'object' ? raw : {}) as Partial<Theme>;
  const industry = t.industry && t.industry in INDUSTRIES ? t.industry : undefined;
  const base = generateTheme({ storeName: fallbackName, industry: industry ?? 'general', template: 'recommended', primaryColor: INDUSTRIES[industry ?? 'general'].brand.primaryColor });
  const brand = { ...base.brand, ...(t.brand ?? {}) };
  const sections = Array.isArray(t.sections)
    ? t.sections
        .filter(s => s && typeof s === 'object' && s.type in SECTION_DEFINITIONS)
        .map(s => ({ ...s, id: s.id || newSectionId(), settings: { ...SECTION_DEFINITIONS[s.type].defaults, ...(s.settings ?? {}) } }))
    : base.sections;
  return { version: 1, template: (t.template as TemplateKey) ?? 'recommended', industry, brand, sections };
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
