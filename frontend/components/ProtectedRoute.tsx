// components/ProtectedRoute.tsx
'use client'

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }: { children: React.ReactNode, requiredRole?: string | null }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      router.push('/unauthorized');
    }
  }, [loading, isAuthenticated, user, router, requiredRole]);

  if (loading || !isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}