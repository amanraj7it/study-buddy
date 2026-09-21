import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        clearToken();
        setUser(null);
      }
    } catch (err) {
      console.warn("Auth check failed:", err.message);
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [checkAuth]);

  const login = async (username, password) => {
    setError(null);
    try {
      const res = await api.auth.login({ username, password });
      if (res.success && res.data) {
        setToken(res.data.access_token);
        setUser(res.data.user);
        return res.data;
      }
      throw new Error(res.error || "Login failed");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const sendRegistrationOtp = async (username, email, password) => {
    setError(null);
    try {
      const payload = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      };
      const res = await api.auth.sendOtp(payload);
      if (res.success) {
        return res;
      }
      throw new Error(res.error || "Failed to send verification code");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifyRegistrationOtp = async (email, otp) => {
    setError(null);
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      };
      const res = await api.auth.verifyOtp(payload);
      if (res.success && res.data) {
        setToken(res.data.access_token);
        setUser(res.data.user);
        return res.data;
      }
      throw new Error(res.error || "Verification failed");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resendRegistrationOtp = async (email) => {
    setError(null);
    try {
      const res = await api.auth.resendOtp({ email: email.trim().toLowerCase() });
      if (res.success) {
        return res;
      }
      throw new Error(res.error || "Failed to resend code");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (username, email, password) => {
    return sendRegistrationOtp(username, email, password);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setError(null);
  };

  const seedDemo = async () => {
    setError(null);
    try {
      await api.seed();
      return await login("demo", "demo123");
    } catch (err) {
      // If db was already seeded, still attempt login
      try {
        return await login("demo", "demo123");
      } catch {
        setError(err.message);
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        setError,
        isAuthenticated: !!user,
        login,
        register,
        sendRegistrationOtp,
        verifyRegistrationOtp,
        resendRegistrationOtp,
        logout,
        seedDemo,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
