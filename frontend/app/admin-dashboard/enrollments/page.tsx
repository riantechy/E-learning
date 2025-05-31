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

interface CourseEnrollment {
  course_id: string;
  course_title: string;
  enrollment_count: number;
  status: string;
  created_at: string;
}

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
      const coursesRes = await coursesApi.getAllCourses();
      
      if (coursesRes.error) {
        setError(coursesRes.error);
        return;
      }

      // Fetch enrollment count for each course
      const enrollmentPromises = coursesRes.data?.map(async (course) => {
        const enrollmentRes = await coursesApi.getCourseEnrollments(course.id);
        return {
          course_id: course.id,
          course_title: course.title,
          enrollment_count: enrollmentRes.data?.enrollment_count || 0,
          status: course.status,
          created_at: course.created_at,
        };
      }) || [];

      const enrollmentData = await Promise.all(enrollmentPromises);
      setEnrollments(enrollmentData);
    } catch (err) {
      setError('An error occurred while fetching enrollment data');
    } finally {
      setLoading(false);
    }
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

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h2 mb-0">Course Enrollment Statistics</h1>
            <p className="text-muted mb-0">View and analyze course enrollment data</p>
          </div>
          <Button variant="primary" onClick={fetchEnrollmentData} disabled={loading}>
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
                            <Badge bg="primary">{course.enrollment_count} enrollments</Badge>
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
                <Card.Title>Enrollment Distribution</Card.Title>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">Enrollment distribution chart would appear here</p>
                    <small className="text-muted">
                      (Would show pie chart of enrollments by course status in a real implementation)
                    </small>
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