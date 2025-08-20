// app/admin-dashboard/courses/[courseId]/modules/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Link from 'next/link';

export default function ModulesPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentModule, setCurrentModule] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, modulesRes] = await Promise.all([
        coursesApi.getCourse(courseId as string),
        coursesApi.getModules(courseId as string),
      ]);

      if (courseRes.data) setCourse(courseRes.data);
      if (modulesRes.data?.results) setModules(modulesRes.data?.results);
      if (courseRes.error || modulesRes.error) {
        setError(courseRes.error || modulesRes.error || 'Failed to fetch data');
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

  // Update the handleSubmit function to include courseId automatically
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      
      const dataToSend = {
        ...formData,
        course: courseId as string 
      };
      
      if (currentModule) {
        response = await coursesApi.updateModule(courseId as string, currentModule.id, dataToSend);
      } else {
        response = await coursesApi.createModule(courseId as string, dataToSend);
      }

      if (response.error) {
        setError(response.error);
      } else {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving the module');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (module: any) => {
    setCurrentModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      order: module.order,
    });
    setShowModal(true);
  };

  const handleNewModule = () => {
    setCurrentModule(null);
    setFormData({
      title: '',
      description: '',
      order: modules.length > 0 ? Math.max(...modules.map(m => m.order)) + 1 : 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (moduleId: string) => {
    if (confirm('Are you sure you want to delete this module? This will also delete all associated lessons and content.')) {
      try {
        setLoading(true);
        const response = await coursesApi.deleteModule(courseId as string, moduleId);

        if (response.error) {
          setError(response.error);
        } else {
          fetchData();
        }
      } catch (err) {
        setError('Failed to delete module');
      } finally {
        setLoading(false);
      }
    }
  };

  // const handleReorder = async (direction: 'up' | 'down', moduleId: string, currentOrder: number) => {
  //   try {
  //     const modulesCopy = [...modules];
  //     const index = modulesCopy.findIndex(m => m.id === moduleId);
  //     if (index < 0) return;

  //     const swapIndex = direction === 'up' ? index - 1 : index + 1;
  //     if (swapIndex < 0 || swapIndex >= modulesCopy.length) return;

  //     // Swap orders
  //     const temp = modulesCopy[index].order;
  //     modulesCopy[index].order = modulesCopy[swapIndex].order;
  //     modulesCopy[swapIndex].order = temp;

  //     // Update both modules
  //     await Promise.all([
  //       coursesApi.updateModule(courseId as string, modulesCopy[index].id, { order: modulesCopy[index].order }),
  //       coursesApi.updateModule(courseId as string, modulesCopy[swapIndex].id, { order: modulesCopy[swapIndex].order }),
  //     ]);

  //     fetchData();
  //   } catch (err) {
  //     setError('Failed to reorder modules');
  //   }
  // };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Course Modules</h2>
            {course && <p className="text-muted mb-0">Course: {course.title}</p>}
          </div>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={handleNewModule}>
              Add Module
            </Button>
            <Link href={`/admin-dashboard/courses`} className="btn btn-secondary">
              Back to Courses
            </Link>
          </div>
        </div>

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

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
                <th>Order</th>
                <th>Title</th>
                <th>Description</th>
                <th>Lessons</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr key={module.id}>
                  <td>{module.order}</td>
                  <td>{module.title}</td>
                  <td>{module.description}</td>
                  <td>{module.lesson_count || 0}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(module)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(module.id)}
                      >
                        Delete
                      </Button>
                      <Link
                        href={`/admin-dashboard/courses/${courseId}/modules/${module.id}/lessons`}
                        className="btn btn-primary btn-sm"
                        title="Manage Lessons"
                      >
                        📚
                      </Link>
                      <Link
                        href={`/admin-dashboard/courses/${courseId}/modules/${module.id}/survey`}
                        className="btn btn-warning btn-sm"
                        title="Manage Survey"
                      >
                        📝 Survey
                      </Link>
                      {/* {module.order > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReorder('up', module.id, module.order)}
                          title="Move Up"
                        >
                          ⬆️
                        </Button>
                      )}
                      {module.order < modules.length - 1 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReorder('down', module.id, module.order)}
                          title="Move Down"
                        >
                          ⬇️
                        </Button>
                      )} */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{currentModule ? 'Edit Module' : 'Add New Module'}</Modal.Title>
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
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Order</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  required
                />
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