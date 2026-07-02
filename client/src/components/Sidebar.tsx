import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Wallet,
  Scale,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ICON_STROKE } from '../constants/ui';
import AppLogo from './AppLogo';

const SIDEBAR_COLLAPSED_WIDTH = 64;
const SIDEBAR_EXPANDED_WIDTH = 240;
const ANIMATION_DURATION = 0.25;
const ICON_SIZE = 22;

// Module-level constant — not recreated on every render
const BASE_ITEM_CLASSES =
  'flex items-center gap-3 h-11 px-3 rounded-xl transition-colors duration-200';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/snapshot', label: 'תמונת מצב', icon: LayoutDashboard },
  { to: '/expenses', label: 'הוצאות', icon: TrendingDown },
  { to: '/income', label: 'הכנסות', icon: TrendingUp },
  { to: '/budget', label: 'דף התקציב', icon: Wallet },
  { to: '/assets-liabilities', label: 'נכסים מול התחייבויות', icon: Scale },
];

interface SidebarItemContentProps {
  icon: LucideIcon;
  label: string;
  isExpanded: boolean;
}

function SidebarItemContent({ icon: Icon, label, isExpanded }: SidebarItemContentProps) {
  return (
    <>
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} className="shrink-0" />
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION_DURATION }}
            className="whitespace-nowrap text-sm font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );
}

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Expanded when the user hovers the sidebar (desktop) or the mobile drawer is open.
  const isExpanded = isHovered || isMobileOpen;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION_DURATION }}
            onClick={onMobileClose}
            aria-hidden="true"
            className="fixed inset-0 bg-primary/30 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          width: isExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        }}
        transition={{ duration: ANIMATION_DURATION, ease: 'easeOut' }}
        aria-label="ניווט ראשי"
        className={`fixed top-0 right-0 h-screen bg-surface border-l border-slate-100 shadow-sm z-40 flex flex-col py-6 transition-transform duration-300 ease-out ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 mb-8 min-h-[40px]">
          <div className="flex items-center gap-3">
            <AppLogo size="md" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: ANIMATION_DURATION }}
                  className="text-primary font-bold text-lg whitespace-nowrap"
                >
                  גוטפלוס
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="סגור תפריט"
            className="md:hidden text-primary hover:bg-slate-100 rounded-lg p-1 transition-colors"
          >
            <X size={20} strokeWidth={ICON_STROKE} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                // Only close the mobile drawer when it's actually open (no-op on desktop)
                onClick={isMobileOpen ? onMobileClose : undefined}
                title={label}
                aria-current={isActive ? 'page' : undefined}
                className={`${BASE_ITEM_CLASSES} ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-primary hover:bg-slate-100'
                }`}
              >
                <SidebarItemContent icon={icon} label={label} isExpanded={isExpanded} />
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pt-4 mt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            title="יציאה"
            className={`${BASE_ITEM_CLASSES} w-full text-primary hover:bg-red-50 hover:text-red-600`}
          >
            <SidebarItemContent icon={LogOut} label="יציאה" isExpanded={isExpanded} />
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export { SIDEBAR_COLLAPSED_WIDTH };
