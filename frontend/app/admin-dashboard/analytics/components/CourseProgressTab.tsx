'use client'

import { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '@/lib/api';
import Link from 'next/link';

export default function CourseProgressTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseProgressData, setCourseProgressData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await analyticsApi.getCourseProgress();
        if (response.error) throw new Error(response.error);
        setCourseProgressData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h5 className="mb-4">Course Progress Analytics</h5>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : courseProgressData ? (
        <>
          {Array.isArray(courseProgressData.course_progress) ? (
            <>
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Body>
                      <Card.Title>Course Progress Overview</Card.Title>
                      <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={courseProgressData.course_progress}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="course_title" type="category" width={150} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="average_progress" fill="#8884d8" name="Avg Progress (%)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                {courseProgressData.course_progress.map((course: any) => (
                  <Col md={4} key={course.course_id} className="mb-3">
                    <Card>
                      <Card.Body>
                        <Card.Title>
                          <Link href={`/admin-dashboard/courses/${course.course_id}`}>
                            {course.course_title}
                          </Link>
                        </Card.Title>
                        <div className="mb-2">
                          <strong>Enrollments:</strong> {course.total_enrollments}
                        </div>
                        <div className="progress">
                          <div 
                            className="progress-bar" 
                            role="progressbar" 
                            style={{ width: `${course.average_progress}%` }}
                            aria-valuenow={course.average_progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            {course.average_progress}%
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <Card>
              <Card.Body>
                <Card.Title>{courseProgressData.course_title}</Card.Title>
                <div className="mb-3">
                  <strong>Total Enrollments:</strong> {courseProgressData.total_enrollments}
                </div>
                <div className="mb-3">
                  <strong>Average Progress:</strong> {courseProgressData.average_progress}%
                </div>
                
                {courseProgressData.progress_data && (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Progress</th>
                          <th>Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseProgressData.progress_data.map((progress: any) => (
                          <tr key={progress.user_id}>
                            <td>{progress.user_email}</td>
                            <td>
                              <div className="progress" style={{ height: '20px' }}>
                                <div 
                                  className="progress-bar" 
                                  role="progressbar" 
                                  style={{ width: `${progress.progress}%` }}
                                  aria-valuenow={progress.progress}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                >
                                  {progress.progress}%
                                </div>
                              </div>
                            </td>
                            <td>{progress.completed_lessons}/{progress.total_lessons}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}