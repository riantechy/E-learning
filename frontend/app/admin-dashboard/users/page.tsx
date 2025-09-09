'use client'

import { useState, useEffect } from 'react';
import { usersApi, User } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Pagination from 'react-bootstrap/Pagination';
import InputGroup from 'react-bootstrap/InputGroup';
import { Search } from 'lucide-react';

type FormData = Partial<User>;

const defaultForm: FormData = {
  email: '',
  first_name: '',
  last_name: '',
  gender: '',
  phone: '',
  date_of_birth: '',
  county: '',
  education: '',
  training_institution: '',
  agreed_to_terms: false,
  role: 'LEARNER',
  date_registered: '',
};

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getLearners(
        pagination.page,
        pagination.pageSize,
        searchQuery
      );

      if (response.data) {
        setUsers(response.data.results);
        setPagination((prev) => ({
          ...prev,
          total: response.data.count || 0,
        }));
      }
      if (response.error) setError(response.error);
    } catch {
      setError('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;

      if (currentUser) {
        response = await usersApi.updateUser(currentUser.id, formData);
      } else {
        response = await usersApi.register(formData);
      }

      if (response.error) {
        setError(response.error);
      } else {
        setShowModal(false);
        setFormData(defaultForm);
        fetchUsers();
      }
    } catch {
      setError('An error occurred while saving the user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setFormData({ ...defaultForm, ...user });
    setShowModal(true);
  };

  const handleNewUser = () => {
    setCurrentUser(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        const response = await usersApi.deleteUser(userId);

        if (response.error) {
          setError(response.error);
        } else {
          // If we're on a page that would become empty after deletion, go back one page
          if (users.length === 1 && pagination.page > 1) {
            setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          } else {
            fetchUsers();
          }
        }
      } catch {
        setError('Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      ADMIN: 'danger',
      CONTENT_MANAGER: 'primary',
      LEARNER: 'success',
    };
    return <Badge bg={variants[role] || 'secondary'}>{role}</Badge>;
  };

  const getVisiblePages = () => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const currentPage = pagination.page;
    const maxVisible = 5; // Number of visible page buttons
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h2 mb-0">Manage Learners</h1>
          <Button variant="primary" onClick={handleNewUser}>
            Add New Learner
          </Button>
        </div>

        <div className="mb-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search learners by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
              }}
            />
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setSearchQuery('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              disabled={!searchQuery}
            >
              Clear
            </Button>
          </InputGroup>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (<>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Date of Birth</th>
                  <th>County</th>
                  {/* <th>Education</th>
                  <th>Innovation</th> 
                  <th>Role</th>
                  {/* <th>Status</th> */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.first_name}</td>
                    <td>{user.last_name}</td>
                    <td>{user.gender}</td>
                    <td>{user.phone}</td>
                    <td>{user.date_of_birth}</td>
                    <td>{user.county}</td>
                    {/* <td>{user.education}</td>
                    <td>{user.innovation}</td> 
                    <td>{getRoleBadge(user.role)}</td>
                    {/* <td>{user.status}</td> */}
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="info" size="sm" onClick={() => handleEdit(user)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {pagination.total > pagination.pageSize && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.Prev 
                disabled={pagination.page === 1} 
                onClick={() => handlePageChange(pagination.page - 1)} 
              />
              
              {/* Always show first page if not in current range */}
              {getVisiblePages()[0] > 1 && (
                <>
                  <Pagination.Item onClick={() => handlePageChange(1)}>
                    1
                  </Pagination.Item>
                  {getVisiblePages()[0] > 2 && <Pagination.Ellipsis disabled />}
                </>
              )}
              
              {/* Visible page numbers */}
              {getVisiblePages().map(page => (
                <Pagination.Item
                  key={page}
                  active={page === pagination.page}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Pagination.Item>
              ))}
              
              {/* Always show last page if not in current range */}
              {getVisiblePages().slice(-1)[0] < Math.ceil(pagination.total / pagination.pageSize) && (
                <>
                  {getVisiblePages().slice(-1)[0] < Math.ceil(pagination.total / pagination.pageSize) - 1 && (
                    <Pagination.Ellipsis disabled />
                  )}
                  <Pagination.Item 
                    onClick={() => handlePageChange(Math.ceil(pagination.total / pagination.pageSize))}
                  >
                    {Math.ceil(pagination.total / pagination.pageSize)}
                  </Pagination.Item>
                </>
              )}
              
              <Pagination.Next 
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                onClick={() => handlePageChange(pagination.page + 1)} 
              />
            </Pagination>
          </div>
        )}
        </>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{currentUser ? 'Edit User' : 'Add New User'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!!currentUser}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select name="gender" value={formData.gender} onChange={handleInputChange} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Form.Select>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>County</Form.Label>
                  <Form.Control type="text" name="county" value={formData.county} onChange={handleInputChange} required />
                </div>
                {/* <div className="col-md-6 mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Control type="text" name="status" value={formData.status} onChange={handleInputChange} required />
                </div> */}
                <div className="col-md-12 mb-3">
                  <Form.Label>Education</Form.Label>
                  <Form.Control as="textarea" rows={2} name="education" value={formData.education} onChange={handleInputChange} />
                </div>
                {/* <div className="col-md-12 mb-3">
                  <Form.Label>Innovation</Form.Label>
                  <Form.Control as="textarea" rows={2} name="innovation" value={formData.innovation} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Innovation Stage</Form.Label>
                  <Form.Control type="text" name="innovation_stage" value={formData.innovation_stage} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Innovation Industry</Form.Label>
                  <Form.Control type="text" name="innovation_industry" value={formData.innovation_industry} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Innovation in Whitebox</Form.Label>
                  <Form.Control type="text" name="innovation_in_whitebox" value={formData.innovation_in_whitebox} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Training</Form.Label>
                  <Form.Control type="text" name="training" value={formData.training} onChange={handleInputChange} />
                </div> */}
                <div className="col-md-6 mb-3">
                  <Form.Label>Training Institution</Form.Label>
                  <Form.Control type="text" name="training_institution" value={formData.training_institution} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select name="role" value={formData.role} onChange={handleInputChange} required>
                    <option value="LEARNER">Learner</option>
                    <option value="CONTENT_MANAGER">Content Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </Form.Select>
                </div>
                <div className="col-12 mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Agreed to Terms"
                    name="agreed_to_terms"
                    checked={formData.agreed_to_terms}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}