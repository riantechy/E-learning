// /dashboard/learn/[courseId]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import TopNavbar from '@/components/TopNavbar'
import { coursesApi, categoriesApi } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import Spinner from 'react-bootstrap/Spinner'

export default function CourseOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [categoryName, setCategoryName] = useState<string>('General') 
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchCategoryName = async (categoryId: string) => {
    if (!categoryId) return 'General';
    
    try {
      const response = await categoriesApi.getCategory(categoryId);
      if (response.data) {
        return response.data.name;
      }
      return 'General';
    } catch (error) {
      console.error('Error fetching category:', error);
      return 'General';
    }
  };

  const getIncompleteModules = () => {
    return modules.filter(module => {
      const moduleProgress = progress?.completed_modules?.includes(module.id);
      return !moduleProgress;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [courseRes, modulesRes, progressRes] = await Promise.all([
          coursesApi.getCourse(courseId),
          coursesApi.getModules(courseId),
          coursesApi.getCourseProgress(courseId)
        ])
        
        if (courseRes.data) {
          setCourse(courseRes.data);
          
         // Fetch category name if category exists
          if (courseRes.data.category) {
            if (typeof courseRes.data.category === 'object' && 'name' in courseRes.data.category) {
              setCategoryName(courseRes.data.category.name);
            } else if (typeof courseRes.data.category === 'string') {
              // Category is just an ID, fetch the name
              const name = await fetchCategoryName(courseRes.data.category);
              setCategoryName(name);
            }
          }

        }
        
        if (modulesRes.data?.results) {
          const modulesWithProgress = await Promise.all(
            modulesRes.data?.results.map(async (module: any) => {
              const moduleProgressRes = await coursesApi.getModuleProgress(module.id)
              const lessonsRes = await coursesApi.getLessons(courseId, module.id)
              return {
                ...module,
                is_completed: moduleProgressRes.data?.is_completed || false,
                lessons: lessonsRes.data?.results || [],
                total_lessons: lessonsRes.data?.results.length || 0
              }
            })
          )
          setModules(modulesWithProgress)
        }
        
        if (progressRes.data) {
          setProgress(progressRes.data)
          if (progressRes.data.percentage === 100) {
            router.refresh()
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchData()
    }
  }, [courseId, router])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const refreshData = async () => {
          try {
            const [progressRes] = await Promise.all([
              coursesApi.getCourseProgress(courseId)
            ])
            
            if (progressRes.data) setProgress(progressRes.data)
            
            if (modules.length > 0) {
              const updatedModules = await Promise.all(
                modules.map(async (module) => {
                  const moduleProgressRes = await coursesApi.getModuleProgress(module.id)
                  return {
                    ...module,
                    is_completed: moduleProgressRes.data?.is_completed || false
                  }
                })
              )
              setModules(updatedModules)
            }
          } catch (error) {
            console.error('Error refreshing data:', error)
          }
        }
        refreshData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [courseId, modules])

  const handleStartCourse = async () => {
    const incompleteModules = getIncompleteModules();
    
    if (incompleteModules.length === 0) {
      // All modules completed, navigate to completion page
      router.push(`/dashboard/learn/${courseId}/complete`);
    } else {
      // Find first incomplete module
      const firstIncompleteModule = incompleteModules[0];
      if (firstIncompleteModule) {
        router.push(`/dashboard/learn/${courseId}/${firstIncompleteModule.id}`);
      }
    }
  };
  
  // Add this function to handle completion check
  const checkCourseCompletion = () => {
    const incompleteModules = getIncompleteModules();
    const isCourseCompleted = incompleteModules.length === 0;
    
    return {
      isCompleted: isCourseCompleted,
      incompleteModules: incompleteModules,
      completedPercentage: progress?.percentage || 0
    };
  };

  const isModuleLocked = (module: any) => {
    if (module.order === 1) return false
    const prevModule = modules.find(m => m.order === module.order - 1)
    if (!prevModule) return false
    return !prevModule.is_completed
  }

  const getModuleStatus = (module: any) => {
    const isCompleted = progress?.completed_modules?.includes(module.id);
    const isLocked = module.order > 1 && 
      !progress?.completed_modules?.includes(
        modules.find(m => m.order === module.order - 1)?.id
      );
    
    return { isCompleted, isLocked };
  }

  const getCompletedLessonsCount = (module: any) => {
    if (!progress?.completed_lessons || !module.lessons) return 0
    return progress.completed_lessons.filter((l: any) => 
      module.lessons.some((les: any) => les.id === l.lesson_id)
    ).length
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto d-flex justify-content-center align-items-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!course) {
    return (
      <ProtectedRoute>
        <div className="d-flex vh-100 bg-light position-relative">
          <div className="flex-grow-1 p-4 overflow-auto">
            <div className="alert alert-danger">Course not found</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
    <div className="d-flex vh-100 bg-light position-relative" style={{ overflowX: 'hidden' }}>
      {/* Mobile Sidebar Toggle Button */}
      <button 
        className="d-lg-none btn btn-light position-fixed top-2 start-2 z-3 rounded-circle p-2"
        style={{
          zIndex: 1000,
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          <main 
            className="flex-grow-1 p-4 overflow-auto"
            style={{
              marginLeft: mobileSidebarOpen 
                ? (sidebarCollapsed ? '80px' : '280px') 
                : '0',
              transition: 'margin-left 0.3s ease'
            }}
          >
          <div className="container py-3 py-md-5">
            <nav aria-label="breadcrumb" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
              <ol className="breadcrumb" style={{ display: 'inline-flex', minWidth: '100%' }}>
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/dashboard/learn">My Courses</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {course.title}
                </li>
              </ol>
            </nav>

            <div className="row">
              <div className="col-12 col-md-8 mb-4 mb-md-0">
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="mb-3">{course.title}</h5>
                    <p className="text-sm">{course.description}</p>
                    
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mb-4">
                      <div className="d-flex flex-wrap gap-2">
                        <span className="badge bg-primary">
                          {course.duration_hours} hours
                        </span>
                        <span className="badge bg-secondary">
                          {progress?.completed || 0}/{progress?.total || 0} lessons
                        </span>
                      </div>
                      <button 
                        onClick={handleStartCourse}
                        className="btn btn-primary btn-lg flex-shrink-0"
                        disabled={!modules.length}
                        style={{ minWidth: '180px' }}
                      >
                        {(() => {
                          const completionStatus = checkCourseCompletion();
                          
                          if (completionStatus.isCompleted) {
                            return 'Get Certificate';
                          } else if (completionStatus.completedPercentage > 0) {
                            return `Continue (${Math.round(completionStatus.completedPercentage)}%)`;
                          } else {
                            return 'Start Course';
                          }
                        })()}
                      </button>
                    </div>

                    <div className="progress mb-4">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${progress?.percentage || 0}%` }}
                        aria-valuenow={progress?.percentage || 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5>Course Modules</h5>
                  </div>
                  <div className="list-group list-group-flush"> 
                    {modules.map((module) => {
                      const { isCompleted, isLocked } = getModuleStatus(module)
                      const completedLessons = getCompletedLessonsCount(module)
                      
                      return (
                        <div 
                          key={module.id} 
                          className={`list-group-item ${isCompleted ? 'bg-light' : ''}`}
                        >
                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                            <div style={{ flex: 1 }}>
                              <h6 className="mb-1">{module.title}</h6>
                              <p className="text-sm text-muted mb-2 mb-sm-1">{module.description}</p>
                              <small className="text-muted">
                                {completedLessons}/{module.lessons?.length || 0} lessons
                              </small>
                            </div>
                            <div className="d-flex flex-shrink-0">
                              {isLocked ? (
                                <span className="badge bg-secondary">Locked</span>
                              ) : isCompleted ? (
                                <div className="d-flex gap-2">
                                  <Link
                                    href={`/dashboard/learn/${courseId}/${module.id}`}
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    Review
                                  </Link>
                                  <span className="badge bg-success">Completed</span>
                                </div>
                              ) : (
                                <Link
                                  href={`/dashboard/learn/${courseId}/${module.id}`}
                                  className="btn btn-primary btn-sm"
                                >
                                  {completedLessons > 0 ? 'Continue' : 'Start'}
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card mb-4">
                  <div className="card-header">
                    <h6>Course Details</h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Category</span>
                        <span className="badge bg-primary">
                          {categoryName} 
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Duration</span>
                        <span>{course.duration_hours} hours</span>
                      </li>
                      {/* <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Status</span>
                        <span className="badge bg-success">
                          {course.status}
                        </span>
                      </li> */}
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Progress</span>
                        <span>{progress?.percentage || 0}%</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h6>Quick Actions</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-grid gap-2">
                      <button 
                        onClick={handleStartCourse}
                        className="btn btn-primary"
                        disabled={!modules.length}
                      >
                        {progress?.percentage === 0 ? 'Start Course' : 'Continue Learning'}
                      </button>
                    </div>
                      {/* Course Completion Status */}
                      {(() => {
                        const completionStatus = checkCourseCompletion();
                        
                        if (completionStatus.isCompleted) {
                          return (
                            <div className="alert alert-success mt-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <span>
                                  <i className="bi bi-check-circle-fill me-2"></i>
                                  Course completed! Ready for certificate
                                </span>
                                <Link 
                                  href={`/dashboard/learn/${courseId}/complete`}
                                  className="btn btn-success btn-sm"
                                >
                                  Get Certificate
                                </Link>
                              </div>
                            </div>
                          );
                        } else if (completionStatus.completedPercentage > 0) {
                          return (
                            <div className="alert alert-info mt-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <i className="bi bi-info-circle-fill me-2"></i>
                                  <strong>Pending modules: {completionStatus.incompleteModules.length}</strong>
                                  <div className="mt-1">
                                    <small>Complete these modules to finish the course:</small>
                                    <ul className="mb-0 mt-1">
                                      {completionStatus.incompleteModules.slice(0, 3).map(module => (
                                        <li key={module.id}>{module.title}</li>
                                      ))}
                                      {completionStatus.incompleteModules.length > 3 && (
                                        <li>...and {completionStatus.incompleteModules.length - 3} more</li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                  </div>
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