import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../db/auth/useAuth';

const ProtectedRoute = () => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  const isCompleteProfile = location.pathname === '/complete-profile';

  if (!userProfile && !isCompleteProfile) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (userProfile && isCompleteProfile) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
