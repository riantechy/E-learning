// context/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi, ApiResponse } from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  gender?: string;
  phone?: string;
  date_of_birth?: string;
  county?: string;
  education?: string;
  innovation?: string;
  innovation_stage?: string;
  innovation_in_whitebox?: string;
  innovation_industry?: string;
  training?: string;
  training_institution?: string;
  status?: string;
  date_registered?: string;
  date_joined?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  // Add other registration fields as needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
        try {
          setLoading(true);
          const token = localStorage.getItem('access_token');
          if (token) {
            const response: ApiResponse<User> = await usersApi.getProfile();
            if (response.data) {
              setUser(response.data);
            } else if (response.error) {
              // Try to refresh token if access token is invalid
              const refreshToken = localStorage.getItem('refresh_token');
              if (refreshToken) {
                const refreshResponse = await usersApi.refreshToken({ refresh: refreshToken });
                if (refreshResponse.data) {
                  localStorage.setItem('access_token', refreshResponse.data.access);
                  // Retry getting user profile
                  const retryResponse = await usersApi.getProfile();
                  if (retryResponse.data) {
                    setUser(retryResponse.data);
                    return;
                  }
                }
              }
              console.error('Failed to load user:', response.error);
              logout();
            }
          }
        } catch (err) {
          console.error('Failed to load user', err);
          logout();
        } finally {
          setLoading(false);
        }
      }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await usersApi.login({ email, password });
  
      if (response.data) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        setUser(response.data.user);
        
        // Role-based redirection
        switch(response.data.user.role) {
          case 'ADMIN':
            router.push('/admin-dashboard');
            break;
          case 'INSTRUCTOR':
            router.push('/instructor-dashboard');
            break;
          case 'LEARNER':
            router.push('/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await usersApi.create(userData);
  
      if (response.data) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        setUser(response.data.user);
        router.push('/dashboard');
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}