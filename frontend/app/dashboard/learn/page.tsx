'use client'

import { useState, useEffect } from 'react'
import { coursesApi } from '@/lib/api'
import TopNavbar from '@/components/TopNavbar';
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu, Clock, BookOpen, PlayCircle, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesApi.getUserEnrollments()
        if (response.data) {
          // Fetch progress and course details for each enrollment
          const coursesWithProgress = await Promise.all(
            response.data.map(async (enrollment: any) => {
              try {
                const [progressRes, courseRes] = await Promise.all([
                  coursesApi.getCourseProgress(enrollment.course_id),
                  coursesApi.getCourse(enrollment.course_id)
                ])
                
                return {
                  ...enrollment,
                  progress: progressRes.data,
                  course_details: courseRes.data
                }
              } catch (error) {
                console.error(`Error fetching data for course ${enrollment.course_id}:`, error)
                return {
                  ...enrollment,
                  progress: null,
                  course_details: null
                }
              }
            })
          )
          setCourses(coursesWithProgress)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // Helper function to truncate text
  const truncateText = (text: string, wordLimit: number = 15) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

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
            {/* Header Section */}
            <div className="bg-danger text-white">
             <div className="container py-2 py-md-3 py-lg-5">
                <div className="row align-items-center">
                  <div className="col-lg-8">
                    <nav aria-label="breadcrumb" className="mb-4">
                      <ol className="breadcrumb breadcrumb-dark">
                        <li className="breadcrumb-item">
                          <Link href="/dashboard" className="text-white-50">Dashboard</Link>
                        </li>
                        <li className="breadcrumb-item active text-white" aria-current="page">
                          My Courses
                        </li>
                      </ol>
                    </nav>

                    <h2 className="h4 mb-3">My Learning Journey</h2>
                    <p className="lead mb-4 opacity-50">
                      Continue your progress and track your learning achievements
                    </p>

                    {/* Stats */}
                    <div className="d-flex flex-wrap gap-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h4 className="mb-0 fw-bold">{courses.length}</h4>
                          <small className="opacity-75">Enrolled Courses</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                          <Award size={24} />
                        </div>
                        <div>
                          <h4 className="mb-0 fw-bold">
                            {courses.filter(course => course.progress?.percentage === 100).length}
                          </h4>
                          <small className="opacity-75">Completed</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <h4 className="mb-0 fw-bold">
                            {Math.round(courses.reduce((acc, course) => acc + (course.progress?.percentage || 0), 0) / Math.max(courses.length, 1))}%
                          </h4>
                          <small className="opacity-75">Average Progress</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Section */}
            <div className="container py-2 py-md-3 py-lg-5">
              {loading ? (
                <div className="d-flex justify-content-center py-5">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : courses.length > 0 ? (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {courses.map((enrollment) => (
                    <div key={enrollment.course_id} className="col">
                      <div className="card h-100 shadow-sm border-0 course-card">
                        {/* Course Image */}
                        <div className="position-relative">
                          <img 
                            src={enrollment.course_details?.thumbnail || '/images/course-placeholder.jpg'} 
                            className="card-img-top" 
                            alt={enrollment.course_title}
                            style={{ 
                              height: '200px', 
                              objectFit: 'cover',
                              borderTopLeftRadius: '0.375rem',
                              borderTopRightRadius: '0.375rem'
                            }}
                          />
                          {/* Progress Badge */}
                          <div className="position-absolute top-0 end-0 m-2">
                            <span className={`badge ${enrollment.progress?.percentage === 100 ? 'bg-success' : 'bg-danger'}`}>
                              {Math.round(enrollment.progress?.percentage || 0)}% Complete
                            </span>
                          </div>
                          
                          {/* Completion Overlay */}
                          {enrollment.progress?.percentage === 100 && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-success bg-opacity-20 d-flex align-items-center justify-content-center">
                              <div className="text-center text-white">
                                <Award size={48} className="mb-2" />
                                <h6 className="mb-0">Course Completed!</h6>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="card-body d-flex flex-column">
                          {/* Course Title */}
                          <h5 className="card-title mb-3" style={{ 
                            minHeight: '48px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {enrollment.course_title}
                          </h5>
                          
                          {/* Course Description */}
                          <p className="card-text text-muted flex-grow-1 mb-3" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '72px'
                          }}>
                            {truncateText(enrollment.course_details?.description, 20)}
                          </p>
                          
                          {/* Progress Section */}
                          <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <small className="text-muted">Your Progress</small>
                              <small className="fw-semibold">
                                {Math.round(enrollment.progress?.percentage || 0)}%
                              </small>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div 
                                className={`progress-bar ${enrollment.progress?.percentage === 100 ? 'bg-success' : ''}`}
                                role="progressbar" 
                                style={{ width: `${enrollment.progress?.percentage || 0}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">
                              {enrollment.progress?.completed || 0} of {enrollment.progress?.total || 0} lessons completed
                            </small>
                          </div>
                          
                          {/* Course Metadata */}
                          <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                            <div className="d-flex align-items-center">
                              <Clock size={16} className="me-1" />
                              <small>
                                {typeof enrollment.course_details?.actual_duration_hours === 'object' 
                                  ? enrollment.course_details.actual_duration_hours.parsedValue || 0
                                  : enrollment.course_details?.actual_duration_hours || enrollment.course_details?.duration_hours || 0
                                }h
                              </small>
                            </div>
                            <div className="d-flex align-items-center">
                              <BookOpen size={16} className="me-1" />
                              <small>{enrollment.course_details?.module_count || 0} modules</small>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="mt-auto">
                            <Link 
                              href={`/dashboard/learn/${enrollment.course_id}`}
                              className={`btn w-100 d-flex align-items-center justify-content-center ${
                                enrollment.progress?.percentage === 100 
                                  ? 'btn-outline-success' 
                                  : enrollment.progress?.percentage === 0 
                                    ? 'btn-danger' 
                                    : 'btn-danger'
                              }`}
                            >
                              <PlayCircle size={18} className="me-2" />
                              {enrollment.progress?.percentage === 100 
                                ? 'Review Course' 
                                : enrollment.progress?.percentage === 0 
                                  ? 'Start Learning' 
                                  : 'Continue Learning'
                              }
                            </Link>
                            
                            {enrollment.progress?.percentage === 100 && (
                              <div className="mt-2 text-center">
                                <small className="text-success">
                                  <Award size={14} className="me-1" />
                                  Certificate Available
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="bg-light rounded-3 p-5">
                    <BookOpen size={64} className="text-muted mb-4" />
                    <h3 className="text-muted mb-3">No Enrolled Courses</h3>
                    <p className="lead text-muted mb-4">
                      You haven't enrolled in any courses yet. Start your learning journey today!
                    </p>
                    <Link href="/dashboard/courses" className="btn btn-danger btn-lg px-4">
                      <BookOpen size={18} className="me-2" />
                      Browse All Courses
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .course-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .course-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </ProtectedRoute>
  );
}