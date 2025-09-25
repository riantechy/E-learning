// app/admin-dashboard/surveys/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { assessmentsApi, coursesApi, Survey, Course as CourseType } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import AdminSidebar from '@/components/AdminSidebar'
import { Table, Card, Alert, Spinner, Button, Form } from 'react-bootstrap'
import Link from 'next/link'

// Helper function to safely get course ID from survey
const getSurveyCourseId = (survey: Survey): string | null => {
  if (typeof survey.module === 'string') {
    return null; // Module is just an ID string, not an object
  }
  
  const module = survey.module;
  if (typeof module.course === 'string') {
    return module.course; // Course is an ID string
  }
  
  return module.course?.id || null; // Course is an object, return its ID
}

// Helper function to safely get course title from survey
const getSurveyCourseTitle = (survey: Survey): string => {
  if (typeof survey.module === 'string') {
    return 'N/A'; // Module is just an ID string
  }
  
  const module = survey.module;
  if (typeof module.course === 'string') {
    return 'N/A'; // Course is just an ID string
  }
  
  return module.course?.title || 'N/A'; // Course is an object, return its title
}

// Helper function to safely get module title from survey
const getSurveyModuleTitle = (survey: Survey): string => {
  if (typeof survey.module === 'string') {
    return 'N/A'; // Module is just an ID string
  }
  
  return survey.module.title || 'N/A'; // Module is an object, return its title
}

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [courses, setCourses] = useState<CourseType[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true)
      const res = await coursesApi.getAllCourses()
      if (res.error) {
        console.error('Error fetching courses:', res.error)
        return
      }
      setCourses(res.data?.results || [])
    } catch (err) {
      console.error('Fetch courses error:', err)
    } finally {
      setCoursesLoading(false)
    }
  }

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const res = await assessmentsApi.getSurveys()
      
      if (res.error) {
        setError(res.error)
        return
      }

      const allSurveys = res.data || []

      // Filter by selected course using the helper function
      let filteredSurveys = allSurveys;
      if (selectedCourse) {
        filteredSurveys = allSurveys.filter(survey => {
          const courseId = getSurveyCourseId(survey);
          return courseId === selectedCourse;
        })
      }

      setSurveys(filteredSurveys)
    } catch (err) {
      setError('An error occurred while fetching surveys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (!coursesLoading) {
      fetchSurveys()
    }
  }, [selectedCourse, coursesLoading])

  // Use helper functions for filtering and display
  const filteredSurveys = selectedCourse 
    ? surveys.filter(survey => getSurveyCourseId(survey) === selectedCourse)
    : surveys

  const selectedCourseTitle = courses.find(c => c.id === selectedCourse)?.title || 'Selected Course'

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h4 mb-0">Surveys</h1>
          <Button variant="primary" onClick={fetchSurveys}>
            Refresh
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Filter Surveys by Course</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select Course</Form.Label>
              <Form.Select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              {selectedCourse 
                ? `Surveys for ${selectedCourseTitle}`
                : 'All Surveys'
              }
            </h5>
            <span className="badge bg-primary">
              {filteredSurveys.length} {filteredSurveys.length === 1 ? 'Survey' : 'Surveys'}
            </span>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
              </div>
            ) : filteredSurveys.length === 0 ? (
              <Alert variant="info">
                {selectedCourse ? 'No surveys found for the selected course' : 'No surveys found'}
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Module</th>
                      <th>Course</th>
                      <th>Responses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSurveys.map((survey, index) => (
                      <tr key={survey.id}>
                        <td>{index + 1}</td>
                        <td>{survey.title}</td>
                        <td>{getSurveyModuleTitle(survey)}</td>
                        <td>{getSurveyCourseTitle(survey)}</td>
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