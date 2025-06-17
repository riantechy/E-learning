'use client'

import { Button, Card, Form, Row, Col, Alert } from 'react-bootstrap';
import { analyticsApi } from '@/lib/api';
import { useState } from 'react';

export default function ExportSection({
  reportType,
  setReportType,
  timeRange,
  setTimeRange,
  exportFormat,
  setExportFormat
}: {
  reportType: string;
  setReportType: (type: string) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  exportFormat: string;
  setExportFormat: (format: string) => void;
}) {
  const [error, setError] = useState('');

  const handleExport = async () => {
    try {
      const response = await analyticsApi.exportReport(reportType, timeRange, exportFormat);
      if (response.error) throw new Error(response.error);
      
      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  };

  return (
    <Card className="mt-4">
      <Card.Body>
        <Card.Title>Export Analytics Report</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        <Row>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Report Type</Form.Label>
              <Form.Select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="user_activity">User Activity</option>
                <option value="course_progress">Course Progress</option>
                <option value="enrollment_stats">Enrollment Stats</option>
                <option value="completion_rates">Completion Rates</option>
                <option value="quiz_performance">Quiz Performance</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Time Range</Form.Label>
              <Form.Select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Format</Form.Label>
              <Form.Select 
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3} className="d-flex align-items-end">
            <Button variant="primary" onClick={handleExport}>
              Export Report
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}