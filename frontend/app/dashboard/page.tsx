// app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import TopNavbar from '@/components/TopNavbar'
import { Progress } from '@/components/ui/progress'
import { useEffect, useState } from 'react'
import { coursesApi, certificatesApi } from '@/lib/api'
import { Menu } from 'lucide-react'

interface CourseProgress {
  course_id: string;
  course_title: string;
  percentage: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    certificatesCount: 0,
  })
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch all data in parallel
        const [enrollmentsRes, certificatesRes] = await Promise.all([
          coursesApi.getUserEnrollments(),
          certificatesApi.getUserCertificates(),
        ])

        // Initialize progress data
        let completedCourses = 0
        const progressData: CourseProgress[] = []

        // Process enrollments to get progress for each course
        if (enrollmentsRes.data) {
          for (const enrollment of enrollmentsRes.data) {
            const progressRes = await coursesApi.getCourseProgress(enrollment.course_id)
            if (progressRes.data) {
              progressData.push({
                course_id: enrollment.course_id,
                course_title: enrollment.course_title,
                percentage: progressRes.data.percentage || 0
              })
              if (progressRes.data.percentage === 100) {
                completedCourses++
              }
            }
          }
        }

        setStats({
          enrolledCourses: enrollmentsRes.data?.length || 0,
          completedCourses,
          certificatesCount: certificatesRes.data?.length || 0
        })
        setCourseProgress(progressData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  // Fix hydration error by using span instead of div inside p
  const renderStatValue = (value: number) => (
    loading ? (
      <span className="spinner-border spinner-border-sm" role="status">
        <span className="visually-hidden">Loading...</span>
      </span>
    ) : (
      value
    )
  )
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main 
          className="flex-grow-1 p-4 overflow-auto"
          style={{
            width: 'calc(100%)',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 mb-0">Welcome back, {user?.first_name}!</h1>
            <button 
              onClick={logout} 
              className="btn btn-outline-danger"
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </div>

          {/* Stats Cards */}
          <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Enrolled Courses</h5>
              <p className="card-text display-4">
                {renderStatValue(stats.enrolledCourses)}
              </p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Completed Courses</h5>
              <p className="card-text display-4">
                {renderStatValue(stats.completedCourses)}
              </p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Certificates Earned</h5>
              <p className="card-text display-4">
                {renderStatValue(stats.certificatesCount)}
              </p>
            </div>
          </div>
        </div>
      </div>

          {/* Progress Section */}
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="card mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Your Course Progress</h5>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : courseProgress.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {courseProgress.map((course) => (
                        <div key={course.course_id} className="list-group-item">
                          <div className="d-flex justify-content-between mb-2">
                            <h6 className="mb-0">{course.course_title}</h6>
                            <small>{course.percentage}%</small>
                          </div>
                          <Progress value={course.percentage} className="h-10px" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p>You haven't enrolled in any courses yet.</p>
                      <a href="/dashboard/courses" className="btn btn-primary">
                        Browse Courses
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Certificates */}
            <div className="col-12 col-lg-4">
              <div className="card h-100">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Recent Certificates</h5>
                </div>
                <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : stats.certificatesCount > 0 ? (
                    <div className="list-group list-group-flush">
                      {/* Certificate items would be rendered here */}
                      <div className="text-center py-4">
                        <p>View all certificates to see details</p>
                        <a href="/dashboard/certificates" className="btn btn-outline-primary">
                          View Certificates
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p>No certificates earned yet.</p>
                      <p>Complete courses to earn certificates!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Information Section */}
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h5 className="card-title text-lg font-semibold">User Information</h5>
              <div className="overflow-x-auto">
                <table className="table table-borderless w-full">
                  <tbody>
                    <tr>
                      <th className="w-[120px]">Email:</th>
                      <td>{user?.email}</td>
                    </tr>
                    <tr>
                      <th>Name:</th>
                      <td>{user?.first_name} {user?.last_name}</td>
                    </tr>
                    <tr>
                      <th>Role:</th>
                      <td>
                        <span className="badge bg-primary">
                          {user?.role}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}