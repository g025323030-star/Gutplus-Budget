import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar, { SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import AppLogo from './AppLogo';
import { ICON_STROKE } from '../constants/ui';

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <header className="md:hidden sticky top-0 z-20 bg-surface border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="פתח תפריט"
          className="p-2 rounded-lg text-primary hover:bg-slate-100 transition-colors"
        >
          <Menu size={24} strokeWidth={ICON_STROKE} />
        </button>
        <div className="flex items-center gap-2">
          <AppLogo size="sm" />
          <span className="text-primary font-bold">גוטפלוס</span>
        </div>
      </header>

      {/* marginRight matches the collapsed sidebar width so content is never covered */}
      <main className="min-h-screen" style={{ marginRight: SIDEBAR_COLLAPSED_WIDTH }}>
        <Outlet />
      </main>
    </div>
  );
}
