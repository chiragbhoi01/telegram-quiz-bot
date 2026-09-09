'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../lib/api';

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (password: string, username?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem('ret_token');
    const storedUser = localStorage.getItem('ret_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('ret_token');
        localStorage.removeItem('ret_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!token && pathname !== '/login') {
        router.push('/login');
      } else if (token && pathname === '/login') {
        router.push('/');
      }
    }
  }, [token, isLoading, pathname, router]);

  const login = async (password: string, username: string = 'admin'): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { password, username });
      if (res.data && res.data.success) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;

        localStorage.setItem('ret_token', receivedToken);
        localStorage.setItem('ret_user', JSON.stringify(receivedUser));

        setToken(receivedToken);
        setUser(receivedUser);
        router.push('/');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('ret_token');
    localStorage.removeItem('ret_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
