import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../context/useAuthStore";

const ProtectedRoute = () => {
  const { token, loading } = useAuthStore();

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

  return <Outlet />;
};

export default ProtectedRoute;
