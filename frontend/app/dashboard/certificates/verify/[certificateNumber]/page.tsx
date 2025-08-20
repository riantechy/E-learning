'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { certificatesApi, Certificate } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import TopNavbar from '@/components/TopNavbar'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'

export default function VerifyCertificatePage() {
  const params = useParams()
  const certificateNumber = params.certificateNumber as string
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true)
        const response = await certificatesApi.verifyCertificate(certificateNumber)
        
        if (response.error) {
          throw new Error(response.error)
        }
        
        if (response.data) {
          setCertificate(response.data.certificate)
        }
      } catch (err) {
        console.error('Error verifying certificate:', err)
        setError(err instanceof Error ? err.message : 'Failed to verify certificate')
      } finally {
        setLoading(false)
      }
    }

    if (certificateNumber) {
      verifyCertificate()
    }
  }, [certificateNumber])

  const handleDownload = () => {
    if (certificate?.pdf_file) {
      window.open(certificate.pdf_file, '_blank')
    }
  }

  if (loading) {
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
            <main className="flex-grow-1 p-4 overflow-auto">
              <div className="container py-5 text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !certificate) {
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
            <main className="flex-grow-1 p-4 overflow-auto">
              <div className="container py-5 text-center">
                <i className="bi bi-exclamation-circle-fill text-danger display-1"></i>
                <h1 className="h3 mt-3">Certificate Not Found</h1>
                <p className="lead">
                  {error || 'The certificate could not be verified. Please check the certificate number.'}
                </p>
                <Link href="/dashboard/certificates" className="btn btn-primary">
                  Back to Certificates
                </Link>
              </div>
            </main>
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

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          <main className="flex-grow-1 p-4 overflow-auto">
            <div className="container py-5">
              <div className="text-center mb-5">
                <h1 className="h3 mb-3">Certificate Verification</h1>
                <i className="bi bi-check-circle-fill text-success display-1"></i>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <h4>Certificate Details</h4>
                  <ul className="list-group list-group-flush mb-4">
                    <li className="list-group-item">
                      <strong>Certificate ID:</strong> {certificate.certificate_number}
                    </li>
                    <li className="list-group-item">
                      <strong>Issued To:</strong> {certificate.user.first_name} {certificate.user.last_name}
                    </li>
                    <li className="list-group-item">
                      <strong>Email:</strong> {certificate.user.email}
                    </li>
                    <li className="list-group-item">
                      <strong>Course:</strong> {certificate.course.title}
                    </li>
                    <li className="list-group-item">
                      <strong>Issued Date:</strong> {new Date(certificate.issued_date).toLocaleDateString()}
                    </li>
                  </ul>
                </div>
                
                <div className="col-md-6">
                  <h4>Verification Information</h4>
                  <div className="alert alert-info">
                    <p>This certificate was issued by our platform and has been successfully verified.</p>
                    <p className="mb-0">
                      <strong>Verification URL:</strong> {certificate.verification_url}
                    </p>
                  </div>
                  
                  <div className="d-grid gap-2">
                    {/* <button
                      onClick={handleDownload}
                      className="btn btn-primary btn-lg"
                    >
                      <i className="bi bi-download me-2"></i>
                      Download Now
                    </button> */}
                    <Link href="/dashboard/certificates" className="btn btn-outline-secondary">
                      View My Certificates
                    </Link>
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