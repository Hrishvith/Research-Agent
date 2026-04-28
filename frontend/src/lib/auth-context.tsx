import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  requestOtp: (email: string, purpose: 'register' | 'login') => Promise<{ message: string; devOtp?: string }>;
  verifyOtp: (email: string, otp: string, purpose: 'register' | 'login') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE_URL = import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

function devOtpKey(email: string, purpose: 'register' | 'login') {
  return `research_dev_otp_${email.trim().toLowerCase()}_${purpose}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('research_user');
    return stored ? JSON.parse(stored) : null;
  });

  // On mount, try to refresh user from token if present
  useEffect(() => {
    const token = localStorage.getItem('research_token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('research_user', JSON.stringify(data.user));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const requestOtp = useCallback(async (email: string, purpose: 'register' | 'login') => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Email is required');

    try {
      const res = await fetch(`${BASE_URL}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, purpose }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      if (data.dev_otp) {
        localStorage.setItem(devOtpKey(normalizedEmail, purpose), data.dev_otp);
      }

      return {
        message: data.message || 'OTP sent successfully',
        devOtp: data.dev_otp,
      };
    } catch (error) {
      // Propagate backend error — strict auth required.
      const msg = (error as Error)?.message || 'Failed to send OTP';
      throw new Error(msg);
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string, purpose: 'register' | 'login') => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanedOtp = otp.trim();
    if (!normalizedEmail || !cleanedOtp) throw new Error('Email and OTP are required');

    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, otp: cleanedOtp, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      // if backend returned token and user, persist them
      if (data?.access_token) {
        localStorage.setItem('research_token', data.access_token);
      }
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('research_user', JSON.stringify(data.user));
      }
      return;
    } catch (err) {
      const e = err as Error;
      throw new Error(e.message || 'OTP verification failed');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Invalid credentials');
      // persist token and user
      if (data?.access_token) localStorage.setItem('research_token', data.access_token);
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('research_user', JSON.stringify(data.user));
      }
    } catch (err) {
      const e = err as Error;
      throw new Error(e.message || 'Login failed');
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      if (data?.access_token) localStorage.setItem('research_token', data.access_token);
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('research_user', JSON.stringify(data.user));
      }
    } catch (err) {
      const e = err as Error;
      throw new Error(e.message || 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('research_user');
    localStorage.removeItem('research_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, requestOtp, verifyOtp, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
