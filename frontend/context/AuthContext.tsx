// context/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usersApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
  // ... other user fields
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Update the loadUser effect in AuthProvider
  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await usersApi.getProfile();
          if (response.data) {
            setUser(response.data);
            
            // Skip redirection if we're on a verification-related page
            const isVerificationPage = pathname?.startsWith('/verify-email') || 
                                     pathname?.startsWith('/resend-verification');
            
            if (!response.data.is_verified && !isVerificationPage) {
              router.push('/verify-email');
              return;
            }
          } else if (response.error) {
            // Handle token refresh if needed
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const refreshResponse = await usersApi.refreshToken({ refresh: refreshToken });
              if (refreshResponse.data) {
                localStorage.setItem('access_token', refreshResponse.data.access);
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
  }, [pathname, router]);

// Helper function for dashboard paths
function getDashboardPath(role: string): string {
  switch(role) {
    case 'ADMIN':
      return '/admin-dashboard';
    case 'CONTENT_MANAGER':
      return '/content-manager-dashboard';
    default:
      return '/dashboard';
  }
}

  const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    const response = await usersApi.login({ email, password });

    if (response.data) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setUser(response.data.user);
      
      // Wait for state to update before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!response.data.user.is_verified) {
        router.push('/verify-email');
        return;
      }

      // Redirect based on role
      router.push(getDashboardPath(response.data.user.role));
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

  const register = async (userData: any) => {
    try {
      setLoading(true);
      const response = await usersApi.register(userData);

      if (response.data) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        setUser(response.data.user);
        router.push('/verify-email');
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

  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      const response = await usersApi.verifyEmail(token);
      if (response.error) throw new Error(response.error);
      
      // Clear any existing tokens and user data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      
      return response.data;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      setLoading(true);
      const response = await usersApi.resendVerificationEmail();
      if (response.error) throw new Error(response.error);
      return response.data;
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      const response = await usersApi.requestPasswordReset({ email });
      if (response.error) throw new Error(response.error);
      return response.data;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      const response = await usersApi.resetPassword({ token, new_password: newPassword });
      if (response.error) throw new Error(response.error);
      return response.data;
    } catch (error) {
      console.error('Password reset failed:', error);
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
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword,
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