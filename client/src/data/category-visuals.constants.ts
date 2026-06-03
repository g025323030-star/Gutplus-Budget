import {
  Car,
  HeartPulse,
  Home,
  Plane,
  Shield,
  ShoppingBag,
  Sparkles,
  Tv,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CategoryVisual {
  icon: LucideIcon;
  color: string;
}

const DEFAULT_VISUAL: CategoryVisual = {
  icon: Sparkles,
  color: '#64748B',
};

const VISUALS_BY_NAME: Record<string, CategoryVisual> = {
  'הוצאות ביתיות': { icon: Home, color: '#163351' },
  'מזון וסופר': { icon: ShoppingBag, color: '#358383' },
  'מזון': { icon: ShoppingBag, color: '#358383' },
  'תחבורה': { icon: Car, color: '#D4AF37' },
  'תחבורה ורכב': { icon: Car, color: '#D4AF37' },
  'פנאי ובידור': { icon: Tv, color: '#2D6A4F' },
  'פנאי ותקשורת': { icon: Tv, color: '#2D6A4F' },
  'בריאות': { icon: HeartPulse, color: '#E11D48' },
  'ביטוחים': { icon: Shield, color: '#163351' },
  'מסים': { icon: Wallet, color: '#64748B' },
  'חופשות וחגים': { icon: Plane, color: '#D4AF37' },
  'הכנסות': { icon: Wallet, color: '#2D6A4F' },
};

export const getCategoryVisual = (name: string): CategoryVisual =>
  VISUALS_BY_NAME[name] ?? DEFAULT_VISUAL;
