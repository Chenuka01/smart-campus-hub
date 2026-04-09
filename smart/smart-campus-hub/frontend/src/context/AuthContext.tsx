// @refresh reset
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';
import { clearStoredAuth, getStoredToken, persistAuth } from '@/lib/authStorage';

interface AuthContextType {
  user: AuthResponse | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (data: { email: string; name: string; avatarUrl: string; providerId: string }) => Promise<void>;
  // Real OAuth 2.0: accepts raw Google ID token and verifies server-side
  googleLoginWithToken: (credential: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: AuthResponse) => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  isManager: boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = getStoredToken();

      if (!token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await authApi.getMe();
        const authData: AuthResponse = { ...res.data, token };
        persistAuth(authData);

        if (active) {
          setUser(authData);
        }
      } catch {
        clearStoredAuth();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const data = res.data;
    persistAuth(data);
    setUser(data);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    const data = res.data;
    persistAuth(data);
    setUser(data);
  };

  const googleLogin = async (data: { email: string; name: string; avatarUrl: string; providerId: string }) => {
    const res = await authApi.googleAuth(data);
    const authData = res.data;
    persistAuth(authData);
    setUser(authData);
  };

  // Real OAuth 2.0 — sends Google ID token to backend for server-side verification
  const googleLoginWithToken = async (credential: string) => {
    const res = await authApi.googleVerify(credential);
    const authData = res.data;
    persistAuth(authData);
    setUser(authData);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const updateUser = (data: AuthResponse) => {
    persistAuth(data);
    setUser(data);
  };

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') ?? false;
  const isAdmin = (user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN')) ?? false;
  const isTechnician = user?.roles?.includes('TECHNICIAN') ?? false;
  const isManager = user?.roles?.includes('MANAGER') ?? false;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, googleLoginWithToken, logout, updateUser, isSuperAdmin, isAdmin, isTechnician, isManager, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

