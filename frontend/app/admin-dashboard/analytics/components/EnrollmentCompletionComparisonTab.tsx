// components/EnrollmentCompletionComparisonTab.tsx
'use client'

import { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Row, Col, Form } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { analyticsApi, coursesApi } from '@/lib/api';

export default function EnrollmentCompletionComparisonTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('monthly');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchComparisonData();
  }, [timeRange, selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await coursesApi.getAllCourses();
      if (response.error) throw new Error(response.error);
      setCourses(response.data?.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    }
  };

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch enrollment data
      const enrollmentResponse = await analyticsApi.getEnrollmentStats(timeRange);
      if (enrollmentResponse.error) throw new Error(enrollmentResponse.error);

      // Fetch completion data
      const completionResponse = await analyticsApi.getCompletionRates();
      if (completionResponse.error) throw new Error(completionResponse.error);

      // Process data for comparison
      let processedData: any[] = [];

      if (selectedCourse === 'all') {
        // Aggregate data for all courses
        processedData = processAllCoursesData(enrollmentResponse.data, completionResponse.data);
      } else {
        // Data for specific course
        processedData = processSingleCourseData(enrollmentResponse.data, completionResponse.data, selectedCourse);
      }

      setComparisonData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const processAllCoursesData = (enrollmentData: any, completionData: any) => {
    const enrollmentTrend = enrollmentData.enrollment_trend || [];
    const completionRates = completionData.completion_rates || [];

    // Create a map of course completion rates by course ID
    const completionMap = new Map();
    completionRates.forEach((course: any) => {
      completionMap.set(course.course_id, course.completion_rate);
    });

    // Aggregate enrollment data by time period
    const timePeriodMap = new Map();
    
    enrollmentTrend.forEach((item: any) => {
      const key = item.month || item.week || item.date;
      if (!timePeriodMap.has(key)) {
        timePeriodMap.set(key, {
          period: key,
          totalEnrollments: 0,
          averageCompletionRate: 0,
          courseCount: 0
        });
      }
      
      const periodData = timePeriodMap.get(key);
      periodData.totalEnrollments += item.count;
    });

    // Calculate average completion rate for each period
    completionRates.forEach((course: any) => {
      // For all courses view, we'll use the overall average
      // This is a simplified approach - you might want to refine this
      timePeriodMap.forEach((periodData) => {
        periodData.averageCompletionRate = completionData.overall_completion_rate || 0;
      });
    });

    return Array.from(timePeriodMap.values());
  };

  const processSingleCourseData = (enrollmentData: any, completionData: any, courseId: string) => {
    const enrollmentTrend = enrollmentData.enrollment_trend || [];
    const completionRates = completionData.completion_rates || [];

    // Find the specific course completion data
    const courseCompletion = completionRates.find((course: any) => course.course_id === courseId);
    const completionRate = courseCompletion ? courseCompletion.completion_rate : 0;

    // Filter enrollment data for the specific course (this would need backend support)
    // For now, we'll use the overall enrollment trend and show completion rate as constant
    return enrollmentTrend.map((item: any) => ({
      period: item.month || item.week || item.date,
      enrollments: item.count,
      completionRate: completionRate
    }));
  };

  return (
    <div>
      <h5 className="mb-4">Enrollment vs Completion Comparison</h5>

      {/* Controls */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Time Range</Form.Label>
            <Form.Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Course</Form.Label>
            <Form.Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : comparisonData.length > 0 ? (
        <>
          {/* Side-by-side charts */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Enrollment Trends</Card.Title>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={selectedCourse === 'all' ? 'totalEnrollments' : 'enrollments'} 
                             fill="#8884d8" name="Enrollments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Completion Rates</Card.Title>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey={selectedCourse === 'all' ? 'averageCompletionRate' : 'completionRate'} 
                          stroke="#82ca9d" 
                          name="Completion Rate (%)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Combined chart */}
          <Row>
            <Col md={12}>
              <Card>
                <Card.Body>
                  <Card.Title>Enrollment vs Completion Rate</Card.Title>
                  <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey={selectedCourse === 'all' ? 'totalEnrollments' : 'enrollments'} 
                          fill="#8884d8" 
                          name="Enrollments" 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey={selectedCourse === 'all' ? 'averageCompletionRate' : 'completionRate'} 
                          stroke="#82ca9d" 
                          name="Completion Rate (%)"
                          strokeWidth={2}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Summary statistics */}
          <Row className="mt-4">
            <Col md={3}>
              <Card>
                <Card.Body className="text-center">
                  <Card.Title>Total Enrollments</Card.Title>
                  <Card.Text className="h3 text-primary">
                    {comparisonData.reduce((sum, item) => sum + (selectedCourse === 'all' ? item.totalEnrollments : item.enrollments), 0)}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card>
                <Card.Body className="text-center">
                  <Card.Title>Avg Completion Rate</Card.Title>
                  <Card.Text className="h3 text-success">
                    {Math.round(comparisonData.reduce((sum, item) => sum + (selectedCourse === 'all' ? item.averageCompletionRate : item.completionRate), 0) / comparisonData.length)}%
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card>
                <Card.Body className="text-center">
                  <Card.Title>Time Periods</Card.Title>
                  <Card.Text className="h3 text-info">
                    {comparisonData.length}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card>
                <Card.Body className="text-center">
                  <Card.Title>Analysis</Card.Title>
                  <Card.Text className="h6">
                    {selectedCourse === 'all' ? 'All Courses' : courses.find(c => c.id === selectedCourse)?.title}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Alert variant="info">No data available for the selected criteria</Alert>
      )}
    </div>
  );
}