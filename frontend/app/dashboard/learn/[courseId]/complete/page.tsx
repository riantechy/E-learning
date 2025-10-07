// /dashboard/learn/[courseId]/complete/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { coursesApi, certificatesApi } from '@/lib/api'
import TopNavbar from '@/components/TopNavbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu, AlertCircle, CheckCircle, Download } from 'lucide-react'
import Link from 'next/link'

export default function CourseCompletionPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [progress, setProgress] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isCourseCompleted, setIsCourseCompleted] = useState(false)

  const checkCourseCompletion = () => {
    // Check if progress exists and course is completed
    if (progress?.is_course_completed) {
      return true;
    }
    
    // Fallback: Check if all modules are completed
    if (progress && modules.length > 0) {
      const completedModulesCount = progress.completed_modules_count || 0;
      const totalModulesCount = progress.total_modules_count || modules.length;
      return completedModulesCount === totalModulesCount && totalModulesCount > 0;
    }
    
    return false;
  }

  // Get incomplete modules
  const getIncompleteModules = () => {
    if (!progress || !modules.length) return []
    
    const completedModules = progress.completed_modules || []
    return modules.filter(module => !completedModules.includes(module.id))
  }

  // Fetch course progress and modules
  const fetchProgressData = async () => {
    try {
      const [progressRes, modulesRes] = await Promise.all([
        coursesApi.getCourseProgress(courseId),
        coursesApi.getModules(courseId)
      ]);
      
      if (progressRes.data) {
        setProgress(progressRes.data);
        console.log('Progress data:', progressRes.data);
      }
      
      if (modulesRes.data?.results) {
        setModules(modulesRes.data.results);
      }
      
      // Check completion after both API calls complete
      const completed = checkCourseCompletion();
      setIsCourseCompleted(completed);
      
      // REMOVED: No longer setting error for incomplete course
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError('Failed to load course progress');
    }
  };

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
          await fetchProgressData()
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
            <div className="spinner-border text-danger" role="status">
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

  const incompleteModules = getIncompleteModules()

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

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} /> 
          
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
                <div className="col-md-10">
                  {/* Course Not Completed Warning - Only show warning, not blocking */}
                  {!isCourseCompleted && (
                    <div className="card border-info mb-4">
                      <div className="card-header bg-info text-white d-flex align-items-center">
                        <AlertCircle className="me-2" size={20} />
                        <h5 className="mb-0">Course Progress</h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-8">
                            <h6>You're making progress! Remaining modules:</h6>
                            <ul className="list-group">
                              {incompleteModules.map(module => (
                                <li key={module.id} className="list-group-item d-flex justify-content-between align-items-center">
                                  <span>{module.title}</span>
                                  <span className="badge bg-info text-dark">In Progress</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3">
                              <strong>Progress: {progress?.percentage || 0}% Complete</strong>
                              <div className="progress mt-2">
                                <div 
                                  className="progress-bar bg-info" 
                                  style={{ width: `${progress?.percentage || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4 d-flex align-items-center">
                            <Link 
                              href={`/dashboard/learn/${courseId}`}
                              className="btn btn-danger w-100"
                            >
                              Continue Learning
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Course Status Card */}
                  <div className={`card ${isCourseCompleted ? 'border-success' : 'border-danger'}`}>
                    <div className={`card-header ${isCourseCompleted ? 'bg-success text-white' : 'bg-danger text-white'} d-flex justify-content-between align-items-center`}>
                      <h2 className="mb-0">
                        {isCourseCompleted ? 'Congratulations!' : 'Course Overview'}
                      </h2>
                      {isCourseCompleted && (
                        <CheckCircle size={24} />
                      )}
                    </div>
                    <div className="card-body">
                      <div className="text-center mb-4">
                        <i className={`bi ${isCourseCompleted ? 'bi-trophy-fill text-warning' : 'bi-book text-danger'} display-1 mb-4`}></i>
                        <h3 className="mb-3">
                          {isCourseCompleted 
                            ? `You've completed ${course.title}`
                            : `You're enrolled in ${course.title}`
                          }
                        </h3>
                        <p className="lead">
                          {isCourseCompleted 
                            ? "Great job on finishing the course! Download your certificate below."
                            : "Access your certificate anytime during your learning journey."
                          }
                        </p>
                      </div>

                      {error && (
                        <div className="alert alert-danger mb-4">
                          {error}
                        </div>
                      )}

                      {/* Certificate Section - ALWAYS VISIBLE */}
                      <div className="text-center mt-4">
                        {certificate ? (
                          <div>
                            <div className="alert alert-success mb-4">
                              <CheckCircle className="me-2" />
                              Certificate available for download!
                            </div>
                            <button
                              onClick={handleDownloadCertificate}
                              className="btn btn-danger btn-lg me-3"
                            >
                              <Download className="me-2" size={20} />
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
                          <div>
                            <button 
                              onClick={handleGenerateCertificate}
                              disabled={generating}
                              className="btn btn-danger btn-lg me-3"
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
                      </div>

                      <div className="text-center mt-4">
                        <Link
                          href={`/dashboard/learn/${courseId}`}
                          className="btn btn-outline-danger"
                        >
                          <i className="bi bi-arrow-left me-2"></i>
                          Back to Course
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Module Progress Overview */}
                  {modules.length > 0 && (
                    <div className="card mt-4">
                      <div className="card-header">
                        <h5 className="mb-0">Module Progress</h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {modules.map(module => {
                            const isCompleted = progress?.completed_modules?.includes(module.id)
                            return (
                              <div key={module.id} className="col-md-6 mb-3">
                                <div className={`card ${isCompleted ? 'border-success' : 'border-info'}`}>
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <h6 className="mb-0">{module.title}</h6>
                                      {isCompleted ? (
                                        <CheckCircle className="text-success" size={20} />
                                      ) : (
                                        <span className="badge bg-info">In Progress</span>
                                      )}
                                    </div>
                                    <small className="text-muted">
                                      Status: {isCompleted ? 'Completed' : 'In Progress'}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
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