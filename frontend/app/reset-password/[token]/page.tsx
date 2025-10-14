// app/reset-password/[token]/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  // Password validation criteria
  const passwordRequirements = [
    { id: 'length', text: 'At least 8 characters', validator: (p: string) => p.length >= 8 },
    { id: 'uppercase', text: 'At least one uppercase letter', validator: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', text: 'At least one lowercase letter', validator: (p: string) => /[a-z]/.test(p) },
    { id: 'number', text: 'At least one number', validator: (p: string) => /[0-9]/.test(p) },
    { id: 'special', text: 'At least one special character', validator: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  // Extract token from params
  useEffect(() => {
    if (params?.token) {
      setToken(params.token as string);
    }
  }, [params]);

  // Validate password
  const validatePassword = (p: string) => {
    const errors = passwordRequirements
      .filter(req => !req.validator(p))
      .map(req => req.text);
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    if (password) {
      validatePassword(password);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (passwordErrors.length > 0) {
      setError('Please fix password validation errors');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await usersApi.resetPassword({
        token,
        new_password: password
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setMessage('Password reset successfully! You can now login with your new password.');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg sm:rounded-xl w-full max-w-sm sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-b from-green-50 via-white to-white rounded-t-lg py-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 bg-clip-text text-transparent">
            Reset your password
          </h2>
          <p className="mt-1 text-sm text-gray-700">
            Enter your new password below
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-4">
          {/* Success and error messages */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 text-sm">{message}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements (only show unmet ones) */}
              {password && passwordErrors.length > 0 && (
                <div className="mt-3 bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-red-700 mb-2">Your password must include:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {passwordErrors.map((errorText) => (
                      <li key={errorText} className="text-red-600 text-sm">{errorText}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-red-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Passwords do not match
                </p>
              )}
              {confirmPassword && password === confirmPassword && password && (
                <p className="mt-2 text-green-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || passwordErrors.length > 0 || password !== confirmPassword}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>

          {/* Back to Home link */}
          <div className="text-center mt-3">
            <Link 
              href="/" 
              className="text-green-700 hover:text-green-800 text-sm font-medium transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
