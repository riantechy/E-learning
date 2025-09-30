'use client'

import { useEffect, useState } from 'react';
import { coursesApi, categoriesApi } from '@/lib/api';
import Link from 'next/link';
import TopNavbar from '@/components/TopNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LearnerSidebar from '@/components/LearnerSidebar';
import { Menu, Clock, BookOpen, Users, Star, PlayCircle, Award, TrendingUp } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

export default function CourseListPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses, categories, and enrollments in parallel
        const [coursesResponse, categoriesResponse, enrollmentsResponse] = await Promise.all([
          coursesApi.getAllCourses(),
          categoriesApi.getAllCategories(),
          coursesApi.getUserEnrollments().catch(() => ({ data: [] })) // Gracefully handle error
        ]);

        if (coursesResponse.data?.results) {
          // Filter courses to only include those with status 'PUBLISHED'
          const publishedCourses = coursesResponse.data.results.filter(
            (course: any) => course.status === 'PUBLISHED'
          );
          setCourses(publishedCourses);
        }

        if (categoriesResponse.data?.results) {
          // Create a mapping of category ID to category name
          const categoryMap: Record<string, string> = {};
          categoriesResponse.data.results.forEach((category: Category) => {
            categoryMap[category.id] = category.name;
          });
          setCategories(categoryMap);
        }

        // Process enrolled courses
        if (enrollmentsResponse.data && enrollmentsResponse.data.length > 0) {
          const enrolledWithDetails = await Promise.all(
            enrollmentsResponse.data.map(async (enrollment: any) => {
              try {
                const [progressRes, courseRes] = await Promise.all([
                  coursesApi.getCourseProgress(enrollment.course_id),
                  coursesApi.getCourse(enrollment.course_id)
                ]);
                
                return {
                  ...enrollment,
                  progress: progressRes.data,
                  course_details: courseRes.data
                };
              } catch (error) {
                console.error(`Error fetching data for course ${enrollment.course_id}:`, error);
                return {
                  ...enrollment,
                  progress: null,
                  course_details: null
                };
              }
            })
          );
          setEnrolledCourses(enrolledWithDetails);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    return categories[categoryId] || 'General';
  };

  // Helper function to truncate text to word limit
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
            style={{zIndex: 998}}
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
            <div className="bg-primary text-white">
              <div className="container py-5">
                <nav aria-label="breadcrumb" className="mb-4">
                  <ol className="breadcrumb breadcrumb-dark">
                    <li className="breadcrumb-item">
                      <Link href="/dashboard" className="text-white-50">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active text-white" aria-current="page">
                      Courses
                    </li>
                  </ol>
                </nav>

                <div className="row align-items-center">
                  <div className="col-lg-8">
                  <h2 className="h4 fw-bold text-white mb-2">Explore Our Courses</h2>
                  <p className="text-white-50 mb-4">
                    Discover our curated collection of courses designed to enhance your skills and knowledge
                  </p>

                    {/* Stats */}
                    <div className="d-flex flex-wrap gap-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h4 className="mb-0 fw-bold">{courses.length}</h4>
                          <small className="opacity-75">Available Courses</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <h4 className="mb-0 fw-bold">{enrolledCourses.length}</h4>
                          <small className="opacity-30">Your Enrollments</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                          <Award size={24} />
                        </div>
                        <div>
                          <h4 className="mb-0 fw-bold">
                            {enrolledCourses.filter(course => course.progress?.percentage === 100).length}
                          </h4>
                          <small className="opacity-75">Completed</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="container py-5">
              {/* Enrolled Courses Section */}
              {enrolledCourses.length > 0 && (
                <div className="mb-5">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="h4 mb-0">Your Enrolled Courses</h3>
                    <Link href="/dashboard/learn" className="btn btn-outline-primary btn-sm">
                      View All
                    </Link>
                  </div>
                  
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {enrolledCourses.slice(0, 3).map((enrollment) => (
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
                              <span className={`badge ${enrollment.progress?.percentage === 100 ? 'bg-success' : 'bg-primary'}`}>
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
                            {/* Category Badge */}
                            <div className="mb-2">
                              <span className="badge bg-primary bg-opacity-10 text-primary">
                                {getCategoryName(enrollment.course_details?.category)}
                              </span>
                            </div>
                            
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
                            </div>
                            
                            {/* Action Button */}
                            <div className="mt-auto">
                              <Link 
                                href={`/dashboard/learn/${enrollment.course_id}`}
                                className={`btn w-100 d-flex align-items-center justify-content-center ${
                                  enrollment.progress?.percentage === 100 
                                    ? 'btn-outline-success' 
                                    : enrollment.progress?.percentage === 0 
                                      ? 'btn-primary' 
                                      : 'btn-primary'
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
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {enrolledCourses.length > 3 && (
                    <div className="text-center mt-4">
                      <Link href="/dashboard/learn" className="btn btn-outline-primary">
                        View All {enrolledCourses.length} Enrolled Courses
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* All Available Courses Section */}
              <div>
                <h3 className="h4 mb-2">
                  {enrolledCourses.length > 0 ? 'Explore More Courses' : 'All Available Courses'}
                </h3>
                
                {loading ? (
                  <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {courses.map((course) => (
                      <div key={course.id} className="col">
                        <div className="card h-100 shadow-sm border-0 course-card">
                          {/* Course Image */}
                          <div className="position-relative">
                            <img 
                              src={course.thumbnail || '/images/course-placeholder.jpg'} 
                              className="card-img-top" 
                              alt={course.title}
                              style={{ 
                                height: '200px', 
                                objectFit: 'cover',
                                borderTopLeftRadius: '0.375rem',
                                borderTopRightRadius: '0.375rem'
                              }}
                            />
                            {course.is_featured && (
                              <div className="position-absolute top-0 end-0 m-2">
                                <span className="badge bg-warning text-dark">
                                  <Star size={12} className="me-1" />
                                  Featured
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="card-body d-flex flex-column">
                            {/* Category Badge */}
                            <div className="mb-2">
                              <span className="badge bg-primary bg-opacity-10 text-primary">
                                {getCategoryName(course.category)}
                              </span>
                            </div>
                            
                            {/* Course Title */}
                            <h5 className="card-title mb-3" style={{ 
                              minHeight: '48px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {course.title}
                            </h5>
                            
                            {/* Course Description */}
                            <p className="card-text text-muted flex-grow-1 mb-3" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '72px'
                            }}>
                              {truncateText(course.description, 20)}
                            </p>
                            
                            {/* Course Metadata */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div className="d-flex align-items-center text-muted">
                                <Clock size={16} className="me-1" />
                                <small>
                                  {typeof course.actual_duration_hours === 'object' 
                                    ? course.actual_duration_hours.parsedValue || 0
                                    : course.actual_duration_hours || course.duration_hours || 0
                                  }h
                                </small>
                              </div>
                              <div className="d-flex align-items-center text-muted">
                                <BookOpen size={16} className="me-1" />
                                <small>{course.module_count || 0} modules</small>
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="mt-auto">
                              <Link 
                                href={`/dashboard/courses/${course.id}`} 
                                className="btn btn-primary w-100"
                              >
                                View Course Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State for Available Courses */}
                {!loading && courses.length === 0 && (
                  <div className="text-center py-5">
                    <div className="bg-light rounded-3 p-5">
                      <BookOpen size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">No Courses Available</h5>
                      <p className="text-muted">Check back later for new courses.</p>
                    </div>
                  </div>
                )}
              </div>
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