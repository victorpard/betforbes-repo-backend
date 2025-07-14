import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { apiService, AuthResponse, LoginRequest, RegisterRequest } from '../services/apiService';
import { toast } from 'react-toastify';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearError: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const clearAuthData = () => {
    localStorage.removeItem('betforbes_token');
    localStorage.removeItem('betforbes_refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('betforbes_token');
      const refreshToken = localStorage.getItem('betforbes_refreshToken');
      if (!accessToken) {
        clearAuthData();
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      try {
        const validateRes = await apiService.validateToken();
        setUser(validateRes.data.user);
      } catch (err: any) {
        if (refreshToken) {
          try {
            const refreshRes = await apiService.refreshToken({ refreshToken });
            const { accessToken: newAccess, refreshToken: newRefresh } = refreshRes.data;
            localStorage.setItem('betforbes_token', newAccess);
            localStorage.setItem('betforbes_refreshToken', newRefresh);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
            const validateRes2 = await apiService.validateToken();
            setUser(validateRes2.data.user);
          } catch {
            clearAuthData();
          }
        } else {
          clearAuthData();
        }
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.login({ email, password } as LoginRequest) as AuthResponse;
      if (!res.success || !res.data.tokens.accessToken) {
        throw new Error(res.message || 'Falha no login');
      }
      const { accessToken, refreshToken } = res.data.tokens;
      localStorage.setItem('betforbes_token', accessToken);
      localStorage.setItem('betforbes_refreshToken', refreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(res.data.user);
      toast.success('🎉 Login realizado com sucesso!');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao fazer login');
      clearAuthData();
      toast.error(err.response?.data?.message || err.message || 'Erro ao fazer login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.register({ name, email, password } as RegisterRequest) as AuthResponse;
      if (!res.success || !res.data.tokens.accessToken) {
        throw new Error(res.message || 'Falha no registro');
      }
      const { accessToken, refreshToken } = res.data.tokens;
      localStorage.setItem('betforbes_token', accessToken);
      localStorage.setItem('betforbes_refreshToken', refreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(res.data.user);
      toast.success('🎉 Registro realizado com sucesso!');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao registrar');
      clearAuthData();
      toast.error(err.response?.data?.message || err.message || 'Erro ao registrar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout({ refreshToken: localStorage.getItem('betforbes_refreshToken')! });
    } catch {
    } finally {
      clearAuthData();
      toast.info('Você saiu da conta.');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, error, login, register, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
