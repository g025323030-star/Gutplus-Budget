import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="heading-2">לוח מחוונים</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-primary hover:text-red-500 transition-colors"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="text-sm font-medium">יציאה</span>
        </button>
      </header>
      <main className="p-6">
        <p className="body-text">ברוכים הבאים לגוטפלוס!</p>
      </main>
    </div>
  );
}
