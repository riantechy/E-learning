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

  // Track if user has interacted with the content
  const [contentInteraction, setContentInteraction] = useState<Record<string, boolean>>({})

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
          const interactionData: Record<string, boolean> = {}

          await Promise.all(
            lessonsRes.data.results.map(async (lesson: any) => {
              expanded[lesson.id] = true
              interactionData[lesson.id] = false
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
          setContentInteraction(interactionData)
        }

        // Check if this module has a survey
        const surveyRes = await assessmentsApi.getModuleSurveys(courseId, moduleId)
        if (surveyRes.data && surveyRes.data.length > 0) {
          setHasSurvey(true)

          // Check if user has already completed the survey
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

  useEffect(() => {
    // Setup scroll event listeners for all lesson content elements
    const handleScroll = (lessonId: string) => {
      return (e: Event) => {
        const element = e.target as HTMLElement
        const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight

        // Mark as completed if scrolled 90% and not already completed
        if (scrollPercentage > 0.9 && !lessonProgress[lessonId]?.is_completed) {
          handleLessonCompleted(lessonId)
        }
      }
    }

    // Add event listeners
    Object.keys(contentRefs.current).forEach(lessonId => {
      const element = contentRefs.current[lessonId]
      if (element) {
        element.addEventListener('scroll', handleScroll(lessonId))
      }
    })

    // Cleanup
    return () => {
      Object.keys(contentRefs.current).forEach(lessonId => {
        const element = contentRefs.current[lessonId]
        if (element) {
          element.removeEventListener('scroll', handleScroll(lessonId))
        }
      })
    }
  }, [lessonProgress])

  // Handle page scroll for non-scrollable content
  useEffect(() => {
    const handlePageScroll = () => {
      lessons.forEach(lesson => {
        if (lesson.content_type === 'TEXT' && !lessonProgress[lesson.id]?.is_completed) {
          const element = contentRefs.current[lesson.id]
          if (element) {
            const rect = element.getBoundingClientRect()
            const isVisible = (
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
              rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            )
            if (isVisible) {
              setContentInteraction(prev => ({
                ...prev,
                [lesson.id]: true
              }))
              handleLessonCompleted(lesson.id)
            }
          }
        }
      })
    }

    window.addEventListener('scroll', handlePageScroll)
    return () => window.removeEventListener('scroll', handlePageScroll)
  }, [lessons, lessonProgress])

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

    // Mark lesson as interacted with when expanded
    if (!expandedLessons[lessonId]) {
      setContentInteraction(prev => ({
        ...prev,
        [lessonId]: true
      }))
    }
  }

  const handleLessonCompleted = async (lessonId: string) => {
    try {
      const res = await coursesApi.updateProgress(lessonId, true)
      if (res.data) {
        setLessonProgress(prev => ({
          ...prev,
          [lessonId]: { ...prev[lessonId], is_completed: true }
        }))
        router.refresh()
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
            <button 
              onClick={() => router.push(`/dashboard/learn/${courseId}/${moduleId}/${lesson.id}`)}
              className="btn btn-sm btn-primary"
            >
              Take Quiz
            </button>
          )}
        </div>
      )
    }

    if (lesson.content_type === 'VIDEO') {
      return (
        <div className="ratio ratio-16x9 mb-3">
          <iframe 
            ref={(el: HTMLIFrameElement | null) => {
              iframeRefs.current[lesson.id] = el
            }}
            src={lesson.content} 
            title={lesson.title}
            allowFullScreen
            onEnded={() => handleVideoEnded(lesson.id)}
            onLoad={() => setContentInteraction(prev => ({...prev, [lesson.id]: true}))}
          />
        </div>
      )
    }

    if (lesson.content_type === 'PDF') {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_HOST
      const pdfUrl = lesson.content.startsWith('http') 
        ? lesson.content 
        : `${baseUrl}${lesson.content}`
      return (
        <div className="mb-3">
          <iframe 
            ref={(el) => { iframeRefs.current[lesson.id] = el }}
            src={pdfUrl}
            className="w-100" 
            style={{ height: '500px' }}
            title={lesson.title}
            onLoad={() => {
              setContentInteraction(prev => ({...prev, [lesson.id]: true}))
              handlePdfLoaded(lesson.id)
            }}
          />
        </div>
      )
    }

    // For TEXT content with sections
    return (
      <>
        <div 
          ref={(el) => { contentRefs.current[lesson.id] = el }}
          className="lesson-content" 
          dangerouslySetInnerHTML={{ __html: lesson.content }}
          style={{ maxHeight: '500px', overflowY: 'auto' }}
          onClick={() => setContentInteraction(prev => ({...prev, [lesson.id]: true}))}
        />
        {lesson.sections?.length > 0 && (
          <div className="sections-container mt-3">
            {lesson.sections.map((section: any) => (
              <div key={section.id} className="section mb-4">
                <h5>{section.title}</h5>
                
                {/* Handle section content based on content_type */}
                {section.content_type === 'VIDEO' ? (
                  <div className="ratio ratio-16x9 mb-3">
                    <iframe 
                      src={convertToEmbedUrl(section.video_url)} 
                      title={section.title}
                      allowFullScreen
                      onLoad={() => setContentInteraction(prev => ({...prev, [lesson.id]: true}))}
                    />
                  </div>
                ) : (
                  <div 
                    dangerouslySetInnerHTML={{ __html: section.content }} 
                    onClick={() => setContentInteraction(prev => ({...prev, [lesson.id]: true}))}
                  />
                )}
                
                {section.subsections?.length > 0 && (
                  <div className="subsections ms-4">
                    {section.subsections.map((sub: any) => (
                      <div key={sub.id} className="subsection mb-3">
                        <h6 className="fs-6">{sub.title}</h6>
                        
                        {/* Handle subsection content based on content_type */}
                        {sub.content_type === 'VIDEO' ? (
                          <div className="ratio ratio-16x9 mb-3">
                            <iframe 
                              src={convertToEmbedUrl(sub.video_url)} 
                              title={sub.title}
                              allowFullScreen
                              onLoad={() => setContentInteraction(prev => ({...prev, [lesson.id]: true}))}
                            />
                          </div>
                        ) : (
                          <div 
                            dangerouslySetInnerHTML={{ __html: sub.content }} 
                            onClick={() => setContentInteraction(prev => ({...prev, [lesson.id]: true}))}
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
            width: '280px',
            zIndex: 999,
            left: mobileSidebarOpen ? '0' : '-280px',
            transition: 'left 0.3s ease'
          }}
        >
          <LearnerSidebar />
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
                      <div className="accordion" id="lessonsAccordion" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                        {lessons.map((lesson) => (
                          <div key={lesson.id} className="lesson-section" style={{ wordBreak: 'break-word' }}>
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
                                {contentInteraction[lesson.id] && !lessonProgress[lesson.id]?.is_completed && (
                                  <div className="mt-2 text-end">
                                    <button 
                                      onClick={() => handleLessonCompleted(lesson.id)}
                                      className="btn btn-sm btn-outline-primary"
                                    >
                                      Mark as Completed
                                    </button>
                                  </div>
                                )}
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
                            className={`btn ${surveyCompleted ? 'btn-outline-primary' : 'btn-primary'}`}
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
                            className="btn btn-outline-primary flex-grow-1 flex-sm-grow-0"
                          >
                            <ChevronLeft className="me-1" />
                            Previous Module
                          </Link>
                        )}
                        {!getPreviousModule() && <div></div>}
                        
                        {!isLastModule ? (
                          <Link
                            href={`/dashboard/learn/${courseId}/${getNextModule()?.id}`}
                            className="btn btn-outline-primary"
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