import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { isProfileSurveyComplete } from '../lib/profileCompletion';

export default function OnboardingGuard() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Outlet />;
  if (!isProfileSurveyComplete(profile)) {
    return <Navigate to="/profile/complete" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
