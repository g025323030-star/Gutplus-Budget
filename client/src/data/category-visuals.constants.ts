import {
  Boxes,
  CalendarClock,
  Car,
  CreditCard,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  Plane,
  Receipt,
  Shield,
  ShoppingBag,
  Sparkles,
  Tv,
  Wallet,
  Wifi,
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
  'הוצאות שוטפות': { icon: Receipt, color: '#163351' },
  'תקשורת ואינטרנט': { icon: Wifi, color: '#2D6A4F' },
  'לימודים': { icon: GraduationCap, color: '#358383' },
  'מעשרות וצדקה': { icon: HandHeart, color: '#E11D48' },
  'מנויים': { icon: CalendarClock, color: '#D4AF37' },
  'עמלות': { icon: Landmark, color: '#64748B' },
  'שונות שוטפות': { icon: Boxes, color: '#64748B' },
  'החזרי חובות': { icon: CreditCard, color: '#163351' },
};

export const getCategoryVisual = (name: string): CategoryVisual =>
  VISUALS_BY_NAME[name] ?? DEFAULT_VISUAL;
