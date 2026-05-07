import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../../context/useAuthStore";

const ProtectedRoute = () => {
  const { token, loading, user } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const onTenantSetup = location.pathname === "/tenant-setup";
  if (!user?.tenant_id && !onTenantSetup) {
    return <Navigate to="/tenant-setup" replace />;
  }

  if (user?.tenant_id && onTenantSetup) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
