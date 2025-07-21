'use client'

import { useState, useEffect } from 'react'
import { coursesApi } from '@/lib/api'
import TopNavbar from '@/components/TopNavbar';
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'
import Link from 'next/link'

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesApi.getUserEnrollments()
        if (response.data) {
          // Fetch progress for each course
          const coursesWithProgress = await Promise.all(
            response.data.map(async (course: any) => {
              const progress = await coursesApi.getCourseProgress(course.course_id)
              return {
                ...course,
                progress: progress.data
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
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1>My Courses</h1>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : courses.length > 0 ? (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {courses.map((course) => (
                  <div key={course.course_id} className="col">
                    <div className="card h-100">
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{course.course_title}</h5>
                        <div className="progress mb-3">
                          <div 
                            className="progress-bar" 
                            role="progressbar" 
                            style={{ width: `${course.progress?.percentage || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-muted">
                          {course.progress?.completed || 0} of {course.progress?.total || 0} lessons completed
                        </p>
                        <Link 
                          href={`/dashboard/learn/${course.course_id}`}
                          className="btn btn-primary mt-auto"
                        >
                          {course.progress?.percentage === 0 ? 'Start Course' : 'Continue Learning'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-book display-4 text-muted mb-3"></i>
                <h3>No Enrolled Courses</h3>
                <p className="lead">
                  You haven't enrolled in any courses yet.
                </p>
                <Link href="/dashboard/courses" className="btn btn-primary btn-lg">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}