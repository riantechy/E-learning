// app/reset-password/[token]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function ResetPasswordPage() {
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

  // Validate password against all criteria
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

    // Validation
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

  const isRequirementMet = (requirementText: string) => {
    return !passwordErrors.includes(requirementText);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white shadow-xl rounded-lg overflow-hidden p-8 text-center">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        

        <div className="bg-white shadow-xl rounded-lg overflow-hidden p-8">
          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="text-center ">
            <h4 className="mt-4 text-3xl font-extrabold text-gray-900">
              Reset your password
            </h4>
            {/* <p className="mt-2 text-sm text-gray-600">
              Create a strong, secure password
            </p> */}
           </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password Requirements */}
              <div className="mt-3 bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((req) => (
                    <li key={req.id} className="flex items-center">
                      {isRequirementMet(req.text) ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                      )}
                      <span className={`text-xs ${isRequirementMet(req.text) ? 'text-green-600' : 'text-gray-500'}`}>
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <XCircleIcon className="h-3 w-3 mr-1" />
                  Passwords do not match
                </p>
              )}
              {confirmPassword && password === confirmPassword && password && (
                <p className="mt-1 text-xs text-green-600 flex items-center">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || passwordErrors.length > 0 || password !== confirmPassword}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

          <div className="mt-6 text-center">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 text-sm">
              Back to login
            </Link>
          </div>
        </div>
        
        
      </div>
    </div>
  );
}