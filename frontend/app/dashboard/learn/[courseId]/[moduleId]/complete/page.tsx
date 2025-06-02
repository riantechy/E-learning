// /dashboard/learn/[courseId]/complete/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { coursesApi, certificatesApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'
import Link from 'next/link'

export default function CourseCompletionPage() {
  const { courseId } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [courseRes, certificateRes] = await Promise.all([
          coursesApi.getCourse(courseId),
          certificatesApi.getCourseCertificate(courseId)
        ])
        
        if (courseRes.data) setCourse(courseRes.data)
        if (certificateRes.data) setCertificate(certificateRes.data)
      } catch (error) {
        console.error('Error fetching completion data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

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
            <div className="alert alert-danger">Course not found</div>
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
        <main 
          className="flex-grow-1 p-4 overflow-auto"
          style={{
            width: 'calc(100%)',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-md-8 text-center">
                <div className="card border-success">
                  <div className="card-header bg-success text-white">
                    <h2 className="mb-0">Congratulations!</h2>
                  </div>
                  <div className="card-body">
                    <i className="bi bi-trophy-fill text-warning display-1 mb-4"></i>
                    <h3 className="mb-3">You've completed {course.title}</h3>
                    <p className="lead">
                      Great job on finishing the course! You can now download your certificate
                      of completion below.
                    </p>

                    {certificate ? (
                      <div className="mt-4">
                        <a 
                          href={certificate.pdf_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-lg me-3"
                        >
                          <i className="bi bi-download me-2"></i>
                          Download Certificate
                        </a>
                        <Link 
                          href="/dashboard/certificates"
                          className="btn btn-outline-secondary btn-lg"
                        >
                          View All Certificates
                        </Link>
                      </div>
                    ) : (
                      <div className="alert alert-warning mt-4">
                        Your certificate is being generated. Please check back later.
                      </div>
                    )}

                    <div className="mt-5">
                      <Link 
                        href="/dashboard/courses"
                        className="btn btn-outline-primary"
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Courses
                      </Link>
                    </div>
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