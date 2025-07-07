// app/admin-dashboard/surveys/[surveyId]/responses/[responseId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { assessmentsApi } from '@/lib/api'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import AdminSidebar from '@/components/AdminSidebar'
import { Card, Alert, Spinner, Button, Badge } from 'react-bootstrap'
import Link from 'next/link'

export default function SurveyResponseDetail() {
  const { surveyId, responseId } = useParams()
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchResponse = async () => {
    try {
      setLoading(true)
      const res = await assessmentsApi.getSurveyResponse(responseId)
      
      if (res.error) {
        setError(res.error)
        return
      }

      setResponse(res.data)
    } catch (err) {
      setError('An error occurred while fetching response data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResponse()
  }, [responseId])

  if (loading) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="container py-4">
          <Spinner animation="border" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="container py-4">
          <Alert variant="danger">{error}</Alert>
        </div>
      </DashboardLayout>
    )
  }

  if (!response) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="container py-4">
          <Alert variant="warning">Response not found</Alert>
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
              Submitted by: {response.user?.email || 'Anonymous'} on {new Date(response.submitted_at).toLocaleString()}
            </p>
          </div>
          <Link 
            href={`/admin-dashboard/surveys/${surveyId}`}
            className="btn btn-outline-secondary"
          >
            Back to Survey
          </Link>
        </div>

        <Card>
          <Card.Header>
            <h5 className="mb-0">Answers</h5>
          </Card.Header>
          <Card.Body>
            {response.answers?.length === 0 ? (
              <Alert variant="info">No answers found for this response</Alert>
            ) : (
              <div className="list-group">
                {response.answers?.map((answer: any) => (
                  <div key={answer.id} className="list-group-item">
                    <div className="d-flex justify-content-between">
                      <h6 className="mb-1">{answer.question.question_text}</h6>
                      <Badge bg="info">
                        {answer.question.question_type}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      {answer.text_answer && (
                        <p className="mb-0">{answer.text_answer}</p>
                      )}
                      {answer.choice_answer && (
                        <p className="mb-0">
                          Selected: {answer.choice_answer.choice_text}
                        </p>
                      )}
                      {answer.scale_answer && (
                        <p className="mb-0">
                          Rating: {answer.scale_answer} / 5
                        </p>
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