import {
  Megaphone, Image, LayoutGrid, Tags, PanelsTopLeft, Sparkles, Quote, Images, Type, MessageCircle,
  Truck, Shield, Clock, Phone, Star, Leaf, Gift, Heart, Award, MapPin, CreditCard, LayoutTemplate,
  type LucideIcon,
} from 'lucide-react';

export const SECTION_ICONS: Record<string, LucideIcon> = {
  megaphone: Megaphone, image: Image, 'layout-grid': LayoutGrid, tags: Tags, 'panels-top-left': PanelsTopLeft,
  sparkles: Sparkles, quote: Quote, images: Images, type: Type, 'message-circle': MessageCircle,
};

export const sectionIcon = (name: string): LucideIcon => SECTION_ICONS[name] ?? LayoutTemplate;

export const FEATURE_ICONS_MAP: Record<string, LucideIcon> = {
  truck: Truck, shield: Shield, clock: Clock, phone: Phone, star: Star, leaf: Leaf,
  gift: Gift, sparkles: Sparkles, heart: Heart, award: Award, 'map-pin': MapPin, 'credit-card': CreditCard,
};
