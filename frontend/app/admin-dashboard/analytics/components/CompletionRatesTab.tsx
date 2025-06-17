'use client'

import { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '@/lib/api';

export default function CompletionRatesTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completionData, setCompletionData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await analyticsApi.getCompletionRates();
        if (response.error) throw new Error(response.error);
        setCompletionData(response.data);
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
      <h5 className="mb-4">Course Completion Rates</h5>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : completionData ? (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Overall Completion Rate</Card.Title>
                  <Card.Text className="display-6">
                    {completionData.overall_completion_rate || 0}%
                  </Card.Text>
                  <div>
                    <small>
                      {completionData.completed_enrollments || 0} of {completionData.total_enrollments || 0} enrollments
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card>
                <Card.Body>
                  <Card.Title>Course Completion Rates</Card.Title>
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={completionData.completion_data || []}
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="course_title" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completion_rate" fill="#8884d8" name="Completion Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
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