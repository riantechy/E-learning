// app/admin-dashboard/courses/[courseId]/modules/[moduleId]/lessons/components/LessonCard.tsx
import { useState } from 'react';
import { Lesson } from '@/lib/api';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import ContentTypeBadge from './ContentTypeBadge';
import SectionItem from './SectionItem';

interface LessonCardProps {
  lesson: Lesson;
  onEdit: (item: any, type: 'lesson' | 'section' | 'quiz') => void;
  onDelete: (type: 'lesson' | 'section' | 'quiz', id: string, lessonId?: string) => void;
  onManageQuestions: (lessonId: string) => void;
}

const LessonCard = ({ lesson, onEdit, onDelete, onManageQuestions }: LessonCardProps) => {
  const [showAddSection, setShowAddSection] = useState(false);

  return (
    <div className="lesson-card mb-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">
            {lesson.title}
            <Badge bg="info" className="ms-2">
              {lesson.duration_minutes} min
            </Badge>
            <ContentTypeBadge type={lesson.content_type} />
          </h3>
          <div>
            <Button
              variant="info"
              size="sm"
              className="me-2"
              onClick={() => onEdit(lesson, 'lesson')}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="me-2"
              onClick={() => onDelete('lesson', lesson.id)}
            >
              Delete
            </Button>
            {/* <Button
              variant="success"
              size="sm"
              className="me-2"
              onClick={() => setShowAddSection(!showAddSection)}
            >
              {showAddSection ? 'Cancel' : 'Add Section'}
            </Button> */}
            {lesson.content_type === 'QUIZ' && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => onManageQuestions(lesson.id)}
              >
                Manage Questions
              </Button>
            )}
          </div>
        </div>
        <div className="card-body">
          {lesson.description && <p className="card-text">{lesson.description}</p>}
          
          {showAddSection && (
            <div className="add-section-form mb-4 p-3 border rounded">
              <h5 className="mb-3">Add New Section</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEdit({ lesson: { id: lesson.id }, is_subsection: false }, 'section')}
              >
                Add Main Section
              </Button>
            </div>
          )}
          
          {lesson.sections.length > 0 && (
            <div className="sections-list mt-3">
              <h4 className="h6 mb-3">Sections:</h4>
              <div className="list-group">
                {lesson.sections
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((section: any) => (
                    <SectionItem 
                      key={section.id} 
                      section={section} 
                      lessonId={lesson.id}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonCard;