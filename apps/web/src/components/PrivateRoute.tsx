import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const profileIncomplete =
    profile !== null && (!profile.occupation || (profile.interests?.length ?? 0) === 0);
  if (profileIncomplete && location.pathname !== '/profile/complete') {
    return <Navigate to="/profile/complete" replace />;
  }

  return <Outlet />;
}
