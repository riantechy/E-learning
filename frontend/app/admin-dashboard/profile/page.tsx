// app/admin-dashboard/profile/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react';
import { usersApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, Alert, Spinner, Form, Button, Tab, Tabs, Image, Col, Row } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      // Set a default profile image if none exists
      setProfileImage(response.data.profile_image || '/images/profile.JPG');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await usersApi.updateUser(user.id, {
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      });
      if (response.error) {
        setError(response.error);
        return;
      }
      setUser(response.data);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords don't match");
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
        setProfileImage(response.data.profile_image_url);
        // Update user in local state
        setUser((prev: any) => ({ ...prev, profile_image: response.data?.profile_image_url }));
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

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <h1 className="h2 mb-4">User Profile</h1>
        
        {error && <Alert variant="danger">{error}</Alert>}

        {loading && !user ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <Card>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => k && setActiveTab(k)}
                className="mb-4"
                id="profile-tabs"
              >
                <Tab eventKey="profile" title="Profile">
                  <div className="mt-4">
                    <Row>
                      <Col md={3} className="text-center">
                        <div className={styles.profileImageContainer}>
                          <Image
                            src={profileImage || '/images/default-profile.png'}
                            roundedCircle
                            width={150}
                            height={150}
                            alt="Profile"
                            className={styles.profileImage}
                          />
                          <div className={styles.imageOverlay} onClick={triggerFileInput}>
                            <span>Change Photo</span>
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                          />
                        </div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="mt-2"
                          onClick={triggerFileInput}
                        >
                          Upload Photo
                        </Button>
                      </Col>
                      <Col md={9}>
                        {editMode ? (
                          <Form onSubmit={handleSubmitProfile}>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>First Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="first_name"
                                    value={user.first_name}
                                    onChange={handleInputChange}
                                    required
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Last Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="last_name"
                                    value={user.last_name}
                                    onChange={handleInputChange}
                                    required
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <Form.Group className="mb-3">
                              <Form.Label>Email</Form.Label>
                              <Form.Control
                                type="email"
                                name="email"
                                value={user.email}
                                onChange={handleInputChange}
                                required
                                disabled
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Phone</Form.Label>
                              <Form.Control
                                type="text"
                                name="phone"
                                value={user.phone}
                                onChange={handleInputChange}
                              />
                            </Form.Group>

                            <div className="d-flex gap-2">
                              <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                              </Button>
                              <Button variant="outline-secondary" onClick={() => setEditMode(false)}>
                                Cancel
                              </Button>
                            </div>
                          </Form>
                        ) : (
                          <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                              <h4>{user.first_name} {user.last_name}</h4>
                              <Button variant="outline-primary" onClick={() => setEditMode(true)}>
                                Edit Profile
                              </Button>
                            </div>

                            <div className="row">
                              <div className="col-md-6">
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                                <p><strong>Role:</strong> {user.role}</p>
                              </div>
                              <div className="col-md-6">
                                <p><strong>Joined:</strong> {new Date(user.date_joined).toLocaleDateString()}</p>
                                <p><strong>Last Login:</strong> {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </Col>
                    </Row>
                  </div>
                </Tab>

                <Tab eventKey="password" title="Change Password">
                  <div className="mt-4">
                    <Form onSubmit={handleSubmitPassword}>
                      <Form.Group className="mb-3">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="old_password"
                          value={passwordForm.old_password}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="new_password"
                          value={passwordForm.new_password}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirm_password"
                          value={passwordForm.confirm_password}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>

                      {passwordError && <Alert variant="danger">{passwordError}</Alert>}
                      {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

                      <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Updating...' : 'Change Password'}
                      </Button>
                    </Form>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}