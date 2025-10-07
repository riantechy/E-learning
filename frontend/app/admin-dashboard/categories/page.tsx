'use client'

import { useState, useEffect } from 'react';
import { categoriesApi, coursesApi } from '@/lib/api'; // Import coursesApi to check linked courses
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [linkedCourses, setLinkedCourses] = useState<any[]>([]); // Store courses linked to category
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesApi.getAllCategories();
  
      // ✅ Handle paginated response (access .results)
      if (response.data?.results) {
        setCategories(response.data.results);
      }
      // Fallback for non-paginated responses
      else if (Array.isArray(response.data)) {
        setCategories(response.data);
      }
      
      if (response.error) setError(response.error);
    } catch (err) {
      setError('An error occurred while fetching categories');
    } finally {
      setLoading(false);
    }
  };

  // Check if category has linked courses
  const checkLinkedCourses = async (categoryId: string) => {
    try {
      const response = await coursesApi.getAllCourses();
      let allCourses = [];
      
      if (response.data?.results) {
        allCourses = response.data.results;
      } else if (Array.isArray(response.data)) {
        allCourses = response.data;
      }
      
      // Filter courses that belong to this category
      const linked = allCourses.filter(course => 
        course.category?.id === categoryId || course.category === categoryId
      );
      setLinkedCourses(linked);
      return linked.length > 0;
    } catch (err) {
      console.error('Error checking linked courses:', err);
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      
      if (currentCategory) {
        response = await categoriesApi.updateCategory(currentCategory.id, formData);
      } else {
        response = await categoriesApi.createCategory(formData);
      }

      if (response.error) {
        setError(response.error);
      } else {
        setShowModal(false);
        fetchCategories();
      }
    } catch (err) {
      setError('An error occurred while saving the category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setShowModal(true);
  };

  const handleNewCategory = () => {
    setCurrentCategory(null);
    setFormData({
      name: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (category: any) => {
    setCategoryToDelete(category);
    
    // Check if category has linked courses
    const hasLinkedCourses = await checkLinkedCourses(category.id);
    
    if (hasLinkedCourses) {
      setShowDeleteWarning(true);
    } else {
      // If no linked courses, proceed with normal deletion
      if (confirm('Are you sure you want to delete this category?')) {
        performDelete(category.id);
      }
    }
  };

  const performDelete = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await categoriesApi.deleteCategory(categoryId);

      if (response.error) {
        setError(response.error);
      } else {
        fetchCategories();
        setShowDeleteWarning(false);
        setCategoryToDelete(null);
      }
    } catch (err) {
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleForceDelete = async () => {
    if (categoryToDelete) {
      if (confirm('WARNING: This category is linked to courses. Deleting it will remove the category association from those courses. Are you sure you want to proceed?')) {
        await performDelete(categoryToDelete.id);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteWarning(false);
    setCategoryToDelete(null);
    setLinkedCourses([]);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h4 mb-0">Manage Categories</h1>
          <Button variant="danger" onClick={handleNewCategory}>
            Add New Category
          </Button>
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
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description || '-'}</td>
                  <td>
                    <Button variant="info" size="sm" className="me-2" onClick={() => handleEdit(category)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClick(category)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Delete Warning Modal */}
        <Modal show={showDeleteWarning} onHide={handleCancelDelete}>
          <Modal.Header closeButton>
            <Modal.Title className="text-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Category Linked to Courses
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning">
              <strong>Warning:</strong> This category is currently linked to {linkedCourses.length} course(s).
            </Alert>
            
            <p>Deleting this category will remove the category association from the following courses:</p>
            
            {linkedCourses.length > 0 && (
              <div className="mt-3">
                <h6>Linked Courses:</h6>
                <ul className="list-group">
                  {linkedCourses.map(course => (
                    <li key={course.id} className="list-group-item">
                      {course.title}
                      <Badge bg="secondary" className="ms-2">
                        {course.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-3">
              <strong>Options:</strong>
              <ul className="mt-2">
                <li>Consider editing the courses to assign them to a different category first</li>
                <li>Or proceed with deletion (courses will become uncategorized)</li>
              </ul>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleForceDelete}>
              Delete Anyway
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add/Edit Category Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{currentCategory ? 'Edit Category' : 'Add New Category'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
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
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}