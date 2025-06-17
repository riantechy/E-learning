// app/admin-dashboard/courses/[courseId]/modules/[moduleId]/lessons/page.tsx
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
import Link from 'next/link';

export default function LessonsPage() {
  const { courseId, moduleId } = useParams() as { courseId: string; moduleId: string };
  const [lessons, setLessons] = useState<any[]>([]);
  const [module, setModule] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'VIDEO',
    content: '',
    duration_minutes: 0,
    order: 0,
    is_required: true,
  });

  useEffect(() => {
    fetchData();
  }, [courseId, moduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, moduleRes, lessonsRes] = await Promise.all([
        coursesApi.getCourse(courseId as string),
        coursesApi.getModule(courseId as string, moduleId as string),
        coursesApi.getLessons(courseId as string, moduleId as string),
      ]);

      if (courseRes.data) setCourse(courseRes.data);
      if (moduleRes.data) setModule(moduleRes.data);
      if (lessonsRes.data) setLessons(lessonsRes.data);
      if (courseRes.error || moduleRes.error || lessonsRes.error) {
        setError(courseRes.error || moduleRes.error || lessonsRes.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
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

  // Update the handleSubmit function to include moduleId automatically
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      
      const dataToSend = {
        ...formData,
        module: moduleId as string
      };
      
      if (currentLesson) {
        response = await coursesApi.updateLesson(
          courseId as string, 
          moduleId as string, 
          currentLesson.id, 
          dataToSend
        );
      } else {
        response = await coursesApi.createLesson(
          courseId as string, 
          moduleId as string, 
          dataToSend
        );
      }

      if (response.error) {
        setError(response.error);
      } else {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving the lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lesson: any) => {
    setCurrentLesson(lesson);
    setFormData({
      title: lesson.title,
      content_type: lesson.content_type,
      content: lesson.content,
      duration_minutes: lesson.duration_minutes,
      order: lesson.order,
      is_required: lesson.is_required,
    });
    setShowModal(true);
  };

  const handleNewLesson = () => {
    setCurrentLesson(null);
    setFormData({
      title: '',
      content_type: 'VIDEO',
      content: '',
      duration_minutes: 0,
      order: lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 0,
      is_required: true,
    });
    setShowModal(true);
  };

  const handleDelete = async (lessonId: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      try {
        setLoading(true);
        const response = await coursesApi.deleteLesson(
          courseId as string, 
          moduleId as string, 
          lessonId
        );

        if (response.error) {
          setError(response.error);
        } else {
          fetchData();
        }
      } catch (err) {
        setError('Failed to delete lesson');
      } finally {
        setLoading(false);
      }
    }
  };

  const getContentTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      VIDEO: 'primary',
      PDF: 'danger',
      TEXT: 'success',
      QUIZ: 'warning',
    };
    return <Badge bg={variants[type]}>{type}</Badge>;
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h2 mb-0">Manage Lessons</h1>
            {course && module && (
              <p className="text-muted mb-0">
                Course: {course.title} → Module: {module.title}
              </p>
            )}
          </div>
          <Button variant="primary" onClick={handleNewLesson}>
            Add New Lesson
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
                <th>Type</th>
                <th>Duration</th>
                <th>Required</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.title}</td>
                  <td>{getContentTypeBadge(lesson.content_type)}</td>
                  <td>{lesson.duration_minutes} min</td>
                  <td>{lesson.is_required ? '✅' : '❌'}</td>
                  <td>
                    <Badge bg="info" pill>
                      {lesson.sections_count || 0}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="info" size="sm" className="me-2" onClick={() => handleEdit(lesson)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" className="me-2" onClick={() => handleDelete(lesson.id)}>
                      Delete
                    </Button>
                    <Link
                      href={`/admin-dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/sections`}
                      className="btn btn-secondary btn-sm me-2"
                    >
                      Manage Sections
                    </Link>
                    {lesson.content_type === 'QUIZ' && (
                      <Link
                        href={`/admin-dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/quiz`}
                        className="btn btn-warning btn-sm"
                      >
                        Manage Quiz
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{currentLesson ? 'Edit Lesson' : 'Add New Lesson'}</Modal.Title>
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
                <Form.Label>Content Type</Form.Label>
                <Form.Select
                  name="content_type"
                  value={formData.content_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="VIDEO">Video</option>
                  <option value="PDF">PDF</option>
                  <option value="TEXT">Text</option>
                  <option value="QUIZ">Quiz</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                {formData.content_type === 'VIDEO' && (
                  <>
                    <Form.Control
                      type="text"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="YouTube URL or video file path"
                      required
                    />
                    <Form.Text className="text-muted">
                      Enter a YouTube URL or upload a video file
                    </Form.Text>
                  </>
                )}
                {formData.content_type === 'PDF' && (
                  <>
                    <Form.Control
                      type="text"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="PDF file path"
                      required
                    />
                    <Form.Text className="text-muted">
                      Upload a PDF file and enter the file path here
                    </Form.Text>
                  </>
                )}
                {formData.content_type === 'TEXT' && (
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Lesson content in HTML or Markdown"
                    required
                  />
                )}
                {formData.content_type === 'QUIZ' && (
                  <Form.Control
                    type="text"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Quiz instructions"
                    required
                  />
                )}
              </Form.Group>

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
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
              </div>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Required for course completion"
                  name="is_required"
                  checked={formData.is_required}
                  onChange={handleInputChange}
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