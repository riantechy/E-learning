'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { coursesApi, assessmentsApi, certificatesApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function LessonPage() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string
    moduleId: string
    lessonId: string
  }>()
  const router = useRouter()
  const [lesson, setLesson] = useState<any>(null)
  const [module, setModule] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sections, setSections] = useState<any[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [lessonRes, moduleRes, courseRes, progressRes, sectionsRes] = await Promise.all([
          coursesApi.getLesson(courseId, moduleId, lessonId),
          coursesApi.getModule(courseId, moduleId),
          coursesApi.getCourse(courseId),
          coursesApi.getUserProgress(),
          coursesApi.getLessonSections(courseId, moduleId, lessonId)
        ])

        if (lessonRes.data) setLesson(lessonRes.data)
        if (moduleRes.data) setModule(moduleRes.data)
        if (courseRes.data) setCourse(courseRes.data)
        if (sectionsRes.data) setSections(sectionsRes.data)
        
        if (progressRes.data) {
          const lessonProgress = progressRes.data.find((p: any) => p.lesson.id === lessonId)
          if (lessonProgress) setCompleted(lessonProgress.is_completed)
        }
        
        if (lessonRes.data?.content_type === 'QUIZ') {
          const questionsRes = await assessmentsApi.getQuestions(lessonId)
          if (questionsRes.data) setQuestions(questionsRes.data)
        }
      } catch (error) {
        console.error('Error fetching lesson data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, moduleId, lessonId])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const renderSections = (sections: any[]) => {
    return sections.map((section) => {
      const hasSubsections = section.subsections && section.subsections.length > 0
      const isExpanded = expandedSections[section.id] || false

      return (
        <div key={section.id} className="mb-4">
          <div 
            className={`d-flex align-items-center ${hasSubsections ? 'cursor-pointer' : ''}`}
            onClick={() => hasSubsections && toggleSection(section.id)}
          >
            {hasSubsections && (
              <span className="me-2">
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </span>
            )}
            <h4 className={`mb-2 ${section.is_subsection ? 'h5 ms-3' : 'h4'}`}>
              {section.title}
            </h4>
          </div>
          
          {isExpanded && hasSubsections && (
            <div className="ms-4">
              {renderSections(section.subsections || [])}
            </div>
          )}
          
          <div 
            className={`lesson-content ${section.is_subsection ? 'ms-4' : ''}`}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </div>
      )
    })
  }

  const handleCompleteLesson = async () => {
    try {
      const res = await coursesApi.updateProgress(lessonId, true);
      if (res.data) {
        setCompleted(true);
        // Refresh both local data and router state
        const [progressRes] = await Promise.all([
          coursesApi.getUserProgress(),
          router.refresh()
        ]);
        
        if (progressRes.data) {
          const lessonProgress = progressRes.data.find((p: any) => p.lesson.id === lessonId);
          if (lessonProgress) setCompleted(lessonProgress.is_completed);
        }
  
        // Check if course is complete for certificate
        const courseProgress = await coursesApi.getCourseProgress(courseId);
        if (courseProgress.data?.percentage === 100) {
          await certificatesApi.getCourseCertificate(courseId);
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true)
  }

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }))
  }

  const handleSubmitQuiz = async () => {
    try {
      const res = await assessmentsApi.submitQuiz(lessonId, {
        answers: userAnswers
      })
      if (res.data) {
        setQuizSubmitted(true)
        setQuizScore(res.data.score)
        
        if (res.data.passed) {
          await coursesApi.updateProgress(lessonId, true)
          setCompleted(true)
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    }
  }

  const getCurrentLessonIndex = () => {
    return module.lessons?.findIndex((l: any) => l.id === lessonId) || 0;
  };
  
  const hasPreviousLesson = () => {
    return getCurrentLessonIndex() > 0;
  };
  
  const hasNextLesson = () => {
    return getCurrentLessonIndex() < (module.lessons?.length || 0) - 1;
  };
  
  const handlePreviousLesson = () => {
    const prevIndex = getCurrentLessonIndex() - 1;
    if (prevIndex >= 0) {
      router.push(`/dashboard/learn/${courseId}/${moduleId}/${module.lessons[prevIndex].id}`);
    }
  };
  
  // const handleNextLesson = () => {
  //   const nextIndex = getCurrentLessonIndex() + 1;
  //   if (nextIndex < module.lessons?.length) {
  //     router.push(`/dashboard/learn/${courseId}/${moduleId}/${module.lessons[nextIndex].id}`);
  //   } else {
  //     router.push(`/dashboard/learn/${courseId}/${moduleId}`);
  //   }
  // };

  const handleNextLesson = () => {
    if (!module?.lessons) {
      router.push(`/dashboard/learn/${courseId}/${moduleId}`);
      return;
    }
  
    const currentIndex = module.lessons.findIndex((l: any) => l.id === lessonId);
      if (currentIndex !== undefined && currentIndex < module.lessons.length - 1) {
        router.push(`/dashboard/learn/${courseId}/${moduleId}/${module.lessons[currentIndex + 1].id}`);
      } else {
        router.push(`/dashboard/learn/${courseId}/${moduleId}`);
      }
    };

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

  if (!lesson || !module || !course) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto">
            <div className="container py-5">
              <div className="alert alert-danger">Lesson not found</div>
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
                <li className="breadcrumb-item">
                  <Link href={`/dashboard/learn/${courseId}/${moduleId}`}>{module.title}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {lesson.title}
                </li>
              </ol>
            </nav>

            <div className="row">
              <div className="col-md-8">
                <div className="card mb-4">
                  <div className="card-header">
                    <small className="text-muted">
                      Module: {module.title} • {lesson.duration_minutes} min
                    </small>
                    <h5>{lesson.title}</h5>
                  </div>
                  <div className="card-body">
                    {lesson.content_type === 'QUIZ' ? (
                      <div className="quiz-container">
                        {!quizStarted ? (
                          <div className="text-center py-4">
                            <h5>Quiz: {lesson.title}</h5>
                            <p>This quiz contains {questions.length} questions.</p>
                            <p>You need to score at least 70% to pass.</p>
                            <button 
                              onClick={handleStartQuiz} 
                              className="btn btn-primary btn-lg"
                            >
                              Start Quiz
                            </button>
                          </div>
                        ) : !quizSubmitted ? (
                          <div>
                            <h5 className="mb-4">Quiz Questions</h5>
                            {questions.map((question, index) => (
                              <div key={question.id} className="mb-4">
                                <h6>Question {index + 1}: {question.question_text}</h6>
                                {question.question_type === 'MCQ' ? (
                                  <div className="list-group">
                                    {question.answers.map((answer: any) => (
                                      <div key={answer.id} className="list-group-item">
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="radio"
                                            name={`question-${question.id}`}
                                            id={`answer-${answer.id}`}
                                            checked={userAnswers[question.id] === answer.id}
                                            onChange={() => handleAnswerSelect(question.id, answer.id)}
                                          />
                                          <label 
                                            className="form-check-label w-100" 
                                            htmlFor={`answer-${answer.id}`}
                                          >
                                            {answer.answer_text}
                                          </label>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : question.question_type === 'TF' ? (
                                  <div className="btn-group" role="group">
                                    {question.answers.map((answer: any) => (
                                      <button
                                        key={answer.id}
                                        type="button"
                                        className={`btn ${userAnswers[question.id] === answer.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => handleAnswerSelect(question.id, answer.id)}
                                      >
                                        {answer.answer_text}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={userAnswers[question.id] || ''}
                                    onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                                  />
                                )}
                              </div>
                            ))}
                            <button
                              onClick={handleSubmitQuiz}
                              className="btn btn-success mt-3"
                              disabled={Object.keys(userAnswers).length !== questions.length}
                            >
                              Submit Quiz
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <h6>Quiz Results</h6>
                            <div className={`alert ${quizScore && quizScore >= 70 ? 'alert-success' : 'alert-danger'}`}>
                              <h5>Your Score: {quizScore}%</h5>
                              <p>
                                {quizScore && quizScore >= 70 
                                  ? 'Congratulations! You passed the quiz.' 
                                  : 'You did not pass the quiz. Please review the material and try again.'}
                              </p>
                            </div>
                            {quizScore && quizScore >= 70 ? (
                              <button
                                onClick={handleNextLesson}
                                className="btn btn-primary"
                              >
                                {module?.lessons && module.lessons.findIndex((l: any) => l.id === lessonId) < module.lessons.length - 1
                                  ? 'Continue to Next Lesson'
                                  : 'Back to Module'}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setQuizStarted(false)
                                  setQuizSubmitted(false)
                                  setUserAnswers({})
                                }}
                                className="btn btn-primary"
                              >
                                Retake Quiz
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {lesson.content_type === 'VIDEO' && (
                          <div className="ratio ratio-16x9 mb-4">
                            <iframe 
                              src={lesson.content} 
                              title={lesson.title}
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}
                        {lesson.content_type === 'PDF' && (
                          <div className="mb-4">
                            <iframe 
                              src={lesson.content} 
                              className="w-100" 
                              style={{ height: '500px' }}
                              title={lesson.title}
                            ></iframe>
                          </div>
                        )}
                        {lesson.content_type === 'TEXT' && (
                          <div className="lesson-content">
                            {sections.length > 0 ? (
                              <div className="sections-container">
                                {renderSections(sections.filter((s: any) => !s.parent_section))}
                              </div>
                            ) : (
                              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                            )}
                          </div>
                        )}
                        {!completed && lesson.content_type !== 'QUIZ' && (
                          <div className="text-center mt-4">
                            <button 
                              onClick={handleCompleteLesson} 
                              className="btn btn-success btn-sm"
                            >
                              Mark as Completed
                            </button>
                          </div>
                        )}
                        {completed && (
                          <div className="alert alert-success mt-4">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <span>✓ You've completed this lesson</span>
                                {quizSubmitted && quizScore && (
                                  <div className="mt-2">
                                    <strong>Quiz Score:</strong> {quizScore}%
                                  </div>
                                )}
                              </div>
                              <div className="d-flex justify-content-between mt-2">
                              <button
                                onClick={() => handlePreviousLesson(lesson.id)}
                                disabled={index === 0}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                <ChevronLeft size={16} /> Previous
                              </button>
                              <button
                                onClick={() => handleNextLesson(lesson.id)}
                                disabled={index === lessons.length - 1}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                Next <ChevronRight size={16} />
                              </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-header">
                    <h6>Course Progress</h6>
                  </div>
                  <div className="card-body">
                    <div className="progress mb-3">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${course.progress?.percentage || 0}%` }}
                      ></div>
                    </div>
                    <p>{course.progress?.completed || 0} of {course.progress?.total || 0} lessons completed</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <h6>Course Modules</h6>
                  </div>
                  <div className="list-group list-group-flush">
                    {course.modules?.map((mod: any) => (
                      <div key={mod.id} className="list-group-item">
                        <h6>{mod.title}</h6>
                        <div className="list-group">
                          {mod.lessons?.map((les: any) => (
                            <Link
                              key={les.id}
                              href={`/dashboard/learn/${courseId}/${mod.id}/${les.id}`}
                              className={`list-group-item list-group-item-action ${
                                les.id === lessonId ? 'active' : ''
                              }`}
                            >
                              <div className="d-flex justify-content-between">
                                <span>{les.title}</span>
                                {les.is_completed && (
                                  <span className="badge bg-success">✓</span>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
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