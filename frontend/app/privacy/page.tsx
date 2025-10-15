// app/privacy/page.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, Users, Cookie, Eye, Trash2, Download } from 'lucide-react';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'definitions', title: 'Definitions' },
    { id: 'data-collection', title: 'Data We Collect' },
    { id: 'data-usage', title: 'How We Use Data' },
    { id: 'legal-basis', title: 'Legal Basis' },
    { id: 'sharing', title: 'Sharing & Disclosure' },
    { id: 'retention', title: 'Data Retention' },
    { id: 'security', title: 'Security' },
    { id: 'cookies', title: 'Cookies & Tracking' },
    { id: 'rights', title: 'Your Rights' },
    { id: 'children', title: 'Children' },
    { id: 'changes', title: 'Policy Changes' },
    { id: 'contact', title: 'Contact Us' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <Link
                href="/"
                className="flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors no-underline"
            >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Home</span>
            </Link>
           </div>

            
            <div className="flex items-center space-x-3">
              <div className="w-16 h-12 flex items-center justify-center">
                <img
                  src="/images/download.png"
                  alt="ICTA Logo"
                  className="h-10 w-14 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-red-600" />
                    <h2 className="text-lg font-bold text-gray-900">Privacy Policy</h2>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Last updated: {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                <nav className="p-4">
                  <ul className="space-y-2">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <button
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeSection === section.id
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Download Button */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // In a real implementation, this would download the actual document
                      const link = document.createElement('a');
                      link.href = '/documents/privacy-policy.pdf'; // You would need to add this file
                      link.download = 'WhiteBox-Elearning-Privacy-Policy.pdf';
                      link.click();
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 sm:p-8 lg:p-10">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                      Privacy Policy
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                      Welcome to <strong>Whitebox E-learning</strong>. We are committed to protecting 
                      your privacy and handling your personal data responsibly.
                    </p>
                  </div>

                  {/* Overview Section */}
                  {(activeSection === 'overview' || !activeSection) && (
                    <section id="overview" className="space-y-6">
                      <div className="prose prose-lg max-w-none">
                        <p>
                          This Privacy Policy explains how we collect, use, disclose, and safeguard 
                          your information when you visit and use our platform at{' '}
                          <a 
                            href="https://e-learning.whitebox.go.ke" 
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            https://e-learning.whitebox.go.ke
                          </a>{' '}
                          (the "Service").
                        </p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
                          <p className="text-blue-800 text-sm">
                            <strong>Important:</strong> By accessing or using our Service, you agree 
                            to the collection and use of information in accordance with this policy.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <FileText className="h-8 w-8 text-red-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-2">Data Collection</h3>
                            <p className="text-sm text-gray-600">
                              We collect information you provide and usage data to improve our services.
                            </p>
                          </div>
                          
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <Shield className="h-8 w-8 text-red-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-2">Your Security</h3>
                            <p className="text-sm text-gray-600">
                              We implement security measures to protect your personal information.
                            </p>
                          </div>
                          
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <Users className="h-8 w-8 text-red-600 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-2">Your Rights</h3>
                            <p className="text-sm text-gray-600">
                              You have rights to access, correct, and delete your personal data.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Definitions Section */}
                  {activeSection === 'definitions' && (
                    <section id="definitions" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Definitions
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Personal Data</h3>
                          <p className="text-gray-700">
                            Any information relating to an identified or identifiable individual 
                            (e.g., name, email address).
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Usage Data</h3>
                          <p className="text-gray-700">
                            Information collected automatically, such as your IP address, browser type, 
                            pages visited, time spent, etc.
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Cookies</h3>
                          <p className="text-gray-700">
                            Small data files placed on your device to enhance your browsing experience.
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">User</h3>
                          <p className="text-gray-700">
                            A visitor or registered account holder using our Service.
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Data Collection Section */}
                  {activeSection === 'data-collection' && (
                    <section id="data-collection" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        What Data We Collect
                      </h2>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <Users className="h-5 w-5 text-red-600 mr-2" />
                            Data You Provide
                          </h3>
                          <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>
                                <strong>Registration data:</strong> name, email address, password, 
                                phone, profile picture, and other profile info
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>
                                <strong>Course data:</strong> which courses you take, quizzes, 
                                surveys, and syllabus completion
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>
                                <strong>Communications:</strong> messages you send to support or 
                                instructors, feedback, reviews
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>
                                <strong>Optional information:</strong> biography, interests, and 
                                other details you choose to provide
                              </span>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <Eye className="h-5 w-5 text-red-600 mr-2" />
                            Usage & Technical Data
                          </h3>
                          <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>
                                <strong>Device data:</strong> device type, operating system, browser, 
                                unique device identifiers
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>
                                <strong>Log data:</strong> IP address, timestamps, pages visited, 
                                referral URLs, clickstream data
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>
                                <strong>Cookies and tracking:</strong> to maintain sessions, 
                                preferences, analytics
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>
                                <strong>Analytics:</strong> aggregated usage patterns, performance metrics
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Data Usage Section */}
                  {activeSection === 'data-usage' && (
                    <section id="data-usage" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        How We Use Your Data
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-900 mb-2">
                            Provide and maintain the Service
                          </h3>
                          <p className="text-green-800 text-sm">
                            To register you, authenticate, manage your account, and deliver course content
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-900 mb-2">
                            Improve and personalize
                          </h3>
                          <p className="text-green-800 text-sm">
                            To analyze usage, optimize user experience, and recommend content
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-900 mb-2">
                            Communication
                          </h3>
                          <p className="text-green-800 text-sm">
                            To send you updates, notifications, and responses to inquiries
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-900 mb-2">
                            Legal & security
                          </h3>
                          <p className="text-green-800 text-sm">
                            To detect fraud, enforce our policies, and comply with legal obligations
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-900 mb-2">
                            Marketing (where permitted)
                          </h3>
                          <p className="text-green-800 text-sm">
                            To send promotional emails or offers
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Legal Basis Section */}
                  {activeSection === 'legal-basis' && (
                    <section id="legal-basis" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Legal Bases for Processing
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-blue-900 mb-2">Your Consent</h3>
                          <p className="text-blue-800">
                            You provide voluntary consent for specific processing activities
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-blue-900 mb-2">Legal Obligations</h3>
                          <p className="text-blue-800">
                            Processing necessary to comply with legal requirements
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-blue-900 mb-2">Legitimate Interests</h3>
                          <p className="text-blue-800">
                            Processing for our legitimate interests (e.g., improving our platform, 
                            preventing fraud), balanced against your rights
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Sharing Section */}
                  {activeSection === 'sharing' && (
                    <section id="sharing" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Sharing & Disclosure
                      </h2>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 font-semibold">
                          We do not sell your personal data.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Service Providers & Third Parties
                          </h3>
                          <p className="text-gray-700">
                            Analytics providers, hosting services, and email services
                          </p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Affiliates and Partners
                          </h3>
                          <p className="text-gray-700">
                            Only when necessary and with safeguards
                          </p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Legal Obligations
                          </h3>
                          <p className="text-gray-700">
                            When required by law or in response to valid legal requests
                          </p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Business Transfers
                          </h3>
                          <p className="text-gray-700">
                            In the event of a merger, acquisition, or sale of assets
                          </p>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Anonymized/Aggregated Data
                          </h3>
                          <p className="text-gray-700">
                            We may share aggregated or de-identified data publicly
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Retention Section */}
                  {activeSection === 'retention' && (
                    <section id="retention" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Data Retention
                      </h2>
                      
                      <div className="space-y-4">
                        <p className="text-gray-700">
                          We will retain your personal data as long as needed for the purposes 
                          described (e.g., while your account is active, or until legal obligations 
                          require deletion).
                        </p>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700">
                            <strong>Note:</strong> We may retain usage logs and anonymized data 
                            indefinitely for analytics purposes.
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Security Section */}
                  {activeSection === 'security' && (
                    <section id="security" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Security
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-900 mb-2">Our Security Measures</h3>
                          <ul className="text-green-800 space-y-2">
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Encryption of sensitive data</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Secure servers and infrastructure</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Access controls and authentication</span>
                            </li>
                            <li className="flex items-start">
                              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span>Regular security assessments</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h3 className="font-semibold text-yellow-900 mb-2">Important Notice</h3>
                          <p className="text-yellow-800">
                            We take reasonable technical and organizational measures to protect your 
                            data. However, no method is 100% secure—so while we strive to protect 
                            your data, we cannot guarantee absolute security.
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Cookies Section */}
                  {activeSection === 'cookies' && (
                    <section id="cookies" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Cookies & Tracking
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                          <Cookie className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">How We Use Cookies</h3>
                            <p className="text-gray-700 mb-4">
                              We use cookies and similar technologies for necessary functioning 
                              (session, authentication), preferences, analytics, and possibly 
                              advertising.
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm text-gray-600">
                                <strong>Managing Cookies:</strong> You may manage or disable cookies 
                                via browser settings, but that may affect your ability to use some 
                                features of our Service.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Rights Section */}
                  {activeSection === 'rights' && (
                    <section id="rights" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Your Rights
                      </h2>
                      
                      <p className="text-gray-700">
                        Depending on your jurisdiction (e.g., under the Kenyan Data Protection Act), 
                        you may have the following rights:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Access</h3>
                          <p className="text-gray-600 text-sm">
                            Request a copy of your personal data
                          </p>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Correction</h3>
                          <p className="text-gray-600 text-sm">
                            Ask us to correct inaccurate or incomplete data
                          </p>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Deletion</h3>
                          <p className="text-gray-600 text-sm">
                            Request erasure of your data
                          </p>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Restriction</h3>
                          <p className="text-gray-600 text-sm">
                            Ask to restrict processing in certain scenarios
                          </p>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Portability</h3>
                          <p className="text-gray-600 text-sm">
                            Receive your data in a structured format
                          </p>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Object</h3>
                          <p className="text-gray-600 text-sm">
                            Object to certain processing (e.g., marketing)
                          </p>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4 md:col-span-2">
                          <h3 className="font-semibold text-gray-900 mb-2">Withdraw Consent</h3>
                          <p className="text-gray-600 text-sm">
                            Where processing is based on consent
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          <strong>To exercise these rights:</strong> Contact us at the address below. 
                          We may ask you to verify your identity before processing your request.
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Children Section */}
                  {activeSection === 'children' && (
                    <section id="children" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Children
                      </h2>
                      
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="font-bold text-red-900 text-lg mb-2">
                          Age Restriction
                        </h3>
                        <p className="text-red-800">
                          Our Service is not intended for children under 18 years. If we become aware 
                          that we have collected data from a child without parental consent, we will 
                          take steps to delete it.
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Changes Section */}
                  {activeSection === 'changes' && (
                    <section id="changes" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Changes to Policy
                      </h2>
                      
                      <div className="space-y-4">
                        <p className="text-gray-700">
                          We may update this Privacy Policy to reflect changes in our practices or 
                          for other operational, legal, or regulatory reasons.
                        </p>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h3 className="font-semibold text-yellow-900 mb-2">Notification Process</h3>
                          <p className="text-yellow-800">
                            We will notify you of any material changes by posting the new version on 
                            this page and updating the "last updated" date at the top of this policy.
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800">
                            <strong>Recommendation:</strong> We encourage you to review this Privacy 
                            Policy periodically to stay informed about how we are protecting your 
                            information.
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Contact Section */}
                  {activeSection === 'contact' && (
                    <section id="contact" className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                        Contact Us
                      </h2>
                      
                      <div className="space-y-6">
                        <p className="text-gray-700">
                          In order to resolve a complaint regarding Whitebox Elearning Services or to 
                          receive further information regarding the use of the Whitebox eLearning 
                          Services, don't hesitate to get in touch with us as set forth below.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <FileText className="h-5 w-5 text-red-600 mr-2" />
                              Visit Us
                            </h3>
                            <p className="text-gray-700">
                              ICT Authority<br />
                              Telposta Towers, 12th Floor<br />
                              GPO
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <FileText className="h-5 w-5 text-red-600 mr-2" />
                              Contact Information
                            </h3>
                            <div className="space-y-2">
                              <p className="text-gray-700">
                                <strong>Email:</strong>{' '}
                                <a 
                                  href="mailto:whitebox@icta.go.ke" 
                                  className="text-red-600 hover:text-red-700"
                                >
                                  whitebox@icta.go.ke
                                </a>
                              </p>
                              <p className="text-gray-700">
                                <strong>Phone:</strong>{' '}
                                <a 
                                  href="tel:+254206676999" 
                                  className="text-red-600 hover:text-red-700"
                                >
                                  (+254) 20 6676999
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}