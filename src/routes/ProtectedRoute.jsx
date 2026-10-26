import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MobileBottomNav from "../components/MobileBottomNav";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
 <>
 <div className="pb-15 md:pb-0">
  {children}
  </div>
  <MobileBottomNav />
</>
);
}

export default ProtectedRoute;