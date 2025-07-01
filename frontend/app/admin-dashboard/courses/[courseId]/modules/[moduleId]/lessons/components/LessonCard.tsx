import { useState } from 'react';
import { Lesson } from '@/types';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import SectionItem from './SectionItem';
import QuizSection from './QuizSection';
import ContentTypeBadge from './ContentTypeBadge';
import QuestionsManager from './QuestionsManager';

// LessonCard.tsx
interface LessonCardProps {
  lesson: Lesson;
  onEdit: (type: 'lesson' | 'section' | 'quiz', item: any) => void;
  onDelete: (type: 'lesson' | 'section' | 'quiz', id: string, lessonId?: string) => void;
  onManageQuestions: (lessonId: string) => void;
}

const LessonCard = ({ lesson, onEdit, onDelete, onManageQuestions }: LessonCardProps) => {
  return (
    <div className="lesson-card mb-3">
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
            <Button
              variant="secondary"
              size="sm"
              className="me-2"
              onClick={() => onEdit({ lesson: { id: lesson.id }, is_subsection: false}, 'section')}
            >
              Add Section
            </Button>
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
          
          {lesson.sections.length > 0 && (
            <div className="sections-list mt-3">
              <h4 className="h6 mb-3">Sections:</h4>
              <ul className="list-group">
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
              </ul>
            </div>
          )}

          {/* {lesson.hasQuiz && (
            <QuizSection 
              lesson={lesson}
              onEdit={onEdit}
              onDelete={onDelete}
              onManageQuestions={onManageQuestions}
            />
          )} */}
          {/* {showQuestionsManager && (
            <QuestionsManager
              show={showQuestionsManager}
              onHide={() => setShowQuestionsManager(false)}
              lessonId={lesson.id}
              courseId={lesson.module.course}
              moduleId={lesson.module.id}
            />
          )} */}
        </div>
      </div>
    </div>
  );
};
export default LessonCard;