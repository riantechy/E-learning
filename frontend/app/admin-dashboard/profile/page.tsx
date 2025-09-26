'use client'

import { useState, useEffect, useRef } from 'react';
import { usersApi } from '@/lib/api';
import { Menu, Eye, EyeOff, CheckCircle, XCircle, Upload, Edit3 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import { kenyaCounties, educationLevels } from '@/components/data/counties';

export default function ProfilePage() {  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [imageUpdated, setImageUpdated] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Password validation criteria
  const passwordRequirements = [
    { id: 'length', text: 'At least 8 characters', validator: (p: string) => p.length >= 8 },
    { id: 'uppercase', text: 'At least one uppercase letter', validator: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', text: 'At least one lowercase letter', validator: (p: string) => /[a-z]/.test(p) },
    { id: 'number', text: 'At least one number', validator: (p: string) => /[0-9]/.test(p) },
    { id: 'special', text: 'At least one special character', validator: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getProfile();
      if (response.error) {
        setError(response.error);
        return;
      }
      setUser(response.data);
      setProfileImage(response.data.profile_image || '/images/profile.JPG');
      setImageUpdated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  // Form validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!user.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!user.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!user.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]{10,15}$/.test(user.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!user.gender) {
      errors.gender = 'Gender is required';
    }

    if (!user.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(user.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        errors.date_of_birth = 'You must be at least 18 years old';
      }
    }

    if (!user.county) {
      errors.county = 'County is required';
    }

    if (!user.education) {
      errors.education = 'Education level is required';
    }

    if (!user.training_institution?.trim()) {
      errors.training_institution = 'Training institution is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser((prev: any) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'new_password') {
      validatePassword(value);
    }
  };

  const validatePassword = (p: string) => {
    const errors = passwordRequirements
      .filter(req => !req.validator(p))
      .map(req => req.text);
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const getMaxBirthDate = () => {
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return minAgeDate.toISOString().split('T')[0];
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await usersApi.updateUser(user.id, {
        email: user.email,
        status: user.status,
        date_registered: user.date_registered,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        county: user.county,
        education: user.education,
        training_institution: user.training_institution,
      });
      if (response.error) {
        setError(response.error);
        return;
      }
      setUser(response.data);
      setEditMode(false);
      setFormErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState({
    old_password: false,
    new_password: false,
    confirm_password: false,
  });

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords don't match");
      return;
    }
    
    if (passwordErrors.length > 0) {
      setPasswordError('Please fix password validation errors');
      return;
    }

    try {
      setLoading(true);
      setPasswordError('');
      const response = await usersApi.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      if (response.error) {
        setPasswordError(response.error);
        return;
      }
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setPasswordErrors([]);
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profile_image', file);
    try {
      setLoading(true);
      const response = await usersApi.uploadProfileImage(formData);
      if (response.error) {
        setError(response.error);
        return;
      }
      if (response.data) {
        const newImageUrl = `${response.data.profile_image_url}?t=${new Date().getTime()}`;
        setProfileImage(newImageUrl);
        setUser((prev: any) => ({ ...prev, profile_image: newImageUrl }));
        setImageUpdated(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isRequirementMet = (requirementText: string) => {
    return !passwordErrors.includes(requirementText);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h4 className="text-3xl font-bold text-gray-800 mb-6">User Profile</h4>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
            {error}
          </div>
        )}

        {loading && !user ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    Profile
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
                  >
                    Change Password
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body">
              {activeTab === 'profile' && (
                <div className="row">
                  <div className="col-md-4 text-center mb-4 mb-md-0">
                    <div className={styles.profileImageContainer}>
                      <img
                        src={profileImage || '/images/default-profile.png'}
                        alt="Profile"
                        className={`${styles.profileImage} rounded-circle`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/default-profile.png';
                        }}
                      />
                      <div className={styles.imageOverlay} onClick={triggerFileInput}>
                        <Upload size={24} />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="d-none"
                      />
                    </div>
                    <button
                      className="btn btn-outline-primary mt-3"
                      onClick={triggerFileInput}
                    >
                      <Upload size={16} className="me-2" />
                      Upload Photo
                    </button>
                  </div>

                  <div className="col-md-8">
                    {editMode ? (
                      <form onSubmit={handleSubmitProfile}>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">First Name *</label>
                            <input
                              type="text"
                              name="first_name"
                              value={user.first_name || ''}
                              onChange={handleInputChange}
                              className={`form-control ${formErrors.first_name ? 'is-invalid' : ''}`}
                              required
                            />
                            {formErrors.first_name && (
                              <div className="invalid-feedback">{formErrors.first_name}</div>
                            )}
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Last Name *</label>
                            <input
                              type="text"
                              name="last_name"
                              value={user.last_name || ''}
                              onChange={handleInputChange}
                              className={`form-control ${formErrors.last_name ? 'is-invalid' : ''}`}
                              required
                            />
                            {formErrors.last_name && (
                              <div className="invalid-feedback">{formErrors.last_name}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={user.email || ''}
                            onChange={handleInputChange}
                            className="form-control"
                            disabled
                          />
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Phone *</label>
                            <input
                              type="text"
                              name="phone"
                              value={user.phone || ''}
                              onChange={handleInputChange}
                              className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                              placeholder="e.g., 0712345678"
                              required
                            />
                            {formErrors.phone && (
                              <div className="invalid-feedback">{formErrors.phone}</div>
                            )}
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Gender *</label>
                            <select
                              name="gender"
                              value={user.gender || ''}
                              onChange={handleInputChange}
                              className={`form-select ${formErrors.gender ? 'is-invalid' : ''}`}
                              required
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>                              
                            </select>
                            {formErrors.gender && (
                              <div className="invalid-feedback">{formErrors.gender}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Date of Birth *</label>
                            <input
                              type="date"
                              name="date_of_birth"
                              value={user.date_of_birth || ''}
                              onChange={handleInputChange}
                              className={`form-control ${formErrors.date_of_birth ? 'is-invalid' : ''}`}
                              max={getMaxBirthDate()}
                              required
                            />
                            {formErrors.date_of_birth ? (
                              <div className="invalid-feedback">{formErrors.date_of_birth}</div>
                            ) : (
                              <div className="form-text">You must be at least 18 years old</div>
                            )}
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">County *</label>
                            <select
                              name="county"
                              value={user.county || ''}
                              onChange={handleInputChange}
                              className={`form-select ${formErrors.county ? 'is-invalid' : ''}`}
                              required
                            >
                              <option value="">Select County</option>
                              {kenyaCounties.map(county => (
                                <option key={county} value={county}>{county}</option>
                              ))}
                            </select>
                            {formErrors.county && (
                              <div className="invalid-feedback">{formErrors.county}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Education Level *</label>
                          <select
                            name="education"
                            value={user.education || ''}
                            onChange={handleInputChange}
                            className={`form-select ${formErrors.education ? 'is-invalid' : ''}`}
                            required
                          >
                            <option value="">Select Education Level</option>
                            {educationLevels.map(level => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                          {formErrors.education && (
                            <div className="invalid-feedback">{formErrors.education}</div>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <label className="form-label">Training Institution *</label>
                          <input
                            type="text"
                            name="training_institution"
                            value={user.training_institution || ''}
                            onChange={handleInputChange}
                            className={`form-control ${formErrors.training_institution ? 'is-invalid' : ''}`}
                            placeholder="e.g., University of Nairobi"
                            required
                          />
                          {formErrors.training_institution && (
                            <div className="invalid-feedback">{formErrors.training_institution}</div>
                          )}
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditMode(false);
                              setFormErrors({});
                            }}
                            className="btn btn-outline-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="card-title">{user.first_name} {user.last_name}</h5>
                          <button
                            onClick={() => setEditMode(true)}
                            className="btn btn-outline-primary"
                          >
                            <Edit3 size={16} className="me-2" />
                            Edit Profile
                          </button>
                        </div>
                        
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                            <p><strong>Gender:</strong> {user.gender || 'Not provided'}</p>
                            <p><strong>Date of Birth:</strong> {user.date_of_birth || 'Not provided'}</p>
                          </div>
                          <div className="col-md-6">
                            <p><strong>County:</strong> {user.county || 'Not provided'}</p>
                            <p><strong>Education:</strong> {user.education || 'Not provided'}</p>
                            <p><strong>Training Institution:</strong> {user.training_institution || 'Not provided'}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                          </div>
                        </div>
                        
                        <hr className="my-4" />
                        
                        <div className="row">
                          <div className="col-md-6">
                            {/* <p><strong>Status:</strong> {user.status || 'Not provided'}</p> */}
                            <p><strong>Joined:</strong> {new Date(user.date_joined).toLocaleDateString()}</p>
                          </div>
                          <div className="col-md-6">
                            {/* <p><strong>Registered:</strong> {user.date_registered || 'Not provided'}</p> */}
                            <p><strong>Last Login:</strong> {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <div className="row justify-content-center">
                  <div className="col-md-8 col-lg-6">
                    <h5 className="card-title text-center mb-4">Change Password</h5>
                    
                    {passwordError && (
                      <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {passwordError}
                        <button type="button" className="btn-close" onClick={() => setPasswordError('')}></button>
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {passwordSuccess}
                        <button type="button" className="btn-close" onClick={() => setPasswordSuccess('')}></button>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmitPassword}>
                      <div className="mb-3">
                        <label className="form-label">Current Password</label>
                        <div className="input-group">
                          <input
                            type={showPassword.old_password ? "text" : "password"}
                            name="old_password"
                            value={passwordForm.old_password}
                            onChange={handlePasswordChange}
                            className="form-control"
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => togglePasswordVisibility('old_password')}
                          >
                            {showPassword.old_password ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <div className="input-group">
                          <input
                            type={showPassword.new_password ? "text" : "password"}
                            name="new_password"
                            value={passwordForm.new_password}
                            onChange={handlePasswordChange}
                            className="form-control"
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => togglePasswordVisibility('new_password')}
                          >
                            {showPassword.new_password ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        
                        {passwordForm.new_password && (
                          <div className="mt-3 p-3 bg-light rounded">
                            <p className="fw-bold mb-2">Password must contain:</p>
                            <ul className="list-unstyled mb-0">
                              {passwordRequirements.map((req) => (
                                <li key={req.id} className="d-flex align-items-center mb-1">
                                  {isRequirementMet(req.text) ? (
                                    <CheckCircle size={16} className="text-success me-2" />
                                  ) : (
                                    <XCircle size={16} className="text-muted me-2" />
                                  )}
                                  <span className={isRequirementMet(req.text) ? 'text-success' : 'text-muted'}>
                                    {req.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label">Confirm New Password</label>
                        <div className="input-group">
                          <input
                            type={showPassword.confirm_password ? "text" : "password"}
                            name="confirm_password"
                            value={passwordForm.confirm_password}
                            onChange={handlePasswordChange}
                            className="form-control"
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => togglePasswordVisibility('confirm_password')}
                          >
                            {showPassword.confirm_password ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                          <div className="text-danger small mt-1">
                            Passwords do not match
                          </div>
                        )}
                        {passwordForm.confirm_password && passwordForm.new_password === passwordForm.confirm_password && (
                          <div className="text-success small mt-1">
                            Passwords match
                          </div>
                        )}
                      </div>
                      
                      <div className="d-grid">
                        <button
                          type="submit"
                          disabled={loading || passwordErrors.length > 0 || passwordForm.new_password !== passwordForm.confirm_password}
                          className="btn btn-primary"
                        >
                          {loading ? 'Changing Password...' : 'Change Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}