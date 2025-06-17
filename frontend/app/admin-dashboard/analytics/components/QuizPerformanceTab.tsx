'use client'

import { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { analyticsApi } from '@/lib/api';

export default function QuizPerformanceTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizData, setQuizData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await analyticsApi.getQuizPerformance();
        if (response.error) throw new Error(response.error);
        setQuizData(response.data);
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
      <h5 className="mb-6">Quiz Performance Analytics</h5>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : quizData ? (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Average Score</Card.Title>
                  <Card.Text className="display-6">
                    {quizData.average_score?.toFixed(1) || 0}%
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Pass Rate</Card.Title>
                  <Card.Text className="display-6">
                    {quizData.pass_rate?.toFixed(1) || 0}%
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Total Attempts</Card.Title>
                  <Card.Text className="display-6">
                    {quizData.total_attempts || 0}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card>
                <Card.Body>
                  <Card.Title>Lesson Quiz Performance</Card.Title>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Lesson</th>
                          <th>Course</th>
                          <th>Avg Score</th>
                          <th>Pass Rate</th>
                          <th>Attempts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(quizData.lesson_stats || []).map((lesson: any) => (
                          <tr key={`${lesson.lesson__title}-${lesson.lesson__module__course__title}`}>
                            <td>{lesson.lesson__title}</td>
                            <td>{lesson.lesson__module__course__title}</td>
                            <td>{lesson.avg_score?.toFixed(1) || 0}%</td>
                            <td>{lesson.pass_rate?.toFixed(1) || 0}%</td>
                            <td>{lesson.attempt_count || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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