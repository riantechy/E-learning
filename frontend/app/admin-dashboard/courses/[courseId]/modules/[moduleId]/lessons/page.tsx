'use client'

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import { useLessonsManagement } from './hooks/useLessonsManagement';
import LessonCard from './components/LessonCard';
import LessonFormModal from './components/LessonForm';
import QuestionsManager from './components/QuestionsManager';

export default function LessonsPage() {
  const {
    course,
    module,
    lessons,
    loading,
    error,
    showModal,
    formData,
    itemType,
    currentItem,
    handleNewItem,
    handleEdit,
    handleDelete,
    setShowModal,
    handleSubmit,
    handleInputChange,
    getParentSections,
    onManageQuestions
  } = useLessonsManagement();
  
  const [showQuestionsManager, setShowQuestionsManager] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  const handleManageQuestions = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    setCurrentLesson(lesson);
    setShowQuestionsManager(true);
  };

  const handleCloseQuestionsManager = () => {
    setShowQuestionsManager(false);
    setCurrentLesson(null);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h2 mb-0">Course Content</h1>
            {course && module && (
              <p className="text-muted mb-0">
                Course: {course.title} → Module: {module.title}
              </p>
            )}
          </div>
          <Button variant="primary" onClick={() => handleNewItem('lesson')}>
            Add New Lesson
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <div className="course-outline">
            {lessons.map((lesson) => (
              <LessonCard 
                key={lesson.id} 
                lesson={lesson} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManageQuestions={handleManageQuestions}
              />
            ))}
          </div>
        )}

        <LessonFormModal
          show={showModal}
          onHide={() => setShowModal(false)}
          formData={formData}
          itemType={itemType}
          currentItem={currentItem}
          lessons={lessons}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          loading={loading}
          getParentSections={getParentSections}
        />

        {showQuestionsManager && currentLesson && (
          <QuestionsManager
            show={showQuestionsManager}
            onHide={handleCloseQuestionsManager}
            lessonId={currentLesson.id}
            courseId={course?.id || ''}
            moduleId={module?.id || ''}
          />
        )}
      </div>
    </DashboardLayout>
  );
}