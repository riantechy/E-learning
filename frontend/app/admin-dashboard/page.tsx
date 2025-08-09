// app/admin-dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { coursesApi, usersApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    // totalUsers: 0,
    totalLearners: 0,
    activeCourses: 0,
    enrollments: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // In your fetchDashboardData function:
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const [learnersRes, coursesRes, enrollmentsRes, completionRes] = await Promise.all([
      usersApi.getLearnersCount(),
      coursesApi.getAllCourses(),
      coursesApi.getTotalEnrollments(), 
      coursesApi.getCompletionRates(),
    ]);

    console.log('API Responses:', {learnersRes, coursesRes, enrollmentsRes, completionRes });

    if (learnersRes.error || coursesRes.error || enrollmentsRes.error || completionRes.error) {
      const errorMsg = learnersRes.error || coursesRes.error || enrollmentsRes.error || completionRes.error || 'Failed to fetch data';
      console.error('API Error:', errorMsg);
      setError(errorMsg);
      return;
    }

    // Fix: Access coursesRes.data.results instead of coursesRes.data
    const activeCourses = coursesRes.data?.results?.filter(c => c.status === 'PUBLISHED').length || 0;
    
    setStats({
      totalLearners: learnersRes.data?.count || 0,
      activeCourses,
      enrollments: enrollmentsRes.data?.total_enrollments || 0, 
      completionRate: completionRes.data?.overall_completion_rate || 0,
    });
  } catch (err) {
    console.error('Fetch Error:', err);
    setError(err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
  } finally {
    setLoading(false);
  }
};

  const statCards = [
    { title: 'Total Learners', value: stats.totalLearners, variant: 'success', change: '+8% from last month' },
    { title: 'Active Courses', value: stats.activeCourses, variant: 'info', change: '+5% from last month' },
    { title: 'Enrollments', value: stats.enrollments, variant: 'warning', change: '-2% from last month' },
    { title: 'Completion Rate', value: `${stats.completionRate}%`, variant: 'danger', change: '+3% from last month' },
  ];

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <h1 className="h2 mb-4">Admin Dashboard</h1>
        <p className="text-muted mb-4">Monitor courses, users, and content from this control panel.</p>
        
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="row mb-4">
          {statCards.map((card, index) => (
            <div key={index} className="col-md-3 mb-3">
            <Card bg={card.variant.toLowerCase()} text="white">
              <Card.Body>
                <Card.Title>{card.title}</Card.Title>
                <div className="h4 card-text">
                  {loading ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    card.value
                  )}
                </div>
                <small>{card.change}</small>
              </Card.Body>
            </Card>
            </div>
          ))}
        </div>
        
        {/* Rest of your dashboard content */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Recent Activity</h5>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <p className="text-muted text-center py-4">Activity feed will appear here</p>
            )}
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Course Statistics</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">Course statistics chart will appear here</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">User Distribution</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">User distribution chart will appear here</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}