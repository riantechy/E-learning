// app/admin-dashboard/surveys/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { assessmentsApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import AdminSidebar from '@/components/AdminSidebar'
import { Table, Card, Alert, Spinner, Button } from 'react-bootstrap'
import Link from 'next/link'

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const res = await assessmentsApi.getSurveys()
      
      if (res.error) {
        setError(res.error)
        return
      }

      // Extract the surveys from the results array in the response
      setSurveys(res.data || [])
    } catch (err) {
      setError('An error occurred while fetching surveys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSurveys()
  }, [])

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Surveys</h2>
          <Button variant="primary" onClick={() => fetchSurveys()}>
            Refresh
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">All Surveys</h5>
            <span className="badge bg-primary">
              {surveys.length} {surveys.length === 1 ? 'Survey' : 'Surveys'}
            </span>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
              </div>
            ) : surveys.length === 0 ? (
              <Alert variant="info">No surveys found</Alert>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Module</th>
                      <th>Responses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((survey, index) => (
                      <tr key={survey.id}>
                        <td>{index + 1}</td>
                        <td>{survey.title}</td>
                        <td>
                          {survey.module?.title || 'N/A'}
                          {survey.module && (
                            <small className="d-block text-muted">Course: {survey.module.course?.title}</small>
                          )}
                        </td>
                        <td>{survey.responses_count || 0}</td>
                        <td>
                          <span className={`badge ${survey.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {survey.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/admin-dashboard/surveys/${survey.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            View Responses
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