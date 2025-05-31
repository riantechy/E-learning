// dashboard/learn/[courseId]/[moduleId]/[lessonId]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { coursesApi, assessmentsApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lesson, module, and course data
        const [lessonRes, moduleRes, courseRes, progressRes] = await Promise.all([
          coursesApi.getLesson(courseId, moduleId, lessonId),
          coursesApi.getModule(courseId, moduleId),
          coursesApi.getCourse(courseId),
          coursesApi.getUserProgress()
        ]);

        if (lessonRes.data) setLesson(lessonRes.data)
        if (moduleRes.data) setModule(moduleRes.data)
        if (courseRes.data) setCourse(courseRes.data)
        
        // Check if lesson is completed
        if (progressRes.data) {
          const lessonProgress = progressRes.data.find((p: any) => p.lesson.id === lessonId)
          if (lessonProgress) setCompleted(lessonProgress.is_completed)
        }
        
        // For quiz lessons, load questions
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

  const handleCompleteLesson = async () => {
    try {
      const res = await coursesApi.updateProgress(lessonId, true)
      if (res.data) {
        setCompleted(true)
        // Redirect to next lesson or back to course
        router.push(`/courses/${courseId}`)
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
    }
  }

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
        // Automatically mark as completed if passed
        if (res.data.passed) {
          await coursesApi.updateProgress(lessonId, true)
          setCompleted(true)
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
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
                  <Link href={`/courses/${courseId}`}>{course.title}</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href={`/courses/${courseId}`}>{module.title}</Link>
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
                    <h2>{lesson.title}</h2>
                    <small className="text-muted">
                      Module: {module.title} • {lesson.duration_minutes} min
                    </small>
                  </div>
                  <div className="card-body">
                    {lesson.content_type === 'QUIZ' ? (
                      <div className="quiz-container">
                        {!quizStarted ? (
                          <div className="text-center py-4">
                            <h4>Quiz: {lesson.title}</h4>
                            <p>This quiz contains {questions.length} questions.</p>
                            <button 
                              onClick={handleStartQuiz} 
                              className="btn btn-primary btn-lg"
                            >
                              Start Quiz
                            </button>
                          </div>
                        ) : !quizSubmitted ? (
                          <div>
                            <h4 className="mb-4">Quiz Questions</h4>
                            {questions.map((question, index) => (
                              <div key={question.id} className="mb-4">
                                <h5>Question {index + 1}: {question.question_text}</h5>
                                <div className="list-group">
                                  {question.answers.map((answer: any) => (
                                    <button
                                      key={answer.id}
                                      className={`list-group-item list-group-item-action text-start ${
                                        userAnswers[question.id] === answer.id ? 'active' : ''
                                      }`}
                                      onClick={() => handleAnswerSelect(question.id, answer.id)}
                                    >
                                      {answer.answer_text}
                                    </button>
                                  ))}
                                </div>
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
                            <h4>Quiz Results</h4>
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
                                onClick={() => router.push(`/courses/${courseId}`)}
                                className="btn btn-primary"
                              >
                                Continue to Next Lesson
                              </button>
                            ) : (
                              <button
                                onClick={() => setQuizStarted(false)}
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
                          <div 
                            className="lesson-content mb-4" 
                            dangerouslySetInnerHTML={{ __html: lesson.content }}
                          />
                        )}
                        {!completed && lesson.content_type !== 'QUIZ' && (
                          <div className="text-center mt-4">
                            <button 
                              onClick={handleCompleteLesson} 
                              className="btn btn-success btn-lg"
                            >
                              Mark as Completed
                            </button>
                          </div>
                        )}
                        {completed && (
                          <div className="alert alert-success mt-4">
                            ✓ You've completed this lesson
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
                    <h5>Course Progress</h5>
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
                    <h5>Course Modules</h5>
                  </div>
                  <div className="list-group list-group-flush">
                    {course.modules?.map((mod: any) => (
                      <div key={mod.id} className="list-group-item">
                        <h6>{mod.title}</h6>
                        <div className="list-group">
                          {mod.lessons?.map((les: any) => (
                            <Link
                              key={les.id}
                              href={`/learn/${courseId}/${mod.id}/${les.id}`}
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