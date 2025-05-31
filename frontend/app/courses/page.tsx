// app/dashboard/page.tsx
'use client'

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { coursesApi, usersApi } from '@/lib/api';
import Link from 'next/link';
import LearnerSidebar from '@/components/LearnerSidebar';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch enrolled courses
        const coursesResponse = await coursesApi.getAll();
        if (coursesResponse.data) {
          setCourses(coursesResponse.data);
          
          // Fetch progress for each course
          const progressData: {[key: string]: number} = {};
          for (const course of coursesResponse.data) {
            const progressResponse = await usersApi.getProfile();
            // Assuming the API returns progress data in the user profile
            if (progressResponse.data && progressResponse.data.progress) {
              progressData[course.id] = progressResponse.data.progress[course.id] || 0;
            }
          }
          setProgress(progressData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
            <div className="position-sticky pt-3">
              <LearnerSidebar />
            </div>
          </div>

          {/* Main content */}
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h1 className="h2">Welcome back, {user?.first_name}!</h1>
              <div className="btn-toolbar mb-2 mb-md-0">
                <button onClick={logout} className="btn btn-sm btn-outline-danger">
                  Logout
                </button>
              </div>
            </div>

            {/* User Info Card */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Your Information</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Role:</strong> {user?.role}</p>
                    <p><strong>Member since:</strong> {new Date(user?.date_joined || '').toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Section */}
            <div className="mb-4">
              <h3>Your Courses</h3>
              {loading ? (
                <div className="d-flex justify-content-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : courses.length === 0 ? (
                <div className="alert alert-info">
                  You haven't enrolled in any courses yet. <Link href="/courses">Browse courses</Link> to get started.
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {courses.map((course) => (
                    <div key={course.id} className="col">
                      <div className="card h-100">
                        <div className="card-body">
                          <h5 className="card-title">{course.title}</h5>
                          <p className="card-text text-muted">{course.description.substring(0, 100)}...</p>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span>Progress</span>
                              <span>{progress[course.id] || 0}%</span>
                            </div>
                            <div className="progress">
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${progress[course.id] || 0}%` }}
                                aria-valuenow={progress[course.id] || 0}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="card-footer bg-transparent">
                          <Link href={`/courses/${course.id}`} className="btn btn-primary btn-sm">
                            Continue Learning
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="mb-4">
              <h3>Recent Activity</h3>
              <div className="list-group">
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">Course Completed: Introduction to Python</h5>
                    <small>3 days ago</small>
                  </div>
                  <p className="mb-1">You completed all lessons in this course.</p>
                </div>
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">Quiz Passed: JavaScript Basics</h5>
                    <small>1 week ago</small>
                  </div>
                  <p className="mb-1">You scored 85% on the module quiz.</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}