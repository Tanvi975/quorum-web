import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => login({ name: "Test User" }, "dummy-token-123")}>
        Fake Login
      </button>
      <button onClick={logout}>Logout</button>
      <p>User: {user ? user.name : "Not logged in"}</p>
    </div>
  );
}
export default Dashboard;