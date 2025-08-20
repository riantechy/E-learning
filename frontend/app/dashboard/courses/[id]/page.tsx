'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { coursesApi } from '@/lib/api'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Tab, Tabs } from 'react-bootstrap'

interface EnrollmentResponse {
  enrolled: boolean;
}

export default function CourseDetailPage() {
  const { id } = useParams()
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<any>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await coursesApi.getCourse(id as string)
        const modulesRes = await coursesApi.getModules(id as string)
        const enrollmentRes = await coursesApi.checkEnrollment(id as string)
        const progressRes = await coursesApi.getCourseProgress(id as string)

        if (courseRes.data) setCourse(courseRes.data)
        if (modulesRes.data?.results) setModules(modulesRes.data.results)
        if (enrollmentRes.data) setEnrolled((enrollmentRes.data as EnrollmentResponse).enrolled)
        // if (enrollmentRes.data) setEnrolled(enrollmentRes.data.enrolled)
        if (progressRes.data) setProgress(progressRes.data)
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleEnroll = async () => {
    try {
      const res = await coursesApi.enroll(id as string)
      if (res.data?.success) {
        setEnrolled(true)
        const progressRes = await coursesApi.getCourseProgress(id as string)
        if (progressRes.data) setProgress(progressRes.data)
      }
    } catch (error) {
      console.error('Error enrolling:', error)
    }
  }

  // Helper function to truncate module description
  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto d-flex justify-content-center align-items-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!course) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto">
            <div className="container py-5">
              <div className="alert alert-danger">Course not found</div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="d-flex vh-100 bg-light position-relative">
        {/* Mobile Sidebar Toggle Button */}
        <button 
          className="d-lg-none btn btn-light position-fixed top-2 start-2 z-3"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          style={{ zIndex: 1000 }}
        >
          <Menu className="bi bi-list" />
        </button>

        {/* Sidebar - Fixed width */}
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
            style={{ zIndex: 998 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main 
          className="flex-grow-1 p-4 overflow-auto"
          style={{
            width: 'calc(100%)',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div className="container py-5">
            <div className="row">
              <div className="col-md-8">
                <div className="card mb-4">
                  <img 
                    src={course.thumbnail || '/images/course-placeholder.jpg'} 
                    className="card-img-top" 
                    alt={course.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{course.title}</h5>
                    <div className="d-flex align-items-center mb-3">
                      <span className="badge bg-primary me-2">{course.category?.name || 'General'}</span>
                      <span className="text-muted">{course.duration_hours} hours</span>
                    </div>
                    <p className="card-text small">{course.description}</p>
                    
                    {enrolled ? (
                      <div className="alert alert-success">
                        You're enrolled in this course! {progress && (
                          <span>Progress: {progress.percentage}%</span>
                        )}
                      </div>
                    ) : (
                      <button onClick={handleEnroll} className="btn btn-primary btn-sm">
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>

                <Tabs defaultActiveKey="modules" id="course-tabs" className="mb-3">
                  <Tab eventKey="modules" title="Modules">
                    <div className="mt-3">
                      <h6>What You'll Learn</h6>
                      <p className="text-muted mb-4">Explore the modules below to get a preview of the course content.</p>
                      <div className="list-group">
                        {modules.map((module: any) => (
                          <div key={module.id} className="list-group-item mb-3 border rounded">
                            <h6 className="mb-2">{module.title}</h6>
                            <p className="text-muted mb-2">{truncateDescription(module.description)}</p>
                            {enrolled && (
                              <div className="list-group">
                                {module.lessons?.map((lesson: any) => (
                                  <Link 
                                    key={lesson.id}
                                    href={`/learn/${course.id}/${module.id}/${lesson.id}`}
                                    className="list-group-item list-group-item-action"
                                  >
                                    <div className="d-flex justify-content-between">
                                      <span>{lesson.title}</span>
                                      <span className="badge bg-secondary">
                                        {lesson.duration_minutes} min
                                      </span>
                                    </div>
                                    {lesson.is_completed && (
                                      <small className="text-success">✓ Completed</small>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Tab>
                  <Tab eventKey="resources" title="Resources">
                    <div className="mt-3">
                      <p>Additional resources will appear here.</p>
                    </div>
                  </Tab>
                  <Tab eventKey="certificate" title="Certificate">
                    <div className="mt-3">
                      {progress?.percentage === 100 ? (
                        <div className="alert alert-success">
                          <h5>Congratulations!</h5>
                          <p>You've completed this course and earned a certificate.</p>
                          <a 
                            href={`/api/certificates/generate/${course.id}`} 
                            className="btn btn-success"
                          >
                            Download Certificate
                          </a>
                        </div>
                      ) : (
                        <div className="alert alert-info">
                          <h5>Complete the course to earn your certificate</h5>
                          <p>Current progress: {progress?.percentage || 0}%</p>
                          <div className="progress">
                            <div 
                              className="progress-bar" 
                              role="progressbar" 
                              style={{ width: `${progress?.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </div>
              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-header">
                    <h6>Course Details</h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Status:</span>
                        <span className="badge bg-primary">{course.status}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Created:</span>
                        <span>{new Date(course.created_at).toLocaleDateString()}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Instructor:</span>
                        <span>{course.created_by?.name || 'ICT Authority'}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Duration:</span>
                        <span>{course.duration_hours} hours</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Modules:</span>
                        <span>{modules.length}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}