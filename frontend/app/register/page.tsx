// app/register/page.tsx
'use client'

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { kenyaCounties } from '@/components/data/counties';
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

  const counties = kenyaCounties;

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-secondary';
    if (passwordStrength <= 2) return 'bg-danger';
    if (passwordStrength === 3) return 'bg-warning';
    if (passwordStrength === 4) return 'bg-info';
    return 'bg-success';
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card shadow rounded-lg p-4 p-md-5 w-100" style={{ maxWidth: '900px' }}>
        <div className="text-center mb-4">
          <h4 className="h3 fw-bold text-dark">Create a new account</h4>
          <p className="text-muted mt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-primary text-decoration-none fw-medium">
              Sign in here
            </Link>
          </p>
        </div>

        {success && (
          <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
            <svg
              className="bi flex-shrink-0 me-2 text-success"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
              />
            </svg>
            <div className="text-success">{success}</div>
          </div>
        )}

        {errors.submit && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <svg
              className="bi flex-shrink-0 me-2 text-danger"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
              />
            </svg>
            <div className="text-danger">{errors.submit}</div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="first_name" className="form-label">
                First Name *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                placeholder="Enter first name"
                value={formData.first_name}
                onChange={handleChange}
              />
              {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="last_name" className="form-label">
                Last Name *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                placeholder="Enter last name"
                value={formData.last_name}
                onChange={handleChange}
              />
              {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="email" className="form-label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="phone" className="form-label">
                Phone *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                placeholder="e.g., 0712345678 or +254712345678"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="gender" className="form-label">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                required
                className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="date_of_birth" className="form-label">
                Date of Birth *
              </label>
              <DatePicker
                id="date_of_birth"
                selected={date}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                className={`form-control ${errors.date_of_birth ? 'is-invalid' : ''}`}
                placeholderText="Select date of birth"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                maxDate={minDate}
                minDate={new Date('1900-01-01')}
              />
              {errors.date_of_birth && <div className="invalid-feedback">{errors.date_of_birth}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="county" className="form-label">
                County *
              </label>
              <select
                id="county"
                name="county"
                required
                className={`form-select ${errors.county ? 'is-invalid' : ''}`}
                value={formData.county}
                onChange={handleChange}
              >
                <option value="">Select County</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
              {errors.county && <div className="invalid-feedback">{errors.county}</div>}
            </div>
            <div className="col-md-6">
              <label htmlFor="education" className="form-label">
                Education Level *
              </label>
              <select
                id="education"
                name="education"
                required
                className={`form-select ${errors.education ? 'is-invalid' : ''}`}
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
              {errors.education && <div className="invalid-feedback">{errors.education}</div>}
            </div>
            <div className="col-12">
              <label htmlFor="password" className="form-label">
                Password *
              </label>
              <div className="input-group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="progress mb-1" style={{ height: '6px' }}>
                    <div 
                      className={`progress-bar ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="small text-muted">
                    {formData.password && (
                      <span className={
                        passwordStrength <= 2 ? 'text-danger' : 
                        passwordStrength === 3 ? 'text-warning' : 
                        passwordStrength === 4 ? 'text-info' : 'text-success'
                      }>
                        {getPasswordStrengthText()}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Password requirements */}
              <div className="mt-2 small text-muted">
                <p className="fw-medium mb-1">Password must contain:</p>
                <ul className="list-unstyled small">
                  <li className={formData.password.length >= 8 ? 'text-success' : 'text-muted'}>
                    {formData.password.length >= 8 ? '✓' : '•'} At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? 'text-success' : 'text-muted'}>
                    {/[A-Z]/.test(formData.password) ? '✓' : '•'} At least one uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? 'text-success' : 'text-muted'}>
                    {/[a-z]/.test(formData.password) ? '✓' : '•'} At least one lowercase letter
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? 'text-success' : 'text-muted'}>
                    {/[0-9]/.test(formData.password) ? '✓' : '•'} At least one number
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-success' : 'text-muted'}>
                    {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '•'} At least one special character
                  </li>
                </ul>
              </div>
              
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>
            
            <div className="col-12">
              <label htmlFor="confirm_password" className="form-label">
                Confirm Password *
              </label>
              <div className="input-group">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirm_password && <div className="invalid-feedback">{errors.confirm_password}</div>}
            </div>
          </div>

          <div className="form-check">
            <input
              id="agreed_to_terms"
              name="agreed_to_terms"
              type="checkbox"
              className={`form-check-input ${errors.agreed_to_terms ? 'is-invalid' : ''}`}
              checked={formData.agreed_to_terms}
              onChange={handleChange}
            />
            <label htmlFor="agreed_to_terms" className="form-check-label">
              I agree to the{' '}
              <Link href="/terms" className="text-primary text-decoration-none">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary text-decoration-none">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agreed_to_terms && <div className="invalid-feedback d-block">{errors.agreed_to_terms}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-danger w-100 py-2"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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