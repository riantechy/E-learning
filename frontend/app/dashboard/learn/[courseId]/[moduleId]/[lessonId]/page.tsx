'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { coursesApi, assessmentsApi, UserResponse } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu, ChevronRight, ChevronLeft } from 'lucide-react'
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
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [userResponses, setUserResponses] = useState<UserResponse[]>([])
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [lessonRes, moduleRes, courseRes, progressRes] = await Promise.all([
          coursesApi.getLesson(courseId, moduleId, lessonId),
          coursesApi.getModule(courseId, moduleId),
          coursesApi.getCourse(courseId),
          coursesApi.getUserProgress()
        ])
    
        if (lessonRes.data) {
          setLesson(lessonRes.data)
          if (lessonRes.data.content_type === 'QUIZ') {
            const questionsRes = await assessmentsApi.getQuestions(lessonId)
            if (questionsRes.data) {
              // Extract the array, handling paginated response
              const q = questionsRes.data.results || questionsRes.data
              setQuestions(Array.isArray(q) ? q : [])
            }
          }
        }
        if (moduleRes.data) setModule(moduleRes.data)
        if (courseRes.data) setCourse(courseRes.data)
        
        if (progressRes.data) {
          const lessonProgress = progressRes.data.find((p: any) => p.lesson.id === lessonId)
          if (lessonProgress) setCompleted(lessonProgress.is_completed)
        }
      } catch (error) {
        console.error('Error fetching lesson data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, moduleId, lessonId])

  const handleStartQuiz = () => {
    setQuizStarted(true)
  }

  const handleAnswerSelect = (questionId: string, answerId: string, questionType: string) => {
    setUserAnswers(prev => {
      if (questionType === 'MCQ') {
        const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : []
        if (currentAnswers.includes(answerId)) {
          // Remove answer if already selected
          return {
            ...prev,
            [questionId]: currentAnswers.filter(id => id !== answerId)
          }
        } else {
          // Add answer
          return {
            ...prev,
            [questionId]: [...currentAnswers, answerId]
          }
        }
      } else {
        // For TF and SA, keep single answer
        return {
          ...prev,
          [questionId]: answerId
        }
      }
    })
  }

  const handleSubmitQuiz = async () => {
  try {
    const res = await assessmentsApi.submitQuiz(lessonId, {
      answers: userAnswers
    });
    
    if (res.data) {
      setQuizSubmitted(true);
      setQuizScore(res.data.score);
      setAttemptId(res.data.attempt_id); // This should now work
      
      if (res.data.passed) {
        await coursesApi.updateProgress(lessonId, true);
        setCompleted(true);
        router.refresh();
      }

      // Fetch responses immediately after submission
      if (res.data.attempt_id) {
        const responsesRes = await assessmentsApi.getAttemptResponses(res.data.attempt_id);
        if (responsesRes.data) {
          setUserResponses(responsesRes.data);
        }
      }
    }
  } catch (error) {
    console.error('Error submitting quiz:', error);
  }
}

  const renderReview = () => {
    return (
      <div className="mt-4">
        <h5>Quiz Review</h5>
        {questions.map((question, index) => {
          // Find all user responses for this question
          const responses = userResponses.filter(r => r.question === question.id);
          
          return (
            <div key={question.id} className="mb-4 border-bottom pb-3">
              <h6>Question {index + 1}: {question.question_text}</h6>
              {question.question_type === 'MCQ' ? (
                <div className="list-group">
                  {question.answers.map((answer: any) => {
                    // Check if this answer was selected by the user
                    const isSelected = responses.some(r => r.selected_answer === answer.id);
                    
                    let className = "list-group-item";
                    let statusText = "";
                    
                    if (isSelected) {
                      className += answer.is_correct ? " list-group-item-success" : " list-group-item-danger";
                      statusText = answer.is_correct ? " ✓ (Correct)" : " ✗ (Incorrect)";
                    }
                    
                    return (
                      <div key={answer.id} className={className}>
                        {answer.answer_text}
                        {statusText}
                      </div>
                    );
                  })}
                  {responses.length === 0 && (
                    <div className="list-group-item list-group-item-danger">
                      No answer selected
                    </div>
                  )}
                </div>
              ) : question.question_type === 'TF' ? (
                <div className="list-group">
                  {question.answers.map((answer: any) => {
                    // Check if this answer was selected by the user
                    const isSelected = responses.some(r => r.selected_answer === answer.id);
                    
                    let className = "list-group-item";
                    let statusText = "";
                    
                    if (isSelected) {
                      className += answer.is_correct ? " list-group-item-success" : " list-group-item-danger";
                      statusText = answer.is_correct ? " ✓ (Correct)" : " ✗ (Incorrect)";
                    }
                    
                    return (
                      <div key={answer.id} className={className}>
                        {answer.answer_text}
                        {statusText}
                      </div>
                    );
                  })}
                  {responses.length === 0 && (
                    <div className="list-group-item list-group-item-danger">
                      No answer selected
                    </div>
                  )}
                </div>
              ) : (
                <div className="list-group">
                  {responses.map((response, idx) => (
                    <div key={idx} className="list-group-item list-group-item-warning">
                      Your response: {response.text_response || 'No response provided'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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

  if (lesson.content_type !== 'QUIZ') {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto">
            <div className="container py-5">
              <div className="alert alert-danger">This page is only for quiz lessons</div>
              <Link 
                href={`/dashboard/learn/${courseId}/${moduleId}`}
                className="btn btn-danger"
              >
                Back to Module
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

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

        <main 
          className="flex-grow-1 overflow-auto"
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
                      Module: {module.title} • Quiz
                    </small>
                    <h5>{lesson.title}</h5>
                  </div>
                  <div className="card-body">
                    <div className="quiz-container">
                      {!quizStarted ? (
                        <div className="text-center py-4">
                          <h5>Quiz: {lesson.title}</h5>
                          <p>This quiz contains {questions.length} questions.</p>
                          <p>You need to score at least 70% to pass.</p>
                          <p>For multiple-choice questions, select all answers that apply.</p>
                          <button 
                            onClick={handleStartQuiz} 
                            className="btn btn-danger btn-sm"
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
                                          type="checkbox"
                                          name={`question-${question.id}`}
                                          id={`answer-${answer.id}`}
                                          checked={Array.isArray(userAnswers[question.id]) && (userAnswers[question.id] as string[]).includes(answer.id)}
                                          onChange={() => handleAnswerSelect(question.id, answer.id, question.question_type)}
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
                                      className={`btn ${userAnswers[question.id] === answer.id ? 'btn-danger' : 'btn-outline-danger'}`}
                                      onClick={() => handleAnswerSelect(question.id, answer.id, question.question_type)}
                                    >
                                      {answer.answer_text}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control"
                                  value={typeof userAnswers[question.id] === 'string' ? userAnswers[question.id] : ''}
                                  onChange={(e) => handleAnswerSelect(question.id, e.target.value, question.question_type)}
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
                          <button
                            onClick={() => setShowReview(!showReview)}
                            className="btn btn-outline-danger mb-3"
                          >
                            {showReview ? 'Hide Review' : 'Review Answers'}
                          </button>
                          {showReview && renderReview()}
                          {quizScore && quizScore >= 70 ? (
                            <button
                              onClick={() => router.push(`/dashboard/learn/${courseId}/${moduleId}`)}
                              className="btn btn-danger"
                            >
                              Back to Module
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setQuizStarted(false)
                                setQuizSubmitted(false)
                                setUserAnswers({})
                                setShowReview(false)
                                setUserResponses([])
                              }}
                              className="btn btn-danger"
                            >
                              Retake Quiz
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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
                              className={`list-group-item list-group-item-action ${les.id === lessonId ? 'active' : ''}`}
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