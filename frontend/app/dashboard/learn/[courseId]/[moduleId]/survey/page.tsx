// /dashboard/learn/[courseId]/[moduleId]/survey/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { assessmentsApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'
import TopNavbar from '@/components/TopNavbar'
import Link from 'next/link'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'

type SurveyQuestion = {
  id: string
  question_text: string
  question_type: 'MCQ' | 'TEXT' | 'SCALE'
  is_required: boolean
  order: number
  choices?: {
    id: string
    choice_text: string
    order: number
  }[]
}

export default function ModuleSurveyPage() {
  const { courseId, moduleId } = useParams() as { courseId: string; moduleId: string }
  const router = useRouter()
  const [survey, setSurvey] = useState<any>(null)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true)
        const surveyRes = await assessmentsApi.getModuleSurveys(courseId, moduleId)
        
        if (surveyRes.data && surveyRes.data.length > 0) {
          const surveyData = surveyRes.data[0]
          setSurvey(surveyData)
          
          // Use embedded questions if available, otherwise fetch separately
          if (surveyData.questions && surveyData.questions.length > 0) {
            setQuestions(surveyData.questions.sort((a: SurveyQuestion, b: SurveyQuestion) => a.order - b.order))
          } else {
            const questionsRes = await assessmentsApi.getSurveyQuestions(surveyData.id)
            if (questionsRes.data) {
              setQuestions(questionsRes.data.sort((a: SurveyQuestion, b: SurveyQuestion) => a.order - b.order))
            }
          }
        } else {
          setError('No survey found for this module')
        }
      } catch (err) {
        setError('Failed to load survey')
        console.error('Error fetching survey:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSurvey()
  }, [courseId, moduleId])

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Validate required questions
      const requiredQuestions = questions.filter(q => q.is_required);
      const missingAnswers = requiredQuestions.filter(q => !answers[q.id]);

      if (missingAnswers.length > 0) {
        setError(`Please answer all required questions (${missingAnswers.length} remaining)`);
        return;
      }

      // Prepare submission data
      const submissionData = {
        survey_id: survey.id,
        answers: questions.map(question => {
          const answerValue = answers[question.id];
          if (!answerValue) return null;
      
          return {
            question: question.id,  // Ensure UUID is used
            ...(question.question_type === 'TEXT' && { text_answer: String(answerValue) }),
            ...(question.question_type === 'MCQ' && { choice_answer: String(answerValue) }),
            ...(question.question_type === 'SCALE' && { scale_answer: Number(answerValue) })
          };
        }).filter(Boolean)
      };

      const response = await assessmentsApi.submitSurveyResponse(submissionData);

      if (response.error) {
        setError(response.error || 'Failed to submit survey');
      } else {
        setSuccess('Survey submitted successfully!');
        
        // Mark survey as completed in parent component
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('surveyCompleted', { detail: true });
          window.dispatchEvent(event);
        }
        
        setTimeout(() => {
          router.push(`/dashboard/learn/${courseId}`);
        }, 2000);
      }
    } catch (err) {
      setError('An error occurred while submitting the survey');
      console.error('Survey submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto d-flex justify-content-center align-items-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!survey) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto">
            <Alert variant="danger">
              No survey found for this module
              <div className="mt-3">
                <Link href={`/dashboard/learn/${courseId}`} className="btn btn-secondary">
                  Back to course
                </Link>
              </div>
            </Alert>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="d-flex vh-100 bg-light position-relative">
        {/* Mobile Sidebar Toggle */}
        <button 
          className="d-lg-none btn btn-light position-fixed top-2 start-2 z-3"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          style={{ zIndex: 1000 }}
        >
          <Menu className="bi bi-list" />
        </button>

        {/* Sidebar */}
        <div 
          className={`d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm h-100 
            ${mobileSidebarOpen ? 'd-block position-fixed' : 'd-none d-lg-block'}`}
          style={{
            width: sidebarCollapsed ? '80px' : '280px',
            zIndex: 999,
            left: mobileSidebarOpen ? '0' : sidebarCollapsed ? '-80px' : '-280px',
            transition: 'left 0.3s ease, width 0.3s ease'
          }}
        >
          <LearnerSidebar 
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobileOpen={mobileSidebarOpen}
          />
        </div>

        {/* Mobile Overlay */}
        {mobileSidebarOpen && (
          <div 
            className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 998 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        
        <div className="flex-1 d-flex flex-column overflow-hidden w-100">
          <TopNavbar toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />   
          
          <main 
            className="flex-grow-1 overflow-auto"
            style={{
              marginLeft: mobileSidebarOpen 
                ? (sidebarCollapsed ? '80px' : '280px') 
                : '0',
              transition: 'margin-left 0.3s ease'
            }}
          >
            <div className="container-fluid px-3 px-md-4 px-lg-5 py-4">
              {/* Breadcrumb - Responsive */}
              <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item d-none d-sm-inline">
                    <Link href="/dashboard" className="text-decoration-none">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item d-none d-md-inline">
                    <Link href="/dashboard/learn" className="text-decoration-none">My Courses</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href={`/dashboard/learn/${courseId}`} className="text-decoration-none">
                      <span className="d-none d-lg-inline">{survey.course_title}</span>
                      <span className="d-lg-none">Course</span>
                    </Link>
                  </li>
                  <li className="breadcrumb-item active text-truncate" aria-current="page" style={{maxWidth: '150px'}}>
                    Survey
                  </li>
                </ol>
              </nav>

              {/* Survey Card */}
              <div className="card shadow-sm">
                <div className="card-header bg-danger text-white py-3">
                  <h4 className="mb-0 h5 h4-md">{survey.title}</h4>
                </div>
                <div className="card-body p-3 p-md-4">
                  <p className="lead mb-4 fs-6 fs-md-5">{survey.description}</p>
                  
                  {error && (
                    <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-4">
                      {error}
                    </Alert>
                  )}
                  {success && (
                    <Alert variant="success" className="mb-4">
                      {success}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {questions.map((question) => (
                      <Form.Group key={question.id} className="mb-4 p-2 p-md-3 border rounded">
                        <Form.Label className="d-flex align-items-center gap-2 fw-semibold mb-3 fs-6">
                          {question.question_text}
                          {question.is_required && (
                            <span className="text-danger">*</span>
                          )}
                        </Form.Label>
                        
                        {question.question_type === 'MCQ' && question.choices && (
                          <div className="ps-0 ps-md-3">
                            {question.choices.sort((a, b) => a.order - b.order).map((choice) => (
                              <Form.Check
                                key={choice.id}
                                type="radio"
                                id={`${question.id}-${choice.id}`}
                                name={question.id}
                                label={choice.choice_text}
                                required={question.is_required}
                                onChange={() => handleAnswerChange(question.id, choice.id)}
                                checked={answers[question.id] === choice.id}
                                className="mb-2"
                              />
                            ))}
                          </div>
                        )}

                        {question.question_type === 'TEXT' && (
                          <Form.Control
                            as="textarea"
                            rows={3}
                            required={question.is_required}
                            value={answers[question.id] as string || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-100"
                          />
                        )}

                        {question.question_type === 'SCALE' && (
                          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 gap-md-3 ps-0 ps-md-3">
                            <div className="d-flex flex-wrap gap-2 gap-md-3">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <Form.Check
                                  key={num}
                                  type="radio"
                                  id={`${question.id}-${num}`}
                                  name={question.id}
                                  label={num}
                                  inline
                                  required={question.is_required}
                                  onChange={() => handleAnswerChange(question.id, num)}
                                  checked={answers[question.id] === num}
                                />
                              ))}
                            </div>
                            <small className="text-muted mt-1 mt-md-0 fs-7">
                              (1 = Strongly Disagree, 5 = Strongly Agree)
                            </small>
                          </div>
                        )}
                      </Form.Group>
                    ))}

                    {/* Action Buttons - Responsive */}
                    <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 gap-sm-3 mt-4 pt-3 border-top">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => router.push(`/dashboard/learn/${courseId}`)}
                        disabled={submitting}
                        className="order-2 order-sm-1"
                      >
                        <span className="d-none d-sm-inline">Skip Survey</span>
                        <span className="d-sm-none">Skip</span>
                      </Button>
                      <Button 
                        variant="danger" 
                        type="submit"
                        disabled={submitting}
                        className="order-1 order-sm-2"
                      >
                        {submitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            <span className="d-none d-sm-inline">Submitting...</span>
                            <span className="d-sm-none">Submitting</span>
                          </>
                        ) : (
                          <>
                            <span className="d-none d-sm-inline">Submit Survey</span>
                            <span className="d-sm-none">Submit</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}