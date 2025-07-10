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
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'

  // Fetch certificate data
  const fetchCertificate = async () => {
    try {
      const { data, error } = await certificatesApi.getCourseCertificate(courseId)
      if (error) throw new Error(error)
      if (data && data.length > 0) {
        setCertificate(data[0])
      }
    } catch (err) {
      console.error('Error fetching certificate:', err)
      setError('Failed to load certificate data')
    }
  }

  // Generate new certificate
  const handleGenerateCertificate = async () => {
    try {
      setGenerating(true)
      setError(null)
      const { data, error } = await certificatesApi.generateCertificate(courseId)
      if (error) throw new Error(error)
      if (data) {
        setCertificate(data)
      }
    } catch (err) {
      console.error('Error generating certificate:', err)
      setError('Failed to generate certificate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Download certificate
  const handleDownloadCertificate = async () => {
    if (!certificate?.id) return;
    
    try {
      const { data, error } = await certificatesApi.downloadCertificate(certificate.id);
      
      if (error) {
        throw new Error(error);
      }
  
      if (data instanceof Blob) {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${course?.title.replace(/\s+/g, '_')}_${certificate.certificate_number}.pdf` || 'certificate.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        throw new Error('Received invalid certificate data');
      }
    } catch (err) {
      console.error('Error downloading certificate:', err);
      setError(err instanceof Error ? err.message : 'Failed to download certificate. Please try again later.');
    }
  };
  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [courseRes] = await Promise.all([
          coursesApi.getCourse(courseId),
        ])
        
        if (courseRes.error) throw new Error(courseRes.error)
        if (courseRes.data) {
          setCourse(courseRes.data)
          await fetchCertificate()
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load course data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto d-flex justify-content-center align-items-center">
            <div className="spinner-border text-primary" role="status">
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
            <div className="alert alert-danger">
              {error || 'Course not found'}
              <button 
                className="btn btn-link" 
                onClick={() => router.push('/dashboard/courses')}
              >
                Back to courses
              </button>
            </div>
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
            width: '280px',
            zIndex: 999,
            left: mobileSidebarOpen ? '0' : '-280px',
            transition: 'left 0.3s ease'
          }}
        >
          <LearnerSidebar />
        </div>

        {/* Mobile Overlay */}
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
                      Great job on finishing the course! You can now get your certificate
                      of completion below.
                    </p>

                    {error && (
                      <div className="alert alert-danger mb-4">
                        {error}
                      </div>
                    )}

                    {certificate ? (
                      <div className="mt-4">
                        <button
                          onClick={handleDownloadCertificate}
                          className="btn btn-primary btn-lg me-3"
                        >
                          <i className="bi bi-download me-2"></i>
                          Download Certificate
                        </button>
                        <Link 
                          href="/dashboard/certificates"
                          className="btn btn-outline-secondary btn-lg"
                        >
                          View All Certificates
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <button 
                          onClick={handleGenerateCertificate}
                          disabled={generating}
                          className="btn btn-primary btn-lg me-3"
                        >
                          {generating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Generating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-award me-2"></i>
                              Get Certificate
                            </>
                          )}
                        </button>
                        <Link 
                          href="/dashboard/certificates"
                          className="btn btn-outline-secondary btn-lg"
                        >
                          View All Certificates
                        </Link>
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

// Type definitions for this component
interface Course {
  id: string
  title: string
  description: string
}

interface Certificate {
  id: string
  pdf_file: string | null
  certificate_number: string
}