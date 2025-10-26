// app/admin-dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, usersApi, analyticsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLearners: 0,
    activeCourses: 0,
    enrollments: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<{ course: string; enrollments: number }[]>([]);
  const [userDistribution, setUserDistribution] = useState<{ role: string; count: number }[]>([]);

  // Role-based access control
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'ADMIN') {
        switch (user.role) {
          case 'CONTENT_MANAGER':
            router.push('/content-manager-dashboard');
            break;
          case 'LEARNER':
            router.push('/dashboard');
            break;
          default:
            router.push('/');
        }
      }
    } else if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        learnersRes, 
        coursesRes, 
        enrollmentsRes, 
        completionRes,
        userActivityRes,
        enrollmentStatsRes,
        userDistributionRes
      ] = await Promise.all([
        usersApi.getLearnersCount(),
        coursesApi.getAllCourses(),
        coursesApi.getTotalEnrollments(),
        coursesApi.getCompletionRates(),
        analyticsApi.getUserActivity('7d'),
        analyticsApi.getEnrollmentStats('monthly'),
        usersApi.getUsersDistribution()
      ]);

      if (learnersRes.error || coursesRes.error || enrollmentsRes.error || 
          completionRes.error || userActivityRes.error || enrollmentStatsRes.error || 
          userDistributionRes.error) {
        const errorMsg = learnersRes.error || coursesRes.error || enrollmentsRes.error || 
                         completionRes.error || userActivityRes.error || enrollmentStatsRes.error || 
                         userDistributionRes.error || 'Failed to fetch data';
        setError(errorMsg);
        return;
      }

      const activeCourses = coursesRes.data?.results?.filter((c: any) => c.status === 'PUBLISHED').length || 0;

      setStats({
        totalLearners: learnersRes.data?.count || 0,
        activeCourses,
        enrollments: enrollmentsRes.data?.total_enrollments || 0,
        completionRate: completionRes.data?.overall_completion_rate || 0,
      });

      // Set user distribution data
      if (userDistributionRes.data) {
        setUserDistribution(userDistributionRes.data);
      }

      // Set course enrollment data
      if (enrollmentStatsRes.data && enrollmentStatsRes.data.enrollment_trend) {
        // Get the latest enrollment data for top courses
        const topCourses = enrollmentStatsRes.data.top_courses || [];
        setCourseEnrollments(topCourses.map((course: any) => ({
          course: course.title,
          enrollments: course.enrollment_count
        })));
      }

      // Set recent activities from user activity data
      if (userActivityRes.data && userActivityRes.data.activity_counts) {
        const activities = userActivityRes.data.activity_counts.slice(0, 5).map((activity: any, index: number) => ({
          id: index,
          user: 'System',
          action: `${activity.count} ${activity.activity_type} activities`,
          time: 'Recently'
        }));
        setRecentActivities(activities);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // const statCards = [
  //   { title: 'Total Learners', value: stats.totalLearners, variant: 'success' },
  //   { title: 'Active Courses', value: stats.activeCourses, variant: 'info' },
  //   { title: 'Enrollments', value: stats.enrollments, variant: 'warning' },
  //   { title: 'Completion Rate', value: `${stats.completionRate}%`, variant: 'danger' },
  // ];

  const statCards = [
    { title: 'Total Learners', value: stats.totalLearners, variant: 'success' },
    { title: 'Active Courses', value: stats.activeCourses, variant: 'info' },
    { title: 'Enrollments', value: stats.enrollments, variant: 'warning' },
    { title: 'Completion Rate', value: `${stats.completionRate}%`, variant: 'danger' },
  ];

  // Chart data configurations
  const enrollmentChartData = {
    labels: courseEnrollments.map((item) => item.course),
    datasets: [
      {
        label: 'Enrollments',
        data: courseEnrollments.map((item) => item.enrollments),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const userDistributionData = {
    labels: userDistribution.map((item) => item.role),
    datasets: [
      {
        data: userDistribution.map((item) => item.count),
        backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)'],
        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Course Enrollment Statistics',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Distribution by Role',
      },
    },
  };

  if (authLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <h1 className="h2 mb-2">Admin Dashboard</h1>
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

        {/* Recent Activity Section */}
        {/* <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Recent Activity</h5>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : recentActivities.length > 0 ? (
              <ListGroup variant="flush">
                {recentActivities.map((activity) => (
                  <ListGroup.Item key={activity.id}>
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>{activity.user}</strong> {activity.action}
                      </div>
                      <small className="text-muted">{activity.time}</small>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="text-muted text-center py-4">No recent activity</p>
            )}
          </div>
        </div> */}

        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card h-100">
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
                ) : courseEnrollments.length > 0 ? (
                  <div style={{ height: '300px' }}>
                    <Bar data={enrollmentChartData} options={chartOptions} />
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">No enrollment data available</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card h-100">
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
                ) : userDistribution.length > 0 ? (
                  <div style={{ height: '300px' }}>
                    <Pie data={userDistributionData} options={pieOptions} />
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">No user distribution data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}