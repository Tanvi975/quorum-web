import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("accessToken");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);


  function login(userData, accessToken, rememberMe = false) {
    setUser(userData);
  
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
  
    const storage = rememberMe ? localStorage : sessionStorage;
  
    storage.setItem("accessToken", accessToken);
    storage.setItem("user", JSON.stringify(userData));
  }
  
  
  function logout() {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
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