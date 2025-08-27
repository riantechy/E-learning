// app/verify-email/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const { user, resendVerificationEmail, loading } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await resendVerificationEmail();
      setSuccess(response.message || 'Verification email sent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
    }
  };

  // Redirect to appropriate dashboard if user is already verified
  useEffect(() => {
    if (user?.is_verified) {
      const getDashboardPath = (role: string): string => {
        switch (role) {
          case 'ADMIN':
            return '/admin-dashboard';
          case 'CONTENT_MANAGER':
            return '/content-manager-dashboard';
          default:
            return '/dashboard';
        }
      };
      router.push(getDashboardPath(user.role));
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-6">
            <svg
              className="mx-auto h-12 w-12 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Verify your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a verification email to{' '}
              <span className="font-medium">{user?.email || 'your email'}</span>. Please check your inbox (and spam/junk folder) and click the link to verify your account.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              'Resend verification email'
            )}
          </button>

          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600">
              Already verified?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}