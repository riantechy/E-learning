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
    totalUsers: 0,
    activeCourses: 0,
    enrollments: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes, enrollmentsRes] = await Promise.all([
        usersApi.getAllUsers(),
        coursesApi.getAllCourses(),
        coursesApi.getTotalEnrollments(), // Using the new endpoint
      ]);

      if (usersRes.error || coursesRes.error || enrollmentsRes.error) {
        setError(usersRes.error || coursesRes.error || enrollmentsRes.error || 'Failed to fetch data');
        return;
      }

      const activeCourses = coursesRes.data?.filter(c => c.status === 'PUBLISHED').length || 0;
      
      setStats({
        totalUsers: usersRes.data?.length || 0,
        activeCourses,
        enrollments: enrollmentsRes.data?.total_enrollments || 0, // Using the enrollment count from API
        completionRate: 0, // You'll need to implement this in your API
      });
    } catch (err) {
      setError('An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, variant: 'primary', change: '+12% from last month' },
    { title: 'Active Courses', value: stats.activeCourses, variant: 'success', change: '+5% from last month' },
    { title: 'Enrollments', value: stats.enrollments, variant: 'info', change: '-2% from last month' },
    { title: 'Completion Rate', value: `${stats.completionRate}%`, variant: 'warning', change: '+3% from last month' },
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
              <Card bg={card.variant} text="white">
                <Card.Body>
                  <Card.Title>{card.title}</Card.Title>
                  <Card.Text className="h4">
                    {loading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      card.value
                    )}
                  </Card.Text>
                  <small>{card.change}</small>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Rest of your dashboard content remains the same */}
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