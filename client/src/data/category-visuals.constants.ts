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
  color: string; // hex — kept for any legacy consumers
  bgClass: string;                  // accordion button bg when open
  textClass: string;                // text + icon color when active
  borderClass: string;              // wrapper border when open
  iconBgClass: string;              // icon container background
  dotClass: string;                 // pill dot background
  pillSelectedBgClass: string;      // pill selected background
  pillSelectedBorderClass: string;  // pill selected border
}

const DEFAULT_VISUAL: CategoryVisual = {
  icon: Sparkles,
  color: '#64748B',
  bgClass: 'bg-slate-100/70',
  textClass: 'text-slate-700',
  borderClass: 'border-slate-200',
  iconBgClass: 'bg-slate-200/60',
  dotClass: 'bg-slate-400',
  pillSelectedBgClass: 'bg-slate-200/60',
  pillSelectedBorderClass: 'border-slate-300',
};

const VISUALS_BY_NAME: Record<string, CategoryVisual> = {
  'החזרי חובות': {
    icon: CreditCard, color: '#4338ca',
    bgClass: 'bg-indigo-50/60', textClass: 'text-indigo-700', borderClass: 'border-indigo-100',
    iconBgClass: 'bg-indigo-100/70', dotClass: 'bg-indigo-400',
    pillSelectedBgClass: 'bg-indigo-100/60', pillSelectedBorderClass: 'border-indigo-200',
  },
  'ביטוחים': {
    icon: Shield, color: '#047857',
    bgClass: 'bg-emerald-50/60', textClass: 'text-emerald-700', borderClass: 'border-emerald-100',
    iconBgClass: 'bg-emerald-100/70', dotClass: 'bg-emerald-400',
    pillSelectedBgClass: 'bg-emerald-100/60', pillSelectedBorderClass: 'border-emerald-200',
  },
  'מנויים': {
    icon: CalendarClock, color: '#334155',
    bgClass: 'bg-slate-100/70', textClass: 'text-slate-700', borderClass: 'border-slate-200',
    iconBgClass: 'bg-slate-200/60', dotClass: 'bg-slate-400',
    pillSelectedBgClass: 'bg-slate-200/60', pillSelectedBorderClass: 'border-slate-300',
  },
  'תקשורת ואינטרנט': {
    icon: Wifi, color: '#0e7490',
    bgClass: 'bg-cyan-50/60', textClass: 'text-cyan-700', borderClass: 'border-cyan-100',
    iconBgClass: 'bg-cyan-100/70', dotClass: 'bg-cyan-400',
    pillSelectedBgClass: 'bg-cyan-100/60', pillSelectedBorderClass: 'border-cyan-200',
  },
  'לימודים': {
    icon: GraduationCap, color: '#6d28d9',
    bgClass: 'bg-violet-50/60', textClass: 'text-violet-700', borderClass: 'border-violet-100',
    iconBgClass: 'bg-violet-100/70', dotClass: 'bg-violet-400',
    pillSelectedBgClass: 'bg-violet-100/60', pillSelectedBorderClass: 'border-violet-200',
  },
  'מעשרות וצדקה': {
    icon: HandHeart, color: '#b45309',
    bgClass: 'bg-amber-50/60', textClass: 'text-amber-700', borderClass: 'border-amber-100',
    iconBgClass: 'bg-amber-100/70', dotClass: 'bg-amber-400',
    pillSelectedBgClass: 'bg-amber-100/60', pillSelectedBorderClass: 'border-amber-200',
  },
  'בריאות': {
    icon: HeartPulse, color: '#be123c',
    bgClass: 'bg-rose-50/60', textClass: 'text-rose-700', borderClass: 'border-rose-100',
    iconBgClass: 'bg-rose-100/70', dotClass: 'bg-rose-400',
    pillSelectedBgClass: 'bg-rose-100/60', pillSelectedBorderClass: 'border-rose-200',
  },
  'מזון': {
    icon: ShoppingBag, color: '#c2410c',
    bgClass: 'bg-orange-50/60', textClass: 'text-orange-700', borderClass: 'border-orange-100',
    iconBgClass: 'bg-orange-100/70', dotClass: 'bg-orange-400',
    pillSelectedBgClass: 'bg-orange-100/60', pillSelectedBorderClass: 'border-orange-200',
  },
  'מזון וסופר': {
    icon: ShoppingBag, color: '#c2410c',
    bgClass: 'bg-orange-50/60', textClass: 'text-orange-700', borderClass: 'border-orange-100',
    iconBgClass: 'bg-orange-100/70', dotClass: 'bg-orange-400',
    pillSelectedBgClass: 'bg-orange-100/60', pillSelectedBorderClass: 'border-orange-200',
  },
  'תחבורה ורכב': {
    icon: Car, color: '#0369a1',
    bgClass: 'bg-sky-50/60', textClass: 'text-sky-700', borderClass: 'border-sky-100',
    iconBgClass: 'bg-sky-100/70', dotClass: 'bg-sky-400',
    pillSelectedBgClass: 'bg-sky-100/60', pillSelectedBorderClass: 'border-sky-200',
  },
  'תחבורה': {
    icon: Car, color: '#0369a1',
    bgClass: 'bg-sky-50/60', textClass: 'text-sky-700', borderClass: 'border-sky-100',
    iconBgClass: 'bg-sky-100/70', dotClass: 'bg-sky-400',
    pillSelectedBgClass: 'bg-sky-100/60', pillSelectedBorderClass: 'border-sky-200',
  },
  'הוצאות ביתיות': {
    icon: Home, color: '#7e22ce',
    bgClass: 'bg-purple-50/60', textClass: 'text-purple-700', borderClass: 'border-purple-100',
    iconBgClass: 'bg-purple-100/70', dotClass: 'bg-purple-400',
    pillSelectedBgClass: 'bg-purple-100/60', pillSelectedBorderClass: 'border-purple-200',
  },
  'הוצאות שוטפות': {
    icon: Receipt, color: '#3f3f46',
    bgClass: 'bg-zinc-100/70', textClass: 'text-zinc-700', borderClass: 'border-zinc-200',
    iconBgClass: 'bg-zinc-200/60', dotClass: 'bg-zinc-400',
    pillSelectedBgClass: 'bg-zinc-200/60', pillSelectedBorderClass: 'border-zinc-300',
  },
  'עמלות': {
    icon: Landmark, color: '#44403c',
    bgClass: 'bg-stone-100/70', textClass: 'text-stone-700', borderClass: 'border-stone-200',
    iconBgClass: 'bg-stone-200/60', dotClass: 'bg-stone-400',
    pillSelectedBgClass: 'bg-stone-200/60', pillSelectedBorderClass: 'border-stone-300',
  },
  'פנאי ובידור': {
    icon: Tv, color: '#0f766e',
    bgClass: 'bg-teal-50/60', textClass: 'text-teal-700', borderClass: 'border-teal-100',
    iconBgClass: 'bg-teal-100/70', dotClass: 'bg-teal-400',
    pillSelectedBgClass: 'bg-teal-100/60', pillSelectedBorderClass: 'border-teal-200',
  },
  'פנאי ותקשורת': {
    icon: Tv, color: '#0f766e',
    bgClass: 'bg-teal-50/60', textClass: 'text-teal-700', borderClass: 'border-teal-100',
    iconBgClass: 'bg-teal-100/70', dotClass: 'bg-teal-400',
    pillSelectedBgClass: 'bg-teal-100/60', pillSelectedBorderClass: 'border-teal-200',
  },
  'מסים': {
    icon: Wallet, color: '#374151',
    bgClass: 'bg-gray-100/70', textClass: 'text-gray-700', borderClass: 'border-gray-200',
    iconBgClass: 'bg-gray-200/60', dotClass: 'bg-gray-400',
    pillSelectedBgClass: 'bg-gray-200/60', pillSelectedBorderClass: 'border-gray-300',
  },
  'חופשות וחגים': {
    icon: Plane, color: '#a16207',
    bgClass: 'bg-yellow-50/60', textClass: 'text-yellow-700', borderClass: 'border-yellow-100',
    iconBgClass: 'bg-yellow-100/70', dotClass: 'bg-yellow-400',
    pillSelectedBgClass: 'bg-yellow-100/60', pillSelectedBorderClass: 'border-yellow-200',
  },
  'הכנסות': {
    icon: Wallet, color: '#15803d',
    bgClass: 'bg-green-50/60', textClass: 'text-green-700', borderClass: 'border-green-100',
    iconBgClass: 'bg-green-100/70', dotClass: 'bg-green-400',
    pillSelectedBgClass: 'bg-green-100/60', pillSelectedBorderClass: 'border-green-200',
  },
  'שונות שוטפות': {
    icon: Boxes, color: '#525252',
    bgClass: 'bg-neutral-100/70', textClass: 'text-neutral-700', borderClass: 'border-neutral-200',
    iconBgClass: 'bg-neutral-200/60', dotClass: 'bg-neutral-400',
    pillSelectedBgClass: 'bg-neutral-200/60', pillSelectedBorderClass: 'border-neutral-300',
  },
};

export const getCategoryVisual = (name: string): CategoryVisual =>
  VISUALS_BY_NAME[name] ?? DEFAULT_VISUAL;
