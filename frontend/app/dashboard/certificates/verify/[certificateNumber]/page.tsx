// app/certificates/verify/[certificateNumber]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { certificatesApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface CertificateDetails {
  id: string
  user: {
    first_name: string
    last_name: string
    email: string
  }
  course: {
    title: string
    description: string
  }
  issued_date: string
  certificate_number: string
  verification_url: string
}

export default function VerifyCertificatePage() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>()
  const [certificate, setCertificate] = useState<CertificateDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

    verifyCertificate()
  }, [certificateNumber])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Verifying certificate...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !certificate) {
    return (
      <ProtectedRoute>
        <div className="container py-5">
          <div className="card border-danger">
            <div className="card-header bg-danger text-white">
              <h2 className="mb-0">Certificate Verification Failed</h2>
            </div>
            <div className="card-body text-center">
              <i className="bi bi-x-circle-fill text-danger display-1 mb-4"></i>
              <h3 className="mb-3">Invalid Certificate</h3>
              <p className="lead">
                {error || 'The certificate could not be verified.'}
              </p>
              <p>
                Certificate ID: {certificateNumber}
              </p>
              <Link href="/" className="btn btn-primary">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container py-5">
        <div className="card border-success">
          <div className="card-header bg-success text-white">
            <h2 className="mb-0">Certificate Verified</h2>
          </div>
          <div className="card-body">
            <div className="text-center mb-4">
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
                  <Link 
                    href={`/certificates/download/${certificate.id}`}
                    className="btn btn-primary"
                  >
                    Download Certificate
                  </Link>
                  <Link href="/dashboard/certificates" className="btn btn-outline-secondary">
                    View My Certificates
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}