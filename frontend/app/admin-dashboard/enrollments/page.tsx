// app/admin-dashboard/enrollments/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { coursesApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import Pagination from 'react-bootstrap/Pagination';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CourseEnrollment {
  course_id: string;
  course_title: string;
  enrollment_count: number;
  status: string;
  created_at: string;
}

// Define colors for different statuses
const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: '#28a745',
  DRAFT: '#6c757d',
  PENDING_REVIEW: '#ffc107',
  ARCHIVED: '#dc3545'
};

export default function EnrollmentStats() {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof CourseEnrollment; direction: 'asc' | 'desc' }>({
    key: 'enrollment_count',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEnrollmentData();
  }, []);

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all courses
      const coursesRes = await coursesApi.getAllCourses();
      if (coursesRes.error) {
        setError(`Failed to fetch courses: ${coursesRes.error}`);
        return;
      }
      
      // Access the results array from the response
      const courses = coursesRes.data?.results || [];
      
      if (courses.length === 0) {
        setError('No courses found');
        return;
      }
  
      // Fetch enrollment count for each course
      const enrollmentPromises = courses.map(async (course) => {
        try {
          const enrollmentRes = await coursesApi.getCourseEnrollments(course.id);
          if (enrollmentRes.error) {
            console.error(`Error fetching enrollments for course ${course.id}:`, enrollmentRes.error);
            return {
              course_id: course.id,
              course_title: course.title,
              enrollment_count: 0,
              status: course.status,
              created_at: course.created_at,
            };
          }
          return {
            course_id: course.id,
            course_title: course.title,
            enrollment_count: enrollmentRes.data?.enrollment_count || 0,
            status: course.status,
            created_at: course.created_at,
          };
        } catch (err) {
          console.error(`Error processing course ${course.id}:`, err);
          return {
            course_id: course.id,
            course_title: course.title,
            enrollment_count: 0,
            status: course.status,
            created_at: course.created_at,
          };
        }
      });
  
      const enrollmentData = await Promise.all(enrollmentPromises);
      setEnrollments(enrollmentData);
    } catch (err) {
      console.error('Failed to fetch enrollment data:', err);
      setError(`Failed to load enrollment data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate enrollment distribution by status
  const getEnrollmentDistribution = () => {
    const distribution: Record<string, number> = {};
    
    enrollments.forEach(course => {
      if (!distribution[course.status]) {
        distribution[course.status] = 0;
      }
      distribution[course.status] += course.enrollment_count;
    });
    
    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: (count / totalEnrollments * 100).toFixed(1)
    }));
  };

  const handleSort = (key: keyof CourseEnrollment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PUBLISHED: 'success',
      DRAFT: 'secondary',
      PENDING_REVIEW: 'warning',
      ARCHIVED: 'danger',
    };
    return <Badge bg={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const sortedData = [...enrollments].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredData = sortedData.filter((course) =>
    course.course_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total enrollments across all courses
  const totalEnrollments = enrollments.reduce((sum, course) => sum + course.enrollment_count, 0);
  
  // Get enrollment distribution data
  const enrollmentDistribution = getEnrollmentDistribution();

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderSortIcon = (key: keyof CourseEnrollment) => {
    if (sortConfig.key !== key) return <FaSort className="ms-1" />;
    return sortConfig.direction === 'asc' ? (
      <FaSortUp className="ms-1" />
    ) : (
      <FaSortDown className="ms-1" />
    );
  };

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip p-2" style={{ backgroundColor: 'white', border: '1px solid #ccc' }}>
          <p className="label">{`${payload[0].payload.status.replace('_', ' ')}`}</p>
          <p className="intro">{`Enrollments: ${payload[0].value}`}</p>
          <p className="intro">{`Percentage: ${payload[0].payload.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h4 mb-0">Course Enrollment Statistics</h1>
            <p className="text-muted mb-0">View and analyze course enrollment data</p>
          </div>
          <Button variant="danger" onClick={fetchEnrollmentData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card className="mb-4">
          <Card.Body>
            <div className="row">
              <div className="col-md-6">
                <Form.Group controlId="search">
                  <Form.Label>Search Courses</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      placeholder="Search by course name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline-secondary">
                      <FaSearch />
                    </Button>
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-end align-items-end h-100">
                  <Badge bg="light" text="dark" className="fs-6">
                    Total Courses: {enrollments.length}
                  </Badge>
                  <Badge bg="info" text="dark" className="fs-6 ms-2">
                    Total Enrollments: {totalEnrollments}
                  </Badge>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table striped hover className="mb-0">
                    <thead>
                      <tr>
                        <th 
                          className="cursor-pointer"
                          onClick={() => handleSort('course_title')}
                        >
                          Course Title {renderSortIcon('course_title')}
                        </th>
                        <th 
                          className="cursor-pointer text-center"
                          onClick={() => handleSort('enrollment_count')}
                        >
                          Enrollments {renderSortIcon('enrollment_count')}
                        </th>
                        <th 
                          className="cursor-pointer text-center"
                          onClick={() => handleSort('status')}
                        >
                          Status {renderSortIcon('status')}
                        </th>
                        <th 
                          className="cursor-pointer text-end"
                          onClick={() => handleSort('created_at')}
                        >
                          Created {renderSortIcon('created_at')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((course) => (
                          <tr key={course.course_id}>
                            <td>
                              <strong>{course.course_title}</strong>
                              <div className="text-muted small">ID: {course.course_id}</div>
                            </td>
                            <td className="text-center">
                              <Badge bg="info" pill className="fs-6">
                                {course.enrollment_count}
                              </Badge>
                            </td>
                            <td className="text-center">
                              {getStatusBadge(course.status)}
                            </td>
                            <td className="text-end">
                              {new Date(course.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            {searchTerm ? 'No matching courses found' : 'No enrollment data available'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.Prev 
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Pagination.Item
                          key={i + 1}
                          active={i + 1 === currentPage}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>

        <div className="row mt-4">
          <div className="col-md-6">
            <Card>
              <Card.Header>
                <Card.Title>Top Courses by Enrollment</Card.Title>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {filteredData
                      .sort((a, b) => b.enrollment_count - a.enrollment_count)
                      .slice(0, 5)
                      .map((course, index) => (
                        <div key={course.course_id} className="mb-3">
                          <div className="d-flex justify-content-between">
                            <div>
                              <strong>{index + 1}. {course.course_title}</strong>
                            </div>
                            <Badge bg="danger">{course.enrollment_count} enrollments</Badge>
                          </div>
                          <div className="progress mt-2" style={{ height: '8px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${(course.enrollment_count / Math.max(...filteredData.map(c => c.enrollment_count)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-6">
            <Card>
              <Card.Header>
                <Card.Title>Enrollment Distribution by Status</Card.Title>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    {enrollmentDistribution.length > 0 ? (
                      <div className="d-flex flex-column align-items-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={enrollmentDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="status"
                              label={({ status, percentage }) => `${status}: ${percentage}%`}
                            >
                              {enrollmentDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        <div className="mt-3 w-100">
                          <h6 className="text-center mb-3">Enrollment Breakdown</h6>
                          {enrollmentDistribution.map((item, index) => (
                            <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                              <div className="d-flex align-items-center">
                                <div 
                                  className="color-indicator me-2" 
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: STATUS_COLORS[item.status] || '#8884d8',
                                    borderRadius: '2px'
                                  }}
                                />
                                <span>{item.status.replace('_', ' ')}</span>
                              </div>
                              <div>
                                <strong>{item.count}</strong> 
                                <small className="text-muted ms-1">({item.percentage}%)</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">No enrollment data available for chart</p>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}