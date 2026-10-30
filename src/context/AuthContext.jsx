
import { createContext, useContext, useState, useEffect } from "react";
import { resetRefreshState } from "../services/api";
import {
  getCurrentUser,
  logoutUser,
} from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const res = await getCurrentUser();

        if (!cancelled) {
          const currentUser = res.data?.user ?? res.user ?? res.data;
          setUser(currentUser || null);

          if (currentUser) {
            localStorage.setItem("user", JSON.stringify(currentUser));
          } else {
            localStorage.removeItem("user");
          }
        }
      } catch (error) {
        if (!cancelled) {
          const status = error?.response?.status;
      
          if (status === 401) {
            setUser(null);
            localStorage.removeItem("user");
          } else {
            console.error("Session restoration failed:", error);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function login(userData) {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  }

  async function logout() {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      resetRefreshState();
      setUser(null);
      localStorage.removeItem("user");
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
