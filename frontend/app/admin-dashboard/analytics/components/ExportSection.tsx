'use client'

import { Button, Card, Form, Row, Col, Alert } from 'react-bootstrap';
import { analyticsApi } from '@/lib/api';
import { useState } from 'react';
import * as XLSX from 'xlsx';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Get the data based on report type
      let response;
      switch (reportType) {
        case 'user_activity':
          response = await analyticsApi.getUserActivity(timeRange);
          break;
        case 'course_progress':
          response = await analyticsApi.getCourseProgress();
          break;
        case 'enrollment_stats':
          response = await analyticsApi.getEnrollmentStats(timeRange);
          break;
        case 'completion_rates':
          response = await analyticsApi.getCompletionRates();
          break;
        case 'quiz_performance':
          response = await analyticsApi.getQuizPerformance();
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (response.error) throw new Error(response.error);
      
      // Transform data based on report type
      let dataToExport = [];
      let fileName = `${reportType}_report`;
      
      switch (reportType) {
        case 'user_activity':
          dataToExport = response.data?.activity_counts || [];
          break;
        case 'course_progress':
          dataToExport = response.data?.course_progress || [];
          break;
        case 'enrollment_stats':
          dataToExport = response.data?.enrollment_trend || [];
          break;
        case 'completion_rates':
          dataToExport = response.data?.completion_data || [];
          break;
        case 'quiz_performance':
          dataToExport = response.data?.lesson_stats || [];
          break;
      }

      if (exportFormat === 'csv') {
        exportToCSV(dataToExport, fileName);
      } else if (exportFormat === 'excel') {
        exportToExcel(dataToExport, fileName);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    // Convert array of objects to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => 
          JSON.stringify(row[fieldName], (key, value) => 
            value === null ? '' : value
          )
        ).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
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
            <Button 
              variant="danger" 
              onClick={handleExport}
              disabled={isLoading}
            >
              {isLoading ? 'Exporting...' : 'Export Report'}
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}