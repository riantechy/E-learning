// app/admin-dashboard/courses/[courseId]/modules/[moduleId]/survey/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assessmentsApi, coursesApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Link from 'next/link';

export default function ModuleSurveyPage() {
  const { courseId, moduleId } = useParams() as { courseId: string; moduleId: string };
  const router = useRouter();
  const [survey, setSurvey] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: '',
  });

  useEffect(() => {
    fetchData();
  }, [courseId, moduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [moduleRes, surveyRes] = await Promise.all([
        coursesApi.getModule(courseId, moduleId),
        assessmentsApi.getModuleSurveys(courseId, moduleId),
      ]);

      if (moduleRes.data) setModule(moduleRes.data);
      if (surveyRes.data && surveyRes.data.length > 0) {
        const surveyData = surveyRes.data[0]; 
        setSurvey(surveyData);
        setFormData({
          title: surveyData.title,
          description: surveyData.description,
          questions: surveyData.questions.join('\n'),
        });
      } else {
        setSurvey(null);
        setFormData({
          title: '',
          description: '',
          questions: '',
        });
      }
      if (moduleRes.error || surveyRes.error) {
        setError(moduleRes.error || surveyRes.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
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
      
      const dataToSend = {
        ...formData,
        questions: formData.questions.split('\n').filter(q => q.trim() !== ''),
      };
      
      if (survey) {
        response = await assessmentsApi.updateModuleSurvey(
          courseId,
          moduleId,
          survey.id,
          dataToSend
        );
      } else {
        response = await assessmentsApi.createModuleSurvey(
          courseId,
          moduleId,
          dataToSend
        );
      }

      if (response.error) {
        setError(response.error);
      } else {
        fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving the survey');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this survey?')) {
      try {
        setLoading(true);
        const response = await assessmentsApi.deleteModuleSurvey(
          courseId,
          moduleId,
          survey.id
        );

        if (response.error) {
          setError(response.error);
        } else {
          router.push(`/admin-dashboard/courses/${courseId}/modules/${moduleId}`);
        }
      } catch (err) {
        setError('Failed to delete survey');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h2 mb-0">Manage Module Survey</h1>
            {module && (
              <p className="text-muted mb-0">
                Module: {module.title} - Course: {module.course?.title || 'Loading...'}
              </p>
            )}
          </div>
          <Link
            href={`/admin-dashboard/courses/${courseId}/modules`}
            className="btn btn-secondary"
          >
            Back to Module
          </Link>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Survey Title</Form.Label>
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
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Questions (One per line)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="questions"
                value={formData.questions}
                onChange={handleInputChange}
                required
              />
              <Form.Text className="text-muted">
                Enter each question on a new line
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Survey'}
              </Button>
              {survey && (
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete Survey
                </Button>
              )}
              <Link
                href={`/admin-dashboard/courses/${courseId}/modules/${moduleId}`}
                className="btn btn-secondary"
              >
                Cancel
              </Link>
            </div>
          </Form>
        )}
      </div>
    </DashboardLayout>
  );
}