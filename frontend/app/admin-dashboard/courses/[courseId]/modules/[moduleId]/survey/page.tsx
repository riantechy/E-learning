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
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import { QuestionTypeBadge } from '@/components/Survey/QuestionTypeBadge';
import { QuestionForm } from '@/components/Survey/QuestionForm';

type Question = {
  id?: string;
  question_text: string;
  question_type: 'MCQ' | 'TEXT' | 'SCALE';
  is_required: boolean;
  order: number;
  choices?: {
    choice_text: string;
    order: number;
  }[];
};

export default function ModuleSurveyPage() {
  const { courseId, moduleId } = useParams() as { courseId: string; moduleId: string };
  const router = useRouter();
  const [survey, setSurvey] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [showCreateSurveyModal, setShowCreateSurveyModal] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [creatingSurvey, setCreatingSurvey] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

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
      
      // Check surveyRes.data.results instead of surveyRes.data
      if (surveyRes.data && surveyRes.data.length > 0) {
        // Find the survey for the current module
        const surveyData = surveyRes.data.find((s: any) => s.module === moduleId);
        
        if (surveyData) {
          setSurvey(surveyData);
          const questionsRes = await assessmentsApi.getSurveyQuestions(surveyData.id);
          if (questionsRes.data) {
            setQuestions(questionsRes.data);
          } else if (surveyData.questions) {
            // Use questions from the survey response if available
            setQuestions(surveyData.questions);
          }
        } else {
          setSurvey(null);
          setQuestions([]);
        }
      } else {
        setSurvey(null);
        setQuestions([]);
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

  // Helper function to show success messages
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 5000);
  };

  // Helper function to show error messages
  const showError = (message: string) => {
    setError(message);
    setShowErrorAlert(true);
    setTimeout(() => setShowErrorAlert(false), 5000);
  };

  const handleCreateSurvey = async () => {
    try {
      setCreatingSurvey(true);
      const response = await assessmentsApi.createModuleSurvey(
        courseId,
        moduleId,
        {
          title: surveyTitle || `${module?.title} Survey`,
          description: surveyDescription || `Survey for ${module?.title} module`,
          module: moduleId 
        }
      );
  
      if (response.error) {
        showError(response.error);
      } else {
        showSuccess('Survey created successfully!');
        setShowCreateSurveyModal(false);
        setSurveyTitle('');
        setSurveyDescription('');
        fetchData();
      }
    } catch (err) {
      setError('Failed to create survey');
    } finally {
      setCreatingSurvey(false);
    }
  };

  const handleDeleteSurvey = async () => {
    if (confirm('Are you sure you want to delete this survey?')) {
      try {
        setLoading(true);
        const response = await assessmentsApi.deleteModuleSurvey(
          courseId,
          moduleId,
          survey.id
        );

        if (response.error) {
          showError(response.error);
        } else {
          showSuccess('Survey deleted successfully!');
          router.push(`/admin-dashboard/courses/${courseId}/modules`);
        }
      } catch (err) {
        setError('Failed to delete survey');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveQuestion = async (questionData: Question) => {
    try {
      setLoading(true);
      const payload: Question = {
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        is_required: questionData.is_required,
        order: questionData.order,
      };
      if (questionData.question_type === 'MCQ' && questionData.choices) {
        payload.choices = questionData.choices.filter(choice => choice.choice_text.trim() !== '');
      }
      console.log('Saving question with payload:', JSON.stringify(payload, null, 2));

      let response;
      if (currentQuestion?.id) {
        response = await assessmentsApi.updateSurveyQuestion(survey.id, currentQuestion.id, payload);
      } else {
        response = await assessmentsApi.createSurveyQuestion(survey.id, payload);
      }

      if (response.error) {
        showError(response.error);
      } else {
        showSuccess(currentQuestion?.id ? 'Question updated!' : 'Question added!');
        setShowQuestionModal(false);
        fetchData();
      }
    } catch (err) {
      setError('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        setLoading(true);
        const response = await assessmentsApi.deleteSurveyQuestion(
          survey.id,
          questionId
        );

        if (response.error) {
          showError(response.error);
        } else {
          showSuccess('Question deleted successfully!');
          fetchData();
        }
      } catch (err) {
        setError('Failed to delete question');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddQuestion = () => {
    setCurrentQuestion({
      question_text: '',
      question_type: 'MCQ',
      is_required: true,
      order: questions.length,
      choices: [
        { choice_text: '', order: 0 },
        { choice_text: '', order: 1 },
      ],
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setShowQuestionModal(true);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h2 mb-0">Module Survey</h1>
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

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {showSuccessAlert && (
          <Alert variant="success" onClose={() => setShowSuccessAlert(false)} dismissible>
            {successMessage}
          </Alert>
        )}

        {showErrorAlert && (
          <Alert variant="danger" onClose={() => setShowErrorAlert(false)} dismissible>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            {!survey ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <h3>No Survey Found</h3>
                  <p className="text-muted mb-4">
                    This module doesn't have a survey yet. Click below to create one.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={handleCreateSurvey} 
                    disabled={creatingSurvey}
                  >
                    {creatingSurvey ? 'Creating...' : 'Create Survey'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="card mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{survey.title}</h5>
                    <Badge bg={survey.is_active ? 'success' : 'secondary'}>
                      {survey.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="card-body">
                    <p>{survey.description}</p>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={handleAddQuestion}
                      >
                        Add Question
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteSurvey}
                      >
                        Delete Survey
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Survey Questions</h5>
                  </div>
                  <div className="card-body">
                    {questions.length === 0 ? (
                      <div className="text-center py-3 text-muted">
                        No questions yet. Add your first question.
                      </div>
                    ) : (
                      <ListGroup variant="flush">
                        {questions.sort((a, b) => a.order - b.order).map((question) => (
                          <ListGroup.Item key={question.id} className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <QuestionTypeBadge type={question.question_type} />
                                {question.is_required && (
                                  <Badge bg="danger">Required</Badge>
                                )}
                              </div>
                              <div>{question.question_text}</div>
                              {question.question_type === 'MCQ' && question.choices && (
                                <div className="mt-2">
                                  <small className="text-muted">Options:</small>
                                  <ul className="mb-0">
                                    {question.choices.sort((a, b) => a.order - b.order).map((choice, idx) => (
                                      <li key={idx}>{choice.choice_text}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => question.id && handleDeleteQuestion(question.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question Modal */}
        <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {currentQuestion?.id ? 'Edit Question' : 'Add New Question'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {currentQuestion && (
              <QuestionForm
                question={currentQuestion}
                onSave={handleSaveQuestion}
                onCancel={() => setShowQuestionModal(false)}
                loading={loading}
              />
            )}
          </Modal.Body>
        </Modal>

        <Modal show={showCreateSurveyModal} onHide={() => setShowCreateSurveyModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Survey</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Survey Title</Form.Label>
                <Form.Control
                  type="text"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  placeholder={`e.g., ${module?.title} Survey`}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  placeholder={`e.g., Survey for ${module?.title} module`}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateSurveyModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSurvey} disabled={loading}>
              {loading ? 'Creating...' : 'Create Survey'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </DashboardLayout>
  );
}