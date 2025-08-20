
// app/dashboard/scores/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { assessmentsApi } from '@/lib/api'
import { useEffect, useState } from 'react'
import { Card, Table, ProgressBar, Badge, Spinner, Alert } from 'react-bootstrap'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import TopNavbar from '@/components/TopNavbar'
import { Menu } from 'lucide-react'

interface CleanAttempt {
  id: string;
  score: number; // Score is always a number after parsing
  passed: boolean;
  attempt_date: string;
  lesson?: {
    title?: string;
    module?: {
      title?: string;
      course?: {
        title?: string;
      };
    };
  } | null;
}

export default function MyScoresPage() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState<CleanAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true)
        const response = await assessmentsApi.getUserAttempts()

        if (response.data) {
          // Convert the object response to array and clean the data
          const attemptsArray = Object.values(response.data)
            .filter((attempt): attempt is NonNullable<typeof attempt> => attempt !== null && attempt !== undefined)
            .map(attempt => ({
              id: attempt.id || 'unknown-id',
              score: typeof attempt.score === 'number'
                ? attempt.score
                : attempt.score ?? 0, // Extract parsedValue or fallback to 0
              passed: attempt.passed || false,
              attempt_date: attempt.attempt_date || new Date().toISOString(),
              lesson: attempt.lesson || null
            }))

          setAttempts(attemptsArray)
        } else if (response.error) {
          setError(response.error)
        }
      } catch (err) {
        setError('Failed to fetch scores. Please try again later.')
        console.error('Error fetching scores:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchScores()
    }
  }, [user?.id])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  const validAttempts = attempts.filter(attempt => 
    attempt !== null && 
    attempt !== undefined && 
    attempt.id
  )

  const passedCount = validAttempts.filter(a => a.passed).length
  const totalCount = validAttempts.length
  const averageScore = totalCount > 0 
    ? Math.round(validAttempts.reduce((sum, a) => sum + a.score, 0) / totalCount)
    : 0

  return (
    <ProtectedRoute>
      <div className="d-flex vh-100 bg-light position-relative">
        {/* Mobile Sidebar Toggle Button */}
        <button 
          className="d-lg-none btn btn-light position-fixed top-2 start-2 z-3"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          style={{zIndex: 1000}}
        >
          <Menu className="bi bi-list" />
        </button>

        {/* Sidebar */}
        <div 
          className={`d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm h-100 
            ${mobileSidebarOpen ? 'd-block position-fixed' : 'd-none d-lg-block'}`}
          style={{
            width: '280px',
            zIndex: 999,
            left: mobileSidebarOpen ? '0' : '-280px',
            transition: 'left 0.3s ease'
          }}
        >
          <LearnerSidebar />
        </div>

        {/* Overlay for mobile */}
        {mobileSidebarOpen && (
          <div 
            className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{zIndex: 998}}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          
          <main className="flex-grow-1 p-4 overflow-auto">
            <div className="container-fluid">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">My Quiz Scores</h1>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading your scores...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : validAttempts.length === 0 ? (
                <Card>
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-clipboard2-x fs-1 text-muted mb-3"></i>
                    <h5>No quiz attempts found</h5>
                    <p className="text-muted">You haven't completed any quizzes yet.</p>
                  </Card.Body>
                </Card>
              ) : (
                <Card>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Module</th>
                            <th>Lesson</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validAttempts.map((attempt) => {
                            const courseTitle = attempt.lesson?.module?.course?.title ?? 'Unknown'
                            const moduleTitle = attempt.lesson?.module?.title ?? 'Unknown'
                            const lessonTitle = attempt.lesson?.title ?? 'Unknown'

                            return (
                              <tr key={attempt.id}>
                                <td>
                                  <strong>{courseTitle}</strong>
                                </td>
                                <td>{moduleTitle}</td>
                                <td>{lessonTitle}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <ProgressBar
                                      now={attempt.score}
                                      label={`${Math.round(attempt.score)}%`}
                                      variant={attempt.score >= 70 ? 'success' : 'danger'}
                                      style={{ width: '100px' }}
                                      className="me-2"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <Badge bg={attempt.passed ? 'success' : 'danger'}>
                                    {attempt.passed ? 'Passed' : 'Failed'}
                                  </Badge>
                                </td>
                                <td>{formatDate(attempt.attempt_date)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    </div>

                    <div className="mt-4">
                      <h5>Performance Summary</h5>
                      <div className="row">
                        <div className="col-md-4">
                          <Card className="mb-3">
                            <Card.Body>
                              <h6 className="card-title">Total Attempts</h6>
                              <p className="display-6">{totalCount}</p>
                            </Card.Body>
                          </Card>
                        </div>
                        <div className="col-md-4">
                          <Card className="mb-3">
                            <Card.Body>
                              <h6 className="card-title">Pass Rate</h6>
                              <p className="display-6">
                                {totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0}%
                              </p>
                            </Card.Body>
                          </Card>
                        </div>
                        <div className="col-md-4">
                          <Card className="mb-3">
                            <Card.Body>
                              <h6 className="card-title">Average Score</h6>
                              <p className="display-6">
                                {averageScore}%
                              </p>
                            </Card.Body>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}