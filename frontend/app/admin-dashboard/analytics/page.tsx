// app/admin-dashboard/analytics/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import { Tab, Tabs } from 'react-bootstrap';
import UserActivityTab from './components/UserActivityTab';
import CourseProgressTab from './components/CourseProgressTab';
import EnrollmentsTab from './components/EnrollmentsTab';
import CompletionRatesTab from './components/CompletionRatesTab';
import QuizPerformanceTab from './components/QuizPerformanceTab';
import ModuleCoverageTab from './components/ModuleCoverageTab';
import ExportSection from './components/ExportSection';
import EnrollmentCompletionComparisonTab from './components/EnrollmentCompletionComparisonTab';

// Component to handle useSearchParams
function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'user-activity');

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    router.push(`/admin-dashboard/analytics?tab=${tab}`);
  };

  return (
    <Tabs
      activeKey={activeTab}
      onSelect={(k) => handleTabSelect(k as string)}
      className="mb-4"
    >
      {/* <Tab eventKey="user-activity" title="User Activity">
        <UserActivityTab timeRange="7d" setTimeRange={() => {}} />
      </Tab> */}
      <Tab eventKey="course-progress" title="Course Progress">
        <CourseProgressTab />
      </Tab>
      <Tab eventKey="module-coverage" title="Module Coverage">
        <ModuleCoverageTab />
      </Tab>
      <Tab eventKey="enrollments" title="Enrollments">
        <EnrollmentsTab timeRange="7d" />
      </Tab>
      <Tab eventKey="completion-rates" title="Completion Rates">
        <CompletionRatesTab />
      </Tab>
      <Tab eventKey="enrollment-completion-comparison" title="Enrollment vs Completion">
        <EnrollmentCompletionComparisonTab />
      </Tab>
      <Tab eventKey="quiz-performance" title="Quiz Performance">
        <QuizPerformanceTab />
      </Tab>
    </Tabs>
  );
}

// Main Analytics Dashboard Component
export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [reportType, setReportType] = useState('user_activity');
  const [exportFormat, setExportFormat] = useState('csv');

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <h1 className="h4 mb-0">Learning Analytics Dashboard</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <AnalyticsContent />
        </Suspense>
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