import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";
import DashboardBackground from "../components/DashboardBackground";

function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (err) {
      console.log("logout request failed");
    }
    logout();
    navigate("/login");
  }

  return (
    <div className="relative" style={{ minHeight: "3331px" }}>
      <DashboardBackground />
      <div className="relative z-10 flex flex-col items-center pt-32 p-4">
        <h1 className="text-2xl font-bold text-white mb-6">Welcome!</h1>
        <button
          onClick={handleLogout}
          className="bg-[#0068FF] hover:opacity-90 transition text-white text-sm font-medium px-6 py-2.5 rounded-xl"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;