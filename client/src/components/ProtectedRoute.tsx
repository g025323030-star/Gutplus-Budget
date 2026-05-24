import { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIdleTimer } from '../hooks/useIdleTimer';
import IdleWarningModal from './IdleWarningModal';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function ProtectedRoute() {
  const { checkAuth, logout, onboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');
  const { isIdle, resume } = useIdleTimer(IDLE_TIMEOUT_MS);

  useEffect(() => {
    checkAuth().then(ok => setStatus(ok ? 'ok' : 'denied'));
  }, []);

  const handleRenew = async () => {
    const ok = await checkAuth();
    if (ok) {
      resume();
    } else {
      await logout();
      navigate('/login', { replace: true });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (status === 'loading') return null;
  if (status === 'denied') return <Navigate to="/login" replace />;

  const onWelcome = location.pathname === '/welcome';
  if (!onboardingCompleted && !onWelcome) {
    return <Navigate to="/welcome" replace />;
  }
  if (onboardingCompleted && onWelcome) {
    return <Navigate to="/snapshot" replace />;
  }

  return (
    <>
      <Outlet />
      <IdleWarningModal
        isVisible={isIdle}
        onRenew={handleRenew}
        onLogout={handleLogout}
      />
    </>
  );
}
