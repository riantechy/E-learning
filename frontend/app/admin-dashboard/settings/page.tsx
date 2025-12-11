// pages/admin-dashboard/settings/index.tsx
'use client'

import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Tab, Tabs, Spinner, Modal } from 'react-bootstrap';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import styles from './SettingsPage.module.css';
import { certificatesApi } from '@/lib/api';
import { CertificateTemplate } from '@/lib/api';

// Define interface for formData
interface SettingsFormData {
  siteName: string;
  siteLogo: string;
  timezone: string;
  dateFormat: string;
  maintenanceMode: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<SettingsFormData>({
    siteName: 'Learning Platform',
    siteLogo: '',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    maintenanceMode: false, // Fixed: Use boolean value instead of type
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    file: File | null;
  }>({ name: '', file: null });
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await certificatesApi.getCertificateTemplates();
      if (response.data) {
        setTemplates(response.data.results);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError('Failed to fetch templates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked; // Safe for inputs, undefined for select/textarea
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'templateFile' && e.target.files) {
      setNewTemplate(prev => ({
        ...prev,
        file: e.target.files ? e.target.files[0] : null
      }));
    } else {
      setNewTemplate(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.file) {
      setError('Please provide both a name and a template file');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', newTemplate.name);
      formData.append('template_file', newTemplate.file);

      const response = await certificatesApi.createCertificateTemplate(formData);
      if (response.data) {
        setSuccess('Template uploaded successfully!');
        setNewTemplate({ name: '', file: null });
        fetchTemplates();
      }
    } catch (err) {
      setError('Failed to upload template. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await certificatesApi.deleteCertificateTemplate(id);
      setSuccess('Template deleted successfully!');
      fetchTemplates();
    } catch (err) {
      setError('Failed to delete template. Please try again.');
    }
  };

  const previewTemplate = (template: CertificateTemplate) => {
    // Use the preview endpoint instead of direct media URL
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_HOST || 'http://localhost:8000';
    const url = `${baseUrl}/api/certificates/templates/preview/${template.id}/`;
    
    console.log('Preview URL:', url);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <h5 className="h5 mb-4">System Settings</h5>
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k as string)}
          className="mb-4"
        >
          <Tab eventKey="general" title="General">
            <Card className="mt-3">
              <Card.Body>
                <Card.Title>General Settings</Card.Title>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Site Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="siteName"
                      value={formData.siteName}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Timezone</Form.Label>
                    <Form.Select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time (EST)</option>
                      <option value="PST">Pacific Time (PST)</option>
                      <option value="CET">Central European Time (CET)</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Date Format</Form.Label>
                    <Form.Select
                      name="dateFormat"
                      value={formData.dateFormat}
                      onChange={handleChange}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="maintenanceMode"
                      label="Maintenance Mode"
                      name="maintenanceMode"
                      checked={formData.maintenanceMode}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-muted">
                      When enabled, only administrators can access the site
                    </Form.Text>
                  </Form.Group>

                  <Button variant="danger" type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : 'Save Settings'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="certificates" title="Certificates">
            <Card className="mt-3">
              <Card.Body>
                <Card.Title>Certificate Settings</Card.Title>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                
                <h5 className="mt-4">Upload New Template</h5>
                <Form onSubmit={handleTemplateSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Template Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={newTemplate.name}
                      onChange={handleTemplateChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Template File (PDF or DOCX)</Form.Label>
                    <Form.Control
                      type="file"
                      name="templateFile"
                      onChange={handleTemplateChange}
                      accept=".pdf,.docx"
                      required
                    />
                  </Form.Group>

                  <Button variant="danger" type="submit" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        Uploading...
                      </>
                    ) : 'Upload Template'}
                  </Button>
                </Form>

                <h5 className="mt-5">Existing Templates</h5>
                {isLoading ? (
                  <div className="text-center my-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : templates.length === 0 ? (
                  <p>No templates available</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Uploaded</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.map(template => (
                          <tr key={template.id}>
                            <td>{template.name}</td>
                            <td>{new Date(template.created_at).toLocaleDateString()}</td>
                            <td>
                              <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => previewTemplate(template)}
                              >
                                Preview
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => deleteTemplate(template.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="email" title="Email">
            <Card className="mt-3">
              <Card.Body>
                <Card.Title>Email Settings</Card.Title>
                <p>Configure your email server settings and templates</p>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="notifications" title="Notifications">
            <Card className="mt-3">
              <Card.Body>
                <Card.Title>Notification Settings</Card.Title>
                <p>Configure system notifications and alerts</p>
              </Card.Body>
              <Alert variant="info">
                  This section will be implemented in a future update.
                </Alert>
            </Card>
          </Tab>

          <Tab eventKey="security" title="Security">
            <Card className="mt-3">
              <Card.Body>
                <Card.Title>Security Settings</Card.Title>
                <p>Configure password policies, login security, and more</p>
              </Card.Body>
              <Alert variant="info">
                  This section will be implemented in a future update.
                </Alert>
            </Card>
          </Tab>

          <Tab eventKey="integrations" title="Integrations">
            <Card className="mt-3">
              <Card.Body>
                <Card.Title>Integration Settings</Card.Title>
                <p>Connect with third-party services and APIs</p>
              </Card.Body>
              <Alert variant="info">
                  This section will be implemented in a future update.
                </Alert>
            </Card>
          </Tab>
        </Tabs>
      </div>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Template Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewUrl.endsWith('.pdf') ? (
            <iframe 
              src={previewUrl} 
              width="100%" 
              height="500px" 
              style={{ border: 'none' }}
              title="Certificate Template Preview"
            />
          ) : (
            <div className="text-center py-4">
              <p>Document preview not available for this file type.</p>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-danger">
                Download File
              </a>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
}