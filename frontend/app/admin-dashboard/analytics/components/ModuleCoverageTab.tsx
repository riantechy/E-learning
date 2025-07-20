// components/ModuleCoverageTab.tsx
'use client'

import { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Row, Col, Form, Table } from 'react-bootstrap';
import { analyticsApi, coursesApi } from '@/lib/api';
import Link from 'next/link';

export default function ModuleCoverageTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [moduleCoverage, setModuleCoverage] = useState<any>(null);

  // Fetch all courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.getAllCourses();
        if (response.error) throw new Error(response.error);
        
        // The response is already the array of courses, no need for .data.course_progress
        setCourses(response.data?.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch module coverage when course is selected
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchModuleCoverage = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await analyticsApi.getModuleCoverage(selectedCourse);
        if (response.error) throw new Error(response.error);
        setModuleCoverage(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch module coverage');
      } finally {
        setLoading(false);
      }
    };

    fetchModuleCoverage();
  }, [selectedCourse]);

  return (
    <div>
      <h5 className="mb-4">Module Coverage Analytics</h5>
      
      {/* Course selection dropdown */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Course</Form.Label>
            <Form.Select
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(e.target.value || null)}
              disabled={loading}
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} {course.status !== 'PUBLISHED' && '(Draft)'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {loading && selectedCourse ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : moduleCoverage ? (
        <>
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header>
                  <Card.Title>
                    Module Coverage for: {moduleCoverage.course_title}
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Learner</th>
                          {moduleCoverage.modules.map((module: string, index: number) => (
                            <th key={index}>{module}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {moduleCoverage.learners.map((learner: any) => (
                          <tr key={learner.user_id}>
                            <td>
                              <Link href={`/admin-dashboard/users/${learner.user_id}`}>
                                {learner.name}
                              </Link>
                            </td>
                            {learner.module_progress.map((progress: any, idx: number) => (
                              <td key={idx} className="text-center">
                                {progress.completed ? (
                                  <span className="text-success">✓</span>
                                ) : (
                                  <span className="text-secondary">✗</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Summary statistics */}
          <Row>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Total Learners</Card.Title>
                  <Card.Text className="display-6">
                    {moduleCoverage.learners.length}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Total Modules</Card.Title>
                  <Card.Text className="display-6">
                    {moduleCoverage.modules.length}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Average Completion</Card.Title>
                  <Card.Text className="display-6">
                    {moduleCoverage.learners.length > 0 
                      ? `${Math.round(
                          moduleCoverage.learners.reduce((total: number, learner: any) => {
                            return total + learner.module_progress.filter((p: any) => p.completed).length;
                          }, 0) / (moduleCoverage.learners.length * moduleCoverage.modules.length) * 100
                        )}%`
                      : '0%'}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Alert variant="info">
          {selectedCourse 
            ? 'No module coverage data available for this course'
            : 'Please select a course to view module coverage'}
        </Alert>
      )}
    </div>
  );
}