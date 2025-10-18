import { useState, useEffect, useMemo } from 'react';
import { Card, Spinner, Alert, Row, Col, Form, Table, Pagination, Button, Dropdown } from 'react-bootstrap';
import { analyticsApi, coursesApi } from '@/lib/api';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function ModuleCoverageTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [moduleCoverage, setModuleCoverage] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  // Fetch all courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.getAllCourses();
        if (response.error) throw new Error(response.error);
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
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch module coverage');
      } finally {
        setLoading(false);
      }
    };

    fetchModuleCoverage();
  }, [selectedCourse]);

  // Download module coverage as Excel
  const downloadModuleCoverage = async (format: 'excel' | 'csv') => {
    if (!moduleCoverage) return;
    
    setExporting(true);
    try {
      const data = moduleCoverage.learners.map((learner: any) => {
        const row: any = {
          'Learner ID': learner.user_id,
          'Learner Name': learner.name,
        };
        
        // Add module completion status AND date completed for each module
        moduleCoverage.modules.forEach((module: string, index: number) => {
          const moduleProgress = learner.module_progress[index];
          const moduleId = moduleProgress?.module_id;
          
          // Find the module title from the modules array using the index
          const moduleTitle = moduleCoverage.modules[index];
          
          // Add status column
          row[`${moduleTitle} - Status`] = moduleProgress?.completed ? 'Completed' : 'Not Completed';
          
          // Add date completed column
          row[`${moduleTitle} - Date Completed`] = moduleProgress?.completed_at 
            ? new Date(moduleProgress.completed_at).toLocaleDateString() 
            : 'Not Completed';
        });
        
        return row;
      });

      if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Module Coverage');
        XLSX.writeFile(workbook, `module_coverage_${moduleCoverage.course_title}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        // CSV format
        const headers = Object.keys(data[0] || {});
        const csvContent = [
          headers.join(','),
          ...data.map((row: any) => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `module_coverage_${moduleCoverage.course_title}_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export module coverage');
    } finally {
      setExporting(false);
    }
  };

  // Download module statistics
  const downloadModuleStats = async (format: 'excel' | 'csv') => {
    if (!moduleCoverage) return;
    
    setExporting(true);
    try {
      const moduleStats = moduleCoverage.modules.map((module: string, index: number) => {
        const completedCount = moduleCoverage.learners.filter(
          (learner: any) => learner.module_progress[index].completed
        ).length;
        const totalLearners = moduleCoverage.learners.length;
        const percentage = Math.round((completedCount / totalLearners) * 100);
        
        return {
          'Module Name': module,
          'Completed Learners': completedCount,
          'Total Learners': totalLearners,
          'Completion Rate (%)': percentage
        };
      });

      if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(moduleStats);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Module Statistics');
        XLSX.writeFile(workbook, `module_stats_${moduleCoverage.course_title}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        const headers = Object.keys(moduleStats[0] || {});
        const csvContent = [
          headers.join(','),
          ...moduleStats.map((row: any) => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `module_stats_${moduleCoverage.course_title}_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export module statistics');
    } finally {
      setExporting(false);
    }
  };

  // Filtered learners based on search query
  const filteredLearners = useMemo(() => {
    if (!moduleCoverage || !moduleCoverage.learners) return [];
    if (!searchQuery) return moduleCoverage.learners;
    const lowerQuery = searchQuery.toLowerCase();
    return moduleCoverage.learners.filter((learner: any) =>
      learner.name.toLowerCase().includes(lowerQuery)
    );
  }, [moduleCoverage, searchQuery]);

  // Calculate paginated data from filtered learners
  const paginatedLearners = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredLearners.slice(startIndex, endIndex);
  }, [filteredLearners, currentPage, pageSize]);

  // Calculate total pages from filtered learners
  const totalPages = useMemo(() => {
    return Math.ceil(filteredLearners.length / pageSize);
  }, [filteredLearners, pageSize]);

  // Calculate per-module statistics (using full dataset, not filtered)
  const moduleStats = useMemo(() => {
    if (!moduleCoverage || !moduleCoverage.learners.length) return [];
    const totalLearners = moduleCoverage.learners.length;
    return moduleCoverage.modules.map((module: string, index: number) => {
      const completedCount = moduleCoverage.learners.filter(
        (learner: any) => learner.module_progress[index].completed
      ).length;
      const percentage = Math.round((completedCount / totalLearners) * 100);
      return {
        module,
        completedCount,
        totalLearners,
        percentage,
      };
    });
  }, [moduleCoverage]);

  // Pagination controls
  const renderPagination = () => {
    const items = [];
    const maxPagesToShow = 5; // Show 5 page numbers at a time
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="btn-danger"
      />
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
          className={i === currentPage ? "btn-danger" : "btn-outline-danger"}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="btn-danger"
      />
    );

    return <Pagination className="justify-content-center mt-3">{items}</Pagination>;
  };

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

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
        <Col md={6} className="d-flex align-items-end">
          {moduleCoverage && (
            <Dropdown>
              <Dropdown.Toggle variant="danger" disabled={exporting}>
                {exporting ? 'Exporting...' : 'Download Reports'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Header>Module Coverage</Dropdown.Header>
                <Dropdown.Item onClick={() => downloadModuleCoverage('excel')}>
                  Download Coverage (Excel)
                </Dropdown.Item>
                <Dropdown.Item onClick={() => downloadModuleCoverage('csv')}>
                  Download Coverage (CSV)
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Header>Module Statistics</Dropdown.Header>
                <Dropdown.Item onClick={() => downloadModuleStats('excel')}>
                  Download Statistics (Excel)
                </Dropdown.Item>
                <Dropdown.Item onClick={() => downloadModuleStats('csv')}>
                  Download Statistics (CSV)
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Col>
      </Row>

      {loading && selectedCourse ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
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
                  {/* Search input */}
                  <Form.Group className="mb-3">
                    <Form.Label>Search Learners</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by learner name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to page 1 on search
                      }}
                    />
                  </Form.Group>

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
                        {paginatedLearners.map((learner: any) => (
                          <tr key={learner.user_id}>
                            <td>
                              {/* <Link href={`/admin-dashboard/users/${learner.user_id}`}>
                                {learner.name}
                              </Link> */}
                              <span>{learner.name}</span>
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
                  {totalPages > 1 && renderPagination()}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Per-module statistics */}
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header>
                  <Card.Title>Per-Module Coverage Statistics</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Module</th>
                          <th>Completed By</th>
                          <th>Total Learners</th>
                          <th>Completion Rate (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moduleStats.map((stat: any, index: number) => (
                          <tr key={index}>
                            <td>{stat.module}</td>
                            <td>{stat.completedCount}</td>
                            <td>{stat.totalLearners}</td>
                            <td>{stat.percentage}%</td>
                          </tr>
                        ))}
                        {moduleStats.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center">
                              No module data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Summary statistics (based on full data) */}
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
                          moduleCoverage.learners.reduce(
                            (total: number, learner: any) =>
                              total + learner.module_progress.filter((p: any) => p.completed).length,
                            0
                          ) /
                          (moduleCoverage.learners.length * moduleCoverage.modules.length) *
                          100
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