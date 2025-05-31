'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, categoriesApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'DRAFT',
  });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, categoriesRes] = await Promise.all([
        coursesApi.getAllCourses(),
        categoriesApi.getAllCategories(),
      ]);

      if (coursesRes.data) setCourses(coursesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (coursesRes.error || categoriesRes.error) {
        setError(coursesRes.error || categoriesRes.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      
      if (currentCourse) {
        response = await coursesApi.updateCourse(currentCourse.id, formData);
      } else {
        response = await coursesApi.createCourse(formData);
      }

      if (response.error) {
        setError(response.error);
      } else {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving the course');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course: any) => {
    setCurrentCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category?.id || '',
      status: course.status,
    });
    setShowModal(true);
  };

  const handleNewCourse = () => {
    setCurrentCourse(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      status: 'DRAFT',
    });
    setShowModal(true);
  };

  const handleStatusAction = async (courseId: string, action: 'approve' | 'reject' | 'publish') => {
    try {
      setLoading(true);
      let response;
      
      if (action === 'approve') {
        response = await coursesApi.approveCourse(courseId);
      } else if (action === 'reject') {
        response = await coursesApi.rejectCourse(courseId, 'Not meeting requirements');
      } else if (action === 'publish') {
        response = await coursesApi.publishCourse(courseId);
      }

      if (response?.error) {
        setError(response.error);
      } else {
        fetchData();
      }
    } catch (err) {
      setError('Failed to update course status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      DRAFT: 'secondary',
      PENDING_REVIEW: 'warning',
      PUBLISHED: 'success',
      ARCHIVED: 'danger',
    };
    return <Badge bg={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h2 mb-0">Manage Courses</h1>
          <Button variant="primary" onClick={handleNewCourse}>
            Add New Course
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}  onClick={() => router.push(`/admin-dashboard/courses/${course.id}/modules`)} 
                style={{ cursor: 'pointer' }}>
                  <td>{course.title}</td>
                  <td>{categories.find(cat => cat.id === course.category)?.name || 'Uncategorized'}</td>
                  <td>{getStatusBadge(course.status)}</td>
                  <td onClick={(e) => e.stopPropagation()}> {/* Prevent click propagation for actions */}
                    <Button variant="info" size="sm" className="me-2" onClick={() => handleEdit(course)}>
                      Edit
                    </Button>
                              <Button 
            variant="primary" 
            size="sm" 
            className="me-2" 
            onClick={() => router.push(`/admin-dashboard/courses/${course.id}/modules`)}
          >
            Manage
          </Button>
                    {course.status === 'PENDING_REVIEW' && (
                      <>
                        <Button variant="success" size="sm" className="me-2" onClick={() => handleStatusAction(course.id, 'approve')}>
                          Approve
                        </Button>
                        <Button variant="danger" size="sm" className="me-2" onClick={() => handleStatusAction(course.id, 'reject')}>
                          Reject
                        </Button>
                      </>
                    )}
                    {course.status === 'DRAFT' && (
                      <Button variant="primary" size="sm" onClick={() => handleStatusAction(course.id, 'publish')}>
                        Publish
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{currentCourse ? 'Edit Course' : 'Add New Course'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </Form.Select>
              </Form.Group>
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