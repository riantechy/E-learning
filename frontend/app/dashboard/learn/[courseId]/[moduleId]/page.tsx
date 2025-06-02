'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { coursesApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'
import Link from 'next/link'

export default function ModulePage() {
  const { courseId, moduleId } = useParams()
  const router = useRouter()
  const [module, setModule] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [moduleRes, courseRes, lessonsRes, progressRes] = await Promise.all([
          coursesApi.getModule(courseId, moduleId),
          coursesApi.getCourse(courseId),
          coursesApi.getLessons(courseId, moduleId),
          coursesApi.getCourseProgress(courseId)
        ])
        
        if (moduleRes.data) setModule(moduleRes.data)
        if (courseRes.data) setCourse(courseRes.data)
        if (lessonsRes.data) setLessons(lessonsRes.data)
        if (progressRes.data) setProgress(progressRes.data)
      } catch (error) {
        console.error('Error fetching module data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, moduleId])

  const handleStartLesson = (lessonId: string) => {
    router.push(`/dashboard/learn/${courseId}/${moduleId}/${lessonId}`)
  }

  const isModuleComplete = () => {
    if (!progress || !module) return false
    return progress.completed_modules?.includes(module.id) || 
      (module.total_lessons > 0 && module.completed_lessons === module.total_lessons)
  }

  const handleNextModule = () => {
    const nextModule = course.modules?.find((m: any) => m.order === module.order + 1)
    if (nextModule) {
      router.push(`/dashboard/learn/${courseId}/${nextModule.id}`)
    } else {
      router.push(`/dashboard/learn/${courseId}/complete`)
    }
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

  if (!module || !course) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto">
            <div className="alert alert-danger">Module not found</div>
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
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/dashboard/learn">My Courses</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href={`/dashboard/learn/${courseId}`}>{course.title}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {module.title}
                </li>
              </ol>
            </nav>

            <div className="row">
              <div className="col-md-8">
                <div className="card mb-4">
                  <div className="card-header">
                    <h2>{module.title}</h2>
                    <p className="mb-0">{module.description}</p>
                  </div>
                  <div className="card-body">
                    <div className="list-group">
                      {lessons.map((lesson) => (
                        <div 
                          key={lesson.id} 
                          className={`list-group-item ${lesson.is_completed ? 'bg-light' : ''}`}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="mb-1">{lesson.title}</h5>
                              <small className="text-muted">
                                {lesson.duration_minutes} min • {lesson.content_type}
                              </small>
                            </div>
                            <div>
                              {lesson.is_completed ? (
                                <span className="badge bg-success">Completed</span>
                              ) : (
                                <button 
                                  onClick={() => handleStartLesson(lesson.id)}
                                  className="btn btn-primary btn-sm"
                                >
                                  Start
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {isModuleComplete() && (
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <h4 className="text-success">✓ Module Completed</h4>
                      <button 
                        onClick={handleNextModule}
                        className="btn btn-success mt-2"
                      >
                        {course.modules?.some((m: any) => m.order === module.order + 1) 
                          ? 'Continue to Next Module' 
                          : 'View Course Completion'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-header">
                    <h4>Module Progress</h4>
                  </div>
                  <div className="card-body">
                    <div className="progress mb-3">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${module.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                    <p>
                      {module.completed_lessons} of {module.total_lessons} lessons completed
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h4>Course Navigation</h4>
                  </div>
                  <div className="list-group list-group-flush">
                    {course.modules?.map((mod: any) => (
                      <Link
                        key={mod.id}
                        href={`/dashboard/learn/${courseId}/${mod.id}`}
                        className={`list-group-item list-group-item-action ${
                          mod.id === moduleId ? 'active' : ''
                        }`}
                      >
                        <div className="d-flex justify-content-between">
                          <span>{mod.title}</span>
                          {progress?.completed_modules?.includes(mod.id) && (
                            <span className="badge bg-success">✓</span>
                          )}
                        </div>
                      </Link>
                    ))}
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