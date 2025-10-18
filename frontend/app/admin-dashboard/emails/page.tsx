// app/admin-dashboard/bulk-email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { usersApi, User } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { Search, Mail, Users, CheckCircle, XCircle } from 'lucide-react';

interface BulkEmailForm {
  user_ids: string[];
  send_to_all: boolean;
  subject: string;
  message: string;
  is_html: boolean;
}

interface EmailResult {
  user_id: string;
  email: string;
  name: string;
  status: 'sent' | 'failed';
  error?: string;
}

export default function BulkEmailPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [emailResults, setEmailResults] = useState<EmailResult[]>([]);
  const [formData, setFormData] = useState<BulkEmailForm>({
    user_ids: [],
    send_to_all: false,
    subject: '',
    message: '',
    is_html: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use the new endpoint for user selection
      const response = await usersApi.getUsersForSelection();
      
      if (response.data) {
        setUsers(response.data);
      }
      if (response.error) setError(response.error);
    } catch (err) {
      setError('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSendToAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sendToAll = e.target.checked;
    setFormData(prev => ({
      ...prev,
      send_to_all: sendToAll,
    }));
    
    if (!sendToAll) {
      setFormData(prev => ({
        ...prev,
        user_ids: selectedUsers,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Subject and message are required');
      return;
    }

    if (!formData.send_to_all && selectedUsers.length === 0) {
      setError('Please select at least one user or choose "Send to all users"');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      const payload = {
        ...formData,
        user_ids: formData.send_to_all ? [] : selectedUsers,
      };

      const response = await usersApi.bulkEmail(payload);

      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(response.data?.message || 'Emails sent successfully');
        setEmailResults(response.data?.results?.details || []);
        setShowResults(true);
        
        // Reset form
        setFormData({
          user_ids: [],
          send_to_all: false,
          subject: '',
          message: '',
          is_html: false,
        });
        setSelectedUsers([]);
      }
    } catch (err) {
      setError('An error occurred while sending emails');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      ADMIN: 'danger',
      CONTENT_MANAGER: 'primary',
      LEARNER: 'success',
    };
    return <Badge bg={variants[role] || 'secondary'}>{role}</Badge>;
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h4 mb-1">Bulk Email</h1>
            <p className="text-muted mb-0">Send emails to multiple users at once</p>
          </div>
          <Button 
            variant="outline-primary" 
            onClick={() => setShowResults(true)}
            disabled={emailResults.length === 0}
          >
            <Mail size={16} className="me-2" />
            View Results
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="row">
          {/* User Selection Panel */}
          <div className="col-md-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Select Users</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Send to all users"
                    name="send_to_all"
                    checked={formData.send_to_all}
                    onChange={handleSendToAllChange}
                  />
                </Form.Group>

                {!formData.send_to_all && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </Form.Group>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          {selectedUsers.length} of {filteredUsers.length} selected
                        </small>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {loading ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        <Table striped bordered hover size="sm">
                          <thead>
                            <tr>
                              <th style={{ width: '30px' }}></th>
                              <th>User</th>
                              <th>Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((user) => (
                              <tr key={user.id}>
                                <td>
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => handleUserSelection(user.id)}
                                  />
                                </td>
                                <td>
                                  <div>
                                    <div className="fw-semibold">{user.email}</div>
                                    <small className="text-muted">
                                      {user.first_name} {user.last_name}
                                    </small>
                                  </div>
                                </td>
                                <td>{getRoleBadge(user.role)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 text-muted">
                          No users found
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Email Composition Panel */}
          <div className="col-md-8">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Compose Email</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subject *</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Enter email subject"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Message *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={12}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Enter your email message..."
                      required
                    />
                  </Form.Group>

                  {/* <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      label="Format as HTML"
                      name="is_html"
                      checked={formData.is_html}
                      onChange={handleInputChange}
                    />
                    <Form.Text className="text-muted">
                      Check this if your message contains HTML formatting
                    </Form.Text>
                  </Form.Group> */}

                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>
                        {formData.send_to_all 
                          ? `Sending to all ${users.length} users`
                          : `Sending to ${selectedUsers.length} selected users`
                        }
                      </strong>
                    </div>
                    <Button
                      variant="danger"
                      type="submit"
                      disabled={sending || (!formData.send_to_all && selectedUsers.length === 0)}
                    >
                      {sending ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail size={16} className="me-2" />
                          Send Bulk Email
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Results Modal */}
        <Modal show={showResults} onHide={() => setShowResults(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Email Sending Results</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {emailResults.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailResults.map((result, index) => (
                      <tr key={index}>
                        <td>
                          {result.status === 'sent' ? (
                            <Badge bg="success">
                              <CheckCircle size={14} className="me-1" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge bg="danger">
                              <XCircle size={14} className="me-1" />
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td>{result.name}</td>
                        <td>{result.email}</td>
                        <td>
                          <small className="text-danger">{result.error}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                No results to display
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResults(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </DashboardLayout>
  );
}