'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TopNavbar from '@/components/TopNavbar';
import { coursesApi, categoriesApi } from '@/lib/api'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu, Clock, BookOpen, User, Calendar, ArrowRight, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Tab, Tabs } from 'react-bootstrap'

interface EnrollmentResponse {
  enrolled: boolean;
}

export default function CourseDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState<string>('General') 
  const [progress, setProgress] = useState<any>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, modulesRes, enrollmentRes, progressRes] = await Promise.all([
          coursesApi.getCourse(id as string),
          coursesApi.getModules(id as string),
          coursesApi.checkEnrollment(id as string),
          coursesApi.getCourseProgress(id as string)
        ]);

        if (courseRes.data) setCourse(courseRes.data)
           // Fetch category name if category exists
        if (courseRes.data.category) {
          if (typeof courseRes.data.category === 'object' && 'name' in courseRes.data.category) {
            setCategoryName(courseRes.data.category.name);
          } else if (typeof courseRes.data.category === 'string') {
            // Category is just an ID, fetch the name
            const name = await fetchCategoryName(courseRes.data.category);
            setCategoryName(name);
          }
        }
        if (modulesRes.data?.results) setModules(modulesRes.data.results)
        if (enrollmentRes.data) setEnrolled((enrollmentRes.data as EnrollmentResponse).enrolled)
        if (progressRes.data) setProgress(progressRes.data)
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const fetchCategoryName = async (categoryId: string) => {
    if (!categoryId) return 'General';
    
    try {
      const response = await categoriesApi.getCategory(categoryId);
      if (response.data) {
        return response.data.name;
      }
      return 'General';
    } catch (error) {
      console.error('Error fetching category:', error);
      return 'General';
    }
  };

  const handleEnroll = async () => {
    try {
      const res = await coursesApi.enroll(id as string)
      if (res.data?.success) {
        setEnrolled(true)
        const progressRes = await coursesApi.getCourseProgress(id as string)
        if (progressRes.data) setProgress(progressRes.data)
        
        // Redirect to learning page after enrollment
        router.push(`/dashboard/learn/${id}`);
      }
    } catch (error) {
      console.error('Error enrolling:', error)
    }
  }

  const handleContinueLearning = () => {
    router.push(`/dashboard/learn/${id}`);
  };

  // Helper function to truncate text
  const truncateText = (text: string, wordLimit: number = 25) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  }

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
            <div className="container py-5">
              <div className="alert alert-danger text-center">
                <h5>Course Not Found</h5>
                <p>The course you're looking for doesn't exist or is no longer available.</p>
                <Link href="/dashboard/courses" className="btn btn-primary">
                  Browse All Courses
                </Link>
              </div>
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
          className="d-lg-none btn btn-light position-fixed top-2 start-2 z-3 rounded-circle p-2"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          style={{
            zIndex: 1000,
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu size={20} />
        </button>

        {/* Sidebar */}
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

        {/* Overlay for mobile */}
        {mobileSidebarOpen && (
          <div 
            className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 998 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
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
            {/* Hero Section */}
            <div className="bg-primary text-white">
              <div className="container py-5">
                <nav aria-label="breadcrumb" className="mb-4">
                  <ol className="breadcrumb breadcrumb-dark">
                    <li className="breadcrumb-item">
                      <Link href="/dashboard" className="text-white-50">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link href="/dashboard/courses" className="text-white-50">Courses</Link>
                    </li>
                    <li className="breadcrumb-item active text-white" aria-current="page">
                      {course.title}
                    </li>
                  </ol>
                </nav>

                <div className="row align-items-center">
                  <div className="col-lg-8">
                    <div className="d-flex align-items-center mb-3">
                      <span className="badge bg-white text-primary me-3">
                        {categoryName} 
                      </span>
                      <div className="d-flex align-items-center text-white-50">
                        <Clock size={16} className="me-1" />
                        <span className="me-3">{course.actual_duration_hours || course.duration_hours || 0} hours</span>
                        <BookOpen size={16} className="me-1" />
                        <span>{modules.length} modules</span>
                      </div>
                    </div>
                    
                    <h6 className="fw-bold mb-3">{course.title}</h6>
                    <p className="text-white-50 mb-4">{truncateText(course.description, 30)}</p>

                    
                    <div className="d-flex flex-wrap gap-3">
                      {enrolled ? (
                        <>
                          <button 
                            onClick={handleContinueLearning}
                            className="btn btn-light btn-md d-flex align-items-center"
                          >
                            <PlayCircle size={10} className="me-2" />
                            Continue Learning
                            {progress && (
                              <span className="badge bg-primary ms-2">
                                {Math.round(progress.percentage)}%
                              </span>
                            )}
                          </button>
                          <Link 
                            href={`/dashboard/learn/${id}`}
                            className="btn btn-outline-light btn-md"
                          >
                            Course Overview
                          </Link>
                        </>
                      ) : (
                        <button 
                          onClick={handleEnroll}
                          className="btn btn-light btn-lg px-4"
                        >
                          Enroll Now - Start Learning
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-lg-4 mt-4 mt-lg-0">
                    <img 
                      src={course.thumbnail || '/images/course-placeholder.jpg'} 
                      className="img-fluid rounded-3 shadow"
                      alt={course.title}
                      style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="container py-5">
              <div className="row">
                <div className="col-lg-8">
                  <Tabs defaultActiveKey="modules" id="course-tabs" className="mb-4">
                    <Tab eventKey="modules" title={
                      <span className="d-flex align-items-center">
                        <BookOpen size={16} className="me-2" />
                        Course Content
                      </span>
                    }>
                      <div className="mt-4">
                        <h4 className="mb-4">What You'll Learn</h4>
                        
                        {modules.length === 0 ? (
                          <div className="text-center py-4">
                            <BookOpen size={48} className="text-muted mb-3" />
                            <h5 className="text-muted">No Modules Available</h5>
                            <p className="text-muted">Course content is being prepared.</p>
                          </div>
                        ) : (
                          <div className="accordion" id="modulesAccordion">
                            {modules.map((module, index) => (
                              <div key={module.id} className="card mb-3 border-0 shadow-sm">
                                <div className="card-header bg-white border-0">
                                  <h5 className="mb-0">
                                    <button
                                      className="btn btn-link text-decoration-none text-dark w-100 text-start d-flex justify-content-between align-items-center"
                                      type="button"
                                      data-bs-toggle="collapse"
                                      data-bs-target={`#module-${module.id}`}
                                    >
                                      <span>
                                        <span className="badge bg-primary me-3">
                                          Module {index + 1}
                                        </span>
                                        {module.title}
                                      </span>
                                      <ArrowRight size={16} />
                                    </button>
                                  </h5>
                                </div>
                                
                                <div
                                  id={`module-${module.id}`}
                                  className="collapse"
                                  data-bs-parent="#modulesAccordion"
                                >
                                  <div className="card-body">
                                    <p className="text-muted mb-3">{module.description}</p>
                                    
                                    {enrolled && module.lessons?.length > 0 && (
                                      <div className="list-group list-group-flush">
                                        {module.lessons.map((lesson: any) => (
                                          <div key={lesson.id} className="list-group-item border-0 px-0">
                                            <div className="d-flex justify-content-between align-items-center">
                                              <div className="d-flex align-items-center">
                                                <PlayCircle size={16} className="text-primary me-3" />
                                                <span>{lesson.title}</span>
                                              </div>
                                              <div className="d-flex align-items-center">
                                                <small className="text-muted me-3">
                                                  {lesson.duration_minutes} min
                                                </small>
                                                {lesson.is_completed && (
                                                  <span className="badge bg-success">Completed</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Tab>
                    
                    <Tab eventKey="details" title={
                      <span className="d-flex align-items-center">
                        <User size={16} className="me-2" />
                        Course Details
                      </span>
                    }>
                      <div className="mt-4">
                        <h4 className="mb-4">About This Course</h4>
                        <div className="row">
                          <div className="col-md-6">
                            <h6>Course Description</h6>
                            <p className="text-muted">{course.description}</p>
                          </div>
                          <div className="col-md-6">
                            <h6>Learning Objectives</h6>
                            <ul className="text-muted">
                              <li>Master key concepts and techniques</li>
                              <li>Apply knowledge to real-world scenarios</li>
                              <li>Develop practical skills</li>
                              <li>Gain industry-relevant expertise</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Tab>
                    
                    <Tab eventKey="certificate" title="Certificate">
                      <div className="mt-4">
                        <h4 className="mb-4">Course Certificate</h4>
                        {progress?.percentage === 100 ? (
                          <div className="alert alert-success border-0">
                            <div className="d-flex align-items-center">
                              <div className="flex-grow-1">
                                <h5 className="alert-heading">Congratulations!</h5>
                                <p className="mb-0">You've successfully completed this course and earned a certificate.</p>
                              </div>
                              <div>
                                <a 
                                  href={`/api/certificates/generate/${course.id}`} 
                                  className="btn btn-success"
                                >
                                  Download Certificate
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : enrolled ? (
                          <div className="alert alert-info border-0">
                            <h5 className="alert-heading">Earn Your Certificate</h5>
                            <p>Complete all course modules to receive your certificate of completion.</p>
                            <div className="progress mb-3" style={{ height: '8px' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${progress?.percentage || 0}%` }}
                              ></div>
                            </div>
                            <p className="mb-0">Current progress: {progress?.percentage || 0}%</p>
                          </div>
                        ) : (
                          <div className="alert alert-warning border-0">
                            <h5 className="alert-heading">Enroll to Get Certificate</h5>
                            <p className="mb-0">Enroll in this course and complete all modules to earn your certificate.</p>
                          </div>
                        )}
                      </div>
                    </Tab>
                  </Tabs>
                </div>
                
                <div className="col-lg-4">
                  <div className="sticky-top" style={{ top: '100px' }}>
                    {/* Enrollment Card */}
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-body text-center">
                        {enrolled ? (
                          <>
                            <div className="mb-4">
                              <h5 className="text-success mb-2">You're Enrolled!</h5>
                              {progress && (
                                <>
                                  <div className="progress mb-3" style={{ height: '10px' }}>
                                    <div 
                                      className="progress-bar bg-success" 
                                      role="progressbar" 
                                      style={{ width: `${progress.percentage}%` }}
                                    ></div>
                                  </div>
                                  <p className="mb-0">Progress: {Math.round(progress.percentage)}% Complete</p>
                                </>
                              )}
                            </div>
                            <button 
                              onClick={handleContinueLearning}
                              className="btn btn-success w-100 mb-2"
                            >
                              Continue Learning
                            </button>
                            <Link 
                              href={`/dashboard/learn/${id}`}
                              className="btn btn-outline-primary w-100"
                            >
                              Course Overview
                            </Link>
                          </>
                        ) : (
                          <>
                            <h5 className="mb-3">Start Learning Today</h5>
                            <button 
                              onClick={handleEnroll}
                              className="btn btn-primary w-100 btn-lg mb-3"
                            >
                              Enroll in Course
                            </button>
                            <small className="text-muted">
                              Free enrollment • Lifetime access
                            </small>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Course Info Card */}
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white border-0">
                        <h6 className="mb-0">Course Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="list-group list-group-flush">
                          <div className="list-group-item border-0 px-0 d-flex justify-content-between">
                            <span className="text-muted">
                              <Clock size={16} className="me-2" />
                              Duration
                            </span>
                            <span className="fw-semibold">
                              {course.actual_duration_hours || course.duration_hours || 0} hours
                            </span>
                          </div>
                          <div className="list-group-item border-0 px-0 d-flex justify-content-between">
                            <span className="text-muted">
                              <BookOpen size={16} className="me-2" />
                              Modules
                            </span>
                            <span className="fw-semibold">{modules.length}</span>
                          </div>
                          <div className="list-group-item border-0 px-0 d-flex justify-content-between">
                            <span className="text-muted">
                              <User size={16} className="me-2" />
                              Instructor
                            </span>
                            <span className="fw-semibold">{course.created_by?.name || 'ICT Authority'}</span>
                          </div>
                          <div className="list-group-item border-0 px-0 d-flex justify-content-between">
                            <span className="text-muted">
                              <Calendar size={16} className="me-2" />
                              Created
                            </span>
                            <span className="fw-semibold">
                              {new Date(course.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
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