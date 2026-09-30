import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AUTH_URL = process.env.REACT_APP_AUTH_BASE || "http://localhost:5000/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("scrape_auth_token") || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Sync Axios header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("scrape_auth_token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("scrape_auth_token");
      localStorage.removeItem("scrape_auth_user");
    }
  }, [token]);

  // Check saved session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("scrape_auth_token");
      const savedUser = localStorage.getItem("scrape_auth_user");

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
          // Verify with server
          const res = await axios.get(`${AUTH_URL}/me`);
          setUser(res.data);
          localStorage.setItem("scrape_auth_user", JSON.stringify(res.data));
        } catch (err) {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem("scrape_auth_token");
          localStorage.removeItem("scrape_auth_user");
          delete axios.defaults.headers.common["Authorization"];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError("");
    try {
      const res = await axios.post(`${AUTH_URL}/login`, { email, password });
      const { token: receivedToken, ...userData } = res.data;
      setToken(receivedToken);
      setUser(userData);
      localStorage.setItem("scrape_auth_token", receivedToken);
      localStorage.setItem("scrape_auth_user", JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please check your credentials.";
      setAuthError(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    setAuthError("");
    try {
      const res = await axios.post(`${AUTH_URL}/register`, { name, email, password });
      const { token: receivedToken, ...userData } = res.data;
      setToken(receivedToken);
      setUser(userData);
      localStorage.setItem("scrape_auth_token", receivedToken);
      localStorage.setItem("scrape_auth_user", JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      setAuthError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("scrape_auth_token");
    localStorage.removeItem("scrape_auth_user");
    delete axios.defaults.headers.common["Authorization"];
  };

  const clearError = () => setAuthError("");

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        isAdmin,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
