'use client'

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import { Tab, Tabs } from 'react-bootstrap';
import UserActivityTab from './components/UserActivityTab';
import CourseProgressTab from './components/CourseProgressTab';
import EnrollmentsTab from './components/EnrollmentsTab';
import CompletionRatesTab from './components/CompletionRatesTab';
import QuizPerformanceTab from './components/QuizPerformanceTab';
import ExportSection from './components/ExportSection';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'user-activity');
  const [timeRange, setTimeRange] = useState('7d');
  const [reportType, setReportType] = useState('user_activity');
  const [exportFormat, setExportFormat] = useState('csv');

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    router.push(`/admin-dashboard/analytics?tab=${tab}`);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <h1 className="h2 mb-4">Learning Analytics Dashboard</h1>
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => handleTabSelect(k as string)}
          className="mb-4"
        >
          <Tab eventKey="user-activity" title="User Activity">
            <UserActivityTab 
              timeRange={timeRange} 
              setTimeRange={setTimeRange}
            />
          </Tab>
          <Tab eventKey="course-progress" title="Course Progress">
            <CourseProgressTab />
          </Tab>
          <Tab eventKey="enrollments" title="Enrollments">
            <EnrollmentsTab 
              timeRange={timeRange}
            />
          </Tab>
          <Tab eventKey="completion-rates" title="Completion Rates">
            <CompletionRatesTab />
          </Tab>
          <Tab eventKey="quiz-performance" title="Quiz Performance">
            <QuizPerformanceTab />
          </Tab>
        </Tabs>

        <ExportSection 
          reportType={reportType}
          setReportType={setReportType}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
        />
      </div>
    </DashboardLayout>
  );
}