'use client'

import { useState, useEffect } from 'react'
import { certificatesApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import TopNavbar from '@/components/TopNavbar'
import Link from 'next/link'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await certificatesApi.getUserCertificates()
        if (response.data?.results) {
          setCertificates(response.data.results)
        }
      } catch (error) {
        console.error('Error fetching certificates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
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
              <h1>My Certificates</h1>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : certificates.length > 0 ? (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="col">
                    <div className="card h-100">
                      <div className="card-body text-center">
                        <i className="bi bi-award-fill text-warning display-4 mb-3"></i>
                        <h5 className="card-title">{certificate.course.title}</h5>
                        <p className="card-text">
                          Issued: {new Date(certificate.issued_date).toLocaleDateString()}
                        </p>
                        <p className="card-text">
                          <small className="text-muted">
                            Certificate ID: {certificate.certificate_number}
                          </small>
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(certificate.pdf_file, '_blank')}
                            className="btn btn-primary"
                          >
                            Download
                          </button>
                          <Link
                            href={`/dashboard/certificates/verify/${certificate.certificate_number}`}
                            className="btn btn-outline-secondary"
                          >
                            Verify
                          </Link>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-award display-4 text-muted mb-3"></i>
                <h3>No Certificates Yet</h3>
                <p className="lead">
                  Complete courses to earn certificates that showcase your achievements.
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