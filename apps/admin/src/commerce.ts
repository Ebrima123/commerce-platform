import type { Product } from '@cp/shared';

// Shapes returned by estore-backend's seller_api (products, orders, analytics).

export interface Variant {
  id?: string;
  size: string;
  color: string;
  color_hex?: string;
  sku: string;
  stock_quantity: number;
  price_override: string | number | null;
}

export type SellerProduct = Product & {
  published: boolean;
  sku: string;
  cost?: string | number | null;
  min_stock_level?: number;
  product_type?: string;
  view_count?: number;
  variants?: Variant[];
  created_at?: string;
  updated_at?: string;
};

export interface OrderItem {
  product_id?: string | number;
  product_name?: string;
  name?: string;
  image?: string;
  image_url?: string;
  price: string | number;
  quantity: number;
  size?: string;
  color?: string;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  wave_number?: string;
  user: string | null;
  subtotal: string | number;
  shipping: string | number;
  total_amount: string | number;
  discount_name?: string;
  discount_amount?: string | number;
  deliver_to: string;
  contact_number: string;
  delivery_location: string;
  items: OrderItem[];
  cancelled_at?: string | null;
  cancel_reason?: string;
  refund_status?: string;
  refund_amount?: string | number | null;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
}

export const ORDER_STATUS: Record<string, { label: string; tone: 'neutral' | 'green' | 'amber' | 'red'; help: string }> = {
  pending:         { label: 'Pending', tone: 'amber', help: 'Waiting to be confirmed.' },
  payment_pending: { label: 'Awaiting payment', tone: 'amber', help: 'The customer hasn’t paid yet.' },
  processing:      { label: 'To ship', tone: 'amber', help: 'Paid — pack it and send it out.' },
  shipped:         { label: 'On the way', tone: 'neutral', help: 'Sent out — mark it delivered when it arrives.' },
  delivered:       { label: 'Delivered', tone: 'green', help: 'Done. 🎉' },
  cancelled:       { label: 'Cancelled', tone: 'red', help: 'This order was cancelled.' },
};

/** The one next step a seller can take (mirrors SellerOrderDetailView.ALLOWED_TRANSITIONS). */
export const NEXT_STEP: Record<string, { to: string; label: string }> = {
  processing: { to: 'shipped', label: 'Mark as sent' },
  shipped: { to: 'delivered', label: 'Mark as delivered' },
};

export const itemName = (i: OrderItem) => i.product_name || i.name || 'Item';
export const itemImage = (i: OrderItem) => i.image || i.image_url || '';
export const itemOptions = (i: OrderItem) => [i.size || i.selectedSize, i.color || i.selectedColor].filter(Boolean).join(' · ');

export const fmtDate = (d: string, withTime = false) => new Date(d).toLocaleString('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
});

/** WhatsApp link for a Gambian number ("7123456" → 2207123456). */
export function waLink(phone: string, text?: string) {
  let digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 7) digits = `220${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// ─── Mariseh vs Alfudi visibility (estore-backend platform_stores.ProductChannel) ──

export type AlfudiStatus = 'pending' | 'approved' | 'rejected' | 'alfudi';
export interface ProductChannel { visible: boolean; alfudi_status: AlfudiStatus; review_note: string }

export const ALFUDI_STATUS: Record<AlfudiStatus, { label: string; tone: 'neutral' | 'green' | 'amber' | 'red'; help: string }> = {
  pending: { label: 'Alfudi: in review', tone: 'amber', help: 'Live on your Mariseh store now. Alfudi is checking it before it also appears on the Alfudi marketplace.' },
  approved: { label: 'Also on Alfudi', tone: 'green', help: 'Approved — this product is also on the Alfudi marketplace.' },
  rejected: { label: 'Not on Alfudi', tone: 'red', help: 'Alfudi didn’t approve it for their marketplace. It’s still on your Mariseh store.' },
  alfudi: { label: 'Alfudi product', tone: 'neutral', help: 'Added through your Alfudi seller dashboard — manage its Alfudi listing there.' },
};
