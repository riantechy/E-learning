// components/Modal/LoginModal.tsx
'use client'

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { X, Eye, EyeOff } from 'lucide-react';

// Component to handle useSearchParams
function LoginContent() {
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccessMessage('Email successfully verified! Please log in.');
    }
  }, [searchParams]);

  return (
    <>
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm sm:text-base">{successMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onOpenForgotPassword: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onOpenForgotPassword }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await login(email, password);
      onClose(); // Close modal on successful login
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
      {/* Backdrop click handler */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-lg sm:rounded-xl w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all">
        
        {/* Header - Updated to green gradient */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-gradient-to-b from-green-200 to-white rounded-t-lg sm:rounded-t-xl z-10">
          <h2 className="text-xl h4 sm:text-2xl font-bold text-green-800">Sign in</h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Suspense fallback={
            <div className="text-center py-4 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mr-2"></div>
              Loading...
            </div>
          }>
            <LoginContent />
          </Suspense>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 text-sm sm:text-base">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email-address" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base pr-12"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
              {password && password.length < 6 && (
                <p className="mt-1 text-red-600 text-xs sm:text-sm">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <label className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm sm:text-base text-gray-700">Remember me</span>
              </label>
              
              {/* Updated to red color */}
              <button
                type="button"
                className="text-red-600 hover:text-red-700 text-sm sm:text-base font-medium transition-colors text-left sm:text-right"
                onClick={() => {
                  onClose();
                  onOpenForgotPassword();
                }}
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 sm:py-4 px-4 rounded-lg sm:rounded-xl hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Sign up link - Updated to red color */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
                onClick={() => {
                  onClose();
                  onSwitchToRegister();
                }}
              >
                Create one now
              </button>
            </p>
          </div>

          {/* Additional responsive spacing for very small screens */}
          <div className="mt-4 sm:mt-6 lg:mt-8"></div>
        </div>
      </div>

      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .modal-container {
            margin: 0.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .modal-container {
            margin: 0.25rem;
          }
        }
        
        /* Prevent zoom on input focus for iOS */
        @media (max-width: 768px) {
          input, textarea, select {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}