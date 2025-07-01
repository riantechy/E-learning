// QuizSection.tsx
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { useRouter } from 'next/navigation';

interface QuizSectionProps {
  lesson: any;
  onEdit: (item: any, type: 'lesson' | 'section' | 'quiz') => void;
  onDelete: (type: 'lesson' | 'section' | 'quiz', id: string, lessonId?: string) => void;
  onManageQuestions: (lessonId: string) => void;
}

const QuizSection = ({ lesson, onEdit, onDelete, onManageQuestions }: QuizSectionProps) => {
  return (
    <div className="quiz-section mt-3">
      <div className="d-flex justify-content-between align-items-center">
        <h4 className="h6 mb-0">
          Quiz
          <Badge bg="warning" className="ms-2">
            Assessment
          </Badge>
        </h4>
        <div>
          <Button
            variant="info"
            size="sm"
            className="me-2"
            onClick={() => onManageQuestions(lesson.id)}
          >
            Manage Questions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizSection;