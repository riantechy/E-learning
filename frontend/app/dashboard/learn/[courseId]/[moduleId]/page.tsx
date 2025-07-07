'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { coursesApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ModulePage() {
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const router = useRouter()

  const [module, setModule] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [lessonProgress, setLessonProgress] = useState<Record<string, any>>({})
  const [moduleCompleted, setModuleCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({})

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch module, course, and lessons in parallel
        const [moduleRes, courseRes, lessonsRes, moduleProgressRes] = await Promise.all([
          coursesApi.getModule(courseId, moduleId),
          coursesApi.getCourse(courseId),
          coursesApi.getLessons(courseId, moduleId),
          coursesApi.getModuleProgress(moduleId)
        ])

        if (moduleRes.data) setModule(moduleRes.data)
        if (courseRes.data) setCourse(courseRes.data)
        if (lessonsRes.data) {
          setLessons(lessonsRes.data)
          
          // Initially expand all lessons
          const expanded: Record<string, boolean> = {}
          lessonsRes.data.forEach(lesson => {
            expanded[lesson.id] = true
          })
          setExpandedLessons(expanded)
          
          // Fetch progress for each lesson
          const progressData: Record<string, any> = {}
          await Promise.all(
            lessonsRes.data.map(async (lesson: any) => {
              try {
                const progressRes = await coursesApi.getLessonProgress(lesson.id)
                if (progressRes.data) {
                  progressData[lesson.id] = progressRes.data
                }
              } catch (error) {
                console.error(`Error fetching progress for lesson ${lesson.id}:`, error)
              }
            })
          )
          setLessonProgress(progressData)
        }

        // Set module completion status
        if (moduleProgressRes.data) {
          setModuleCompleted(moduleProgressRes.data.is_completed)
        }
      } catch (error) {
        console.error('Error fetching module data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, moduleId])

  // Navigation helpers
  const getCurrentModuleIndex = () => {
    return course?.modules?.findIndex((m: any) => m.id === moduleId) || 0
  }

  const getPreviousModule = () => {
    if (!course?.modules) return null
    const currentIndex = getCurrentModuleIndex()
    if (currentIndex > 0) {
      return course.modules[currentIndex - 1]
    }
    return null
  }

  const getNextModule = () => {
    if (!course?.modules) return null
    const currentIndex = getCurrentModuleIndex()
    if (currentIndex < course.modules.length - 1) {
      return course.modules[currentIndex + 1]
    }
    return null
  }

  // Check if all lessons are completed
  const allLessonsCompleted = lessons.every(lesson => lessonProgress[lesson.id]?.is_completed)

  // Mark module as completed if all lessons are done
  useEffect(() => {
    const markModuleComplete = async () => {
      if (allLessonsCompleted && !moduleCompleted) {
        try {
          await coursesApi.markModuleCompleted(moduleId);
          setModuleCompleted(true);
          
          // Refresh the progress data
          const progressRes = await coursesApi.getCourseProgress(courseId);
          if (progressRes.data) {
            setProgress(progressRes.data);
          }
        } catch (error) {
          console.error('Error marking module as completed:', error);
        }
      }
    };

    markModuleComplete();
  }, [allLessonsCompleted, moduleCompleted, moduleId, courseId]);

  // Toggle lesson expansion
  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }))
  }

  // Handle lesson completion
  const handleLessonCompleted = async (lessonId: string) => {
    try {
      const res = await coursesApi.updateProgress(lessonId, true)
      if (res.data) {
        setLessonProgress(prev => ({
          ...prev,
          [lessonId]: { ...prev[lessonId], is_completed: true }
        }))
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error)
    }
  }

  // Render different content types
  const renderLessonContent = (lesson: any) => {
    switch (lesson.content_type) {
      case 'VIDEO':
        return (
          <div className="ratio ratio-16x9 mb-3">
            <iframe 
              src={lesson.content} 
              title={lesson.title}
              allowFullScreen
              onEnded={() => handleLessonCompleted(lesson.id)}
            ></iframe>
          </div>
        )
      case 'PDF':
        return (
          <div className="mb-3">
            <iframe 
              src={lesson.content} 
              className="w-100" 
              style={{ height: '500px' }}
              title={lesson.title}
            ></iframe>
          </div>
        )
      case 'TEXT':
        return (
          <div 
            className="lesson-content" 
            dangerouslySetInnerHTML={{ __html: lesson.content }}
            onScroll={(e) => {
              const element = e.target as HTMLElement
              const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight
              if (scrollPercentage > 0.8) {
                handleLessonCompleted(lesson.id)
              }
            }}
          />
        )
      case 'QUIZ':
        return (
          <div className="alert alert-info">
            <p>You have to completed this quiz.</p>
            {lessonProgress[lesson.id]?.is_completed ? (
              <span className="badge bg-success">Completed</span>
            ) : (
              <button 
                onClick={() => router.push(`/dashboard/learn/${courseId}/${moduleId}/${lesson.id}`)}
                className="btn btn-sm btn-primary"
              >
                Take Quiz
              </button>
            )}
          </div>
        )
      default:
        return <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
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
                    <h5>{module.title}</h5>
                    <p className="mb-0">{module.description}</p>
                  </div>
                  <div className="card-body">
                    <div className="accordion" id="lessonsAccordion">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="lesson-section">
                          <div 
                            className="d-flex justify-content-between align-items-center p-3 border-bottom cursor-pointer"
                            onClick={() => toggleLesson(lesson.id)}
                          >
                            <h6 className="mb-0">
                              {lesson.title}
                              {lessonProgress[lesson.id]?.is_completed && (
                                <span className="badge bg-success ms-2">✓</span>
                              )}
                            </h6>
                            <span>
                              {expandedLessons[lesson.id] ? <ChevronUp /> : <ChevronDown />}
                            </span>
                          </div>
                          {expandedLessons[lesson.id] && (
                            <div className="p-3">
                              {renderLessonContent(lesson)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Module completion navigation */}
                {moduleCompleted && (
                  <div className="card mt-4">
                    <div className="card-body text-center">
                      <div className="d-flex justify-content-between">
                        {getPreviousModule() && (
                          <Link
                            href={`/dashboard/learn/${courseId}/${getPreviousModule().id}`}
                            className="btn btn-outline-primary"
                          >
                            <ChevronLeft className="me-1" />
                            Previous Module: {getPreviousModule().title}
                          </Link>
                        )}
                        {!getPreviousModule() && <div></div>}
                        
                        {getNextModule() ? (
                          <Link
                            href={`/dashboard/learn/${courseId}/${getNextModule().id}`}
                            className="btn btn-primary"
                          >
                            Next Module: {getNextModule().title}
                            <ChevronRight className="ms-1" />
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/learn/${courseId}/complete`}
                            className="btn btn-success"
                          >
                            Complete Course
                            <ChevronRight className="ms-1" />
                          </Link>
                        )}
                      </div>
                      <div className="mt-3">
                        <Link 
                          href={`/dashboard/learn/${courseId}/${moduleId}/survey`} 
                          className="btn btn-primary"
                        >
                          Take Module Survey
                        </Link>
                        <p className="text-muted mt-2 small">
                          Help us improve by completing this short survey
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-header">
                    <h6>Module Progress</h6>
                  </div>
                  <div className="card-body">
                    <div className="progress mb-3">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ 
                          width: `${(Object.values(lessonProgress).filter(p => p?.is_completed).length / lessons.length * 100 || 0)}%` 
                        }}
                      ></div>
                    </div>
                    <p>
                      {Object.values(lessonProgress).filter(p => p?.is_completed).length} of {lessons.length} lessons completed
                    </p>
                    {moduleCompleted && (
                      <div className="alert alert-success">
                        Module completed!
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h6>Course Navigation</h6>
                  </div>
                  <div className="list-group list-group-flush">
                    {course.modules?.map((mod: any) => (
                      <Link
                        key={mod.id}
                        href={`/dashboard/learn/${courseId}/${mod.id}`}
                        className={`list-group-item list-group-item-action ${mod.id === moduleId ? 'active' : ''}`}
                      >
                        <div className="d-flex justify-content-between">
                          <span>{mod.title}</span>
                          {mod.completed && (
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