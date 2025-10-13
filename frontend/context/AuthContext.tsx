'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usersApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'LEARNER' | 'CONTENT_MANAGER' | 'ADMIN';
  is_active: boolean;
  date_joined: string;
  status: string;
  date_registered: string;
  gender: string;
  profile_image: string | null;
  phone: string;
  date_of_birth: string;
  county: string;
  education: string;
  innovation: string;
  innovation_stage: string;
  innovation_in_whitebox: string;
  innovation_industry: string;
  training: string;
  training_institution: string;
  agreed_to_terms: boolean;
  is_verified: boolean;
  is_staff?: boolean;
  last_login?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<{ message: string }>;
  requestPasswordReset: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await usersApi.getProfile();
          if (response.data) {
            setUser(response.data);

            const isVerificationPage =
              pathname?.startsWith('/verify-email') ||
              pathname?.startsWith('/resend-verification');

            if (!response.data.is_verified && !isVerificationPage) {
              router.push('/verify-email');
              return;
            }
          } else if (response.error) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const refreshResponse = await usersApi.refreshToken(refreshToken);
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
        console.error('* Failed to load user', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [pathname, router]);

  function getDashboardPath(role: string): string {
    switch (role) {
      case 'ADMIN':
        return '/admin-dashboard';
      case 'CONTENT_MANAGER':
        return '/content-manager-dashboard';
      default:
        return '/dashboard';
    }
  }

  // Update the login function in AuthContext
const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    const response = await usersApi.login({ email, password });

    if (response.data) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setUser(response.data.user);

      // Check if password change is required
      if (response.data.requires_password_change) {
        router.push('/change-password?first_login=true');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!response.data.user.is_verified) {
        router.push('/verify-email');
        return;
      }

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

  const register = async (userData: Partial<User>) => {
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

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async (): Promise<{ message: string }> => {
    try {
      setLoading(true);
      const response = await usersApi.resendVerificationEmail();
      if (response.error) throw new Error(response.error);
      return response.data as { message: string };
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
    try {
      setLoading(true);
      const response = await usersApi.requestPasswordReset({ email });
      if (response.error) throw new Error(response.error);
      return response.data as { message: string };
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
    try {
      setLoading(true);
      const response = await usersApi.resetPassword({ token, new_password: newPassword });
      if (response.error) throw new Error(response.error);
      return response.data as { message: string };
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
    router.push('/');
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