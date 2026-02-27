import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

interface AuthContextType {
  user: AuthResponse | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (data: { email: string; name: string; avatarUrl: string; providerId: string }) => Promise<void>;
  // Real OAuth 2.0: accepts raw Google ID token and verifies server-side
  googleLoginWithToken: (credential: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isTechnician: boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const data = res.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    const data = res.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const googleLogin = async (data: { email: string; name: string; avatarUrl: string; providerId: string }) => {
    const res = await authApi.googleAuth(data);
    const authData = res.data;
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    setUser(authData);
  };

  // Real OAuth 2.0 — sends Google ID token to backend for server-side verification
  const googleLoginWithToken = async (credential: string) => {
    const res = await authApi.googleVerify(credential);
    const authData = res.data;
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    setUser(authData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.roles?.includes('ADMIN') ?? false;
  const isTechnician = user?.roles?.includes('TECHNICIAN') ?? false;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, googleLoginWithToken, logout, isAdmin, isTechnician, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
