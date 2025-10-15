// components/RegisterModal.tsx
'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import { kenyaCounties } from '../data/counties';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Eye, EyeOff } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    gender: '',
    phone: '',
    date_of_birth: '',
    county: '',
    education: '',
    agreed_to_terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register, loading } = useAuth();
  const router = useRouter();

  // Calculate minimum date (18 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 18);

  const checkPasswordStrength = (password: string) => {
    const requirements = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];
    
    const strength = requirements.filter(Boolean).length;
    setPasswordStrength(strength);
    
    return requirements;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.county) newErrors.county = 'County is required';
    if (!formData.education) newErrors.education = 'Education level is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirm_password) newErrors.confirm_password = 'Please confirm your password';

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Phone validation
    if (formData.phone && !/^(\+?254|0)[7][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (formData.password) {
      const requirementsMet = checkPasswordStrength(formData.password);
      
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      } else if (!requirementsMet[1]) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!requirementsMet[2]) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!requirementsMet[3]) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!requirementsMet[4]) {
        newErrors.password = 'Password must contain at least one special character';
      }
    }

    // Confirm password validation
    if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Age validation (18+ years old)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        newErrors.date_of_birth = 'You must be at least 18 years old';
      }
    }

    // Terms agreement validation
    if (!formData.agreed_to_terms) {
      newErrors.agreed_to_terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDateChange = (date: Date | null) => {
    setDate(date);
    setFormData(prev => ({
      ...prev,
      date_of_birth: date ? date.toISOString().split('T')[0] : ''
    }));
    
    if (errors.date_of_birth) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.date_of_birth;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const { confirm_password, ...submitData } = formData;
      await register(submitData);
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => {
        onClose();
        onSwitchToLogin();
      }, 3000);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      });
    }
  };

  // Close modal on escape key and prevent body scroll
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: '',
        gender: '',
        phone: '',
        date_of_birth: '',
        county: '',
        education: '',
        agreed_to_terms: false,
      });
      setDate(null);
      setErrors({});
      setSuccess('');
    }
  }, [isOpen]);

  const counties = kenyaCounties;

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    if (passwordStrength === 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength === 3) return 'Medium';
    if (passwordStrength === 4) return 'Strong';
    return 'Very Strong';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
      {/* Backdrop click handler */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-lg sm:rounded-xl w-full max-w-2xl lg:max-w-4xl mx-auto max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b top-0 bg-gradient-to-b from-green-200 to-white rounded-t-lg sm:rounded-t-xl z-10">
          <h2 className="text-xl h4 sm:text-2xl font-bold text-green-800">Create account</h2>
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
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 text-sm sm:text-base">{success}</span>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 text-sm sm:text-base">{errors.submit}</span>
              </div>
            </div>
          )}

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
                {errors.first_name && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.first_name}</p>}
              </div>
              
              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
                {errors.last_name && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.last_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 0712345678 or +254712345678"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.phone}</p>}
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.gender}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="date_of_birth" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <DatePicker
                  id="date_of_birth"
                  selected={date}
                  onChange={handleDateChange}
                  dateFormat="yyyy-MM-dd"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base ${
                    errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholderText="Select date of birth"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  maxDate={minDate}
                  minDate={new Date('1900-01-01')}
                />
                {errors.date_of_birth && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.date_of_birth}</p>}
              </div>

              {/* County */}
              <div>
                <label htmlFor="county" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  County *
                </label>
                <select
                  id="county"
                  name="county"
                  required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base ${
                    errors.county ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.county}
                  onChange={handleChange}
                >
                  <option value="">Select County</option>
                  {counties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
                {errors.county && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.county}</p>}
              </div>

              {/* Education */}
              <div>
                <label htmlFor="education" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Education Level *
                </label>
                <select
                  id="education"
                  name="education"
                  required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base ${
                    errors.education ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.education}
                  onChange={handleChange}
                >
                  <option value="">Select Education Level</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </select>
                {errors.education && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.education}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base pr-12 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
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
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength <= 2 ? 'text-red-600' : 
                      passwordStrength === 3 ? 'text-yellow-600' : 
                      passwordStrength === 4 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Password requirements */}
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Password must contain:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                    {formData.password.length >= 8 ? '✓' : '•'} At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    {/[A-Z]/.test(formData.password) ? '✓' : '•'} At least one uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    {/[a-z]/.test(formData.password) ? '✓' : '•'} At least one lowercase letter
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    {/[0-9]/.test(formData.password) ? '✓' : '•'} At least one number
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '•'} At least one special character
                  </li>
                </ul>
              </div>
              
              {errors.password && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.password}</p>}
            </div>
            
            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base pr-12 ${
                    errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
              {errors.confirm_password && <p className="mt-1 text-red-600 text-xs sm:text-sm">{errors.confirm_password}</p>}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-2">
              <input
                id="agreed_to_terms"
                name="agreed_to_terms"
                type="checkbox"
                className={`mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded ${
                  errors.agreed_to_terms ? 'border-red-500' : ''
                }`}
                checked={formData.agreed_to_terms}
                onChange={handleChange}
              />
              <label htmlFor="agreed_to_terms" className="text-sm text-gray-700">
                I agree to the{' '}
                  {' '}
                <Link href="/privacy" className="text-red-600 hover:text-red-700 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agreed_to_terms && <p className="text-red-600 text-xs sm:text-sm">{errors.agreed_to_terms}</p>}

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
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              Already have an account?{' '}
              <button
                type="button"
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
                onClick={() => {
                  onClose();
                  onSwitchToLogin();
                }}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}