// app/admin-dashboard/surveys/[surveyId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { assessmentsApi, Survey, SurveyResponse } from '@/lib/api'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import AdminSidebar from '@/components/AdminSidebar'
import { Table, Card, Alert, Spinner, Button } from 'react-bootstrap'
import Link from 'next/link'

export default function AdminSurveyResponses() {
  const params = useParams()
  const surveyId = Array.isArray(params.surveyId) ? params.surveyId[0] : params.surveyId
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    if (!surveyId) {
      setError('Invalid survey ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [surveyRes, responsesRes] = await Promise.all([
        assessmentsApi.getSurvey(surveyId),
        assessmentsApi.getSurveyResponses(surveyId)
      ])

      if (surveyRes.error || responsesRes.error) {
        setError(surveyRes.error || responsesRes.error || 'Failed to load data')
        return
      }

      setSurvey(surveyRes.data)
      // Debug the response to inspect its structure
      console.log('Survey Response:', surveyRes)
      console.log('Responses Response:', responsesRes)

      // Extract the nested data array, ensure it's an array
      const responseData = Array.isArray(responsesRes.data?.data) ? responsesRes.data.data : []
      setResponses(responseData)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('An error occurred while fetching survey data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [surveyId])

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

  if (!survey) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="container py-4">
          <Alert variant="warning">Survey not found</Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>{survey.title}</h2>
            <p className="text-muted mb-0">{survey.description}</p>
          </div>
          <Button variant="danger" onClick={() => fetchData()}>
            Refresh
          </Button>
        </div>

        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Survey Responses</h5>
            <span className="badge bg-danger">
              {responses.length} {responses.length === 1 ? 'Response' : 'Responses'}
            </span>
          </Card.Header>
          <Card.Body>
            {responses.length === 0 ? (
              <Alert variant="info">No responses yet for this survey</Alert>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Respondent</th>
                      <th>Email</th>
                      <th>Module</th>
                      <th>Submission Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response, index) => (
                      <tr key={response.id}>
                        <td>{index + 1}</td>
                        <td>{response.user?.name || 'Anonymous'}</td>
                        <td>{response.user?.email || 'N/A'}</td>
                        <td>{response.survey?.module?.title || 'N/A'}</td>
                        <td>{new Date(response.submitted_at).toLocaleString()}</td>
                        <td>
                          <Link 
                            href={`/admin-dashboard/surveys/${surveyId}/responses/${response.id}`}
                            className="btn btn-sm btn-outline-danger"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </DashboardLayout>
  )
}