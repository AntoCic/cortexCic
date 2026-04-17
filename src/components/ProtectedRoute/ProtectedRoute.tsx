import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../db/auth/useAuth";

const ProtectedRoute = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
