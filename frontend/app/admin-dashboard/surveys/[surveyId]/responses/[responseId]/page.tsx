// app/admin-dashboard/surveys/[surveyId]/responses/[responseId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { assessmentsApi } from '@/lib/api'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import AdminSidebar from '@/components/AdminSidebar'
import { Card, Alert, Spinner, Button, Badge, Row, Col } from 'react-bootstrap'
import Link from 'next/link'

interface Answer {
  id: number;
  question: number;
  text_answer?: string;
  choice_answer?: {
    id: number;
    choice_text: string;
  };
  scale_answer?: number;
}

interface SurveyResponse {
  id: number;
  survey: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
    };
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
  submitted_at: string;
  answers: Answer[];
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
}

export default function SurveyResponseDetail() {
  const { surveyId, responseId } = useParams()
  const [response, setResponse] = useState<SurveyResponse | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questionsLoading, setQuestionsLoading] = useState(false)

  const fetchResponse = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!responseId || isNaN(Number(responseId))) {
        setError('Invalid response ID format')
        return
      }

      const responseRes = await assessmentsApi.getSurveyResponse(responseId as string)
      
      if (responseRes.error) {
        setError(responseRes.error)
        return
      }

      if (!responseRes.data) {
        setError('No response data received')
        return
      }

      setResponse(responseRes.data)
      fetchQuestions(responseRes.data.survey.id)
    } catch (err) {
      setError('Failed to load response data')
      console.error('Fetch response error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async (surveyId: string) => {
    try {
      setQuestionsLoading(true)
      const questionsRes = await assessmentsApi.getSurveyQuestions(surveyId)
      
      if (questionsRes.error) {
        console.error('Failed to fetch questions:', questionsRes.error)
        return
      }

      setQuestions(questionsRes.data || [])
    } catch (err) {
      console.error('Fetch questions error:', err)
    } finally {
      setQuestionsLoading(false)
    }
  }

  const getQuestionText = (questionId: number) => {
    const question = questions.find(q => q.id === questionId)
    return question?.question_text || `Question ${questionId}`
  }

  const getQuestionType = (questionId: number) => {
    const question = questions.find(q => q.id === questionId)
    return question?.question_type || 'Unknown'
  }

  useEffect(() => {
    fetchResponse()
  }, [responseId])

  if (loading) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="container py-4">
          <Spinner animation="border" />
          <p className="mt-2">Loading response details...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="container py-4">
          <Alert variant="danger">
            <Alert.Heading>Error loading response</Alert.Heading>
            <p>{error}</p>
            <Button variant="primary" onClick={fetchResponse}>
              Retry
            </Button>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  if (!response) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="container py-4">
          <Alert variant="warning">No response data available</Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Survey Response Details</h2>
            <p className="text-muted mb-0">
              Survey: <strong>{response.survey.title}</strong>
              <br />
              Module: <strong>{response.survey.module.title}</strong>
              <br />
              Submitted by: <strong>{response.user.name || 'Anonymous'}</strong> ({response.user.email}) on {new Date(response.submitted_at).toLocaleString()}
            </p>
          </div>
          <Link 
            href={`/admin-dashboard/surveys/${surveyId}`}
            className="btn btn-outline-secondary"
          >
            Back to Survey
          </Link>
        </div>

        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Response Summary</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Response ID:</strong> {response.id}
                </div>
                <div className="mb-3">
                  <strong>Submission Date:</strong> {new Date(response.submitted_at).toLocaleString()}
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Respondent:</strong> {response.user.name || 'Anonymous'}
                </div>
                <div className="mb-3">
                  <strong>Email:</strong> {response.user.email || 'N/A'}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Question Answers</h5>
              {questionsLoading && <Spinner animation="border" size="sm" />}
            </div>
          </Card.Header>
          <Card.Body>
            {response.answers?.length === 0 ? (
              <Alert variant="info">No answers found for this response</Alert>
            ) : (
              <div className="list-group">
                {response.answers.map((answer) => (
                  <div key={answer.question} className="list-group-item mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-2">{getQuestionText(answer.question)}</h6>
                        <Badge bg="info" className="mb-2">
                          {getQuestionType(answer.question)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-2 p-3 bg-light rounded">
                      {answer.text_answer && (
                        <div className="mb-2">
                          <strong>Text Answer:</strong>
                          <div className="p-2 bg-white rounded mt-1">
                            {answer.text_answer || 'No answer provided'}
                          </div>
                        </div>
                      )}
                      
                      {answer.choice_answer && (
                        <div className="mb-2">
                          <strong>Selected Choice:</strong>
                          <div className="p-2 bg-white rounded mt-1">
                            {answer.choice_answer.choice_text || 'No choice selected'}
                          </div>
                        </div>
                      )}
                      
                      {/* Only show rating for SCALE type questions */}
                      {getQuestionType(answer.question) === 'SCALE' && answer.scale_answer !== undefined && (
                        <div className="mb-2">
                          <strong>Rating:</strong>
                          <div className="d-flex align-items-center mt-1">
                            <div className="me-2">{answer.scale_answer} / 5</div>
                            <div className="progress flex-grow-1" style={{ height: '20px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${(answer.scale_answer / 5) * 100}%` }}
                                aria-valuenow={answer.scale_answer}
                                aria-valuemin={0}
                                aria-valuemax={5}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </DashboardLayout>
  )
}