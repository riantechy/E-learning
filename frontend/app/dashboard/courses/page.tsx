'use client'

import { useEffect, useState } from 'react';
import { coursesApi } from '@/lib/api';
import Link from 'next/link';
import TopNavbar from '@/components/TopNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LearnerSidebar from '@/components/LearnerSidebar';
import { Menu } from 'lucide-react';

export default function CourseListPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesApi.getAllCourses();
        if (response.data) {
          setCourses(response.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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
            <h1 className="mb-4">Available Courses</h1>
            
            {loading ? (
              <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {courses.map((course) => (
                  <div key={course.id} className="col">
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">{course.title}</h5>
                        <p className="card-text text-muted">{course.description.substring(0, 150)}...</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-secondary">{course.category?.name || 'General'}</span>
                          <span>{course.duration_hours} hours</span>
                        </div>
                      </div>
                      <div className="card-footer bg-transparent">
                        <Link href={`/dashboard/courses/${course.id}`} className="btn btn-primary">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}