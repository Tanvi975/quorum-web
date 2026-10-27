
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import MobileBottomNav from "../components/MobileBottomNav";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hideNavigation =
    location.pathname.startsWith("/video-call") ||
    location.pathname.startsWith("/meet/")||
    location.pathname.startsWith("/chat") ||
    location.pathname.startsWith("/onboarding");

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#062C5F]">
      {!hideNavigation && <Sidebar />}

      <main
        className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${
          hideNavigation ? "" : "pb-16 md:pb-0"
        }`}
      >
        {children}
      </main>

      {!hideNavigation && <MobileBottomNav />}
    </div>
  );
}

export default ProtectedRoute;
