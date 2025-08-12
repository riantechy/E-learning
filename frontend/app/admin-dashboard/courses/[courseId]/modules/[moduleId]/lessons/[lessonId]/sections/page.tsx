'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { coursesApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';

export default function LessonSectionsPage() {
  const { courseId, moduleId, lessonId } = useParams() as { 
    courseId: string; 
    moduleId: string; 
    lessonId: string 
  };
  const [sections, setSections] = useState<any[]>([]);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentSection, setCurrentSection] = useState<any>(null);
  // UPDATED: Added content_type and video_url fields
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: 'TEXT', // Default to text
    video_url: '',
    order: 0,
    is_subsection: false,
    parent_section: '',
  });

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const [lessonRes, sectionsRes] = await Promise.all([
        coursesApi.getLesson(courseId, moduleId, lessonId),
        coursesApi.getLessonSections(courseId, moduleId, lessonId)
      ]);

      if (lessonRes.data?.results) setLesson(lessonRes.data?.results);
      if (sectionsRes.data?.results) setSections(sectionsRes.data?.results);
      if (lessonRes.error || sectionsRes.error) {
        setError(lessonRes.error || sectionsRes.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const dataToSend = {
        ...formData,
        lesson: lessonId
      };
      
      let response;
      if (currentSection) {
        response = await coursesApi.updateLessonSection(
          courseId, moduleId, lessonId,
          currentSection.id,
          dataToSend
        );
        setSuccess('Section updated successfully!');
      } else {
        response = await coursesApi.createLessonSection(
          courseId, moduleId, lessonId,
          dataToSend
        );
        setSuccess('Section created successfully!');
      }

      if (response.error) {
        setError(response.error);
      } else {
        setShowModal(false);
        await fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving the section');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: any) => {
    setCurrentSection(section);
    // UPDATED: Added content_type and video_url fields
    setFormData({
      title: section.title,
      content: section.content,
      content_type: section.content_type || 'TEXT', // Default to text
      video_url: section.video_url || '',
      order: section.order,
      is_subsection: section.is_subsection,
      parent_section: section.parent_section?.id || '',
    });
    setShowModal(true);
  };

  const handleNewSection = () => {
    setCurrentSection(null);
    // UPDATED: Added content_type and video_url fields
    setFormData({
      title: '',
      content: '',
      content_type: 'TEXT', // Default to text
      video_url: '',
      order: sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 0,
      is_subsection: false,
      parent_section: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section? Any subsections will also be deleted.')) {
      try {
        setLoading(true);
        setError('');
        setSuccess('');
        const response = await coursesApi.deleteLessonSection(courseId, moduleId, lessonId, sectionId);

        if (response.error) {
          setError(response.error);
        } else {
          setSuccess('Section deleted successfully!');
          await fetchData();
        }
      } catch (err) {
        setError('Failed to delete section');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getParentSections = () => {
    return sections.filter(section => !section.is_subsection);
  };

  // NEW: Get badge color based on content type
  const getContentTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      TEXT: 'primary',
      VIDEO: 'danger',
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h2 mb-0">Manage Lesson Sections</h1>
            {lesson && (
              <p className="text-muted mb-0">Lesson: {lesson.title}</p>
            )}
          </div>
          <Button variant="primary" onClick={handleNewSection} disabled={loading}>
            Add New Section
          </Button>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                {/* UPDATED: Added Content Type column */}
                <th>Content Type</th>
                <th>Order</th>
                <th>Parent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.sort((a, b) => a.order - b.order).map((section) => (
                <tr key={section.id}>
                  <td>{section.title}</td>
                  <td>
                    <Badge bg={section.is_subsection ? 'info' : 'primary'}>
                      {section.is_subsection ? 'Subsection' : 'Section'}
                    </Badge>
                  </td>
                  {/* UPDATED: Display content type badge */}
                  <td>
                    {getContentTypeBadge(section.content_type || 'TEXT')}
                  </td>
                  <td>{section.order}</td>
                  <td>
                    {section.parent_section?.title || '-'}
                  </td>
                  <td>
                    <Button 
                      variant="info" 
                      size="sm" 
                      className="me-2" 
                      onClick={() => handleEdit(section)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(section.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{currentSection ? 'Edit Section' : 'Add New Section'}</Modal.Title>
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
                  disabled={loading}
                />
              </Form.Group>

              {/* NEW: Content Type Selector */}
              <Form.Group className="mb-3">
                <Form.Label>Content Type</Form.Label>
                <Form.Select
                  name="content_type"
                  value={formData.content_type}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="TEXT">Text</option>
                  <option value="VIDEO">Video</option>
                </Form.Select>
              </Form.Group>

              {/* NEW: Conditionally render content field based on type */}
              {formData.content_type === 'VIDEO' ? (
                <Form.Group className="mb-3">
                  <Form.Label>Video URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    placeholder="Enter video URL (e.g., https://youtube.com/watch?v=...)"
                    required
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Supported platforms: YouTube, Vimeo, or direct video links
                  </Form.Text>
                </Form.Group>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              )}

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Is Subsection"
                    name="is_subsection"
                    checked={formData.is_subsection}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </Form.Group>

                {formData.is_subsection && (
                  <Form.Group className="col-md-4 mb-3">
                    <Form.Label>Parent Section</Form.Label>
                    <Form.Select
                      name="parent_section"
                      value={formData.parent_section}
                      onChange={handleInputChange}
                      required={formData.is_subsection}
                      disabled={loading}
                    >
                      <option value="">Select parent section</option>
                      {getParentSections().map(section => (
                        <option key={section.id} value={section.id}>
                          {section.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}