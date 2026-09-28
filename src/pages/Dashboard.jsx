import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      await logoutUser(refreshToken);
    } catch (err) {
      console.log("logout request failed");
    }
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-1">
          Welcome, {user ? user.name : "User"}
        </p>
        <p className="text-sm text-gray-400 mb-6">
          {user ? user.email : ""}
        </p>
        <button
          onClick={handleLogout}
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-md"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;