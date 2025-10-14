'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { coursesApi, assessmentsApi, usersApi, SurveyResponse } from '@/lib/api'
import TopNavbar from '@/components/TopNavbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Helper function to convert YouTube URLs to embed format
const convertToEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v')
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  } else if (url.includes('youtu.be')) {
    const videoId = url.split('/').pop()
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }
  return url
}

export default function ModulePage() {
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const router = useRouter()
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})

  const [module, setModule] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [lessonProgress, setLessonProgress] = useState<Record<string, any>>({})
  const [moduleCompleted, setModuleCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({})
  const [hasSurvey, setHasSurvey] = useState(false)
  const [surveyCompleted, setSurveyCompleted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [courseRes, moduleRes, lessonsRes, modulesRes, userRes] = await Promise.all([
          coursesApi.getCourse(courseId),
          coursesApi.getModule(courseId, moduleId),
          coursesApi.getLessons(courseId, moduleId),
          coursesApi.getModules(courseId),
          usersApi.getProfile(),
        ])
        const user = userRes.data

        if (moduleRes.data) setModule(moduleRes.data)
        if (courseRes.data) setCourse(courseRes.data)
        if (modulesRes.data?.results) setModules(modulesRes.data.results)
        if (lessonsRes.data?.results) {
          setLessons(lessonsRes.data.results)

          const expanded: Record<string, boolean> = {}
          const progressData: Record<string, any> = {}

          await Promise.all(
            lessonsRes.data.results.map(async (lesson: any) => {
              expanded[lesson.id] = true
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

          setExpandedLessons(expanded)
          setLessonProgress(progressData)
        }

        const surveyRes = await assessmentsApi.getModuleSurveys(courseId, moduleId)
        if (surveyRes.data && surveyRes.data.length > 0) {
          setHasSurvey(true)
          const responsesRes = await assessmentsApi.getSurveyResponses(surveyRes.data[0].id)
          if (responsesRes.data?.data && Array.isArray(responsesRes.data.data) && responsesRes.data.data.length > 0) {
            const userResponse = responsesRes.data.data.find((r: SurveyResponse) => r.user.id === user?.id)
            setSurveyCompleted(!!userResponse)
          }
        }
      } catch (error) {
        console.error('Error fetching module data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, moduleId])

  useEffect(() => {
    const checkModuleCompletion = async () => {
      if (lessons.length > 0) {
        const requiredLessons = lessons.filter(lesson => lesson.is_required)
        const allRequiredLessonsCompleted = requiredLessons.length > 0 &&
          requiredLessons.every(lesson => lessonProgress[lesson.id]?.is_completed)

        const surveyRequired = hasSurvey && !surveyCompleted
        const isCompleted = allRequiredLessonsCompleted && !surveyRequired

        if (isCompleted !== moduleCompleted) {
          try {
            if (isCompleted) {
              await coursesApi.markModuleCompleted(moduleId)
            }
            setModuleCompleted(isCompleted)
          } catch (error) {
            console.error('Error updating module completion:', error)
          }
        }
      }
    }

    checkModuleCompletion()
  }, [lessons, lessonProgress, hasSurvey, surveyCompleted, moduleId, courseId])

  // Auto-complete lessons when they become visible
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lessonId = entry.target.getAttribute('data-lesson-id')
          if (lessonId && !lessonProgress[lessonId]?.is_completed) {
            handleLessonCompleted(lessonId)
          }
        }
      })
    }, { threshold: 0.3 })

    // Observe all lesson content elements
    Object.entries(contentRefs.current).forEach(([lessonId, ref]) => {
      if (ref) {
        ref.setAttribute('data-lesson-id', lessonId)
        observer.observe(ref)
      }
    })

    return () => observer.disconnect()
  }, [lessonProgress])

  const getCurrentModuleIndex = () => {
    return modules.findIndex((m: any) => m.id === moduleId) || 0
  }

  const getPreviousModule = () => {
    const currentIndex = getCurrentModuleIndex()
    if (currentIndex > 0) {
      return modules[currentIndex - 1]
    }
    return null
  }

  const getNextModule = () => {
    const currentIndex = getCurrentModuleIndex()
    if (currentIndex < modules.length - 1) {
      return modules[currentIndex + 1]
    }
    return null
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }))
  }

  const handleLessonCompleted = async (lessonId: string) => {
    try {
      if (!lessonProgress[lessonId]?.is_completed) {
        const res = await coursesApi.updateProgress(lessonId, true)
        if (res.data) {
          setLessonProgress(prev => ({
            ...prev,
            [lessonId]: { ...prev[lessonId], is_completed: true }
          }))
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error)
    }
  }

  const handleVideoEnded = (lessonId: string) => {
    if (!lessonProgress[lessonId]?.is_completed) {
      handleLessonCompleted(lessonId)
    }
  }

  const handlePdfLoaded = (lessonId: string) => {
    if (!lessonProgress[lessonId]?.is_completed) {
      handleLessonCompleted(lessonId)
    }
  }

  const renderLessonContent = (lesson: any) => {
    if (lesson.content_type === 'QUIZ') {
      return (
        <div className="alert alert-info">
          <p>Complete this quiz to finish the lesson.</p>
          {lessonProgress[lesson.id]?.is_completed ? (
            <span className="badge bg-success">Completed</span>
          ) : (
            <div className="d-flex gap-2 align-items-center">
              <button 
                onClick={() => {
                  // REMOVED: handleLessonCompleted(lesson.id) - Don't complete when clicking Take Quiz
                  router.push(`/dashboard/learn/${courseId}/${moduleId}/${lesson.id}`)
                }}
                className="btn btn-sm btn-danger"
              >
                Take Quiz
              </button>
              <small className="text-muted">
                Complete the quiz to mark this lesson as finished
              </small>
            </div>
          )}
        </div>
      )
    }

    if (lesson.content_type === 'VIDEO') {
      return (
        <>
          {lesson.description && (          
            <div className="card-body p-2 p-md-3">
              <p className="card-text">{lesson.description}</p>
            </div>         
          )}
          
          <div className="ratio ratio-16x9 mb-3">
            <iframe 
              ref={(el: HTMLIFrameElement | null) => {
                iframeRefs.current[lesson.id] = el
              }}
              src={convertToEmbedUrl(lesson.content)} 
              title={lesson.title}
              allowFullScreen
              onEnded={() => handleVideoEnded(lesson.id)}
              onLoad={() => {
                if (!lessonProgress[lesson.id]?.is_completed) {
                  handleLessonCompleted(lesson.id)
                }
              }}
            />
          </div>
        </>
      )
    }

    if (lesson.content_type === 'PDF') {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_HOST
      const pdfUrl = lesson.pdf_file?.startsWith('http') 
        ? lesson.pdf_file 
        : `${baseUrl}${lesson.pdf_file}`
      return (
        <div className="mb-3">
          <div className="card">
            <div className="card-body p-0 p-md-0">
              <h6>PDF Document: {lesson.title}</h6>
              {lesson.description && (
                <div className="card-body p-2 p-md-3">
                  <p className="card-text">{lesson.description}</p>
                </div>
              )}
              <div className="d-flex gap-2">
                <a 
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-danger"
                  onClick={() => handlePdfLoaded(lesson.id)}
                >
                  View 
                </a>
                <a 
                  href={pdfUrl}
                  download
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handlePdfLoaded(lesson.id)}
                >
                  Download 
                </a>
              </div>
              {lesson.pdf_file ? null : (
                <div className="alert alert-warning mt-2">
                  PDF file is not available.
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        <div 
          ref={(el) => { contentRefs.current[lesson.id] = el }}
          className="lesson-content formatted-content" 
          dangerouslySetInnerHTML={{ __html: lesson.content }}
          onClick={() => {
            if (!lessonProgress[lesson.id]?.is_completed) {
              handleLessonCompleted(lesson.id)
            }
          }}
        />
        
        <style jsx>{`
          .formatted-content {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .formatted-content h1, h2, h3, h4, h5, h6 {
            margin: 1rem 0;
            font-weight: 600;
          }
          .formatted-content p {
            margin-bottom: 1rem;
          }
        `}</style>
        
        {lesson.sections?.length > 0 && (
          <div className="sections-container mt-3">
            {lesson.sections.map((section: any) => (
              <div key={section.id} className="section mb-4">
                <h5>{section.title}</h5>
                
                {section.content_type === 'VIDEO' ? (
                  <div className="ratio ratio-16x9 mb-3">
                    <iframe 
                      src={convertToEmbedUrl(section.video_url)} 
                      title={section.title}
                      allowFullScreen
                      onLoad={() => {
                        if (!lessonProgress[lesson.id]?.is_completed) {
                          handleLessonCompleted(lesson.id)
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    className="formatted-content"
                    dangerouslySetInnerHTML={{ __html: section.content }} 
                    onClick={() => {
                      if (!lessonProgress[lesson.id]?.is_completed) {
                        handleLessonCompleted(lesson.id)
                      }
                    }}
                  />
                )}
                
                {section.subsections?.length > 0 && (
                  <div className="subsections ms-4">
                    {section.subsections.map((sub: any) => (
                      <div key={sub.id} className="subsection mb-3">
                        <p className="fs-6 mb-1">{sub.title}</p>
                        
                        {sub.content_type === 'VIDEO' ? (
                          <div className="ratio ratio-16x9 mb-3">
                            <iframe 
                              src={convertToEmbedUrl(sub.video_url)} 
                              title={sub.title}
                              allowFullScreen
                              onLoad={() => {
                                if (!lessonProgress[lesson.id]?.is_completed) {
                                  handleLessonCompleted(lesson.id)
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            className="formatted-content"
                            dangerouslySetInnerHTML={{ __html: sub.content }} 
                            onClick={() => {
                              if (!lessonProgress[lesson.id]?.is_completed) {
                                handleLessonCompleted(lesson.id)
                              }
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    )
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

  const isLastModule = getCurrentModuleIndex() === modules.length - 1

  return (
    <ProtectedRoute>
      <div className="d-flex vh-100 bg-light position-relative">
        <button 
          className="d-lg-none btn btn-light position-fixed top-2 start-2 z-3"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          style={{zIndex: 1000}}
        >
          <Menu className="bi bi-list" />
        </button>

        <div 
          className={`d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm h-100 
            ${mobileSidebarOpen ? 'd-block position-fixed' : 'd-none d-lg-block'}`}
          style={{
            width: sidebarCollapsed ? '80px' : '280px',
            zIndex: 999,
            left: mobileSidebarOpen ? '0' : sidebarCollapsed ? '-80px' : '-280px',
            transition: 'left 0.3s ease, width 0.3s ease'
          }}
        >
          <LearnerSidebar 
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {mobileSidebarOpen && (
          <div 
            className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{zIndex: 998}}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          <main 
            className="flex-grow-1 overflow-auto"
            style={{
              marginLeft: mobileSidebarOpen 
                ? (sidebarCollapsed ? '80px' : '280px') 
                : '0',
              transition: 'margin-left 0.3s ease'
            }}
          >
            <div className="container py-2 py-md-3 py-lg-5">
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
                    <div className="card-header p-2 p-md-3">
                      <h5>{module.title}</h5>
                      <p className="mb-0">{module.description}</p>
                    </div>
                    <div className="card-body p-2 p-md-3">
                      <div className="accordion" id="lessonsAccordion" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                        {lessons.map((lesson) => (
                          <div key={lesson.id} className="lesson-section" style={{ wordBreak: 'break-word' }}>
                            <div 
                              className="d-flex justify-content-between align-items-center p-3 border-bottom cursor-pointer"
                              onClick={() => toggleLesson(lesson.id)}
                            >
                              <h6 className="mb-0">                                
                                {lessonProgress[lesson.id]?.is_completed && (
                                  <span className="badge bg-success ms-2">✓</span>
                                )}
                                {lesson.title}
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

                  <div className="card mt-4">
                    <div className="card-body text-center">
                      {hasSurvey && (
                        <div className="mt-3">
                          <Link 
                            href={`/dashboard/learn/${courseId}/${moduleId}/survey`}
                            className={`btn ${surveyCompleted ? 'btn-outline-danger' : 'btn-danger'}`}
                          >
                            {surveyCompleted ? 'Retake Survey' : 'Take Module Survey'}
                          </Link>
                          <p className="text-muted mt-2 small">
                            {surveyCompleted ? 
                              'Thank you for completing the survey' : 
                              'Help us improve by completing this short survey'}
                          </p>
                        </div>
                      )}
                      <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mt-3">
                        {getPreviousModule() && (
                          <Link
                            href={`/dashboard/learn/${courseId}/${getPreviousModule().id}`}
                            className="btn btn-outline-danger flex-grow-1 flex-sm-grow-0"
                          >
                            <ChevronLeft className="me-1" />
                            Previous Module
                          </Link>
                        )}
                        {!getPreviousModule() && <div></div>}
                        
                        {!isLastModule ? (
                          <Link
                            href={`/dashboard/learn/${courseId}/${getNextModule()?.id}`}
                            className="btn btn-outline-danger"
                          >
                            Next Module
                            <ChevronRight className="ms-1" />
                          </Link>
                        ) : (
                          moduleCompleted && (
                            <Link
                              href={`/dashboard/learn/${courseId}/complete`}
                              className="btn btn-success"
                            >
                              Complete Course
                              <ChevronRight className="ms-1" />
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card mb-4">
                    <div className="card-header p-2 p-md-3">
                      <h6>Module Progress</h6>
                    </div>
                    <div className="card-body p-2 p-md-3">
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
                    <div className="card-header p-2 p-md-3">
                      <h6>Module Navigation</h6>
                    </div>
                    <div className="list-group list-group-flush">
                      {modules.map((mod: any) => (
                        <Link
                          key={mod.id}
                          href={`/dashboard/learn/${courseId}/${mod.id}`}
                          className={`list-group-item list-group-item-action ${mod.id === moduleId ? 'active' : ''}`}
                        >
                          <div className="d-flex justify-content-between">
                            <span>{mod.title}</span>
                            {mod.is_completed && (
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
      </div>
    </ProtectedRoute>
  )
}