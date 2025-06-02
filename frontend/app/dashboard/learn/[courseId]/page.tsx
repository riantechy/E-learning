'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { coursesApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'
import Link from 'next/link'

export default function CourseOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [courseRes, modulesRes, progressRes] = await Promise.all([
          coursesApi.getCourse(courseId),
          coursesApi.getModules(courseId),
          coursesApi.getCourseProgress(courseId)
        ])
        
        if (courseRes.data) setCourse(courseRes.data)
        if (modulesRes.data) setModules(modulesRes.data)
        if (progressRes.data) setProgress(progressRes.data)
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchData()
    }
  }, [courseId])

  const handleStartCourse = async () => {
    // Find first incomplete module or first module if none are completed
    const firstIncompleteModule = modules.find(module => 
      !progress?.completed_modules?.includes(module.id)
    ) || modules[0]
    
    if (firstIncompleteModule) {
      router.push(`/dashboard/learn/${courseId}/${firstIncompleteModule.id}`)
    }
  }

  const isModuleLocked = (module: any) => {
    if (module.order === 1) return false // First module is always unlocked
    
    const prevModule = modules.find(m => m.order === module.order - 1)
    if (!prevModule) return false
    
    return !progress?.completed_modules?.includes(prevModule.id)
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
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/dashboard/learn">My Courses</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {course.title}
                </li>
              </ol>
            </nav>

            <div className="row">
              <div className="col-md-8">
                <div className="card mb-4">
                  <div className="card-body">
                    <h1 className="mb-3">{course.title}</h1>
                    <p className="lead">{course.description}</p>
                    
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <span className="badge bg-primary me-2">
                          {course.duration_hours} hours
                        </span>
                        <span className="badge bg-secondary">
                          {progress?.completed || 0}/{progress?.total || 0} lessons
                        </span>
                      </div>
                      <button 
                        onClick={handleStartCourse}
                        className="btn btn-primary btn-lg"
                        disabled={!modules.length}
                      >
                        {progress?.percentage === 0 ? 'Start Course' : 'Continue Learning'}
                      </button>
                    </div>

                    <div className="progress mb-4">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${progress?.percentage || 0}%` }}
                        aria-valuenow={progress?.percentage || 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>Course Modules</h3>
                  </div>
                  <div className="list-group list-group-flush">
                    {modules.map((module) => {
                      const isCompleted = progress?.completed_modules?.includes(module.id)
                      const isLocked = isModuleLocked(module)
                      
                      return (
                        <div 
                          key={module.id} 
                          className={`list-group-item ${isCompleted ? 'bg-light' : ''}`}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h4 className="mb-1">{module.title}</h4>
                              <p className="mb-1 text-muted">{module.description}</p>
                              <small>
                                {module.completed_lessons || 0}/{module.total_lessons} lessons
                              </small>
                            </div>
                            <div>
                              {isLocked ? (
                                <span className="badge bg-secondary">Locked</span>
                              ) : isCompleted ? (
                                <span className="badge bg-success">Completed</span>
                              ) : (
                                <Link
                                  href={`/dashboard/learn/${courseId}/${module.id}`}
                                  className="btn btn-primary btn-sm"
                                >
                                  {module.started ? 'Continue' : 'Start'}
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-header">
                    <h4>Course Details</h4>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Category</span>
                        <span className="badge bg-primary">
                          {course.category?.name || 'General'}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Duration</span>
                        <span>{course.duration_hours} hours</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Status</span>
                        <span className="badge bg-success">
                          {course.status}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Progress</span>
                        <span>{progress?.percentage || 0}%</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h4>Quick Actions</h4>
                  </div>
                  <div className="card-body">
                    <div className="d-grid gap-2">
                      <button 
                        onClick={handleStartCourse}
                        className="btn btn-primary"
                        disabled={!modules.length}
                      >
                        {progress?.percentage === 0 ? 'Start Course' : 'Continue Learning'}
                      </button>
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