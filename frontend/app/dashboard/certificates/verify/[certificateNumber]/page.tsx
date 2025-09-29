'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { certificatesApi, Certificate, getAbsoluteMediaUrl } from '@/lib/api'
import Link from 'next/link'

export default function VerifyCertificatePage() {
  const params = useParams()
  const certificateNumber = params.certificateNumber as string
  const [certificate, setCertificate] = useState<Certificate | null>(null)
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

    if (certificateNumber) {
      verifyCertificate()
    }
  }, [certificateNumber])

  const handleDownload = () => {
    if (certificate?.pdf_file) {
      const absoluteUrl = getAbsoluteMediaUrl(certificate.pdf_file);
      window.open(absoluteUrl, '_blank');
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5 text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (error || !certificate) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5 text-center">
          <i className="bi bi-exclamation-circle-fill text-danger display-1"></i>
          <h1 className="h3 mt-3">Certificate Not Found</h1>
          <p className="lead">
            {error || 'The certificate could not be verified. Please check the certificate number.'}
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Link href="/" className="btn btn-primary">
              Go Home
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-outline-secondary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render success state
  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="h3 mb-3">Certificate Verification</h1>
          <i className="bi bi-check-circle-fill text-success display-1"></i>
          <p className="text-success mt-2">This certificate has been successfully verified</p>
        </div>
        
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h4 className="card-title mb-0">Certificate Details</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-12">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <strong>Certificate ID:</strong>
                        <span>{certificate.certificate_number}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <strong>Issued To:</strong>
                        <span>{certificate.user.first_name} {certificate.user.last_name}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <strong>Email:</strong>
                        <span>{certificate.user.email}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-start">
                        <strong>Course:</strong>
                        <span className="text-end">{certificate.course.title}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <strong>Issued Date:</strong>
                        <span>{new Date(certificate.issued_date).toLocaleDateString()}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="alert alert-info">
                    <p className="mb-2">This certificate was issued by our platform and has been successfully verified.</p>
                    <p className="mb-0">
                      <strong>Verification URL:</strong><br />
                      <small>{certificate.verification_url}</small>
                    </p>
                  </div>
                  
                  <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                    {certificate.pdf_file && (
                      <button 
                        onClick={handleDownload}
                        className="btn btn-primary me-md-2"
                      >
                        Download Certificate
                      </button>
                    )}
                    <Link href="/" className="btn btn-outline-secondary">
                      Go to Homepage
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}