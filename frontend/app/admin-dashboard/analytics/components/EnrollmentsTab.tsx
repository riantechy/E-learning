'use client'

import { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '@/lib/api';
import Link from 'next/link';

export default function EnrollmentsTab({ timeRange }: { timeRange: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentData, setEnrollmentData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await analyticsApi.getEnrollmentStats(timeRange === 'custom' ? 'monthly' : timeRange);
        if (response.error) throw new Error(response.error);
        setEnrollmentData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return (
    <div>
      <h5 className="mb-4">Enrollment Analytics</h5>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : enrollmentData ? (
        <>
          <Row className="mb-4">
            <Col md={8}>
              <Card>
                <Card.Body>
                  <Card.Title>Enrollment Trends</Card.Title>
                  <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={enrollmentData.enrollment_trend || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month'} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name="Enrollments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Total Enrollments</Card.Title>
                  <Card.Text className="display-6">
                    {enrollmentData.total_enrollments || 0}
                  </Card.Text>
                </Card.Body>
              </Card>

              <Card className="mt-4">
                <Card.Body>
                  <Card.Title>Top Courses</Card.Title>
                  <div className="list-group">
                    {(enrollmentData.top_courses || []).map((course: any) => (
                      <Link 
                        key={course.course_id}
                        href={`/admin-dashboard/courses/${course.course_id}`}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      >
                        {course.title}
                        <span className="badge bg-danger rounded-pill">
                          {course.enrollment_count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  );
}