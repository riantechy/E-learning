// app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Progress } from '@/components/ui/progress'
import { useEffect, useState } from 'react'
import { coursesApi, certificatesApi } from '@/lib/api'
import { Menu } from 'lucide-react'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [progress, setProgress] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const progressRes = await coursesApi.getUserProgress()
        const certsRes = await certificatesApi.getUserCertificates()
        
        if (progressRes.data) setProgress(progressRes.data)
        if (certsRes.data) setCertificates(certsRes.data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
                  <p className="card-text display-4">{progress.length}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title">Completed Courses</h5>
                  <p className="card-text display-4">
                    {progress.filter(p => p.percentage === 100).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h5 className="card-title">Certificates Earned</h5>
                  <p className="card-text display-4">{certificates.length}</p>
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
                  ) : progress.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {progress.map((course) => (
                        <div key={course.id} className="list-group-item">
                          <div className="d-flex justify-content-between mb-2">
                            <h6 className="mb-0">{course.title}</h6>
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
                  ) : certificates.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {certificates.slice(0, 3).map((cert) => (
                        <a 
                          key={cert.id} 
                          href={cert.pdf_file} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="list-group-item list-group-item-action"
                        >
                          <div className="d-flex justify-content-between">
                            <h6 className="mb-1">{cert.course.title}</h6>
                            <small>{new Date(cert.issued_date).toLocaleDateString()}</small>
                          </div>
                          <small className="text-muted">Certificate #{cert.certificate_number}</small>
                        </a>
                      ))}
                      {certificates.length > 3 && (
                        <a href="/certificates" className="list-group-item list-group-item-action text-center">
                          View all certificates
                        </a>
                      )}
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
    </ProtectedRoute>
  )
}