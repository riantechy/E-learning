// app/register/page.tsx
'use client'

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function RegisterPage() {
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

  // Password requirements
  const passwordRequirements = [
    { id: 1, text: 'At least 8 characters', met: false },
    { id: 2, text: 'At least one uppercase letter', met: false },
    { id: 3, text: 'At least one lowercase letter', met: false },
    { id: 4, text: 'At least one number', met: false },
    { id: 5, text: 'At least one special character', met: false },
  ];

  const checkPasswordStrength = (password: string) => {
    const requirements = [
      password.length >= 8, // At least 8 characters
      /[A-Z]/.test(password), // Uppercase letter
      /[a-z]/.test(password), // Lowercase letter
      /[0-9]/.test(password), // Number
      /[^A-Za-z0-9]/.test(password), // Special character
    ];
    
    // Calculate strength (0-5)
    const strength = requirements.filter(Boolean).length;
    setPasswordStrength(strength);
    
    // Update which requirements are met
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

    // Phone validation (basic Kenyan phone format)
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
    
    // Check password strength in real-time
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    
    // Clear error when user starts typing
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
    
    // Clear date error when user selects a date
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
        router.push('/login');
      }, 3000);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      });
    }
  };

  const counties = [
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta',
    'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
    'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
    'Nyeri', 'Kirinyaga', 'Muranga', 'Kiambu', 'Turkana', 'West Pokot',
    'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi',
    'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho',
    'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya',
    'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
  ];

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    if (passwordStrength === 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength === 3) return 'Medium';
    if (passwordStrength === 4) return 'Strong';
    return 'Very Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-8 max-w-2xl w-full">
        <div className="text-center">
          <h4 className="text-3xl font-extrabold text-gray-900">Create a new account</h4>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
              Sign in here
            </Link>
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-red-700">{errors.submit}</p>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                className={`mt-1 block w-full border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                placeholder="Enter first name"
                value={formData.first_name}
                onChange={handleChange}
              />
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                className={`mt-1 block w-full border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                placeholder="Enter last name"
                value={formData.last_name}
                onChange={handleChange}
              />
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 block w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className={`mt-1 block w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                placeholder="e.g., 0712345678 or +254712345678"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                required
                className={`mt-1 block w-full border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
            </div>
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                Date of Birth *
              </label>
              <DatePicker
                id="date_of_birth"
                selected={date}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                className={`mt-1 block w-full border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                placeholderText="Select date of birth"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                maxDate={minDate}
                minDate={new Date('1900-01-01')}
              />
              {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
            </div>
            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700">
                County *
              </label>
              <select
                id="county"
                name="county"
                required
                className={`mt-1 block w-full border ${errors.county ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                value={formData.county}
                onChange={handleChange}
              >
                <option value="">Select County</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
              {errors.county && <p className="mt-1 text-sm text-red-600">{errors.county}</p>}
            </div>
            <div>
              <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                Education Level *
              </label>
              <select
                id="education"
                name="education"
                required
                className={`mt-1 block w-full border ${errors.education ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
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
              {errors.education && <p className="mt-1 text-sm text-red-600">{errors.education}</p>}
            </div>
            <div className="sm:col-span-2 relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                  className={`mt-1 block w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.302z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {formData.password && (
                      <span className={passwordStrength <= 2 ? 'text-red-600' : passwordStrength === 3 ? 'text-yellow-600' : passwordStrength === 4 ? 'text-blue-600' : 'text-green-600'}>
                        {getPasswordStrengthText()}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Password requirements */}
              <div className="mt-2 text-xs text-gray-600">
                <p className="font-medium mb-1">Password must contain:</p>
                <ul className="space-y-1">
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
              
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            
            <div className="sm:col-span-2 relative">
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
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
                  className={`mt-1 block w-full border ${errors.confirm_password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                  placeholder="Confirm your password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.302z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>}
            </div>
          </div>

          <div className="flex items-start">
            <input
              id="agreed_to_terms"
              name="agreed_to_terms"
              type="checkbox"
              className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${errors.agreed_to_terms ? 'border-red-500' : 'border-gray-300'} rounded`}
              checked={formData.agreed_to_terms}
              onChange={handleChange}
            />
            <label htmlFor="agreed_to_terms" className="ml-2 text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agreed_to_terms && <p className="mt-1 text-sm text-red-600">{errors.agreed_to_terms}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}